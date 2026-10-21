import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Printer, Sparkles, Target, Zap, Shield, BookOpen, Layers, CheckCircle2, Brain, Upload, Timer } from 'lucide-react';
import { PUZZLES } from '../data/puzzles';
import { getDailyPuzzle } from '../utils/dailySchedule';
import { ChessBoard } from './ChessBoard';
import { BoardThemeId } from '../types/puzzle';
import { AdSlot } from './AdSlot';

interface LandingPageProps {
  boardTheme: BoardThemeId;
  onNavigate: (route: string) => void;
  onSelectPuzzle: (id: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  boardTheme,
  onNavigate,
  onSelectPuzzle,
}) => {
  // Today's daily puzzle
  const dailyPuzzle = getDailyPuzzle();

  const collections = [
    {
      title: 'Mate in 1',
      description: 'Instant tactical strikes and mating patterns for developing rapid board vision.',
      badge: 'Beginner',
      route: '/mate-in-1',
      count: PUZZLES.filter((p) => p.themes.includes('mateIn1')).length,
    },
    {
      title: 'Mate in 2',
      description: 'Calculated 2-move forced mating sequences, decoys, and king nets.',
      badge: 'Intermediate',
      route: '/mate-in-2',
      count: PUZZLES.filter((p) => p.themes.includes('mateIn2')).length,
    },
    {
      title: 'Knight & Pawn Forks',
      description: 'Royal forks, double attacks, and decisive tactical piece overloads.',
      badge: 'All Levels',
      route: '/themes/fork',
      count: PUZZLES.filter((p) => p.themes.includes('fork')).length,
    },
    {
      title: 'Pins & Skewers',
      description: 'Absolute pins against the monarch and linear skewers across open ranks.',
      badge: 'Intermediate',
      route: '/themes/pin',
      count: PUZZLES.filter((p) => p.themes.includes('pin') || p.themes.includes('skewer')).length,
    },
    {
      title: 'Beginner Foundations',
      description: 'Sub-1200 tactical drills to build unshakable calculation fundamentals.',
      badge: '<1200 Rating',
      route: '/difficulty/beginner',
      count: PUZZLES.filter((p) => p.difficultyBand === 'beginner').length,
    },
    {
      title: 'Mixed Tactical Practice',
      description: 'Unfiltered combination tactics testing your intuition across all motifs.',
      badge: 'Curated',
      route: '/puzzles',
      count: PUZZLES.length,
    },
  ];

  return (
    <div className="w-full">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-slate-50 dark:from-[#1A2032] dark:to-[#101321] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4658C9]/10 dark:bg-[#4658C9]/25 text-[#4658C9] dark:text-[#A5B4FC] text-xs font-bold border border-[#4658C9]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>100% Free • No Account • No Subscription</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.15]">
                Train your tactics, one move at a time.
              </h1>

              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-xl">
                Free chess puzzles, helpful hints, and printable worksheets. No account required.
              </p>

              {/* Main CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectPuzzle(dailyPuzzle.id)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#4658C9] text-white text-sm font-bold shadow-md hover:bg-[#3548C5] transition-all min-h-[48px] cursor-pointer"
                >
                  <Target className="w-4 h-4" />
                  <span>Solve Today's Puzzle</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onNavigate('/printable-chess-puzzles')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161C2E] text-slate-900 dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all min-h-[48px] cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Build a Worksheet</span>
                </motion.button>
              </div>

              {/* Value checks */}
              <div className="pt-4 flex flex-wrap items-center gap-5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Lichess CC0 verified data
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Works fully offline after load
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Zero intrusive tracking
                </span>
              </div>
            </div>

            {/* Hero Right: Daily Puzzle Card Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full max-w-md p-5 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[11px] uppercase font-black text-[#4658C9] dark:text-[#818CF8] tracking-wider block">
                      Daily Challenge • {dailyPuzzle.dateAssigned || 'Today'}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                      {dailyPuzzle.title}
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#4658C9]/10 dark:bg-[#4658C9]/30 text-[#4658C9] dark:text-[#C7D2FE] font-extrabold border border-[#4658C9]/20">
                    Rating {dailyPuzzle.rating}
                  </span>
                </div>

                {/* Visible board preview - NO spoilers */}
                <div className="w-full aspect-square my-2 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xs">
                  <ChessBoard
                    fen={dailyPuzzle.solverFen}
                    orientation={dailyPuzzle.sideToMove}
                    interactive={false}
                    showCoordinates={true}
                    boardTheme={boardTheme}
                    className="w-full h-full shadow-none"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {dailyPuzzle.objective}
                  </span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onSelectPuzzle(dailyPuzzle.id)}
                    className="px-4 py-2 rounded-xl bg-[#4658C9] hover:bg-[#3548C5] text-white text-xs font-black transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    Solve Now &rarr;
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Curated Tactical Motifs
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-2 leading-relaxed">
            Target specific blindspots with focused tactical categories from beginner mates to sharp skewers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col) => (
            <motion.div
              key={col.title}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onNavigate(col.route)}
              className="p-5 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl hover:border-[#4658C9] dark:hover:border-[#818CF8] hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4658C9] dark:text-[#818CF8]">
                    {col.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {col.count} Puzzles
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white group-hover:text-[#4658C9] dark:group-hover:text-[#818CF8] transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
                  {col.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#4658C9] dark:text-[#818CF8]">
                <span>Start Training</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. WORKSHEET STUDIO FEATURE SHOWCASE */}
      <section className="py-14 bg-white dark:bg-[#1A2032] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4658C9]/10 dark:bg-[#4658C9]/30 text-[#4658C9] dark:text-[#C7D2FE] text-xs font-bold border border-[#4658C9]/20">
                <Printer className="w-3.5 h-3.5" />
                <span>Coach & Classroom Utility</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                Export Crisp Tactical Worksheets in Seconds
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                Generate clean, ready-to-print A4 or US Letter PDF sheets with 1, 2, 4, or 6 puzzles per page.
                Choose between question-only layouts or append an answer key for student evaluation.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-bold">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
                  <span>Pure vector chess diagrams with crisp print coordinates</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
                  <span>Optional student name/date lines handled strictly locally</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
                  <span>Separate answer key PDF generation option</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/printable-chess-puzzles')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#4658C9] text-white text-xs font-bold hover:bg-[#3548C5] shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Open Worksheet Studio</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-sm aspect-[1/1.2] bg-slate-50 dark:bg-[#101321] border border-slate-300 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div className="text-xs font-bold text-slate-950 dark:text-white">
                    Tactical Practice Worksheet
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Name: ____________ Date: _______</div>
                </div>
                <div className="grid grid-cols-2 gap-2 my-2">
                  {PUZZLES.slice(0, 4).map((p, i) => (
                    <div key={p.id} className="p-1 border border-slate-200 dark:border-slate-700 rounded text-center bg-white dark:bg-[#1A2032]">
                      <div className="text-[8px] font-bold text-slate-800 dark:text-slate-200 truncate">#{i + 1} {p.title}</div>
                      <div className="w-16 h-16 mx-auto my-1">
                        <ChessBoard fen={p.solverFen} orientation={p.sideToMove} interactive={false} showCoordinates={false} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center text-[10px] text-[#4658C9] dark:text-[#A5B4FC] font-bold">
                  Sample 4-Puzzle Grid Layout
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRAINING TOOLS SHOWCASE */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Advanced Training Tools
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-2 leading-relaxed">
            Go beyond standard puzzles with timed challenges, smart review, and private position analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sprint Mode */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => onNavigate('/sprint')}
            className="p-6 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Sprint Mode
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
              Race against the clock — solve as many puzzles as you can in 5 minutes, or conquer a fixed set of 10 or 25 puzzles.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Timer className="w-3.5 h-3.5" />
              <span>Blitz • Quick 10 • Marathon 25</span>
            </div>
          </motion.div>

          {/* Spaced Repetition */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => onNavigate('/review')}
            className="p-6 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-violet-500" />
            </div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              Spaced Repetition
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
              Smart review system that repeats puzzles you struggle with at optimal intervals. Build lasting tactical memory.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
              <Brain className="w-3.5 h-3.5" />
              <span>SM-2 algorithm • 100% local storage</span>
            </div>
          </motion.div>

          {/* FEN Import */}
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => onNavigate('/import')}
            className="p-6 bg-white dark:bg-[#161C2E] border border-slate-300 dark:border-slate-700 rounded-2xl hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-cyan-500" />
            </div>
            <h3 className="text-lg font-black text-slate-950 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              FEN Import
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
              Paste any FEN position to analyse it locally on an interactive board. Includes undo, flip, and move history.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Fully private • No server upload</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ad slot isolated at bottom */}
      <AdSlot slotId="landing-bottom-slot" format="leaderboard" />
    </div>
  );
};
