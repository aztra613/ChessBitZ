/**
 * Deterministic brand-name generator for the PlyQuest replacement-brand search.
 *
 * Run:  npx tsx scripts/generate-brand-names.ts
 *
 * This script is build-time only. It is never imported by the application runtime
 * bundle (vite only bundles `src/`), so nothing here ships to users.
 *
 * Reproducibility contract
 * ------------------------
 * - Every candidate records the exact generation RULE that produced it.
 * - All randomness comes from a seeded mulberry32 PRNG (COINED_SEED below), so the
 *   output is byte-for-byte reproducible on any machine.
 * - Output rows are sorted deterministically, so re-running diffs to nothing.
 *
 * Outputs (brand-research/):
 *   all-candidates.csv  - every surviving candidate with its rule + heuristic scores
 *   shortlist-100.csv   - the 100 candidates that go on to live availability research
 *   generation-stats.json - counts per rule/category, for the research report
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "..", "brand-research");

// ---------------------------------------------------------------------------
// Configuration (character limits are configurable per the brief)
// ---------------------------------------------------------------------------

export const CONFIG = {
  /** Tier A: 4-9 alphanumeric characters. */
  tierAMin: 4,
  tierAMax: 9,
  /** Tier B: 10-12 characters, permitted only for substantially better names. */
  tierBMin: 10,
  tierBMax: 12,
  /** Absolute generation ceiling - nothing longer than Tier B is even emitted. */
  hardMax: 12,
  /** Seeded PRNG seed for coined-word generation. Changing this changes R10 only. */
  coinedSeed: 0x5eed_c0de,
  /** How many coined words to attempt in rule R10. */
  coinedAttempts: 4000,
  /** Coined words shorter than this are fragments, not brands. */
  coinedMinLength: 6,
  /** Shortlist size. */
  shortlistSize: 100,
  /** Diversity cap: max candidates per naming category in the shortlist. */
  maxPerCategoryInShortlist: 14,
  /** Tighter caps for categories that are structurally noisy. */
  maxPerNoisyCategoryInShortlist: 8,
  /** Categories treated as structurally noisy. */
  noisyCategories: ["triple-word", "coined-word", "chess-term-beyond-chess"],
};

// ---------------------------------------------------------------------------
// Word families
// ---------------------------------------------------------------------------

/** Chess fundamentals. `strong` terms are unambiguous chess vocabulary. */
const CHESS_FUNDAMENTALS: Array<{ w: string; strong: boolean }> = [
  { w: "chess", strong: false },
  { w: "mate", strong: true },
  { w: "check", strong: false },
  { w: "rook", strong: true },
  { w: "pawn", strong: true },
  { w: "knight", strong: true },
  { w: "bishop", strong: true },
  { w: "king", strong: false },
  { w: "queen", strong: false },
  { w: "castle", strong: true },
  { w: "gambit", strong: true },
  { w: "blitz", strong: true },
  { w: "board", strong: false },
  { w: "tactic", strong: true },
  { w: "puzzle", strong: false },
  { w: "move", strong: false },
  { w: "fork", strong: true },
  { w: "pin", strong: true },
  { w: "skewer", strong: true },
  { w: "tempo", strong: true },
  { w: "opening", strong: true },
  { w: "endgame", strong: true },
];

/** Chess vocabulary beyond the word "chess" (generation method 5). */
const CHESS_TERMS: Array<{ w: string; strong: boolean }> = [
  { w: "checkmate", strong: true },
  { w: "stalemate", strong: true },
  { w: "zugzwang", strong: true },
  { w: "promotion", strong: true },
  { w: "combination", strong: true },
  { w: "sacrifice", strong: true },
  { w: "deflection", strong: true },
  { w: "discovery", strong: true },
  { w: "backrank", strong: true },
  { w: "smothered", strong: true },
  { w: "zwischenzug", strong: true },
  { w: "rank", strong: false },
  { w: "file", strong: false },
  { w: "diagonal", strong: true },
  { w: "square", strong: false },
  { w: "center", strong: false },
  { w: "initiative", strong: true },
  { w: "material", strong: true },
];

/** Action and skill words (generation methods 2 and 8). */
const ACTION_WORDS = [
  "solve", "think", "brain", "sharp", "clever", "smart", "quick", "swift",
  "tact", "logic", "play", "train", "learn", "focus", "skill", "quest",
  "arena", "sprint", "strike", "master",
];

/** Strategy / calculation / puzzle-solving stems (generation method 7). */
const STRATEGY_STEMS = [
  "strategy", "calculate", "compute", "analyse", "analyze", "pattern",
  "sequence", "combine", "sharpen", "improve", "practice", "insight",
  "reason", "deduce", "deduct", "recall", "memor", "visual",
];

/** Brandable suffixes and fragments. */
const SUFFIXES = [
  "io", "ly", "lab", "hub", "kit", "zen", "nova", "ace", "iq", "fox", "go",
  "up", "wise", "spark", "mint", "craft", "quest",
];

/** Prefixes for method 3 (meaningful prefixes + word). */
const PREFIXES = [
  "zen", "nova", "neo", "pro", "uni", "ludo", "puzz", "tact", "strat",
  "cogni", "ment", "calcul", "hexa", "octo", "quad", "omni",
];

// ---------------------------------------------------------------------------
// Exclusion lists
// ---------------------------------------------------------------------------

/**
 * Existing chess brands / well-known chess domains. A replacement brand must not
 * be confusable with these, so exact matches are dropped at generation time and
 * near matches are surfaced as conflicts during research.
 */
const EXISTING_CHESS_BRANDS = [
  "chesscom", "lichess", "chess24", "chessable", "chesskid", "chessbase",
  "chessgames", "chesscube", "chessity", "chessily", "chessify", "chessly",
  "chesstempo", "chessbomb", "chessvidya", "chessmate", "chessmaster",
  "checkmate", "checkio", "chessclub", "chesspath", "chesssteps", "chessez",
  "chessopolis", "chessentials", "chesstactics", "chesspuzzle", "chesstrainer",
  "chessarena", "chesstiger", "chessify", "chessplus", "chessnute", "blitzchess",
];

/** Established non-chess software brands to avoid resembling. */
const EXISTING_SOFTWARE_BRANDS = [
  "notion", "figma", "canva", "linear", "vercel", "netlify", "stripe",
  "slack", "zoom", "asana", "airtable", "monday", "trello", "supabase",
];

/** Deliberate-misspelling traps of famous brands - explicitly disallowed. */
const MISSPELLING_TRAPS = [
  "chessr", "chessir", "chyess", "chezz", "chessz", "ch3ss", "chez", "ches",
  "xoogle", "gogle", "amazn", "netflx", "microsft",
];

/**
 * Offensive / inappropriate / misleading substrings. Matched against the full
 * candidate (generation method 10). Kept deliberately broad on letter runs that
 * are unambiguous slurs or adult terms in English, plus misleading claims.
 */
