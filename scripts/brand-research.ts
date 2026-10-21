/**
 * Live brand-availability research harness.
 *
 * Run:  npx tsx scripts/brand-research.ts
 *
 * Reads  brand-research/shortlist-100.csv
 * Writes brand-research/raw-research.json     - full evidence, timestamped
 *        brand-research/domain-matrix.csv     - one row per candidate x TLD
 *        brand-research/candidates.csv        - researched candidate table
 *        brand-research/recommended-names.json - structured export for the team
 *
 * Scope and honesty rules baked in below:
 *   - Every check records the source used, its raw result and the time it ran.
 *   - A 404 from an authoritative RDAP service means "no registration object
 *     exists right now" - it is NOT a guarantee of availability, so the status is
 *     reported as "available (unregistered per RDAP)" and premium/reserved names
 *     are flagged separately in the report.
 *   - Any check that could not be completed is recorded as "Unverified" with the
 *     reason. It is never silently reported as available.
 *   - Nothing is purchased, registered, or written to any external service.
 *
 * This script is build-time only; vite bundles `src/` only, so it never ships.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT_DIR = join(ROOT, "brand-research");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CHECKED_AT = new Date().toISOString();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** TLDs required by the brief, in priority order. */
const TLDS = ["com", "in", "app", "net", "org", "games", "club", "io", "co"] as const;
type Tld = (typeof TLDS)[number];

/**
 * Authoritative RDAP service per TLD, resolved from the IANA RDAP bootstrap file
 * (https://data.iana.org/rdap/dns.json).
 *
 * Two deliberate decisions here:
 *
 *  1. `.io` and `.co` are ABSENT from the IANA bootstrap file. `.io` is served by
 *     the Identity Digital RDAP endpoint (verified against the positive control
 *     google.io). `.co` publishes no RDAP service at all - every candidate
 *     endpoint tried failed or returned a wrong answer for a domain known to
 *     exist - so `.co` is reported as Unverified rather than guessed at.
 *
 *  2. The public redirector `rdap.org` is NOT used, not even as a fallback. During
 *     this research it returned HTTP 404 for google.io, a domain that demonstrably
 *     exists, which would have produced false "available" verdicts. A registry
 *     endpoint that does not answer leaves a name Unverified; it never makes it
 *     look available.
 */
const RDAP_ENDPOINTS: Record<Tld, string[]> = {
  com: ["https://rdap.verisign.com/com/v1/domain/"],
  net: ["https://rdap.verisign.com/net/v1/domain/"],
  org: ["https://rdap.publicinterestregistry.org/rdap/domain/"],
  in: ["https://rdap.nixiregistry.in/rdap/domain/"],
  app: ["https://pubapi.registry.google/rdap/domain/"],
  games: ["https://rdap.identitydigital.services/rdap/domain/"],
  club: ["https://rdap.nic.club/domain/"],
  io: ["https://rdap.identitydigital.services/rdap/domain/"],
  co: [],
};

/**
 * Why a TLD cannot be verified, when no RDAP service is reachable.
 */
const TLD_UNAVAILABLE_REASON: Partial<Record<Tld, string>> = {
  co: "The .co registry publishes no RDAP service. Every candidate endpoint tested either failed to connect or returned a wrong answer for a domain known to exist, so .co status is Unverified.",
};

/**
 * Positive controls: a domain that definitely exists in each TLD. If the registry
 * endpoint cannot return HTTP 200 for its own control, the endpoint is treated as
 * broken and every candidate in that TLD is downgraded to Unverified. This is the
 * guard that prevents a rate-limited or hijacked endpoint from producing false
 * "available" results.
 */
const CONTROL_DOMAINS: Record<Tld, string> = {
  com: "google.com",
  net: "verisign.net",
  org: "google.org",
  in: "nixi.in",
  app: "cash.app",
  games: "nike.games",
  club: "chess.club",
  io: "google.io",
  co: "google.co",
};

/** Per-host pacing overrides (the .club registry rate-limits aggressively). */
const HOST_MIN_GAP_OVERRIDES: Record<string, number> = {
  "rdap.nic.club": 1200,
};

/** Official trademark databases, with a deep link for manual clearance work. */
const TRADEMARK_JURISDICTIONS = [
  {
    id: "IN",
    name: "India - IP India Trademark Public Search",
    manualUrl: (t: string) => `https://ipindiaonline.gov.in/tmrpublicsearch/frmmain.aspx`,
    probeUrl: "https://ipindiaonline.gov.in/tmrpublicsearch/frmmain.aspx",
    machineQueryable: false,
    blockingMechanism:
      "The public search is a stateful ASP.NET WebForms portal. Automated requests returned HTTP 500 and the portal has no public search API.",
  },
  {
    id: "WIPO",
    name: "WIPO Global Brand Database",
    manualUrl: (t: string) => `https://branddb.wipo.int/branddb/en/?q=${encodeURIComponent(t)}`,
    probeUrl: "https://branddb.wipo.int/branddb/en/api/search?q=chess",
    machineQueryable: false,
    blockingMechanism:
      "Every path on the host returns an Altcha proof-of-work bot-challenge shell instead of data. No public API without credentials.",
  },
  {
    id: "US",
    name: "USPTO Trademark Search",
    manualUrl: (t: string) => `https://tmsearch.uspto.gov/search/search-information?q=${encodeURIComponent(t)}`,
    probeUrl: "https://api.uspto.gov/api/v1/trademarks/search?q=chess",
    machineQueryable: false,
    blockingMechanism:
      "Legacy API paths return an S3 NoSuchKey error. The Open Data Portal API returns {\"message\":\"Missing Authentication Token\"} (HTTP 403) and TSDR returns HTTP 401 requiring a registered API key.",
  },
  {
    id: "UK",
    name: "UK IPO Trademark Search",
    manualUrl: (t: string) => `https://trademarks.ipo.gov.uk/ipo-tmtext?q=${encodeURIComponent(t)}`,
    probeUrl: "https://trademarks.ipo.gov.uk/ipo-tmtext?q=chess",
    machineQueryable: false,
    blockingMechanism:
      "Automated requests receive HTTP 403 served by a \"Service Captcha\" page. No public machine-readable search endpoint.",
  },
  {
    id: "EU",
    name: "EUIPO eSearch",
    manualUrl: (t: string) => `https://euipo.europa.eu/eSearch/#basic/${encodeURIComponent(t)}`,
    probeUrl: "https://euipo.europa.eu/copla/trademark/data?query=chess",
    machineQueryable: false,
    blockingMechanism:
      "The eSearch data endpoint returns HTTP 404 to unauthenticated automated requests; the UI is a client-side app with no public API.",
  },
] as const;

/** Nice classes relevant to this product, for manual clearance. */
const RELEVANT_NICE_CLASSES = [
  { class: 9, goods: "Downloadable software, mobile applications, electronic publications (recorded/downloadable)" },
  { class: 16, goods: "Printed matter, printed worksheets, teaching materials, books" },
  { class: 41, services: "Education, teaching, training, entertainment, online publishing, providing online non-downloadable games" },
  { class: 42, services: "Software as a service (SaaS), hosting online platforms, providing temporary use of online non-downloadable software" },
];

/** Coefficients for the domain score. They sum to the 20-point weight. */
const DOMAIN_WEIGHTS: Record<Tld, number> = {
  com: 6,
  in: 4,
  app: 2,
  io: 2,
  co: 2,
  net: 1,
  org: 1,
  club: 1,
  games: 1,
};

const CONCURRENCY = 5;
const HOST_MIN_GAP_MS = 350;

// ---------------------------------------------------------------------------
// HTTP helpers: per-host serialisation + minimum gap, timeout, one retry
// ---------------------------------------------------------------------------

