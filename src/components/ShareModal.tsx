/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Send,
  MessageCircle,
  ExternalLink,
  Award,
  Clock,
  Lightbulb,
  Sparkles,
  Swords,
  QrCode as QrIcon,
} from 'lucide-react';
import { PuzzleRecord } from '../types/puzzle';
import {
  getPuzzleShareUrl,
  getChallengeMessage,
  getStandardShareMessage,
  getResultShareText,
  getWhatsAppShareUrl,
  getXShareUrl,
  getFacebookShareUrl,
  getTelegramShareUrl,
  invokeNativeShare,
  copyTextToClipboard,
  PuzzleResultStats,
} from '../utils/shareUtils';
import { generateQrMatrix } from '../utils/qrCode';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleRecord;
  stats?: PuzzleResultStats;
  initialTab?: 'share' | 'challenge' | 'result';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  puzzle,
  stats,
  initialTab = 'share',
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'challenge' | 'result'>(
    stats ? 'result' : initialTab
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [copiedResultText, setCopiedResultText] = useState(false);
  const [customChallengeMsg, setCustomChallengeMsg] = useState('');
  const [downloadingCard, setDownloadingCard] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const shareUrl = getPuzzleShareUrl(puzzle.id, stats?.isDaily);
  const standardMessage = getStandardShareMessage(puzzle);

  useEffect(() => {
    if (isOpen) {
      setCustomChallengeMsg(getChallengeMessage(puzzle, shareUrl));
      if (stats) {
        setActiveTab('result');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, puzzle, stats, initialTab, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const success = await copyTextToClipboard(shareUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyChallenge = async () => {
    const success = await copyTextToClipboard(customChallengeMsg);
    if (success) {
      setCopiedChallenge(true);
      setTimeout(() => setCopiedChallenge(false), 2500);
    }
  };

  const handleCopyResultText = async () => {
    if (!stats) return;
    const text = getResultShareText(puzzle, stats, shareUrl);
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedResultText(true);
      setTimeout(() => setCopiedResultText(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const text = activeTab === 'challenge'
      ? customChallengeMsg
      : stats && activeTab === 'result'
      ? getResultShareText(puzzle, stats, shareUrl)
      : standardMessage;

    const handled = await invokeNativeShare({
      title: `${puzzle.title} — PlyQuest`,
      text,
      url: shareUrl,
    });

    if (!handled) {
      handleCopyLink();
    }
  };

  /**
   * Generates a high-resolution, spoiler-free PNG share card in pure HTML5 Canvas
   */
  const handleDownloadCard = () => {
    setDownloadingCard(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675; // 16:9 social card standard
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background gradient (Midnight Indigo brand)
      const grad = ctx.createLinearGradient(0, 0, 1200, 675);
      grad.addColorStop(0, '#101322');
      grad.addColorStop(0.5, '#171B34');
      grad.addColorStop(1, '#252B52');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      // Subtle decorative accent circle
      ctx.beginPath();
      ctx.arc(1100, 100, 300, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(70, 88, 201, 0.08)';
      ctx.fill();

      // 2. Brand Wordmark & Tagline
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 38px system-ui, -apple-system, sans-serif';
      ctx.fillText('PlyQuest', 70, 85);

      ctx.fillStyle = '#818CF8';
      ctx.font = '700 16px system-ui, -apple-system, sans-serif';
      ctx.fillText('TACTICAL TRAINING STUDIO • ZERO ADS IN CARDS', 70, 115);

      // 3. Main Result Badge / Header
      if (stats) {
        ctx.fillStyle = '#10B981';
        ctx.font = '900 24px system-ui, -apple-system, sans-serif';
        const dateTag = stats.isDaily && stats.dateStr ? ` (${stats.dateStr})` : '';
        ctx.fillText(`✓ TACTIC SOLVED${dateTag}`, 70, 185);
      } else {
        ctx.fillStyle = '#C7D2FE';
        ctx.font = '900 24px system-ui, -apple-system, sans-serif';
        ctx.fillText('CHALLENGE POSITION', 70, 185);
      }

      // 4. Puzzle Title & Objective (NO SPOILERS)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 48px system-ui, -apple-system, sans-serif';
      const truncatedTitle = puzzle.title.length > 32 ? puzzle.title.slice(0, 32) + '...' : puzzle.title;
      ctx.fillText(truncatedTitle, 70, 245);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${puzzle.objective} • Rated ${puzzle.rating} • ${puzzle.difficultyBand.toUpperCase()}`, 70, 285);

      // 5. Stat Metric Boxes
      if (stats) {
        const statsList = [
          { label: 'ATTEMPTS', val: `${stats.attempts}` },
          { label: 'HINTS USED', val: `${stats.hintsUsed}` },
          {
            label: 'SOLVE TIME',
            val: `${Math.floor(stats.durationSeconds / 60)}m ${stats.durationSeconds % 60}s`,
          },
        ];

        statsList.forEach((st, i) => {
          const bx = 70 + i * 180;
          const by = 340;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.roundRect(bx, by, 160, 100, 16);
          ctx.fill();

          ctx.fillStyle = '#818CF8';
          ctx.font = '700 14px system-ui, -apple-system, sans-serif';
          ctx.fillText(st.label, bx + 18, by + 36);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 32px system-ui, -apple-system, sans-serif';
          ctx.fillText(st.val, bx + 18, by + 78);
        });
      } else {
        // Challenge box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.roundRect(70, 340, 520, 100, 16);
        ctx.fill();

        ctx.fillStyle = '#C7D2FE';
        ctx.font = '700 18px system-ui, -apple-system, sans-serif';
        ctx.fillText('Can you spot the winning tactical blow?', 95, 385);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '500 15px system-ui, -apple-system, sans-serif';
        ctx.fillText('Zero accounts required • Instant browser play', 95, 415);
      }

      // 6. Draw QR Code on right side pointing to puzzle
      const qr = generateQrMatrix(shareUrl);
      const qrSize = 220;
      const qrX = 910;
      const qrY = 180;
      const modSize = qrSize / qr.size;

      // QR Background card
      ctx.fillStyle = '#FFFFFF';
      ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 70, 20);
      ctx.fill();

      // QR modules
      ctx.fillStyle = '#171B34';
      for (let r = 0; r < qr.size; r++) {
        for (let c = 0; c < qr.size; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(qrX + c * modSize, qrY + r * modSize, modSize, modSize);
          }
        }
      }

      // QR label
      ctx.fillStyle = '#171B34';
      ctx.font = '700 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO PLAY', qrX + qrSize / 2, qrY + qrSize + 24);
      ctx.fillStyle = '#64748B';
      ctx.font = '600 11px system-ui, -apple-system, sans-serif';
      ctx.fillText('plyquest.pages.dev', qrX + qrSize / 2, qrY + qrSize + 42);
      ctx.textAlign = 'left'; // reset

      // 7. Footer
      ctx.fillStyle = '#64748B';
      ctx.font = '500 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        'Product of Aztras AI Tech Solutions • Free & Open-Access Chess Education',
        70,
        615
      );

      // Trigger download
      const link = document.createElement('a');
      link.download = `PlyQuest_${stats?.isDaily ? 'Daily_' : 'Tactic_'}${puzzle.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloadingCard(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1A2032] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#4658C9] dark:text-[#818CF8]" />
            <h2
              id="share-modal-title"
              className="text-lg font-black text-slate-950 dark:text-white"
            >
              Share & Challenge
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-900/30">
          {stats && (
            <button
              type="button"
              onClick={() => setActiveTab('result')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'result'
                  ? 'border-[#4658C9] text-[#4658C9] dark:text-[#A5B4FC] bg-white dark:bg-[#1A2032]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>Result Card</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('challenge')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'challenge'
                ? 'border-[#4658C9] text-[#4658C9] dark:text-[#A5B4FC] bg-white dark:bg-[#1A2032]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-[#4658C9] dark:text-[#818CF8]" />
            <span>Challenge a Friend</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-[#4658C9] text-[#4658C9] dark:text-[#A5B4FC] bg-white dark:bg-[#1A2032]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Standard Share</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: RESULT CARD (When solved) */}
          {activeTab === 'result' && stats && (
            <div className="space-y-4">
              {/* Visual Card Preview */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#101322] to-[#252B52] text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black tracking-widest text-[#818CF8] uppercase">
                    PlyQuest Daily
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                    Solved
                  </span>
                </div>

                <h3 className="text-lg font-black tracking-tight">{puzzle.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {puzzle.objective} • Rating {puzzle.rating}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Attempts</span>
                    <span className="text-base font-black text-white">{stats.attempts}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Hints</span>
                    <span className="text-base font-black text-white">{stats.hintsUsed}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Time</span>
                    <span className="text-base font-black text-white">
                      {Math.floor(stats.durationSeconds / 60)}m {stats.durationSeconds % 60}s
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 text-center font-medium">
                  Zero spoilers • Solution hidden on shared cards
                </div>
              </div>

              {/* Action Buttons for Result */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={downloadingCard}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-[#4658C9] hover:bg-[#3548C5] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingCard ? 'Generating PNG...' : 'Download Card (PNG)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyResultText}
                  className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedResultText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied Text!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Text Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CHALLENGE A FRIEND */}
          {activeTab === 'challenge' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#4658C9]/10 dark:bg-[#4658C9]/20 border border-[#4658C9]/20 text-xs text-[#3548C5] dark:text-[#C7D2FE]">
                <strong>Friendly Challenge:</strong> Challenge a peer to solve this exact position. The solution remains hidden until they solve or click reveal.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Challenge Message
                </label>
                <textarea
                  value={customChallengeMsg}
                  onChange={(e) => setCustomChallengeMsg(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#4658C9] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyChallenge}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#4658C9] hover:bg-[#3548C5] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedChallenge ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Challenge Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Challenge Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: STANDARD SHARE / CHANNEL BUTTONS */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Share via Channels
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WhatsApp */}
              <a
                href={getWhatsAppShareUrl(
                  activeTab === 'challenge'
                    ? customChallengeMsg
                    : stats && activeTab === 'result'
                    ? getResultShareText(puzzle, stats, shareUrl)
                    : standardMessage,
                  shareUrl
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors text-xs font-bold text-center"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              {/* X / Twitter */}
              <a
                href={getXShareUrl(
                  activeTab === 'challenge'
                    ? customChallengeMsg
                    : stats && activeTab === 'result'
                    ? getResultShareText(puzzle, stats, shareUrl)
                    : standardMessage,
                  shareUrl
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-center"
              >
                <span className="text-base font-black">𝕏</span>
                <span>Post on X</span>
              </a>

              {/* Telegram */}
              <a
                href={getTelegramShareUrl(
                  activeTab === 'challenge'
                    ? customChallengeMsg
                    : stats && activeTab === 'result'
                    ? getResultShareText(puzzle, stats, shareUrl)
                    : standardMessage,
                  shareUrl
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-950 transition-colors text-xs font-bold text-center"
              >
                <Send className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>Telegram</span>
              </a>

              {/* Facebook */}
              <a
                href={getFacebookShareUrl(shareUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors text-xs font-bold text-center"
              >
                <span className="text-base font-black">f</span>
                <span>Facebook</span>
              </a>
            </div>

            {/* Direct Link Input + Copy Button */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Direct Puzzle Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Device Native Share option if supported */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full mt-2 py-2 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Open Device Share Sheet...</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>100% Free • No cookies required to view</span>
          <span className="font-semibold text-[#4658C9] dark:text-[#A5B4FC]">plyquest.pages.dev</span>
        </div>
      </div>
    </div>
  );
};
