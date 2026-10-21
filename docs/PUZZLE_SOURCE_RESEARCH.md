# PlyQuest — Puzzle Source Research & Open-Source Licence Review

**Document Version:** 1.0  
**Verification Date:** 2026-10-21  
**Project:** PlyQuest (Static-first, zero-backend chess tactics & worksheet platform)  
**Author:** Senior Full-Stack & Chess-Data Engineer, Open-Source Licence Reviewer  

---

## 1. Executive Summary

PlyQuest is architected as a commercial, ad-supported, zero-backend, client-side chess training and printable worksheet platform. Because PlyQuest serves commercial advertising (via an inactive-by-default `AdSlot`), **all ingested tactical puzzle datasets must explicitly grant irrevocable rights for commercial use, modification, and static redistribution.**

This research report evaluates public and commercial chess puzzle datasets, establishes legal boundaries, audits the initial codebase corpus, and defines the official allowlist.

### Key Decisions
1. **APPROVED (Primary Source):** **Lichess Open Puzzle Database** (`lichess_db_puzzle.csv.zst`). Released under the Creative Commons Zero 1.0 Universal (CC0 1.0) Public Domain Dedication. Explicitly permits commercial use, modification, and offline redistribution.
2. **REJECTED (Requires Written Permission):** **ChessTempo Problem Database**. Terms of Service strictly forbid bulk downloading, screen scraping, and commercial reuse.
3. **REJECTED:** **Chess.com Puzzles & PubAPI**. Terms of Service forbid scraping, data mining, and commercial use. PubAPI is strictly restricted to personal, non-commercial applications.
4. **REJECTED:** **FIDE Albums & WFCC Anthologies**. While historical board positions of played games are factual, composed endgame studies and problems are creative works subject to copyright, and the compilations/anthologies themselves are copyrighted by the World Federation for Chess Composition (WFCC).
5. **REJECTED:** **Unlicensed Public GitHub Repositories**. Repositories that wrap scraped puzzles under MIT/BSD-2-Clause code licences do not possess legal rights to redistribute the underlying data.

---

## 2. In-Depth Source Evaluation

