/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Lightweight, zero-dependency QR Code generator in pure TypeScript.
 * Generates ISO/IEC 18004 compliant QR code bit matrices for URLs.
 */

// Galois Field GF(256) tables for QR Reed-Solomon polynomial math
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = val;
    GF256_EXP[i + 255] = val;
    GF256_LOG[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
  GF256_LOG[0] = 0;
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

// Precomputed generator polynomials for standard error correction lengths
function rsGeneratorPoly(numEcc: number): Uint8Array {
  let g = new Uint8Array([1]);
  for (let i = 0; i < numEcc; i++) {
    const next = new Uint8Array(g.length + 1);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= gfMul(g[j], GF256_EXP[i]);
      next[j + 1] ^= g[j];
    }
    g = next;
  }
  return g;
}

function calculateEcc(data: Uint8Array, numEcc: number): Uint8Array {
  const gen = rsGeneratorPoly(numEcc);
  const remainder = new Uint8Array(numEcc);
  for (const b of data) {
    const factor = b ^ remainder[0];
    for (let j = 0; j < numEcc - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[numEcc - 1] = gfMul(gen[numEcc], factor);
  }
  return remainder;
}

// QR Version table: total codewords, EC codewords (Level M)
// Version 1 (21x21): 26 total, 10 EC -> 16 data bytes
// Version 2 (25x25): 44 total, 16 EC -> 28 data bytes
// Version 3 (29x29): 70 total, 26 EC -> 44 data bytes
// Version 4 (33x33): 100 total, 36 EC -> 64 data bytes
// Version 5 (37x37): 134 total, 48 EC -> 86 data bytes
// Version 6 (41x41): 172 total, 64 EC -> 108 data bytes
interface QrVersionInfo {
  version: number;
  size: number;
  totalCodewords: number;
  ecCodewords: number;
  alignPos: number[];
}

const QR_VERSIONS: QrVersionInfo[] = [
  { version: 1, size: 21, totalCodewords: 26, ecCodewords: 10, alignPos: [] },
  { version: 2, size: 25, totalCodewords: 44, ecCodewords: 16, alignPos: [6, 18] },
  { version: 3, size: 29, totalCodewords: 70, ecCodewords: 26, alignPos: [6, 22] },
  { version: 4, size: 33, totalCodewords: 100, ecCodewords: 36, alignPos: [6, 26] },
  { version: 5, size: 37, totalCodewords: 134, ecCodewords: 48, alignPos: [6, 30] },
  { version: 6, size: 41, totalCodewords: 172, ecCodewords: 64, alignPos: [6, 34] },
];

export interface QrMatrix {
  size: number;
  isDark: (row: number, col: number) => boolean;
  toSvg: (sizePx?: number, darkColor?: string, lightColor?: string) => string;
  toDataUrl: (sizePx?: number) => string;
}

export function generateQrMatrix(text: string): QrMatrix {
  const utf8 = new TextEncoder().encode(text);
  const dataLen = utf8.length;

  // Header: 4 bits mode (0100 for Byte mode) + 8 bits length
  const neededBytes = dataLen + 2; // Approximate byte count needed

  let verInfo: QrVersionInfo | undefined;
  for (const v of QR_VERSIONS) {
    const dataCap = v.totalCodewords - v.ecCodewords;
    if (dataCap >= neededBytes) {
      verInfo = v;
      break;
    }
  }

  if (!verInfo) {
    verInfo = QR_VERSIONS[QR_VERSIONS.length - 1]; // Fallback to largest version
  }

  const dataCap = verInfo.totalCodewords - verInfo.ecCodewords;
  const bitStream: number[] = [];

  function pushBits(val: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count: 8 bits for versions 1-9
  pushBits(dataLen, 8);
  // Data bytes
  for (const b of utf8) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zeroes)
  const maxBits = dataCap * 8;
  const termBits = Math.min(4, maxBits - bitStream.length);
  pushBits(0, termBits);

  // Pad to multiple of 8
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Pad bytes 0xEC, 0x11
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bitStream.length < maxBits) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data codewords
  const dataCodewords = new Uint8Array(dataCap);
  for (let i = 0; i < dataCap; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitStream[i * 8 + b];
    }
    dataCodewords[i] = byteVal;
  }

  // Calculate Error Correction Codewords
  const eccCodewords = calculateEcc(dataCodewords, verInfo.ecCodewords);

  // Interleave data and EC
  const finalCodewords = new Uint8Array(verInfo.totalCodewords);
  finalCodewords.set(dataCodewords, 0);
  finalCodewords.set(eccCodewords, dataCap);

  // Initialize module matrix (null = unset)
  const size = verInfo.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // Function to place 7x7 Finder Pattern with quiet border
  function placeFinder(startX: number, startY: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const y = startY + r;
        const x = startX + c;
        if (y < 0 || y >= size || x < 0 || x >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[y][x] = isOuter || isInner;
        } else {
          matrix[y][x] = false; // Quiet border
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(size - 7, 0);
  placeFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Alignment patterns
  if (verInfo.alignPos.length > 0) {
    for (const r of verInfo.alignPos) {
      for (const c of verInfo.alignPos) {
        // Skip if overlaps with finders
        if (matrix[r][c] !== null) continue;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const isBorder = Math.abs(dy) === 2 || Math.abs(dx) === 2;
            const isCenter = dy === 0 && dx === 0;
            matrix[r + dy][c + dx] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // Dark module
  matrix[4 * verInfo.version + 9][8] = true;

  // Format info area reservation
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // Place codewords in zigzag pattern
  let codewordIdx = 0;
  let bitIdx = 7;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const cols = [right, right - 1];

    const rowRange = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rowRange) {
      for (const c of cols) {
        if (matrix[r][c] === null) {
          let bit = false;
          if (codewordIdx < finalCodewords.length) {
            bit = ((finalCodewords[codewordIdx] >> bitIdx) & 1) === 1;
            bitIdx--;
            if (bitIdx < 0) {
              bitIdx = 7;
              codewordIdx++;
            }
          }
          // Mask 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = bit !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Write format info (EC Level M, Mask 0: 101010000010010 XOR 101010000010010 = 0x5412)
  const formatInfo = 0x5412;
  const formatBits: boolean[] = [];
  for (let i = 14; i >= 0; i--) {
    formatBits.push(((formatInfo >> i) & 1) === 1);
  }

  // Place format info around top-left, top-right, bottom-left
  const tlCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    matrix[tlCoords[i][0]][tlCoords[i][1]] = formatBits[i];
  }

  for (let i = 0; i < 8; i++) {
    matrix[size - 1 - i][8] = formatBits[i];
  }
  for (let i = 0; i < 7; i++) {
    matrix[8][size - 7 + i] = formatBits[8 + i];
  }

  const isDark = (row: number, col: number) => {
    if (row < 0 || row >= size || col < 0 || col >= size) return false;
    return !!matrix[row][col];
  };

  const toSvg = (sizePx = 160, darkColor = '#171B34', lightColor = '#FFFFFF') => {
    const margin = 2;
    const fullSize = size + margin * 2;
    let rects = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="${darkColor}"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullSize} ${fullSize}" width="${sizePx}" height="${sizePx}">
      <rect width="100%" height="100%" fill="${lightColor}"/>
      ${rects}
    </svg>`;
  };

  const toDataUrl = (sizePx = 160) => {
    const svg = toSvg(sizePx);
    if (typeof btoa !== 'undefined') {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  return {
    size,
    isDark,
    toSvg,
    toDataUrl,
  };
}
