/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PuzzleRecord } from '../types/puzzle';

export interface PuzzleShareData {
  title: string;
  text: string;
  url: string;
}

export interface PuzzleResultStats {
  attempts: number;
  hintsUsed: number;
  durationSeconds: number;
  isDaily?: boolean;
  dateStr?: string;
}

/**
 * Gets the canonical absolute URL for a puzzle or daily puzzle
 */
export function getPuzzleShareUrl(puzzleId: string, isDaily = false): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://plyquest.pages.dev';
  return isDaily ? `${origin}/daily` : `${origin}/puzzle/${puzzleId}`;
}

/**
 * Generates a challenge message that never spoils the solution
 */
export function getChallengeMessage(puzzle: PuzzleRecord, shareUrl: string): string {
  return `Can you solve this PlyQuest chess puzzle? Find the winning move: ${shareUrl}`;
}

/**
 * Generates a standard spoiler-free puzzle invite message
 */
export function getStandardShareMessage(puzzle: PuzzleRecord): string {
  const side = puzzle.sideToMove === 'w' ? 'White' : 'Black';
  return `Try this chess tactic on PlyQuest: ${puzzle.title} (${puzzle.difficultyBand.toUpperCase()} • ${side} to move). Can you spot the win?`;
}

/**
 * Generates formatted spoiler-free result text suitable for social messaging
 */
export function getResultShareText(puzzle: PuzzleRecord, stats: PuzzleResultStats, shareUrl: string): string {
  const minutes = Math.floor(stats.durationSeconds / 60);
  const seconds = stats.durationSeconds % 60;
  const timeFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  const ratingBadge = puzzle.rating ? ` (${puzzle.rating})` : '';

  const header = stats.isDaily
    ? `♟️ PlyQuest Daily Tactics • ${stats.dateStr || new Date().toISOString().split('T')[0]}`
    : `♟️ PlyQuest Tactics • ${puzzle.title}`;

  return `${header}
🎯 Difficulty: ${puzzle.difficultyBand.toUpperCase()}${ratingBadge}
⚡ Attempts: ${stats.attempts}
💡 Hints used: ${stats.hintsUsed}
⏱️ Time: ${timeFormatted}

Can you find the winning move?
${shareUrl}`;
}

/**
 * Official social sharing URLs
 */
export function getWhatsAppShareUrl(text: string, url: string): string {
  const fullText = `${text}\n${url}`.trim();
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
}

export function getXShareUrl(text: string, url: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=chess,chesstactics,plyquest`;
}

export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getTelegramShareUrl(text: string, url: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

/**
 * Safely invokes Web Share API if supported, returning true if successful
 */
export async function invokeNativeShare(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(data);
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User dismissed the native sheet gracefully; not an error
        return true;
      }
      return false;
    }
  }
  return false;
}

/**
 * Safely copies text to clipboard with legacy fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback below
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    return false;
  }
}
