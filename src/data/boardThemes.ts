/**
 * PlyQuest Board Themes
 *
 * Kept separate from the puzzle corpus so UI components (ChessBoard,
 * BoardThemeSelector) never pull puzzle records into their chunk.
 */

export const BOARD_THEMES = [
  {
    id: 'ocean-slate',
    name: 'Ocean Slate',
    lightSquare: '#F3E8D2',
    darkSquare: '#657D9B',
    description: 'Default warm ivory and blue-gray palette for crisp tactical focus.',
    isDefault: true,
  },
  {
    id: 'classic-tournament',
    name: 'Classic Tournament',
    lightSquare: '#F0D9B5',
    darkSquare: '#779556',
    description: 'Traditional FIDE tournament-style buff and forest green squares.',
    isDefault: false,
  },
  {
    id: 'rosewood',
    name: 'Rosewood',
    lightSquare: '#F5E4D8',
    darkSquare: '#956675',
    description: 'Subtle warm blush and antique rosewood tones.',
    isDefault: false,
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    lightSquare: '#FFFFFF',
    darkSquare: '#5E6678',
    description: 'Pure white and deep slate squares with maximum luminance difference.',
    isDefault: false,
  },
] as const;
