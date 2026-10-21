/**
 * Chessbitz — Build-Time Static Route Prerenderer & Sitemap Generator
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

const SITE_URL = 'https://chessbitz.com';
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
      title: 'Chessbitz — Premium Free Chess Tactics Puzzles & Worksheets',
      description: 'Solve unlimited free chess tactics puzzles and generate customizable printable PDF worksheets. Zero login, zero subscription, client-side solving.',
      priority: '1.0',
      changefreq: 'daily',
      semanticHtml: `
        <header>
          <h1>Chessbitz — Free Chess Tactics Puzzles & Printable Worksheets</h1>
          <p>Master tactical chess vision with curated puzzles, progressive hints, and studio-grade printable worksheet generation.</p>
        </header>
      `,
    },
    {
      path: '/daily',
      title: 'Daily Chess Puzzle — Chessbitz',
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
      title: 'Chess Tactics Puzzle Library — Chessbitz',
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
      title: 'Printable Chess Worksheets Studio (PDF) — Chessbitz',
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
      title: 'Mate in 1 Chess Puzzles — Chessbitz',
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
      title: 'Mate in 2 Chess Puzzles — Chessbitz',
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
      title: 'Mate in 3 Chess Puzzles — Chessbitz',
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
      title: 'Sprint Mode — Timed Puzzle Challenge — Chessbitz',
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
      title: 'Spaced Repetition Review — Chessbitz',
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
      title: 'Import FEN Position — Private Analysis — Chessbitz',
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
  ];

  // Tactical themes
  const themeList = ['fork', 'pin', 'skewer', 'discoveredAttack', 'backRankMate', 'sacrifice'];
  for (const th of themeList) {
    const formatted = th.replace(/([A-Z])/g, ' $1').toLowerCase();
    coreRoutes.push({
      path: `/themes/${th}`,
      title: `${formatted.charAt(0).toUpperCase() + formatted.slice(1)} Tactics — Chessbitz`,
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
    { p: 'about', title: 'About Us — Chessbitz', desc: 'Learn about the mission, architecture, and technology behind Chessbitz.' },
    { p: 'privacy', title: 'Privacy Policy — Chessbitz', desc: 'Transparent privacy policy. Chessbitz requires no account, collects no PII, and operates zero tracking databases.' },
    { p: 'cookies', title: 'Cookie Policy — Chessbitz', desc: 'Overview of local browser storage and advertising cookies on Chessbitz.' },
    { p: 'terms', title: 'Terms of Service — Chessbitz', desc: 'Usage guidelines and terms of service for Chessbitz.' },
    { p: 'licenses', title: 'Open Source Licences & Attribution — Chessbitz', desc: 'Third-party notices, dataset licences, and open-source acknowledgments.' },
    { p: 'copyright', title: 'Copyright Policy — Chessbitz', desc: 'Copyright disclosures and DMCA contact procedure.' },
    { p: 'disclaimer', title: 'Disclaimer — Chessbitz', desc: 'General educational and legal disclaimers for Chessbitz.' },
    { p: 'security', title: 'Security — Chessbitz', desc: 'Zero-backend static security architecture and practices.' },
    { p: 'accessibility', title: 'Accessibility Statement — Chessbitz', desc: 'Accessibility commitment adhering to WCAG 2.1 AA standards.' },
    { p: 'contact', title: 'Contact Us — Chessbitz', desc: 'Get in touch with the Chessbitz project team for feedback or bug reports.' },
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
      title: `${pz.title} — Tactics Puzzle — Chessbitz`,
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
  }

  return coreRoutes;
}

export function buildPrerender(): void {
  if (!fs.existsSync(BASE_HTML_PATH)) {
    console.error(`Base HTML file not found at ${BASE_HTML_PATH}. Run "npm run build" first.`);
    return;
  }

  const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf-8');
  const routes = getStaticRoutes();

  console.log(`Prerendering ${routes.length} static routes for true SSG/SEO...`);

  let renderedCount = 0;

  for (const route of routes) {
    const canonicalUrl = `${SITE_URL}${route.path === '/' ? '' : route.path}`;

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

    // OpenGraph Tags
    const ogTags = `
  <meta property="og:title" content="${route.title}" />
  <meta property="og:description" content="${route.description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${route.title}" />
  <meta name="twitter:description" content="${route.description}" />
`;
    html = html.replace('</head>', `${ogTags}</head>`);

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