const BLOCKED_SUBSTRINGS = [
  "fuk", "fuc", "fack", "shit", "sht", "cunt", "kunt", "rape", "rapist",
  "nazi", "hitler", "porn", "porn", "xxx", "sex", "sx", "tits", "boob",
  "ass", "ars", "pee", "pis", "dick", "dik", "cock", "kok", "cum", "bitch",
  "whore", "slut", "nig", "fag", "kike", "spic", "chink", "retard", "moron",
  "idiot", "stupid", "hate", "kill", "murder", "suicide", "drug", "crack",
  "casino", "bet", "betting", "gamble", "lottery", "loan", "viagra", "pharma",
  "cheat", "hack", "scam", "fake", "freehack", "piracy", "crack",
  "cooli", "joo", "kys", "fgt", "spic", "wetback", "cholo",
];

/** Misleading/unsuitable legal or quality claims. */
const BLOCKED_EXACT = new Set([
  "official", "authentic", "guaranteed", "certified", "licensed", "best",
  "number1", "no1", "world1", "grandmastergm", "fideofficial", "fide",
  "olympic", "olympics", "champion", "championship", "worldchess",
]);

/**
 * Candidates that are real English words, phrases or slang with a meaning
 * unrelated to (or unsuitable for) a chess puzzle brand. These pass the
 * substring screen but would confuse or embarrass, so they are dropped.
 */
const RISKY_MEANING_EXACT = new Set([
  "pinup",      // pin-up model
  "forkup",     // "fork up" = hand over money; also vulgar echo
  "forkoff",    // "fork off" = vulgar dismissal
  "forking",    // common minced oath
  "rookit",     // "rook it" = to swindle
  "rooking",    // to rook = to cheat
  "rookie",     // novice (unrelated, also a people-search site)
  "rookery",    // bird colony
  "matey",      // nautical slang
  "mateship",   // Australian concept
  "pawned",     // "pawned" = sold at a pawn shop
  "kinged",     // to king = to make a king (checkers)
  "queened",    // to queen = to make a queen
  "tactless",   // negative quality
  "sharpish",   // British slang for "fairly quickly"
  "brainchild", // unrelated compound
  "brainwave",  // unrelated compound
  "blitzard",   // nonsensical near-miss of blizzard
  "sybarite",   // unrelated
]);

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) - reproducibility for rule R7
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Candidate shape + generation rules
// ---------------------------------------------------------------------------

export type Candidate = {
  name: string;
  rule: string;
  ruleDetail: string;
  category: string;
  sources: string;
};

const candidates = new Map<string, Candidate>();

function add(
  name: string,
  rule: string,
  ruleDetail: string,
  category: string,
  sources: string,
): void {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!key) return;
  if (candidates.has(key)) return; // first rule wins -> deterministic dedupe
  candidates.set(key, { name: key, rule, ruleDetail, category, sources });
}

// R1 - concatenate two complete words (fundamental + action)
for (const a of CHESS_FUNDAMENTALS) {
  for (const b of ACTION_WORDS) {
    add(a.w + b, "R1", `concat(${a.w} + ${b})`, a.strong ? "chess-explicit-strong" : "chess-explicit-generic", `${a.w},${b}`);
  }
}

// R2 - reversed two-word concatenation (action + fundamental)
for (const a of ACTION_WORDS) {
  for (const f of CHESS_FUNDAMENTALS) {
    add(a + f.w, "R2", `concat(${a} + ${f.w})`, f.strong ? "chess-explicit-strong" : "chess-explicit-generic", `${a},${f.w}`);
  }
}

// R3 - concatenate three short words, subject to the character limit
{
  const shortPool = [
    ...CHESS_FUNDAMENTALS.map((f) => f.w).filter((w) => w.length <= 5),
    ...CHESS_TERMS.map((f) => f.w).filter((w) => w.length <= 5),
    "tact", "mind", "play", "quiz", "calm", "grip", "turn", "edge", "line",
    "rank", "code", "core", "peak", "prim",
  ];
  const uniq = [...new Set(shortPool)];
  for (const a of uniq) {
    for (const b of uniq) {
      if (a === b) continue;
      for (const c of uniq) {
        if (c === a || c === b) continue;
        const name = a + b + c;
        if (name.length > CONFIG.hardMax) continue;
        add(name, "R3", `triple(${a} + ${b} + ${c})`, "triple-word", `${a},${b},${c}`);
      }
    }
  }
}

// R4 - word + brandable suffix (chess fundamentals)
for (const a of CHESS_FUNDAMENTALS) {
  for (const s of SUFFIXES) {
    add(a.w + s, "R4", `suffix(${a.w} + ${s})`, a.strong ? "chess-explicit-strong" : "chess-explicit-generic", `${a.w},${s}`);
  }
}

// R5 - chess terminology beyond "chess" + brandable suffix (method 5)
for (const a of CHESS_TERMS) {
  for (const s of SUFFIXES) {
    add(a.w + s, "R5", `term-suffix(${a.w} + ${s})`, "chess-term-beyond-chess", `${a.w},${s}`);
  }
}

// R6 - action/skill word + suffix (method 3 + 8)
for (const a of ACTION_WORDS) {
  for (const s of SUFFIXES) {
    add(a + s, "R6", `action-suffix(${a} + ${s})`, "action-skill", `${a},${s}`);
  }
}

// R7 - strategy / calculation stems + suffix (method 7)
for (const a of STRATEGY_STEMS) {
  for (const s of SUFFIXES) {
    add(a + s, "R7", `strategy-suffix(${a} + ${s})`, "strategy-calculation", `${a},${s}`);
  }
}

// R8 - meaningful prefix + word (method 3)
for (const p of PREFIXES) {
  for (const a of [...CHESS_FUNDAMENTALS, ...CHESS_TERMS].map((x) => x.w)) {
    add(p + a, "R8", `prefix(${p} + ${a})`, "prefix-word", `${p},${a}`);
  }
}

// R9 - portmanteau / word blend by overlapping a suffix of A with a prefix of B
function blend(a: string, b: string): string | null {
  const maxOverlap = Math.min(3, a.length - 2, b.length - 2);
  for (let len = maxOverlap; len >= 1; len--) {
    if (a.slice(-len) === b.slice(0, len)) return a + b.slice(len);
  }
  return null;
}
{
  const pool = [
    ...CHESS_FUNDAMENTALS.map((x) => x.w),
    ...CHESS_TERMS.map((x) => x.w),
    ...ACTION_WORDS,
    ...STRATEGY_STEMS,
    ...SUFFIXES,
  ];
  for (const a of pool) {
    for (const b of pool) {
      if (a === b) continue;
      const merged = blend(a, b);
      if (!merged) continue;
      add(merged, "R9", `blend(${a} ^ ${b})`, "portmanteau", `${a},${b}`);
    }
  }
}

