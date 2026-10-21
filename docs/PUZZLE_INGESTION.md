# Chessbitz — Puzzle Ingestion Pipeline, Data Validation & SSG Architecture

**Document Version:** 1.0  
**Last Updated:** 2026-10-21  
**Target:** Static-first, zero-runtime-backend deployment  

---

## 1. Overview & Architectural Principles

Chessbitz operates under a strict **zero-runtime-backend, static-first constraint**:
* **No Runtime Database or Puzzle API:** The client application does not query a backend server, database, or external chess API to fetch puzzles.
* **No Raw Dataset in Production Bundle:** The full multi-million-row Lichess dataset (`lichess_db_puzzle.csv.zst`) must never be bundled into the production static assets.
* **Curated Static Sharding:** Build-time scripts ingest, filter, validate, and emit curated static JSON files with predictable IDs, split by themes and difficulty bands.
* **100% Client-Side Engine Replay:** All move validation, progressive hints, spaced repetition, and PDF generation execute purely in the user's browser using `chess.js` and `jsPDF`.

---

## 2. Dataset Licences vs. Software Licences

To avoid copyright confusion and maintain compliance with open-source and open-data standards, Chessbitz models licences into four independent categories:

```
+-----------------------------------------------------------------------------------+
|                                 CHESSBITZ APPLICATION                             |
+-------------------------+-------------------------+-------------------------------+
| 1. DATASET LICENCE      | 2. SOFTWARE LICENCE     | 3. ASSET & CONTENT LICENCE    |
| - Lichess Open Puzzles: | - chess.js: BSD-2-Clause| - Staunton Pieces: Public     |
|   CC0-1.0 Universal     | - React & DOM: MIT      |   Domain / CC0 Silhouettes    |
| - Chessbitz Curated:    | - jsPDF: MIT            | - Pedagogical Copy / Text:    |
|   CC0-1.0 Universal     | - lucide-react: ISC     |   CC BY 4.0 (Chessbitz team)  |
+-------------------------+-------------------------+-------------------------------+
```

* **Dataset Licence (`sourceLicense`):** Governs the board states and move coordinates. `CC0-1.0` allows commercial, ad-supported redistribution and educational transformations.
* **Software Licence:** Governs the TypeScript/JavaScript logic. Chessbitz adheres to permissive licences (BSD-2-Clause, MIT, ISC, Apache-2.0) and excludes copyleft dependencies (GPL/AGPL).
* **Asset Licence:** The 12 Staunton vector silhouettes are public domain / CC0 assets embedded as local inline SVGs (zero CDN calls).
* **Original Educational Text:** Titles, strategic objectives, and tactical explanations are generated original content, clearly distinguished from raw dataset facts.

---

## 3. Ingestion & Validation Pipeline Specification

The ingestion pipeline is implemented in `scripts/ingestLichess.ts` and `scripts/buildCuratedPuzzles.ts`.

### 3.1 Streaming & Bounded-Memory Architecture
Processing millions of rows requires streaming decompression or line-by-line reading to prevent memory exhaustion (`ERR_OUT_OF_MEMORY`):
1. **Source Input:** Reads from a local `data/lichess_db_puzzle.csv` or handles streamed buffers via standard Node.js `readline` interfaces.
2. **Batch Processing:** Evaluates records line by line. Discards invalid, low-popularity, or non-target rows immediately before accumulating into memory.
3. **Target Quotas:** Curates a balanced library across all tactical themes (`mateIn1`, `mateIn2`, `mateIn3`, `fork`, `pin`, `skewer`, `discoveredAttack`, `sacrifice`, etc.) and difficulty bands (`beginner`, `intermediate`, `advanced`, `master`).

### 3.2 Strict Move Legality & Objective Verification
Every candidate puzzle must pass five verification gates before acceptance:
1. **FEN Parsing:** `source.initialFen` parses validly into `chess.js` without syntax or piece placement errors.
2. **Opponent Setup Move:** The first move in the line (`Moves[0]`) is legally executable from `initialFen`. The resulting board state is recorded as `solverFen`.
3. **Solver Side to Move:** `solverFen` turn matches the designated tactical side (`'w'` or `'b'`).
4. **Full Line Replay:** Every subsequent move in the solution line (`Moves[1..n]`) replays legally in sequence. Promotion moves (e.g. `e7e8q`) and castling moves are fully supported.
5. **Objective Verification:**
   * If tagged as `mateIn1`, the line must end in checkmate after exactly 1 solver move (plies: setup move + 1 solver move).
   * If tagged as `mateIn2`, the line must end in checkmate after exactly 2 solver moves (plies: setup + solver 1 + opponent 1 + solver 2).
   * If tagged as `mateIn3`, the line must end in checkmate after exactly 3 solver moves.
   * If a candidate tagged as `mateInN` does not end in checkmate, the mate tag is stripped or the puzzle is rejected.
