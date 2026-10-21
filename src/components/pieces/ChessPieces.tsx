import React from 'react';

/**
 * PlyQuest Conventional Staunton Piece Set
 * Fills & outlines strictly follow PRD v2.2 specification:
 * - White pieces: #FFFFFF fill, #252B52 stroke/details
 * - Black pieces: #252B52 fill, #FFFFFF stroke/details
 * Optimized for crisp rendering at all scale factors and high-contrast squares.
 */

interface PieceProps {
  className?: string;
  size?: number | string;
}

export const WhitePawn: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="White Pawn" role="img">
    <path
      d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#FFFFFF"
      stroke="#252B52"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BlackPawn: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="Black Pawn" role="img">
    <path
      d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#252B52"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WhiteKnight: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="White Knight" role="img">
    <g fill="none" fillRule="evenodd" stroke="#252B52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
        fill="#FFFFFF"
      />
      <path
        d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.03,5.1 18.5,5 C 20.5,5.1 21.03,6.8 21.5,9 C 25.5,7.9 31.7,8.8 34,13 C 34.5,14 34.2,15.8 33.5,16.5 C 31.5,18 29.5,17 26,17"
        fill="#FFFFFF"
      />
      <circle cx="15" cy="14" r="1.5" fill="#252B52" />
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#252B52" />
    </g>
  </svg>
);

export const BlackKnight: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="Black Knight" role="img">
    <g fill="none" fillRule="evenodd" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18"
        fill="#252B52"
      />
      <path
        d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.03,5.1 18.5,5 C 20.5,5.1 21.03,6.8 21.5,9 C 25.5,7.9 31.7,8.8 34,13 C 34.5,14 34.2,15.8 33.5,16.5 C 31.5,18 29.5,17 26,17"
        fill="#252B52"
      />
      <circle cx="15" cy="14" r="1.5" fill="#FFFFFF" />
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#FFFFFF" />
    </g>
  </svg>
);

export const WhiteBishop: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="White Bishop" role="img">
    <g fill="none" fillRule="evenodd" stroke="#252B52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"
        fill="#FFFFFF"
      />
      <path
        d="M 12,36 C 12.27,34.27 13.5,33.08 14.5,32 C 16,30.5 16,28 16,26 C 14.73,25.04 14,24.14 14,22 C 13.73,18.53 15.65,15.35 18,13 C 19,10 20,8 22.5,8 C 25,8 26,10 27,13 C 29.35,15.35 31.27,18.53 31,22 C 31,24.14 30.27,25.04 29,26 C 29,28 29,30.5 30.5,32 C 31.5,33.08 32.73,34.27 33,36"
        fill="#FFFFFF"
      />
      <circle cx="22.5" cy="5.5" r="2.5" fill="#FFFFFF" />
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,10 L 22.5,14 M 20,12 L 25,12" stroke="#252B52" />
    </g>
  </svg>
);

export const BlackBishop: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="Black Bishop" role="img">
    <g fill="none" fillRule="evenodd" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"
        fill="#252B52"
      />
      <path
        d="M 12,36 C 12.27,34.27 13.5,33.08 14.5,32 C 16,30.5 16,28 16,26 C 14.73,25.04 14,24.14 14,22 C 13.73,18.53 15.65,15.35 18,13 C 19,10 20,8 22.5,8 C 25,8 26,10 27,13 C 29.35,15.35 31.27,18.53 31,22 C 31,24.14 30.27,25.04 29,26 C 29,28 29,30.5 30.5,32 C 31.5,33.08 32.73,34.27 33,36"
        fill="#252B52"
      />
      <circle cx="22.5" cy="5.5" r="2.5" fill="#252B52" stroke="#FFFFFF" />
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,10 L 22.5,14 M 20,12 L 25,12" stroke="#FFFFFF" />
    </g>
  </svg>
);

export const WhiteRook: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="White Rook" role="img">
    <g fill="none" fillRule="evenodd" stroke="#252B52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"
        fill="#FFFFFF"
      />
      <path
        d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"
        fill="#FFFFFF"
      />
      <path
        d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
        fill="#FFFFFF"
      />
      <path
        d="M 34,14 L 31,17 L 14,17 L 11,14"
        fill="#FFFFFF"
      />
      <path
        d="M 14,17 L 14,29.5 L 31,29.5 L 31,17"
        fill="#FFFFFF"
      />
      <path
        d="M 14,29.5 L 12,32 L 33,32 L 31,29.5"
        fill="#FFFFFF"
      />
      <path d="M 14,17 L 31,17 M 13,32 L 32,32" stroke="#252B52" />
    </g>
  </svg>
);

export const BlackRook: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="Black Rook" role="img">
    <g fill="none" fillRule="evenodd" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z"
        fill="#252B52"
      />
      <path
        d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z"
        fill="#252B52"
      />
      <path
        d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14"
        fill="#252B52"
      />
      <path
        d="M 34,14 L 31,17 L 14,17 L 11,14"
        fill="#252B52"
      />
      <path
        d="M 14,17 L 14,29.5 L 31,29.5 L 31,17"
        fill="#252B52"
      />
      <path
        d="M 14,29.5 L 12,32 L 33,32 L 31,29.5"
        fill="#252B52"
      />
      <path d="M 14,17 L 31,17 M 13,32 L 32,32" stroke="#FFFFFF" />
    </g>
  </svg>
);

