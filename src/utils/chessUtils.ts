import { Chess, Square } from 'chess.js';
import { PuzzleRecord, TacticalTheme } from '../types/puzzle';

/**
 * Transforms a square by vertical rank reflection:
 * file stays the same ('a'-'h'), rank r maps to 9 - r ('1'<->'8', '2'<->'7', etc.)
 * Example: 'e2' -> 'e7', 'g1' -> 'g8', 'a8' -> 'a1'
 */
export function reflectSquare(sq: string): string {
  if (!sq || sq.length < 2) return sq;
  const file = sq[0];
  const rank = parseInt(sq[1], 10);
  if (isNaN(rank) || rank < 1 || rank > 8) return sq;
  const reflectedRank = 9 - rank;
  return `${file}${reflectedRank}`;
}

/**
 * Reflects a UCI move (e.g., "e2e4" -> "e7e5", "e7e8q" -> "e2e1q")
 */
export function reflectUciMove(uci: string): string {
  if (!uci || uci.length < 4) return uci;
  const from = reflectSquare(uci.substring(0, 2));
  const to = reflectSquare(uci.substring(2, 4));
  const promo = uci.length > 4 ? uci.substring(4) : '';
  return `${from}${to}${promo}`;
}

/**
 * Transforms a FEN string color-symmetrically by reflecting ranks vertically
 * and swapping piece colors, active color, castling rights, and en passant square.
 */
export function transformFenColorSymmetric(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) return fen;

  const [piecePlacement, activeColor, castling, enPassant, halfmove = '0', fullmove = '1'] = parts;

  // 1. Piece placement rank reflection
  // Source FEN rank order is 8, 7, 6, 5, 4, 3, 2, 1
  // Reflected rank order needs rank 1 first, then 2, ..., up to 8
  const ranks = piecePlacement.split('/');
  if (ranks.length !== 8) return fen;

  const reflectedRanks = ranks.slice().reverse().map((rankStr) => {
    let newRank = '';
    for (const char of rankStr) {
      if (char >= '1' && char <= '8') {
        newRank += char;
      } else {
        // Swap piece color: uppercase <-> lowercase
        if (char === char.toUpperCase()) {
          newRank += char.toLowerCase();
        } else {
          newRank += char.toUpperCase();
        }
      }
    }
    return newRank;
  });

  const newPlacement = reflectedRanks.join('/');

  // 2. Active side flip
  const newActive = activeColor === 'w' ? 'b' : 'w';

  // 3. Castling rights swap
  let newCastling = '';
  if (castling === '-') {
    newCastling = '-';
  } else {
    // White rights: K, Q -> become black rights k, q
    // Black rights: k, q -> become white rights K, Q
    const rights: string[] = [];
    if (castling.includes('k')) rights.push('K');
    if (castling.includes('q')) rights.push('Q');
    if (castling.includes('K')) rights.push('k');
    if (castling.includes('Q')) rights.push('q');
    newCastling = rights.length > 0 ? rights.join('') : '-';
  }

  // 4. En passant reflection
  let newEnPassant = '-';
  if (enPassant !== '-') {
    newEnPassant = reflectSquare(enPassant);
  }

  return `${newPlacement} ${newActive} ${newCastling} ${newEnPassant} ${halfmove} ${fullmove}`;
}

/**
 * Validates and transforms a puzzle record into a color-symmetric variant
 * following PRD Section 8.4 requirements.
 */
