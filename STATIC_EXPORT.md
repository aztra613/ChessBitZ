# PlyQuest - Static Site Generation (SSG) & Static Export Guide

## 1. Overview
PlyQuest is architected as a **static-first, zero-backend** chess tactics and printable worksheet web platform. All move validation, progressive hints, board rendering, local solving progress, and PDF generation execute purely client-side inside the user's browser.

No runtime database, server-side puzzle APIs, authentication services, or Gemini API keys are needed to serve or use PlyQuest.

---

## 2. Static Build Command & Output Directory
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Static Assets**: All bundle chunks, piece vectors, and styling are compiled into `dist/` with immutable content hashes.

To run and verify the build locally using a plain static web server (such as Python's HTTP server or `serve`):
```bash
# 1. Compile the production bundle
npm run build

# 2. Test locally on a zero-backend static server (port 8080)
npx serve dist -p 8080
# Or using python:
# python3 -m http.server 8080 --directory dist
```

---

## 3. Direct Route & Browser Refresh Behaviour (SPA Static Routing)
Static hosting providers such as **Cloudflare Pages**, **GitHub Pages**, **Netlify**, or **Vercel** require fallback routing so direct URLs (e.g. `/puzzle/cb-daily-01`, `/mate-in-2`, `/printable-chess-puzzles`, `/privacy`) resolve directly when opened or refreshed.

### Cloudflare Pages Configuration:
Cloudflare Pages serves `index.html` as the fallback automatically for single-page applications. Alternatively, include a `_routes.json` or `_redirects` file in `public/`:
```text
/*    /index.html   200
```

### GitHub Pages Configuration:
For GitHub Pages, copy `dist/index.html` to `dist/404.html` before publishing, or use a GitHub Actions workflow that deploys the static artifact.

### Next.js Static Export Migration Path:
If migrating to Next.js App Router with `output: "export"`, the routes are precomputed using `generateStaticParams`:
- `/puzzle/[id]/page.tsx` -> calls `generateStaticParams()` returning all IDs from `PUZZLES`.
- `/themes/[theme]/page.tsx` -> precomputes all tactical motifs.
- `/archive/[year]/[month]/page.tsx` -> precomputes historical date paths.

Because our data models, chess validation logic, piece components, and worksheet PDF generators are 100% modular and decoupled from the bundler, components can be transferred directly to Next.js components without rewriting logic.

---

## 4. Verification Checklist
- [x] Zero network requests required to validate moves or solve puzzles after initial page load.
- [x] Client-side PDF generation generates files entirely in memory via jsPDF.
- [x] Tested on plain static server without Express or Node API endpoints.
- [x] All 12 Staunton pieces rendered via deterministic local inline SVGs (0 external CDN requests).
- [x] Ads isolated in inactive placeholders (`AdSlot`); blocking all network requests does not break solving, hints, or worksheets.
