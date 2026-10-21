import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Sparkles, Flag, ArrowRight, RotateCcw } from 'lucide-react';

export type MoveStatusType = 'idle' | 'correct' | 'wrong' | 'solved' | 'check';

interface MoveStatusProps {
  status: MoveStatusType;
  message?: string;
  sideToMove: 'w' | 'b';
  isCheck?: boolean;
  isCheckmate?: boolean;
  onRetry?: () => void;
  onNextPuzzle?: () => void;
  className?: string;
}

export const MoveStatus: React.FC<MoveStatusProps> = ({
  status,
  message,
  sideToMove,
  isCheck = false,
  isCheckmate = false,
  onRetry,
  onNextPuzzle,
  className = '',
}) => {
  const sideLabel = sideToMove === 'w' ? 'White' : 'Black';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${status}-${isCheck}-${isCheckmate}`}
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.98 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className={`rounded-2xl p-4 border-2 transition-all shadow-sm ${
          status === 'solved'
            ? 'bg-emerald-50 dark:bg-[#0E2822] border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50'
            : status === 'correct'
            ? 'bg-emerald-50 dark:bg-[#0E2822] border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50'
            : status === 'wrong'
            ? 'bg-rose-50 dark:bg-[#2C1318] border-rose-500 dark:border-rose-600 text-rose-950 dark:text-rose-50'
            : 'bg-white dark:bg-[#161C2E] border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white'
        } ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            {status === 'solved' && (
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: [1, 1.2, 1], rotate: 0 }}
                transition={{ duration: 0.5 }}
                className="p-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl shrink-0 shadow-md"
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            )}
            {status === 'correct' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl shrink-0 shadow-md"
              >
                <CheckCircle2 className="w-5 h-5" />
              </motion.div>
            )}
            {status === 'wrong' && (
              <motion.div
                animate={{ x: [-4, 4, -4, 4, 0] }}
                transition={{ duration: 0.4 }}
                className="p-2 bg-rose-600 dark:bg-rose-500 text-white rounded-xl shrink-0 shadow-md"
              >
                <AlertCircle className="w-5 h-5" />
              </motion.div>
            )}
            {status === 'idle' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171B34] dark:bg-[#4658C9] text-white text-xs font-black shrink-0 shadow-sm">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    sideToMove === 'w' ? 'bg-white border-slate-300' : 'bg-slate-950 border-white/80'
                  }`}
                />
                <span>{sideLabel} to move</span>
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm sm:text-base font-black truncate text-slate-950 dark:text-white">
                {status === 'solved'
                  ? 'Puzzle Solved! Brilliant tactic.'
                  : status === 'correct'
                  ? 'Best move! Opponent responding...'
                  : status === 'wrong'
                  ? 'Not the optimal move. Try again!'
                  : message || `${sideLabel} to find the best continuation.`}
              </p>
              {isCheck && !isCheckmate && (
                <p className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 mt-0.5">
                  <Flag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  King is in check!
                </p>
              )}
              {isCheckmate && (
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Checkmate delivered!
                </p>
              )}
            </div>
          </div>

          {/* Action button: Retry if wrong, Next if solved */}
          <div className="shrink-0 flex items-center gap-2">
            {status === 'wrong' && onRetry && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={onRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white transition-all shadow-md cursor-pointer"
                aria-label="Retry move"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </motion.button>
            )}

            {status === 'solved' && onNextPuzzle && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={onNextPuzzle}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white transition-all shadow-md cursor-pointer"
                aria-label="Next puzzle"
              >
                <span>Next Puzzle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
