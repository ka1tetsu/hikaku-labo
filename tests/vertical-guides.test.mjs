import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];

const GUIDES = [
  { slug: 'sim-guide', entry: 'guide-sim-guide', target: '/sim/', others: ['hikari-guide', 'card-guide'] },
  { slug: 'hikari-guide', entry: 'guide-hikari-guide', target: '/hikari/', others: ['sim-guide', 'card-guide'] },
  { slug: 'card-guide', entry: 'guide-card-guide', target: '/card/', others: ['sim-guide', 'hikari-guide'] },
];

for (const { slug, entry, target, others } of GUIDES) {
  test(`${slug} is built, listed in the sitemap and linked from its comparison page`, () => {
    assert.match(content('vite.config.js'), new RegExp(`'${entry}': fileURLToPath\\(new URL\\('\\./guides/${slug}/index\\.html'`));
    assert.ok(content('public/sitemap.xml').includes(`<loc>https://vivlica.com/guides/${slug}/</loc>`));
    const html = content(`guides/${slug}/index.html`);
    assert.match(html, new RegExp(`rel="canonical" href="https://vivlica\\.com/guides/${slug}/"`));
    assert.ok(html.includes(`href="${target}#selector"`), `${slug} -> ${target}#selector`);
    for (const other of others) assert.ok(html.includes(`href="/guides/${other}/"`), `${slug} -> ${other}`);
    assert.ok(content('src/services/ServicesPage.jsx').includes(`/guides/${slug}/`), `ServicesPage -> ${slug}`);
    assert.doesNotMatch(html, /a8\.net|a8mat=/);
  });

  test(`${slug} has its own page ID so views are measured`, () => {
    assert.equal(pageId(`/guides/${slug}/`), entry);
    assert.equal(validViewEvent({ event: 'view', page: entry }), true);
  });

  test(`${slug} has Article structured data that matches the visible page`, () => {
    const html = content(`guides/${slug}/index.html`);
    const data = structuredData(html);
    assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'), slug);
    const article = data.find(item => item['@type'] === 'Article');
    assert.ok(article, slug);
    assert.equal(article['@context'], 'https://schema.org');
    assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1], slug);
    assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1], slug);
    assert.equal(article.inLanguage, 'ja');
    assert.equal(article.mainEntityOfPage, `https://vivlica.com/guides/${slug}/`);
    assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(article.dateModified, updated(html), slug);
    assert.equal(article.publisher?.name, 'Vivlica');
  });
}
