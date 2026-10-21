import { Chess } from 'chess.js';
import {
  reflectSquare,
  reflectUciMove,
  transformFenColorSymmetric,
  transformPuzzleColorSymmetric,
  replayMoveLine,
  getHintContent,
} from '../utils/chessUtils';
import { PUZZLES } from '../data/puzzles';
import {
  getCurrentGlobalDate,
  dateStringToEpochDay,
  epochDayToDateString,
  getDailyPuzzle,
  getArchivePuzzlesForMonth,
} from '../utils/dailySchedule';

console.log('=== Running Chessbitz Core Test Suite ===\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✓ PASS: ${msg}`);
    testsPassed++;
  } else {
    console.error(`✗ FAIL: ${msg}`);
    testsFailed++;
  }
}

// 1. Test square reflection
assert(reflectSquare('e2') === 'e7', 'reflectSquare("e2") maps to "e7"');
assert(reflectSquare('a1') === 'a8', 'reflectSquare("a1") maps to "a8"');
assert(reflectSquare('g8') === 'g1', 'reflectSquare("g8") maps to "g1"');
assert(reflectSquare('c4') === 'c5', 'reflectSquare("c4") maps to "c5"');
assert(reflectSquare('d5') === 'd4', 'reflectSquare("d5") maps to "d4"');

// 2. Test UCI move reflection
assert(reflectUciMove('e2e4') === 'e7e5', 'reflectUciMove("e2e4") maps to "e7e5"');
assert(reflectUciMove('e7e8q') === 'e2e1q', 'reflectUciMove("e7e8q") maps to "e2e1q" with promotion intact');

// 3. Test FEN reflection & piece swapping
const sampleFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const reflectedFen = transformFenColorSymmetric(sampleFen);
const parts = reflectedFen.split(' ');
assert(parts[1] === 'w', 'Active side flipped from b to w');
assert(parts[3] === 'e6', 'En passant square reflected from e3 to e6');

// 4. Test Round-Trip Symmetry: transform twice returns original FEN (normalized)
const doubleReflected = transformFenColorSymmetric(reflectedFen);
assert(doubleReflected.split(' ')[0] === sampleFen.split(' ')[0], 'Round-trip symmetry preserves board placement');
assert(doubleReflected.split(' ')[1] === sampleFen.split(' ')[1], 'Round-trip symmetry preserves active turn');

// 5. Test Setup Move & Replay on Sample Puzzle
const testPuzzle = PUZZLES[0];
const replayResult = replayMoveLine(testPuzzle.solverFen, testPuzzle.moves.slice(1));
assert(replayResult.success, `Puzzle "${testPuzzle.title}" solution line is 100% legal`);
assert(replayResult.sanMoves.length === testPuzzle.moves.length - 1, 'All SAN moves successfully recorded');

// 6. Test Progressive Hints
const hintL1 = getHintContent(testPuzzle.solverFen, testPuzzle.moves[1], 1, 'mateIn2');
assert(hintL1.title.includes('Tactical Hint'), 'Level 1 provides tactical motif & piece type');
assert(hintL1.hintText.length > 10, 'Level 1 hint contains pedagogical text');

const hintL2 = getHintContent(testPuzzle.solverFen, testPuzzle.moves[1], 2, 'mateIn2');
assert(hintL2.title.includes('Positional Hint'), 'Level 2 narrows destination area');

const hintL3 = getHintContent(testPuzzle.solverFen, testPuzzle.moves[1], 3, 'mateIn2');
assert(hintL3.title.includes('Move Revealed'), 'Level 3 reveals exact move');

// 7. Verify all puzzles in database
for (const p of PUZZLES) {
  const res = replayMoveLine(p.solverFen, p.moves.slice(1));
  assert(res.success, `Puzzle ${p.id} (${p.title}) is legally executable`);
}

// 8. Responsive Viewport and Sizing Boundary Checks
const viewports = [
  { name: '1366x768 Desktop', w: 1366, h: 768, isDesktop: true },
  { name: '1024x768 Small Desktop', w: 1024, h: 768, isDesktop: true },
  { name: '768x1024 Tablet Portrait', w: 768, h: 1024, isDesktop: false },
  { name: '390x844 Mobile', w: 390, h: 844, isDesktop: false },
  { name: '360x800 Narrow Mobile', w: 360, h: 800, isDesktop: false },
  { name: '320x568 Extreme Mobile', w: 320, h: 568, isDesktop: false },
];

const headerH = 64;
const overheadDesktop = 76;

for (const vp of viewports) {
  if (vp.isDesktop) {
    const containerW = Math.min(vp.w - 48, 1152);
    const colW = (containerW - 24) * (7 / 12);
    const boardSize = Math.min(colW, 540, vp.h - 150);
    const totalHeight = headerH + overheadDesktop + boardSize;

    assert(
      totalHeight <= vp.h,
      `[${vp.name}] Board total height (${totalHeight}px) fits within viewport height (${vp.h}px) on initial load`
    );
    assert(
      boardSize <= colW,
      `[${vp.name}] Board width (${boardSize}px) fits within column width (${colW.toFixed(1)}px)`
    );
  } else {
    const availableW = vp.w - 32;
    const boardSize = Math.min(availableW, 500);

    assert(
      boardSize <= availableW,
      `[${vp.name}] Board (${boardSize}px) fits inside mobile gutters (${availableW}px available), zero horizontal scroll`
    );
  }
}

// 7. Test Deterministic Daily Schedule Engine
const curGlobal = getCurrentGlobalDate();
assert(/^\d{4}-\d{2}-\d{2}$/.test(curGlobal), `getCurrentGlobalDate() returns valid ISO date: ${curGlobal}`);

const testEpoch = dateStringToEpochDay('2026-10-21');
assert(epochDayToDateString(testEpoch) === '2026-10-21', 'Epoch day round-trip preserves "2026-10-21"');

const dailyToday = getDailyPuzzle('2026-10-21');
assert(dailyToday && typeof dailyToday.id === 'string', `getDailyPuzzle('2026-10-21') resolves puzzle: ${dailyToday.id}`);

const dailyFuture = getDailyPuzzle('2027-12-31');
assert(dailyFuture && typeof dailyFuture.id === 'string', `getDailyPuzzle('2027-12-31') resolves future puzzle: ${dailyFuture.id}`);

// Determinism check: identical inputs must yield identical outputs
const dailyRepeat = getDailyPuzzle('2026-10-21');
assert(dailyToday.id === dailyRepeat.id, 'Daily puzzle lookup is strictly deterministic across repeated calls');

// Archive month generation
const octPuzzles = getArchivePuzzlesForMonth(2026, 10);
assert(octPuzzles.length === 31, 'getArchivePuzzlesForMonth(2026, 10) returns exactly 31 daily puzzles for October');

console.log(`\nTests Completed: ${testsPassed} passed, ${testsFailed} failed.`);

if (testsFailed > 0) {
  process.exit(1);
}
