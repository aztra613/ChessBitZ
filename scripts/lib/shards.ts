/**
 * PlyQuest — Puzzle Shard Writer & Loader
 *
 * Shards are the runtime representation of the corpus: a lightweight manifest
 * index (enough for search, filters and counts with zero record loads) plus
 * bucket files holding full PuzzleRecord objects.
 *
 * Bucket placement is derived from the registry's immutable `seq`, so a record
 * never moves once published.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PuzzleRecord, TacticalTheme, DifficultyBand } from '../../src/types/puzzle';
import { PuzzleRegistry, bucketOf, BUCKET_SIZE } from './registry';

export const SHARDS_DIR = path.resolve(process.cwd(), 'public/puzzles');
export const MANIFEST_VERSION = 1;

export interface PuzzleIndexEntry {
  id: string;
  title: string;
  rating: number;
  difficultyBand: DifficultyBand;
  themes: TacticalTheme[];
  sideToMove: 'w' | 'b';
  bucket: number;
  /** Lets callers exclude derived variants without loading records. */
  transformType: string;
}

export interface PuzzleManifest {
  version: number;
  generatedAt: string;
  bucketSize: number;
  totalPuzzles: number;
  buckets: Array<{ id: number; count: number }>;
  index: PuzzleIndexEntry[];
  themeCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
}

function bucketFile(dir: string, id: number): string {
  return path.join(dir, `bucket-${String(id).padStart(3, '0')}.json`);
}

/** Reads every published record back out of the bucket files on disk. */
export function loadPublishedRecords(dir: string = SHARDS_DIR): Map<string, PuzzleRecord> {
  const records = new Map<string, PuzzleRecord>();
  if (!fs.existsSync(dir)) return records;

  for (const file of fs.readdirSync(dir)) {
    if (!/^bucket-\d{3}\.json$/.test(file)) continue;
    const bucket = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    for (const record of bucket.records as PuzzleRecord[]) {
      records.set(record.id, record);
    }
  }

  return records;
}

export function indexEntryFor(record: PuzzleRecord, bucket: number): PuzzleIndexEntry {
  return {
    id: record.id,
    title: record.title,
    rating: record.rating,
    difficultyBand: record.difficultyBand,
    themes: record.themes,
    sideToMove: record.sideToMove,
    bucket,
    transformType: record.provenance.transformType ?? 'none',
  };
}

export function buildManifest(
  recordsInSeqOrder: PuzzleRecord[],
  registry: PuzzleRegistry,
  bucketSize: number = BUCKET_SIZE
): PuzzleManifest {
  const index: PuzzleIndexEntry[] = recordsInSeqOrder.map((record, seq) =>
    indexEntryFor(record, bucketOf(seq, bucketSize))
  );

  const themeCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};

  for (const record of recordsInSeqOrder) {
    for (const theme of record.themes) {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }
    difficultyCounts[record.difficultyBand] = (difficultyCounts[record.difficultyBand] || 0) + 1;
  }

  const bucketCounts = new Map<number, number>();
  for (const entry of index) {
    bucketCounts.set(entry.bucket, (bucketCounts.get(entry.bucket) || 0) + 1);
  }

  return {
    version: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    bucketSize,
    totalPuzzles: recordsInSeqOrder.length,
    buckets: [...bucketCounts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([id, count]) => ({ id, count })),
    index,
    themeCounts,
    difficultyCounts,
  };
}

/**
 * Writes bucket files and the manifest. Records must already be in registry seq
 * order so bucket placement matches the manifest.
 */
export function writeShards(
  recordsInSeqOrder: PuzzleRecord[],
  registry: PuzzleRegistry,
  dir: string = SHARDS_DIR,
  bucketSize: number = BUCKET_SIZE
): PuzzleManifest {
  fs.mkdirSync(dir, { recursive: true });

  const buckets = new Map<number, PuzzleRecord[]>();
  recordsInSeqOrder.forEach((record, seq) => {
    const id = bucketOf(seq, bucketSize);
    if (!buckets.has(id)) buckets.set(id, []);
    buckets.get(id)!.push(record);
  });

  // Remove bucket files that are no longer needed so stale shards cannot be served.
  for (const file of fs.readdirSync(dir)) {
    if (!/^bucket-\d{3}\.json$/.test(file)) continue;
    const id = parseInt(file.slice(7, 10), 10);
    if (!buckets.has(id)) fs.unlinkSync(path.join(dir, file));
  }

  for (const [id, records] of buckets) {
    fs.writeFileSync(
      bucketFile(dir, id),
      JSON.stringify({ id, records }, null, 0) + '\n',
      'utf-8'
    );
  }

  const manifest = buildManifest(recordsInSeqOrder, registry, bucketSize);
  fs.writeFileSync(
    path.join(dir, 'manifest.json'),
    JSON.stringify(manifest, null, 0) + '\n',
    'utf-8'
  );

  return manifest;
}

/** Orders published records according to the registry's immutable seq values. */
export function orderByRegistry(
  records: Map<string, PuzzleRecord>,
  registry: PuzzleRegistry
): PuzzleRecord[] {
  const ordered: PuzzleRecord[] = [];
  for (const entry of [...registry.entries].sort((a, b) => a.seq - b.seq)) {
    const record = records.get(entry.id);
    if (!record) {
      throw new Error(
        `Registry entry "${entry.id}" has no record in the shards. ` +
          `The registry and bucket files are out of sync.`
      );
    }
    ordered.push(record);
  }
  return ordered;
}