// R10 - coined pronounceable words (method 8), seeded for reproducibility
{
  const onsets = [
    "b", "c", "ch", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "qu",
    "r", "s", "sh", "t", "th", "v", "w", "z", "br", "cl", "cr", "dr", "fl",
    "fr", "gl", "gr", "kl", "kr", "pl", "pr", "sk", "sl", "sn", "sp", "st",
    "tr", "vl", "zr", "tach", "zach", "vex", "kav",
  ];
  const nuclei = ["a", "e", "i", "o", "u", "ai", "ea", "ee", "oo", "ou", "ia", "au"];
  const codas = [
    "", "", "l", "m", "n", "r", "s", "t", "x", "ck", "d", "k", "p", "sh",
    "st", "nk", "sk", "zz", "tt", "que",
  ];
  const rng = mulberry32(CONFIG.coinedSeed);
  let attempts = 0;
  while (attempts < CONFIG.coinedAttempts) {
    attempts++;
    const syllables = 2 + Math.floor(rng() * 2); // 2 or 3 syllables
    let word = "";
    for (let i = 0; i < syllables; i++) {
      const onset = onsets[Math.floor(rng() * onsets.length)];
      const nucleus = nuclei[Math.floor(rng() * nuclei.length)];
      const coda = codas[Math.floor(rng() * codas.length)];
      const syl = onset + nucleus + coda;
      if (i === syllables - 1 || !/[aeiou]{2}$/.test(word + onset)) word += syl;
    }
    if (word.length >= CONFIG.tierAMin && word.length <= CONFIG.tierBMax) {
      add(word, "R10", `coined(seed=${CONFIG.coinedSeed}, attempt=${attempts})`, "coined-word", "prng");
    }
  }
}

// ---------------------------------------------------------------------------
// Heuristics: pronunciation / spelling / relevance / distinctiveness
// ---------------------------------------------------------------------------

const VOWELS = new Set(["a", "e", "i", "o", "u", "y"]);
const AWKWARD_START_BIGRAMS = ["gn", "kn", "pn", "ps", "mn", "ts", "cz", "sz", "jz", "vz", "xz", "zx", "qv", "vq", "jq", "qj", "jx", "vx", "kx"];
const CONFUSING_BIGRAMS = ["gh", "ph", "ps", "kn", "gn", "cq", "qk", "xz", "zh", "jj", "vv", "zz"];

/**
 * Coined words are pure synthesis, so they need an extra plausibility gate: every
 * adjacent letter pair must occur somewhere in ordinary English. A name made of
 * English-plausible bigrams is far more likely to be spelled correctly after being
 * heard once than one containing pairs like "dp" or "xk" that English never uses.
 *
 * The allowed set is *derived*, not hand-listed: it is the union of bigrams found
 * in the word families above plus this list of common English words. Keeping it
 * derived means the rule is auditable rather than a magic list.
 */
