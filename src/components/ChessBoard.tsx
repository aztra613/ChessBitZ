import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess, Square } from 'chess.js';
import { renderPiece } from './pieces/ChessPieces';
import { BoardThemeId } from '../types/puzzle';
import { BOARD_THEMES } from '../data/boardThemes';

interface ChessBoardProps {
  fen: string;
  orientation?: 'w' | 'b';
  onMove?: (from: string, to: string, promotion?: string) => boolean | void;
  interactive?: boolean;
  lastMove?: { from: string; to: string } | null;
  hintSquare?: string | null;
  isCheck?: boolean;
  isCheckmate?: boolean;
  boardTheme?: BoardThemeId;
  showCoordinates?: boolean;
  className?: string;
  size?: number | string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  orientation = 'w',
  onMove,
  interactive = true,
  lastMove = null,
  hintSquare = null,
  isCheck = false,
  isCheckmate = false,
  boardTheme = 'ocean-slate',
  showCoordinates = true,
  className = '',
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<{ to: Square; isCapture: boolean }[]>([]);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  // Parse current chess position
  const chess = React.useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  // Active board theme colors
  const themeConfig = BOARD_THEMES.find((t) => t.id === boardTheme) || BOARD_THEMES[0];

  // Board files and ranks based on orientation
  const files = orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = orientation === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Calculate legal moves when a square is selected
  const handleSelectSquare = useCallback(
    (square: Square) => {
      if (!interactive || !onMove) return;

      // If already selected, check if clicking a destination square
      if (selectedSquare) {
        if (selectedSquare === square) {
          // Deselect
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }

        const isDestLegal = legalMoves.some((m) => m.to === square);
        if (isDestLegal) {
          // Check for pawn promotion (pawn reaching 8th rank for white or 1st rank for black)
          const piece = chess.get(selectedSquare);
          let promotion: string | undefined = undefined;
          if (piece && piece.type === 'p') {
            if ((piece.color === 'w' && square[1] === '8') || (piece.color === 'b' && square[1] === '1')) {
              promotion = 'q'; // Default queen promotion for puzzles
            }
          }

          onMove(selectedSquare, square, promotion);
          setSelectedSquare(null);
          setLegalMoves([]);
          return;
        }
      }

      // Check if clicked piece belongs to current player to move
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const validMoves = chess.moves({ square, verbose: true });
        setLegalMoves(
          validMoves.map((m) => ({
            to: m.to as Square,
            isCapture: m.captured !== undefined || m.flags.includes('e'),
          }))
        );
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    },
    [chess, interactive, legalMoves, onMove, selectedSquare]
  );