6. **Deduplication:** Puzzles with duplicate initial FENs, duplicate solver positions, or identical move lines are eliminated.

### 3.3 Color-Symmetric Rank-Reflected Variants
Chessbitz includes mathematically sound color-symmetric rank-reflected variants:
* **Purpose:** Educational diversity (training pattern recognition from both White and Black perspectives).
* **Integrity Rule:** Rank reflection is **never** used as a means to circumvent copyright. All variants are clearly attributed with `sourceDataset: 'chessbitz-transformed-variant'` and `transformedFrom: [sourceRecordId]`.
* **Validation:** Both the reflected FEN and reflected move sequence must independently pass 100% legal replay in `chess.js`. Variants failing any move legality check are discarded.

---

## 4. Retraction, Denylist & Source Manifest System

### 4.1 Retraction Denylist (`scripts/puzzles-denylist.json`)
If a puzzle is reported as unsound, dual-solution, offensive in source game comments, or disputed, it is added to `scripts/puzzles-denylist.json`:
```json
{
  "retractedPuzzleIds": [
    "cb-corrupt-example"
  ],
  "retractionReasons": {
    "cb-corrupt-example": "Alternative refutation found on ply 2."
  }
}
```
During build-time, any puzzle listed in the denylist is automatically excluded from the output corpus without touching UI code.

### 4.2 Source Refresh Manifest (`src/data/source-manifest.json`)
Every build outputs a cryptographic and metadata manifest tracking the data lineage:
* Ingestion timestamp (`generatedAt`)
* Pipeline validator version (`validatorVersion`)
* Total raw records evaluated
* Total accepted records
* Total rejected / filtered records (breakdown by invalid move, low popularity, mate mismatch, etc.)
* Active source dataset licences

---

## 5. Deterministic Daily Puzzle Schedule

### 5.1 The Problem with Hardcoded Dates
The initial codebase contained a hardcoded check in `src/App.tsx`:
```typescript
const dailyPuzzle = PUZZLES.find((p) => p.dateAssigned === '2026-10-20') || PUZZLES[0];
```
This broke after 2026-10-20, returning the same fallback puzzle indefinitely and requiring manual GitHub Action commits every morning.

### 5.2 Deterministic Date-to-Puzzle Mapping
Chessbitz implements a deterministic mathematical schedule (`src/utils/dailySchedule.ts`):
1. **Documented Timezone:** The global daily reset occurs at **00:00 Asia/Kolkata (UTC+05:30)**.
2. **Epoch Day Calculation:** Any date `YYYY-MM-DD` is converted to days since epoch.
3. **Deterministic Permutation:** A seeded pseudorandom permutation of the daily-eligible puzzle corpus ensures:
   * Every day receives a unique puzzle.
   * No repeats occur within a 365-day rolling window.
   * Past days are permanently reproducible for the puzzle archive (`/archive/[year]/[month]`).
   * Future days are fully deterministic without requiring daily network calls or GitHub Actions.

---

## 6. SSG vs. SPA Static Hosting Audit & Prerender Architecture

### 6.1 True SSG vs. Client-Rendered SPA
* **Current State:** The project is a client-rendered React Single Page Application (SPA) bundled with Vite. Static hosts (Cloudflare Pages, Netlify, GitHub Pages) serve `index.html` as the 200/404 fallback for all deep URLs (e.g. `/puzzle/kRapK`, `/daily`, `/mate-in-1`).
* **SEO Limitation:** While directly accessible in browsers with JavaScript enabled, web crawlers that do not execute JavaScript receive a generic `index.html` shell with the homepage `<title>` and `<meta name="description">`.
* **Prerender Solution:** Rather than migrating the entire application to an external framework like Astro or Next.js (which would introduce unnecessary build complexity and risk regressions), Chessbitz includes a lightweight **Build-Time Prerender Script** (`scripts/prerender.ts`):
  1. Executes after `vite build`.
  2. Injects route-specific `<title>`, spoiler-free meta descriptions, canonical URLs, and OpenGraph metadata into dedicated HTML files (`dist/daily/index.html`, `dist/mate-in-1/index.html`, etc.).
  3. Generates a valid `sitemap.xml` listing all indexable static routes.

---

## 7. Operational Workflow & CI Refresh

### Running the Pipeline Locally
```bash
# 1. Ingest, validate, and build the curated puzzle corpus
npm run build:puzzles

# 2. Run verification test suite on all puzzles
npm test

# 3. Build production bundle and prerender static routes
npm run build
```

### GitHub Actions Refresh Workflow (`.github/workflows/puzzle-refresh.yml`)
An optional scheduled workflow runs on the 1st of every month to:
1. Check for updated Lichess Open Database releases.
2. Run ingestion, validation, and deduplication.
3. Verify all puzzles against `scripts/verifyPuzzles.ts`.
4. Commit updated curated shards and manifests.