const COMMON_ENGLISH_WORDS = [
  "about", "above", "across", "action", "active", "add", "after", "again",
  "against", "age", "air", "all", "almost", "along", "already", "also",
  "always", "among", "amount", "ancient", "and", "animal", "another", "answer",
  "any", "appear", "apple", "area", "around", "arrive", "art", "ask", "attack",
  "author", "auto", "avoid", "away", "baby", "back", "bad", "balance", "ball",
  "bank", "base", "basic", "battle", "beach", "beauty", "because", "become",
  "before", "begin", "behind", "believe", "below", "bench", "best", "better",
  "between", "beyond", "bicycle", "big", "bill", "bird", "black", "blank",
  "block", "blue", "board", "boat", "body", "bone", "book", "boost", "border",
  "born", "both", "bottle", "box", "brain", "branch", "brave", "bread",
  "break", "breeze", "bridge", "bright", "bring", "broad", "brother", "brown",
  "brush", "budget", "build", "bunch", "burn", "business", "busy", "buy",
  "cabin", "cable", "calm", "camera", "camp", "canal", "cancel", "candle",
  "canvas", "capital", "capture", "card", "care", "career", "cargo", "carry",
  "cart", "case", "cash", "castle", "casual", "catch", "cause", "cell",
  "center", "central", "century", "certain", "chain", "chair", "chalk",
  "chance", "change", "channel", "chapter", "charge", "chart", "chase",
  "cheap", "check", "cheer", "chemist", "cherry", "chess", "chest", "chief",
  "child", "china", "choice", "choose", "circle", "citizen", "city", "civil",
  "claim", "clash", "class", "clean", "clear", "clever", "click", "client",
  "cliff", "climb", "clinic", "clock", "close", "cloth", "cloud", "club",
  "cluster", "coach", "coast", "coat", "code", "coffee", "cold", "collect",
  "college", "color", "column", "combine", "come", "comfort", "command",
  "comment", "common", "company", "compare", "compete", "complete", "complex",
  "compute", "concert", "condition", "conduct", "confirm", "connect",
  "consider", "contact", "contain", "content", "contest", "context",
  "continue", "contract", "control", "convert", "cook", "cool", "copper",
  "copy", "core", "corner", "correct", "cost", "cotton", "council", "count",
  "country", "county", "couple", "course", "court", "cover", "craft", "crash",
  "crazy", "cream", "create", "credit", "crew", "cricket", "crime", "crisis",
  "critical", "crop", "cross", "crowd", "crown", "crucial", "cruel", "crush",
  "crystal", "cube", "culture", "curious", "current", "curve", "custom",
  "cycle", "daily", "damage", "dance", "danger", "dare", "dark", "data",
  "date", "dawn", "deal", "dear", "debate", "decade", "decide", "declare",
  "decline", "decor", "deep", "defeat", "defend", "define", "degree",
  "delay", "deliver", "demand", "demon", "dense", "deny", "depart", "depend",
  "deploy", "depth", "derive", "describe", "desert", "design", "desk",
  "despite", "destroy", "detail", "detect", "develop", "device", "devote",
  "diagram", "dial", "diamond", "diary", "diet", "differ", "digital", "dine",
  "direct", "dirt", "disaster", "disc", "discover", "discuss", "disease",
  "dish", "dismiss", "display", "distance", "distinct", "district", "divide",
  "doctor", "document", "dog", "dollar", "domain", "domestic", "dominant",
  "door", "double", "doubt", "dozen", "draft", "drag", "drama", "draw",
  "dream", "dress", "drift", "drink", "drive", "drop", "drug", "drum", "dry",
  "dual", "during", "dust", "duty", "each", "eager", "early", "earn", "earth",
  "ease", "east", "easy", "echo", "economy", "edge", "edit", "educate",
  "effect", "effort", "eight", "either", "elect", "element", "elite", "else",
  "email", "embark", "emerge", "emotion", "empire", "employ", "empty",
  "enable", "enact", "end", "endure", "enemy", "energy", "engage", "engine",
  "enhance", "enjoy", "enormous", "enough", "enrich", "ensure", "enter",
  "entire", "entity", "entry", "envelope", "equal", "equip", "era", "error",
  "escape", "essay", "essence", "establish", "estate", "estimate", "ethics",
  "even", "event", "eventual", "ever", "every", "evidence", "evolve", "exact",
  "example", "exceed", "excel", "except", "excess", "exchange", "excite",
  "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exist",
  "exit", "expand", "expect", "expense", "expert", "explain", "explore",
  "export", "expose", "express", "extend", "extent", "external", "extra",
  "extreme", "eye", "fabric", "face", "facility", "factor", "factory",
  "faculty", "fade", "fail", "fair", "faith", "fall", "false", "fame",
  "familiar", "family", "famous", "fan", "fancy", "fantasy", "far", "farm",
  "fashion", "fast", "fatal", "fate", "father", "fault", "favor", "fear",
  "feature", "federal", "fee", "feed", "feel", "fellow", "female", "fence",
  "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "fierce",
  "fight", "figure", "file", "fill", "film", "filter", "final", "finance",
  "find", "fine", "finger", "finish", "fire", "firm", "first", "fish", "fit",
  "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "fleet",
  "flexible", "flight", "float", "flood", "floor", "flour", "flow", "flower",
  "fluid", "flush", "focus", "fold", "folk", "follow", "food", "fool", "foot",
  "force", "forest", "forge", "forget", "fork", "form", "formal", "format",
  "former", "formula", "fortune", "forum", "forward", "foster", "found",
  "four", "frame", "free", "freeze", "frequent", "fresh", "friend", "fright",
  "front", "fruit", "fuel", "full", "fun", "function", "fund", "funny",
  "furnish", "future", "gain", "galaxy", "gallery", "game", "gap", "garden",
  "gas", "gate", "gather", "gauge", "gear", "gender", "gene", "general",
  "generate", "generous", "genius", "gentle", "genuine", "gesture", "ghost",
  "giant", "gift", "gigantic", "girl", "give", "glad", "glance", "glass",
  "glide", "global", "glory", "glove", "glow", "goal", "god", "gold", "golf",
  "good", "govern", "grab", "grace", "grade", "grain", "grand", "grant",
  "graph", "grasp", "grass", "grave", "great", "green", "greet", "grid",
  "grief", "grin", "grip", "gross", "ground", "group", "grow", "growth",
  "guard", "guess", "guest", "guide", "guilt", "guitar", "habit", "hair",
  "half", "hall", "halt", "hand", "handle", "hang", "happen", "happy",
  "harbor", "hard", "harm", "harsh", "harvest", "hat", "hate", "haul",
  "haunt", "have", "hazard", "head", "heal", "health", "heap", "hear",
  "heart", "heat", "heaven", "heavy", "heel", "height", "hell", "hello",
  "help", "hence", "herb", "here", "hero", "hide", "high", "highlight",
  "highway", "hill", "hint", "hip", "hire", "history", "hit", "hold", "hole",
  "holiday", "holy", "home", "honest", "honey", "honor", "hook", "hope",
  "horizon", "horror", "horse", "hospital", "host", "hot", "hotel", "hour",
  "house", "housing", "hub", "huge", "human", "humble", "humor", "hundred",
  "hunger", "hunt", "hurry", "hurt", "husband", "ice", "icon", "idea",
  "ideal", "identify", "idle", "ignore", "ill", "illegal", "image", "imagine",
  "impact", "imply", "import", "impose", "impossible", "impress", "improve",
  "inch", "include", "income", "increase", "indeed", "index", "indicate",
  "indoor", "industry", "infant", "inform", "initial", "inject", "injury",
  "inland", "inner", "innocent", "input", "inquiry", "insane", "insect",
  "insert", "inside", "insight", "insist", "inspect", "inspire", "install",
  "instance", "instant", "instead", "instinct", "institute", "instruct",
  "insult", "insure", "intact", "intake", "integer", "intend", "intense",
  "interest", "interior", "internal", "internet", "interval", "intimate",
  "invade", "invent", "invest", "invite", "involve", "iron", "island",
  "isolate", "issue", "item", "jacket", "jail", "jam", "jazz", "jeans",
  "jelly", "jewel", "job", "join", "joint", "joke", "journal", "journey",
  "joy", "judge", "juice", "jump", "jungle", "junior", "jury", "just",
  "keen", "keep", "key", "kick", "kid", "kill", "kind", "king", "kiss",
  "kitchen", "knee", "knife", "knight", "knock", "knot", "know", "lab",
  "label", "labor", "lace", "lack", "ladder", "lady", "lake", "lamp", "land",
  "landscape", "lane", "language", "lap", "large", "laser", "last", "late",
  "later", "laugh", "launch", "law", "lawn", "lawsuit", "lay", "layer",
  "lazy", "lead", "leader", "leaf", "league", "lean", "leap", "learn",
  "lease", "least", "leather", "leave", "lecture", "left", "leg", "legacy",
  "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "lesson",
  "letter", "level", "liberty", "library", "license", "life", "lift",
  "light", "like", "limb", "limit", "line", "link", "lion", "liquid", "list",
  "listen", "liter", "little", "live", "load", "loan", "lobby", "local",
  "locate", "lock", "logic", "lonely", "long", "look", "loop", "loose",
  "lord", "lose", "loss", "lost", "lot", "loud", "love", "low", "lower",
  "loyal", "luck", "lucky", "luggage", "lunch", "lung", "luxury", "machine",
  "mad", "magic", "magnet", "mail", "main", "major", "make", "male", "mall",
  "manage", "manner", "manual", "many", "map", "maple", "marble", "march",
  "margin", "marine", "mark", "market", "marriage", "marry", "mask", "mass",
  "massive", "master", "match", "mate", "material", "math", "matter",
  "maximum", "maybe", "mayor", "meal", "mean", "meaning", "measure", "meat",
  "medal", "media", "medical", "medium", "meet", "melon", "member", "memory",
  "ment", "mention", "menu", "mercy", "mere", "merge", "merit", "merry",
  "mesh", "message", "metal", "method", "middle", "might", "mild", "mile",
  "military", "milk", "mill", "mind", "mine", "mineral", "minimal", "minor",
  "mint", "minute", "mirror", "miss", "mission", "mistake", "mix", "mixture",
  "mobile", "mode", "model", "moderate", "modern", "modify", "module",
  "moment", "money", "monitor", "month", "mood", "moon", "moral", "more",
  "morning", "mosque", "most", "mother", "motor", "mountain", "mouse",
  "mouth", "move", "movie", "much", "mud", "multiple", "murder", "muscle",
  "museum", "music", "must", "mutual", "myself", "mystery", "nail", "naive",
  "naked", "name", "narrow", "nation", "native", "natural", "nature", "naval",
  "near", "neat", "neck", "need", "negative", "neglect", "neighbor",
  "neither", "nerve", "nest", "net", "network", "neutral", "never", "new",
  "news", "next", "nice", "night", "noble", "noise", "nominee", "none",
  "noon", "normal", "north", "nose", "not", "note", "nothing", "notice",
  "notion", "novel", "now", "nuclear", "number", "nurse", "object",
  "oblige", "observe", "obtain", "obvious", "occasion", "occupy", "occur",
  "ocean", "odd", "offer", "office", "often", "oil", "okay", "old", "olive",
  "omit", "once", "one", "onion", "online", "only", "open", "opera",
  "operate", "opinion", "oppose", "option", "orange", "orbit", "orchard",
  "order", "ordinary", "organ", "orient", "origin", "other", "ounce", "out",
  "outcome", "outdoor", "outer", "output", "outside", "oval", "oven", "over",
  "overall", "own", "owner", "oxygen", "pace", "pack", "package", "pact",
  "page", "pain", "paint", "pair", "palace", "pale", "palm", "panel", "panic",
  "paper", "parade", "parent", "park", "parrot", "part", "particle",
  "partner", "party", "pass", "passage", "passion", "past", "pastel",
  "patch", "path", "patient", "pattern", "pause", "pave", "payment", "peace",
  "peak", "pear", "pearl", "peasant", "peculiar", "pedal", "peel", "peer",
  "pen", "penalty", "pencil", "people", "pepper", "per", "perfect", "perform",
  "period", "permit", "person", "pet", "phase", "phone", "photo", "phrase",
  "physical", "piano", "pick", "picture", "piece", "pig", "pigeon", "pile",
  "pilot", "pine", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza",
  "place", "plain", "plan", "plane", "planet", "plant", "plastic", "plate",
  "platform", "play", "player", "plead", "please", "pledge", "plenty", "plot",
  "plug", "plunge", "plus", "pocket", "poem", "poet", "point", "polar",
  "pole", "police", "policy", "polish", "polite", "political", "poll",
  "pond", "pool", "poor", "pop", "popular", "population", "porch", "port",
  "portion", "portrait", "pose", "position", "positive", "possible", "post",
  "potato", "potential", "pound", "pour", "poverty", "powder", "power",
  "practical", "practice", "praise", "pray", "precise", "predict", "prefer",
  "prepare", "present", "preserve", "press", "pressure", "pretty", "prevent",
  "price", "pride", "priest", "primary", "prime", "prince", "principal",
  "principle", "print", "prior", "priority", "prison", "private", "prize",
  "problem", "process", "produce", "product", "profession", "profit",
  "program", "progress", "project", "promise", "promote", "prompt" ,
  "proof", "proper", "property", "proposal", "propose", "prospect",
  "protect", "protein", "protest", "proud", "prove", "provide", "province",
  "public", "publish", "pull", "pulse", "pump", "punch", "punish", "pupil",
  "purchase", "pure", "purple", "purpose", "purse", "pursue", "push", "put",
  "puzzle", "quality", "quantity", "quarter", "queen", "question", "quick",
  "quiet", "quit", "quite", "quote", "rabbit", "race", "rack", "radar",
  "radical", "radio", "rail", "rain", "raise", "rally", "ranch", "random",
  "range", "rank", "rapid", "rare", "rate", "rather", "ratio", "rat", "raw",
  "reach", "react", "read", "ready", "real", "reason", "rebuild", "recall",
  "receive", "recent", "recipe", "record", "recover", "recruit", "reduce",
  "refer", "reflect", "reform", "refuse", "regard", "region", "register",
  "regret", "regular", "reject", "relate", "relax", "release", "relief",
  "rely", "remain", "remark", "remedy", "remember", "remind", "remote",
  "remove", "render", "renew", "rent", "repair", "repeat", "replace",
  "report", "rescue", "resemble", "reserve", "resist", "resolve", "resort",
  "resource", "respect", "respond", "rest", "restore", "result", "retain",
  "retire", "retreat", "return", "reveal", "revenue", "reverse", "review",
  "revise", "revolt", "reward", "rhythm", "rib", "ribbon", "rice", "rich",
  "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "rise",
  "risk", "ritual", "river", "road", "roast", "rob", "robot", "rock",
  "rocket", "role", "roll", "roof", "rook", "room", "root", "rope", "rose",
  "rotate", "rough", "round", "route", "routine", "row", "royal", "rub",
  "rubber", "rude", "rug", "rule", "run", "rural", "rush", "rust", "sad",
  "safe", "sail", "salad", "salary", "sale", "salt", "same", "sample",
  "sand", "satellite", "satisfy", "sauce", "save", "scale", "scan", "scare",
  "scatter", "scene", "scheme", "school", "science", "scope", "score",
  "scout", "scrap", "screen", "script", "scrub", "sculpture", "sea",
  "search", "season", "seat", "second", "secret", "section", "sector",
  "secure", "seed", "seek", "seem", "segment", "select", "self", "sell",
  "seminar", "senior", "sense", "sentence", "separate", "sequence",
  "series", "serious", "serve", "service", "session", "settle", "severe",
  "shade", "shadow", "shake", "shall", "shame", "shape", "share", "sharp",
  "shave", "shed", "sheep", "sheet", "shelf", "shell", "shelter", "shift",
  "shine", "ship", "shirt", "shock", "shoe", "shoot", "shop", "shore",
  "short", "should", "shoulder", "shout", "show", "shower", "shrimp",
  "shrink", "shrug", "shuttle", "sibling", "sick", "side", "siege", "sight",
  "sign", "signal", "silent", "silk", "silly", "silver", "similar",
  "simple", "since", "sing", "sink", "sir", "sister", "sit", "site",
  "situation", "six", "size", "sketch", "ski", "skill", "skin", "skip",
  "skirt", "skull", "skill", "slab", "slam", "slave", "sleep", "slice",
  "slide", "slight", "slim", "slogan", "slope", "slot", "slow", "small",
  "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "snow",
  "soap", "soccer", "social", "sock", "soda", "soft", "software", "soil",
  "solar", "soldier", "solid", "solution", "solve", "some", "song", "soon",
  "sorry", "sort", "soul", "sound", "soup", "source", "south", "space",
  "spare", "spark", "speak", "special", "species", "specific", "speech",
  "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin",
  "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray",
  "spread", "spring", "sprout", "square", "squeeze", "stable", "stack",
  "stadium", "staff", "stage", "stain", "stair", "stake", "stamp", "stand",
  "staple", "star", "stare", "start", "state", "station", "status", "stay",
  "steady", "steak", "steal", "steam", "steel", "steep", "steer", "stem",
  "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone",
  "stool", "stop", "storage", "store", "storm", "story", "stove", "straight",
  "strain", "strange", "strategy", "straw", "stream", "street", "strength",
  "stress", "stretch", "strike", "string", "strip", "stroke", "strong",
  "struggle", "student", "studio", "study", "stuff", "stumble", "stun",
  "style", "subject", "submit", "subsidy", "substance", "suburb", "succeed",
  "success", "such", "sudden", "suffer", "sugar", "suggest", "suit",
  "summer", "summit", "sun", "super", "supply", "support", "suppose",
  "sure", "surface", "surgery", "surprise", "surround", "survey", "survive",
  "suspect", "sustain", "swallow", "swamp", "swap", "swear", "sweat",
  "sweep", "sweet", "swell", "swift", "swim", "swing", "switch", "sword",
  "symbol", "system", "table", "tablet", "tackle", "tag", "tail", "take",
  "tale", "talent", "talk", "tall", "tank", "tape", "target", "task",
  "taste", "tattoo", "tax", "tea", "teach", "team", "tear", "tease",
  "technical", "technique", "teen", "telephone", "telescope", "tell",
  "temper", "temple", "tempo", "temporary", "tenant", "tend", "tender",
  "tennis", "tense", "tent", "term", "terrain", "terrible", "territory",
  "terror", "test", "text", "than", "thank", "that", "theater", "theme",
  "theory", "therapy", "there", "thermal", "these", "they", "thick",
  "thin", "thing", "think", "third", "thirst", "this", "thorn", "thorough",
  "those", "though", "thought", "thread", "threat", "three", "thresh",
  "thrill", "thrive", "throat", "throne", "through", "throw", "thumb",
  "thunder", "thus", "ticket", "tide", "tidy", "tie", "tiger", "tight",
  "tile", "tilt", "timber", "time", "tiny", "tip", "tire", "tissue",
  "title", "toast", "tobacco", "today", "toe", "together", "toilet",
  "token", "tolerance", "tomato", "tomorrow", "tone", "tongue", "tonight",
  "tool", "tooth", "top", "topic", "torch", "total", "touch", "tough",
  "tour", "tourist", "toward", "tower", "town", "toy", "trace", "track",
  "trade", "traffic", "tragedy", "trail", "train", "transfer", "transform",
  "transit", "translate", "transport", "trap", "travel", "tray", "treat",
  "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip",
  "trophy", "tropical", "trouble", "truck", "true", "truly", "trumpet",
  "trust", "truth", "try", "tube", "tune", "tunnel", "turn", "twelve",
  "twenty", "twice", "twin", "twist", "type", "typical", "ugly",
  "ultimate", "unable", "uncle", "under", "undergo", "understand",
  "uniform", "union", "unique", "unit", "universe", "unknown", "unlike",
  "unusual", "update", "upgrade", "uphold", "upon", "upper", "upset",
  "urban", "urge", "usage", "use", "useful", "usual", "utility", "vacant",
  "vacuum", "vague", "valid", "valley", "value", "valve", "vanish",
  "vapor", "variety", "various", "vary", "vast", "vehicle", "velvet",
  "vendor", "venture", "venue", "verb", "verify", "version", "versus",
  "vertical", "vessel", "veteran", "viable", "vibrant", "vice", "victim",
  "victory", "video", "view", "village", "vintage", "vinyl", "violate",
  "violent", "virtual", "virtue", "virus", "visible", "vision", "visit",
  "visual", "vital", "vivid", "vocal", "voice", "volcano", "volume",
  "volunteer", "vote", "voyage", "wage", "wagon", "wait", "wake", "walk",
  "wall", "walnut", "wander", "want", "war", "warm", "warn", "wash",
  "waste", "watch", "water", "wave", "wealth", "weapon", "wear", "weather",
  "weave", "web", "wedding", "week", "weight", "weird", "welcome", "well",
  "west", "wet", "whale", "what", "wheat", "wheel", "when", "where",
  "whether", "which", "while", "whisper", "white", "whole", "whose",
  "wide", "widget", "width", "wife", "wild", "will", "win", "wind",
  "window", "wine", "wing", "winner", "winter", "wire", "wisdom", "wise",
  "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word",
  "work", "world", "worry", "worth", "would", "wound", "wrap", "wreck",
  "wrist", "write", "wrong", "yard", "year", "yellow", "yes", "yesterday",
  "yet", "yield", "yoga", "you", "young", "youth", "zebra", "zero", "zone",
  "zoom",
];

