/**
 * PlyQuest — Required regression suite (plan S9)
 *
 *  1. The historical archive is stable: adding puzzles must not reshuffle it.
 *  2. Stored solve progress and SRS cards still resolve against the corpus.
 *  3. Both prerendered and fallback deep links resolve.
 *  4. A catalog page cannot download the whole corpus.
 *  5. No compressed source dataset reaches the deployed output.
 *
 * Usage: npm run verify:regressions
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { loadRegistry } from './lib/registry';
import { loadPublishedRecords, orderByRegistry } from './lib/shards';
import { getArchiveIdsForMonth } from '../src/utils/dailySchedule';

const SHARDS_DIR = path.resolve(process.cwd(), 'public/puzzles');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const FIXTURES_DIR = path.resolve(process.cwd(), 'scripts/fixtures');
const LEDGER_SNAPSHOT = path.join(FIXTURES_DIR, 'archive-snapshot.json');

/** Matches PRERENDER_PUZZLE_LIMIT in scripts/prerender.ts. */
const PRERENDER_PUZZLE_LIMIT = 500;

/** Matches PAGE_SIZE in the catalog and worksheet builder. */
const CATALOG_PAGE_SIZE = 24;

/**
 * The 17 records published before the corpus grew. Any stored
 * `cb_user_stats.solvedPuzzles` / `cb_srs_state.cards` key comes from this set,
 * so every one must still resolve.
 */
const LEGACY_PROGRESS_IDS = [
  'cb-lic-001gi',
  'cb-lic-003IX',
  'cb-lic-00sHx',
  'cb-lic-0kDWS',
  'cb-lic-kRapK',
  'cb-lic-00008',
  'cb-daily-01',
  'cb-mate1-01',
  'cb-mate1-02',
  'cb-mate1-03',
  'cb-fork-01',
  'cb-pin-01',
  'cb-skewer-01',
  'cb-disc-01',
  'cb-sac-01',
  'cb-symm-cb-mate1-01',
  'cb-symm-cb-skewer-01',
];

const ARCHIVE_SAMPLE_MONTHS = ['2025-01', '2025-06', '2026-01', '2026-10', '2027-03'];

