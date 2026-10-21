import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Palette, Menu, X, Calendar, Grid, Printer, BookOpen, Zap, Brain, Upload, Clock } from 'lucide-react';
import { BoardThemeId } from '../types/puzzle';
import { BoardThemeSelector } from './BoardThemeSelector';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  uiMode: 'light' | 'dark';
  onToggleUiMode: () => void;
  boardTheme: BoardThemeId;
  onThemeChange: (theme: BoardThemeId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  uiMode,
  onToggleUiMode,
  boardTheme,
  onThemeChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const navLinks = [
    { label: 'Daily', route: '/daily', icon: Calendar },
    { label: 'Puzzles', route: '/puzzles', icon: Grid },
    { label: 'Sprint', route: '/sprint', icon: Zap },
    { label: 'Review', route: '/review', icon: Brain },
    { label: 'Clock', route: '/clock', icon: Clock },
    { label: 'Import', route: '/import', icon: Upload },
    { label: 'Worksheets', route: '/printable-chess-puzzles', icon: Printer },
  ];

  const handleNav = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="relative w-full bg-white dark:bg-[#161C2E] border-b border-slate-200 dark:border-slate-800 transition-colors z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand Wordmark */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 text-left group focus-visible:ring-2 focus-visible:ring-[#3548C5] rounded-xl p-1 -ml-1 cursor-pointer shrink-0"
            aria-label="PlyQuest Home"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-indigo-500/30 shadow-md group-hover:shadow-indigo-500/40 transition-all shrink-0 bg-[#0F1222]">
              <img
                src="/logo.png"
                alt="PlyQuest Logo"
                className="w-full h-full object-cover"
                width={36}
                height={36}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white leading-none">
                PlyQuest
              </span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mt-0.5">
                Tactics Studio
              </span>
            </div>
          </motion.button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route.startsWith('/themes') && currentRoute.startsWith('/themes'));
              return (
                <motion.button
                  key={link.route}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNav(link.route)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#4658C9]/15 dark:bg-[#4658C9]/35 text-[#3548C5] dark:text-[#C7D2FE] shadow-2xs'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {link.icon && <link.icon className="w-3.5 h-3.5 shrink-0" />}
                  <span>{link.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Board Theme Trigger */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setThemeModalOpen(!themeModalOpen)}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5"
              title="Change board theme"
              aria-label="Change chessboard colors"
            >
              <Palette className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />
              <span className="hidden xl:inline text-xs font-bold">Theme</span>
            </motion.button>

            {/* Dark/Light UI Mode Toggle */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={onToggleUiMode}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5"
              title={uiMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={uiMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {uiMode === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-amber-400"
                  >
                    <Sun className="w-4 h-4" />
                    <span className="hidden xl:inline text-xs font-bold text-slate-200">Light</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-slate-800"
                  >
                    <Moon className="w-4 h-4" />
                    <span className="hidden xl:inline text-xs font-bold text-slate-700">Dark</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border border-slate-200 dark:border-slate-700"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Board Theme Selector Dropdown/Modal with Framer Motion */}
        <AnimatePresence>
          {themeModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute top-16 right-4 sm:right-6 w-80 sm:w-96 z-50 shadow-2xl"
            >
              <BoardThemeSelector
                currentTheme={boardTheme}
                onThemeChange={(newTheme) => {
                  onThemeChange(newTheme);
                  setThemeModalOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation Drawer with Framer Motion */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161C2E] px-4 py-4 space-y-2 shadow-xl"
            >
              {navLinks.map((link) => {
                const isActive =
                  currentRoute === link.route ||
                  (link.route.startsWith('/themes') && currentRoute.startsWith('/themes'));
                return (
                  <button
                    key={link.route}
                    type="button"
                    onClick={() => handleNav(link.route)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#4658C9]/15 dark:bg-[#4658C9]/35 text-[#3548C5] dark:text-[#C7D2FE]'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.icon && <link.icon className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />}
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};