const ALLOWED_BIGRAMS: Set<string> = (() => {
  const words = [
    ...COMMON_ENGLISH_WORDS,
    ...CHESS_FUNDAMENTALS.map((x) => x.w),
    ...CHESS_TERMS.map((x) => x.w),
    ...ACTION_WORDS,
    ...STRATEGY_STEMS,
    ...SUFFIXES,
    ...PREFIXES,
  ];
  const set = new Set<string>();
  for (const w of words) {
    for (let i = 0; i < w.length - 1; i++) set.add(w.slice(i, i + 2));
  }
  return set;
})();

/** True when every adjacent letter pair in the word occurs in ordinary English. */
function hasPlausibleBigrams(s: string): boolean {
  for (let i = 0; i < s.length - 1; i++) {
    if (!ALLOWED_BIGRAMS.has(s.slice(i, i + 2))) return false;
  }
  return true;
}
const ONSETS = [
  "", "b", "c", "ch", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "ph",
  "qu", "r", "s", "sh", "t", "th", "v", "w", "wh", "y", "z", "bl", "br",
  "cl", "cr", "dr", "dw", "fl", "fr", "gl", "gr", "pl", "pr", "sc", "sh",
  "sk", "sl", "sm", "sn", "sp", "st", "sw", "tr", "tw", "thr", "sch", "scr",
  "shr", "spl", "spr", "str", "squ",
].sort((a, b) => b.length - a.length);

