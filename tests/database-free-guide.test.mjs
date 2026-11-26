import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];
const html = content('guides/database-free/index.html');

test('database-free guide is built, listed in the sitemap and linked both ways', () => {
  assert.match(content('vite.config.js'), /'guide-database-free': fileURLToPath\(new URL\('\.\/guides\/database-free\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/database-free/</loc>'));
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/database-free\/"/);
  assert.ok(html.includes('href="/database"'), 'guide -> database');
  assert.ok(html.includes('href="/docs/api"'), 'guide -> API docs');
  assert.ok(html.includes('href="/pricing"'), 'guide -> pricing');
  assert.ok(content('src/shared/SiteFooter.jsx').includes('/guides/database-free/'), 'site footer -> guide');
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('database-free guide has its own page ID so views are measured', () => {
  assert.equal(pageId('/guides/database-free/'), 'guide-database-free');
  assert.equal(validViewEvent({ event: 'view', page: 'guide-database-free' }), true);
});

test('database-free guide has Article structured data that matches the visible page', () => {
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/database-free/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('database-free guide states the verified free limits and keeps paid scope paid', () => {
  // Free scope as published on the /database plan table (checked 2026-11-26).
  assert.ok(html.includes('各情報源の直近5件'), 'free investigation file limit');
  assert.ok(html.includes('2社まで'), 'free comparison limit');
  assert.ok(html.includes('登録不要'), 'no registration for the free scope');
  assert.ok(html.includes('官公需シグナル'), 'free signal edition mentioned');
  // Paid scope must not be described as free.
  assert.ok(html.includes('全件表示'), 'full listing named as the paid scope');
  assert.ok(html.includes('CSV・JSON'), 'downloads named');
  assert.doesNotMatch(html, /全件[^<]{0,12}無料/, 'full listing is never called free');
  assert.doesNotMatch(html, /ダウンロード[^<]{0,12}無料/, 'downloads are never called free');
  assert.doesNotMatch(html, /完全無料|すべて無料|全て無料/, 'no blanket free claims');
});

test('database-free guide prices match the published plan tables', () => {
  // OSINT Pro price from the /database plan table; API prices from the API plan table.
  assert.ok(html.includes('¥4,980 / 月'), 'OSINT Pro monthly price');
  assert.ok(html.includes('¥49,800'), 'OSINT Pro annual price');
  assert.ok(html.includes('¥980'), 'API Pro price');
  assert.ok(html.includes('¥3,980'), 'API Ultra price');
  assert.ok(html.includes('¥9,800'), 'API Mega price');
  assert.ok(html.includes('3,000'), 'API Free monthly request cap');
  assert.ok(html.includes('30,000'), 'API Pro monthly request cap');
  assert.ok(html.includes('2,000,000'), 'API Mega monthly request cap');
  // Prices from the pre-2026-11-26 plan table must not linger.
  assert.ok(!html.includes('¥1,480'), 'old API Pro price removed');
  assert.ok(!html.includes('¥14,800'), 'old API Mega price removed');
  assert.ok(html.includes('1リクエスト最大1,000件'), 'alternative-data per-request cap');
  assert.ok(html.includes('7日間'), 'trial period stated');
});

test('database-free guide carries the coverage caution, not a completeness claim', () => {
  assert.ok(html.includes('「見つからない」ことは「存在しない」ことを意味しません'));
  assert.ok(html.includes('投資の推奨をするものではありません'));
  assert.doesNotMatch(html, /全上場企業|すべての企業|網羅/, 'no coverage overclaim');
});

test('no banned solicitation wording appears in the database-free guide', () => {
  for (const banned of ['儲かる', '負けない', '稼げる', '必ず']) {
    assert.ok(!html.includes(banned), 'banned wording found: ' + banned);
  }
});
