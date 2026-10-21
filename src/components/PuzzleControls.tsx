import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, RotateCcw, Eye, Share2, Printer, RotateCw, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PuzzleControlsProps {
  onHint: () => void;
  hintLevel: number; // 0, 1, 2, 3
  maxHintLevel: number;
  onReset: () => void;
  onShowSolution: () => void;
  isSolutionVisible: boolean;
  onRotateBoard: () => void;
  onShare: () => void;
  onPrint: () => void;
  // Solution playback state
  isPlayingSolution?: boolean;
  onTogglePlaySolution?: () => void;
  onStepBack?: () => void;
  onStepForward?: () => void;
  canStepBack?: boolean;
  canStepForward?: boolean;
  disabled?: boolean;
}

export const PuzzleControls: React.FC<PuzzleControlsProps> = ({
  onHint,
  hintLevel,
  maxHintLevel = 3,
  onReset,
  onShowSolution,
  isSolutionVisible,
  onRotateBoard,
  onShare,
  onPrint,
  isPlayingSolution = false,
  onTogglePlaySolution,
  onStepBack,
  onStepForward,
  canStepBack = false,
  canStepForward = false,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Primary Action Buttons: Hint, Reset, Show Solution */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* Progressive Hint Button */}
        <motion.button
          type="button"
          whileHover={{ scale: disabled || hintLevel >= maxHintLevel ? 1 : 1.02 }}
          whileTap={{ scale: disabled || hintLevel >= maxHintLevel ? 1 : 0.96 }}
          onClick={onHint}
          disabled={disabled || hintLevel >= maxHintLevel}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[46px] rounded-xl text-xs sm:text-sm font-black transition-all border shadow-xs cursor-pointer ${
            hintLevel > 0
              ? 'bg-[#4658C9] dark:bg-[#6366F1] text-white border-[#3548C5] dark:border-[#4F46E5] hover:bg-[#3548C5]'
              : 'bg-white dark:bg-[#161C2E] text-slate-950 dark:text-white border-slate-300 dark:border-slate-700 hover:border-[#4658C9] hover:bg-slate-50 dark:hover:bg-slate-800'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label={
            hintLevel >= maxHintLevel
              ? 'All hints unlocked'
              : `Request progressive hint (level ${hintLevel + 1} of ${maxHintLevel})`
          }
        >
          <Lightbulb
            className={`w-4 h-4 shrink-0 ${
              hintLevel > 0 ? 'text-white fill-white' : 'text-[#4658C9] dark:text-[#818CF8]'
            }`}
          />
          <span className="truncate">
            {hintLevel === 0 ? 'Hint' : hintLevel >= maxHintLevel ? 'Hints Maxed' : `Hint (${hintLevel}/${maxHintLevel})`}
          </span>
        </motion.button>

        {/* Reset Position Button */}
        <motion.button
          type="button"
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.96 }}
          onClick={onReset}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[46px] rounded-xl text-xs sm:text-sm font-black transition-all border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-950 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Reset puzzle position"
        >
          <RotateCcw className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
          <span>Reset</span>
        </motion.button>

        {/* Show Solution Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onShowSolution}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[46px] rounded-xl text-xs sm:text-sm font-black transition-all border shadow-xs cursor-pointer ${
            isSolutionVisible
              ? 'bg-[#171B34] dark:bg-[#F3F5FC] text-white dark:text-[#171B34] border-[#171B34] dark:border-[#F3F5FC]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-950 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#4658C9]'
          }`}
          aria-label={isSolutionVisible ? 'Solution revealed' : 'Show full solution'}
        >
          <Eye
            className={`w-4 h-4 shrink-0 ${
              isSolutionVisible ? 'text-white dark:text-[#171B34]' : 'text-[#4658C9] dark:text-[#818CF8]'
            }`}
          />
          <span className="truncate">{isSolutionVisible ? 'Solution' : 'Reveal'}</span>
        </motion.button>
      </div>

      {/* Solution Playback Bar (Visible when solution is shown) */}
      {isSolutionVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center justify-between p-3 bg-slate-100 dark:bg-[#1E253A] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs"
        >
          <span className="text-xs font-black text-slate-950 dark:text-white">
            Solution Playback
          </span>
          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onStepBack}
              disabled={!canStepBack}
              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-950 dark:text-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Step back one move"
              aria-label="Step back one move"
            >
              <SkipBack className="w-4 h-4" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onTogglePlaySolution}
              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-[#4658C9] bg-[#4658C9] text-white hover:bg-[#3548C5] shadow-xs transition-colors cursor-pointer"
              title={isPlayingSolution ? 'Pause playback' : 'Play solution moves'}
              aria-label={isPlayingSolution ? 'Pause playback' : 'Play solution moves'}
            >
              {isPlayingSolution ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onStepForward}
              disabled={!canStepForward}
              className="p-2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-950 dark:text-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Step forward one move"
              aria-label="Step forward one move"
            >
              <SkipForward className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Secondary Utility Controls: Rotate Board, Share, Print Worksheet */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRotateBoard}
          className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-white dark:bg-[#161C2E] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
          aria-label="Rotate chessboard"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
          <span>Rotate</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShare}
          className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-white dark:bg-[#161C2E] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
          aria-label="Share puzzle link"
        >
          <Share2 className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
          <span>Share</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPrint}
          className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-white dark:bg-[#161C2E] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
          aria-label="Print worksheet for this puzzle"
        >
          <Printer className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
          <span>Print</span>
        </motion.button>
      </div>
    </div>
  );
};
