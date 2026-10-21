/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Chess, Square } from 'chess.js';
import { PuzzleRecord, BoardThemeId } from '../types/puzzle';
import { ChessBoard } from './ChessBoard';
import { Lightbulb, RotateCcw, ExternalLink, Check, Sparkles } from 'lucide-react';
import { getHintContent } from '../utils/chessUtils';

interface EmbedWidgetProps {
  puzzle: PuzzleRecord;
  boardTheme?: BoardThemeId;
}

export const EmbedWidget: React.FC<EmbedWidgetProps> = ({
  puzzle,
  boardTheme = 'ocean-slate',
}) => {
  const [currentFen, setCurrentFen] = useState<string>(puzzle.solverFen);
  const [moveIndex, setMoveIndex] = useState<number>(1);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'solved'>('idle');
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2>(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(() => {
    if (puzzle.moves.length > 0) {
      const setup = puzzle.moves[0];
      return { from: setup.substring(0, 2), to: setup.substring(2, 4) };
    }
    return null;
  });

  const handleReset = () => {
    setCurrentFen(puzzle.solverFen);
    setMoveIndex(1);
    setStatus('idle');
    setHintLevel(0);
    setHintText(null);
    if (puzzle.moves.length > 0) {
      const setup = puzzle.moves[0];
      setLastMove({ from: setup.substring(0, 2), to: setup.substring(2, 4) });
    }
  };

  const handleHint = () => {
    const next = Math.min(hintLevel + 1, 2) as 1 | 2;
    setHintLevel(next);
    const expected = puzzle.moves[moveIndex];
    if (expected) {
      const h = getHintContent(currentFen, expected, next, puzzle.themes[0]);
      setHintText(h.hintText);
    }
  };

  const handleMove = (from: string, to: string, promo?: string) => {
    if (status === 'solved') return;
    const uci = `${from}${to}${promo || ''}`;
    const expected = puzzle.moves[moveIndex];

    if (uci === expected) {
      try {
        const chess = new Chess(currentFen);
        chess.move({ from: from as Square, to: to as Square, promotion: promo });
        const newFen = chess.fen();
        setCurrentFen(newFen);
        setLastMove({ from, to });
        const nextIdx = moveIndex + 1;

        if (nextIdx >= puzzle.moves.length) {
          setStatus('solved');
        } else {
          setStatus('correct');
          setMoveIndex(nextIdx);
          setTimeout(() => {
            const oppUci = puzzle.moves[nextIdx];
            if (oppUci) {
              const oppChess = new Chess(newFen);
              oppChess.move({
                from: oppUci.substring(0, 2) as Square,
                to: oppUci.substring(2, 4) as Square,
                promotion: oppUci.length > 4 ? oppUci.substring(4) : undefined,
              });
              setCurrentFen(oppChess.fen());
              setLastMove({ from: oppUci.substring(0, 2), to: oppUci.substring(2, 4) });
              setMoveIndex(nextIdx + 1);
              setStatus('idle');
            }
          }, 400);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setStatus('wrong');
    }
  };

  const fullUrl = `https://plyquest.pages.dev/puzzle/${puzzle.id}`;

  return (
    <div className="w-full max-w-sm mx-auto p-3 bg-white dark:bg-[#161C2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center select-none text-slate-900 dark:text-white font-sans">
      {/* Mini Brand & Tactic Title */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-xs text-[#3548C5] dark:text-[#818CF8]">PlyQuest</span>
          <span className="text-[10px] text-slate-400">• Rated {puzzle.rating}</span>
        </div>
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-[#4658C9] dark:text-[#A5B4FC] hover:underline flex items-center gap-0.5"
        >
          <span>Open Full</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Board */}
      <div className="w-full max-w-[320px] aspect-square mb-2.5">
        <ChessBoard
          fen={currentFen}
          orientation={puzzle.sideToMove}
          lastMove={lastMove}
          onMove={handleMove}
          boardTheme={boardTheme}
        />
      </div>

      {/* Status Bar */}
      <div className="w-full text-center mb-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-xs font-bold min-h-[28px] flex items-center justify-center">
        {status === 'solved' ? (
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Solved! Excellent calculation.
          </span>
        ) : status === 'wrong' ? (
          <span className="text-rose-600 dark:text-rose-400">Incorrect. Try another move.</span>
        ) : status === 'correct' ? (
          <span className="text-sky-600 dark:text-sky-400">Best move! Opponent responding...</span>
        ) : (
          <span className="text-slate-700 dark:text-slate-300">
            {puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move • {puzzle.objective}
          </span>
        )}
      </div>

      {/* Optional Hint Banner */}
      {hintText && (
        <div className="w-full mb-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 text-center font-medium">
          💡 {hintText}
        </div>
      )}

      {/* Mini Controls */}
      <div className="w-full flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleHint}
          disabled={hintLevel >= 2 || status === 'solved'}
          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Hint</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 px-2 rounded-lg bg-[#4658C9] hover:bg-[#3548C5] text-white text-xs font-bold flex items-center justify-center gap-1 text-center"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Solve</span>
        </a>
      </div>
    </div>
  );
};
