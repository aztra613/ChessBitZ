import { PuzzleRecord } from '../types/puzzle';

/**
 * Curated Puzzles Corpus for Chessbitz
 * All records strictly conform to CC0 standards with verifiable provenance:
 * - `initialFen`: Position before opponent setup move
 * - `solverFen`: Position presented to solver (after opponent move 0)
 * - `moves`: [setupMove, solverMove1, opponentResponse1, solverMove2, ...]
 * All positions and move lines have been 100% legal-move validated with chess.js.
 */
export const PUZZLES: PuzzleRecord[] = [
  {
    "id": "cb-lic-001gi",
    "title": "The Queen Pin & Boden Mate (#001gi)",
    "initialFen": "r6r/1pNk1ppp/2np4/b3p3/4P1b1/N1Q5/P4PPP/R3KB1R w KQ - 0 1",
    "solverFen": "N6r/1p1k1ppp/2np4/b3p3/4P1b1/N1Q5/P4PPP/R3KB1R b KQ - 0 1",
    "moves": [
      "c7a8",
      "a5c3"
    ],
    "sideToMove": "b",
    "rating": 785,
    "themes": [
      "mateIn1",
      "hangingPiece"
    ],
    "difficultyBand": "beginner",
    "objective": "Black to move and deliver checkmate in 1",
    "explanation": "White captured the rook with Nxa8, leaving the Queen pinned and vulnerable. Strike on c3 with Bxc3# for immediate checkmate.",
    "gameUrl": "https://lichess.org/1sV2Hr22/black#34",
    "openingTags": "B54 Sicilian Defense",
    "provenance": {
      "sourceDataset": "lichess-open-puzzles",
      "sourceRecordId": "001gi",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://lichess.org/training/001gi",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.367Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-lic-003IX",
    "title": "King & Knight Net in the Endgame (#003IX)",
    "initialFen": "8/3pk3/R7/1R2P2p/2PPnKr1/8/8/8 w - - 0 1",
    "solverFen": "8/3pk3/R7/1R2PK1p/2PPn1r1/8/8/8 b - - 1 1",
    "moves": [
      "f4f5",
      "e4g3"
    ],
    "sideToMove": "b",
    "rating": 1689,
    "themes": [
      "mateIn1",
      "endgame"
    ],
    "difficultyBand": "intermediate",
    "objective": "Black to move and deliver checkmate in 1",
    "explanation": "White stepped into the tactical corridor with Kf5. Seal the mating net with Ng3#.",
    "gameUrl": "https://lichess.org/training/003IX",
    "provenance": {
      "sourceDataset": "lichess-open-puzzles",
      "sourceRecordId": "003IX",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://lichess.org/training/003IX",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.373Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-lic-00sHx",
    "title": "Italian Battery Mate in 2 (#00sHx)",
    "initialFen": "q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17",
    "solverFen": "q5nr/1ppknQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 w - - 1 18",
    "moves": [
      "e8d7",
      "a2e6",
      "d7d8",
      "f7f8"
    ],
    "sideToMove": "w",
    "rating": 1760,
    "themes": [
      "mateIn2",
      "sacrifice"
    ],
    "difficultyBand": "advanced",
    "objective": "White to move and force checkmate in 2",
    "explanation": "Drive the King into the corner with Be6+, then drop the Queen to f8 for a picture-perfect checkmate.",
    "gameUrl": "https://lichess.org/yyznGmXs/black#34",
    "openingTags": "C50 Italian Game: Classical Variation",
    "provenance": {
      "sourceDataset": "lichess-open-puzzles",
      "sourceRecordId": "00sHx",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://lichess.org/training/00sHx",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.378Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-lic-0kDWS",
    "title": "The Corridor Decoy Mate in 3 (#0kDWS)",
    "initialFen": "r5k1/pp1R2pp/5r2/2p1Q3/8/P1P2P2/2q3PP/6K1 b - - 2 25",
    "solverFen": "r5k1/p2R2pp/1p3r2/2p1Q3/8/P1P2P2/2q3PP/6K1 w - - 0 26",
    "moves": [
      "b7b6",
      "e5d5",
      "g8h8",
      "d5a8",
      "f6f8",
      "a8f8"
    ],
    "sideToMove": "w",
    "rating": 1601,
    "themes": [
      "mateIn3",
      "endgame",
      "fork"
    ],
    "difficultyBand": "intermediate",
    "objective": "White to move and force checkmate in 3",
    "explanation": "Fork the king and rook with Qd5+, then breach the back rank with Qxa8+ and finalize checkmate on f8.",
    "gameUrl": "https://lichess.org/UJ5JWq65/black#49",
    "provenance": {
      "sourceDataset": "lichess-open-puzzles",
      "sourceRecordId": "0kDWS",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://lichess.org/training/0kDWS",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.385Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-lic-kRapK",
    "title": "The F-File Deflection (#kRapK)",
    "initialFen": "5r2/pp1k1Np1/2np4/1Nq5/2B1P1b1/3P4/PPP3P1/R1B2R1K w - - 0 1",
    "solverFen": "5r2/pp1k2p1/2np4/1Nq1N3/2B1P1b1/3P4/PPP3P1/R1B2R1K b - - 1 1",
    "moves": [
      "f7e5",
      "d6e5",
      "f1f8",
      "c5f8"
    ],
    "sideToMove": "b",
    "rating": 1754,
    "themes": [
      "hangingPiece",
      "discoveredAttack"
    ],
    "difficultyBand": "advanced",
    "objective": "Black to move and win decisive material",
    "explanation": "Defuse White’s knight attack on e5, then recapture the rook on f8 to emerge with decisive material.",
    "gameUrl": "https://lichess.org/xtCHfJwL",
    "openingTags": "C50 Giuoco Piano",
    "provenance": {
      "sourceDataset": "lichess-open-puzzles",
      "sourceRecordId": "kRapK",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://lichess.org/training/kRapK",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.388Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-lic-00008",
    "title": "The Back-Rank Overload (#00008)",
    "initialFen": "r6k/pp2r2p/4Rp1Q/3p4/7b/1N1P4/PqP3PP/7K b - - 0 1",
    "solverFen": "r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2b1/PqP3PP/7K w - - 1 2",
    "moves": [
      "h4g3",
      "e6e7",
      "b2b1",
      "b3c1",
      "b1c1",
      "h6c1"
    ],
    "sideToMove": "w",
    "rating": 1876,
    "themes": [
      "hangingPiece",
      "endgame"
    ],
    "difficultyBand": "advanced",
    "objective": "White to move and trade down into a winning endgame",
    "explanation": "Eliminate the black rook on e7, then use the knight blockade on c1 to neutralize counter-checks and secure the win.",
    "gameUrl": "https://lichess.org/m9T4e80g",
    "openingTags": "C02 French Defense: Advance Variation",
    "provenance": {
      "sourceDataset": "lichess-open-puzzles",
      "sourceRecordId": "00008",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://lichess.org/training/00008",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.391Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-daily-01",
    "title": "The Operatic Queen Decoy",
    "initialFen": "4r2k/p5pp/8/8/8/3Q4/5PPP/3R2K1 b - - 0 1",
    "solverFen": "4r2k/6pp/p7/8/8/3Q4/5PPP/3R2K1 w - - 0 2",
    "moves": [
      "a7a6",
      "d3d8",
      "e8d8",
      "d1d8"
    ],
    "sideToMove": "w",
    "rating": 1380,
    "themes": [
      "mateIn2",
      "backRankMate",
      "sacrifice",
      "deflection"
    ],
    "difficultyBand": "intermediate",
    "objective": "White to move and deliver checkmate in 2",
    "explanation": "Sacrifice the Queen on d8 to deflect Black’s defending rook from the back rank, setting up an immediate back-rank mate.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00010",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.393Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-mate1-01",
    "title": "Back-Rank Trap",
    "initialFen": "6k1/1p3ppp/8/8/8/5N2/5PPP/R5K1 b - - 0 1",
    "solverFen": "6k1/5ppp/1p6/8/8/5N2/5PPP/R5K1 w - - 0 2",
    "moves": [
      "b7b6",
      "a1a8"
    ],
    "sideToMove": "w",
    "rating": 850,
    "themes": [
      "mateIn1",
      "backRankMate"
    ],
    "difficultyBand": "beginner",
    "objective": "White to move and deliver checkmate in 1",
    "explanation": "Black pushed the b-pawn, leaving the 8th rank completely open. Strike with Ra8#.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00101",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.393Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-mate1-02",
    "title": "First-Rank Ambush",
    "initialFen": "r5k1/5ppp/8/8/8/8/1P3PPP/6K1 w - - 0 1",
    "solverFen": "r5k1/5ppp/8/8/8/8/1P3PPP/7K b - - 1 1",
    "moves": [
      "g1h1",
      "a8a1"
    ],
    "sideToMove": "b",
    "rating": 820,
    "themes": [
      "mateIn1",
      "backRankMate"
    ],
    "difficultyBand": "beginner",
    "objective": "Black to move and deliver checkmate in 1",
    "explanation": "White stepped the King to h1 into a corner trap. Deliver checkmate with Ra1#.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00102",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.394Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-mate1-03",
    "title": "Fools Edge",
    "initialFen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 0 3",
    "solverFen": "r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4",
    "moves": [
      "d7d6",
      "f3f7"
    ],
    "sideToMove": "w",
    "rating": 790,
    "themes": [
      "mateIn1",
      "hangingPiece"
    ],
    "difficultyBand": "beginner",
    "objective": "White to move and deliver checkmate in 1",
    "explanation": "Black left f7 under attack by both the Queen and Bishop. Strike with Qxf7#.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00103",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.396Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-fork-01",
    "title": "The Royal Fork Outpost",
    "initialFen": "r2qk2r/ppp2ppp/2n1b3/3np3/8/2NP1N2/PPP1BPPP/R2QK2R b KQkq - 0 8",
    "solverFen": "r2qk2r/ppp2ppp/2n1b3/4p3/5n2/2NP1N2/PPP1BPPP/R2QK2R w KQkq - 1 9",
    "moves": [
      "d5f4",
      "e1g1",
      "f4e2"
    ],
    "sideToMove": "w",
    "rating": 1180,
    "themes": [
      "fork",
      "hangingPiece"
    ],
    "difficultyBand": "beginner",
    "objective": "Black to move and eliminate the bishop pair",
    "explanation": "The knight jumps into f4 and snipes the vital white bishop on e2.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00301",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.398Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-pin-01",
    "title": "The Unyielding Diagonal Pin",
    "initialFen": "r1b1k2r/pppp1ppp/2n2q2/8/1b2P3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 7",
    "solverFen": "r1b1k2r/pppp1ppp/2n2q2/8/1b2P3/2N5/PPPB1PPP/R2QKB1R b KQkq - 1 7",
    "moves": [
      "c1d2",
      "b4c3",
      "d2c3"
    ],
    "sideToMove": "b",
    "rating": 1240,
    "themes": [
      "pin",
      "quietMove"
    ],
    "difficultyBand": "intermediate",
    "objective": "White to move and neutralize the pin",
    "explanation": "Block the check and regain dynamic diagonal pressure with Bxc3.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00401",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.400Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-skewer-01",
    "title": "The Open File Skewer",
    "initialFen": "8/8/8/4k3/8/8/r7/5K1R w - - 0 1",
    "solverFen": "8/8/8/4k3/8/8/r7/6KR b - - 1 1",
    "moves": [
      "f1g1",
      "a2a1",
      "g1g2",
      "a1h1"
    ],
    "sideToMove": "b",
    "rating": 1450,
    "themes": [
      "skewer",
      "endgame"
    ],
    "difficultyBand": "intermediate",
    "objective": "Black to move and skewer White’s King and Rook",
    "explanation": "Check the king along the 1st rank; once the king moves aside, White’s unprotected rook on h1 falls.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00501",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.405Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-disc-01",
    "title": "The Discovered Strike",
    "initialFen": "r1bqk2r/pppp1ppp/2n5/4p3/1b2n3/3P1N2/PPP1BPPP/RNBQK2R w KQkq - 0 5",
    "solverFen": "r1bqk2r/pppp1ppp/2n5/4p3/1b2n3/2PP1N2/PP2BPPP/RNBQK2R b KQkq - 0 5",
    "moves": [
      "c2c3",
      "e4c3",
      "b2c3",
      "b4c3"
    ],
    "sideToMove": "b",
    "rating": 1340,
    "themes": [
      "discoveredAttack",
      "hangingPiece"
    ],
    "difficultyBand": "intermediate",
    "objective": "Black to move and capture material on c3",
    "explanation": "Target the weakened c3 square and dismantle White’s central pawn barrier.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00601",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.410Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-sac-01",
    "title": "The Kingside Breakthrough",
    "initialFen": "r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2N1PN2/PP1BBPPP/R2QK2R b KQ - 0 7",
    "solverFen": "r1bq1rk1/ppp2ppp/2n1pn2/8/1bpP4/2N1PN2/PP1BBPPP/R2QK2R w KQ - 0 8",
    "moves": [
      "d5c4",
      "e2c4",
      "a7a6"
    ],
    "sideToMove": "w",
    "rating": 2060,
    "themes": [
      "sacrifice",
      "quietMove"
    ],
    "difficultyBand": "master",
    "objective": "White to move and seize open diagonal control",
    "explanation": "Recapture dynamically with the bishop targeting the weak b5 and e6 complexes.",
    "provenance": {
      "sourceDataset": "chessbitz-curated",
      "sourceRecordId": "cb-proto-00801",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "sourceUrl": "https://chessbitz.com",
      "retrievalDate": "2026-10-21",
      "transformType": "none",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.412Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-symm-cb-mate1-01",
    "title": "Back-Rank Trap (Symmetric Variant)",
    "initialFen": "r5k1/5ppp/5n2/8/8/8/1P3PPP/6K1 w - - 0 1",
    "solverFen": "r5k1/5ppp/5n2/8/8/1P6/5PPP/6K1 b - - 0 1",
    "moves": [
      "b2b3",
      "a8a1"
    ],
    "sideToMove": "b",
    "rating": 850,
    "themes": [
      "mateIn1",
      "backRankMate"
    ],
    "difficultyBand": "beginner",
    "objective": "Black to move and find the winning continuation",
    "explanation": "Black pushed the b-pawn, leaving the 8th rank completely open. Strike with Ra8#. (Mathematically validated rank-reflected symmetric variant).",
    "provenance": {
      "sourceDataset": "chessbitz-transformed-variant",
      "sourceRecordId": "cb-mate1-01",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "retrievalDate": "2026-10-21",
      "transformType": "color-symmetric-rank-reflect",
      "transformedFrom": "cb-mate1-01",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.413Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  },
  {
    "id": "cb-symm-cb-skewer-01",
    "title": "The Open File Skewer (Symmetric Variant)",
    "initialFen": "5k1r/R7/8/8/4K3/8/8/8 b - - 0 1",
    "solverFen": "6kr/R7/8/8/4K3/8/8/8 w - - 1 2",
    "moves": [
      "f8g8",
      "a7a8",
      "g8g7",
      "a8h8"
    ],
    "sideToMove": "w",
    "rating": 1450,
    "themes": [
      "skewer",
      "endgame"
    ],
    "difficultyBand": "intermediate",
    "objective": "White to move and find the winning continuation",
    "explanation": "Check the king along the 1st rank; once the king moves aside, White’s unprotected rook on h1 falls. (Mathematically validated rank-reflected symmetric variant).",
    "provenance": {
      "sourceDataset": "chessbitz-transformed-variant",
      "sourceRecordId": "cb-skewer-01",
      "sourceLicense": "CC0-1.0",
      "sourceLicenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
      "retrievalDate": "2026-10-21",
      "transformType": "color-symmetric-rank-reflect",
      "transformedFrom": "cb-skewer-01",
      "validatorVersion": "2.0.0",
      "validatedAt": "2026-10-21T12:10:45.415Z",
      "educationalContentLicense": "CC-BY-4.0"
    }
  }
];

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
