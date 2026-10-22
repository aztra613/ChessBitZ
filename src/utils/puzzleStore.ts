/**
 * PlyQuest — Puzzle Store
 *
 * Async, cached access to the sharded puzzle corpus. Replaces the old pattern of
 * importing puzzle records into the JS bundle.
 *
 * Guarantees (plan S7):
 *  - The manifest alone satisfies search, filters and counts. Full records are
 *    only fetched for the buckets backing what is actually on screen.
 *  - In-flight promises are cached, so concurrent callers share one request
 *    instead of issuing duplicates.
 *  - `resetFetchCount`/`getFetchCount` make the "a catalog page must not
 *    download the whole corpus" regression test possible.
 */

import { PuzzleRecord, TacticalTheme, DifficultyBand } from '../types/puzzle';
import aliasData from '../data/puzzleIdAliases.json';

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

const BASE = import.meta.env.BASE_URL || '/';
const MANIFEST_URL = `${BASE}puzzles/manifest.json`;

function bucketUrl(id: number): string {
  return `${BASE}puzzles/bucket-${String(id).padStart(3, '0')}.json`;
}

const aliases = aliasData.aliases as Record<string, string>;

let manifestPromise: Promise<PuzzleManifest> | null = null;
let manifestCache: PuzzleManifest | null = null;
const indexById = new Map<string, PuzzleIndexEntry>();
const bucketCache = new Map<number, PuzzleRecord[]>();
const bucketPromises = new Map<number, Promise<PuzzleRecord[]>>();

let fetchCount = 0;

/** Number of network requests issued. Used by regression tests. */
export function getFetchCount(): number {
  return fetchCount;
}

export function resetFetchCount(): void {
  fetchCount = 0;
}

/** Resolves a retired id to its current one, if a rename was ever recorded. */
export function resolveAlias(id: string): string {
  return aliases[id] ?? id;
}

export function isManifestLoaded(): boolean {
  return manifestCache !== null;
}

export function getManifestSync(): PuzzleManifest | null {
  return manifestCache;
}

export function getIndexEntry(id: string): PuzzleIndexEntry | undefined {
  return indexById.get(resolveAlias(id));
}

export function getIndex(): PuzzleIndexEntry[] {
  return manifestCache?.index ?? [];
}

async function fetchJson<T>(url: string): Promise<T> {
  fetchCount += 1;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

export function loadManifest(): Promise<PuzzleManifest> {
  if (manifestCache) return Promise.resolve(manifestCache);

  if (!manifestPromise) {
    manifestPromise = fetchJson<PuzzleManifest>(MANIFEST_URL)
      .then((manifest) => {
        manifestCache = manifest;
        indexById.clear();
        for (const entry of manifest.index) indexById.set(entry.id, entry);
        return manifest;
      })
      .catch((err) => {
        // Allow a retry after a transient failure rather than caching the error.
        manifestPromise = null;
        throw err;
      });
  }

  return manifestPromise;
}

export function loadBucket(bucketId: number): Promise<PuzzleRecord[]> {
  const cached = bucketCache.get(bucketId);
  if (cached) return Promise.resolve(cached);

  const inflight = bucketPromises.get(bucketId);
  if (inflight) return inflight;

  const request = fetchJson<{ id: number; records: PuzzleRecord[] }>(bucketUrl(bucketId))
    .then((bucket) => {
      bucketCache.set(bucketId, bucket.records);
      bucketPromises.delete(bucketId);
      return bucket.records;
    })
    .catch((err) => {
      bucketPromises.delete(bucketId);
      throw err;
    });

  bucketPromises.set(bucketId, request);
  return request;
}

/** Hydrates the buckets that contain the requested ids. */
export async function loadPuzzlesByIds(ids: string[]): Promise<PuzzleRecord[]> {
  await loadManifest();

  const buckets = new Set<number>();
  for (const rawId of ids) {
    const entry = indexById.get(resolveAlias(rawId));
    if (entry) buckets.add(entry.bucket);
  }

  const records = new Map<string, PuzzleRecord>();
  for (const bucketId of buckets) {
    for (const record of await loadBucket(bucketId)) records.set(record.id, record);
  }

  return ids
    .map((id) => records.get(resolveAlias(id)))
    .filter((record): record is PuzzleRecord => Boolean(record));
}

/**
 * Returns the record for an id, or null when the id is not in the published
 * corpus. Callers must render a not-found state rather than hanging.
 */
export async function getPuzzle(id: string): Promise<PuzzleRecord | null> {
  const resolved = resolveAlias(id);
  const loaded = await loadPuzzlesByIds([resolved]);
  return loaded[0] ?? null;
}

/** Case-insensitive search across the manifest index. No records are loaded. */
export function searchIndex(
  term: string,
  filters: { theme?: string; difficulty?: string; mateIn?: number } = {}
): PuzzleIndexEntry[] {
  const needle = term.trim().toLowerCase();

  return getIndex().filter((entry) => {
    if (filters.mateIn) {
      if (!entry.themes.includes(`mateIn${filters.mateIn}` as TacticalTheme)) return false;
    }
    if (filters.theme && filters.theme !== 'all') {
      if (!entry.themes.includes(filters.theme as TacticalTheme)) return false;
    }
    if (filters.difficulty && filters.difficulty !== 'all') {
      if (entry.difficultyBand !== filters.difficulty) return false;
    }
    if (!needle) return true;

    return (
      entry.title.toLowerCase().includes(needle) ||
      entry.difficultyBand.toLowerCase().includes(needle) ||
      entry.themes.some((t) => t.toLowerCase().includes(needle))
    );
  });
}

/** Next puzzle in published order, used by the "next puzzle" control. */
export function nextIndexId(id: string, offset = 1): string | null {
  const index = getIndex();
  if (index.length === 0) return null;
  const current = index.findIndex((entry) => entry.id === resolveAlias(id));
  if (current < 0) return index[0].id;
  return index[(current + offset + index.length) % index.length].id;
}
