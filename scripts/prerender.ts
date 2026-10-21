/**
 * PlyQuest — Build-Time Static Route Prerenderer & Sitemap Generator
 *
 * Implements static HTML generation for Vite SPA routes:
 * 1. Clones dist/index.html shell
 * 2. Injects route-specific, spoiler-safe title, meta description, canonical, and OG tags
 * 3. Injects semantic server HTML inside #root for crawlers and JS-disabled browsers
 * 4. Writes dist/[route]/index.html (e.g. dist/daily/index.html, dist/mate-in-1/index.html)
 * 5. Emits an accurate, dynamically generated sitemap.xml to public/ and dist/
 */

import * as fs from 'fs';
import * as path from 'path';
import { PUZZLES } from '../src/data/puzzles';
import { getDailyPuzzle } from '../src/utils/dailySchedule';

const SITE_URL = 'https://plyquest.pages.dev';
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const BASE_HTML_PATH = path.resolve(DIST_DIR, 'index.html');

interface RouteMeta {
  path: string;
  title: string;
  description: string;
  priority: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  semanticHtml?: string;
}

export function getStaticRoutes(): RouteMeta[] {
  const daily = getDailyPuzzle();

  const coreRoutes: RouteMeta[] = [
    {
      path: '/',
      title: 'PlyQuest — Premium Free Chess Tactics Puzzles & Worksheets',
      description: 'Solve unlimited free chess tactics puzzles and generate customizable printable PDF worksheets. Zero login, zero subscription, client-side solving.',
      priority: '1.0',
      changefreq: 'daily',
      semanticHtml: `
        <header>
          <h1>Train your tactics, one move at a time.</h1>
          <p>Free chess puzzles, helpful hints, and printable worksheets. No account required.</p>
        </header>
      `,
    },
    {
      path: '/daily',
      title: 'Daily Chess Puzzle — PlyQuest',
      description: `Play today's tactical challenge. Rated ${daily.rating} chess tactic. Find the best continuation with zero account required.`,
      priority: '0.9',
      changefreq: 'daily',
      semanticHtml: `
        <article>
          <h1>Daily Chess Puzzle</h1>
          <p>Challenge your tactical calculation with today's featured puzzle. Side to move: ${daily.sideToMove === 'w' ? 'White' : 'Black'}.</p>
          <p>Objective: ${daily.objective}</p>
        </article>
      `,
    },
    {
      path: '/puzzles',
      title: 'Chess Tactics Puzzle Library — PlyQuest',
      description: 'Explore the complete curated tactics corpus filtered by theme, difficulty, and mate length.',
      priority: '0.8',
      changefreq: 'weekly',
      semanticHtml: `
        <section>
          <h1>Chess Tactics Puzzle Catalog</h1>
          <p>Browse beginner to master tactics across forks, pins, skewers, and checkmate combinations.</p>
        </section>
      `,
    },
    {
      path: '/printable-chess-puzzles',
      title: 'Printable Chess Worksheets Studio (PDF) — PlyQuest',
      description: 'Create high-resolution printable chess diagram worksheets for classrooms, coaches, and personal training. Instant client-side PDF export with answer keys.',
      priority: '0.9',
      changefreq: 'weekly',
      semanticHtml: `
        <section>
          <h1>Printable Chess Worksheets Studio</h1>
          <p>Export elegant, print-ready PDF chess puzzle worksheets with customizable grid layouts, titles, and answer sheets.</p>
        </section>
      `,
    },
    {
      path: '/mate-in-1',
      title: 'Mate in 1 Chess Puzzles — PlyQuest',
      description: 'Practice one-move checkmate patterns to build sharp tactical awareness and instant board vision.',
      priority: '0.8',
      changefreq: 'weekly',
      semanticHtml: `
        <section>
          <h1>Mate in 1 Tactical Puzzles</h1>
          <p>Master instant finishing strikes and checkmate patterns for beginner and intermediate players.</p>
        </section>
      `,
    },
    {
      path: '/mate-in-2',
      title: 'Mate in 2 Chess Puzzles — PlyQuest',
      description: 'Solve two-move mating combinations involving deflections, sacrifices, and king hunts.',
      priority: '0.8',
      changefreq: 'weekly',
      semanticHtml: `
        <section>
          <h1>Mate in 2 Tactical Puzzles</h1>
          <p>Calculate two-move forcing lines to break open king shelters and deliver checkmate.</p>
        </section>
      `,
    },
    {
      path: '/mate-in-3',
      title: 'Mate in 3 Chess Puzzles — PlyQuest',
      description: 'Deep tactical calculation puzzles requiring 3-ply combinations and forcing sacrificial lines.',
      priority: '0.8',
      changefreq: 'weekly',
      semanticHtml: `
        <section>
          <h1>Mate in 3 Tactical Puzzles</h1>
          <p>Deep tactical calculation and multi-step mating combinations for advanced solvers.</p>
        </section>
      `,
    },
    {
      path: '/sprint',
      title: 'Sprint Mode — Timed Puzzle Challenge — PlyQuest',
      description: 'Race against the clock with timed chess puzzle sprints. Blitz 5-minute, Quick 10, or Marathon 25 challenge modes.',
      priority: '0.7',
      changefreq: 'monthly',
      semanticHtml: `
        <section>
          <h1>Sprint Mode — Timed Puzzle Challenge</h1>
          <p>Test your speed and accuracy with timed chess puzzle sprints. Three challenge modes available.</p>
        </section>
      `,
    },
    {
      path: '/review',
      title: 'Spaced Repetition Review — PlyQuest',
      description: 'Smart review system that uses spaced repetition to help you master chess puzzles. Tracks progress locally in your browser.',
      priority: '0.7',
      changefreq: 'monthly',
      semanticHtml: `
        <section>
          <h1>Spaced Repetition Review</h1>
          <p>Optimally timed puzzle reviews that focus on positions you struggle with. SM-2 algorithm, fully local.</p>
        </section>
      `,
    },
    {
      path: '/import',
      title: 'Import FEN Position — Private Analysis — PlyQuest',
      description: 'Paste any FEN string to analyse a chess position on an interactive board. Fully private — no data leaves your browser.',
      priority: '0.6',
      changefreq: 'monthly',
      semanticHtml: `
        <section>
          <h1>FEN Position Import & Analysis</h1>
          <p>Analyse any chess position by pasting a FEN string. Interactive board with undo, flip, and move history.</p>
        </section>
      `,
    },
    {
      path: '/clock',
      title: 'Digital Chess Clock & Game Timer — PlyQuest',
      description: 'Free fullscreen digital chess clock with Fischer increment, Bullet, Blitz, and Rapid presets. Works on mobile, tablet, and desktop.',
      priority: '0.8',
      changefreq: 'monthly',
      semanticHtml: `
        <section>
          <h1>Digital Chess Clock & Game Timer</h1>
          <p>Dual-sided over-the-board chess clock for mobile and desktop. Fischer delay/increment, custom presets, and tactile sounds.</p>
        </section>
      `,
    },
  ];

  // Tactical themes
  const themeList = ['fork', 'pin', 'skewer', 'discoveredAttack', 'backRankMate', 'sacrifice'];
  for (const th of themeList) {
    const formatted = th.replace(/([A-Z])/g, ' $1').toLowerCase();
    coreRoutes.push({
      path: `/themes/${th}`,
      title: `${formatted.charAt(0).toUpperCase() + formatted.slice(1)} Tactics — PlyQuest`,
      description: `Train tactical pattern recognition for ${formatted} motifs with interactive solving and progressive hints.`,
      priority: '0.7',
      changefreq: 'weekly',
      semanticHtml: `
        <section>
          <h1>${formatted.toUpperCase()} Chess Tactics</h1>
          <p>Interactive pattern training for ${formatted} tactical motifs.</p>
        </section>
      `,
    });
  }

  // Legal and Trust pages
  const legalPages = [
    { p: 'about', title: 'About Us — PlyQuest', desc: 'Learn about the mission, architecture, and technology behind PlyQuest.' },
    { p: 'privacy', title: 'Privacy Policy — PlyQuest', desc: 'Transparent privacy policy. PlyQuest requires no account, collects no PII, and operates zero tracking databases.' },
    { p: 'cookies', title: 'Cookie Policy — PlyQuest', desc: 'Overview of local browser storage and advertising cookies on PlyQuest.' },
    { p: 'terms', title: 'Terms of Service — PlyQuest', desc: 'Usage guidelines and terms of service for PlyQuest.' },
    { p: 'licenses', title: 'Open Source Licences & Attribution — PlyQuest', desc: 'Third-party notices, dataset licences, and open-source acknowledgments.' },
    { p: 'copyright', title: 'Copyright Policy — PlyQuest', desc: 'Copyright disclosures and DMCA contact procedure.' },
    { p: 'disclaimer', title: 'Disclaimer — PlyQuest', desc: 'General educational and legal disclaimers for PlyQuest.' },
    { p: 'security', title: 'Security — PlyQuest', desc: 'Zero-backend static security architecture and practices.' },
    { p: 'accessibility', title: 'Accessibility Statement — PlyQuest', desc: 'Accessibility commitment adhering to WCAG 2.1 AA standards.' },
    { p: 'contact', title: 'Contact Us — PlyQuest', desc: 'Get in touch with the PlyQuest project team for feedback or bug reports.' },
  ];

  for (const leg of legalPages) {
    coreRoutes.push({
      path: `/${leg.p}`,
      title: leg.title,
      description: leg.desc,
      priority: '0.5',
      changefreq: 'monthly',
      semanticHtml: `
        <article>
          <h1>${leg.title}</h1>
          <p>${leg.desc}</p>
        </article>
      `,
    });
  }

  // Individual puzzle pages (curated collection)
  for (const pz of PUZZLES) {
    const sideName = pz.sideToMove === 'w' ? 'White' : 'Black';
    coreRoutes.push({
      path: `/puzzle/${pz.id}`,
      title: `${pz.title} — Tactics Puzzle — PlyQuest`,
      description: `Rated ${pz.rating} chess tactic. ${sideName} to move: ${pz.objective}. Solve with interactive hints and zero account required.`,
      priority: '0.6',
      changefreq: 'monthly',
      semanticHtml: `
        <article>
          <h1>${pz.title}</h1>
          <p>Rating: ${pz.rating} • Side to move: ${sideName}</p>
          <p>Objective: ${pz.objective}</p>
          <p>Source: ${pz.provenance.sourceDataset} (#${pz.provenance.sourceRecordId})</p>
        </article>
      `,
    });

    // Embed widget route
    coreRoutes.push({
      path: `/embed/puzzle/${pz.id}`,
      title: `${pz.title} — Embeddable Chess Puzzle — PlyQuest`,
      description: `Interactive embeddable chess tactic: ${pz.title}. Side to move: ${sideName}. Rated ${pz.rating}.`,
      priority: '0.3',
      changefreq: 'monthly',
      semanticHtml: `
        <article>
          <h1>${pz.title} (Embed)</h1>
          <p>Rating: ${pz.rating} • Side to move: ${sideName}</p>
          <p>Objective: ${pz.objective}</p>
        </article>
      `,
    });
  }

  return coreRoutes;
}