const hostLast = new Map<string, number>();
const hostChain = new Map<string, Promise<void>>();

type FetchResult = {
  ok: boolean;
  status: number | null;
  body: string;
  contentType: string | null;
  error?: string;
};

async function rawFetch(url: string, init?: RequestInit): Promise<FetchResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "user-agent": UA, "accept-language": "en-US,en;q=0.9", ...(init?.headers ?? {}) },
        redirect: "follow",
        signal: AbortSignal.timeout(25_000),
      });
      const body = await res.text();
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return { ok: res.ok, status: res.status, body, contentType: res.headers.get("content-type") };
    } catch (e) {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      return { ok: false, status: null, body: "", contentType: null, error: (e as Error).message };
    }
  }
  return { ok: false, status: null, body: "", contentType: null, error: "unreachable" };
}

async function politeFetch(url: string, init?: RequestInit): Promise<FetchResult> {
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return { ok: false, status: null, body: "", contentType: null, error: "invalid-url" };
  }
  const minGap = HOST_MIN_GAP_OVERRIDES[host] ?? HOST_MIN_GAP_MS;
  const prev = hostChain.get(host) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => {
    release = r;
  });
  hostChain.set(
    host,
    prev.then(() => next),
  );
  await prev;
  const wait = (hostLast.get(host) ?? 0) + minGap - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  hostLast.set(host, Date.now());
  try {
    return await rawFetch(url, init);
  } finally {
    release();
  }
}

async function pool<T>(items: T[], worker: (item: T, index: number) => Promise<void>, limit: number): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

// ---------------------------------------------------------------------------
// Check 1: domain availability via RDAP
// ---------------------------------------------------------------------------

type DomainResult = {
  tld: Tld;
  fqdn: string;
  status: "available_unregistered" | "registered" | "unverified";
  httpStatus: number | null;
  endpoint: string;
  checkedAt: string;
  registrar?: string;
  createdAt?: string;
  expiresAt?: string;
  nameservers?: string[];
  eppStatus?: string[];
  note?: string;
};

/**
 * Registry health, established once per run from positive control domains. A TLD
 * whose control does not return HTTP 200 is untrustworthy for this run, so every
 * candidate in that TLD is reported Unverified instead of available.
 */
type RegistryHealth = {
  tld: Tld;
  controlDomain: string;
  endpoint: string | null;
  httpStatus: number | null;
  healthy: boolean;
  note: string;
};

const registryHealth = new Map<Tld, RegistryHealth>();

async function probeRegistries(): Promise<void> {
  console.log("Validating each registry against a positive control domain...");
  for (const tld of TLDS) {
    const endpoint = RDAP_ENDPOINTS[tld][0];
    if (!endpoint) {
      registryHealth.set(tld, {
        tld,
        controlDomain: CONTROL_DOMAINS[tld],
        endpoint: null,
        httpStatus: null,
        healthy: false,
        note: TLD_UNAVAILABLE_REASON[tld] ?? "No RDAP service published for this TLD.",
      });
      console.log(`  .${tld.padEnd(6)} no RDAP endpoint - will report Unverified`);
      continue;
    }
    const res = await politeFetch(endpoint + CONTROL_DOMAINS[tld], {
      headers: { accept: "application/rdap+json" },
    });
    // The control proves the endpoint is live and speaking RDAP if it either
    // returns a registration record (200) or an RDAP-formatted 404. Anything else
    // (WAF page, rate limit, empty 404, connection error) is untrustworthy.
    const speaksRdap = res.status === 200 || (res.status === 404 && isRdapErrorDocument(res));
    registryHealth.set(tld, {
      tld,
      controlDomain: CONTROL_DOMAINS[tld],
      endpoint,
      httpStatus: res.status,
      healthy: speaksRdap,
      note: speaksRdap
        ? `Control ${CONTROL_DOMAINS[tld]} confirmed this registry endpoint is live and returning RDAP documents (HTTP ${res.status}).`
        : `Control ${CONTROL_DOMAINS[tld]} returned HTTP ${res.status ?? res.error} without an RDAP document. Registry endpoint is not trustworthy for this run, so all .${tld} results are Unverified.`,
    });
    console.log(
      `  .${tld.padEnd(6)} control ${CONTROL_DOMAINS[tld].padEnd(14)} HTTP ${String(res.status ?? "ERR").padEnd(4)} rdap=${speaksRdap}`,
    );
  }
}

/**
 * A 404 only proves a name is unregistered if the answer is a genuine RDAP error
 * document. A WAF, captive portal or error page that happens to 404 must never be
 * mistaken for availability.
 */
function isRdapErrorDocument(res: FetchResult): boolean {
  if (res.contentType && /application\/rdap\+json|application\/json/i.test(res.contentType)) return true;
  return /"errorCode"\s*:\s*404|"title"\s*:\s*"Not Found"/i.test(res.body);
}

async function checkDomain(name: string, tld: Tld): Promise<DomainResult> {
  const fqdn = `${name}.${tld}`;
  const health = registryHealth.get(tld);
  const endpoint = RDAP_ENDPOINTS[tld][0];
  if (!endpoint || !health?.healthy) {
    return {
      tld,
      fqdn,
      status: "unverified",
      httpStatus: health?.httpStatus ?? null,
      endpoint: endpoint ? endpoint + fqdn : `no RDAP service published for .${tld}`,
      checkedAt: new Date().toISOString(),
      note:
        (health?.note ?? "Registry not verified.") +
        " This is NOT a finding that the domain is available.",
    };
  }
  const fullUrl = endpoint + fqdn;
  const res = await politeFetch(fullUrl, { headers: { accept: "application/rdap+json" } });
  if (res.status === 404 && isRdapErrorDocument(res)) {
    return {
      tld,
      fqdn,
      status: "available_unregistered",
      httpStatus: 404,
      endpoint: fullUrl,
      checkedAt: new Date().toISOString(),
      note: "Authoritative registry RDAP returned 404 in RDAP format: no registration object exists for this name at query time. Registry control passed. Not a guarantee of registrability - premium/reserved names may still be withheld by the registry.",
    };
  }
  if (res.status === 404) {
    return {
      tld,
      fqdn,
      status: "unverified",
      httpStatus: 404,
      endpoint: fullUrl,
      checkedAt: new Date().toISOString(),
      note: "Got HTTP 404 but the response was not an RDAP error document, so it cannot be read as availability. Not a finding that the domain is available.",
    };
  }
  if (res.status === 200) {
    let registrar: string | undefined;
    let createdAt: string | undefined;
    let expiresAt: string | undefined;
    let nameservers: string[] | undefined;
    let eppStatus: string[] | undefined;
    try {
      const j: any = JSON.parse(res.body);
      const registrarEntity = (j.entities ?? []).find((e: any) => (e.roles ?? []).includes("registrar"));
      registrar = registrarEntity?.vcardArray?.[1]?.find((x: any) => x[0] === "fn")?.[3];
      createdAt = (j.events ?? []).find((e: any) => e.eventAction === "registration")?.eventDate;
      expiresAt = (j.events ?? []).find((e: any) => e.eventAction === "expiration")?.eventDate;
      nameservers = (j.nameservers ?? []).map((n: any) => n.ldhName);
      eppStatus = j.status;
    } catch {
      /* keep the registered verdict even if the payload shape differs */
    }
    return {
      tld,
      fqdn,
      status: "registered",
      httpStatus: 200,
      endpoint: fullUrl,
      checkedAt: new Date().toISOString(),
      registrar,
      createdAt,
      expiresAt,
      nameservers,
      eppStatus,
    };
  }
  return {
    tld,
    fqdn,
    status: "unverified",
    httpStatus: res.status,
    endpoint: fullUrl,
    checkedAt: new Date().toISOString(),
    note: res.error
      ? `Request error: ${res.error}. Not a finding that the domain is available.`
      : `Registry returned HTTP ${res.status} (rate limit or WAF). Not a finding that the domain is available.`,
  };
}

