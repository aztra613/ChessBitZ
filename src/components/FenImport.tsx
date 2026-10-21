/**
 * PlyQuest — Private FEN/PGN Import Component
 *
 * Lets users paste a FEN string or PGN notation to analyze a position
 * locally in the browser. No data is sent to any server.
 *
 * Features:
 * - Paste and validate FEN strings
 * - Auto-detect side to move from FEN
 * - Interactive board for analysis
 * - Reset and flip controls
 * - Copy FEN to clipboard
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ClipboardPaste, RotateCcw, FlipVertical, Copy, Check, AlertCircle, Shield, ChevronRight, Trash2 } from 'lucide-react';
import { BoardThemeId } from '../types/puzzle';
import { ChessBoard } from './ChessBoard';
import { Chess, Square } from 'chess.js';

interface FenImportProps {
  boardTheme: BoardThemeId;
  onNavigate: (route: string) => void;
}

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const EXAMPLE_FENS = [
  {
    label: 'Lucena Position',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    desc: 'Famous rook endgame — White wins with the "bridge" technique.',
  },
  {
    label: 'Philidor Position',
    fen: '2k5/8/3K4/8/8/4r3/5P2/5R2 w - - 0 1',
    desc: 'Key defensive drawing technique in rook endgames.',
  },
  {
    label: 'Scholar\'s Mate Threat',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 3',
    desc: 'White threatens Qxf7#. Can Black defend?',
  },
  {
    label: 'Legal\'s Mate',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    desc: 'Classic tactical pattern with a queen sacrifice.',
  },
];

export const FenImport: React.FC<FenImportProps> = ({ boardTheme, onNavigate }) => {
  const [fenInput, setFenInput] = useState('');
  const [activeFen, setActiveFen] = useState(DEFAULT_FEN);
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const chessInstance = useMemo(() => {
    try {
      return new Chess(activeFen);
    } catch {
      return new Chess();
    }
  }, [activeFen]);

  const isCheck = chessInstance.inCheck();
  const isCheckmate = chessInstance.isCheckmate();
  const isStalemate = chessInstance.isStalemate();
  const isDraw = chessInstance.isDraw();
  const turn = chessInstance.turn();

  // Validate and apply FEN
  const applyFen = useCallback((fen: string) => {
    const trimmed = fen.trim();
    if (!trimmed) {
      setError('Please enter a FEN string.');
      return;
    }

    try {
      const test = new Chess(trimmed);
      setActiveFen(test.fen());
      setError(null);
      setMoveHistory([]);
      setLastMove(null);
      setOrientation(test.turn());
    } catch (e) {
      setError(`Invalid FEN: ${(e as Error).message}`);
    }
  }, []);

  // Handle moves on the analysis board
  const handleMove = useCallback((from: string, to: string, promotion?: string) => {
    try {
      const chess = new Chess(activeFen);
      const moveRes = chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion || undefined,
      });
      if (moveRes) {
        setActiveFen(chess.fen());
        setLastMove({ from, to });
        setMoveHistory(prev => [...prev, moveRes.san]);
      }
    } catch {
      // Invalid move — ignore silently
    }
  }, [activeFen]);

  // Undo last move
  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) return;
    try {
      // Rebuild from initial FEN up to n-1 moves
      const startFen = fenInput.trim() || DEFAULT_FEN;
      const chess = new Chess(startFen);
      const newHistory = moveHistory.slice(0, -1);
      for (const san of newHistory) {
        chess.move(san);
      }
      setActiveFen(chess.fen());
      setMoveHistory(newHistory);
      setLastMove(null);
    } catch {
      // Fallback: just reset
      applyFen(fenInput || DEFAULT_FEN);
    }
  }, [moveHistory, fenInput, applyFen]);

  // Copy FEN to clipboard
  const handleCopyFen = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeFen);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [activeFen]);

  // Paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFenInput(text);
      applyFen(text);
    } catch {
      setError('Unable to read clipboard. Please paste the FEN manually.');
    }
  }, [applyFen]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-3">
          <Upload className="w-7 h-7 text-[#4658C9] dark:text-[#818CF8]" />
          Position Import & Analysis
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
          Paste a FEN string to analyse any chess position locally. Everything runs in your browser — nothing is uploaded.
        </p>
        <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          100% private — no data leaves your device
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Left Column: Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex justify-center">
            <ChessBoard
              fen={activeFen}
              orientation={orientation}
              onMove={handleMove}
              interactive={!isCheckmate && !isStalemate && !isDraw}
              lastMove={lastMove}
              isCheck={isCheck}
              isCheckmate={isCheckmate}
              boardTheme={boardTheme}
              showCoordinates={true}
              className="cb-board-responsive shadow-md"
            />
          </div>

          {/* Board status */}
          <div className="w-full mt-3 text-center">
            {isCheckmate && (
              <div className="px-4 py-2 bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-sm font-bold text-rose-800 dark:text-rose-200">
                Checkmate — {turn === 'w' ? 'Black' : 'White'} wins!
              </div>
            )}
            {isStalemate && (
              <div className="px-4 py-2 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-sm font-bold text-amber-800 dark:text-amber-200">
                Stalemate — Draw
              </div>
            )}
            {isDraw && !isStalemate && (
              <div className="px-4 py-2 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-sm font-bold text-amber-800 dark:text-amber-200">
                Draw
              </div>
            )}
            {!isCheckmate && !isStalemate && !isDraw && (
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                {turn === 'w' ? 'White' : 'Black'} to move
                {isCheck && ' — Check!'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* FEN Input Area */}
          <div className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xs">
            <label className="text-xs font-black text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wider block mb-2">
              FEN Notation
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyFen(fenInput);
                }}
                placeholder="Paste FEN string here..."
                className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white placeholder:text-slate-500 focus:outline-[#4658C9]"
              />
              <button
                onClick={() => applyFen(fenInput)}
                className="px-3 py-2 bg-[#4658C9] hover:bg-[#3847A8] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                Load
              </button>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handlePaste}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ClipboardPaste className="w-3 h-3" />
                Paste
              </button>
              <button
                onClick={handleCopyFen}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Current'}
              </button>
            </div>

            {/* Error display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2.5 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Board Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOrientation(o => o === 'w' ? 'b' : 'w')}
              className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FlipVertical className="w-3.5 h-3.5" />
              Flip Board
            </button>
            <button
              onClick={handleUndo}
              disabled={moveHistory.length === 0}
              className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={() => {
                setActiveFen(DEFAULT_FEN);
                setFenInput('');
                setMoveHistory([]);
                setLastMove(null);
                setError(null);
                setOrientation('w');
              }}
              className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* Move History */}
          {moveHistory.length > 0 && (
            <div className="p-3 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
              <h3 className="text-xs font-black text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wider mb-2">
                Move History
              </h3>
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                {moveHistory.map((move, i) => (
                  <span key={i}>
                    {i % 2 === 0 && <span className="text-slate-500 dark:text-slate-400">{Math.floor(i / 2) + 1}. </span>}
                    <span>{move} </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current FEN Display */}
          <div className="p-3 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Current FEN
            </h3>
            <code className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200 break-all block leading-tight">
              {activeFen}
            </code>
          </div>

          {/* Example Positions */}
          <div className="p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xs">
            <h3 className="text-xs font-black text-[#4658C9] dark:text-[#818CF8] uppercase tracking-wider mb-3">
              Example Positions
            </h3>
            <div className="space-y-2">
              {EXAMPLE_FENS.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setFenInput(ex.fen);
                    applyFen(ex.fen);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#4658C9] dark:hover:border-[#818CF8] bg-slate-50 dark:bg-slate-900 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#4658C9] dark:group-hover:text-[#818CF8] transition-colors">
                      {ex.label}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#4658C9] dark:group-hover:text-[#818CF8] transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                    {ex.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
