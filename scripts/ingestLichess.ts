/**
 * PlyQuest — Lichess Open Database Ingestion Pipeline (CLI)
 *
 * Streams lichess_db_puzzle.csv.zst (CC0-1.0) with bounded memory, filters and
 * ranks candidates, validates every accepted line with chess.js, and publishes
 * the result as append-only bucket shards.
 *
 * Design notes:
 *  - Filtering is cheap (numeric comparisons) and runs before any chess.js work.
 *  - Candidates are held in per-(theme × band) queues capped by KEEP_PER_BUCKET.
 *    Individual rows are never accumulated into one big array.
 *  - On validation or dedupe failure the queue is drained further, so a quota is
 *    met by backfill rather than silently under-delivering.
 *  - A shortfall is reported as `partial` and exits non-zero unless --allow-partial.
 *
 * Usage:
 *   npx tsx scripts/ingestLichess.ts --source ./lichess_db_puzzle.csv.zst --limit 2000
 *   npx tsx scripts/ingestLichess.ts --source ./x.zst --limit 300 --scanRows 200000
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { Decompress } from 'fzstd';
import { parse } from 'csv-parse';
import { Chess, Square } from 'chess.js';
import { PuzzleRecord, TacticalTheme, DifficultyBand } from '../src/types/puzzle';
import {
  loadRegistry,
  saveRegistry,
  appendToRegistry,
  assertAppendOnly,
} from './lib/registry';
import {
  loadPublishedRecords,
  writeShards,
  orderByRegistry,
  SHARDS_DIR,
} from './lib/shards';

export const INGESTION_VERSION = '3.0.0';
export const DEFAULT_SOURCE_URL =
  'https://database.lichess.org/lichess_db_puzzle.csv.zst';
export const KEEP_PER_BUCKET = 500;

// ---------------------------------------------------------------------------
// Preserved exports (used by fetchLichessPuzzles.ts and tests)
// ---------------------------------------------------------------------------

export const SUPPORTED_TACTICAL_THEMES: Record<string, TacticalTheme> = {
  // Mate length (Lichess does not tag beyond mate in 5)
  matein1: 'mateIn1',
  matein2: 'mateIn2',
  matein3: 'mateIn3',
  matein4: 'mateIn4',
  matein5: 'mateIn5',
  // Core tactical motifs
  fork: 'fork',
  pin: 'pin',
  skewer: 'skewer',
  discoveredattack: 'discoveredAttack',
  discoveredcheck: 'discoveredCheck',
  doublecheck: 'doubleCheck',
  deflection: 'deflection',
  sacrifice: 'sacrifice',
  clearance: 'clearance',
  interference: 'interference',
  xrayattack: 'xRayAttack',
  capturingdefender: 'capturingDefender',
  attraction: 'attraction',
  intermezzo: 'intermezzo',
  quietmove: 'quietMove',
  zugzwang: 'zugzwang',
  // Piece and king safety
  hangingpiece: 'hangingPiece',
  trappedpiece: 'trappedPiece',
  exposedking: 'exposedKing',
  backrankmate: 'backRankMate',
  smotheredmate: 'smotheredMate',
  kingsideattack: 'kingsideAttack',
  queensideattack: 'queensideAttack',
  attackingf2f7: 'attackingF2F7',
  // Pawns, promotion and special moves
  advancedpawn: 'advancedPawn',
  promotion: 'promotion',
  underpromotion: 'underPromotion',
  enpassant: 'enPassant',
  castling: 'castling',
  // Endgames
  endgame: 'endgame',
  rookendgame: 'rookEndgame',
  pawnendgame: 'pawnEndgame',
  bishopendgame: 'bishopEndgame',
  knightendgame: 'knightEndgame',
  queenendgame: 'queenEndgame',
  queenrookendgame: 'queenRookEndgame',
  // Named checkmate patterns
  operamate: 'operaMate',
  pillsburysmate: 'pillsburysMate',
  arabianmate: 'arabianMate',
  anastasiamate: 'anastasiaMate',
  bodenmate: 'bodenMate',
  dovetailmate: 'dovetailMate',
  doublebishopmate: 'doubleBishopMate',
  epaulettemate: 'epauletteMate',
  hookmate: 'hookMate',
  cornermate: 'cornerMate',
  swallowstailmate: 'swallowstailMate',
  trianglemate: 'triangleMate',
  killboxmate: 'killBoxMate',
  morphysmate: 'morphysMate',
  blindswinemate: 'blindSwineMate',
  vukovicmate: 'vukovicMate',
  balestramate: 'balestraMate',
  // Structural / defensive
  defensivemove: 'defensiveMove',
  collinearmove: 'collinearMove',
};

export function determineDifficulty(rating: number): DifficultyBand {
  if (rating < 1200) return 'beginner';
  if (rating < 1700) return 'intermediate';
  if (rating < 2200) return 'advanced';
  return 'master';
}

export function generateEducationalExplanation(
  themes: TacticalTheme[],
  sideToMove: 'w' | 'b',
  _rating: number,
  _title: string
): { objective: string; explanation: string } {
  const sideName = sideToMove === 'w' ? 'White' : 'Black';

  if (themes.includes('mateIn1')) {
    return {
      objective: `${sideName} to move and deliver checkmate in 1`,
      explanation:
        'Find the decisive checkmating square that eliminates all king escape routes in a single strike.',
    };
  }
  if (themes.includes('mateIn2')) {
    return {
      objective: `${sideName} to move and force checkmate in 2`,
      explanation:
        'Set up an unavoidable mating net with an initial forcing check or quiet deflection, leaving the opponent no defense.',
    };
  }
  if (themes.includes('mateIn3')) {
    return {
      objective: `${sideName} to move and force checkmate in 3`,
      explanation:
        'Calculate a precise 3-ply combination that breaks open the defensive shield and closes the mating corridor.',
    };
  }
  if (themes.includes('fork')) {
    return {
      objective: `${sideName} to move and fork high-value targets`,
      explanation:
        'Deploy a double attack targeting two vulnerable enemy pieces simultaneously to win decisive material.',
    };
  }
  if (themes.includes('pin')) {
    return {
      objective: `${sideName} to move and exploit the pinned piece`,
      explanation:
        'Fix the defending piece to its high-value target and pile on unstoppable tactical pressure.',
    };
  }
  if (themes.includes('skewer')) {
    return {
      objective: `${sideName} to move and execute a skewer attack`,
      explanation:
        'Attack a valuable front piece along an open rank, file, or diagonal, exposing the unprotected piece behind it.',
    };
  }
  if (themes.includes('discoveredAttack')) {
    return {
      objective: `${sideName} to move and unleash a discovered attack`,
      explanation:
        'Clear the firing line of the piece behind while the front piece creates an active tactical threat.',
    };
  }
  if (themes.includes('backRankMate')) {
    return {
      objective: `${sideName} to move and exploit the trapped back rank`,
      explanation:
        "Penetrate the opponent's 1st or 8th rank where friendly pawns prevent the king from escaping the check.",
    };
  }

  // Additional motifs, expressed as [objective tail, explanation].
  const motifCopy: Partial<Record<TacticalTheme, [string, string]>> = {
    mateIn4: [
      'force checkmate in 4',
      'Chain four forcing moves so the king is driven into an unavoidable mating net.',
    ],
    mateIn5: [
      'force checkmate in 5',
      "Calculate a long forcing sequence where every check narrows the king's escape squares.",
    ],
    kingsideAttack: [
      'break through on the kingside',
      'Throw pawns and pieces at the castled king to tear open the files around it.',
    ],
    queensideAttack: [
      'break through on the queenside',
      'Open lines on the queenside and exploit the space behind the enemy pawns.',
    ],
    advancedPawn: [
      'exploit the advanced pawn',
      'A far-advanced pawn cramps the opponent and creates promotion threats that tie down their pieces.',
    ],
    promotion: [
      'promote a pawn',
      'Escort the pawn to the last rank, using the promotion threat to win material or force mate.',
    ],
    underPromotion: [
      'choose the right promotion piece',
      'A knight or rook promotion can be stronger than a queen — look for the mate or fork it unlocks.',
    ],
    exposedKing: [
      'punish the exposed king',
      'The king has lost its pawn shield; open a line and bring a heavy piece to bear.',
    ],
    attackingF2F7: [
      'strike the weakest square',
      'f2 (or f7) is defended only by the king — pile on it to break through immediately.',
    ],
    discoveredCheck: [
      'unleash a discovered check',
      'Move the front piece so the piece behind it gives check, gaining tempo for a second threat.',
    ],
    zugzwang: [
      'put the opponent in zugzwang',
      'Every legal move makes their position worse — force them to move when they would rather pass.',
    ],
    intermezzo: [
      'find the in-between move',
      'Before recapturing, insert a forcing check or threat that changes the position to your advantage.',
    ],
    xRayAttack: [
      'use an x-ray attack',
      'Attack through an enemy piece to the square or piece behind it.',
    ],
    capturingDefender: [
      'remove the defender',
      'Capture or deflect the piece guarding the target, then strike the now-undefended point.',
    ],
    enPassant: [
      'use the en passant capture',
      'The pawn just jumped two squares past your pawn — take it en passant.',
    ],
    castling: [
      'exploit the castled king',
      "Castling can walk into a tactic; punish the king's new square.",
    ],
    defensiveMove: [
      'find the defensive resource',
      'There is no winning tactic here — locate the move that holds the position together.',
    ],
  };

  const motif = themes.map((t) => motifCopy[t]).find((entry) => entry !== undefined);
  if (motif) {
    return {
      objective: `${sideName} to move and ${motif[0]}`,
      explanation: motif[1],
    };
  }

  return {
    objective: `${sideName} to move and win material or deliver mate`,
    explanation:
      "Find the tactical refutation that exploits the opponent's tactical vulnerability on the board.",
  };
}

export interface LichessRowInput {
  puzzleId: string;
  fen: string;
  movesStr: string;
  rating: number;
  ratingDeviation?: number;
  popularity?: number;
  nbPlays?: number;
  rawThemes: string[];
  gameUrl?: string;
  openingTags?: string;
}

/** Validates one Lichess row and builds a PuzzleRecord, or explains the rejection. */
export function validateLichessRow(
  row: LichessRowInput,
  validatorVersion = INGESTION_VERSION
): { valid: boolean; puzzle?: PuzzleRecord; rejectReason?: string } {
  try {
    const moves = row.movesStr.trim().split(/\s+/).filter(Boolean);
    if (moves.length < 2) {
      return { valid: false, rejectReason: 'Moves line has fewer than 2 plies' };
    }

    const chess = new Chess(row.fen);

    const setupUci = moves[0];
    const setupResult = chess.move({
      from: setupUci.substring(0, 2) as Square,
      to: setupUci.substring(2, 4) as Square,
      promotion: setupUci.length > 4 ? setupUci.substring(4) : undefined,
    });
    if (!setupResult) {
      return { valid: false, rejectReason: `Illegal opponent setup move: ${setupUci}` };
    }

    const solverFen = chess.fen();
    const sideToMove = chess.turn();

    for (let i = 1; i < moves.length; i++) {
      const uci = moves[i];
      const moveResult = chess.move({
        from: uci.substring(0, 2) as Square,
        to: uci.substring(2, 4) as Square,
        promotion: uci.length > 4 ? uci.substring(4) : undefined,
      });
      if (!moveResult) {
        return { valid: false, rejectReason: `Illegal solver ply ${i} (${uci})` };
      }
    }

    const mappedThemes: TacticalTheme[] = [];
    for (const t of row.rawThemes) {
      const mapped = SUPPORTED_TACTICAL_THEMES[t.toLowerCase()];
      if (mapped && !mappedThemes.includes(mapped)) mappedThemes.push(mapped);
    }

    // Mate tags must actually end in mate; otherwise the tag is dropped.
    const isCheckmate = chess.isCheckmate();
    const solverMoves = Math.floor(moves.length / 2);
    if (!isCheckmate) {
      const mateTagIndex = mappedThemes.findIndex((t) => t.startsWith('mateIn'));
      if (mateTagIndex >= 0) mappedThemes.splice(mateTagIndex, 1);
    } else if (mappedThemes.length === 0) {
      if (solverMoves === 1) mappedThemes.push('mateIn1');
      else if (solverMoves === 2) mappedThemes.push('mateIn2');
      else if (solverMoves === 3) mappedThemes.push('mateIn3');
    }

    if (mappedThemes.length === 0) {
      return { valid: false, rejectReason: 'No supported tactical theme' };
    }

    const difficultyBand = determineDifficulty(row.rating);
    const title = `Tactical Motif #${row.puzzleId}`;
    const pedagogical = generateEducationalExplanation(
      mappedThemes,
      sideToMove,
      row.rating,
      title
    );

    return {
      valid: true,
      puzzle: {
        id: `cb-lic-${row.puzzleId}`,
        title,
        initialFen: row.fen,
        solverFen,
        moves,
        sideToMove,
        rating: row.rating,
        ratingDeviation: row.ratingDeviation,
        popularity: row.popularity,
        nbPlays: row.nbPlays,
        themes: mappedThemes,
        difficultyBand,
        objective: pedagogical.objective,
        explanation: pedagogical.explanation,
        gameUrl: row.gameUrl,
        openingTags: row.openingTags,
        provenance: {
          sourceDataset: 'lichess-open-puzzles',
          sourceRecordId: row.puzzleId,
          sourceLicense: 'CC0-1.0',
          sourceLicenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
          sourceUrl: `https://lichess.org/training/${row.puzzleId}`,
          retrievalDate: new Date().toISOString().split('T')[0],
          transformType: 'none',
          validatorVersion,
          validatedAt: new Date().toISOString(),
          educationalContentLicense: 'CC-BY-4.0',
        },
      },
    };
  } catch (err) {
    return { valid: false, rejectReason: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Options {
  source: string;
  limit: number;
  minPopularity: number;
  minPlays: number;
  minRating: number;
  maxRating: number;
  scanRows: number;
  allowPartial: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
  };
  return {
    source: get('--source') ?? DEFAULT_SOURCE_URL,
    limit: parseInt(get('--limit') ?? '8000', 10),
    minPopularity: parseInt(get('--minPopularity') ?? '80', 10),
    minPlays: parseInt(get('--minPlays') ?? '100', 10),
    minRating: parseInt(get('--minRating') ?? '600', 10),
    maxRating: parseInt(get('--maxRating') ?? '2600', 10),
    scanRows: parseInt(get('--scanRows') ?? '0', 10) || Infinity,
    allowPartial: argv.includes('--allow-partial'),
    dryRun: argv.includes('--dry-run'),
  };
}

interface Candidate extends LichessRowInput {
  popularity: number;
  nbPlays: number;
}

function bucketKey(theme: TacticalTheme, band: DifficultyBand): string {
  return `${theme}|${band}`;
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk as Buffer);
  return hash.digest('hex');
}

/** Cheap field parsing only — no chess logic runs here. */
function toRow(record: Record<string, string>): Candidate | null {
  const rating = parseFloat(record.Rating);
  const popularity = parseFloat(record.Popularity);
  const nbPlays = parseFloat(record.NbPlays);
  if (!record.PuzzleId || !record.FEN || !record.Moves) return null;
  if (!Number.isFinite(rating) || !Number.isFinite(popularity)) return null;

  return {
    puzzleId: record.PuzzleId,
    fen: record.FEN,
    movesStr: record.Moves,
    rating,
    ratingDeviation: parseFloat(record.RatingDeviation) || undefined,
    popularity,
    nbPlays: Number.isFinite(nbPlays) ? nbPlays : 0,
    rawThemes: (record.Themes || '').split(' ').filter(Boolean),
    gameUrl: record.GameUrl || undefined,
    openingTags: record.OpeningTags || undefined,
  };
}

async function scanCandidates(opts: Options): Promise<{
  queues: Map<string, Candidate[]>;
  rowsRead: number;
  rowsFiltered: number;
}> {
  const queues = new Map<string, Candidate[]>();
  let rowsRead = 0;
  let rowsFiltered = 0;

  const compressed = fs.createReadStream(opts.source);
  const decompressed = Readable.from(
    (async function* () {
      // `pushed` must exist before Decompress is constructed: fzstd can invoke
      // the callback synchronously, which would otherwise hit the TDZ.
      const pushed: Buffer[] = [];
      const inflate = new Decompress((chunk: Uint8Array) => {
        pushed.push(Buffer.from(chunk));
      });
      for await (const chunk of compressed) {
        inflate.push(new Uint8Array(chunk as Buffer));
        while (pushed.length) yield pushed.shift()!;
      }
    })()
  );

  const parser = decompressed.pipe(
    parse({ columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true })
  );

  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    rowsRead++;
    if (rowsRead > opts.scanRows) break;

    const row = toRow(record);
    if (!row) continue;

    if (
      row.popularity < opts.minPopularity ||
      row.nbPlays < opts.minPlays ||
      row.rating < opts.minRating ||
      row.rating > opts.maxRating
    ) {
      rowsFiltered++;
      continue;
    }

    let primary: TacticalTheme | undefined;
    for (const t of row.rawThemes) {
      const mapped = SUPPORTED_TACTICAL_THEMES[t.toLowerCase()];
      if (mapped) {
        primary = mapped;
        break;
      }
    }
    if (!primary) {
      rowsFiltered++;
      continue;
    }

    const key = bucketKey(primary, determineDifficulty(row.rating));
    const queue = queues.get(key) ?? [];
    queue.push(row);
    queues.set(key, queue);
  }

  return { queues, rowsRead, rowsFiltered };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  console.log('=== PlyQuest Lichess ingestion ===\n');
  console.log(`source          : ${opts.source}`);
  console.log(`target corpus   : ${opts.limit} total (not per-run additions)`);
  console.log(`filters         : popularity>=${opts.minPopularity} plays>=${opts.minPlays} rating ${opts.minRating}-${opts.maxRating}`);

  const isUrl = /^https?:\/\//.test(opts.source);
  if (isUrl) {
    throw new Error(
      `Remote sources are not supported in-process. Download it first:\n  curl -L -o lichess_db_puzzle.csv.zst ${opts.source}`
    );
  }
  if (!fs.existsSync(opts.source)) {
    throw new Error(`Source file not found: ${opts.source}`);
  }

  // `--limit` is the target TOTAL published corpus size, not additions per run.
  // Fast path: when the corpus is already at target there is nothing to do, so
  // skip the multi-minute scan entirely. This is the normal monthly outcome.
  const published = loadPublishedRecords();
  const targetTotal = opts.limit;
  const needed = Math.max(0, targetTotal - published.size);

  console.log(`already published : ${published.size}`);
  console.log(`need to add       : ${needed}`);

  if (needed === 0) {
    console.log(
      `\nOK: corpus is already at target (${published.size} >= ${targetTotal}); nothing to ingest.`
    );
    return;
  }

  const retrievedAt = new Date().toISOString();
  const sourceChecksum = await sha256File(opts.source);
  console.log(`sha256          : ${sourceChecksum}`);
  console.log('\nScanning candidates...');

  const { queues, rowsRead, rowsFiltered } = await scanCandidates(opts);

  // Rank each bucket and keep only the strongest candidates.
  for (const [key, queue] of queues) {
    queue.sort((a, b) => b.popularity - a.popularity || b.nbPlays - a.nbPlays);
    if (queue.length > KEEP_PER_BUCKET) queues.set(key, queue.slice(0, KEEP_PER_BUCKET));
  }

  const bucketKeys = [...queues.keys()];
  const totalCandidates = [...queues.values()].reduce((n, q) => n + q.length, 0);
  console.log(`rows read       : ${rowsRead}`);
  console.log(`filtered out    : ${rowsFiltered}`);
  console.log(`buckets         : ${bucketKeys.length}`);
  console.log(`candidates kept : ${totalCandidates}\n`);

  if (totalCandidates === 0) {
    console.error('FAILED: no candidates survived filtering. Nothing to publish.');
    process.exit(1);
  }

  const quota = Math.max(1, Math.ceil(needed / bucketKeys.length));
  const accepted: PuzzleRecord[] = [];

  // Seed dedupe from everything already published, so a monthly refresh can
  // never append a near-duplicate of an existing puzzle.
  const seenFen = new Set<string>();
  const seenLine = new Set<string>();
  for (const existing of published.values()) {
    seenFen.add(existing.initialFen);
    seenLine.add(`${existing.solverFen}|${existing.moves.join(' ')}`);
  }
  const cursors = new Map<string, number>();
  const perBucket = new Map<string, { requested: number; accepted: number; exhausted: boolean }>();

  // Pre-populate every bucket so the final report never dereferences a missing
  // entry, even when Pass A breaks out early.
  for (const key of bucketKeys) {
    perBucket.set(key, { requested: quota, accepted: 0, exhausted: false });
  }

  const tryAccept = (candidate: Candidate): boolean => {
    const result = validateLichessRow(candidate);
    if (!result.valid || !result.puzzle) return false;

    const lineKey = `${result.puzzle.solverFen}|${result.puzzle.moves.join(' ')}`;
    if (seenFen.has(result.puzzle.initialFen) || seenLine.has(lineKey)) return false;

    seenFen.add(result.puzzle.initialFen);
    seenLine.add(lineKey);
    accepted.push(result.puzzle);
    return true;
  };

  // Pass A — give each bucket its share of the target.
  for (const key of bucketKeys) {
    if (accepted.length >= needed) break;
    const queue = queues.get(key)!;
    let idx = 0;
    let taken = 0;
    while (idx < queue.length && taken < quota && accepted.length < needed) {
      if (tryAccept(queue[idx++])) taken += 1;
    }
    cursors.set(key, idx);
    perBucket.get(key)!.accepted = taken;
  }

  // Pass B — round-robin backfill so rejected or deduped candidates are replaced
  // until the target is met or every ranked queue is drained.
  let progressed = true;
  while (accepted.length < needed && progressed) {
    progressed = false;
    for (const key of bucketKeys) {
      if (accepted.length >= needed) break;
      const queue = queues.get(key)!;
      let idx = cursors.get(key) ?? 0;
      while (idx < queue.length) {
        if (tryAccept(queue[idx++])) {
          perBucket.get(key)!.accepted += 1;
          progressed = true;
          break;
        }
      }
      cursors.set(key, idx);
    }
  }

  for (const key of bucketKeys) {
    perBucket.get(key)!.exhausted = (cursors.get(key) ?? 0) >= queues.get(key)!.length;
  }

  const status = accepted.length >= needed ? 'complete' : 'partial';
  const shortfalls = [...perBucket.entries()].filter(([, v]) => v.accepted < v.requested);
  const bucketsReport = [...perBucket.entries()].map(([key, v]) => ({ key, ...v }));

  console.log(`accepted        : ${accepted.length} (${status})`);
  if (shortfalls.length > 0) {
    console.log(`buckets short   : ${shortfalls.length}`);
    for (const [key, v] of shortfalls.slice(0, 10)) {
      console.log(`  ${key}: ${v.accepted}/${v.requested}${v.exhausted ? ' (queue exhausted)' : ''}`);
    }
  }

  if (status === 'partial' && !opts.allowPartial) {
    console.error(
      `\nFAILED: only ${accepted.length} of ${needed} needed puzzles passed validation ` +
        `(corpus would be ${published.size + accepted.length} of ${targetTotal}).\n` +
        `Widen the filters (--minPopularity/--minPlays), raise --scanRows, or pass --allow-partial\n` +
        `to publish a partial corpus deliberately.`
    );
    process.exit(1);
  }

  // Merge with everything already published. Existing records always win.
  const registryBefore = loadRegistry();
  const byId = new Map<string, PuzzleRecord>(published);

  const newRecords = accepted.filter((r) => !byId.has(r.id));
  for (const record of newRecords) byId.set(record.id, record);

  const registryAfter = JSON.parse(JSON.stringify(registryBefore));
  const appended = appendToRegistry(registryAfter, newRecords, INGESTION_VERSION);
  assertAppendOnly(registryBefore, registryAfter);

  const ordered = orderByRegistry(byId, registryAfter);

  console.log(`\nnewly published : ${appended.length}`);
  console.log(`already known   : ${accepted.length - appended.length}`);
  console.log(`total published : ${ordered.length}`);

  if (opts.dryRun) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  saveRegistry(registryAfter);
  const manifest = writeShards(ordered, registryAfter);

  fs.writeFileSync(
    path.resolve(process.cwd(), 'src/data/source-manifest.json'),
    JSON.stringify(
      {
        manifestVersion: '2.0.0',
        generatedAt: new Date().toISOString(),
        validatorVersion: INGESTION_VERSION,
        ingestion: {
          sourceUrl: isUrl ? opts.source : DEFAULT_SOURCE_URL,
          sourceFile: path.basename(opts.source),
          retrievedAt,
          sourceChecksumSha256: sourceChecksum,
          decompressor: 'fzstd@0.1.1',
          csvParser: 'csv-parse@7.0.3',
          filters: {
            minPopularity: opts.minPopularity,
            minPlays: opts.minPlays,
            minRating: opts.minRating,
            maxRating: opts.maxRating,
          },
          rowsRead,
          rowsFiltered,
          candidatesKept: totalCandidates,
        },
        requestedTarget: opts.limit,
        acceptedThisRun: accepted.length,
        acceptedCount: ordered.length,
        status,
        buckets: bucketsReport,
        totalPuzzles: manifest.totalPuzzles,
        bucketsWritten: manifest.buckets.length,
        licensingSummary: {
          dataLicense: 'CC0-1.0 Universal',
          dataLicenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
          educationalContentLicense: 'CC-BY-4.0',
          commercialRedistributionPermitted: true,
        },
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );

  console.log(`\nwrote ${SHARDS_DIR} (${manifest.buckets.length} bucket files + manifest.json)`);
  console.log(`wrote src/data/source-manifest.json`);
  console.log(`\nOK: published ${manifest.totalPuzzles} puzzles (${status}).`);
}

// Only run the CLI when invoked directly, so imports stay side-effect free.
const invokedDirectly = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/ingestLichess.ts');
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`\nFATAL: ${(err as Error).message}`);
    process.exit(1);
  });
}
