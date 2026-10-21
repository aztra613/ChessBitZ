/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowUpDown,
  Sliders,
  Check,
  X,
  Clock,
} from 'lucide-react';

export interface TimeControlPreset {
  id: string;
  name: string;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Classical';
  initialSeconds: number;
  incrementSeconds: number;
}

export const CLOCK_PRESETS: TimeControlPreset[] = [
  { id: 'bullet-1-0', name: '1 min', category: 'Bullet', initialSeconds: 60, incrementSeconds: 0 },
  { id: 'bullet-2-1', name: '2 + 1', category: 'Bullet', initialSeconds: 120, incrementSeconds: 1 },
  { id: 'blitz-3-0', name: '3 min', category: 'Blitz', initialSeconds: 180, incrementSeconds: 0 },
  { id: 'blitz-3-2', name: '3 + 2', category: 'Blitz', initialSeconds: 180, incrementSeconds: 2 },
  { id: 'blitz-5-0', name: '5 min', category: 'Blitz', initialSeconds: 300, incrementSeconds: 0 },
  { id: 'blitz-5-3', name: '5 + 3', category: 'Blitz', initialSeconds: 300, incrementSeconds: 3 },
  { id: 'rapid-10-0', name: '10 min', category: 'Rapid', initialSeconds: 600, incrementSeconds: 0 },
  { id: 'rapid-15-10', name: '15 + 10', category: 'Rapid', initialSeconds: 900, incrementSeconds: 10 },
  { id: 'classical-30-0', name: '30 min', category: 'Classical', initialSeconds: 1800, incrementSeconds: 0 },
];

/**
 * Synthesizes a realistic tactile clock click sound via Web Audio API
 */
function playClockClick(isLowPitch = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isLowPitch ? 220 : 440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Audio contexts may be blocked by browser autoplay rules until first user gesture
  }
}

function playFlagFallSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