const CODAS = [
  "", "b", "ck", "d", "f", "g", "k", "l", "ld", "lf", "lk", "lm", "lt", "m",
  "mp", "n", "nd", "ng", "nk", "nt", "p", "r", "rd", "rk", "rl", "rm", "rn",
  "rt", "s", "sh", "sk", "sp", "st", "t", "th", "x", "z",
].sort((a, b) => b.length - a.length);

/**
 * Greedily segments a name into onset/nucleus/coda syllables.
 * Returns the syllable count, or null when no plausible segmentation exists.
 */
function segmentSyllables(s: string): number | null {
  let i = 0;
  let syllables = 0;
  while (i < s.length) {
    const onset = ONSETS.find((o) => s.startsWith(o, i));
    if (onset === undefined) return null;
    i += onset.length;
    if (i >= s.length) return null; // trailing consonants with no nucleus
    const nucleus = /^(?:eau|iou|[aeiou]{2}|[aeiouy])/.exec(s.slice(i));
    if (!nucleus) return null;
    i += nucleus[0].length;
    const coda = CODAS.find((c) => s.startsWith(c, i));
    if (coda === undefined) return null;
    i += coda.length;
    syllables++;
  }
  return syllables;
}

export type Heuristics = {
  charCount: number;
  tier: "A" | "B" | "out";
  syllableEstimate: number;
  pronounceability: number; // 0-15
  distinctiveness: number; // 0-20
  relevance: number; // 0-15
  preScore: number; // 0-50
  /** Longest word-family root contained in the name; drives shortlist diversity. */
  stem: string;
  flags: string[];
};

/** Vowel-consonant skeleton used for syllable estimation and pronounceability. */
function skeleton(s: string): string {
  return s
    .split("")
    .map((c) => (VOWELS.has(c) ? "V" : "C"))
    .join("");
}

function estimateSyllables(s: string): number {
  // Prefer the English-plausible segmentation; fall back to vowel-group counting.
  const segmented = segmentSyllables(s);
  if (segmented !== null) return segmented;
  let groups = 0;
  let prevVowel = false;
  for (const c of s) {
    const isV = VOWELS.has(c);
    if (isV && !prevVowel) groups++;
    prevVowel = isV;
  }
  if (groups > 1 && s.endsWith("e") && !s.endsWith("ee") && !s.endsWith("ie")) groups--;
  return Math.max(1, groups);
}

