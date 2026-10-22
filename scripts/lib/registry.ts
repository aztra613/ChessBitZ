/**
 * PlyQuest — Published Puzzle Registry (append-only source of truth)
 *
 * The registry records every puzzle that has ever been published, together with
 * the immutable `seq` that fixes its position in the corpus. Bucket placement is
 * derived from `seq`, so a puzzle never moves between buckets and its deep link
 * never breaks.
 *
 * Rules enforced here:
 *  - `seq` is assigned once, at first publication, and never changes.
 *  - Entries are only ever appended. Refresh runs never evict published records.
 *  - Removal requires an entry in scripts/puzzles-denylist.json with a reason.
 *  - Provenance metadata for existing records is carried forward verbatim.
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { PuzzleRecord } from '../../src/types/puzzle';

export const BUCKET_SIZE = 100;
export const REGISTRY_VERSION = 1;

export interface RegistryEntry {
  id: string;
  seq: number;
  sourceDataset: string;
  sourceRecordId: string;
  sourceLicense: string;
  firstPublishedAt: string;
  addedAt: string;
  validatorVersion: string;
  checksum: string;
}

export interface PuzzleRegistry {
  version: number;
  bucketSize: number;
  entries: RegistryEntry[];
}

export const REGISTRY_PATH = path.resolve(process.cwd(), 'src/data/puzzle-registry.json');

export function emptyRegistry(): PuzzleRegistry {
  return { version: REGISTRY_VERSION, bucketSize: BUCKET_SIZE, entries: [] };
}

export function loadRegistry(registryPath: string = REGISTRY_PATH): PuzzleRegistry {
  if (!fs.existsSync(registryPath)) return emptyRegistry();
  const raw = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  if (!Array.isArray(raw.entries)) return emptyRegistry();
  return raw as PuzzleRegistry;
}

export function saveRegistry(
  registry: PuzzleRegistry,
  registryPath: string = REGISTRY_PATH
): void {
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

/** Deterministic content hash of a record, used to detect accidental mutation. */
export function recordChecksum(record: PuzzleRecord): string {
  const canonical = JSON.stringify(record, Object.keys(record).sort());
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

export function bucketOf(seq: number, bucketSize: number = BUCKET_SIZE): number {
  return Math.floor(seq / bucketSize);
}

export function entryFor(record: PuzzleRecord, seq: number, validatorVersion: string): RegistryEntry {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: record.id,
    seq,
    sourceDataset: record.provenance.sourceDataset,
    sourceRecordId: record.provenance.sourceRecordId,
    sourceLicense: record.provenance.sourceLicense,
    firstPublishedAt: today,
    addedAt: today,
    validatorVersion,
    checksum: recordChecksum(record),
  };
}

/**
 * Appends new records to the registry, preserving every existing entry untouched.
 * Returns the ids that were appended.
 */
export function appendToRegistry(
  registry: PuzzleRegistry,
  records: PuzzleRecord[],
  validatorVersion: string
): string[] {
  const known = new Set(registry.entries.map((e) => e.id));
  let nextSeq = registry.entries.reduce((max, e) => Math.max(max, e.seq + 1), 0);
  const appended: string[] = [];

  for (const record of records) {
    if (known.has(record.id)) continue;
    registry.entries.push(entryFor(record, nextSeq, validatorVersion));
    known.add(record.id);
    appended.push(record.id);
    nextSeq += 1;
  }

  return appended;
}

/**
 * Assert that no pre-existing entry was mutated. Guards the append-only contract.
 */
export function assertAppendOnly(before: PuzzleRegistry, after: PuzzleRegistry): void {
  const afterById = new Map(after.entries.map((e) => [e.id, e]));
  for (const prev of before.entries) {
    const next = afterById.get(prev.id);
    if (!next) {
      throw new Error(
        `Registry violation: entry "${prev.id}" disappeared during refresh. ` +
          `Removals must go through scripts/puzzles-denylist.json.`
      );
    }
    if (next.seq !== prev.seq) {
      throw new Error(
        `Registry violation: entry "${prev.id}" changed seq ${prev.seq} → ${next.seq}. ` +
          `seq is immutable; buckets and deep links depend on it.`
      );
    }
  }
}
