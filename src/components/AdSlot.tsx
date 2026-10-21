import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AdSlotProps {
  slotId?: string;
  format?: 'banner' | 'leaderboard' | 'box';
  className?: string;
}

/**
 * AdSlot Component - Inactive by default as specified in PlyQuest PRD v2.2
 *
 * Strict Isolation Guarantees:
 * 1. Zero runtime third-party scripts loaded without explicit consent & configuration.
 * 2. Absolutely no event handlers attached to chessboard or solving actions.
 * 3. Ads are fully isolated outside the board/action viewport.
 * 4. Ad-blockers or failed script responses never impede solving, hints, or printing.
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  slotId = 'cb-slot-default',
  format = 'leaderboard',
  className = '',
}) => {
  // Production toggle: Keep disabled until Monetag agreement, tag QA, and CMP are verified
  const adsEnabled = false;

  if (!adsEnabled) {
    return (
      <aside
        className={`w-full max-w-4xl mx-auto my-6 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#1A2032] text-center shadow-2xs transition-colors ${className}`}
        aria-label="Advertising Placement Placeholder"
      >
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-700 dark:bg-emerald-600 text-white font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
            <span>Ad Slot: {slotId}</span>
          </div>
          <span className="text-slate-900 dark:text-slate-100 font-bold">
            Ad-Free Privacy Baseline
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-bold" aria-hidden="true">•</span>
          <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
            100% tracker-free & zero third-party scripts loaded
          </span>
        </div>
      </aside>
    );
  }

  return (
    <div
      id={slotId}
      className={`ad-container my-4 flex items-center justify-center overflow-hidden min-h-[90px] bg-slate-50 border border-slate-200 ${className}`}
      data-ad-format={format}
    >
      {/* Real Monetag script container will mount here once audited */}
    </div>
  );
};