function longestConsonantRun(s: string): number {
  let best = 0;
  let run = 0;
  for (const c of s) {
    if (VOWELS.has(c)) run = 0;
    else {
      run++;
      best = Math.max(best, run);
    }
  }
  return best;
}

/** Max run of identical letters, e.g. "oo" = 2, "ttt" = 3. */
function longestRepeat(s: string): number {
  let best = 1;
  let run = 1;
  for (let i = 1; i < s.length; i++) {
    run = s[i] === s[i - 1] ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

function scorePronounceability(s: string, flags: string[]): number {
  let score = 15;
  const run = longestConsonantRun(s);
  const repeat = longestRepeat(s);
  const hasVowel = s.split("").some((c) => VOWELS.has(c));

  if (!hasVowel) {
    flags.push("no-vowel");
    return 0;
  }
  if (run >= 4) {
    score -= 6;
    flags.push(`consonant-run-${run}`);
  } else if (run === 3) {
    score -= 3;
    flags.push("consonant-run-3");
  }
  if (repeat >= 3) {
    score -= 6;
    flags.push(`repeat-letters-${repeat}`);
  }
  if (s.includes("q") && !s.includes("qu")) {
    score -= 5;
    flags.push("q-without-u");
  }
  for (const bg of AWKWARD_START_BIGRAMS) {
    if (s.startsWith(bg)) {
      score -= 3;
      flags.push(`awkward-start-${bg}`);
    }
  }
  const confusingCount = CONFUSING_BIGRAMS.filter((bg) => s.includes(bg)).length;
  if (confusingCount > 0) {
    score -= confusingCount;
    flags.push(`confusing-digraph-${confusingCount}`);
  }
  // A word that is mostly consonants is hard to say aloud.
  const vowelCount = s.split("").filter((c) => VOWELS.has(c)).length;
  const ratio = vowelCount / s.length;
  if (ratio < 0.25) {
    score -= 3;
    flags.push("vowel-poor");
  }
  // Cannot be broken into English-plausible syllables -> hard to spell by ear.
  const syllables = segmentSyllables(s);
  if (syllables === null) {
    score -= 7;
    flags.push("unsegmentable-syllables");
  } else if (syllables > 4) {
    score -= 2;
    flags.push(`syllable-heavy-${syllables}`);
  }
  // Ending on an unusual cluster is hard to spell after hearing it once.
  if (/(ckl|skl|xkl|vkl|tz|ks)$/.test(s)) {
    score -= 2;
    flags.push("awkward-ending");
  }
  // Rare letters are a spelling hazard when they cluster.
  const rare = (s.match(/[jqxzv]/g) ?? []).length;
  if (rare >= 3) {
    score -= 2;
    flags.push(`rare-letters-${rare}`);
  }
  if (s.length > 10) score -= 2;
  return Math.max(0, Math.min(15, score));
}

function scoreRelevance(s: string, category: string): number {
  const strong = [...CHESS_FUNDAMENTALS.filter((f) => f.strong), ...CHESS_TERMS.filter((f) => f.strong)].map((f) => f.w);
  const generic = [...CHESS_FUNDAMENTALS.filter((f) => !f.strong), ...CHESS_TERMS.filter((f) => !f.strong)].map((f) => f.w);
  const has = (list: string[]) => list.some((w) => w.length >= 3 && s.includes(w));

  if (has(strong)) return 15;
  if (s.includes("chess")) return 13;
  if (has(generic)) return 9;
  if (category === "action-skill" || has(ACTION_WORDS)) return 6;
  if (category === "strategy-calculation" || has(STRATEGY_STEMS)) return 5;
  if (category === "coined-word") return 3;
  return 2;
}

function scoreDistinctiveness(s: string, category: string, sources: string): number {
  let score = 0;
  const n = s.length;
  if (n <= 6) score += 8;
  else if (n <= 9) score += 6;
  else score += 3;

  // Coined and blended names are inherently more protectable than plain compounds.
  if (category === "coined-word") score += 6;
  else if (category === "portmanteau") score += 5;
  else if (category === "triple-word") score += 3;
  else score += 2;

  const syl = estimateSyllables(s);
  if (syl === 2 || syl === 3) score += 4;
  else if (syl === 1 || syl === 4) score += 2;

  // A name built from two very common words is less distinctive.
  const genericParts = ["chess", "play", "game", "board", "mind", "smart", "quick", "best"];
  const genericHits = genericParts.filter((p) => s.includes(p)).length;
  score -= genericHits;
  if (genericHits > 0 && sources.split(",").length > 1) score -= 1;

  // A "coined" word that accidentally swallowed a real word is a fake compound:
  // it reads as a misspelling rather than an invented brand.
  if (category === "coined-word") {
    const allWords = [
      ...CHESS_FUNDAMENTALS.map((x) => x.w),
      ...CHESS_TERMS.map((x) => x.w),
      ...ACTION_WORDS,
      ...STRATEGY_STEMS,
      ...SUFFIXES,
    ].filter((w) => w.length >= 3);
    if (allWords.some((w) => s.includes(w))) score -= 4;
  }

  return Math.max(0, Math.min(20, score));
}

function analyse(c: Candidate): Heuristics {
  const flags: string[] = [];
  const s = c.name;
  const charCount = s.length;
  const tier: "A" | "B" | "out" =
    charCount >= CONFIG.tierAMin && charCount <= CONFIG.tierAMax
      ? "A"
      : charCount >= CONFIG.tierBMin && charCount <= CONFIG.tierBMax
        ? "B"
        : "out";
  const pronounceability = scorePronounceability(s, flags);
  const relevance = scoreRelevance(s, c.category);
  const distinctiveness = scoreDistinctiveness(s, c.category, c.sources);
  const preScore = pronounceability + relevance + distinctiveness;
  return {
    charCount,
    tier,
    syllableEstimate: estimateSyllables(s),
    pronounceability,
    distinctiveness,
    relevance,
    preScore,
    stem: dominantStem(s),
    flags,
  };
}

const ALL_FAMILY_WORDS: string[] = [
  ...CHESS_FUNDAMENTALS.map((x) => x.w),
  ...CHESS_TERMS.map((x) => x.w),
  ...ACTION_WORDS,
  ...STRATEGY_STEMS,
  ...SUFFIXES,
];

/** Longest family word appearing in the name, used to spread the shortlist. */
function dominantStem(s: string): string {
  let best = "";
  for (const w of ALL_FAMILY_WORDS) {
    if (w.length > best.length && s.includes(w)) best = w;
  }
  return best || "none";
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export type Scored = Candidate & Heuristics;

function isBlocked(name: string): string | null {
  for (const sub of BLOCKED_SUBSTRINGS) {
    if (name.includes(sub)) return `blocked-substring:${sub}`;
  }
  if (BLOCKED_EXACT.has(name)) return `blocked-exact:${name}`;
  if (RISKY_MEANING_EXACT.has(name)) return `risky-meaning:${name}`;
  if (EXISTING_CHESS_BRANDS.includes(name)) return `existing-chess-brand:${name}`;
  if (EXISTING_SOFTWARE_BRANDS.includes(name)) return `existing-software-brand:${name}`;
  if (MISSPELLING_TRAPS.includes(name)) return `misspelling-trap:${name}`;
  return null;
}

const scored: Scored[] = [];
const rejected: Array<{ name: string; reason: string }> = [];

for (const c of candidates.values()) {
  const h = analyse(c);
  if (h.tier === "out") {
    rejected.push({ name: c.name, reason: `length-out-of-range:${h.charCount}` });
    continue;
  }
  const blocked = isBlocked(c.name);
  if (blocked) {
    rejected.push({ name: c.name, reason: blocked });
    continue;
  }
  if (h.pronounceability < 8) {
    rejected.push({ name: c.name, reason: `low-pronounceability:${h.pronounceability}` });
    continue;
  }
  // Coined words carry extra risk: they must be long enough to feel like a brand
  // rather than a fragment, and must be built from English-plausible letter pairs.
  if (c.category === "coined-word") {
    if (c.name.length < CONFIG.coinedMinLength) {
      rejected.push({ name: c.name, reason: `coined-too-short:${c.name.length}` });
      continue;
    }
    if (!hasPlausibleBigrams(c.name)) {
      rejected.push({ name: c.name, reason: "coined-implausible-bigrams" });
      continue;
    }
  }
  if (h.relevance <= 2 && h.tier === "B") {
    rejected.push({ name: c.name, reason: "tier-b-and-irrelevant" });
    continue;
  }
  scored.push({ ...c, ...h });
}

// ---------------------------------------------------------------------------
// Shortlisting: rank by pre-score, then enforce category diversity
// ---------------------------------------------------------------------------

scored.sort(
  (a, b) =>
    b.preScore - a.preScore ||
    b.pronounceability - a.pronounceability ||
    b.distinctiveness - a.distinctiveness ||
    a.charCount - b.charCount ||
    a.name.localeCompare(b.name),
);

function buildShortlist(): Scored[] {
  const perCategory = new Map<string, number>();
  const perRule = new Map<string, number>();
  const perStem = new Map<string, number>();
  const out: Scored[] = [];
  // Three passes, each relaxing one cap, so the shortlist spans the design space
  // first and only then backfills to reach the requested size:
  //   pass 1 - respect category + rule + stem caps
  //   pass 2 - respect category + stem caps
  //   pass 3 - respect category cap only
  const MAX_PER_RULE = 18;
  const MAX_PER_STEM = 6;
  for (const pass of [1, 2, 3] as const) {
    for (const s of scored) {
      if (out.length >= CONFIG.shortlistSize) break;
      if (out.includes(s)) continue;
      const catCount = perCategory.get(s.category) ?? 0;
      const ruleCount = perRule.get(s.rule) ?? 0;
      const stemCount = perStem.get(s.stem) ?? 0;
      const catCap = CONFIG.noisyCategories.includes(s.category)
        ? CONFIG.maxPerNoisyCategoryInShortlist
        : CONFIG.maxPerCategoryInShortlist;
      if (catCount >= catCap) continue;
      if (pass <= 2 && stemCount >= MAX_PER_STEM) continue;
      if (pass === 1 && ruleCount >= MAX_PER_RULE) continue;
      out.push(s);
      perCategory.set(s.category, catCount + 1);
      perRule.set(s.rule, ruleCount + 1);
      perStem.set(s.stem, stemCount + 1);
    }
  }
  return out;
}

const shortlist = buildShortlist();

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: string[][], header: string[]): string {
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
}

mkdirSync(OUT_DIR, { recursive: true });

const CANDIDATE_HEADER = [
  "candidate", "char_count", "tier", "generation_rule", "generation_detail",
  "naming_category", "word_sources", "syllables_estimate", "pronounceability_15",
  "distinctiveness_20", "relevance_15", "pre_score_50", "heuristic_flags",
];
const candidateRows = scored.map((s) => [
  s.name, String(s.charCount), s.tier, s.rule, s.ruleDetail, s.category,
  s.sources, String(s.syllableEstimate), String(s.pronounceability),
  String(s.distinctiveness), String(s.relevance), String(s.preScore),
  s.flags.join("|"),
]);
writeFileSync(join(OUT_DIR, "all-candidates.csv"), toCsv(candidateRows, CANDIDATE_HEADER), "utf8");

const shortlistRows = shortlist.map((s, i) => [
  String(i + 1), s.name, String(s.charCount), s.tier, s.rule, s.ruleDetail,
  s.category, String(s.syllableEstimate), String(s.pronounceability),
  String(s.distinctiveness), String(s.relevance), String(s.preScore),
]);
writeFileSync(
  join(OUT_DIR, "shortlist-100.csv"),
  toCsv(shortlistRows, [
    "rank", "candidate", "char_count", "tier", "generation_rule",
    "generation_detail", "naming_category", "syllables_estimate",
    "pronounceability_15", "distinctiveness_20", "relevance_15", "pre_score_50",
  ]),
  "utf8",
);

const byRule: Record<string, number> = {};
const byCategory: Record<string, number> = {};
const byTier: Record<string, number> = {};
for (const s of scored) {
  byRule[s.rule] = (byRule[s.rule] ?? 0) + 1;
  byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
  byTier[s.tier] = (byTier[s.tier] ?? 0) + 1;
}

writeFileSync(
  join(OUT_DIR, "generation-stats.json"),
  JSON.stringify(
    {
      config: CONFIG,
      rules: {
        R1: "concat(fundamental + action) - two complete words",
        R2: "concat(action + fundamental) - reversed two complete words",
        R3: "triple(short + short + short) - three short words within char limit",
        R4: "suffix(fundamental + brandable suffix)",
        R5: "term-suffix(chess term beyond 'chess' + brandable suffix)",
        R6: "action-suffix(action/skill word + brandable suffix)",
        R7: "strategy-suffix(strategy/calculation stem + brandable suffix)",
        R8: "prefix(meaningful prefix + word)",
        R9: "blend(overlapping portmanteau merge)",
        R10: "coined(seeded pronounceable syllable synthesis)",
      },
      rawGenerated: candidates.size,
      afterFilters: scored.length,
      rejected: rejected.length,
      shortlist: shortlist.length,
      byRule,
      byCategory,
      byTier,
      rejectionsByReason: rejected.reduce<Record<string, number>>((acc, r) => {
        const key = r.reason.split(":")[0];
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

console.log(`raw candidates generated : ${candidates.size}`);
console.log(`surviving after filters  : ${scored.length}`);
console.log(`rejected                 : ${rejected.length}`);
console.log(`shortlist                : ${shortlist.length}`);
console.log(`tier split               :`, byTier);
console.log(`by category              :`, byCategory);
console.log(`by rule                  :`, byRule);
console.log(`\ntop 25 of shortlist:`);
for (const s of shortlist.slice(0, 25)) {
  console.log(
    `  ${String(s.name).padEnd(13)} ${s.charCount}ch  pre=${String(s.preScore).padStart(2)}  ${s.category.padEnd(26)} ${s.ruleDetail}`,
  );
}
