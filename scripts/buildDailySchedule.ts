/**
 * PlyQuest — Daily Schedule Ledger Builder
 *
 * Generates src/data/dailySchedule.json: an append-only map of date → puzzleId.
 *
 * This replaces the previous `hashInteger(epochDay) % pool.length` rule, which
 * reshuffled every past date whenever the corpus changed size.
 *
 * Contract (see plan S4):
 *  - Existing entries ALWAYS win. Only unassigned dates are filled.
 *  - Coverage runs from `startDate` through today + a forward window.
 *  - The rotation cursor is persisted, so extending the range continues the
 *    same cycle instead of restarting it.
 *  - When the pool is exhausted the rotation restarts (documented cyclic reuse)
 *    and the number of cycles is recorded.
 *  - Any entry pointing at a puzzle that no longer exists aborts the run.
 *
 * Usage:
 *   npx tsx scripts/buildDailySchedule.ts
 *   npx tsx scripts/buildDailySchedule.ts --check   # verify, write nothing
 */

import * as fs from 'fs';
import * as path from 'path';
import { PuzzleRecord } from '../src/types/puzzle';
import { loadRegistry } from './lib/registry';
import { loadPublishedRecords, orderByRegistry } from './lib/shards';

export const LEDGER_PATH = path.resolve(process.cwd(), 'src/data/dailySchedule.json');
export const LEDGER_VERSION = 1;
export const GLOBAL_RESET_TIMEZONE = 'Asia/Kolkata';
export const LEDGER_START_DATE = '2024-01-01';
/** Desired coverage horizon (5 years). Filled only where capacity permits. */
export const MIN_COVERAGE_DAYS = 1826;
/** How far back an unassigned archive date is filled. */
export const PAST_WINDOW_DAYS = 730;
/** Minimum gap before the same puzzle may be scheduled again. */
export const REUSE_MIN_SPACING_DAYS = 365;

export interface DailyLedger {
  version: number;
  timezone: string;
  generatedAt: string;
  startDate: string;
  coverageThrough: string;
  poolSize: number;
  /** 'no-reuse' when capacity sufficed, 'min-spacing-reuse' when it did not. */
  coverageRule: string;
  minSpacingDays: number;
  reuseCycles: number;
  entries: Record<string, string>;
}