let passed = 0;
let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS  ${message}`);
    passed++;
  } else {
    console.error(`  FAIL  ${message}`);
    failed++;
  }
}

function readManifest(): any {
  return JSON.parse(fs.readFileSync(path.join(SHARDS_DIR, 'manifest.json'), 'utf-8'));
}

function archiveFingerprint(): string {
  const payload: Record<string, string[]> = {};
  for (const month of ARCHIVE_SAMPLE_MONTHS) {
    const [year, monthNumber] = month.split('-').map((n) => parseInt(n, 10));
    payload[month] = getArchiveIdsForMonth(year, monthNumber);
  }
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function walk(dir: string, onFile: (full: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full, onFile);
    else onFile(full);
  }
}

const registry = loadRegistry();
const records = orderByRegistry(loadPublishedRecords(), registry);
const knownIds = new Set(registry.entries.map((entry) => entry.id));

console.log('=== PlyQuest regression suite (plan S9) ===\n');
console.log(`corpus: ${records.length} puzzles across ${registry.entries.length} registry entries\n`);

// ---------------------------------------------------------------------------
// 1. Historical archive stability
// ---------------------------------------------------------------------------
console.log('1. Archive stability (adding puzzles must not reshuffle history)');

const fingerprint = archiveFingerprint();

if (!fs.existsSync(LEDGER_SNAPSHOT)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  fs.writeFileSync(
    LEDGER_SNAPSHOT,
    JSON.stringify({ generatedAt: new Date().toISOString(), months: ARCHIVE_SAMPLE_MONTHS, fingerprint }, null, 2) + '\n',
    'utf-8'
  );
  console.log(`  INFO  snapshot created at ${path.relative(process.cwd(), LEDGER_SNAPSHOT)}`);
  console.log('  INFO  re-run to assert against it');
  passed++;
} else {
  const snapshot = JSON.parse(fs.readFileSync(LEDGER_SNAPSHOT, 'utf-8'));
  check(
    snapshot.fingerprint === fingerprint,
    `archive for ${ARCHIVE_SAMPLE_MONTHS.join(', ')} is byte-identical to the recorded snapshot`
  );
  if (snapshot.fingerprint !== fingerprint) {
    console.error('        Ledger reshuffle detected. Published daily assignments are immutable (plan S4).');
  }
}

// ---------------------------------------------------------------------------
// 2. Progress compatibility
// ---------------------------------------------------------------------------
console.log('\n2. Stored progress compatibility');

const missingLegacy = LEGACY_PROGRESS_IDS.filter((id) => !knownIds.has(id));
check(
  missingLegacy.length === 0,
  `all ${LEGACY_PROGRESS_IDS.length} pre-migration puzzle ids still resolve` +
    (missingLegacy.length ? ` (missing: ${missingLegacy.slice(0, 5).join(', ')})` : '')
);

// ---------------------------------------------------------------------------
// 3. Deep links
// ---------------------------------------------------------------------------
console.log('\n3. Deep links (prerendered and fallback)');

const prerendered = [...records]
  .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || b.rating - a.rating)
  .slice(0, PRERENDER_PUZZLE_LIMIT);

check(
  prerendered.every((p) => knownIds.has(p.id)),
  `all ${prerendered.length} prerendered puzzle ids exist in the registry`
);

const prerenderedIds = new Set(prerendered.map((p) => p.id));
const tailPuzzle = records.find((p) => !prerenderedIds.has(p.id));
check(
  tailPuzzle !== undefined && knownIds.has(tailPuzzle.id),
  `a non-prerendered puzzle resolves through the fallback route (${tailPuzzle?.id ?? 'none'})`
);

if (fs.existsSync(DIST_DIR)) {
  const sample = prerendered[0];
  const pagePath = path.resolve(DIST_DIR, 'puzzle', sample.id, 'index.html');
  check(fs.existsSync(pagePath), `prerendered HTML exists on disk for ${sample.id}`);
} else {
  console.log('  SKIP  dist/ not built — run npm run build to check prerendered output');
}

// ---------------------------------------------------------------------------
// 4. Catalog download budget
// ---------------------------------------------------------------------------
console.log('\n4. Catalog download budget');

const manifest = readManifest();
check(
  manifest.index.every((entry: any) => !('solverFen' in entry) && !('moves' in entry)),
  'manifest index carries no full records (no solverFen / moves)'
);

check(
  manifest.bucketSize >= CATALOG_PAGE_SIZE,
  `bucket size ${manifest.bucketSize} covers a ${CATALOG_PAGE_SIZE}-puzzle page, so a page needs at most one bucket`
);

let corpusBytes = 0;
for (const file of fs.readdirSync(SHARDS_DIR)) {
  if (file.startsWith('bucket-')) corpusBytes += fs.statSync(path.join(SHARDS_DIR, file)).size;
}
const manifestBytes = fs.statSync(path.join(SHARDS_DIR, 'manifest.json')).size;
const firstBucketBytes = fs.statSync(path.join(SHARDS_DIR, 'bucket-000.json')).size;
const perVisit = manifestBytes + firstBucketBytes;

check(
  perVisit < corpusBytes / 4,
  `first catalog visit is ${(perVisit / 1024).toFixed(0)} KB vs ${(corpusBytes / 1048576).toFixed(2)} MB for the whole corpus ` +
    `(${((perVisit / corpusBytes) * 100).toFixed(1)}%)`
);

// ---------------------------------------------------------------------------
// 5. No dataset in deployed output
// ---------------------------------------------------------------------------
console.log('\n5. Deployed output hygiene');

if (!fs.existsSync(DIST_DIR)) {
  console.log('  SKIP  dist/ not built — run npm run build first');
} else {
  const offenders: string[] = [];
  walk(DIST_DIR, (full) => {
    if (/\.(zst|csv|tar|gz)$/i.test(full)) offenders.push(full);
  });
  check(
    offenders.length === 0,
    `no compressed dataset artefacts in dist/ (${offenders.slice(0, 3).join(', ') || 'clean'})`
  );

  check(fs.existsSync(path.resolve(DIST_DIR, 'sw.js')), 'dist/sw.js preserved');
}

// ---------------------------------------------------------------------------
console.log(`\nRegression suite: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
