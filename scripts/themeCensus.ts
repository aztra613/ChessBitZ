/**
 * One-off census: how many puzzles carry each Lichess theme, overall and after
 * the ingester's popularity/plays filter.
 *
 * Usage: npx tsx scripts/themeCensus.ts <path-to.csv.zst>
 */

import * as fs from 'fs';
import { Readable } from 'stream';
import { Decompress } from 'fzstd';
import { parse } from 'csv-parse';

const source = process.argv[2] || 'lichess_db_puzzle.csv.zst';

const overall = new Map<string, number>();
const filtered = new Map<string, number>();
const byBand = new Map<string, Map<string, number>>();

let rows = 0;
let kept = 0;

function band(rating: number): string {
  if (rating < 1200) return 'beginner';
  if (rating < 1700) return 'intermediate';
  if (rating < 2200) return 'advanced';
  return 'master';
}

const compressed = fs.createReadStream(source);
const decompressed = Readable.from(
  (async function* () {
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
  rows += 1;
  const themes = (record.Themes || '').split(' ').filter(Boolean);
  for (const theme of themes) overall.set(theme, (overall.get(theme) || 0) + 1);

  const popularity = parseFloat(record.Popularity);
  const plays = parseFloat(record.NbPlays);
  if (!(popularity >= 80 && plays >= 100)) continue;

  kept += 1;
  const b = band(parseFloat(record.Rating));
  for (const theme of themes) {
    filtered.set(theme, (filtered.get(theme) || 0) + 1);
    if (!byBand.has(theme)) byBand.set(theme, new Map());
    const m = byBand.get(theme)!;
    m.set(b, (m.get(b) || 0) + 1);
  }
}

console.log(`rows read              : ${rows.toLocaleString()}`);
console.log(`rows passing filters   : ${kept.toLocaleString()}  (Popularity>=80, NbPlays>=100)`);
console.log(`distinct themes overall: ${overall.size}\n`);

const sorted = [...filtered.entries()].sort((a, b) => b[1] - a[1]);
console.log('theme'.padEnd(24), 'eligible'.padStart(10), ' begin  interm    adv  master');
console.log('-'.repeat(66));
for (const [theme, count] of sorted) {
  const m = byBand.get(theme)!;
  const cell = (k: string) => String(m.get(k) || 0).padStart(7);
  console.log(
    theme.padEnd(24),
    String(count).padStart(10),
    cell('beginner'),
    cell('intermediate'),
    cell('advanced'),
    cell('master')
  );
}

const missing = [...overall.entries()]
  .filter(([t]) => !filtered.has(t))
  .sort((a, b) => b[1] - a[1]);
if (missing.length) {
  console.log('\nthemes with no eligible puzzles:');
  for (const [t, c] of missing) console.log(`  ${t.padEnd(24)} ${c}`);
}
