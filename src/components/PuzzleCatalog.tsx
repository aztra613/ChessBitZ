import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { usePuzzles, usePuzzleManifest } from './PuzzleProvider';
import { getIndexEntry, searchIndex, PuzzleIndexEntry } from '../utils/puzzleStore';
import { getArchiveIdsForMonth } from '../utils/dailySchedule';
import { TacticalTheme, BoardThemeId } from '../types/puzzle';
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

/** Cards per page. Records are fetched per page, never for the whole corpus. */
const PAGE_SIZE = 24;

export const PuzzleCatalog: React.FC<PuzzleCatalogProps> = ({
  initialThemeFilter,
  initialDifficultyFilter,
  initialMateFilter,
  isArchive = false,
  archiveYear = '2026',
  archiveMonth = '10',
  boardTheme,
  onSelectPuzzle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>(initialThemeFilter || 'all');
  const [selectedDiff, setSelectedDiff] = useState<string>(initialDifficultyFilter || 'all');
  const [page, setPage] = useState(0);

  const { ready } = usePuzzleManifest();
  const stats = useMemo(() => getStoredStats(), []);

  // Filtering runs entirely over the manifest index — no puzzle records required.
  const filtered: PuzzleIndexEntry[] = useMemo(() => {
    if (isArchive) {
      return getArchiveIdsForMonth(archiveYear, archiveMonth)
        .map((id) => getIndexEntry(id))
        .filter((entry): entry is PuzzleIndexEntry => Boolean(entry));
    }

    return searchIndex(searchTerm, {
      theme: selectedTheme,
      difficulty: selectedDiff,
      mateIn: initialMateFilter,
    });
  }, [isArchive, archiveYear, archiveMonth, searchTerm, selectedTheme, selectedDiff, initialMateFilter, ready]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedTheme, selectedDiff, isArchive, archiveYear, archiveMonth]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const visibleIds = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE).map((entry) => entry.id),
    [filtered, safePage]
  );

  // Only the bucket(s) backing this page are fetched.
  const { puzzles: visiblePuzzles, loading } = usePuzzles(visibleIds);

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

  const inputClass =
    'w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-[#4658C9] cursor-pointer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          {pageHeader.title}
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
          {pageHeader.desc}
        </p>
        {ready && (
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
            {filtered.length.toLocaleString()} puzzle{filtered.length === 1 ? '' : 's'} matching your filters
          </p>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-[#1A2032] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs mb-8 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by motif (e.g. fork, pin), difficulty, or theme..."
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white placeholder:text-slate-500 focus:outline-[#4658C9]"
          />
        </div>

        <div className="w-full md:w-52">
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className={inputClass}
            aria-label="Filter by Tactical Motif"
          >
            <option value="all">All Tactical Themes</option>
            <optgroup label="Mate">
              {['mateIn1', 'mateIn2', 'mateIn3', 'mateIn4', 'mateIn5'].map((t) => (
                <option key={t} value={t}>{formatThemeLabel(t)}</option>
              ))}
            </optgroup>
            <optgroup label="Core motifs">
              {[
                'fork', 'pin', 'skewer', 'discoveredAttack', 'discoveredCheck', 'doubleCheck',
                'deflection', 'sacrifice', 'clearance', 'interference', 'xRayAttack',
                'capturingDefender', 'attraction', 'intermezzo', 'quietMove', 'zugzwang',
              ].map((t) => (
                <option key={t} value={t}>{formatThemeLabel(t)}</option>
              ))}
            </optgroup>
            <optgroup label="King safety">
              {['exposedKing', 'backRankMate', 'smotheredMate', 'kingsideAttack', 'queensideAttack', 'attackingF2F7'].map((t) => (
                <option key={t} value={t}>{formatThemeLabel(t)}</option>
              ))}
            </optgroup>
            <optgroup label="Pieces & pawns">
              {['hangingPiece', 'trappedPiece', 'advancedPawn', 'promotion', 'underPromotion', 'enPassant', 'castling'].map((t) => (
                <option key={t} value={t}>{formatThemeLabel(t)}</option>
              ))}
            </optgroup>
            <optgroup label="Endgames">
              {['endgame', 'rookEndgame', 'pawnEndgame', 'bishopEndgame', 'knightEndgame', 'queenEndgame', 'queenRookEndgame'].map((t) => (
                <option key={t} value={t}>{formatThemeLabel(t)}</option>
              ))}
            </optgroup>
            <optgroup label="Checkmate patterns">
              {[
                'operaMate', 'pillsburysMate', 'arabianMate', 'anastasiaMate', 'bodenMate',
                'dovetailMate', 'doubleBishopMate', 'epauletteMate', 'hookMate', 'cornerMate',
                'swallowstailMate', 'triangleMate', 'killBoxMate', 'morphysMate',
                'blindSwineMate', 'vukovicMate', 'balestraMate',
              ].map((t) => (
                <option key={t} value={t}>{formatThemeLabel(t)}</option>
              ))}
            </optgroup>
            <optgroup label="Defensive">
              {['defensiveMove', 'collinearMove'].map((t) => (
                <option key={t} value={t}>{formatThemeLabel(t)}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="w-full md:w-44">
          <select
            value={selectedDiff}
            onChange={(e) => setSelectedDiff(e.target.value)}
            className={inputClass}
            aria-label="Filter by Difficulty Band"
          >
            <option value="all">All Skill Levels</option>
            <option value="beginner">Beginner (&lt;1200)</option>
            <option value="intermediate">Intermediate (1200-1700)</option>
            <option value="advanced">Advanced (1700-2200)</option>
            <option value="master">Master (2200+)</option>
          </select>
        </div>
      </div>

      {/* Puzzles Grid */}
      {!ready || (loading && visiblePuzzles.length === 0) ? (
        <div className="text-center py-16 bg-white dark:bg-[#1A2032] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading puzzles…</p>
        </div>
      ) : filtered.length === 0 ? (
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
            {visiblePuzzles.map((puzzle) => {
              const isSolved = stats.solvedPuzzles[puzzle.id]?.status === 'solved';

              return (
                <motion.div
                  key={puzzle.id}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => onSelectPuzzle(puzzle.id)}
                  className="bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-[#4658C9] dark:hover:border-[#818CF8] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="p-3.5">
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

          {/* Pagination — keeps the per-visit download bounded */}
          {pageCount > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2032] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Page {safePage + 1} of {pageCount}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2032] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
