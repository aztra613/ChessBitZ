/**
 * Deterministic Daily Puzzle Scheduling Engine
 *
 * Implements a static-first, zero-network, deterministic calendar schedule
 * for PlyQuest daily tactics puzzles.
 *
 * Global Reset Timezone: Asia/Kolkata (UTC+05:30)
 * Works indefinitely into future and past dates without requiring daily API calls
 * or GitHub Actions runs.
 */

import { PuzzleRecord } from '../types/puzzle';
import { PUZZLES } from '../data/puzzles';

export const GLOBAL_RESET_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the current calendar date string in YYYY-MM-DD format
 * under the global reset timezone (Asia/Kolkata).
 */
export function getCurrentGlobalDate(customDate?: Date): string {
  const d = customDate || new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: GLOBAL_RESET_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  } catch {
    // Fallback if Intl timeZone unavailable
    return d.toISOString().split('T')[0];
  }
}

/**
 * Converts a YYYY-MM-DD date string to days since Unix epoch (1970-01-01).
 */
export function dateStringToEpochDay(dateStr: string): number {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 0;
  }
  const [year, month, day] = parts;
  const utcMs = Date.UTC(year, month - 1, day);
  return Math.floor(utcMs / 86400000);
}

/**
 * Converts days since Unix epoch back to a YYYY-MM-DD date string.
 */
export function epochDayToDateString(epochDay: number): string {
  const date = new Date(epochDay * 86400000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Deterministic 32-bit integer hash (Murmur3 style)
 */
function hashInteger(n: number, seed = 0x27d4eb2d): number {
  let h = (n ^ seed) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Resolves the deterministic daily puzzle for a given date string (YYYY-MM-DD).
 * If no date is provided, defaults to the current date under Asia/Kolkata.
 */
export function getDailyPuzzle(dateStr?: string, puzzleCorpus: PuzzleRecord[] = PUZZLES): PuzzleRecord {
  if (!puzzleCorpus || puzzleCorpus.length === 0) {
    throw new Error('Puzzle corpus is empty');
  }

  const targetDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? dateStr
    : getCurrentGlobalDate();

  // 1. Highest precedence: Explicit manually assigned date in corpus
  const explicitlyAssigned = puzzleCorpus.find((p) => p.dateAssigned === targetDate);
  if (explicitlyAssigned) {
    return explicitlyAssigned;
  }

  // 2. Filter daily-eligible candidates (exclude symmetric variants from daily slot)
  const eligible = puzzleCorpus.filter((p) => p.provenance.transformType !== 'color-symmetric-rank-reflect');
  const pool = eligible.length > 0 ? eligible : puzzleCorpus;

  // 3. Deterministic permutation mapping
  const epochDay = dateStringToEpochDay(targetDate);
  const index = hashInteger(epochDay) % pool.length;
  const selected = pool[index];

  // Return a cloned record with dateAssigned populated
  return {
    ...selected,
    dateAssigned: targetDate,
  };
}

/**
 * Returns all daily puzzles scheduled for a specific year and month (YYYY-MM).
 * Used to power the deterministic archive browser (/archive/[year]/[month]).
 */
export function getArchivePuzzlesForMonth(
  year: number | string,
  month: number | string,
  puzzleCorpus: PuzzleRecord[] = PUZZLES
): PuzzleRecord[] {
  const y = typeof year === 'string' ? parseInt(year, 10) : year;
  const m = typeof month === 'string' ? parseInt(month, 10) : month;
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    return [];
  }

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const results: PuzzleRecord[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(m).padStart(2, '0');
    const dateStr = `${y}-${monthStr}-${dayStr}`;
    results.push(getDailyPuzzle(dateStr, puzzleCorpus));
  }

  return results;
}

/**
 * Generates a deterministic static calendar schedule for the next N days.
 */
export function generateStaticSchedule(
  startDateStr: string,
  daysCount = 365,
  puzzleCorpus: PuzzleRecord[] = PUZZLES
): Record<string, string> {
  const schedule: Record<string, string> = {};
  const startEpoch = dateStringToEpochDay(startDateStr);

  for (let i = 0; i < daysCount; i++) {
    const curDate = epochDayToDateString(startEpoch + i);
    const puzzle = getDailyPuzzle(curDate, puzzleCorpus);
    schedule[curDate] = puzzle.id;
  }

  return schedule;
}
