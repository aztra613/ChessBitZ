import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle2, ChevronRight, Award, Zap, Layers } from 'lucide-react';
import { PUZZLES } from '../data/puzzles';
import { getArchivePuzzlesForMonth } from '../utils/dailySchedule';
import { PuzzleRecord, TacticalTheme, DifficultyBand, BoardThemeId } from '../types/puzzle';
import { ChessBoard } from './ChessBoard';
import { getStoredStats } from '../utils/storage';
import { formatThemeLabel } from '../utils/chessUtils';

interface PuzzleCatalogProps {
  initialThemeFilter?: string;
  initialDifficultyFilter?: string;
  initialMateFilter?: number;
  isArchive?: boolean;
  archiveYear?: string;
  archiveMonth?: string;
  boardTheme: BoardThemeId;
  onSelectPuzzle: (id: string) => void;
  onNavigate: (route: string) => void;
}

export const PuzzleCatalog: React.FC<PuzzleCatalogProps> = ({
  initialThemeFilter,
  initialDifficultyFilter,
  initialMateFilter,
  isArchive = false,
  archiveYear = '2026',
  archiveMonth = '10',
  boardTheme,
  onSelectPuzzle,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>(initialThemeFilter || 'all');
  const [selectedDiff, setSelectedDiff] = useState<string>(initialDifficultyFilter || 'all');

  const stats = useMemo(() => getStoredStats(), []);

  const basePuzzles = useMemo(() => {
    if (isArchive) {
      return getArchivePuzzlesForMonth(archiveYear, archiveMonth);
    }
    return PUZZLES;
  }, [isArchive, archiveYear, archiveMonth]);

  // Filter puzzles
  const filtered = useMemo(() => {
    return basePuzzles.filter((p) => {

      // Mate filter
      if (initialMateFilter) {
        const mateKey = `mateIn${initialMateFilter}`;
        if (!p.themes.includes(mateKey as TacticalTheme)) return false;
      }

      // Theme filter
      if (selectedTheme !== 'all') {
        if (!p.themes.includes(selectedTheme as TacticalTheme)) return false;
      }

      // Difficulty filter
      if (selectedDiff !== 'all') {
        if (p.difficultyBand !== selectedDiff) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(term);
        const matchesObj = p.objective.toLowerCase().includes(term);
        const matchesTheme = p.themes.some((t) => t.toLowerCase().includes(term));
        return matchesTitle || matchesObj || matchesTheme;
      }

      return true;
    });
  }, [
    isArchive,
    archiveYear,
    archiveMonth,
    initialMateFilter,
    selectedTheme,
    selectedDiff,
    searchTerm,
  ]);

  // Page title and description
  const pageHeader = useMemo(() => {
    if (isArchive) {
      return {
        title: `Daily Puzzle Archive (${archiveYear}/${archiveMonth})`,
        desc: `Chronological collection of daily tactics puzzles for ${archiveMonth}/${archiveYear}.`,
      };
    }
    if (initialMateFilter) {
      return {
        title: `Mate in ${initialMateFilter} Tactical Puzzles`,
        desc: `Curated forced checkmate in ${initialMateFilter} moves. Calculate precise mating nets.`,
      };
    }
    if (initialDifficultyFilter) {
      return {
        title: `${initialDifficultyFilter.charAt(0).toUpperCase() + initialDifficultyFilter.slice(1)} Tactics`,
        desc: `Puzzles curated for ${initialDifficultyFilter} tactical training.`,
      };
    }
    if (initialThemeFilter && initialThemeFilter !== 'all') {
      return {
        title: `${formatThemeLabel(initialThemeFilter)} Tactics`,
        desc: `Master ${formatThemeLabel(initialThemeFilter)} patterns with verified tactical exercises.`,
      };
    }
    return {
      title: 'Tactics Puzzle Library',
      desc: 'Browse our curated collection of verified chess tactical puzzles.',
    };
  }, [isArchive, archiveYear, archiveMonth, initialMateFilter, initialDifficultyFilter, initialThemeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          {pageHeader.title}
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
          {pageHeader.desc}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#1A2032] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs mb-8 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, motif (e.g. fork, pin), or objective..."
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white placeholder:text-slate-500 focus:outline-[#4658C9]"
          />
        </div>

        {/* Tactical Theme Dropdown */}
        <div className="w-full md:w-52">
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-[#4658C9] cursor-pointer"
            aria-label="Filter by Tactical Motif"
          >
            <option value="all">All Tactical Themes</option>
            <option value="mateIn1">Mate in 1</option>
            <option value="mateIn2">Mate in 2</option>
            <option value="mateIn3">Mate in 3</option>
            <option value="fork">Forks</option>
            <option value="pin">Pins</option>
            <option value="skewer">Skewers</option>
            <option value="backRankMate">Back-Rank Mate</option>
            <option value="sacrifice">Sacrifice & Decoy</option>
            <option value="discoveredAttack">Discovered Attack</option>
          </select>
        </div>

        {/* Difficulty Dropdown */}
        <div className="w-full md:w-44">
          <select
            value={selectedDiff}
            onChange={(e) => setSelectedDiff(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-[#4658C9] cursor-pointer"
            aria-label="Filter by Difficulty Band"
          >
            <option value="all">All Skill Levels</option>
            <option value="beginner">Beginner (&lt;1200)</option>
            <option value="intermediate">Intermediate (1200-1600)</option>
            <option value="advanced">Advanced (1600-2000)</option>
            <option value="master">Master (2000+)</option>
          </select>
        </div>
      </div>

      {/* Puzzles Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1A2032] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No puzzles match your active filters. Try broadening your search or resetting filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedTheme('all');
              setSelectedDiff('all');
            }}
            className="mt-3 px-4 py-2 text-xs font-bold rounded-lg bg-[#4658C9] text-white hover:bg-[#3548C5] cursor-pointer shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
          {filtered.map((puzzle) => {
            const isSolved = stats.solvedPuzzles[puzzle.id]?.status === 'solved';

            return (
              <motion.div
                key={puzzle.id}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={() => onSelectPuzzle(puzzle.id)}
                className="bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-[#4658C9] dark:hover:border-[#818CF8] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="p-3.5">
                  {/* Miniature Board Preview (Interactive=false, coordinates=false for clean card) */}
                  <div className="w-full aspect-square mx-auto rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xs">
                    <ChessBoard
                      fen={puzzle.solverFen}
                      orientation={puzzle.sideToMove}
                      interactive={false}
                      showCoordinates={false}
                      boardTheme={boardTheme}
                      className="w-full h-full shadow-none"
                    />
                  </div>

                  {/* Card metadata */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-black text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wide">
                        {puzzle.difficultyBand} • {puzzle.rating}
                      </span>
                      {isSolved && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-extrabold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Solved
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-slate-950 dark:text-white group-hover:text-[#4658C9] dark:group-hover:text-[#818CF8] transition-colors line-clamp-1">
                      {puzzle.title}
                    </h3>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                      {puzzle.objective}
                    </p>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-[#111625] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#4658C9] dark:text-[#A5B4FC]">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                    {puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move
                  </span>
                  <div className="flex items-center gap-1">
                    <span>Solve</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
