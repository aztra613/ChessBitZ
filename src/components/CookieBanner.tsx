import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { getCookieConsent, setCookieConsent } from '../utils/storage';

interface CookieBannerProps {
  onNavigate: (route: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
  onNavigate,
  isOpen = false,
  onClose,
}) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent.status === 'pending') {
      setShowBanner(true);
    }
  }, []);

  const handleChoice = (status: 'accepted' | 'rejected') => {
    setCookieConsent(status);
    setShowBanner(false);
    if (onClose) onClose();
  };

  const isVisible = showBanner || isOpen;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5 bg-white dark:bg-[#161C2E] border-t-2 border-slate-300 dark:border-slate-700 shadow-2xl"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 id="cookie-consent-title" className="text-sm font-black text-slate-950 dark:text-white">
                  Privacy & Local Storage Notice
                </h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                PlyQuest uses browser localStorage strictly to preserve your board theme, puzzle progress, and daily solving streak locally on your device.
                Zero tracking cookies, telemetry, or advertising scripts are loaded in this release.{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/cookies')}
                  className="text-[#3548C5] dark:text-[#A5B4FC] hover:underline font-black cursor-pointer"
                >
                  Learn more in our Cookie Policy
                </button>
                .
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChoice('rejected')}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Essential Only
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChoice('accepted')}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-black rounded-xl bg-[#4658C9] text-white hover:bg-[#3548C5] shadow-sm transition-colors cursor-pointer"
              >
                Accept Storage
              </motion.button>
              {isOpen && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
