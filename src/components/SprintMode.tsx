/**
 * PlyQuest — Sprint Mode Component
 *
 * A timed puzzle challenge: solve N puzzles as fast as possible
 * or as many puzzles as you can within a time limit.
 *
 * Modes:
 * - Blitz Sprint: 5 minutes, unlimited puzzles
 * - Quick 10: Solve 10 puzzles, timed
 * - Marathon 25: Solve 25 puzzles, timed
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, Trophy, Play, RotateCcw, ArrowRight, Pause, X, Target, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { PuzzleRecord, BoardThemeId } from '../types/puzzle';
import { ChessBoard } from './ChessBoard';
import { getIndex, loadPuzzlesByIds } from '../utils/puzzleStore';
import { Chess, Square } from 'chess.js';

export type SprintType = 'blitz5' | 'quick10' | 'marathon25';

interface SprintConfig {
  type: SprintType;
  label: string;
  description: string;
  icon: React.ReactNode;
  timeLimitSeconds?: number; // undefined = no time limit (count-based)
  puzzleCount?: number; // undefined = unlimited (time-based)
  color: string;
}

const SPRINT_CONFIGS: SprintConfig[] = [
  {
    type: 'blitz5',
    label: 'Blitz Sprint',
    description: 'Solve as many puzzles as you can in 5 minutes',
    icon: <Zap className="w-6 h-6" />,
    timeLimitSeconds: 300,
    color: '#F59E0B',
  },
  {
    type: 'quick10',
    label: 'Quick 10',
    description: 'Solve 10 puzzles as fast as possible',
    icon: <Target className="w-6 h-6" />,
    puzzleCount: 10,
    color: '#4658C9',
  },
  {
    type: 'marathon25',
    label: 'Marathon 25',
    description: 'Solve 25 puzzles — endurance test',
    icon: <Trophy className="w-6 h-6" />,
    puzzleCount: 25,
    color: '#059669',
  },
];

interface SprintResult {
  puzzleId: string;
  solved: boolean;
  timeMs: number;
  hintsUsed: number;
}

interface SprintModeProps {
  boardTheme: BoardThemeId;
  onNavigate: (route: string) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const SprintMode: React.FC<SprintModeProps> = ({ boardTheme, onNavigate }) => {
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'finished'>('select');
  const [sprintType, setSprintType] = useState<SprintType>('quick10');
  const [puzzleQueue, setPuzzleQueue] = useState<PuzzleRecord[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [results, setResults] = useState<SprintResult[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [puzzleStartMs, setPuzzleStartMs] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  // Puzzle solving state
  const [currentFen, setCurrentFen] = useState('');
  const [moveIndex, setMoveIndex] = useState(1);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [moveStatus, setMoveStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);
  const pausedElapsedRef = useRef(0);

  const config = SPRINT_CONFIGS.find(c => c.type === sprintType)!;
  const currentPuzzle = puzzleQueue[currentPuzzleIndex];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start sprint — picks from the manifest index, then hydrates only the chosen run.
  const startSprint = useCallback(async () => {
    const eligible = getIndex().filter(
      (entry) => entry.transformType !== 'color-symmetric-rank-reflect'
    );
    const pickedIds = shuffleArray(eligible)
      .slice(0, config.puzzleCount || 100)
      .map((entry) => entry.id);

    const queue = await loadPuzzlesByIds(pickedIds);

    setPuzzleQueue(queue);
    setCurrentPuzzleIndex(0);
    setResults([]);
    setElapsedMs(0);
    pausedElapsedRef.current = 0;
    setPhase('countdown');
    setCountdownValue(3);
  }, [config]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdownValue <= 0) {
      setPhase('playing');
      startTimeRef.current = Date.now();
      setPuzzleStartMs(Date.now());
      // Initialize first puzzle
      if (puzzleQueue[0]) {
        setCurrentFen(puzzleQueue[0].solverFen);
        setMoveIndex(1);
        setMoveStatus('idle');
        if (puzzleQueue[0].moves.length > 0) {
          const setup = puzzleQueue[0].moves[0];
          setLastMove({ from: setup.substring(0, 2), to: setup.substring(2, 4) });
        }
      }
      return;
    }
    const timer = setTimeout(() => setCountdownValue(v => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdownValue, puzzleQueue]);

  // Main timer
  useEffect(() => {
    if (phase !== 'playing' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = pausedElapsedRef.current + (now - startTimeRef.current);
      setElapsedMs(elapsed);

      // Check time limit
      if (config.timeLimitSeconds && elapsed >= config.timeLimitSeconds * 1000) {
        setPhase('finished');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused, config.timeLimitSeconds]);

  // Handle pause
  const togglePause = useCallback(() => {
    if (isPaused) {
      startTimeRef.current = Date.now();
      setIsPaused(false);
    } else {
      pausedElapsedRef.current += Date.now() - startTimeRef.current;
      setIsPaused(true);
    }
  }, [isPaused]);

  // Advance to next puzzle
  const advancePuzzle = useCallback((solved: boolean, hintsUsed = 0) => {
    const timeMs = Date.now() - puzzleStartMs;
    const result: SprintResult = {
      puzzleId: currentPuzzle?.id || '',
      solved,
      timeMs,
      hintsUsed,
    };
    const newResults = [...results, result];
    setResults(newResults);

    const nextIndex = currentPuzzleIndex + 1;

    // Check if sprint is over (count-based)
    if (config.puzzleCount && newResults.length >= config.puzzleCount) {
      setPhase('finished');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Check if we've run out of puzzles
    if (nextIndex >= puzzleQueue.length) {
      setPhase('finished');
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Load next puzzle
    setCurrentPuzzleIndex(nextIndex);
    const nextPuzzle = puzzleQueue[nextIndex];
    setCurrentFen(nextPuzzle.solverFen);
    setMoveIndex(1);
    setMoveStatus('idle');
    setPuzzleStartMs(Date.now());
    if (nextPuzzle.moves.length > 0) {
      const setup = nextPuzzle.moves[0];
      setLastMove({ from: setup.substring(0, 2), to: setup.substring(2, 4) });
    }
  }, [currentPuzzle, currentPuzzleIndex, puzzleQueue, puzzleStartMs, results, config.puzzleCount]);

  // Handle user move in sprint
  const handleSprintMove = useCallback((from: string, to: string, promotion?: string) => {
    if (!currentPuzzle || moveStatus === 'correct') return;

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
        const nextIndex = moveIndex + 1;

        if (nextIndex >= currentPuzzle.moves.length) {
          // Puzzle complete!
          setMoveStatus('correct');
          setTimeout(() => advancePuzzle(true), 600);
        } else {
          setMoveIndex(nextIndex);
          // Play opponent response
          setTimeout(() => {
            const oppUci = currentPuzzle.moves[nextIndex];
            if (oppUci) {
              const oppFrom = oppUci.substring(0, 2) as Square;
              const oppTo = oppUci.substring(2, 4) as Square;
              const oppPromo = oppUci.length > 4 ? oppUci.substring(4) : undefined;
              const oppChess = new Chess(newFen);
              const oppMoveRes = oppChess.move({ from: oppFrom, to: oppTo, promotion: oppPromo });
              if (oppMoveRes) {
                setCurrentFen(oppChess.fen());
                setLastMove({ from: oppFrom, to: oppTo });
                setMoveIndex(nextIndex + 1);
              }
            }
          }, 300);
        }
      } catch {
        // Ignore errors
      }
    } else {
      // Wrong move - skip puzzle
      setMoveStatus('wrong');
      setTimeout(() => advancePuzzle(false), 800);
    }
  }, [currentPuzzle, currentFen, moveIndex, moveStatus, advancePuzzle]);

  // Format time display
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${min}:${String(sec).padStart(2, '0')}.${tenths}`;
  };

  // Format time remaining for blitz mode
  const formatTimeRemaining = (ms: number) => {
    if (!config.timeLimitSeconds) return '';
    const remaining = Math.max(0, config.timeLimitSeconds * 1000 - ms);
    return formatTime(remaining);
  };

  // Compute stats for finished screen
  const finishedStats = useMemo(() => {
    if (phase !== 'finished') return null;
    const solved = results.filter(r => r.solved).length;
    const total = results.length;
    const accuracy = total > 0 ? Math.round((solved / total) * 100) : 0;
    const avgTimeMs = total > 0 ? results.reduce((s, r) => s + r.timeMs, 0) / total : 0;
    const bestTimeMs = results.length > 0 ? Math.min(...results.filter(r => r.solved).map(r => r.timeMs)) : 0;
    return { solved, total, accuracy, avgTimeMs, bestTimeMs };
  }, [phase, results]);

  // Chess instance for check detection
  const chessInstance = useMemo(() => {
    try {
      return new Chess(currentFen);
    } catch {
      return new Chess();
    }
  }, [currentFen]);

  // ─── RENDER PHASES ───

  // Phase: Select Sprint Type
  if (phase === 'select') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center justify-center gap-3">
            <Zap className="w-8 h-8 text-amber-500" />
            Sprint Mode
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-2 max-w-lg mx-auto">
            Challenge yourself with timed puzzle sprints. How fast can you solve them?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SPRINT_CONFIGS.map((cfg) => (
            <motion.button
              key={cfg.type}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSprintType(cfg.type);
                startSprint();
              }}
              className="p-6 bg-white dark:bg-[#161C2E] border-2 border-slate-300 dark:border-slate-700 rounded-2xl hover:border-[#4658C9] dark:hover:border-[#818CF8] transition-all cursor-pointer text-left group shadow-xs"
            >
              <div className="flex items-center gap-3 mb-3" style={{ color: cfg.color }}>
                {cfg.icon}
                <span className="text-lg font-black">{cfg.label}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                {cfg.description}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#4658C9] dark:text-[#A5B4FC] opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-3.5 h-3.5" />
                Start Sprint
              </div>
            </motion.button>
          ))}
        </div>

        <div className="text-center mt-8">
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

  // Phase: Countdown
  if (phase === 'countdown') {
    return (
      <div className="max-w-lg mx-auto px-4 py-32 text-center">
        <motion.div
          key={countdownValue}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-8xl font-black text-[#4658C9] dark:text-[#818CF8]"
        >
          {countdownValue > 0 ? countdownValue : 'GO!'}
        </motion.div>
        <p className="mt-6 text-sm font-bold text-slate-600 dark:text-slate-400">
          {config.label} — {config.description}
        </p>
      </div>
    );
  }

  // Phase: Finished
  if (phase === 'finished' && finishedStats) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Trophy className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h1 className="text-3xl font-black text-slate-950 dark:text-white mb-2">Sprint Complete!</h1>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-8">
            {config.label} — {formatTime(elapsedMs)}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Solved', value: `${finishedStats.solved}/${finishedStats.total}`, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Accuracy', value: `${finishedStats.accuracy}%`, color: 'text-[#4658C9] dark:text-[#818CF8]' },
            { label: 'Total Time', value: formatTime(elapsedMs), color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Best Solve', value: finishedStats.bestTimeMs > 0 ? formatTime(finishedStats.bestTimeMs) : '—', color: 'text-violet-600 dark:text-violet-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl text-center shadow-xs"
            >
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Results list */}
        <div className="bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl p-4 mb-6 shadow-xs">
          <h3 className="text-sm font-black text-slate-950 dark:text-white mb-3">Puzzle Results</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((r, i) => {
              const puzzle = puzzleQueue[i];
              return (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-2">
                    {r.solved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    )}
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {puzzle?.title || `Puzzle ${i + 1}`}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                    {formatTime(r.timeMs)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setPhase('select');
              setResults([]);
              setElapsedMs(0);
            }}
            className="px-5 py-2.5 bg-[#4658C9] hover:bg-[#3847A8] text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            New Sprint
          </button>
          <button
            onClick={() => onNavigate('/puzzles')}
            className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Puzzle Library
          </button>
        </div>
      </div>
    );
  }

  // Phase: Playing
  if (!currentPuzzle) {
    setPhase('finished');
    return null;
  }

  const progressPercent = config.puzzleCount
    ? Math.round((results.length / config.puzzleCount) * 100)
    : config.timeLimitSeconds
    ? Math.round((elapsedMs / (config.timeLimitSeconds * 1000)) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      {/* Sprint Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-black" style={{ color: config.color }}>
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
          </div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Puzzle {results.length + 1}
            {config.puzzleCount ? ` / ${config.puzzleCount}` : ''}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className={`flex items-center gap-1.5 text-lg font-mono font-black tabular-nums ${
            config.timeLimitSeconds && elapsedMs > config.timeLimitSeconds * 800
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-900 dark:text-white'
          }`}>
            <Timer className="w-4 h-4" />
            {config.timeLimitSeconds ? formatTimeRemaining(elapsedMs) : formatTime(elapsedMs)}
          </div>

          {/* Pause/Skip */}
          <button
            onClick={togglePause}
            className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => advancePuzzle(false)}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            title="Skip puzzle"
          >
            Skip <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setPhase('finished');
              if (timerRef.current) clearInterval(timerRef.current);
            }}
            className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/30 hover:bg-rose-200 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            title="End sprint"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: config.color }}
          animate={{ width: `${Math.min(progressPercent, 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center"
            onClick={togglePause}
          >
            <div className="text-center">
              <Pause className="w-16 h-16 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white">Paused</h2>
              <p className="text-sm text-slate-400 mt-2">Click anywhere to resume</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex justify-center">
            <ChessBoard
              fen={currentFen}
              orientation={currentPuzzle.sideToMove}
              onMove={handleSprintMove}
              interactive={!isPaused && moveStatus !== 'correct'}
              lastMove={lastMove}
              isCheck={chessInstance.inCheck()}
              isCheckmate={chessInstance.isCheckmate()}
              boardTheme={boardTheme}
              showCoordinates={true}
              className="cb-board-responsive shadow-md"
            />
          </div>

          {/* Status Feedback */}
          <AnimatePresence mode="wait">
            {moveStatus === 'wrong' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 px-4 py-2 bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-sm font-bold text-rose-800 dark:text-rose-200"
              >
                Wrong — skipping...
              </motion.div>
            )}
            {moveStatus === 'correct' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 px-4 py-2 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-sm font-bold text-emerald-800 dark:text-emerald-200"
              >
                ✓ Correct!
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

          {/* Score ticker */}
          <div className="p-3 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-700 dark:text-emerald-400">
                ✓ {results.filter(r => r.solved).length}
              </span>
              <span className="text-rose-700 dark:text-rose-400">
                ✗ {results.filter(r => !r.solved).length}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {results.length > 0
                  ? `${Math.round((results.filter(r => r.solved).length / results.length) * 100)}% accuracy`
                  : '—'
                }
              </span>
            </div>
          </div>

          {/* Theme badges */}
          <div className="flex flex-wrap gap-1.5">
            {currentPuzzle.themes.map(t => (
              <span
                key={t}
                className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#4658C9]/10 dark:bg-[#4658C9]/30 text-[#4658C9] dark:text-[#C7D2FE] border border-[#4658C9]/20"
              >
                {t}
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
