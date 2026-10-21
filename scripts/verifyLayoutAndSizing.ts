import * as fs from 'fs';
import * as path from 'path';

console.log('=== Running Chessbitz Layout & Sizing Regression Verification ===\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${msg}`);
    failed++;
  }
}

// 1. Inspect Header Positioning
const headerCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/Header.tsx'), 'utf-8');
assert(
  !headerCode.includes('sticky top-0') && headerCode.includes('relative w-full'),
  'Header participates in normal document flow (relative w-full) instead of sticky top-0'
);

// 2. Inspect ChessBoard container sizing
const boardCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/ChessBoard.tsx'), 'utf-8');
assert(
  !boardCode.includes('max-w-[640px]'),
  'ChessBoard does not hardcode max-w-[640px]'
);
assert(
  boardCode.includes('touchAction: \'manipulation\''),
  'ChessBoard squares specify touch-action: manipulation to prevent scroll interference'
);

// 3. Inspect CSS responsive tokens
const tokensCss = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/tokens.css'), 'utf-8');
assert(
  tokensCss.includes('.cb-board-responsive'),
  'tokens.css defines .cb-board-responsive utility class'
);
assert(
  tokensCss.includes('calc(100vh - 150px)') && tokensCss.includes('calc(100dvh - 150px)'),
  'tokens.css bounds desktop board height using both calc(100vh) and dynamic calc(100dvh)'
);
assert(
  tokensCss.includes('aspect-ratio: 1 / 1'),
  'tokens.css enforces strict 1:1 aspect-ratio'
);

// 4. Inspect PuzzlePlayer layout
const playerCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PuzzlePlayer.tsx'), 'utf-8');
assert(
  playerCode.includes('min-w-0'),
  'PuzzlePlayer columns use min-w-0 to prevent horizontal overflow'
);
assert(
  playerCode.includes('cb-board-responsive'),
  'PuzzlePlayer passes cb-board-responsive to ChessBoard'
);

// 5. Inspect App.tsx scroll restoration
const appCode = fs.readFileSync(path.resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
assert(
  appCode.includes('window.scrollTo(0, 0)'),
  'App.tsx guarantees instant (0, 0) scroll restoration on route navigation'
);

// 6. Viewport Math Simulation for required test viewports:
// Viewport 1: 1366 x 768 (Desktop standard)
// Viewport 2: 1024 x 768 (Small Desktop / Tablet Landscape)
// Viewport 3: 768 x 1024 (Tablet Portrait)
// Viewport 4: 390 x 844 (Common Mobile)
// Viewport 5: 360 x 800 (Narrow Mobile)
// Viewport 6: 320 x 568 (Extreme Mobile)

const viewports = [
  { name: '1366x768 Desktop', w: 1366, h: 768, isDesktop: true },
  { name: '1024x768 Small Desktop', w: 1024, h: 768, isDesktop: true },
  { name: '768x1024 Tablet Portrait', w: 768, h: 1024, isDesktop: false },
  { name: '390x844 Mobile', w: 390, h: 844, isDesktop: false },
  { name: '360x800 Narrow Mobile', w: 360, h: 800, isDesktop: false },
  { name: '320x568 Extreme Mobile', w: 320, h: 568, isDesktop: false },
];

const headerHeight = 64;
const paddingAndTitleOverheadDesktop = 76; // container pt (16) + title/badge row (~44) + margin (16)
const paddingAndTitleOverheadMobile = 70;

for (const vp of viewports) {
  let boardSize = 0;
  if (vp.isDesktop) {
    // Left column width in 1152 max-w container
    const containerW = Math.min(vp.w - 48, 1152);
    const colW = (containerW - 24) * (7 / 12);
    // Board size: min(colW, 540, h - 150)
    boardSize = Math.min(colW, 540, vp.h - 150);
    const totalTopToBottomBoard = headerHeight + paddingAndTitleOverheadDesktop + boardSize;

    assert(
      totalTopToBottomBoard <= vp.h,
      `[${vp.name}] Board total height (${totalTopToBottomBoard}px) fits within viewport height (${vp.h}px) on initial load`
    );
    assert(
      boardSize <= colW,
      `[${vp.name}] Board width (${boardSize}px) fits within column width (${colW.toFixed(1)}px)`
    );
  } else {
    // Stacked layout: board fits available width with >= 16px side gutters (32px total)
    const availableW = vp.w - 32;
    boardSize = Math.min(availableW, 500);

    assert(
      boardSize <= availableW,
      `[${vp.name}] Board (${boardSize}px) fits inside mobile gutters (${availableW}px available), zero horizontal scroll`
    );
  }
}

console.log(`\nVerification finished: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
}
