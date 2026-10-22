/**
 * PlyQuest Core Types & Schemas
 * PRD v2.2 compliant data structures
 */

export type BoardThemeId = 'ocean-slate' | 'classic-tournament' | 'rosewood' | 'high-contrast';

export interface BoardThemeConfig {
  id: BoardThemeId;
  name: string;
  lightSquare: string;
  darkSquare: string;
  description: string;
  isDefault: boolean;
}

export type TacticalTheme =
  // Mate length (Lichess tags up to mate in 5)
  | 'mateIn1'
  | 'mateIn2'
  | 'mateIn3'
  | 'mateIn4'
  | 'mateIn5'
  // Core tactical motifs
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discoveredAttack'
  | 'discoveredCheck'
  | 'doubleCheck'
  | 'deflection'
  | 'sacrifice'
  | 'clearance'
  | 'interference'
  | 'xRayAttack'
  | 'capturingDefender'
  | 'attraction'
  | 'intermezzo'
  | 'quietMove'
  | 'zugzwang'
  // Piece and king safety
  | 'hangingPiece'
  | 'trappedPiece'
  | 'exposedKing'
  | 'backRankMate'
  | 'smotheredMate'
  | 'kingsideAttack'
  | 'queensideAttack'
  | 'attackingF2F7'
  // Pawns, promotion and special moves
  | 'advancedPawn'
  | 'promotion'
  | 'underPromotion'
  | 'enPassant'
  | 'castling'
  // Endgames
  | 'endgame'
  | 'rookEndgame'
  | 'pawnEndgame'
  | 'bishopEndgame'
  | 'knightEndgame'
  | 'queenEndgame'
  | 'queenRookEndgame'
  // Named checkmate patterns
  | 'operaMate'
  | 'pillsburysMate'
  | 'arabianMate'
  | 'anastasiaMate'
  | 'bodenMate'
  | 'dovetailMate'
  | 'doubleBishopMate'
  | 'epauletteMate'
  | 'hookMate'
  | 'cornerMate'
  | 'swallowstailMate'
  | 'triangleMate'
  | 'killBoxMate'
  | 'morphysMate'
  | 'blindSwineMate'
  | 'vukovicMate'
  | 'balestraMate'
  // Structural / defensive
  | 'defensiveMove'
  | 'collinearMove';

export type DifficultyBand = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface PuzzleProvenance {
  sourceDataset: 'lichess-open-puzzles' | 'plyquest-transformed-variant' | 'plyquest-curated';
  sourceRecordId: string;
  sourceLicense: 'CC0-1.0' | 'Public-Domain';
  sourceLicenseUrl?: string;
  sourceUrl?: string;
  retrievalDate: string;
  sourceChecksum?: string;
  transformType?: 'none' | 'color-symmetric-rank-reflect';
  transformedFrom?: string;
  validatorVersion: string;
  validatedAt: string;
  educationalContentLicense?: string; // e.g. "CC-BY-4.0" for original titles/explanations
}

export interface PuzzleRecord {
  id: string;
  title: string;
  // Raw source FEN (before opponent setup move)
  initialFen: string;
  // Position presented to the solver (after first move from `moves` is played)
  solverFen: string;
  // Full move line in UCI format: [setupMove, playerMove1, opponentMove1, playerMove2, ...]
  moves: string[];
  // Side to move from solver's perspective: 'w' | 'b'
  sideToMove: 'w' | 'b';
  rating: number;
  ratingDeviation?: number;
  popularity?: number;
  nbPlays?: number;
  themes: TacticalTheme[];
  difficultyBand: DifficultyBand;
  objective: string; // e.g. "White to move and deliver checkmate in 2"
  explanation: string; // Concise, original pedagogical explanation of the tactic
  dateAssigned?: string; // e.g. "2026-10-20" for daily puzzle
  gameUrl?: string;
  openingTags?: string;
  provenance: PuzzleProvenance;
}

export interface SolvedPuzzleState {
  puzzleId: string;
  solvedAt: string;
  hintsUsed: number;
  attempts: number;
  status: 'solved' | 'failed' | 'attempted';
}

export interface UserStats {
  streak: number;
  lastSolvedDate: string | null;
  totalSolved: number;
  hintsUsedCount: number;
  solvedPuzzles: Record<string, SolvedPuzzleState>;
}

export interface HintState {
  level: 0 | 1 | 2 | 3; // 0 = none, 1 = motif/piece type, 2 = destination area/zone, 3 = exact move
  unlockedAt?: number;
}
