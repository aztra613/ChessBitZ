/**
 * Chessbitz — Local Spaced Repetition Engine
 *
 * Implements a lightweight SM-2 inspired spaced repetition algorithm
 * entirely in browser localStorage. No backend required.
 *
 * Features:
 * - Tracks puzzle attempts, accuracy, and timing
 * - Computes next review date using exponential intervals
 * - Prioritizes puzzles the user struggled with
 * - Exports/imports review state for portability
 */

import { PuzzleRecord } from '../types/puzzle';

export interface SRSCard {
  puzzleId: string;
  /** Number of consecutive correct reviews */
  repetitions: number;
  /** Easiness factor (min 1.3, default 2.5) */
  easinessFactor: number;
  /** Current interval in days */
  intervalDays: number;
  /** ISO string of next scheduled review */
  nextReviewDate: string;
  /** ISO string of last review */
  lastReviewDate: string;
  /** Total number of reviews */
  totalReviews: number;
  /** Number of times solved correctly */
  correctCount: number;
  /** Average hints used */
  avgHintsUsed: number;
}

export interface SRSState {
  cards: Record<string, SRSCard>;
  lastSessionDate: string;
  totalReviews: number;
}

const SRS_STORAGE_KEY = 'cb_srs_state';

/** Quality ratings for SM-2 algorithm */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Maps puzzle solving outcomes to SM-2 quality ratings:
 * - 5: Solved immediately with no hints
 * - 4: Solved with 1 hint
 * - 3: Solved with 2+ hints
 * - 2: Solved after seeing solution
 * - 1: Failed, needed solution walkthrough
 * - 0: Completely failed
 */
export function outcomeToQuality(
  solved: boolean,
  hintsUsed: number,
  viewedSolution: boolean
): ReviewQuality {
  if (!solved) return viewedSolution ? 1 : 0;
  if (viewedSolution) return 2;
  if (hintsUsed === 0) return 5;
  if (hintsUsed === 1) return 4;
  return 3;
}

/**
 * Load SRS state from localStorage.
 */
export function loadSRSState(): SRSState {
  const defaultState: SRSState = {
    cards: {},
    lastSessionDate: new Date().toISOString().split('T')[0],
    totalReviews: 0,
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    if (!raw) return defaultState;
    return JSON.parse(raw);
  } catch {
    return defaultState;
  }
}

/**
 * Save SRS state to localStorage.
 */
export function saveSRSState(state: SRSState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(state));
}

/**
 * SM-2 spaced repetition algorithm.
 * Updates a card's scheduling based on review quality.
 */
export function updateCard(
  card: SRSCard,
  quality: ReviewQuality
): SRSCard {
  const today = new Date().toISOString().split('T')[0];

  // Update easiness factor (EF)
  let ef = card.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef);

  let repetitions = card.repetitions;
  let intervalDays = card.intervalDays;

  if (quality < 3) {
    // Failed: reset repetitions, short interval
    repetitions = 0;
    intervalDays = 1;
  } else {
    // Passed: increment repetitions
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(card.intervalDays * ef);
    }
  }

  // Compute next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  const nextReviewDate = nextDate.toISOString().split('T')[0];

  return {
    ...card,
    repetitions,
    easinessFactor: ef,
    intervalDays,
    nextReviewDate,
    lastReviewDate: today,
    totalReviews: card.totalReviews + 1,
    correctCount: card.correctCount + (quality >= 3 ? 1 : 0),
    avgHintsUsed: card.totalReviews > 0
      ? (card.avgHintsUsed * card.totalReviews + (quality >= 3 ? 0 : 1)) / (card.totalReviews + 1)
      : 0,
  };
}

/**
 * Record a puzzle review outcome. Creates or updates the SRS card.
 */
export function recordReview(
  puzzleId: string,
  quality: ReviewQuality
): SRSState {
  const state = loadSRSState();
  const today = new Date().toISOString().split('T')[0];

  const existingCard = state.cards[puzzleId];
  const card: SRSCard = existingCard || {
    puzzleId,
    repetitions: 0,
    easinessFactor: 2.5,
    intervalDays: 0,
    nextReviewDate: today,
    lastReviewDate: today,
    totalReviews: 0,
    correctCount: 0,
    avgHintsUsed: 0,
  };

  state.cards[puzzleId] = updateCard(card, quality);
  state.lastSessionDate = today;
  state.totalReviews += 1;

  saveSRSState(state);
  return state;
}

/**
 * Get puzzles due for review today, sorted by priority.
 * Returns puzzle IDs that need reviewing.
 */
export function getDueReviews(
  availablePuzzles: PuzzleRecord[],
  maxCount = 20
): PuzzleRecord[] {
  const state = loadSRSState();
  const today = new Date().toISOString().split('T')[0];
  const todayMs = new Date(today).getTime();

  // Find all cards due for review
  const dueCards: Array<{ card: SRSCard; overdueDays: number }> = [];

  for (const [id, card] of Object.entries(state.cards)) {
    const reviewDateMs = new Date(card.nextReviewDate).getTime();
    if (reviewDateMs <= todayMs) {
      const overdueDays = Math.floor((todayMs - reviewDateMs) / 86400000);
      dueCards.push({ card, overdueDays });
    }
  }

  // Sort by overdue (most overdue first), then by difficulty (lower EF = harder = higher priority)
  dueCards.sort((a, b) => {
    if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
    return a.card.easinessFactor - b.card.easinessFactor;
  });

  // Map back to puzzle records
  const puzzleMap = new Map(availablePuzzles.map(p => [p.id, p]));
  const result: PuzzleRecord[] = [];

  for (const { card } of dueCards) {
    if (result.length >= maxCount) break;
    const puzzle = puzzleMap.get(card.puzzleId);
    if (puzzle) result.push(puzzle);
  }

  return result;
}

/**
 * Get new puzzles the user hasn't attempted yet.
 */
export function getNewPuzzles(
  availablePuzzles: PuzzleRecord[],
  maxCount = 10
): PuzzleRecord[] {
  const state = loadSRSState();
  const reviewedIds = new Set(Object.keys(state.cards));
  return availablePuzzles
    .filter(p => !reviewedIds.has(p.id))
    .slice(0, maxCount);
}

/**
 * Get SRS statistics for display.
 */
export function getSRSStats(): {
  totalTracked: number;
  dueToday: number;
  mastered: number;
  learning: number;
  struggling: number;
  averageEF: number;
} {
  const state = loadSRSState();
  const today = new Date().toISOString().split('T')[0];
  const todayMs = new Date(today).getTime();

  const cards = Object.values(state.cards);
  let dueToday = 0;
  let mastered = 0;
  let learning = 0;
  let struggling = 0;
  let totalEF = 0;

  for (const card of cards) {
    const reviewDateMs = new Date(card.nextReviewDate).getTime();
    if (reviewDateMs <= todayMs) dueToday++;

    if (card.repetitions >= 5 && card.easinessFactor >= 2.0) {
      mastered++;
    } else if (card.repetitions >= 2) {
      learning++;
    } else {
      struggling++;
    }
    totalEF += card.easinessFactor;
  }

  return {
    totalTracked: cards.length,
    dueToday,
    mastered,
    learning,
    struggling,
    averageEF: cards.length > 0 ? totalEF / cards.length : 2.5,
  };
}

/**
 * Clear all SRS data.
 */
export function clearSRSData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SRS_STORAGE_KEY);
}

/**
 * Export SRS data as JSON string.
 */
export function exportSRSData(): string {
  const state = loadSRSState();
  return JSON.stringify(state, null, 2);
}
