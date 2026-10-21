import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Info, CheckCircle2, ChevronRight } from 'lucide-react';

interface HintPanelProps {
  level: number;
  title?: string;
  hintText?: string;
  onNextHint?: () => void;
  maxLevel?: number;
  className?: string;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  level,
  title,
  hintText,
  onNextHint,
  maxLevel = 3,
  className = '',
}) => {
  if (level === 0 || !hintText) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`p-4 rounded-2xl border-2 shadow-sm transition-colors ${
        'bg-[#EEF2FF] dark:bg-[#181E38] border-[#A5B4FC] dark:border-[#434F82]'
      } ${className}`}
      role="region"
      aria-live="polite"
      aria-label="Tactical Hint"
    >
      <div className="flex items-start gap-3.5">
        {/* Solid high-contrast icon badge with subtle motion */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 0] }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="p-2.5 bg-[#4658C9] dark:bg-[#6366F1] text-white rounded-xl mt-0.5 shrink-0 shadow-sm"
        >
          <Lightbulb className="w-4 h-4 fill-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-xs font-black text-[#1E1B4B] dark:text-[#E0E7FF] uppercase tracking-wider">
              {title || `Tactical Hint (Tier ${level})`}
            </h4>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#3730A3] dark:bg-[#6366F1] text-white font-extrabold shrink-0 shadow-2xs">
              Hint {level} of {maxLevel}
            </span>
          </div>

          {/* High-contrast crystal clear body text - completely legible in both light and dark modes */}
          <p className="text-sm font-bold text-slate-950 dark:text-white mt-2 leading-relaxed">
            {hintText}
          </p>

          <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-[#CBD5E1] dark:border-[#2D3758] text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Info className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
              Verified engine analysis
            </span>

            {level < maxLevel && onNextHint && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.04, x: 2 }}
                whileTap={{ scale: 0.96 }}
                onClick={onNextHint}
                className="text-[#3730A3] dark:text-[#C7D2FE] bg-white dark:bg-[#252D50] hover:bg-indigo-50 dark:hover:bg-[#2D3762] border border-[#A5B4FC] dark:border-[#4B588F] px-2.5 py-1 rounded-lg font-black inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
              >
                <span>Narrow down further</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            )}

            {level >= maxLevel && (
              <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md font-black border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Full Solution Revealed
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
