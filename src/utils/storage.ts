import { BoardThemeId, UserStats } from '../types/puzzle';

const THEME_KEY = 'cb_board_theme';
const UI_MODE_KEY = 'cb_ui_mode';
const STATS_KEY = 'cb_user_stats';
const CONSENT_KEY = 'cb_cookie_consent';

export function getStoredBoardTheme(): BoardThemeId {
  if (typeof window === 'undefined') return 'ocean-slate';
  const val = localStorage.getItem(THEME_KEY);
  if (val === 'classic-tournament' || val === 'rosewood' || val === 'high-contrast') {
    return val;
  }
  return 'ocean-slate';
}

export function setStoredBoardTheme(theme: BoardThemeId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute('data-board-theme', theme);
}

export function getStoredUiMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const val = localStorage.getItem(UI_MODE_KEY);
  return val === 'dark' ? 'dark' : 'light';
}

export function setStoredUiMode(mode: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(UI_MODE_KEY, mode);
  document.documentElement.setAttribute('data-theme', mode);
}

export function getStoredStats(): UserStats {
  const defaultStats: UserStats = {
    streak: 0,
    lastSolvedDate: null,
    totalSolved: 0,
    hintsUsedCount: 0,
    solvedPuzzles: {},
  };
  if (typeof window === 'undefined') return defaultStats;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats;
    return JSON.parse(raw);
  } catch {
    return defaultStats;
  }
}

export function recordPuzzleSolved(puzzleId: string, hintsUsed: number): UserStats {
  const stats = getStoredStats();
  const today = new Date().toISOString().split('T')[0];

  let streak = stats.streak;
  if (stats.lastSolvedDate) {
    const last = new Date(stats.lastSolvedDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  const updated: UserStats = {
    ...stats,
    streak,
    lastSolvedDate: today,
    totalSolved: (stats.totalSolved || 0) + (stats.solvedPuzzles[puzzleId]?.status === 'solved' ? 0 : 1),
    hintsUsedCount: (stats.hintsUsedCount || 0) + hintsUsed,
    solvedPuzzles: {
      ...stats.solvedPuzzles,
      [puzzleId]: {
        puzzleId,
        solvedAt: new Date().toISOString(),
        hintsUsed,
        attempts: (stats.solvedPuzzles[puzzleId]?.attempts || 0) + 1,
        status: 'solved',
      },
    },
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function clearAllLocalProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STATS_KEY);
}

export function exportLocalDataJson(): string {
  const stats = getStoredStats();
  return JSON.stringify({
    stats,
    boardTheme: getStoredBoardTheme(),
    uiMode: getStoredUiMode(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

export function getCookieConsent(): { status: 'accepted' | 'rejected' | 'pending'; timestamp?: string } {
  if (typeof window === 'undefined') return { status: 'pending' };
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : { status: 'pending' };
  } catch {
    return { status: 'pending' };
  }
}

export function setCookieConsent(status: 'accepted' | 'rejected'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify({
    status,
    timestamp: new Date().toISOString(),
  }));
}