  // Clear selection if fen changes
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [fen]);

  // Find king square if in check
  const kingSquare = React.useMemo(() => {
    if (!isCheck && !isCheckmate) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return `${'abcdefgh'[c]}${8 - r}` as Square;
        }
      }
    }
    return null;
  }, [chess, isCheck, isCheckmate]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!interactive) return;
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    handleSelectSquare(square);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', square);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const fromSquare = draggedSquare || (e.dataTransfer.getData('text/plain') as Square);
    setDraggedSquare(null);

    if (fromSquare && fromSquare !== targetSquare && onMove) {
      const piece = chess.get(fromSquare);
      let promotion: string | undefined = undefined;
      if (piece && piece.type === 'p') {
        if ((piece.color === 'w' && targetSquare[1] === '8') || (piece.color === 'b' && targetSquare[1] === '1')) {
          promotion = 'q';
        }
      }
      onMove(fromSquare, targetSquare, promotion);
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  return (
    <div
      className={`relative aspect-square select-none rounded-2xl overflow-hidden shadow-xl border-2 border-[#171B34]/20 bg-[#171B34] ${
        className || 'w-full cb-board-responsive'
      }`}
      data-board-theme={boardTheme}
      role="region"
      aria-label={`Chessboard, ${orientation === 'w' ? 'White' : 'Black'} at bottom`}
    >
      <div className="w-full h-full grid grid-cols-8 grid-rows-8">
        {ranks.map((rank, rIdx) =>
          files.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const fileNum = file.charCodeAt(0) - 'a'.charCodeAt(0);
            const rankNum = parseInt(rank, 10);
            const isLightSquare = (fileNum + rankNum) % 2 !== 0;

            const squareColor = isLightSquare ? themeConfig.lightSquare : themeConfig.darkSquare;
            const coordinateColor = isLightSquare ? themeConfig.darkSquare : themeConfig.lightSquare;

            const piece = chess.get(square);
            const isSelected = selectedSquare === square;
            const isLastMoveFrom = lastMove?.from === square;
            const isLastMoveTo = lastMove?.to === square;
            const isHint = hintSquare === square;
            const isKingInCheck = kingSquare === square;
            const legalTarget = legalMoves.find((m) => m.to === square);
            const isMovablePiece = interactive && piece && piece.color === chess.turn();

            return (
              <div
                key={square}
                style={{ backgroundColor: squareColor, touchAction: 'manipulation' }}
                onClick={() => handleSelectSquare(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors select-none ${
                  isSelected ? 'ring-4 ring-[#4658C9] z-20 shadow-inner' : ''
                }`}
                tabIndex={interactive ? 0 : -1}
                role="button"
                aria-label={`Square ${square}${piece ? `, ${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}` : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectSquare(square);
                  }
                }}
              >
                {/* Last move highlight (warm amber token) */}
                {(isLastMoveFrom || isLastMoveTo) && (
                  <div
                    className="absolute inset-0 bg-[#F2A65A]/45 pointer-events-none z-5"
                    aria-hidden="true"
                  />
                )}

                {/* Hint highlight with gentle motion animation */}
                {isHint && (
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1, 0.97] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-[#D9CCFF]/80 border-3 border-dashed border-[#4658C9] pointer-events-none z-10"
                    aria-hidden="true"
                  />
                )}

                {/* Check / Checkmate King square ring */}
                {isKingInCheck && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute inset-0 bg-[#B83D50]/40 ring-4 ring-[#B83D50] pointer-events-none z-10"
                    aria-hidden="true"
                  />
                )}

                {/* Piece representation with micro-interactions */}
                {piece && (
                  <motion.div
                    whileHover={isMovablePiece ? { scale: 1.08, y: -2 } : {}}
                    whileTap={isMovablePiece ? { scale: 0.93 } : {}}
                    transition={{ type: 'spring', damping: 18, stiffness: 400 }}
                    draggable={isMovablePiece}
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, square)}
                    className="relative w-full h-full flex items-center justify-center p-1 z-15 select-none"
                  >
                    {renderPiece(
                      piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase(),
                      'w-full h-full drop-shadow-sm filter'
                    )}
                  </motion.div>
                )}

                {/* Legal move indicators: dot for quiet moves, ring for captures */}
                <AnimatePresence>
                  {legalTarget && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                      {legalTarget.isCapture ? (
                        <div className="w-[82%] h-[82%] rounded-full border-4 border-[#4658C9]/90 shadow-sm" />
                      ) : (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#4658C9]/85 shadow-sm" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Board Coordinates: Rank labels on file a (or first col) and File labels on rank 1 (or bottom row) */}
                {showCoordinates && (
                  <>
                    {fIdx === 0 && (
                      <span
                        style={{ color: coordinateColor }}
                        className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-black select-none pointer-events-none opacity-90 leading-none"
                        aria-hidden="true"
                      >
                        {rank}
                      </span>
                    )}
                    {rIdx === 7 && (
                      <span
                        style={{ color: coordinateColor }}
                        className="absolute bottom-0.5 right-1 text-[8px] sm:text-[10px] font-black select-none pointer-events-none opacity-90 leading-none"
                        aria-hidden="true"
                      >
                        {file}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