// ---------------------------------------------------------------------------
// Check 2: web screening via Bing HTML search
// ---------------------------------------------------------------------------

type WebHit = { title: string; url: string };
type WebSearchResult = {
  query: string;
  url: string;
  /**
   * Judged on the EXACT name, not on whether the engine returned any markup.
   * A search engine answers a zero-match query with unrelated fallback results,
   * so "there is a result block" is not evidence of anything.
   */
  status: "exact_matches_found" | "no_exact_match" | "blocked";
  httpStatus: number | null;
  /** Hits whose title or hostname actually contains the candidate name. */
  matchedHits: WebHit[];
  rawHitCount: number;
  note?: string;
  checkedAt: string;
};

/**
 * Bing wraps result links in /ck/a redirects carrying a base64url payload. The
 * href in the HTML is entity-escaped ("&amp;"), which must be undone first or the
 * query-string parse silently fails and the raw redirect URL is kept.
 */
function decodeBingUrl(href: string): string {
  const unescaped = href.replace(/&amp;/g, "&").replace(/&#38;/g, "&");
  try {
    const u = new URL(unescaped, "https://www.bing.com");
    const payload = u.searchParams.get("u");
    if (payload && payload.startsWith("a1")) {
      const b64 = payload.slice(2).replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
      const decoded = Buffer.from(padded, "base64").toString("utf8");
      if (/^https?:\/\//.test(decoded)) return decoded;
    }
    return unescaped;
  } catch {
    return href;
  }
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Does this hit actually reference the candidate (in its title or its hostname)? */
function hitReferencesName(h: WebHit, name: string): boolean {
  const nameLower = name.toLowerCase();
  if (h.title.toLowerCase().includes(nameLower)) return true;
  try {
    const host = new URL(h.url).host.toLowerCase().replace(/[^a-z0-9]/g, "");
    return host.includes(nameLower);
  } catch {
    return false;
  }
}

async function webSearch(query: string, name: string, limit = 10): Promise<WebSearchResult> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${limit}`;
  const res = await politeFetch(url);
  const base = {
    query,
    url,
    httpStatus: res.status,
    matchedHits: [] as WebHit[],
    rawHitCount: 0,
    checkedAt: new Date().toISOString(),
  };
  if (res.status !== 200) {
    return { ...base, status: "blocked", note: res.error ?? `HTTP ${res.status}` };
  }
  const matches = [
    ...res.body.matchAll(
      /<li class="b_algo"[\s\S]*?<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
    ),
  ];
  const hits: WebHit[] = matches.slice(0, limit).map((m) => ({
    url: decodeBingUrl(m[1]),
    title: stripTags(m[2]),
  }));
  const matchedHits = hits.filter((h) => hitReferencesName(h, name));
  return {
    ...base,
    rawHitCount: hits.length,
    matchedHits,
    status: matchedHits.length > 0 ? "exact_matches_found" : "no_exact_match",
    note:
      matchedHits.length > 0
        ? `${matchedHits.length} of ${hits.length} returned results actually reference "${name}".`
        : hits.length > 0
          ? `Search returned ${hits.length} unrelated fallback results; none reference "${name}". Search silence is not evidence of availability.`
          : "No result blocks in the response markup; inconclusive.",
  };
}

// ---------------------------------------------------------------------------
// Check 3: social handles + app stores
// ---------------------------------------------------------------------------

type HandleResult = {
  platform: string;
  url: string;
  status: "available" | "taken" | "unverified";
  httpStatus: number | null;
  note?: string;
  checkedAt: string;
};

async function checkYouTubeHandle(name: string): Promise<HandleResult> {
  const url = `https://www.youtube.com/@${name}`;
  const res = await politeFetch(url);
  const base = { platform: "YouTube", url, httpStatus: res.status, checkedAt: new Date().toISOString() };
  if (res.status === 404) {
    return { ...base, status: "available", note: "YouTube returned 404 for the handle URL (no such channel)." };
  }
  if (res.status === 200) {
    const isChannel = /"channelId"|og:url" content="https:\/\/www\.youtube\.com\/@/.test(res.body);
    return {
      ...base,
      status: "taken",
      note: isChannel ? "YouTube served a channel page for this handle." : "HTTP 200; channel markup not confirmed.",
    };
  }
  return { ...base, status: "unverified", note: res.error ?? `HTTP ${res.status}` };
}

async function checkAppleAppStore(name: string): Promise<HandleResult> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=software&limit=8&country=us`;
  const res = await politeFetch(url);
  const base = { platform: "Apple App Store", url, httpStatus: res.status, checkedAt: new Date().toISOString() };
  if (res.status !== 200) {
    return { ...base, status: "unverified", note: res.error ?? `HTTP ${res.status}` };
  }
  try {
    const j: any = JSON.parse(res.body);
    const exact = (j.results ?? []).filter(
      (r: any) => String(r.trackName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").includes(name),
    );
    if (exact.length > 0) {
      return {
        ...base,
        status: "taken",
        note: `US App Store apps matching this string: ${exact
          .slice(0, 3)
          .map((r: any) => `${r.trackName} (${r.sellerName})`)
          .join("; ")}`,
      };
    }
    return {
      ...base,
      status: "available",
      note: `No US App Store app name contains "${name}" among the top ${(j.results ?? []).length} matches.`,
    };
  } catch {
    return { ...base, status: "unverified", note: "Apple search API returned an unparseable payload." };
  }
}

async function checkGooglePlay(name: string): Promise<HandleResult> {
  const url = `https://play.google.com/store/search?q=${encodeURIComponent(name)}&c=apps`;
  const res = await politeFetch(url);
  const base = { platform: "Google Play", url, httpStatus: res.status, checkedAt: new Date().toISOString() };
  if (res.status !== 200) {
    return { ...base, status: "unverified", note: res.error ?? `HTTP ${res.status}` };
  }
  // A plain "does the page contain the token" test is useless: Play echoes the
  // query into its own payload, so it matches even for gibberish. The package ID
  // is the usable signal, because it is returned as a real app identifier.
  const packageIds = [
    ...new Set(
      [...res.body.matchAll(/\/store\/apps\/details\?id=([A-Za-z0-9_.]+)/g)].map((m) => m[1]),
    ),
  ];
  const matching = packageIds.filter((id) => id.toLowerCase().replace(/[^a-z0-9]/g, "").includes(name));
  if (matching.length > 0) {
    return {
      ...base,
      status: "taken",
      note: `Play package ID contains this name: ${matching.slice(0, 3).join(", ")}.`,
    };
  }
  return {
    ...base,
    status: "available",
    note: `No Play package ID among the ${packageIds.length} results contains "${name}". Limitation: an app whose display name matches but whose package ID does not (e.g. com.brand.xyz) would be missed by this check.`,
  };
}

/**
 * Platforms the brief asks about where no trustworthy automated availability
 * signal exists. Probed once each during this run; recorded as Unverified.
 */
const UNVERIFIED_PLATFORMS = [
  { platform: "Instagram", note: "Returns HTTP 200 for both existing and non-existent handles (login wall). No availability signal." },
  { platform: "Facebook", note: "Handle page requests are rejected or redirected to a login wall." },
  { platform: "X", note: "No documented public handle-availability endpoint; scraping would breach platform terms." },
  { platform: "TikTok", note: "Requests from the research network failed (connection reset)." },
  { platform: "Reddit", note: "Public JSON endpoint returned HTTP 403." },
  { platform: "Discord", note: "Usernames are not publicly enumerable; vanity invites must be claimed manually." },
  { platform: "Twitch", note: "Returns HTTP 200 for both existing and non-existent channels." },
];

// ---------------------------------------------------------------------------
// Check 4: trademark screening
// ---------------------------------------------------------------------------

type TrademarkScreen = {
  jurisdiction: string;
  database: string;
  official_search_url: string;
  status: "unverified" | "no_exact_match_found_in_aggregator" | "possible_match_found";
  note: string;
  evidence_urls: string[];
};

/**
 * Hosts that aggregate official trademark register data. Used for a weak screen
 * only - an aggregator hit is a pointer to a possible register entry, never a
 * substitute for reading the official register.
 */
const TRADEMARK_AGGREGATOR_HOSTS = [
  "trademarks.justia.com",
  "trademarkia.com",
  "tmdn.org",
  "tmsearch.uspto.gov",
  "branddb.wipo.int",
  "euipo.europa.eu",
  "trademarks.ipo.gov.uk",
  "ipindiaonline.gov.in",
];

/**
 * Third-party aggregator screen. Justia mirrors USPTO records and is the one
 * aggregator that reliably appears in search results, so it is used as the
 * automated weak screen. Hosts are filtered so engine fallback junk cannot be
 * mistaken for a trademark hit.
 */
async function trademarkAggregatorScreen(name: string): Promise<{ hits: WebHit[]; search: WebSearchResult }> {
  const query = `site:trademarks.justia.com "${name}"`;
  const search = await webSearch(query, name, 8);
  const hits = search.matchedHits.filter((h) => {
    try {
      const host = new URL(h.url).host.toLowerCase();
      return TRADEMARK_AGGREGATOR_HOSTS.some((a) => host.includes(a)) && hitReferencesName(h, name);
    } catch {
      return false;
    }
  });
  return { hits, search };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreDomain(doms: DomainResult[]): { score: number; explanation: string } {
  const byTld = new Map(doms.map((d) => [d.tld, d]));
  let score = 0;
  const parts: string[] = [];
  for (const tld of TLDS) {
    const d = byTld.get(tld);
    if (!d) continue;
    if (d.status === "available_unregistered") {
      score += DOMAIN_WEIGHTS[tld];
      parts.push(`.${tld} +${DOMAIN_WEIGHTS[tld]}`);
    } else if (d.status === "registered") {
      parts.push(`.${tld} taken`);
    } else {
      parts.push(`.${tld} unverified`);
    }
  }
  return { score: Math.min(20, score), explanation: parts.join(", ") };
}

type ScreeningSignals = {
  exactChessHit: boolean;
  exactActiveHit: boolean;
  aggregatorExactHit: boolean;
  appStoreHit: boolean;
  playStoreHit: boolean;
  webChecked: boolean;
};

function scoreTrademarkScreening(s: ScreeningSignals): { score: number; explanation: string } {
  // This is an AUTOMATED SCREENING score only. It measures how much noise the
  // checks turned up. It is deliberately reported alongside - never instead of -
  // the risk status, and can never override a High risk verdict.
  let score = 20;
  const parts: string[] = [];
  if (s.aggregatorExactHit) {
    score -= 12;
    parts.push("-12 trademark aggregator lists an exact match");
  }
  if (s.exactChessHit) {
    score -= 10;
    parts.push("-10 exact-match result tied to chess");
  } else if (s.exactActiveHit) {
    score -= 6;
    parts.push("-6 exact-match result for an active business");
  }
  if (s.appStoreHit) {
    score -= 4;
    parts.push("-4 App Store app name match");
  }
  if (s.playStoreHit) {
    score -= 3;
    parts.push("-3 Play Store token match");
  }
  if (!s.webChecked) {
    score -= 4;
    parts.push("-4 web screening incomplete");
  }
  if (parts.length === 0) parts.push("no conflicting signal found in the automated checks");
  return { score: Math.max(0, score), explanation: parts.join(", ") };
}

function scoreSocial(handles: HandleResult[]): { score: number; explanation: string } {
  const byPlatform = new Map(handles.map((h) => [h.platform, h]));
  let score = 0;
  const parts: string[] = [];
  const yt = byPlatform.get("YouTube");
  if (yt?.status === "available") {
    score += 5;
    parts.push("YouTube handle free +5");
  } else if (yt?.status === "taken") {
    parts.push("YouTube handle taken");
  } else {
    score += 2;
    parts.push("YouTube unverified +2");
  }
  const as = byPlatform.get("Apple App Store");
  if (as?.status === "available") {
    score += 3;
    parts.push("App Store clear +3");
  } else if (as?.status === "taken") {
    parts.push("App Store name in use");
  } else {
    score += 1;
    parts.push("App Store unverified +1");
  }
  score += 2;
  parts.push("+2 baseline: most platforms expose no reliable availability signal");
  return { score: Math.min(10, score), explanation: parts.join(", ") };
}

function deriveRisk(s: ScreeningSignals, domains: DomainResult[]): { status: string; reason: string } {
  const comTaken = domains.find((d) => d.tld === "com")?.status === "registered";
  if (s.aggregatorExactHit) {
    return {
      status: "High risk",
      reason: "A trademark aggregator returned an exact match; a real registered or pending mark may exist. Requires professional clearance.",
    };
  }
  if (s.exactChessHit) {
    return {
      status: "High risk",
      reason: "An exact-match web result is already tied to a chess product or service.",
    };
  }
  if (!s.webChecked) {
    return {
      status: "Unverified",
      reason: "Web screening could not be completed, so no conflict conclusion is supportable.",
    };
  }
  if (s.appStoreHit || s.playStoreHit || s.exactActiveHit) {
    return {
      status: "Needs review",
      reason: "Exact-match usage exists for an app or active business, but it is not clearly a chess product.",
    };
  }
  return {
    status: "Promising",
    reason: comTaken
      ? "No material conflict identified in the checks performed; the .com is registered but no live conflicting use was found."
      : "No material conflict identified in the checks performed.",
  };
}

/**
 * Manually verified findings, produced with an independent search provider and
 * recorded in brand-research/verified-findings.json. The file is optional: when
 * absent the run falls back to the automated screen alone.
 *
 * Why this exists: the automated Bing screen answers a zero-match query with
 * unrelated fallback results, so it cannot separate "not indexed" from "not
 * found". It therefore missed every real conflict that manual corroboration found
 * (for example an active chess league on the exact name). Merging a verified
 * finding ESCALATES risk and never de-escalates it, so a human pass can only make
 * the result more cautious.
 */
type VerifiedFinding = {
  name: string;
  conflict: string;
  /** "clear" and "incidental" are recorded for transparency but never escalate risk. */
  severity: "high" | "medium" | "low" | "incidental" | "clear";
  summary: string;
  sources: string[];
};

function loadVerifiedFindings(): Map<string, VerifiedFinding[]> {
  const byName = new Map<string, VerifiedFinding[]>();
  try {
    const raw = JSON.parse(readFileSync(join(OUT_DIR, "verified-findings.json"), "utf8"));
    for (const f of raw.findings as VerifiedFinding[]) {
      const list = byName.get(f.name) ?? [];
      list.push(f);
      byName.set(f.name, list);
    }
  } catch {
    // No verified-findings.json: automated screening only.
  }
  return byName;
}

const RISK_ORDER: Record<string, number> = {
  Promising: 0,
  "Needs review": 1,
  Unverified: 2,
  "High risk": 3,
};

/** Escalate (never lower) a risk verdict based on a verified manual finding. */
function escalateRisk(
  risk: { status: string; reason: string },
  findings: VerifiedFinding[],
): { status: string; reason: string } {
  let worst = risk;
  for (const f of findings) {
    const mapped =
      f.severity === "high"
        ? "High risk"
        : f.severity === "medium" || f.severity === "low"
          ? "Needs review"
          : null;
    if (!mapped) continue; // incidental matches are recorded but not treated as conflicts
    if (RISK_ORDER[mapped] > RISK_ORDER[worst.status]) {
      worst = {
        status: mapped,
        reason: `Manual corroboration (${f.conflict} conflict, severity ${f.severity}): ${f.summary}`,
      };
    }
  }
  return worst;
}

/** Score penalty for the trademark/commercial screening criterion. */
function verifiedPenalty(findings: VerifiedFinding[]): { points: number; note: string } {
  let points = 0;
  const notes: string[] = [];
  for (const f of findings) {
    if (f.severity === "high") {
      points += 12;
      notes.push("-12 verified high-severity conflict");
    } else if (f.severity === "medium") {
      points += 6;
      notes.push("-6 verified exact-name use");
    } else if (f.severity === "low") {
      points += 3;
      notes.push("-3 verified marginal exact-name use");
    }
  }
  return { points, note: notes.join(", ") };
}

// ---------------------------------------------------------------------------
// Brand-suitability curation
// ---------------------------------------------------------------------------

/**
 * The numeric score measures the brief's six weighted criteria. It can still rank a
 * name highly on domain availability and chess relevance alone, which is exactly
 * what section 7 warns against: "Prefer a distinctive, protectable name over an
 * exact keyword that many competing businesses use."
 *
 * Curation encodes the section 2 naming CONSTRAINT that a name must be easy to
 * pronounce, spell, remember and communicate verbally. It is deliberately NOT a
 * seventh scoring criterion - it is a gate that removes names which satisfy the
 * arithmetic but fail the stated constraint. Flagged names stay in the CSV and in
 * the numeric ranking; they are only held back from the curated recommendation.
 */
function curationFlags(candidate: Candidate): string[] {
  const flags: string[] = [];
  const name = candidate.name;

  // Tier B is permitted only for "substantially better" names, so a Tier B name is
  // held back when it is assembled from whole dictionary words rather than being a
  // single root with a short brandable ending. Rules:
  //   R1/R2/R3/R8 - two or more whole words (or prefix+word) stacked: flagged.
  //   R4/R5/R6/R7 - root + short ending: flagged only for long roots, because
  //                 "diagonalgo" reads as a word with an ending bolted on.
  //   The "-ly" ending is ordinary English morphology, not brand stacking, so
  //   "diagonally" (a real word) is not flagged.
  const stackedRules = ["R1", "R2", "R3", "R8"];
  if (candidate.tier === "B" && stackedRules.includes(candidate.rule)) {
    flags.push(
      "tier-B-stacked-words: 10+ characters assembled from whole dictionary words, so it exceeds the preferred 4-9 character range without being more distinctive",
    );
  }
  const rootedRules = ["R4", "R5", "R6", "R7", "R9"];
  if (candidate.tier === "B" && rootedRules.includes(candidate.rule)) {
    // generation_detail looks like "term-suffix(diagonal + ly)" or "blend(fork ^ kit)".
    const parts = (candidate.ruleDetail.match(/\(([^)]+)\)/)?.[1] ?? "")
      .split(/[+^,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const root = parts[0] ?? "";
    const ending = parts[1] ?? "";
    if (root.length >= 6 && ending !== "ly") {
      flags.push(
        `tier-B-long-root-with-ending: "${root}" (${root.length} chars) with "${ending}" bolted on reads as a modified dictionary word rather than a distinctive brand`,
      );
    }
  }

  // A doubled consonant at a word seam makes the spelling ambiguous when the name
  // is heard once (grip + pin = "grippin") - the exact failure the brief calls out.
  if (candidate.tier === "B" && /([bcdfglmnprstz])\1/.test(name)) {
    flags.push(`doubled-consonant-seam: "${name}" repeats a consonant, so the spelling is ambiguous when heard`);
  }

  return flags;
}

/**
 * Spelling and phonetic variants the brief asks to investigate for each candidate
 * (singular/plural forms, alternative spellings, phonetically similar names).
 * Returned as ready-to-open search URLs.
 */
function variationSearches(name: string): Array<{ variation: string; reason: string; url: string }> {
  const variants: Array<[string, string]> = [
    [`${name}s`, "plural form"],
    [`${name}es`, "plural form"],
    [name.replace(/i/g, "y"), "vowel substitution i->y (phonetic near-match)"],
    [name.replace(/y/g, "i"), "vowel substitution y->i (phonetic near-match)"],
    [name.replace(/c/g, "k"), "consonant substitution c->k (phonetic near-match)"],
    [name.replace(/k/g, "c"), "consonant substitution k->c (phonetic near-match)"],
    [name.replace(/oo/g, "u"), "vowel simplification oo->u"],
    [name.replace(/ph/g, "f"), "consonant substitution ph->f"],
    [name.replace(/([a-z])\1+/g, "$1"), "de-doubled spelling"],
    [`${name} hq`, "suffix addition, 'hq'"],
    [`${name} app`, "suffix addition, 'app'"],
  ];
  const seen = new Set<string>();
  const out: Array<{ variation: string; reason: string; url: string }> = [];
  for (const [variation, reason] of variants) {
    if (variation === name || variation.length < 3 || seen.has(variation)) continue;
    seen.add(variation);
    out.push({
      variation,
      reason,
      url: `https://www.google.com/search?q=${encodeURIComponent('"' + variation + '"')}`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Classification of web results
// ---------------------------------------------------------------------------

const CHESS_TOKENS = [
  "chess", "checkmate", "checkers", "chessboard", "puzzle", "tactics", "grandmaster",
  "sicilian", "endgame", "gambit", "blitz", "fide", "lichess", "chess.com", "rook",
  "knight", "pawn", "stalemate", "chessable", "chesskid",
];

const DIRECTORY_TOKENS = [
  "facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com",
  "youtube.com", "reddit.com", "pinterest.", "tiktok.com", "crunchbase.com",
  "bloomberg.com", "wikipedia.org", "wikidata.org", "companieshouse", "zaubacorp",
  "opencorporates", "dnb.com", "glassdoor", "indeed.com", "justdial",
];

const INACTIVE_TOKENS = ["godaddy.com", "sedo", "afternic", "dan.com", "hugedomains", "namecheap", "for sale", "expired"];

/**
 * Classify only results that genuinely reference the candidate name. Search-engine
 * fallback results are already excluded by the caller, so everything arriving here
 * is a real name match; this function then decides what kind of match it is.
 */
function classifyHits(matchedHits: WebHit[], name: string) {
  const nameLower = name.toLowerCase();
  let exactChessHit = false;
  let exactActiveHit = false;
  const evidence: string[] = [];
  for (const h of matchedHits) {
    const blob = `${h.title} ${h.url}`.toLowerCase();
    if (!blob.includes(nameLower) && !hitReferencesName(h, name)) continue;
    const isChess = CHESS_TOKENS.some((t) => blob.includes(t));
    const isDirectory = DIRECTORY_TOKENS.some((t) => blob.includes(t));
    const isInactive = INACTIVE_TOKENS.some((t) => blob.includes(t));
    if (isChess) {
      exactChessHit = true;
      evidence.push(`chess-related: ${h.title} (${h.url})`);
    } else if (!isDirectory && !isInactive) {
      exactActiveHit = true;
      evidence.push(`active/unrelated: ${h.title} (${h.url})`);
    } else if (isInactive) {
      evidence.push(`inactive or parked: ${h.title} (${h.url})`);
    } else {
      evidence.push(`directory listing: ${h.title} (${h.url})`);
    }
  }
  return { exactChessHit, exactActiveHit, evidence };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type Candidate = {
  rank: number;
  name: string;
  charCount: number;
  tier: string;
  rule: string;
  ruleDetail: string;
  category: string;
  preScore: number;
  pronounceability: number;
  distinctiveness: number;
  relevance: number;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function loadShortlist(): Candidate[] {
  const csv = readFileSync(join(OUT_DIR, "shortlist-100.csv"), "utf8");
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.slice(1).map((line) => {
    const c = parseCsvLine(line);
    return {
      rank: Number(c[0]),
      name: c[1],
      charCount: Number(c[2]),
      tier: c[3],
      rule: c[4],
      ruleDetail: c[5],
      category: c[6],
      preScore: Number(c[11]),
      pronounceability: Number(c[8]),
      distinctiveness: Number(c[9]),
      relevance: Number(c[10]),
    };
  });
}

type CandidateResearch = {
  candidate: Candidate;
  domains: DomainResult[];
  searches: {
    exact: WebSearchResult;
    chessContext: WebSearchResult;
    trademarkAggregator: WebSearchResult;
  };
  handles: HandleResult[];
  trademarkScreens: TrademarkScreen[];
  verifiedFindings: VerifiedFinding[];
  classification: { exactChessHit: boolean; exactActiveHit: boolean; evidence: string[] };
  scores: {
    distinctiveness: number;
    pronunciation: number;
    relevance: number;
    domain: { score: number; explanation: string };
    trademark: { score: number; explanation: string };
    social: { score: number; explanation: string };
    total: number;
  };
  risk: { status: string; reason: string };
  exactMatchSearchUrl: string;
  similarNameSearchUrl: string;
};

async function main() {
  let shortlist = loadShortlist();
  // RESEARCH_LIMIT lets the harness be smoke-tested on a subset before a full run.
  const limit = Number(process.env.RESEARCH_LIMIT ?? 0);
  if (limit > 0) shortlist = shortlist.slice(0, limit);
  console.log(`Loaded ${shortlist.length} shortlisted candidates.`);
  const verifiedFindings = loadVerifiedFindings();
  console.log(
    `Loaded ${[...verifiedFindings.values()].flat().length} manually verified findings covering ${verifiedFindings.size} candidates.`,
  );
  await probeRegistries();
  console.log("Probing trademark databases once to record reachability...");

  // Probe each trademark database exactly once - this is a property of the
  // environment, not of an individual candidate, so it is recorded globally.
  const trademarkProbes: Array<{
    id: string;
    name: string;
    probeUrl: string;
    httpStatus: number | null;
    contentType: string | null;
    machineQueryable: boolean;
    blockingMechanism: string;
    evidenceSnippet: string;
  }> = [];
  for (const j of TRADEMARK_JURISDICTIONS) {
    const probe = await politeFetch(j.probeUrl);
    // A 200 from a bot-challenge or single-page-app shell carries no register
    // data, so "reachable" is judged by whether register data came back, not by
    // the status code alone.
    const returnsData = probe.status === 200 && /[{\[]/.test(probe.body.trim().slice(0, 1));
    trademarkProbes.push({
      id: j.id,
      name: j.name,
      probeUrl: j.probeUrl,
      httpStatus: probe.status,
      contentType: null,
      machineQueryable: returnsData,
      blockingMechanism: j.blockingMechanism,
      evidenceSnippet: stripTags(probe.body).slice(0, 160) || (probe.error ?? ""),
    });
    console.log(`  ${j.id.padEnd(5)} HTTP ${probe.status ?? "ERR"} queryable=${returnsData}`);
  }

  const results: CandidateResearch[] = [];
  let done = 0;

  await pool(
    shortlist,
    async (candidate) => {
      const name = candidate.name;

      const domains = await Promise.all(TLDS.map((t) => checkDomain(name, t)));

      const exactQuery = `"${name}"`;
      const chessQuery = `"${name}" chess`;
      const exact = await webSearch(exactQuery, name);
      const chessContext = await webSearch(chessQuery, name);
      const { hits: aggregatorHits, search: trademarkAggregator } = await trademarkAggregatorScreen(name);

      const handles = await Promise.all([
        checkYouTubeHandle(name),
        checkAppleAppStore(name),
        checkGooglePlay(name),
      ]);

      const cls = classifyHits(
        [...exact.matchedHits, ...chessContext.matchedHits],
        name,
      );

      const appStoreHit = handles.find((h) => h.platform === "Apple App Store")?.status === "taken";
      const playStoreHit = handles.find((h) => h.platform === "Google Play")?.status === "taken";
      const signals: ScreeningSignals = {
        exactChessHit: cls.exactChessHit,
        exactActiveHit: cls.exactActiveHit,
        aggregatorExactHit: aggregatorHits.length > 0,
        appStoreHit,
        playStoreHit,
        webChecked: exact.status !== "blocked" && chessContext.status !== "blocked",
      };

      const domainScore = scoreDomain(domains);
      const baseTrademarkScore = scoreTrademarkScreening(signals);
      const findings = verifiedFindings.get(name) ?? [];
      const penalty = verifiedPenalty(findings);
      const trademarkScore = {
        score: Math.max(0, baseTrademarkScore.score - penalty.points),
        explanation: [baseTrademarkScore.explanation, penalty.note].filter(Boolean).join("; "),
      };
      const socialScore = scoreSocial(handles);
      const risk = escalateRisk(deriveRisk(signals, domains), findings);

      const trademarkScreens: TrademarkScreen[] = TRADEMARK_JURISDICTIONS.map((j) => ({
        jurisdiction: j.id,
        database: j.name,
        official_search_url: j.manualUrl(name),
        status: aggregatorHits.length > 0 ? "possible_match_found" : "unverified",
        note: aggregatorHits.length > 0
          ? `NOT screened in the official register: ${j.blockingMechanism} A third-party aggregator of official records surfaced a possible match: ${aggregatorHits[0].url}. Verify in the official database and treat as unresolved.`
          : `NOT screened in the official register: ${j.blockingMechanism} Status is Unverified - this is not a finding of "no conflict".`,
        evidence_urls: aggregatorHits.slice(0, 3).map((h) => h.url),
      }));

      const total =
        candidate.distinctiveness +
        candidate.pronounceability +
        candidate.relevance +
        domainScore.score +
        trademarkScore.score +
        socialScore.score;

      results.push({
        candidate,
        domains,
        searches: { exact, chessContext, trademarkAggregator },
        handles,
        trademarkScreens,
        verifiedFindings: findings,
        classification: cls,
        scores: {
          distinctiveness: candidate.distinctiveness,
          pronunciation: candidate.pronounceability,
          relevance: candidate.relevance,
          domain: domainScore,
          trademark: trademarkScore,
          social: socialScore,
          total,
        },
        risk,
        exactMatchSearchUrl: `https://www.google.com/search?q=${encodeURIComponent('"' + name + '"')}`,
        similarNameSearchUrl: `https://www.bing.com/search?q=${encodeURIComponent('"' + name + '" chess')}`,
      });

      done++;
      if (done % 10 === 0) console.log(`  researched ${done}/${shortlist.length}`);
    },
    CONCURRENCY,
  );

  results.sort((a, b) => a.candidate.rank - b.candidate.rank);

  // ---- raw evidence -------------------------------------------------------
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "raw-research.json"),
    JSON.stringify(
      {
        runAt: CHECKED_AT,
        methodology: {
          domainChecks:
            "Authoritative RDAP per TLD (IANA bootstrap endpoints). Each registry was validated against a positive control domain before use, and a 404 is only read as 'unregistered' when the response is a genuine RDAP error document. The public redirector rdap.org was deliberately excluded after it returned a false 404 for google.io.",
          webChecks: "Bing HTML search, exact phrase and chess-context queries, per candidate.",
          trademarkChecks:
            "Official databases probed once each (see trademarkProbes). Per-candidate screening of the official registers was not possible in this environment, so a third-party aggregator search was used as a weak screen and every candidate is marked Unverified in the official registers.",
          socialChecks:
            "YouTube handle 404/200, Apple App Store public search API, Google Play search token presence. Other platforms expose no reliable availability signal.",
          dice: "No domain was registered, purchased, or modified. No external service was written to.",
        },
        registryHealth: [...registryHealth.values()],
        trademarkProbes,
        unverifiedPlatforms: UNVERIFIED_PLATFORMS,
        relevantNiceClasses: RELEVANT_NICE_CLASSES,
        results,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // ---- domain matrix ------------------------------------------------------
  const matrixHeader = ["candidate", "tld", "fqdn", "status", "http_status", "endpoint", "registrar", "created", "expires", "nameservers", "checked_at", "note"];
  const matrixRows = results.flatMap((r) =>
    r.domains.map((d) => [
      r.candidate.name,
      d.tld,
      d.fqdn,
      d.status,
      String(d.httpStatus ?? ""),
      d.endpoint,
      d.registrar ?? "",
      d.createdAt ?? "",
      d.expiresAt ?? "",
      (d.nameservers ?? []).join(" "),
      d.checkedAt,
      d.note ?? "",
    ]),
  );
  writeFileSync(
    join(OUT_DIR, "domain-matrix.csv"),
    [matrixHeader, ...matrixRows].map((r) => r.map(csvEscape).join(",")).join("\n") + "\n",
    "utf8",
  );

  // ---- candidates.csv -----------------------------------------------------
  const candHeader = [
    "candidate", "char_count", "generation_rule", "generation_detail", "naming_category",
    "exact_match_search_url", "similar_name_search_url",
    "domain_com_available", "domain_in_available", "domain_status_summary", "domain_check_source", "domains_available", "domains_checked",
    "trademark_status_IN", "trademark_status_WIPO", "trademark_status_US", "trademark_status_UK", "trademark_status_EU",
    "trademark_note", "trademark_evidence_urls",
    "social_youtube", "social_appstore", "social_googleplay", "social_other_platforms", "social_note",
    "score_distinctiveness_20", "score_pronunciation_15", "score_relevance_15", "score_domain_20",
    "score_trademark_screening_20", "score_social_10", "score_total_100",
    "risk_status", "risk_reason", "manual_corroboration", "manual_corroboration_sources",
    "exact_match_web_findings", "chess_context_findings",
    "date_checked", "notes_and_evidence_urls",
  ];
  const candRows = results.map((r) => {
    const dCom = r.domains.find((d) => d.tld === "com");
    const dIn = r.domains.find((d) => d.tld === "in");
    const available = r.domains.filter((d) => d.status === "available_unregistered");
    const tm = (id: string) => r.trademarkScreens.find((t) => t.jurisdiction === id)?.status ?? "";
    const yt = r.handles.find((h) => h.platform === "YouTube");
    const as = r.handles.find((h) => h.platform === "Apple App Store");
    const gp = r.handles.find((h) => h.platform === "Google Play");
    const evidenceUrls = [
      ...r.classification.evidence.slice(0, 3).map((e) => (e.match(/\((https?:\/\/[^)]+)\)/) ?? [, ""])[1]),
      ...r.searches.trademarkAggregator.matchedHits.slice(0, 2).map((h) => h.url),
    ].filter(Boolean);
    const exactSummary =
      r.searches.exact.status === "blocked"
        ? `blocked: ${r.searches.exact.note ?? ""}`
        : r.searches.exact.status === "no_exact_match"
          ? `no exact-match results in ${r.searches.exact.rawHitCount} returned results (search silence is not evidence of availability)`
          : r.classification.evidence.slice(0, 2).join(" | ") || "exact-match results found";
    return [
      r.candidate.name,
      String(r.candidate.charCount),
      r.candidate.rule,
      r.candidate.ruleDetail,
      r.candidate.category,
      r.exactMatchSearchUrl,
      r.similarNameSearchUrl,
      dCom?.status === "available_unregistered" ? "available_unregistered" : dCom?.status === "registered" ? "registered" : "unverified",
      dIn?.status === "available_unregistered" ? "available_unregistered" : dIn?.status === "registered" ? "registered" : "unverified",
      r.domains.map((d) => `${d.tld}:${d.status === "available_unregistered" ? "free" : d.status === "registered" ? "taken" : "unverified"}`).join(" "),
      r.domains[0]?.endpoint ?? "",
      available.map((d) => d.tld).join(" "),
      String(r.domains.length),
      tm("IN"), tm("WIPO"), tm("US"), tm("UK"), tm("EU"),
      r.trademarkScreens[0]?.note ?? "",
      r.trademarkScreens.flatMap((t) => t.evidence_urls).slice(0, 3).join(" "),
      yt?.status ?? "unverified",
      as?.status ?? "unverified",
      gp?.status ?? "unverified",
      "unverified (Instagram, Facebook, X, TikTok, Reddit, Discord, Twitch - see report)",
      [yt?.note, as?.note, gp?.note].filter(Boolean).join(" | "),
      String(r.scores.distinctiveness),
      String(r.scores.pronunciation),
      String(r.scores.relevance),
      String(r.scores.domain.score),
      String(r.scores.trademark.score),
      String(r.scores.social.score),
      String(r.scores.total),
      r.risk.status,
      r.risk.reason,
      r.verifiedFindings.length === 0
        ? "none"
        : r.verifiedFindings.map((f) => `${f.severity}/${f.conflict}: ${f.summary}`).join(" || "),
      r.verifiedFindings.flatMap((f) => f.sources).slice(0, 4).join(" "),
      exactSummary,
      r.searches.chessContext.status === "blocked"
        ? `blocked: ${r.searches.chessContext.note ?? ""}`
        : r.classification.exactChessHit
          ? "chess-related exact match present"
          : `no chess-related exact match in ${r.searches.chessContext.rawHitCount} returned results`,
      CHECKED_AT,
      evidenceUrls.join(" "),
    ];
  });
  writeFileSync(
    join(OUT_DIR, "candidates.csv"),
    [candHeader, ...candRows].map((r) => r.map(csvEscape).join(",")).join("\n") + "\n",
    "utf8",
  );

  // ---- recommended-names.json --------------------------------------------
  const ranked = [...results].sort((a, b) => {
    const riskRank = (s: string) => (s === "Promising" ? 0 : s === "Needs review" ? 1 : s === "Unverified" ? 2 : 3);
    return riskRank(a.risk.status) - riskRank(b.risk.status) || b.scores.total - a.scores.total;
  });

  // Curated recommendation ranking: practical brand suitability, not the arithmetic
  // score alone. Names failing the section 2 naming constraint are held back with a
  // stated reason; risk status is still the primary gate.
  // Recommendation diversity: a curated list made entirely of arbitrary coined
  // strings would be useless to a founder choosing a brand, so coined words are
  // capped inside the curated top 10. They remain in the numeric ranking and in the
  // CSV with their full scores.
  const MAX_COINED_IN_CURATED = 3;
  const candidateWithFlags = ranked.map((r) => ({ r, flags: curationFlags(r.candidate) }));
  const curated: Array<{ r: CandidateResearch; flags: string[] }> = [];
  let coinedUsed = 0;
  for (const entry of candidateWithFlags) {
    if (curated.length >= 10) break;
    if (entry.flags.length > 0 || entry.r.risk.status !== "Promising") continue;
    if (entry.r.candidate.category === "coined-word") {
      if (coinedUsed >= MAX_COINED_IN_CURATED) continue;
      coinedUsed++;
    }
    curated.push(entry);
  }

  writeFileSync(
    join(OUT_DIR, "recommended-names.json"),
    JSON.stringify(
      {
        generatedAt: CHECKED_AT,
        product: {
          workingName: "PlyQuest",
          description: "Free, no-login, static-first chess tactics puzzles, daily challenges, interactive solving with hints, and printable PDF worksheets.",
          markets: ["India", "International"],
          constraints: {
            tierA: "4-9 alphanumeric characters (preferred)",
            tierB: "10-12 alphanumeric characters (permitted only for substantially better names)",
            excluded: "Confusing letter sequences, famous chess sites, deliberate misspellings of established brands, offensive or misleading combinations",
          },
        },
        scoring: {
          total: 100,
          weights: {
            distinctiveness_and_memorability: 20,
            pronunciation_and_spelling: 15,
            relevance_to_chess_puzzles: 15,
            domain_availability_and_quality: 20,
            trademark_and_commercial_conflict_screening: 20,
            social_handle_consistency: 10,
          },
          note: "Legal risk is assessed separately via risk_status and never overridden by a high score.",
        },
        statusDefinitions: {
          Promising: "No material conflict identified in the research performed.",
          "Needs review": "Similar names or inconclusive evidence exist.",
          "High risk": "A potentially material existing brand or trademark conflict requires further investigation.",
          Unverified: "Relevant checks could not be completed.",
        },
        outstandingChecks: [
          "Official trademark registers (IP India, WIPO, USPTO, UK IPO, EUIPO) - automated screening was not possible; every candidate needs manual or professional clearance in Nice classes 9, 16, 41 and 42.",
          "Company and business-name registers (MCA India, Companies House, state registries) for the final shortlist.",
          "Social handles on Instagram, Facebook, X, TikTok, Reddit, Discord and Twitch - all Unverified in this run.",
          "Registrar-level confirmation that a 404 RDAP domain is registrable (premium/reserved name check).",
          "Domains in .club and .co - both were unresolvable in this run (.club registry rate-limited, .co publishes no RDAP).",
        ],
        curationMethod:
          "Recommendation order applies practical brand suitability on top of the numeric score, as section 7 requires. Risk status is the primary gate: only Promising candidates are curated. Candidates are then held back when they breach the section 2 naming constraint (see per-candidate curation_flags), and arbitrary coined strings are capped at 3 of the 10 so the list is usable for a brand decision. Full numeric ranking is preserved in candidates.csv and in the ranking below.",
        curatedRecommendations: curated.map(({ r, flags }, i) => ({
          rank: i + 1,
          name: r.candidate.name,
          length: r.candidate.charCount,
          tier: r.candidate.tier,
          score: r.scores.total,
          risk_status: r.risk.status,
          curation_flags: flags,
          domain_summary: {
            free: r.domains.filter((d) => d.status === "available_unregistered").map((d) => "." + d.tld),
            taken: r.domains.filter((d) => d.status === "registered").map((d) => `.${d.tld}`),
            unverified: r.domains.filter((d) => d.status === "unverified").map((d) => `.${d.tld}`),
          },
          spelling_and_phonetic_variants: variationSearches(r.candidate.name),
        })),
        heldBackByCuration: candidateWithFlags
          .filter(({ flags, r }) => flags.length > 0 && r.risk.status !== "High risk")
          .slice(0, 20)
          .map(({ r, flags }) => ({
            name: r.candidate.name,
            score: r.scores.total,
            risk_status: r.risk.status,
            curation_flags: flags,
          })),
        recommendations: ranked.map((r, i) => ({
          rank: i + 1,
          name: r.candidate.name,
          length: r.candidate.charCount,
          tier: r.candidate.tier,
          generation_rule: r.candidate.rule,
          generation_detail: r.candidate.ruleDetail,
          naming_category: r.candidate.category,
          score: r.scores.total,
          score_breakdown: {
            distinctiveness_and_memorability: r.scores.distinctiveness,
            pronunciation_and_spelling: r.scores.pronunciation,
            relevance_to_chess_puzzles: r.scores.relevance,
            domain_availability_and_quality: r.scores.domain.score,
            trademark_and_commercial_conflict_screening: r.scores.trademark.score,
            social_handle_consistency: r.scores.social.score,
          },
          risk_status: r.risk.status,
          risk_reason: r.risk.reason,
          manual_corroboration: r.verifiedFindings,
          domains: r.domains.map((d) => ({
            tld: d.tld,
            status: d.status,
            http_status: d.httpStatus,
            source: d.endpoint,
            registrar: d.registrar,
            created: d.createdAt,
            expires: d.expiresAt,
            checked_at: d.checkedAt,
            note: d.note,
          })),
          web_presence: {
            exact_match_search_url: r.exactMatchSearchUrl,
            similar_name_search_url: r.similarNameSearchUrl,
            exact_match_hits: r.searches.exact.matchedHits,
            chess_context_hits: r.searches.chessContext.matchedHits,
            classification: r.classification,
          },
          trademark_screening: r.trademarkScreens,
          social_handles: r.handles,
          social_unverified_platforms: UNVERIFIED_PLATFORMS.map((p) => ({ platform: p.platform, note: p.note })),
          date_checked: CHECKED_AT,
        })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // ---- console summary ----------------------------------------------------
  const byRisk: Record<string, number> = {};
  for (const r of results) byRisk[r.risk.status] = (byRisk[r.risk.status] ?? 0) + 1;
  const comFree = results.filter((r) => r.domains.find((d) => d.tld === "com")?.status === "available_unregistered").length;
  const inFree = results.filter((r) => r.domains.find((d) => d.tld === "in")?.status === "available_unregistered").length;
  console.log(`\nResearched ${results.length} candidates.`);
  console.log(`.com unregistered: ${comFree}   .in unregistered: ${inFree}`);
  console.log(`risk split:`, byRisk);
  console.log(`\nTop 20 by (risk, score) - raw numeric ranking:`);
  for (const r of ranked.slice(0, 20)) {
    const free = r.domains.filter((d) => d.status === "available_unregistered").map((d) => "." + d.tld).join(",") || "-";
    console.log(
      `  ${r.candidate.name.padEnd(13)} ${String(r.scores.total).padStart(3)}  ${r.risk.status.padEnd(12)} free: ${free.padEnd(24)} .com=${r.domains.find((d) => d.tld === "com")?.status}`,
    );
  }
  console.log(`\nCurated recommendation (practical brand suitability, Promising only, constraint breaches held back):`);
  for (const [i, { r, flags }] of curated.entries()) {
    console.log(`  ${i + 1}. ${r.candidate.name.padEnd(13)} ${String(r.scores.total).padStart(3)}  ${r.candidate.tier}  flags=${flags.length}`);
  }
  console.log(`\nHeld back by curation despite scoring well:`);
  for (const { r, flags } of candidateWithFlags.filter(({ flags, r }) => flags.length > 0 && r.scores.total >= 80).slice(0, 12)) {
    console.log(`  ${r.candidate.name.padEnd(13)} ${String(r.scores.total).padStart(3)}  ${flags[0].split(":")[0]}`);
  }
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

main().catch((e) => {
  console.error("Research run failed:", e);
  process.exit(1);
});
