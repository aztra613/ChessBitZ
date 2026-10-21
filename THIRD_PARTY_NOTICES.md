# Third-Party Notices, Dataset Licences & Software Bill of Materials (SBOM)

**Document Version:** 2.0  
**Last Updated:** 2026-10-21  
**Project:** Chessbitz  

---

## 1. Tactical Puzzle Datasets & Provenance

Chessbitz strictly separates dataset licences from software and asset licences. All tactical puzzle data redistributed in the production static bundle is dedicated under the Creative Commons Zero 1.0 Universal (CC0 1.0) Public Domain Dedication.

### 1.1 Lichess Open Puzzle Database
* **Dataset Name:** Lichess Open Puzzle Database (`lichess_db_puzzle.csv.zst`)
* **Publisher:** Lichess.org
* **Official Website:** [https://database.lichess.org/](https://database.lichess.org/)
* **Licence:** Creative Commons Zero 1.0 Universal (CC0 1.0)
* **Licence URL:** [https://creativecommons.org/publicdomain/zero/1.0/](https://creativecommons.org/publicdomain/zero/1.0/)
* **Attribution & Relationship Disclosure:**
  Chessbitz is an independent project and is **not** affiliated with, maintained by, or endorsed by Lichess.org. Attribution is provided voluntarily in good faith.
* **Transformations & Processing:**
  * Raw source FEN represents the board position before the opponent's setup move.
  * Ingestion pipeline executes the opponent setup move (`moves[0]`) via `chess.js` to derive the solver presentation state (`solverFen`).
  * All subsequent solver and opponent plies are 100% verified for legal execution and checkmate agreement.

### 1.2 Chessbitz-Curated Tactical Positions
* **Origin:** Pedagogical sample and demonstrative positions authored by Chessbitz contributors.
* **Licence:** Creative Commons Zero 1.0 Universal (CC0 1.0) Public Domain Dedication.
* **Distinction:** Marked explicitly as `sourceDataset: 'chessbitz-curated'` to prevent false attribution to Lichess.

### 1.3 Chessbitz Color-Symmetric Rank-Reflected Variants
* **Origin:** Derived from validated CC0 records via mathematical rank reflection (Section 8.4).
* **Licence:** Creative Commons Zero 1.0 Universal (CC0 1.0).
* **Policy:** Rank reflection is strictly an educational tool to test pattern recognition from both board orientations. It is **never** utilized as a workaround to evade copyright obligations. All variants cite `transformedFrom` source record IDs.

---

## 2. Graphic & Visual Assets

### Conventional Staunton Vector Silhouettes
* **Asset:** 12 Staunton Vector Piece Silhouettes (King, Queen, Rook, Bishop, Knight, Pawn in White and Black)
* **Source Location:** `src/components/pieces/ChessPieces.tsx`
* **Licence:** Public Domain / CC0
* **Modifications:** Fills and stroke weights tailored strictly to the Chessbitz brand palette (`#FFFFFF` fills, `#252B52` outlines for White; `#252B52` fills, `#FFFFFF` outlines for Black). Rendered purely as inline SVGs with zero external CDN calls.

---

## 3. Original Educational Commentary & Instructional Content
* **Asset:** Puzzle titles, strategic objectives, and pedagogical explanations.
* **Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0).
* **Copyright:** © 2026 Chessbitz Contributors.
* **Usage:** Free to share and adapt with appropriate attribution to Chessbitz.

---

## 4. Production Software Dependencies (SBOM)

| Dependency | Version | Licence | Copyright / Source |
| :--- | :--- | :--- | :--- |
| **chess.js** | `^1.4.0` | **BSD-2-Clause** | © 2023 Jeff Hlywa (`https://github.com/jhlywa/chess.js`) |
| **jspdf** | `^4.2.1` | **MIT** | © 2010–2021 James Hall (`https://github.com/parallax/jsPDF`) |
| **lucide-react** | `^0.546.0` | **ISC** | © 2022 Lucide Contributors (`https://github.com/lucide-icons/lucide`) |
| **react** | `^19.0.1` | **MIT** | © Meta Platforms, Inc. (`https://github.com/facebook/react`) |
| **react-dom** | `^19.0.1` | **MIT** | © Meta Platforms, Inc. (`https://github.com/facebook/react`) |
| **framer-motion / motion** | `^14.4.0` / `^12.23.24` | **MIT** | © Motion Software Ltd (`https://github.com/motiondivision/motion`) |
| **vite** | `^8.3.0` | **MIT** | © 2019-present Yuxi (Evan) You (`https://github.com/vitejs/vite`) |
| **tailwindcss** | `^4.3.3` | **MIT** | © Tailwind Labs Inc. (`https://github.com/tailwindlabs/tailwindcss`) |

---

## 5. Dataset Allowlist & Prohibited Sources Policy

Chessbitz enforces a zero-tolerance policy against unlicensed, scraped, or copyright-infringing puzzle material:
* **Allowed Sources:** Datasets with an explicit, verifiable, permissive data license authorizing commercial redistribution and modification (e.g. CC0-1.0).
* **Prohibited Sources (Excluded from Chessbitz):**
  * **ChessTempo:** Bulk downloading and commercial use prohibited by ToS Section 2 (`https://chesstempo.com/tos`).
  * **Chess.com:** Automated scraping and commercial exploitation prohibited by User Agreement (`https://www.chess.com/legal/user-agreement`).
  * **WFCC / FIDE Albums:** Composed endgame studies and editorial anthologies protected by copyright.
  * **Unverified GitHub Repositories:** Code licenses (e.g. MIT/BSD) do not grant redistribution rights for third-party scraped data.
