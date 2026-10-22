/**
 * Deterministic Daily Puzzle Scheduling Engine
 *
 * The date → puzzleId mapping is no longer computed from a hash over the corpus.
 * It is read from src/data/dailySchedule.json, an append-only ledger, so past
 * dates can never be reshuffled when the corpus grows.
 *
 * Global Reset Timezone: Asia/Kolkata (UTC+05:30)
 */

import { PuzzleRecord } from '../types/puzzle';
import ledger from '../data/dailySchedule.json';

export const GLOBAL_RESET_TIMEZONE = 'Asia/Kolkata';

const entries = ledger.entries as Record<string, string>;

/** Returns the current calendar date string (YYYY-MM-DD) under the global reset timezone. */
export function getCurrentGlobalDate(customDate?: Date): string {
  const d = customDate || new Date();
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: GLOBAL_RESET_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().split('T')[0];
  }
}

/** Converts a YYYY-MM-DD date string to days since Unix epoch (1970-01-01). */
export function dateStringToEpochDay(dateStr: string): number {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((p) => isNaN(p))) return 0;
  const [year, month, day] = parts;
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

/** Converts days since Unix epoch back to a YYYY-MM-DD date string. */
export function epochDayToDateString(epochDay: number): string {
  const date = new Date(epochDay * 86400000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normaliseDate(dateStr?: string): string {
  return dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : getCurrentGlobalDate();
}

/** Ledger lookup. Returns null for dates outside generated coverage. */
export function getDailyPuzzleId(dateStr?: string): string | null {
  return entries[normaliseDate(dateStr)] ?? null;
}

/**
 * Hydrates the daily puzzle from a supplied corpus. Prefers an explicit
 * `dateAssigned` override when the corpus carries one.
 */
export function getDailyPuzzle(
  dateStr?: string,
  corpus: PuzzleRecord[] = []
): PuzzleRecord | null {
  const target = normaliseDate(dateStr);

  const explicit = corpus.find((p) => p.dateAssigned === target);
  if (explicit) return explicit;

  const id = entries[target];
  if (!id) return null;

  return corpus.find((p) => p.id === id) ?? null;
}

/** Puzzle ids scheduled for every day of a given month, in date order. */
export function getArchiveIdsForMonth(year: number | string, month: number | string): string[] {
  const y = typeof year === 'string' ? parseInt(year, 10) : year;
  const m = typeof month === 'string' ? parseInt(month, 10) : month;
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return [];

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const ids: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const id = entries[dateStr];
    if (id) ids.push(id);
  }

  return ids;
}

/** Hydrates a month of archive puzzles from a supplied corpus. */
export function getArchivePuzzlesForMonth(
  year: number | string,
  month: number | string,
  corpus: PuzzleRecord[] = []
): PuzzleRecord[] {
  const byId = new Map(corpus.map((p) => [p.id, p]));
  return getArchiveIdsForMonth(year, month)
    .map((id) => byId.get(id))
    .filter((p): p is PuzzleRecord => Boolean(p));
}

/** Deterministic date → id map for the next `daysCount` days. */
export function generateStaticSchedule(
  startDateStr: string,
  daysCount = 365
): Record<string, string> {
  const schedule: Record<string, string> = {};
  const startEpoch = dateStringToEpochDay(startDateStr);

  for (let i = 0; i < daysCount; i++) {
    const dateStr = epochDayToDateString(startEpoch + i);
    const id = entries[dateStr];
    if (id) schedule[dateStr] = id;
  }

  return schedule;
}