export const WhiteQueen: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="White Queen" role="img">
    <g fill="none" fillRule="evenodd" stroke="#252B52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z"
        fill="#FFFFFF"
      />
      <path
        d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 12,35.5 14,35.5 15,36 C 19,34.5 26,34.5 30,36 C 31,35.5 33,35.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26"
        fill="#FFFFFF"
      />
      <path
        d="M 11,38.5 A 35 35 1 0 0 34,38.5 L 33,36 C 29,34.5 16,34.5 12,36 L 11,38.5 z"
        fill="#FFFFFF"
      />
      <circle cx="6" cy="12" r="2" fill="#FFFFFF" />
      <circle cx="14" cy="9" r="2" fill="#FFFFFF" />
      <circle cx="22.5" cy="8" r="2" fill="#FFFFFF" />
      <circle cx="31" cy="9" r="2" fill="#FFFFFF" />
      <circle cx="39" cy="12" r="2" fill="#FFFFFF" />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke="#252B52" />
    </g>
  </svg>
);

export const BlackQueen: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="Black Queen" role="img">
    <g fill="none" fillRule="evenodd" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z"
        fill="#252B52"
      />
      <path
        d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 12,35.5 14,35.5 15,36 C 19,34.5 26,34.5 30,36 C 31,35.5 33,35.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26"
        fill="#252B52"
      />
      <path
        d="M 11,38.5 A 35 35 1 0 0 34,38.5 L 33,36 C 29,34.5 16,34.5 12,36 L 11,38.5 z"
        fill="#252B52"
      />
      <circle cx="6" cy="12" r="2" fill="#252B52" stroke="#FFFFFF" />
      <circle cx="14" cy="9" r="2" fill="#252B52" stroke="#FFFFFF" />
      <circle cx="22.5" cy="8" r="2" fill="#252B52" stroke="#FFFFFF" />
      <circle cx="31" cy="9" r="2" fill="#252B52" stroke="#FFFFFF" />
      <circle cx="39" cy="12" r="2" fill="#252B52" stroke="#FFFFFF" />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke="#FFFFFF" />
    </g>
  </svg>
);

export const WhiteKing: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="White King" role="img">
    <g fill="none" fillRule="evenodd" stroke="#252B52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 22.5,11.5 L 22.5,4 M 19,7.5 L 26,7.5" stroke="#252B52" />
      <path
        d="M 11.5,37 C 17,40.5 27,40.5 33.5,37 C 32.5,33.5 32.5,30 33,26 C 34,24 35.5,22.5 36.5,21.5 C 38,19 37.5,16.5 36,15 C 34,13 31.5,14 30.5,15 C 29,16.5 27.5,17.5 25.5,18 C 24,16.5 23.5,15 22.5,14.5 C 21.5,15 21,16.5 19.5,18 C 17.5,17.5 16,16.5 14.5,15 C 13.5,14 11,13 9,15 C 7.5,16.5 7,19 8.5,21.5 C 9.5,22.5 11,24 12,26 C 12.5,30 12.5,33.5 11.5,37 z"
        fill="#FFFFFF"
      />
      <path d="M 11.5,30 C 17,27 28,27 33.5,30 M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5 M 11.5,37 C 17,34 28,34 33.5,37" stroke="#252B52" />
    </g>
  </svg>
);

export const BlackKing: React.FC<PieceProps> = ({ className, size = '100%' }) => (
  <svg viewBox="0 0 45 45" width={size} height={size} className={className} aria-label="Black King" role="img">
    <g fill="none" fillRule="evenodd" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 22.5,11.5 L 22.5,4 M 19,7.5 L 26,7.5" stroke="#FFFFFF" />
      <path
        d="M 11.5,37 C 17,40.5 27,40.5 33.5,37 C 32.5,33.5 32.5,30 33,26 C 34,24 35.5,22.5 36.5,21.5 C 38,19 37.5,16.5 36,15 C 34,13 31.5,14 30.5,15 C 29,16.5 27.5,17.5 25.5,18 C 24,16.5 23.5,15 22.5,14.5 C 21.5,15 21,16.5 19.5,18 C 17.5,17.5 16,16.5 14.5,15 C 13.5,14 11,13 9,15 C 7.5,16.5 7,19 8.5,21.5 C 9.5,22.5 11,24 12,26 C 12.5,30 12.5,33.5 11.5,37 z"
        fill="#252B52"
      />
      <path d="M 11.5,30 C 17,27 28,27 33.5,30 M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5 M 11.5,37 C 17,34 28,34 33.5,37" stroke="#FFFFFF" />
    </g>
  </svg>
);

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';

export const renderPiece = (symbol: string, className?: string, size: number | string = '80%') => {
  switch (symbol) {
    case 'p': return <BlackPawn className={className} size={size} />;
    case 'n': return <BlackKnight className={className} size={size} />;
    case 'b': return <BlackBishop className={className} size={size} />;
    case 'r': return <BlackRook className={className} size={size} />;
    case 'q': return <BlackQueen className={className} size={size} />;
    case 'k': return <BlackKing className={className} size={size} />;
    case 'P': return <WhitePawn className={className} size={size} />;
    case 'N': return <WhiteKnight className={className} size={size} />;
    case 'B': return <WhiteBishop className={className} size={size} />;
    case 'R': return <WhiteRook className={className} size={size} />;
    case 'Q': return <WhiteQueen className={className} size={size} />;
    case 'K': return <WhiteKing className={className} size={size} />;
    default: return null;
  }
};
