import React from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCcw } from 'lucide-react';
import { BOARD_THEMES } from '../data/puzzles';
import { BoardThemeId } from '../types/puzzle';

interface BoardThemeSelectorProps {
  currentTheme: BoardThemeId;
  onThemeChange: (theme: BoardThemeId) => void;
  className?: string;
}

export const BoardThemeSelector: React.FC<BoardThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  className = '',
}) => {
  return (
    <div className={`p-4 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xl ${className}`}>
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-black text-slate-950 dark:text-white">
            Chessboard Palette
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            Customizes board squares without altering brand indigo buttons.
          </p>
        </div>
        {currentTheme !== 'ocean-slate' && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onThemeChange('ocean-slate')}
            className="inline-flex items-center gap-1 text-xs text-[#3548C5] dark:text-[#A5B4FC] hover:underline font-bold focus-visible:ring-2 focus-visible:ring-[#3548C5] rounded p-1 cursor-pointer"
            title="Reset to Ocean Slate default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {BOARD_THEMES.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <motion.button
              key={theme.id}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onThemeChange(theme.id as BoardThemeId)}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#4658C9] dark:border-[#818CF8] ring-2 ring-[#4658C9]/30 bg-[#4658C9]/10 dark:bg-[#4658C9]/25 shadow-xs'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-[#111625]'
              }`}
              aria-label={`Select ${theme.name} theme`}
              aria-pressed={isSelected}
            >
              {/* Mini 4x4 preview board representing the 8x8 theme */}
              <div className="w-full aspect-square max-w-[56px] rounded-lg border border-black/15 overflow-hidden grid grid-cols-4 grid-rows-4 mb-2 shadow-2xs">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const row = Math.floor(idx / 4);
                  const col = idx % 4;
                  const isLight = (row + col) % 2 === 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: isLight ? theme.lightSquare : theme.darkSquare,
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-slate-950 dark:text-white">
                  {theme.name}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8] shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold mt-0.5 line-clamp-1">
                {theme.isDefault ? 'Default' : theme.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