export function transformPuzzleColorSymmetric(
  source: PuzzleRecord,
  newId: string
): PuzzleRecord | null {
  try {
    const transformedInitialFen = transformFenColorSymmetric(source.initialFen);
    const transformedMoves = source.moves.map(reflectUciMove);

    // Verify legality of all moves in transformed line
    const chess = new Chess(transformedInitialFen);
    const sanMoves: string[] = [];

    for (const uci of transformedMoves) {
      const from = uci.substring(0, 2) as Square;
      const to = uci.substring(2, 4) as Square;
      const promotion = uci.length > 4 ? uci.substring(4) : undefined;

      const moveResult = chess.move({ from, to, promotion });
      if (!moveResult) {
        // Illegal move in transformed line
        return null;
      }
      sanMoves.push(moveResult.san);
    }

    // Now compute solver's position (after opponent setup move)
    const solverChess = new Chess(transformedInitialFen);
    if (transformedMoves.length > 0) {
      const setupUci = transformedMoves[0];
      const from = setupUci.substring(0, 2) as Square;
      const to = setupUci.substring(2, 4) as Square;
      const promotion = setupUci.length > 4 ? setupUci.substring(4) : undefined;
      solverChess.move({ from, to, promotion });
    }

    const transformedSolverFen = solverChess.fen();
    const newSideToMove = solverChess.turn();

    // Adjust objective description
    const sideName = newSideToMove === 'w' ? 'White' : 'Black';
    const transformedObjective = source.objective
      .replace(/White/g, '__TMP__')
      .replace(/Black/g, 'White')
      .replace(/__TMP__/g, 'Black');

    return {
      id: newId,
      title: `${source.title} (Symmetric Variant)`,
      initialFen: transformedInitialFen,
      solverFen: transformedSolverFen,
      moves: transformedMoves,
      sideToMove: newSideToMove,
      rating: source.rating,
      themes: [...source.themes],
      difficultyBand: source.difficultyBand,
      objective: transformedObjective || `${sideName} to move and find the best continuation`,
      explanation: `${source.explanation} (Transformed rank-symmetric variant)`,
      provenance: {
        sourceDataset: 'plyquest-transformed-variant',
        sourceRecordId: source.id,
        sourceLicense: 'CC0-1.0',
        retrievalDate: new Date().toISOString().split('T')[0],
        transformType: 'color-symmetric-rank-reflect',
        transformedFrom: source.id,
        validatorVersion: '1.2.0',
        validatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error('Failed to transform puzzle:', err);
    return null;
  }
}

/**
 * Replays a move line from a given FEN and returns SAN moves + final state
 */
export function replayMoveLine(fen: string, movesUci: string[]): {
  success: boolean;
  sanMoves: string[];
  finalFen: string;
  isCheckmate: boolean;
  isStalemate: boolean;
  error?: string;
} {
  try {
    const chess = new Chess(fen);
    const sanMoves: string[] = [];

    for (const uci of movesUci) {
      const from = uci.substring(0, 2) as Square;
      const to = uci.substring(2, 4) as Square;
      const promotion = uci.length > 4 ? uci.substring(4) : undefined;

      const move = chess.move({ from, to, promotion });
      if (!move) {
        return {
          success: false,
          sanMoves,
          finalFen: chess.fen(),
          isCheckmate: false,
          isStalemate: false,
          error: `Illegal move: ${uci} in position ${chess.fen()}`,
        };
      }
      sanMoves.push(move.san);
    }

    return {
      success: true,
      sanMoves,
      finalFen: chess.fen(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
    };
  } catch (err) {
    return {
      success: false,
      sanMoves: [],
      finalFen: fen,
      isCheckmate: false,
      isStalemate: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Converts UCI move to readable SAN in a position
 */
export function uciToSan(fen: string, uci: string): string {
  try {
    const chess = new Chess(fen);
    const from = uci.substring(0, 2) as Square;
    const to = uci.substring(2, 4) as Square;
    const promotion = uci.length > 4 ? uci.substring(4) : undefined;
    const move = chess.move({ from, to, promotion });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

/**
 * Progressive hint generator strictly computed from validated solution
 */
export function getHintContent(
  currentFen: string,
  expectedUciMove: string,
  level: 1 | 2 | 3,
  theme?: TacticalTheme
): { title: string; hintText: string; highlightSquare?: string } {
  try {
    const chess = new Chess(currentFen);
    const from = expectedUciMove.substring(0, 2) as Square;
    const to = expectedUciMove.substring(2, 4) as Square;
    const promotion = expectedUciMove.length > 4 ? expectedUciMove.substring(4) : undefined;

    const piece = chess.get(from);
    const pieceName = piece
      ? {
          p: 'pawn',
          n: 'knight',
          b: 'bishop',
          r: 'rook',
          q: 'queen',
          k: 'king',
        }[piece.type]
      : 'piece';

    const testMove = chess.move({ from, to, promotion });
    const san = testMove ? testMove.san : expectedUciMove;

    if (level === 1) {
      const themeDesc = theme ? formatThemeLabel(theme) : 'tactical opportunity';
      return {
        title: 'Tactical Hint: Piece & Idea',
        hintText: `Focus on your ${pieceName} on ${from.toUpperCase()}. Consider the tactical motif (${themeDesc}) to gain a decisive advantage.`,
        highlightSquare: from,
      };
    }

    if (level === 2) {
      const toFile = to[0].toUpperCase();
      const toRank = to[1];
      const side = toFile <= 'D' ? 'queenside' : 'kingside';
      return {
        title: 'Positional Hint: Destination Area',
        hintText: `Target the ${side} around file ${toFile} (rank ${toRank}). Look at squares where your ${pieceName} applies maximum pressure.`,
        highlightSquare: to,
      };
    }

    return {
      title: 'Move Revealed',
      hintText: `Play ${san} (${from} to ${to}${promotion ? ` promoting to ${promotion.toUpperCase()}` : ''}).`,
      highlightSquare: to,
    };
  } catch {
    return {
      title: 'Hint',
      hintText: `Look at move ${expectedUciMove}.`,
    };
  }
}

export function formatThemeLabel(theme: TacticalTheme | string): string {
  switch (theme) {
    case 'mateIn1': return 'Mate in 1';
    case 'mateIn2': return 'Mate in 2';
    case 'mateIn3': return 'Mate in 3';
    case 'fork': return 'Fork';
    case 'pin': return 'Pin';
    case 'skewer': return 'Skewer';
    case 'discoveredAttack': return 'Discovered Attack';
    case 'deflection': return 'Deflection';
    case 'sacrifice': return 'Sacrifice';
    case 'backRankMate': return 'Back-Rank Mate';
    case 'doubleCheck': return 'Double Check';
    case 'smotheredMate': return 'Smothered Mate';
    case 'quietMove': return 'Quiet Move';
    case 'endgame': return 'Endgame Tactic';
    case 'hangingPiece': return 'Hanging Piece';
    case 'trappedPiece': return 'Trapped Piece';
    case 'clearance': return 'Clearance';
    case 'interference': return 'Interference';
    case 'mateIn4': return 'Mate in 4';
    case 'mateIn5': return 'Mate in 5';
    case 'kingsideAttack': return 'Kingside Attack';
    case 'queensideAttack': return 'Queenside Attack';
    case 'advancedPawn': return 'Advanced Pawn';
    case 'exposedKing': return 'Exposed King';
    case 'discoveredCheck': return 'Discovered Check';
    case 'xRayAttack': return 'X-Ray Attack';
    case 'attackingF2F7': return 'Attacking f2/f7';
    case 'capturingDefender': return "Removing the Defender";
    case 'enPassant': return 'En Passant';
    case 'underPromotion': return 'Underpromotion';
    case 'pillsburysMate': return "Pillsbury's Mate";
    case 'morphysMate': return "Morphy's Mate";
    case 'swallowstailMate': return "Swallow's Tail Mate";
    case 'blindSwineMate': return 'Blind Swine Mate';
    case 'killBoxMate': return 'Kill Box Mate';
    case 'doubleBishopMate': return 'Double Bishop Mate';
    case 'queenRookEndgame': return 'Queen & Rook Endgame';
    default: {
      // "kingsideAttack" -> "Kingside Attack"; covers every remaining theme.
      const spaced = String(theme).replace(/([a-z0-9])([A-Z])/g, '$1 $2');
      return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }
  }
}
