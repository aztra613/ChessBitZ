/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { PuzzlePlayer } from './components/PuzzlePlayer';
import { PuzzleCatalog } from './components/PuzzleCatalog';
import { WorksheetBuilder } from './components/WorksheetBuilder';
import { SprintMode } from './components/SprintMode';
import { ReviewMode } from './components/ReviewMode';
import { FenImport } from './components/FenImport';
import { LegalPages } from './components/LegalPages';
import { NotFound } from './components/NotFound';
import { CookieBanner } from './components/CookieBanner';
import { PUZZLES } from './data/puzzles';
import { getDailyPuzzle } from './utils/dailySchedule';
import { BoardThemeId } from './types/puzzle';
import {
  getStoredBoardTheme,
  setStoredBoardTheme,
  getStoredUiMode,
  setStoredUiMode,
} from './utils/storage';

export default function App() {
  // Current route pathname (e.g. "/", "/daily", "/puzzle/cb-daily-01", etc.)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path && path !== '' ? path : '/';
    }
    return '/';
  });

  // Selected Board Theme (Ocean Slate default)
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>(() => getStoredBoardTheme());
  // UI Dark/Light Shell Mode (Light default)
  const [uiMode, setUiMode] = useState<'light' | 'dark'>(() => getStoredUiMode());
  // Cookie Preferences Modal state
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  // Preselected puzzle ID for worksheet
  const [worksheetPuzzleId, setWorksheetPuzzleId] = useState<string | undefined>(undefined);

  // Apply theme attributes and class to root html element on mount / state change
  useEffect(() => {
    document.documentElement.setAttribute('data-board-theme', boardTheme);
    document.documentElement.setAttribute('data-theme', uiMode);
    if (uiMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [boardTheme, uiMode]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Safe navigation function with history pushState
  const navigate = useCallback((route: string) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined' && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  // Guarantee clean scroll position on route transitions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [currentRoute]);

  // Update theme handlers
  const handleBoardThemeChange = (newTheme: BoardThemeId) => {
    setBoardTheme(newTheme);
    setStoredBoardTheme(newTheme);
  };

  const handleToggleUiMode = () => {
    const nextMode = uiMode === 'dark' ? 'light' : 'dark';
    setUiMode(nextMode);
    setStoredUiMode(nextMode);
  };

  // Synchronize document title without leaking puzzle answers
  useEffect(() => {
    if (currentRoute === '/') {
      document.title = 'Chessbitz - Premium Free Chess Tactics Puzzles & Worksheets';
    } else if (currentRoute === '/daily') {
      document.title = 'Daily Chess Puzzle - Chessbitz';
    } else if (currentRoute.startsWith('/puzzle/')) {
      const id = currentRoute.replace('/puzzle/', '');
      const pz = PUZZLES.find((p) => p.id === id);
      document.title = pz ? `${pz.title} - Tactics Puzzle - Chessbitz` : 'Chess Puzzle - Chessbitz';
    } else if (currentRoute === '/printable-chess-puzzles') {
      document.title = 'Printable Chess Worksheets Studio (PDF) - Chessbitz';
    } else if (currentRoute === '/sprint') {
      document.title = 'Sprint Mode - Timed Puzzle Challenge - Chessbitz';
    } else if (currentRoute === '/review') {
      document.title = 'Spaced Repetition Review - Chessbitz';
    } else if (currentRoute === '/import') {
      document.title = 'Import FEN Position - Private Analysis - Chessbitz';
    } else if (currentRoute.startsWith('/mate-in-')) {
      const n = currentRoute.replace('/mate-in-', '');
      document.title = `Mate in ${n} Puzzles - Chessbitz`;
    } else if (currentRoute.startsWith('/themes/')) {
      const theme = currentRoute.replace('/themes/', '');
      document.title = `${theme.toUpperCase()} Tactics - Chessbitz`;
    } else {
      const clean = currentRoute.replace('/', '');
      document.title = `${clean.charAt(0).toUpperCase() + clean.slice(1)} - Chessbitz`;
    }
  }, [currentRoute]);

  // Route Dispatcher
  const renderRoute = () => {
    // 1. Landing Page
    if (currentRoute === '/' || currentRoute === '') {
      return (
        <LandingPage
          boardTheme={boardTheme}
          onNavigate={navigate}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
        />
      );
    }

    // 2. Daily Puzzle
    if (currentRoute === '/daily') {
      const dailyPuzzle = getDailyPuzzle();
      return (
        <PuzzlePlayer
          puzzle={dailyPuzzle}
          boardTheme={boardTheme}
          onNavigatePuzzle={() => navigate('/puzzles')}
          onOpenWorksheet={(id) => {
            setWorksheetPuzzleId(id);
            navigate('/printable-chess-puzzles');
          }}
          onNavigate={navigate}
        />
      );
    }

    // 3. Puzzle Detail: /puzzle/[id]
    if (currentRoute.startsWith('/puzzle/')) {
      const id = currentRoute.replace('/puzzle/', '');
      const puzzle = PUZZLES.find((p) => p.id === id);
      if (!puzzle) {
        return (
          <NotFound
            onNavigate={navigate}
            message={`Puzzle ID "${id}" does not exist in the curated Chessbitz corpus.`}
          />
        );
      }
      return (
        <PuzzlePlayer
          puzzle={puzzle}
          boardTheme={boardTheme}
          onNavigatePuzzle={(direction) => {
            const currIdx = PUZZLES.findIndex((p) => p.id === id);
            const nextIdx = (currIdx + 1) % PUZZLES.length;
            navigate(`/puzzle/${PUZZLES[nextIdx].id}`);
          }}
          onOpenWorksheet={(pId) => {
            setWorksheetPuzzleId(pId);
            navigate('/printable-chess-puzzles');
          }}
          onNavigate={navigate}
        />
      );
    }

    // 4. Mate in 1, 2, 3 Curated Pages
    if (currentRoute === '/mate-in-1') {
      return (
        <PuzzleCatalog
          initialMateFilter={1}
          boardTheme={boardTheme}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
          onNavigate={navigate}
        />
      );
    }
    if (currentRoute === '/mate-in-2') {
      return (
        <PuzzleCatalog
          initialMateFilter={2}
          boardTheme={boardTheme}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
          onNavigate={navigate}
        />
      );
    }
    if (currentRoute === '/mate-in-3') {
      return (
        <PuzzleCatalog
          initialMateFilter={3}
          boardTheme={boardTheme}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
          onNavigate={navigate}
        />
      );
    }

    // 5. Themes: /themes/[theme]
    if (currentRoute.startsWith('/themes/')) {
      const theme = currentRoute.replace('/themes/', '');
      return (
        <PuzzleCatalog
          initialThemeFilter={theme === 'all' ? undefined : theme}
          boardTheme={boardTheme}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
          onNavigate={navigate}
        />
      );
    }

    // 6. Difficulty: /difficulty/[band]
    if (currentRoute.startsWith('/difficulty/')) {
      const band = currentRoute.replace('/difficulty/', '');
      return (
        <PuzzleCatalog
          initialDifficultyFilter={band}
          boardTheme={boardTheme}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
          onNavigate={navigate}
        />
      );
    }

    // 7. Archive: /archive/[year]/[month]
    if (currentRoute.startsWith('/archive/')) {
      const parts = currentRoute.split('/').filter(Boolean);
      const year = parts[1] || '2026';
      const month = parts[2] || '10';
      return (
        <PuzzleCatalog
          isArchive={true}
          archiveYear={year}
          archiveMonth={month}
          boardTheme={boardTheme}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
          onNavigate={navigate}
        />
      );
    }

    // 8. General Catalog: /puzzles
    if (currentRoute === '/puzzles') {
      return (
        <PuzzleCatalog
          boardTheme={boardTheme}
          onSelectPuzzle={(id) => navigate(`/puzzle/${id}`)}
          onNavigate={navigate}
        />
      );
    }

    // 8a. Sprint Mode: /sprint
    if (currentRoute === '/sprint') {
      return (
        <SprintMode
          boardTheme={boardTheme}
          onNavigate={navigate}
        />
      );
    }

    // 8b. Spaced Repetition Review: /review
    if (currentRoute === '/review') {
      return (
        <ReviewMode
          boardTheme={boardTheme}
          onNavigate={navigate}
        />
      );
    }

    // 8c. FEN Import & Analysis: /import
    if (currentRoute === '/import') {
      return (
        <FenImport
          boardTheme={boardTheme}
          onNavigate={navigate}
        />
      );
    }

    // 9. Worksheet Studio: /printable-chess-puzzles
    if (currentRoute === '/printable-chess-puzzles') {
      return (
        <WorksheetBuilder
          initialSelectedPuzzleId={worksheetPuzzleId}
          onNavigatePuzzle={(id) => navigate(`/puzzle/${id}`)}
        />
      );
    }

    // 10. Legal & Trust Pages
    const legalPages = [
      'about',
      'privacy',
      'cookies',
      'terms',
      'disclaimer',
      'copyright',
      'licenses',
      'security',
      'accessibility',
      'contact',
    ] as const;

    const matchedLegal = legalPages.find((p) => currentRoute === `/${p}`);
    if (matchedLegal) {
      return <LegalPages page={matchedLegal} onNavigate={navigate} />;
    }

    // 11. 404 Not Found
    return (
      <NotFound
        onNavigate={navigate}
        message="The page you requested could not be located in Chessbitz."
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--cb-canvas)] text-[var(--cb-ink)]">
      {/* Navigation Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={navigate}
        uiMode={uiMode}
        onToggleUiMode={handleToggleUiMode}
        boardTheme={boardTheme}
        onThemeChange={handleBoardThemeChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full" id="main-content">
        {renderRoute()}
      </main>

      {/* Compliance & Trust Footer */}
      <Footer
        onNavigate={navigate}
        onOpenCookieSettings={() => setCookieSettingsOpen(true)}
      />

      {/* Cookie / Storage Consent Modal/Banner */}
      <CookieBanner
        onNavigate={navigate}
        isOpen={cookieSettingsOpen}
        onClose={() => setCookieSettingsOpen(false)}
      />
    </div>
  );
}
