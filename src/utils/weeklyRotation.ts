/**
 * PlyQuest — Weekly Featured Rotation
 *
 * Selects a rotating slice of the published corpus from the ISO week number.
 *
 * Because this is computed in the browser, rotating the featured set costs no
 * deploy, no commit and no CI run. The corpus itself is append-only, so the
 * *archive* never changes; only which puzzles are surfaced as "this week's set".
 */

import { PuzzleIndexEntry, getIndex } from './puzzleStore';

/** ISO-8601 week number and week-year for a date (defaults to now). */
export function getIsoWeek(date: Date = new Date()): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return { year: d.getUTCFullYear(), week };
}

/**
 * A deterministic rotating window over the manifest index. The same week always
 * yields the same set; the next week advances the window.
 */
export function getFeaturedIndexEntries(count: number, date: Date = new Date()): PuzzleIndexEntry[] {
  const index = getIndex();
  if (index.length === 0 || count <= 0) return [];

  const { year, week } = getIsoWeek(date);
  const seed = year * 53 + week;
  const offset = (seed * count) % index.length;

  const picked: PuzzleIndexEntry[] = [];
  for (let i = 0; i < Math.min(count, index.length); i++) {
    picked.push(index[(offset + i) % index.length]);
  }
  return picked;
}

/** Human-readable label for the current featured week, e.g. "Week 43, 2026". */
export function getFeaturedWeekLabel(date: Date = new Date()): string {
  const { year, week } = getIsoWeek(date);
  return `Week ${week}, ${year}`;
}