export const ChessClock: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<TimeControlPreset>(CLOCK_PRESETS[3]); // 3 + 2 default
  const [whiteTimeMs, setWhiteTimeMs] = useState<number>(selectedPreset.initialSeconds * 1000);
  const [blackTimeMs, setBlackTimeMs] = useState<number>(selectedPreset.initialSeconds * 1000);
  const [whiteMoves, setWhiteMoves] = useState<number>(0);
  const [blackMoves, setBlackMoves] = useState<number>(0);
  const [activePlayer, setActivePlayer] = useState<'white' | 'black' | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [flipTopPlayer, setFlipTopPlayer] = useState<boolean>(true); // Rotate top player for face-to-face play
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [timeOutWinner, setTimeOutWinner] = useState<'white' | 'black' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Custom time control inputs
  const [customMin, setCustomMin] = useState<number>(5);
  const [customInc, setCustomInc] = useState<number>(3);

  const lastTickTimeRef = useRef<number>(Date.now());
  const wakeLockRef = useRef<any>(null);

  // Request Wake Lock to prevent mobile screen sleep during games
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator && isRunning) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    }
    requestWakeLock();
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isRunning]);

  // Main countdown loop with high precision requestAnimationFrame & Date.now delta
  useEffect(() => {
    if (!isRunning || !activePlayer || timeOutWinner) return;

    lastTickTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickTimeRef.current;
      lastTickTimeRef.current = now;

      if (activePlayer === 'white') {
        setWhiteTimeMs((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            setTimeOutWinner('black');
            setIsRunning(false);
            if (soundEnabled) playFlagFallSound();
            return 0;
          }
          return next;
        });
      } else {
        setBlackTimeMs((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            setTimeOutWinner('white');
            setIsRunning(false);
            if (soundEnabled) playFlagFallSound();
            return 0;
          }
          return next;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, activePlayer, timeOutWinner, soundEnabled]);

  // Tap handlers for White and Black
  const handleWhiteTap = () => {
    if (timeOutWinner) return;
    if (soundEnabled) playClockClick(false);
    if ('vibrate' in navigator) navigator.vibrate(25);

    if (activePlayer === 'white' || activePlayer === null) {
      // White completed move: add increment and pass turn to Black
      setWhiteTimeMs((t) => t + selectedPreset.incrementSeconds * 1000);
      setWhiteMoves((m) => m + 1);
      setActivePlayer('black');
      setIsRunning(true);
      lastTickTimeRef.current = Date.now();
    }
  };

  const handleBlackTap = () => {
    if (timeOutWinner) return;
    if (soundEnabled) playClockClick(true);
    if ('vibrate' in navigator) navigator.vibrate(25);

    if (activePlayer === 'black' || activePlayer === null) {
      // Black completed move: add increment and pass turn to White
      setBlackTimeMs((t) => t + selectedPreset.incrementSeconds * 1000);
      setBlackMoves((m) => m + 1);
      setActivePlayer('white');
      setIsRunning(true);
      lastTickTimeRef.current = Date.now();
    }
  };

  const handleTogglePlay = () => {
    if (timeOutWinner) return;
    if (isRunning) {
      setIsRunning(false);
    } else {
      // Start or resume
      if (!activePlayer) {
        setActivePlayer('white'); // White goes first
      }
      setIsRunning(true);
      lastTickTimeRef.current = Date.now();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setActivePlayer(null);
    setTimeOutWinner(null);
    setWhiteTimeMs(selectedPreset.initialSeconds * 1000);
    setBlackTimeMs(selectedPreset.initialSeconds * 1000);
    setWhiteMoves(0);
    setBlackMoves(0);
  };

  const handleApplyPreset = (preset: TimeControlPreset) => {
    setSelectedPreset(preset);
    setIsRunning(false);
    setActivePlayer(null);
    setTimeOutWinner(null);
    setWhiteTimeMs(preset.initialSeconds * 1000);
    setBlackTimeMs(preset.initialSeconds * 1000);
    setWhiteMoves(0);
    setBlackMoves(0);
    setSettingsOpen(false);
  };

  const handleApplyCustom = () => {
    const custom: TimeControlPreset = {
      id: `custom-${customMin}-${customInc}`,
      name: `${customMin} + ${customInc}`,
      category: 'Rapid',
      initialSeconds: customMin * 60,
      incrementSeconds: customInc,
    };
    handleApplyPreset(custom);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Formatter: mm:ss or m:ss.s when under 10 seconds
  const formatTime = (ms: number): { main: string; tenths?: string } => {
    if (ms <= 0) return { main: '0:00' };
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const secStr = sec < 10 ? `0${sec}` : `${sec}`;

    if (totalSec < 10 && ms > 0) {
      const tenths = Math.floor((ms % 1000) / 100);
      return { main: `${min}:${secStr}`, tenths: `.${tenths}` };
    }
    return { main: `${min}:${secStr}` };
  };

  const whiteFormatted = formatTime(whiteTimeMs);
  const blackFormatted = formatTime(blackTimeMs);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 min-h-[calc(100vh-140px)] flex flex-col justify-between select-none">
      {/* Top Header / Mode Bar */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#4658C9]/10 text-[#4658C9] dark:text-[#A5B4FC]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white leading-tight">
              Chess Clock
            </h1>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {selectedPreset.name} • {selectedPreset.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFlipTopPlayer(!flipTopPlayer)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              flipTopPlayer
                ? 'bg-[#4658C9]/15 border-[#4658C9]/30 text-[#4658C9] dark:text-[#A5B4FC]'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Rotate top player for face-to-face play"
            aria-label="Rotate top player"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={soundEnabled ? 'Mute sound' : 'Enable click sound'}
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Toggle fullscreen"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Time control presets"
            aria-label="Time controls settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dual Clock Canvas */}
      <div className="flex-1 flex flex-col gap-3 min-h-[460px] relative">
        {/* TOP PLAYER (Black) */}
        <button
          type="button"
          onClick={handleBlackTap}
          disabled={timeOutWinner !== null}
          className={`flex-1 rounded-3xl p-6 flex flex-col justify-between items-center transition-all cursor-pointer shadow-lg relative overflow-hidden border-2 active:scale-[0.99] ${
            activePlayer === 'black' && isRunning
              ? 'bg-[#1E293B] dark:bg-[#1E243B] text-white border-emerald-500 shadow-emerald-500/20 ring-4 ring-emerald-500/20'
              : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800/90'
          } ${flipTopPlayer ? 'rotate-180' : ''}`}
        >
          <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
            <span>Black</span>
            <span>Moves: {blackMoves}</span>
          </div>

          <div className="flex items-baseline justify-center font-mono font-black tracking-tight select-none">
            <span className="text-6xl sm:text-7xl md:text-8xl">{blackFormatted.main}</span>
            {blackFormatted.tenths && (
              <span className="text-3xl sm:text-4xl text-rose-400 ml-1 font-bold">
                {blackFormatted.tenths}
              </span>
            )}
          </div>

          <div className="w-full text-center text-xs font-bold text-slate-400">
            {timeOutWinner === 'white' ? (
              <span className="text-rose-400 font-black">TIME OUT • BLACK LOST</span>
            ) : timeOutWinner === 'black' ? (
              <span className="text-emerald-400 font-black">BLACK WON ON TIME!</span>
            ) : activePlayer === 'black' && isRunning ? (
              <span className="text-emerald-400 animate-pulse">● YOUR TURN</span>
            ) : (
              <span>Tap to switch</span>
            )}
          </div>
        </button>

        {/* Center Control Action Strip */}
        <div className="flex items-center justify-center gap-3 py-1">
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={timeOutWinner !== null}
            className={`px-6 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-40 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-[#4658C9] hover:bg-[#3548C5] text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{activePlayer ? 'Resume' : 'Start White'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2.5 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-sm cursor-pointer"
            title="Reset Clock"
            aria-label="Reset clocks"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* BOTTOM PLAYER (White) */}
        <button
          type="button"
          onClick={handleWhiteTap}
          disabled={timeOutWinner !== null}
          className={`flex-1 rounded-3xl p-6 flex flex-col justify-between items-center transition-all cursor-pointer shadow-lg relative overflow-hidden border-2 active:scale-[0.99] ${
            activePlayer === 'white' && isRunning
              ? 'bg-white dark:bg-[#1E243B] text-slate-950 dark:text-white border-emerald-500 shadow-emerald-500/20 ring-4 ring-emerald-500/20'
              : 'bg-white dark:bg-[#151A2C] text-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1A2035]'
          }`}
        >
          <div className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span>White</span>
            <span>Moves: {whiteMoves}</span>
          </div>

          <div className="flex items-baseline justify-center font-mono font-black tracking-tight select-none">
            <span className="text-6xl sm:text-7xl md:text-8xl">{whiteFormatted.main}</span>
            {whiteFormatted.tenths && (
              <span className="text-3xl sm:text-4xl text-rose-500 ml-1 font-bold">
                {whiteFormatted.tenths}
              </span>
            )}
          </div>

          <div className="w-full text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            {timeOutWinner === 'black' ? (
              <span className="text-rose-500 font-black">TIME OUT • WHITE LOST</span>
            ) : timeOutWinner === 'white' ? (
              <span className="text-emerald-500 font-black">WHITE WON ON TIME!</span>
            ) : activePlayer === 'white' && isRunning ? (
              <span className="text-emerald-500 dark:text-emerald-400 animate-pulse">● YOUR TURN</span>
            ) : (
              <span>Tap to switch</span>
            )}
          </div>
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clock-settings-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#1A2032] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h2 id="clock-settings-title" className="text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Time Control Presets</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preset Groups */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {CLOCK_PRESETS.map((p) => {
                  const isSelected = selectedPreset.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#4658C9] text-white border-[#3548C5] shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#4658C9]'
                      }`}
                    >
                      <span className="block text-xs font-black">{p.name}</span>
                      <span className="block text-[10px] opacity-80 mt-0.5">{p.category}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Time Control */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  Custom Fischer Clock
                </span>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={customMin}
                      onChange={(e) => setCustomMin(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Increment (sec)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={customInc}
                      onChange={(e) => setCustomInc(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="w-full py-2 rounded-xl bg-[#4658C9] hover:bg-[#3548C5] text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Apply Custom Time
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
