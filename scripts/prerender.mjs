// Inject server-rendered markup into the built HTML so content is crawlable and
// visible before JavaScript runs. Runs after `vite build`.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { SITE_ORIGIN, siteOrigin } from '../src/shared/site.js';

// SITE_ORIGIN (e.g. https://example.jp) switches canonical / OGP / sitemap URLs to a custom domain.
const DEFAULT_ORIGIN = SITE_ORIGIN;
const SITE = siteOrigin(process.env.SITE_ORIGIN || DEFAULT_ORIGIN);
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { render, PAGES, STATIC_PAGES, renderStatic } = await vite.ssrLoadModule('/src/ssr.jsx');
  for (const file of Object.keys(PAGES)) {
    const path = new URL('../dist/' + file, import.meta.url);
    const html = await readFile(path, 'utf8');
    if (!html.includes('<div id="root"></div>')) throw new Error('root placeholder missing in ' + file);
    await writeFile(path, html.replace('<div id="root"></div>', `<div id="root">${render(file)}</div>`));
    console.log('prerendered', file);
  }

  // Static long-tail pages reuse the built CSS of the service pages and the
  // concierge script of the guides (which also handles click tracking).
  const servicesHtml = await readFile(new URL('../dist/sim/index.html', import.meta.url), 'utf8');
  const guideHtml = await readFile(new URL('../dist/guides/website-tools/index.html', import.meta.url), 'utf8');
  const styles = [...servicesHtml.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m => m[0]).join('\n');
  const scripts = [...guideHtml.matchAll(/<script type="module"[^>]*><\/script>|<link rel="modulepreload"[^>]*>/g)].map(m => m[0]).join('\n');
  const escape = text => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  for (const page of STATIC_PAGES) {
    const url = SITE + page.path;
    const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['/', 'Vivlica'], ...page.crumbs].map(([href, name], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + href })) };
    const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link rel="icon" type="image/svg+xml" href="/icons/tabler/layout-grid.svg"/>
<meta name="theme-color" content="#16324a"/>
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:locale" content="ja_JP"/><meta property="og:type" content="article"/><meta property="og:site_name" content="Vivlica"/>
<meta property="og:title" content="${escape(page.title)}"/><meta property="og:description" content="${escape(page.description)}"/>
<meta property="og:url" content="${url}"/><meta property="og:image" content="${SITE}/og/${page.og}.png"/><meta name="twitter:card" content="summary_large_image"/>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
${styles}
${scripts}
</head><body data-concierge-section="site"><div id="root">${renderStatic(page)}</div></body>
</html>
`;
    const target = new URL('../dist' + page.path + 'index.html', import.meta.url);
    await mkdir(new URL('.', target), { recursive: true });
    await writeFile(target, html);
  }
  console.log('static pages', STATIC_PAGES.length);

  // Sitemap: add the generated pages.
  const sitemapPath = new URL('../dist/sitemap.xml', import.meta.url);
  const sitemap = await readFile(sitemapPath, 'utf8');
  const extra = STATIC_PAGES.map(page => `  <url><loc>${SITE}${page.path}</loc></url>`).join('\n');
  await writeFile(sitemapPath, sitemap.replace('</urlset>', extra + '\n</urlset>'));

  if (SITE !== DEFAULT_ORIGIN) {
    await rewriteOrigin(new URL('../dist/', import.meta.url));
    console.log('site origin →', SITE);
  }
} finally {
  await vite.close();
}

async function rewriteOrigin(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) await rewriteOrigin(path);
    else if (/\.(html|xml|txt)$/.test(entry.name)) {
      const text = await readFile(path, 'utf8');
      if (text.includes(DEFAULT_ORIGIN)) await writeFile(path, text.replaceAll(DEFAULT_ORIGIN, SITE));
    }
  }
}
