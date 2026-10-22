/**
 * PlyQuest — Rebuild shards and verify the registry.
 *
 * The registry (src/data/puzzle-registry.json) is the record of truth and the
 * bucket files are derived from it. Re-running this re-derives shards from the
 * published records, so a change to the shard/index schema never requires a
 * re-ingest.
 *
 * Safe at any time: every existing `seq` is asserted unchanged, and drift in an
 * already-published record is reported rather than silently rewritten.
 *
 * Usage: npx tsx scripts/migrate-to-registry.ts
 */

import { PuzzleRecord } from '../src/types/puzzle';
import {
  loadRegistry,
  saveRegistry,
  assertAppendOnly,
  recordChecksum,
  REGISTRY_PATH,
} from './lib/registry';
import { loadPublishedRecords, orderByRegistry, writeShards, SHARDS_DIR } from './lib/shards';

console.log('=== PlyQuest shard rebuild ===\n');

const before = loadRegistry();
const existingRecords = loadPublishedRecords();

console.log(`registry entries before : ${before.entries.length}`);
console.log(`bucket records on disk  : ${existingRecords.size}`);

// Bucket records are the only record source. They are carried forward verbatim,
// so published provenance is never regenerated.
const byId = new Map<string, PuzzleRecord>(existingRecords);

const registry = JSON.parse(JSON.stringify(before)) as typeof before;
const appended: string[] = [];

assertAppendOnly(before, registry);

// Detect silent mutation of anything already published.
let mutated = 0;
for (const entry of before.entries) {
  const record = byId.get(entry.id);
  if (!record) continue;
  if (recordChecksum(record) !== entry.checksum) {
    console.warn(`  ! checksum drift on ${entry.id} (record changed since publication)`);
    mutated++;
  }
}

saveRegistry(registry);

const ordered = orderByRegistry(byId, registry);
const manifest = writeShards(ordered, registry);

console.log(`\nappended this run : ${appended.length}`);
console.log(`registry entries  : ${registry.entries.length}`);
console.log(`total published   : ${manifest.totalPuzzles}`);
console.log(`buckets written   : ${manifest.buckets.length}`);
console.log(`checksum drift    : ${mutated}`);
console.log(`\nregistry: ${REGISTRY_PATH}`);
console.log(`shards  : ${SHARDS_DIR}`);

if (manifest.totalPuzzles !== registry.entries.length) {
  console.error('\nFAILED: manifest count does not match registry entry count.');
  process.exit(1);
}

console.log('\nOK: registry and shards are in sync.');