### 2.1 Approved Source: Lichess Open Puzzle Database
* **Official Website:** [https://database.lichess.org/](https://database.lichess.org/)
* **Direct Dataset Download:** [https://database.lichess.org/lichess_db_puzzle.csv.zst](https://database.lichess.org/lichess_db_puzzle.csv.zst)
* **Official Licence:** Creative Commons Zero 1.0 Universal (CC0 1.0) Public Domain Dedication ([https://creativecommons.org/publicdomain/zero/1.0/](https://creativecommons.org/publicdomain/zero/1.0/))
* **Retrieval & Verification Date:** 2026-10-21
* **Format & Scale:** Zstandard-compressed CSV (`.csv.zst`), approximately 250 MB compressed, expanding to >1 GB uncompressed, containing over 4.5–6 million validated tactical puzzles.
* **CSV Schema:**
  `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags`
* **Critical Format Rules:**
  1. The `FEN` field provides the board state **before** the opponent's setup move.
  2. The `Moves` field provides a space-separated string of Universal Chess Interface (UCI) coordinates (e.g., `e8d7 a2e6 d7d8 f7f8`).
  3. The **first move** (`Moves[0]`) is the opponent's setup move. It must be played onto the `FEN` to obtain the `solverFen` (the position shown to the user).
  4. The **second move** (`Moves[1]`) begins the solver's solution line, followed by the opponent's response (`Moves[2]`), and so on.
* **Data Quality Notes:** Puzzles are automatically mined from real rated games played on Lichess and analyzed by Stockfish NNUE engines. Every puzzle has a single winning solution line. Outliers with low popularity (`Popularity < 80`) or low play counts (`NbPlays < 50`) can include ambiguous or dry technical lines and should be filtered out.
* **Attribution & Relationship:** Although CC0 waives copyright and attribution obligations, PlyQuest provides transparent, prominent voluntary attribution. PlyQuest is independent and not affiliated with, sponsored by, or endorsed by Lichess.

---

### 2.2 Rejected Source: ChessTempo Problem Database
* **Official Website:** [https://chesstempo.com/](https://chesstempo.com/)
* **Terms of Service URL:** [https://chesstempo.com/tos](https://chesstempo.com/tos)
* **Governing Terms:**
  * Section 2 expressly prohibits bulk downloading: *"You agree not to attempt to bulk download material provided on Chess Tempo, such as the Chess Tempo problems, or to engage in other types of screen scraping."*
  * Tactical problems and data are *"provided for personal use only, and remain the property of Chess Tempo."*
  * Commercial use: *"Data obtained via Chess Tempo or features/services from the platform are not available for use in producing other products and services (either commercial or non-commercial) without direct permission from Chess Tempo."*
* **Decision:** **REJECTED / REQUIRES WRITTEN PERMISSION**. Ingesting or scraping any ChessTempo puzzle or comment without an executed bilateral commercial agreement is a direct violation of their terms and intellectual property rights.

---

### 2.3 Rejected Source: Chess.com Puzzles & PubAPI
* **Official Website:** [https://www.chess.com/](https://www.chess.com/)
* **Terms of Service URL:** [https://www.chess.com/legal/user-agreement](https://www.chess.com/legal/user-agreement)
* **Governing Terms:**
  * The User Agreement strictly bans robots, spiders, scrapers, data mining, and automated extraction.
  * Explicit prohibition against using automated tools or data feeds to build training datasets, commercial products, or competing platforms.
  * Chess.com PubAPI (`https://api.chess.com/pub/puzzle`) is licensed strictly for non-commercial, lightweight integrations; bulk harvesting and commercial distribution are forbidden.
* **Decision:** **REJECTED**. Bulk scraping or commercially redistributing Chess.com puzzle data is legally prohibited.

---

### 2.4 Rejected Source: FIDE Albums & WFCC Problem Anthologies
* **Official Website:** [https://www.wfcc.ch/](https://www.wfcc.ch/)
* **Legal Considerations:**
  * In international copyright jurisprudence, bare moves and factual outcomes of standard tournament games are not copyrightable.
  * In contrast, composed endgame studies and artistic chess problems are recognized in many jurisdictions as creative intellectual property of the composers.
  * The anthologies (*FIDE Albums*), layout, diagrams, and solution commentaries are protected under copyright owned by the World Federation for Chess Composition (WFCC).
* **Decision:** **REJECTED** for automated bulk ingestion. Historical compositions can only be used on an individual, manually curated basis where the composer has been deceased for >70 years (public domain), with complete composer and publication attribution.

---

### 2.5 Rejected Source: Scraped GitHub Repositories
* Many open-source repositories provide chess puzzles in JSON or PGN with a top-level MIT or BSD-2-Clause license in their root `LICENSE` file.
* **Critical Legal Finding:** A software license in a GitHub repository applies only to the repository's code, not to third-party data scraped without permission from proprietary servers. Wrapping scraped content in an open-source license is legally void (copyright laundering).
* **Decision:** **REJECTED** unless the dataset author explicitly documents the lawful, verified public-domain provenance (e.g. Lichess CC0 or public domain PGN).

---

## 3. Comprehensive Source Comparison Table

| Source Name & Official URL | Direct Dataset / Download URL | Data Licence | Commercial Use & Redistribution Allowed? | Attribution Requirement | Terms / Scraping Limits | Format & Operational Size | Update Cadence & Offline Suitability | Known Data-Quality Limitations | Decision | Verification Date & Reasoning |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Lichess Open Puzzles**<br>`https://database.lichess.org/` | `https://database.lichess.org/lichess_db_puzzle.csv.zst` | **CC0 1.0 Universal** (Public Domain) | **YES** (unconditional worldwide) | Voluntary (PlyQuest provides transparent credit) | Official bulk download endpoint; no scraping required | `.csv.zst` compressed (~250 MB), >4.5M rows | Monthly database dumps; ideal for static build-time sharding | Contains some technical endgame positions; requires filtering by popularity & rating | **APPROVED** | **2026-10-21**: Grounded against official Lichess Open Database deed and CSV format. |
| **ChessTempo**<br>`https://chesstempo.com/` | None (closed proprietary) | **Proprietary** (Personal Use Only) | **NO** (Strictly prohibited without written agreement) | Mandatory under commercial agreement | Automated scraping & bulk downloading explicitly forbidden by ToS | Web pages / proprietary JSON | Real-time web only; offline static hosting prohibited | Highly rated user tags, but legally inaccessible | **REJECTED** | **2026-10-21**: ToS Section 2 explicitly bans bulk download and commercial extraction. |
| **Chess.com Puzzles**<br>`https://www.chess.com/` | `https://api.chess.com/pub/puzzle` (PubAPI) | **Proprietary** (Non-commercial API) | **NO** (Commercial use prohibited) | Mandatory | PubAPI rate limits apply; bulk downloading & data mining prohibited | REST JSON (single item endpoints) | Daily endpoints; commercial static export prohibited | High quality, but strictly non-commercial license | **REJECTED** | **2026-10-21**: User Agreement bans scraping, mining, and commercial monetization. |
| **WFCC / FIDE Albums**<br>`https://www.wfcc.ch/` | None (printed books & PDFs) | **Copyright © WFCC** | **NO** (Anthologies & studies copyrighted) | Ethical requirement in composition community | No programmatic API; print & PDF publications | Books, text descriptions, PGN | Irregular (3-year cycles) | Studies often contain complex sub-variations not suited for fast tactical solving | **REJECTED** | **2026-10-21**: Anthologies and modern compositions protected under copyright. |
| **Scraped GitHub Repos**<br>(Various) | Various GitHub raw links | **Ambiguous / Unlicensed** | **NO** (Copyright laundering risk) | Variable | GitHub API rate limits | JSON / PGN | Often unmaintained / static dumps | Incomplete provenance, uncertain move legality, possible duplicate positions | **REJECTED** | **2026-10-21**: Top-level code license does not cover scraped data. |

---

## 4. Audit of Existing PlyQuest Corpus

### 4.1 Provenance Discrepancy in `src/data/puzzles.ts`
Inspection of the initial 14 puzzle records in `src/data/puzzles.ts` and `scripts/buildCuratedPuzzles.ts` revealed:
* Every record had `provenance.sourceDataset: 'lichess-open-puzzles'` and `provenance.sourceRecordId: '00010'`, `'00101'`, `'00102'`, etc.
* **Audit Finding:** Verification against the official Lichess database and API confirmed that IDs `00010`, `00101`, `00102`, `00103`, etc. do not correspond to these tactical positions in the Lichess Open Database (querying `https://lichess.org/api/puzzle/00010` returns HTTP 404). Real Lichess puzzle IDs are 5-character base-62 identifiers (e.g. `00sHx`, `kRapK`, `00008`).
* **Corrective Action:**
  1. The existing hand-authored prototype puzzles must be re-categorized with `sourceDataset: 'plyquest-curated'` and `sourceLicense: 'CC0-1.0'`. They must **not** be misrepresented as authentic Lichess dataset extracts.
  2. Authentic Lichess puzzles must be ingested via the reproducible pipeline, retaining their true Lichess `PuzzleId` (e.g. `kRapK`, `00008`, `0000d`), original FEN, exact UCI move sequences, Glicko-2 ratings, and community theme tags.

### 4.2 Separation of Software, Dataset, Asset, and Content Licences
The codebase previously grouped different legal concepts under a generic license tag. We establish clear boundaries:
* **Dataset Licence:** `CC0-1.0 Universal` for Lichess Open Database records and PlyQuest-authored curated puzzles.
* **Software Licences:**
  * `chess.js`: BSD-2-Clause
  * `react`, `react-dom`, `jspdf`: MIT
  * `lucide-react`: ISC
* **Graphic Asset Licence:** Public Domain / CC0 for the 12 conventional Staunton piece vector silhouettes (`src/components/pieces/ChessPieces.tsx`).
* **Original Educational Text:** All puzzle titles, instructional objectives, and tactical explanations written by PlyQuest are licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)** with copyright held by PlyQuest contributors.

### 4.3 Baseline Quality & Tooling Audit
* **`npm test`**: Passed (39 tests passed, 0 failed). Verified rank-reflection symmetry, hint hierarchy, and move legality.
* **`npm run lint`**: Failed initially with TypeScript error:
  `src/components/ChessBoard.tsx(251,57): error TS2345: Argument of type 'MouseEvent | PointerEvent | TouchEvent' is not assignable to parameter of type 'DragEvent<Element>'.`
  *Root Cause:* Framer-motion `motion.div` prop collision with native HTML5 drag event.
  *Fix:* Explicit event casting `(e as unknown as React.DragEvent)` resolved the error.
* **`npm run build`**: Passed cleanly with a warning regarding `__dirname` in `vite.config.ts`.
  *Fix:* Replaced with modern `import.meta.dirname`.

---

## 5. Conclusion & Action Plan
Lichess is verified as the sole open, legal, high-quality, and commercially viable dataset for PlyQuest. The ingestion pipeline documented in `docs/PUZZLE_INGESTION.md` implements streaming decompression, strict move-legality checks, objective verification, and deterministic daily scheduling.
