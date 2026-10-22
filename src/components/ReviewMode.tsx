/**
 * PlyQuest — Spaced Repetition Review Component
 *
 * Shows puzzles due for review based on the SM-2 spaced repetition algorithm.
 * Tracks puzzle mastery entirely in browser localStorage.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BarChart3, RefreshCw, CheckCircle2, XCircle, ArrowRight, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { PuzzleRecord, BoardThemeId } from '../types/puzzle';
import { getIndex, loadPuzzlesByIds } from '../utils/puzzleStore';
import { ChessBoard } from './ChessBoard';
import { Chess, Square } from 'chess.js';
import {
  getDueReviews,
  getNewPuzzles,
  getSRSStats,
  recordReview,
  outcomeToQuality,
  clearSRSData,
  SRSState,
} from '../utils/spacedRepetition';
import { getHintContent, formatThemeLabel } from '../utils/chessUtils';

interface ReviewModeProps {
  boardTheme: BoardThemeId;
  onNavigate: (route: string) => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ boardTheme, onNavigate }) => {
  const [phase, setPhase] = useState<'dashboard' | 'reviewing' | 'done'>('dashboard');
  const [reviewQueue, setReviewQueue] = useState<PuzzleRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState(getSRSStats());

  // Puzzle solving state
  const [currentFen, setCurrentFen] = useState('');
  const [moveIndex, setMoveIndex] = useState(1);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'solved'>('idle');
  const [hintLevel, setHintLevel] = useState(0);
  const [viewedSolution, setViewedSolution] = useState(false);

  const currentPuzzle = reviewQueue[currentIndex];

  // Build review queue — selection runs over the manifest index, then only the
  // chosen puzzles are hydrated.
  const buildQueue = useCallback(async () => {
    const index = getIndex();
    const due = getDueReviews(index, 15);
    const fresh = getNewPuzzles(index, Math.max(0, 10 - due.length));
    const ids = [...due, ...fresh].map((entry) => entry.id);

    const records = await loadPuzzlesByIds(ids);
    setReviewQueue(records);
    setStats(getSRSStats());
  }, []);

  useEffect(() => {
    void buildQueue();
  }, [buildQueue]);

  // Initialize puzzle board
  const initPuzzle = useCallback((puzzle: PuzzleRecord) => {
    setCurrentFen(puzzle.solverFen);
    setMoveIndex(1);
    setStatus('idle');
    setHintLevel(0);
    setViewedSolution(false);
    if (puzzle.moves.length > 0) {
      const setup = puzzle.moves[0];
      setLastMove({ from: setup.substring(0, 2), to: setup.substring(2, 4) });
    } else {
      setLastMove(null);
    }
  }, []);

  // Start review session
  const startReview = useCallback(() => {
    if (reviewQueue.length === 0) return;
    setCurrentIndex(0);
    initPuzzle(reviewQueue[0]);
    setPhase('reviewing');
  }, [reviewQueue, initPuzzle]);

  // Handle move
  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    if (!currentPuzzle || status === 'solved') return;

    const uci = `${from}${to}${promotion || ''}`;
    const expectedMove = currentPuzzle.moves[moveIndex];

    if (!expectedMove) return;

    if (uci === expectedMove) {
      try {
        const chess = new Chess(currentFen);
        const moveRes = chess.move({
          from: from as Square,
          to: to as Square,
          promotion: promotion || undefined,
        });
        if (!moveRes) return;

        const newFen = chess.fen();
        setCurrentFen(newFen);
        setLastMove({ from, to });
        const nextIdx = moveIndex + 1;

        if (nextIdx >= currentPuzzle.moves.length) {
          setStatus('solved');
          // Record successful review
          const quality = outcomeToQuality(true, hintLevel, viewedSolution);
          recordReview(currentPuzzle.id, quality);
        } else {
          setStatus('correct');
          setMoveIndex(nextIdx);

          setTimeout(() => {
            const oppUci = currentPuzzle.moves[nextIdx];
            if (oppUci) {
              const oppFrom = oppUci.substring(0, 2) as Square;
              const oppTo = oppUci.substring(2, 4) as Square;
              const oppPromo = oppUci.length > 4 ? oppUci.substring(4) : undefined;
              const oppChess = new Chess(newFen);
              const oppMoveRes = oppChess.move({ from: oppFrom, to: oppTo, promotion: oppPromo });
              if (oppMoveRes) {
                setCurrentFen(oppChess.fen());
                setLastMove({ from: oppFrom, to: oppTo });
                setMoveIndex(nextIdx + 1);
                setStatus('idle');
              }
            }
          }, 400);
        }
      } catch {
        // Error
      }
    } else {
      setStatus('wrong');
      // Record failed review
      const quality = outcomeToQuality(false, hintLevel, viewedSolution);
      recordReview(currentPuzzle.id, quality);
    }
  }, [currentPuzzle, currentFen, moveIndex, status, hintLevel, viewedSolution]);

  // Next puzzle in queue
  const nextPuzzle = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= reviewQueue.length) {
      setPhase('done');
      setStats(getSRSStats());
      return;
    }
    setCurrentIndex(nextIdx);
    initPuzzle(reviewQueue[nextIdx]);
  }, [currentIndex, reviewQueue, initPuzzle]);

  // Chess instance for check detection
  const chessInstance = useMemo(() => {
    try {
      return new Chess(currentFen);
    } catch {
      return new Chess();
    }
  }, [currentFen]);

  // ─── DASHBOARD ───
  if (phase === 'dashboard') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center justify-center gap-3">
            <Brain className="w-8 h-8 text-violet-500" />
            Spaced Repetition
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-2 max-w-lg mx-auto">
            Smart review system that focuses on puzzles you struggle with. Mastery builds over time through optimally spaced reviews.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Tracked', value: stats.totalTracked, icon: <BookOpen className="w-4 h-4" />, color: 'text-[#4658C9] dark:text-[#818CF8]' },
            { label: 'Due Today', value: stats.dueToday, icon: <RefreshCw className="w-4 h-4" />, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Mastered', value: stats.mastered, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Struggling', value: stats.struggling, icon: <XCircle className="w-4 h-4" />, color: 'text-rose-600 dark:text-rose-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl text-center shadow-xs"
            >
              <div className={`text-2xl font-black ${stat.color} flex items-center justify-center gap-1.5`}>
                {stat.icon}
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={startReview}
            disabled={reviewQueue.length === 0}
            className="px-6 py-3 bg-[#4658C9] hover:bg-[#3847A8] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Brain className="w-4 h-4" />
            Start Review Session ({reviewQueue.length} puzzles)
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all spaced repetition data? This cannot be undone.')) {
                clearSRSData();
                buildQueue();
              }
            }}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>

        {/* Mastery Progress */}
        {stats.totalTracked > 0 && (
          <div className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xs">
            <h3 className="text-xs font-black text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wider mb-3">
              Mastery Progress
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${(stats.mastered / stats.totalTracked) * 100}%` }}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${(stats.learning / stats.totalTracked) * 100}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all"
                  style={{ width: `${(stats.struggling / stats.totalTracked) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Mastered</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Learning</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Struggling</span>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('/puzzles')}
            className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-[#4658C9] dark:hover:text-[#818CF8] transition-colors cursor-pointer"
          >
            ← Back to Puzzle Library
          </button>
        </div>
      </div>
    );
  }

  // ─── SESSION COMPLETE ───
  if (phase === 'done') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Sparkles className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-3xl font-black text-slate-950 dark:text-white mb-2">Session Complete!</h1>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-6">
            You reviewed {reviewQueue.length} puzzles. Come back tomorrow for your next session.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.mastered}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Mastered</div>
            </div>
            <div className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
              <div className="text-2xl font-black text-[#4658C9] dark:text-[#818CF8]">{stats.totalTracked}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Total Tracked</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                buildQueue();
                setPhase('dashboard');
              }}
              className="px-5 py-2.5 bg-[#4658C9] hover:bg-[#3847A8] text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => onNavigate('/puzzles')}
              className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Puzzle Library
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── REVIEWING ───
  if (!currentPuzzle) {
    setPhase('done');
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      {/* Progress Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-black text-violet-600 dark:text-violet-400">
          <Brain className="w-5 h-5" />
          <span>Review {currentIndex + 1} / {reviewQueue.length}</span>
        </div>
        <button
          onClick={() => {
            setPhase('done');
            setStats(getSRSStats());
          }}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
        >
          End Session
        </button>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-violet-500 rounded-full"
          animate={{ width: `${((currentIndex + 1) / reviewQueue.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex justify-center">
            <ChessBoard
              fen={currentFen}
              orientation={currentPuzzle.sideToMove}
              onMove={handleMove}
              interactive={status !== 'solved' && status !== 'wrong'}
              lastMove={lastMove}
              isCheck={chessInstance.inCheck()}
              isCheckmate={chessInstance.isCheckmate()}
              boardTheme={boardTheme}
              showCoordinates={true}
              className="cb-board-responsive shadow-md"
            />
          </div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {status === 'wrong' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 w-full p-3 bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-sm font-bold text-rose-800 dark:text-rose-200 text-center"
              >
                Incorrect — this puzzle needs more practice.
                <button
                  onClick={nextPuzzle}
                  className="ml-3 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </motion.div>
            )}
            {status === 'solved' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 w-full p-3 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-200 text-center"
              >
                ✓ Excellent! Review scheduled.
                <button
                  onClick={nextPuzzle}
                  className="ml-3 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Next →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xs">
            <span className="text-[11px] font-black text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wider block mb-1">
              Objective
            </span>
            <p className="text-sm font-black text-slate-950 dark:text-white leading-snug">
              {currentPuzzle.objective}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {currentPuzzle.themes.map(t => (
              <span
                key={t}
                className="text-xs font-bold px-2.5 py-1 rounded-md bg-violet-500/10 dark:bg-violet-500/30 text-violet-700 dark:text-violet-200 border border-violet-500/20"
              >
                {formatThemeLabel(t)}
              </span>
            ))}
          </div>

          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Rating: {currentPuzzle.rating} • {currentPuzzle.difficultyBand}
          </div>
        </div>
      </div>
    </div>
  );
};