function parseFenBoard(fen: string): (string | null)[][] {
  const parts = fen.split(' ')[0].split('/');
  const grid: (string | null)[][] = [];
  for (const rowStr of parts) {
    const row: (string | null)[] = [];
    for (const ch of rowStr) {
      if (ch >= '1' && ch <= '8') {
        const empties = parseInt(ch, 10);
        for (let i = 0; i < empties; i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    grid.push(row);
  }
  return grid;
}

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

function generateSvgCard(title: string, subtitle: string, fen: string, sideToMove: 'w' | 'b'): string {
  const grid = parseFenBoard(fen);
  let boardSvg = '';
  const sqSize = 50;
  const boardX = 690;
  const boardY = 115;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const x = boardX + c * sqSize;
      const y = boardY + r * sqSize;
      const fill = isLight ? '#F8FAFC' : '#CBD5E1';
      boardSvg += `<rect x="${x}" y="${y}" width="${sqSize}" height="${sqSize}" fill="${fill}"/>`;
      const piece = grid[r] && grid[r][c];
      if (piece) {
        const sym = PIECE_SYMBOLS[piece] || piece;
        const pieceFill = piece === piece.toUpperCase() ? '#1E293B' : '#0F172A';
        boardSvg += `<text x="${x + 25}" y="${y + 36}" font-size="32" font-weight="bold" fill="${pieceFill}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${sym}</text>`;
      }
    }
  }

  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeSubtitle = subtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const turnBadge = sideToMove === 'w' ? 'WHITE TO MOVE' : 'BLACK TO MOVE';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#101322"/>
      <stop offset="50%" stop-color="#171B34"/>
      <stop offset="100%" stop-color="#252B52"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Brand Header -->
  <text x="80" y="85" font-size="34" font-weight="900" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif">PlyQuest</text>
  <text x="80" y="115" font-size="13" font-weight="700" fill="#818CF8" letter-spacing="2" font-family="system-ui, -apple-system, sans-serif">TACTICAL TRAINING STUDIO • FREE &amp; OPEN-ACCESS</text>

  <!-- Turn Badge -->
  <rect x="80" y="155" width="180" height="34" rx="8" fill="#4658C9"/>
  <text x="170" y="177" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${turnBadge}</text>

  <!-- Title & Subtitle -->
  <text x="80" y="240" font-size="40" font-weight="900" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif">${safeTitle}</text>
  <text x="80" y="285" font-size="20" font-weight="600" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif">${safeSubtitle}</text>

  <!-- Value Props -->
  <rect x="80" y="335" width="550" height="110" rx="16" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)"/>
  <text x="110" y="375" font-size="18" font-weight="700" fill="#C7D2FE" font-family="system-ui, -apple-system, sans-serif">🎯 Can you calculate the winning line?</text>
  <text x="110" y="410" font-size="14" font-weight="500" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif">Zero spoilers • Instant interactive play with progressive hints</text>

  <!-- Board border & shadow -->
  <rect x="${boardX - 4}" y="${boardY - 4}" width="408" height="408" rx="8" fill="none" stroke="#4658C9" stroke-width="4"/>
  ${boardSvg}

  <!-- Footer -->
  <text x="80" y="565" font-size="14" font-weight="500" fill="#64748B" font-family="system-ui, -apple-system, sans-serif">Product of Aztras AI Tech Solutions • plyquest.pages.dev</text>
  <text x="1120" y="565" font-size="14" font-weight="700" fill="#818CF8" text-anchor="end" font-family="system-ui, -apple-system, sans-serif">Free Chess Tactics</text>
</svg>`;
}

export function buildPrerender(): void {
  if (!fs.existsSync(BASE_HTML_PATH)) {
    console.error(`Base HTML file not found at ${BASE_HTML_PATH}. Run "npm run build" first.`);
    return;
  }

  const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf-8');
  const routes = getStaticRoutes();
  const daily = getDailyPuzzle();

  // Create OG image output directories
  const distOgDir = path.resolve(DIST_DIR, 'assets/og');
  const publicOgDir = path.resolve(process.cwd(), 'public/assets/og');
  [distOgDir, publicOgDir].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // Generate static preview SVG images
  const coverSvg = generateSvgCard(
    'Chess Tactics Studio',
    'Free Curated Tactics & Printable Worksheets',
    'r1bqk2r/pppp1ppp/2n5/4p3/1bB1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    'w'
  );
  fs.writeFileSync(path.resolve(distOgDir, 'cover.svg'), coverSvg, 'utf-8');
  fs.writeFileSync(path.resolve(publicOgDir, 'cover.svg'), coverSvg, 'utf-8');

  const dailySvg = generateSvgCard(
    'Daily Chess Puzzle',
    `${daily.objective} • Rated ${daily.rating}`,
    daily.solverFen,
    daily.sideToMove
  );
  fs.writeFileSync(path.resolve(distOgDir, 'daily.svg'), dailySvg, 'utf-8');
  fs.writeFileSync(path.resolve(publicOgDir, 'daily.svg'), dailySvg, 'utf-8');

  for (const pz of PUZZLES) {
    const pzSvg = generateSvgCard(
      pz.title,
      `${pz.objective} • Rated ${pz.rating}`,
      pz.solverFen,
      pz.sideToMove
    );
    fs.writeFileSync(path.resolve(distOgDir, `puzzle-${pz.id}.svg`), pzSvg, 'utf-8');
    fs.writeFileSync(path.resolve(publicOgDir, `puzzle-${pz.id}.svg`), pzSvg, 'utf-8');
  }

  console.log(`Generated static social preview images for ${PUZZLES.length} puzzles and core routes.`);
  console.log(`Prerendering ${routes.length} static routes for true SSG/SEO...`);

  let renderedCount = 0;

  for (const route of routes) {
    const canonicalUrl = `${SITE_URL}${route.path === '/' ? '' : route.path}`;

    // Select appropriate preview image (raster PNG for the home page so it renders on WhatsApp/FB/X)
    let imageUrl = `${SITE_URL}/assets/og/og-card.png`;
    let imageType = 'image/png';
    if (route.path.startsWith('/puzzle/') || route.path.startsWith('/embed/puzzle/')) {
      const pId = route.path.split('/').pop();
      imageUrl = `${SITE_URL}/assets/og/puzzle-${pId}.svg`;
      imageType = 'image/svg+xml';
    } else if (route.path === '/daily') {
      imageUrl = `${SITE_URL}/assets/og/daily.svg`;
      imageType = 'image/svg+xml';
    }

    // Replace meta tags and title
    let html = baseHtml;

    // Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);

    // Meta Description
    if (html.includes('<meta name="description"')) {
      html = html.replace(/<meta name="description" content=".*?"\s*\/?>/, `<meta name="description" content="${route.description}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${route.description}" />\n</head>`);
    }

    // Canonical link
    if (html.includes('<link rel="canonical"')) {
      html = html.replace(/<link rel="canonical" href=".*?"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}" />`);
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
    }

    // Strip fallback base og and twitter tags to ensure zero duplicate tags
    html = html.replace(/<meta property="og:[^>]*>\s*/g, '');
    html = html.replace(/<meta name="twitter:[^>]*>\s*/g, '');

    // OpenGraph & Twitter Card Tags with absolute teaser image
    const ogTags = `
  <meta property="og:title" content="${route.title}" />
  <meta property="og:description" content="${route.description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:image:alt" content="${route.title}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${route.title}" />
  <meta name="twitter:description" content="${route.description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${route.title}" />
`;
    html = html.replace('</head>', `${ogTags}</head>`);

    // FAQ structured data (home page only) for rich results
    if (route.path === '/') {
      const faqItems = [
        {
          q: 'Is PlyQuest really free?',
          a: 'Yes. Every puzzle, hint, worksheet, and training tool is 100% free with no account, no subscription, and no paywalled content.',
        },
        {
          q: 'Do I need an account to solve puzzles?',
          a: 'No account is required. Everything runs in your browser and your progress is saved locally on your own device.',
        },
        {
          q: 'Can I print or download the puzzles?',
          a: 'Yes. The Worksheet Studio exports ready-to-print A4 or US Letter PDFs with 1, 2, 4, or 6 puzzles per page, plus an optional answer key.',
        },
        {
          q: 'Can I embed puzzles on my own website or blog?',
          a: 'Yes. Every puzzle ships with a lightweight embeddable widget you can drop into any site.',
        },
        {
          q: 'Does PlyQuest work offline?',
          a: 'Yes. After the first load the app works fully offline and can be installed to your home screen.',
        },
        {
          q: 'Is my data private?',
          a: 'Yes. All solving, review, and worksheet generation happens locally in your browser — no server uploads and no third-party trackers.',
        },
      ];
      const faqJsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      });
      html = html.replace('</head>', `  <script type="application/ld+json">\n${faqJsonLd}\n  </script>\n</head>`);
    }

    // Inject semantic server HTML inside #root
    if (route.semanticHtml) {
      const rootPlaceholder = '<div id="root"></div>';
      const rootFilled = `<div id="root">\n  <noscript>\n    ${route.semanticHtml}\n  </noscript>\n</div>`;
      html = html.replace(rootPlaceholder, rootFilled);
    }

    // Determine target file path
    let outFilePath: string;
    if (route.path === '/') {
      outFilePath = path.resolve(DIST_DIR, 'index.html');
    } else {
      const routeSubdir = path.resolve(DIST_DIR, route.path.replace(/^\//, ''));
      if (!fs.existsSync(routeSubdir)) {
        fs.mkdirSync(routeSubdir, { recursive: true });
      }
      outFilePath = path.resolve(routeSubdir, 'index.html');
    }

    fs.writeFileSync(outFilePath, html, 'utf-8');
    renderedCount++;
  }

  // Generate dynamic sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path === '/' ? '' : r.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  fs.writeFileSync(path.resolve(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
  fs.writeFileSync(path.resolve(process.cwd(), 'public/sitemap.xml'), sitemapXml, 'utf-8');

  console.log(`Successfully prerendered ${renderedCount} routes and generated dynamic sitemap.xml!`);
}

// Execute if run directly via tsx
buildPrerender();
