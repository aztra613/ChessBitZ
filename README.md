# PlyQuest

> Premium, responsive, static-first chess tactics puzzle and printable worksheet training platform.

PlyQuest is a free, no-login, no-subscription chess training product designed to deliver high-quality short-form chess tactics, progressive hints, daily challenges, and printable PDF worksheets.

---

## Key Features & PRD v2.2 Architecture

1. **Static-First & Zero-Backend**:
   - Zero runtime database, server-side puzzle APIs, engine processes, user logins, or Gemini API keys.
   - Operates 100% offline in browser after initial bundle load.
   - Verified Lichess CC0 dataset with legal move replay and mathematical color-symmetric rank reflection.

2. **Design System & Tokens (`src/styles/tokens.css`)**:
   - **Primary Identity**: Midnight Indigo (`#171B34`, `#252B52`, `#4658C9`) + Warm Ivory (`#F3E8D2`) + Blue-Gray (`#657D9B`).
   - **Four Selectable Board Themes**:
     - *Ocean Slate* (Default): Warm ivory & blue-gray squares.
     - *Classic Tournament*: Buff & tournament green squares.
     - *Rosewood*: Warm blush & muted rosewood squares.
     - *High Contrast*: Pure white & deep slate squares.
   - Indigo brand styling is preserved regardless of chosen board theme.

3. **Staunton SVG Pieces**:
   - 12 custom vector Staunton piece assets in `src/components/pieces/ChessPieces.tsx`.
   - White pieces: `#FFFFFF` fill with `#252B52` outline.
   - Black pieces: `#252B52` fill with `#FFFFFF` outline.
   - Deterministic vector rendering with 0 external network requests.
   - Documented in `src/components/pieces/PIECE_MANIFEST.md`.

4. **Solving Experience**:
   - Tap/click and drag-and-drop input with keyboard navigation alternative.
   - Progressive 3-tier hints:
     - Tier 1: Tactical idea / motif & piece type.
     - Tier 2: Destination square zone / quadrant.
     - Tier 3: Full move revealed.
   - Non-color-only move feedback, checkmate detection, solution playback (Play, Pause, Step Back, Step Forward).
   - Spoiler-free URL sharing.

5. **In-Browser Worksheet Studio (PDF)**:
   - High-resolution PDF generation via `jsPDF`.
   - Layouts: 1, 2, 4, or 6 puzzles per page; A4 or US Letter.
   - Question-only mode, answers-at-end mode, or separate answer-key PDF.
   - Zero classroom roster collection: optional Name/Date lines are printed blank for handwriting.

6. **Advertising & Privacy Isolation**:
   - Isolated, disabled-by-default `AdSlot` component.
   - No advertising overlays on board controls, and no trackers loaded in default build.
   - Persistent Cookie & Local Storage manager with one-click data clear and export.

---

## Development & Build Commands

```bash
# Install dependencies
npm install

# Run dev server on port 3000
npm run dev

# Run unit tests (rules replay, hint levels, rank reflection)
npm test

# Build static production bundle
npm run build
```

---

## Documentation Files
- `STATIC_EXPORT.md`: Static build, output directory, and hosting direct-route guide.
- `THIRD_PARTY_NOTICES.md`: Complete Software Bill of Materials (SBOM) and open-source licenses.
- `src/components/pieces/PIECE_MANIFEST.md`: Piece asset provenance and design specifications.
