import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess, Square } from 'chess.js';
import { PuzzleRecord, BoardThemeId, TacticalTheme } from '../types/puzzle';
import { ChessBoard } from './ChessBoard';
import { PuzzleControls } from './PuzzleControls';
import { HintPanel } from './HintPanel';
import { MoveStatus, MoveStatusType } from './MoveStatus';
import { getHintContent, formatThemeLabel, uciToSan } from '../utils/chessUtils';
import { recordPuzzleSolved } from '../utils/storage';
import { Share2, Check, ArrowRight, Shield, Award, Sparkles, Zap, Compass, Swords } from 'lucide-react';
import { AdSlot } from './AdSlot';
import { ShareModal } from './ShareModal';

interface PuzzlePlayerProps {
  puzzle: PuzzleRecord;
  boardTheme: BoardThemeId;
  onNavigatePuzzle?: (id: string) => void;
  onOpenWorksheet?: (id: string) => void;
  onNavigate?: (route: string) => void;
}

export const PuzzlePlayer: React.FC<PuzzlePlayerProps> = ({
  puzzle,
  boardTheme,
  onNavigatePuzzle,
  onOpenWorksheet,
  onNavigate,
}) => {
  // Current board FEN
  const [currentFen, setCurrentFen] = useState<string>(puzzle.solverFen);
  // Board orientation ('w' or 'b') - default: side to move at bottom
  const [orientation, setOrientation] = useState<'w' | 'b'>(puzzle.sideToMove);
  // Progress in puzzle move sequence (index in puzzle.moves; setup move is index 0)
  const [moveIndex, setMoveIndex] = useState<number>(1);
  // Last move played
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(() => {
    if (puzzle.moves.length > 0) {
      const setup = puzzle.moves[0];
      return { from: setup.substring(0, 2), to: setup.substring(2, 4) };
    }
    return null;
  });
  // Status and feedback
  const [status, setStatus] = useState<MoveStatusType>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  // Progressive hint level: 0 = none, 1 = motif/piece, 2 = zone, 3 = exact
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [hintData, setHintData] = useState<{ title: string; hintText: string; highlightSquare?: string } | null>(null);
  // Solution playback mode
  const [isSolutionVisible, setIsSolutionVisible] = useState<boolean>(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(1);
  const [isPlayingSolution, setIsPlayingSolution] = useState<boolean>(false);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Share copy confirmation
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  // Social share & challenge modal state
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareModalTab, setShareModalTab] = useState<'share' | 'challenge' | 'result'>('share');
  // Metric tracking for spoiler-free result cards
  const [attempts, setAttempts] = useState<number>(1);
  const startTimeRef = useRef<number>(Date.now());
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  // Initialize or reset puzzle state when puzzle changes
  const resetPuzzle = useCallback(() => {
    setCurrentFen(puzzle.solverFen);
    setOrientation(puzzle.sideToMove);
    setMoveIndex(1);
    setStatus('idle');
    setStatusMessage('');
    setHintLevel(0);
    setHintData(null);
    setIsSolutionVisible(false);
    setIsPlayingSolution(false);
    setAttempts(1);
    startTimeRef.current = Date.now();
    setDurationSeconds(0);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);

    if (puzzle.moves.length > 0) {
      const setup = puzzle.moves[0];
      setLastMove({ from: setup.substring(0, 2), to: setup.substring(2, 4) });
    } else {
      setLastMove(null);
    }
  }, [puzzle]);

  useEffect(() => {
    resetPuzzle();
  }, [resetPuzzle]);

  // Clean up playback timer
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  // Check state calculation
  const chessInstance = React.useMemo(() => {
    try {
      return new Chess(currentFen);
    } catch {
      return new Chess();
    }
  }, [currentFen]);

  const isCheck = chessInstance.inCheck();
  const isCheckmate = chessInstance.isCheckmate();

  // Handle user move attempt
  const handleUserMove = (from: string, to: string, promotion?: string) => {
    if (status === 'solved' || isSolutionVisible) return;

    const uci = `${from}${to}${promotion || ''}`;
    const expectedMove = puzzle.moves[moveIndex];

    if (!expectedMove) return;

    // Check if move matches expected solution line
    if (uci === expectedMove) {
      // Legal and correct move!
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

        // Check if puzzle is completed
        if (nextIndex >= puzzle.moves.length) {
          setStatus('solved');
          setStatusMessage('Tactical sequence completed!');
          const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          setDurationSeconds(elapsed);
          recordPuzzleSolved(puzzle.id, hintLevel);
        } else {
          // Play opponent response after brief pause
          setStatus('correct');
          setStatusMessage('Best move! Opponent is responding...');
          setMoveIndex(nextIndex);

          setTimeout(() => {
            const oppUci = puzzle.moves[nextIndex];
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
                setStatus('idle');
                setStatusMessage(`Your turn (${puzzle.sideToMove === 'w' ? 'White' : 'Black'}).`);
              }
            }
          }, 450);
        }
      } catch (err) {
        console.error('Error applying correct move:', err);
      }
    } else {
      // Incorrect move
      setStatus('wrong');
      setStatusMessage('That is not the optimal continuation. Try looking for a more forcing line.');
      setAttempts((prev) => prev + 1);
    }
  };

  // Progressive Hint Handler
  const handleRequestHint = () => {
    const nextLevel = Math.min(hintLevel + 1, 3) as 1 | 2 | 3;
    setHintLevel(nextLevel);

    const expectedMove = puzzle.moves[moveIndex];
    if (expectedMove) {
      const data = getHintContent(
        currentFen,
        expectedMove,
        nextLevel,
        puzzle.themes[0]
      );
      setHintData(data);
    }
  };

  // Show Solution / Playback toggles
  const handleShowSolution = () => {
    setIsSolutionVisible(true);
    // Build initial board for playback
    setPlaybackIndex(1);
    replayToPlaybackIndex(1);
  };

  const replayToPlaybackIndex = (idx: number) => {
    try {
      const chess = new Chess(puzzle.solverFen);
      let lastM: { from: string; to: string } | null = null;
      for (let i = 1; i <= idx && i < puzzle.moves.length; i++) {
        const u = puzzle.moves[i];
        const f = u.substring(0, 2) as Square;
        const t = u.substring(2, 4) as Square;
        const p = u.length > 4 ? u.substring(4) : undefined;
        chess.move({ from: f, to: t, promotion: p });
        lastM = { from: f, to: t };
      }
      setCurrentFen(chess.fen());
      setLastMove(lastM);
      setPlaybackIndex(idx);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStepBack = () => {
    if (playbackIndex > 1) {
      replayToPlaybackIndex(playbackIndex - 1);
    }
  };

  const handleStepForward = () => {
    if (playbackIndex < puzzle.moves.length - 1) {
      replayToPlaybackIndex(playbackIndex + 1);
    }
  };

  const handleTogglePlaySolution = () => {
    if (isPlayingSolution) {
      setIsPlayingSolution(false);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    } else {
      setIsPlayingSolution(true);
      let curr = playbackIndex;
      playbackTimerRef.current = setInterval(() => {
        curr++;
        if (curr < puzzle.moves.length) {
          replayToPlaybackIndex(curr);
        } else {
          setIsPlayingSolution(false);
          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
        }
      }, 900);
    }
  };

  // Share functionality (strictly spoiler-free)
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/puzzle/${puzzle.id}`;
    const shareData = {
      title: `PlyQuest Tactics Puzzle: ${puzzle.title}`,
      text: `Can you solve this chess puzzle? (${puzzle.objective}) on PlyQuest`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-8">
      {/* Top Breadcrumb & Taxonomy */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold mb-0.5">
            <span className="text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wide">
              {puzzle.difficultyBand}
            </span>
            <span aria-hidden="true">•</span>
            <span>Rating {puzzle.rating}</span>
            <span aria-hidden="true">•</span>
            <span className="capitalize">{puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight truncate">
            {puzzle.title}
          </h1>
        </div>

        {/* Theme Badges */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {puzzle.themes.map((theme) => (
            <span
              key={theme}
              className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#4658C9]/10 dark:bg-[#4658C9]/30 text-[#4658C9] dark:text-[#C7D2FE] border border-[#4658C9]/20"
            >
              {formatThemeLabel(theme)}
            </span>
          ))}
        </div>
      </div>

      {/* Main Puzzle Grid: Desktop board on left, controls on right; Mobile board first, controls below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Board (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center w-full min-w-0">
          <div className="w-full flex justify-center">
            <ChessBoard
              fen={currentFen}
              orientation={orientation}
              onMove={handleUserMove}
              interactive={status !== 'solved' && !isSolutionVisible}
              lastMove={lastMove}
              hintSquare={hintData?.highlightSquare}
              isCheck={isCheck}
              isCheckmate={isCheckmate}
              boardTheme={boardTheme}
              showCoordinates={true}
              className="cb-board-responsive shadow-md"
            />
          </div>

          {/* Sub-board status ticker on Mobile */}
          <div className="w-full mt-3 lg:hidden">
            <MoveStatus
              status={status}
              message={statusMessage || puzzle.objective}
              sideToMove={chessInstance.turn()}
              isCheck={isCheck}
              isCheckmate={isCheckmate}
              onRetry={resetPuzzle}
              onNextPuzzle={() => onNavigatePuzzle && onNavigatePuzzle('next')}
            />
          </div>
        </div>

        {/* Right Column: Controls, Objective, Hints, Feedback (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5 w-full min-w-0">
          {/* Objective Banner */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xs"
          >
            <span className="text-[11px] font-black text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wider block mb-1">
              Objective
            </span>
            <p className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-snug">
              {puzzle.objective}
            </p>
          </motion.div>

          {/* Status on Desktop */}
          <div className="hidden lg:block">
            <MoveStatus
              status={status}
              message={statusMessage || puzzle.objective}
              sideToMove={chessInstance.turn()}
              isCheck={isCheck}
              isCheckmate={isCheckmate}
              onRetry={resetPuzzle}
              onNextPuzzle={() => onNavigatePuzzle && onNavigatePuzzle('next')}
            />
          </div>

          {/* Progressive Hint Display */}
          <HintPanel
            level={hintLevel}
            title={hintData?.title}
            hintText={hintData?.hintText}
            onNextHint={hintLevel < 3 ? handleRequestHint : undefined}
          />

          {/* Puzzle Actions Control Bar */}
          <PuzzleControls
            onHint={handleRequestHint}
            hintLevel={hintLevel}
            maxHintLevel={3}
            onReset={resetPuzzle}
            onShowSolution={handleShowSolution}
            isSolutionVisible={isSolutionVisible}
            onRotateBoard={() => setOrientation(orientation === 'w' ? 'b' : 'w')}
            onShare={() => {
              setShareModalTab('share');
              setShareModalOpen(true);
            }}
            onChallenge={() => {
              setShareModalTab('challenge');
              setShareModalOpen(true);
            }}
            onPrint={() => onOpenWorksheet && onOpenWorksheet(puzzle.id)}
            onNextPuzzle={
              onNavigatePuzzle && status !== 'solved'
                ? () => onNavigatePuzzle('next')
                : undefined
            }
            isPlayingSolution={isPlayingSolution}
            onTogglePlaySolution={handleTogglePlaySolution}
            onStepBack={handleStepBack}
            onStepForward={handleStepForward}
            canStepBack={playbackIndex > 1}
            canStepForward={playbackIndex < puzzle.moves.length - 1}
          />

          {/* Share Notifications */}
          <AnimatePresence>
            {shareCopied && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="p-3 bg-emerald-50 dark:bg-[#0E2822] border-2 border-emerald-400 dark:border-emerald-600 rounded-xl text-xs font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2 shadow-xs"
              >
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Spoiler-free puzzle link copied to clipboard!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tactical Breakdown & Learning Links (Revealed when solved or solution shown) */}
          <AnimatePresence>
            {(status === 'solved' || isSolutionVisible) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ type: 'spring', damping: 20 }}
                className="p-4 bg-white dark:bg-[#161C2E] border-2 border-[#4658C9]/30 dark:border-[#4658C9]/50 rounded-2xl shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-black text-slate-950 dark:text-white">
                    <Sparkles className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />
                    Tactical Breakdown
                  </div>
                  {onNavigatePuzzle && (
                    <button
                      onClick={() => onNavigatePuzzle('next')}
                      className="px-3 py-1.5 bg-[#4658C9] hover:bg-[#3847A8] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Next Puzzle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-bold leading-relaxed">
                  {puzzle.explanation}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Continue Training:</span>
                  {puzzle.themes.length > 0 && onNavigate && (
                    <button
                      onClick={() => onNavigate(`/themes/${puzzle.themes[0]}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#252D50] hover:bg-slate-200 dark:hover:bg-[#313B66] text-xs font-bold text-[#3548C5] dark:text-[#C7D2FE] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>More {formatThemeLabel(puzzle.themes[0])}</span>
                    </button>
                  )}
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate(`/difficulty/${puzzle.difficultyBand}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#252D50] hover:bg-slate-200 dark:hover:bg-[#313B66] text-xs font-bold text-[#3548C5] dark:text-[#C7D2FE] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Compass className="w-3 h-3" />
                      <span>{puzzle.difficultyBand.toUpperCase()} Difficulty</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Solution: {puzzle.moves.slice(1).join(' ')}
                </div>

                {/* Growth Sharing Loop: Result Card & Challenge Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-200 dark:border-slate-800">
                  {status === 'solved' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShareModalTab('result');
                        setShareModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Share Result Card</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShareModalTab('challenge');
                      setShareModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#4658C9] hover:bg-[#3548C5] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Swords className="w-3.5 h-3.5 text-[#C7D2FE]" />
                    <span>Challenge a Friend</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Isolated AdSlot below solving area */}
      <AdSlot slotId="puzzle-bottom-banner" format="leaderboard" className="mt-8" />

      {/* Social Sharing, Challenge & Result Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        puzzle={puzzle}
        stats={
          status === 'solved'
            ? {
                attempts,
                hintsUsed: hintLevel,
                durationSeconds,
                isDaily: puzzle.id.startsWith('cb-daily-'),
                dateStr: new Date().toISOString().split('T')[0],
              }
            : undefined
        }
        initialTab={shareModalTab}
      />
    </div>
  );
};
