import { Chess, Square } from 'chess.js';
import * as fs from 'fs';
import * as path from 'path';
import { loadRegistry } from './lib/registry';
import { loadPublishedRecords, orderByRegistry } from './lib/shards';

/** The published corpus, read straight from the committed shards. */
const PUZZLES = orderByRegistry(loadPublishedRecords(), loadRegistry());

console.log(`=== PlyQuest Automated Puzzle Verification Suite ===`);
console.log(`Auditing ${PUZZLES.length} puzzles in curated corpus...\n`);

let failed = 0;
const seenIds = new Set<string>();
const seenInitialFens = new Set<string>();

// Read denylist
let denylistedIds = new Set<string>();
const denylistPath = path.resolve(process.cwd(), 'scripts/puzzles-denylist.json');
if (fs.existsSync(denylistPath)) {
  try {
    const denylistData = JSON.parse(fs.readFileSync(denylistPath, 'utf-8'));
    if (Array.isArray(denylistData.retractedPuzzleIds)) {
      denylistedIds = new Set(denylistData.retractedPuzzleIds);
    }
  } catch (err) {
    console.warn('Could not read denylist file:', err);
  }
}

for (const p of PUZZLES) {
  // 1. Deduplication check
  if (seenIds.has(p.id)) {
    console.error(`[FAIL] Duplicate Puzzle ID detected: ${p.id}`);
    failed++;
  }
  seenIds.add(p.id);

  // 2. Denylist check
  if (denylistedIds.has(p.id) || denylistedIds.has(p.provenance.sourceRecordId)) {
    console.error(`[FAIL] Denylisted puzzle present in corpus: ${p.id} (${p.provenance.sourceRecordId})`);
    failed++;
  }

  // 3. Provenance and Licensing check
  if (!p.provenance || !p.provenance.sourceDataset || !p.provenance.sourceRecordId) {
    console.error(`[FAIL] Incomplete provenance metadata in ${p.id}`);
    failed++;
  }
  if (p.provenance.sourceLicense !== 'CC0-1.0' && (p.provenance.sourceLicense as string) !== 'Public-Domain') {
    console.error(`[FAIL] Unapproved dataset license ${p.provenance.sourceLicense} in ${p.id}`);
    failed++;
  }

  try {
    // 4. Initial FEN check
    const chess = new Chess(p.initialFen);

    // 5. Opponent setup move check
    const setupUci = p.moves[0];
    const sFrom = setupUci.substring(0, 2) as Square;
    const sTo = setupUci.substring(2, 4) as Square;
    const sPromo = setupUci.length > 4 ? setupUci.substring(4) : undefined;

    const setupMoveRes = chess.move({ from: sFrom, to: sTo, promotion: sPromo });
    if (!setupMoveRes) {
      console.error(`[FAIL] ${p.id}: Illegal setup move ${setupUci} on initial FEN ${p.initialFen}`);
      failed++;
      continue;
    }

    // 6. Check solverFen matches
    const calculatedSolverFen = chess.fen();
    const calcParts = calculatedSolverFen.split(' ');
    const expectedParts = p.solverFen.split(' ');
    if (calcParts[0] !== expectedParts[0] || calcParts[1] !== expectedParts[1]) {
      console.error(`[FAIL] ${p.id}: Calculated solverFen ${calculatedSolverFen} differs from record ${p.solverFen}`);
      failed++;
    }

    // 7. Check sideToMove matches
    if (p.sideToMove !== chess.turn()) {
      console.error(`[FAIL] ${p.id}: sideToMove ${p.sideToMove} does not match solverFen turn ${chess.turn()}`);
      failed++;
    }

    // 8. Replay solution moves
    for (let i = 1; i < p.moves.length; i++) {
      const uci = p.moves[i];
      const from = uci.substring(0, 2) as Square;
      const to = uci.substring(2, 4) as Square;
      const promo = uci.length > 4 ? uci.substring(4) : undefined;
      const moveRes = chess.move({ from, to, promotion: promo });
      if (!moveRes) {
        console.error(`[FAIL] ${p.id}: Illegal move ${uci} (step ${i}) in position ${chess.fen()}`);
        failed++;
        break;
      }
    }

    // 9. Checkmate objective verification
    const isCheckmate = chess.isCheckmate();
    const solverMovesCount = Math.floor(p.moves.length / 2);

    if (p.themes.includes('mateIn1')) {
      if (!isCheckmate || solverMovesCount !== 1) {
        console.error(`[FAIL] ${p.id}: Tagged mateIn1 but ended with checkmate=${isCheckmate}, solverMoves=${solverMovesCount}`);
        failed++;
      }
    }
    if (p.themes.includes('mateIn2')) {
      if (!isCheckmate || solverMovesCount !== 2) {
        console.error(`[FAIL] ${p.id}: Tagged mateIn2 but ended with checkmate=${isCheckmate}, solverMoves=${solverMovesCount}`);
        failed++;
      }
    }
    if (p.themes.includes('mateIn3')) {
      if (!isCheckmate || solverMovesCount !== 3) {
        console.error(`[FAIL] ${p.id}: Tagged mateIn3 but ended with checkmate=${isCheckmate}, solverMoves=${solverMovesCount}`);
        failed++;
      }
    }

    console.log(`[PASS] ${p.id} (${p.provenance.sourceDataset} #${p.provenance.sourceRecordId}) - ${p.title}`);
  } catch (err) {
    console.error(`[EXCEPTION] ${p.id}:`, err);
    failed++;
  }
}

console.log(`\nVerification Summary:`);
console.log(`Total Puzzles: ${PUZZLES.length}`);
console.log(`Failed Audits: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log(`All ${PUZZLES.length} puzzles passed 100% legal replay, objective, and licensing verification!`);
}
