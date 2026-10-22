import React from 'react';
import { Shield, Lock, FileText, HelpCircle, Heart, Scale, AlertTriangle, Eye, ExternalLink } from 'lucide-react';
import { MONETAG_DIRECT_LINK } from '../utils/monetag';

interface FooterProps {
  onNavigate: (route: string) => void;
  onOpenCookieSettings?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCookieSettings }) => {
  return (
    <footer className="w-full bg-white dark:bg-[#1A2032] border-t border-slate-300 dark:border-slate-800 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Brand Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/30 shadow-md shrink-0 bg-[#0F1222]">
              <img
                src="/logo.png"
                alt="PlyQuest Logo"
                className="w-full h-full object-cover"
                width={40}
                height={40}
              />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-950 dark:text-white block">
                PlyQuest
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Premium Free Chess Tactics Puzzles, Worksheets & Digital Clock
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
              100% Free • No Sign-up
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Puzzles & Training */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-3">
              Practice Tactics
            </h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/daily')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Daily Puzzle
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/sprint')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Sprint Challenge
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/review')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Spaced Repetition
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/clock')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Digital Chess Clock
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/import')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Import FEN / PGN
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/mate-in-1')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Mate in 1 Puzzles
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/mate-in-2')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Mate in 2 Puzzles
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/mate-in-3')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Mate in 3 Puzzles
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/difficulty/beginner')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Beginner Tactics
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/archive/2026/10')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Puzzle Archive
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Tactical Themes */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-3">
              Themes
            </h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/themes/fork')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Forks & Double Attacks
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/themes/pin')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Pins & Skewers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/themes/backRankMate')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Back-Rank Checkmates
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/themes/sacrifice')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Decoys & Sacrifices
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/printable-chess-puzzles')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors font-bold text-[#4658C9] dark:text-[#A5B4FC] cursor-pointer"
                >
                  Worksheet Studio (PDF)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Privacy */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-3">
              Legal & Privacy
            </h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/cookies')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Cookie Policy & Storage</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/disclaimer')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Disclaimer</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/licenses')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Open Source Licenses
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & Contact */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-3">
              Trust & Contact
            </h3>
            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/about')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  About PlyQuest
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/security')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Security Disclosures</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/accessibility')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Accessibility (WCAG 2.2)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors cursor-pointer"
                >
                  Contact & Support
                </button>
              </li>
              {onOpenCookieSettings && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenCookieSettings}
                    className="text-[#4658C9] dark:text-[#A5B4FC] hover:underline font-bold cursor-pointer"
                  >
                    Manage Cookie Preferences
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Sponsored Partner Link */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3 px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#101321]">
          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Sponsored
          </span>
          <a
            href={MONETAG_DIRECT_LINK}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4658C9] dark:text-[#A5B4FC] hover:underline transition-colors"
          >
            <span>Offers from our partners</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Aztras AI Tech Solutions & Legal Links Row */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="text-slate-600 dark:text-slate-400">
            <span>Product of <strong className="font-semibold text-slate-900 dark:text-white">Aztras AI Tech Solutions</strong>, Chennai, India.</span>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium" aria-label="Legal & Policy Links">
            <a href="https://musikflo.pages.dev/#privacy" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Privacy</a>
            <a href="https://musikflo.pages.dev/#terms" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Terms</a>
            <a href="https://musikflo.pages.dev/#cookies" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Cookies</a>
            <a href="https://musikflo.pages.dev/#disclaimer" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Disclaimer</a>
            <a href="https://musikflo.pages.dev/#contact" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Contact</a>
            <a href="https://musikflo.pages.dev/#licenses" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Licenses</a>
            <a href="https://musikflo.pages.dev/#accessibility" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Accessibility</a>
            <a href="https://musikflo.pages.dev/#security" target="_blank" rel="noopener noreferrer" className="hover:text-[#4658C9] dark:hover:text-[#818CF8] hover:underline transition-colors">Security</a>
          </nav>
        </div>

        {/* Bottom Copyright & Independent Statement */}
        <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 Aztras AI Tech Solutions. All rights reserved.</p>
          <p className="text-center md:text-right text-[11px] text-slate-500 dark:text-slate-400">
            Independent static-first chess tactics educational platform. Users are solely responsible for copyright compliance and lawful use.
          </p>
        </div>
      </div>
    </footer>
  );
};