function epochDayToDateString(epochDay: number): string {
  const date = new Date(epochDay * 86400000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateStringToEpochDay(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map((p) => parseInt(p, 10));
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function todayGlobalDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: GLOBAL_RESET_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/** Days sit outside the daily slot so the same variant never repeats back to back. */
function eligibleForDaily(records: PuzzleRecord[]): PuzzleRecord[] {
  const eligible = records.filter(
    (r) => r.provenance.transformType !== 'color-symmetric-rank-reflect'
  );
  return eligible.length > 0 ? eligible : records;
}

/**
 * Picks the puzzle whose last appearance is furthest in the past, preferring one
 * that satisfies REUSE_MIN_SPACING_DAYS. Returns undefined only for an empty pool.
 */
function pickWithMinSpacing(
  poolIds: string[],
  lastUsed: Map<string, number>,
  day: number
): string | undefined {
  let spaced: string | undefined;
  let spacedAge = -1;
  let oldest: string | undefined;
  let oldestAge = -1;

  for (const id of poolIds) {
    const last = lastUsed.get(id);
    const age = last === undefined ? Number.MAX_SAFE_INTEGER : day - last;

    if (age > oldestAge) {
      oldestAge = age;
      oldest = id;
    }
    if (age >= REUSE_MIN_SPACING_DAYS && age > spacedAge) {
      spacedAge = age;
      spaced = id;
    }
  }

  return spaced ?? oldest;
}

export function buildLedger(existing: DailyLedger | null): DailyLedger {
  const records = orderByRegistry(loadPublishedRecords(), loadRegistry());
  const pool = eligibleForDaily(records);
  const poolIds = pool.map((r) => r.id);

  if (poolIds.length === 0) {
    throw new Error('Cannot build a daily schedule from an empty corpus.');
  }

  const ledger: DailyLedger = existing
    ? JSON.parse(JSON.stringify(existing))
    : {
        version: LEDGER_VERSION,
        timezone: GLOBAL_RESET_TIMEZONE,
        generatedAt: new Date().toISOString(),
        startDate: LEDGER_START_DATE,
        coverageThrough: LEDGER_START_DATE,
        poolSize: poolIds.length,
        coverageRule: 'no-reuse',
        minSpacingDays: REUSE_MIN_SPACING_DAYS,
        reuseCycles: 0,
        entries: {},
      };

  // Existing entries are immutable. Fail loudly on dangling assignments.
  const known = new Set(poolIds);
  const dangling = Object.entries(ledger.entries).filter(([, id]) => !known.has(id));
  if (dangling.length > 0) {
    const sample = dangling.slice(0, 5).map(([date, id]) => `${date} → ${id}`).join('\n  ');
    throw new Error(
      `Daily ledger references ${dangling.length} puzzle(s) no longer in the corpus:\n  ${sample}\n` +
        `A takedown must supply an explicit remap before the ledger can be rebuilt. ` +
        `The archive is never silently reshuffled.`
    );
  }

  const todayEpoch = dateStringToEpochDay(todayGlobalDate());

  // Capacity: only puzzles never scheduled on any date can fill a day without reuse.
  const usedIds = new Set(Object.values(ledger.entries));
  const unused = poolIds.filter((id) => !usedIds.has(id));

  // Where each puzzle was last scheduled, for the minimum-spacing policy.
  const lastUsed = new Map<string, number>();
  for (const [date, id] of Object.entries(ledger.entries)) {
    const epoch = dateStringToEpochDay(date);
    lastUsed.set(id, Math.max(lastUsed.get(id) ?? -Infinity, epoch));
  }

  const lastAssignedEpoch = Object.keys(ledger.entries).reduce(
    (max, date) => Math.max(max, dateStringToEpochDay(date)),
    todayEpoch
  );

  // Anchor so today is always covered, then extend toward the desired horizon.
  // The horizon is a function of *today*, not of how far the ledger already
  // reaches — otherwise every run would extend it further and grow forever.
  // Existing coverage is never shortened.
  const startEpoch = Math.min(
    dateStringToEpochDay(ledger.startDate || LEDGER_START_DATE),
    todayEpoch - Math.min(PAST_WINDOW_DAYS, Math.floor(poolIds.length / 2))
  );
  const endEpoch = Math.max(todayEpoch + MIN_COVERAGE_DAYS - 1, lastAssignedEpoch);

  let unusedCursor = 0;
  let usedReuse = false;

  for (let day = startEpoch; day <= endEpoch; day++) {
    const dateStr = epochDayToDateString(day);
    if (ledger.entries[dateStr]) continue;

    let chosen: string | undefined;

    if (unusedCursor < unused.length) {
      chosen = unused[unusedCursor];
      unusedCursor += 1;
    } else {
      // Pool exhausted. Apply the documented minimum-spacing rule rather than
      // cycling blindly; stop rather than reshuffle anything already published.
      chosen = pickWithMinSpacing(poolIds, lastUsed, day);
      if (!chosen) break;
      usedReuse = true;
    }

    ledger.entries[dateStr] = chosen;
    lastUsed.set(chosen, day);
  }

  ledger.poolSize = poolIds.length;
  ledger.generatedAt = new Date().toISOString();
  ledger.coverageRule = usedReuse ? 'min-spacing-reuse' : 'no-reuse';
  ledger.minSpacingDays = REUSE_MIN_SPACING_DAYS;
  if (usedReuse) ledger.reuseCycles = (ledger.reuseCycles || 0) + 1;
  ledger.coverageThrough = Object.keys(ledger.entries).reduce(
    (max, date) => (date > max ? date : max),
    ledger.startDate
  );

  // Drop fields superseded by coverageRule / minSpacingDays.
  delete (ledger as unknown as Record<string, unknown>).cursor;
  delete (ledger as unknown as Record<string, unknown>).reuseRule;

  return ledger;
}

function sortEntries(ledger: DailyLedger): DailyLedger {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(ledger.entries).sort()) {
    sorted[key] = ledger.entries[key];
  }
  return { ...ledger, entries: sorted };
}

/**
 * Everything that must not change between runs. `generatedAt` is deliberately
 * excluded so a no-op rebuild does not register as drift.
 */
export function ledgerFingerprint(ledger: DailyLedger): string {
  return JSON.stringify({
    startDate: ledger.startDate,
    coverageThrough: ledger.coverageThrough,
    poolSize: ledger.poolSize,
    coverageRule: ledger.coverageRule,
    minSpacingDays: ledger.minSpacingDays,
    reuseCycles: ledger.reuseCycles,
    entries: ledger.entries,
  });
}

/** Asserts that no pre-existing date→id assignment changed. */
export function assertPreserved(before: DailyLedger | null, after: DailyLedger): void {
  if (!before) return;
  for (const [date, id] of Object.entries(before.entries)) {
    if (after.entries[date] !== id) {
      throw new Error(
        `Ledger violation: ${date} changed from ${id} to ${after.entries[date]}. ` +
          `Published daily assignments are immutable.`
      );
    }
  }
}

function main(): void {
  const checkOnly = process.argv.includes('--check');

  const existing: DailyLedger | null = fs.existsSync(LEDGER_PATH)
    ? JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'))
    : null;

  const before = existing ? Object.keys(existing.entries).length : 0;
  const built = buildLedger(existing);
  assertPreserved(existing, built);

  const sorted = sortEntries(built);
  const after = Object.keys(sorted.entries).length;

  console.log('=== PlyQuest daily schedule ledger ===\n');
  console.log(`existing entries : ${before}`);
  console.log(`total entries    : ${after}`);
  console.log(`newly filled     : ${after - before}`);
  console.log(`pool size        : ${sorted.poolSize}`);
  console.log(`coverage rule    : ${sorted.coverageRule}`);
  console.log(`reuse cycles     : ${sorted.reuseCycles}`);
  console.log(`coverage through : ${sorted.coverageThrough}`);

  if (checkOnly) {
    const unchanged =
      existing !== null && ledgerFingerprint(existing) === ledgerFingerprint(sorted);
    console.log(`\n--check: ledger is ${unchanged ? 'UP TO DATE' : 'STALE (would change)'}`);
    if (!unchanged) process.exit(1);
    return;
  }

  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
  console.log(`\nwrote ${LEDGER_PATH}`);
}

main();
