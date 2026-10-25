// Verify generated pages and SEO metadata without relying on a live deployment.
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { siteOrigin, SITE_ORIGIN, LEGACY_ORIGIN } from '../src/shared/site.js';
import { syncDatabaseRoutes } from './sync-database-routes.mjs';
await syncDatabaseRoutes({ check: true });
const database = JSON.parse(await readFile(new URL('../integration/vividatabase.json', import.meta.url), 'utf8'));
const proxiedPaths = [...database.pages, ...database.resources];
const origin = siteOrigin(process.env.SITE_ORIGIN || SITE_ORIGIN);
const dist = new URL('../dist/', import.meta.url);
const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8');
const robots = await readFile(new URL('robots.txt', dist), 'utf8');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) throw new Error('robots.txt sitemap origin mismatch');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
if (urls.length < 60 || new Set(urls).size !== urls.length) throw new Error('Incomplete or duplicate sitemap');
for (const value of urls) {
  const url = new URL(value);
  if (url.origin !== origin || !url.pathname.endsWith('/')) throw new Error(`Unexpected sitemap URL: ${value}`);
  const file = new URL(url.pathname.slice(1) + 'index.html', dist);
  const html = await readFile(file, 'utf8');
  if (!html.includes(`rel="canonical" href="${value}"`)) throw new Error(`Wrong canonical in ${value}`);
  if (origin !== LEGACY_ORIGIN && html.includes(LEGACY_ORIGIN)) throw new Error(`Legacy origin in ${value}`);
  if (!html.includes('Vivlica') || !html.includes('<h1') || html.includes('<div id="root"></div>')) throw new Error(`Missing rendered content in ${value}`);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)];
  if (!ld.length) throw new Error(`Missing structured data in ${value}`);
  for (const [, json] of ld) JSON.parse(json);
  for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"?#]*)[?#]?[^\"]*"/g)) {
    if (href.startsWith('//') || href.startsWith('/api/')) continue;
    // These links are served by the checked Vercel rewrites, not Vite files.
    if (proxiedPaths.some(path => href === path || href.startsWith(path + '/'))) continue;
    const target = new URL(href.slice(1) + (href.endsWith('/') ? 'index.html' : ''), dist);
    try { await access(target); } catch { throw new Error(`Broken local reference ${href} in ${fileURLToPath(file)}`); }
  }
}
console.log(`Verified ${urls.length} rendered pages: canonical origin, sitemap, structured data, and local assets/links.`);
