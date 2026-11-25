import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';
import { SERVICES } from '../src/securities/catalog.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];
const html = content('guides/nisa-guide/index.html');

test('nisa-guide is built, listed in the sitemap and linked both ways with /securities/', () => {
  assert.match(content('vite.config.js'), /'guide-nisa-guide': fileURLToPath\(new URL\('\.\/guides\/nisa-guide\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/nisa-guide/</loc>'));
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/nisa-guide\/"/);
  assert.ok(html.includes('href="/securities/"'), 'guide -> securities hub');
  assert.ok(content('src/securities/SecuritiesPage.jsx').includes('/guides/nisa-guide/'), 'securities page -> guide');
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('nisa-guide has its own page ID so views are measured', () => {
  assert.equal(pageId('/guides/nisa-guide/'), 'guide-nisa-guide');
  assert.equal(validViewEvent({ event: 'view', page: 'guide-nisa-guide' }), true);
});

test('nisa-guide has Article structured data that matches the visible page', () => {
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/nisa-guide/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('nisa-guide carries PR disclosure in the first view and risk text', () => {
  assert.ok(html.includes('PR（広告を含みます）'));
  assert.ok(html.indexOf('PR（広告を含みます）') < html.indexOf('<article>'), 'PR disclosure precedes the article body');
  assert.ok(html.includes('元本割れ'), 'principal-loss warning');
  assert.ok(html.includes('保証された商品ではありません'));
});

test('nisa-guide numbers come from the checked securities catalog, nothing invented', () => {
  const dmmKabu = SERVICES.find(service => service.id === 'dmm-kabu');
  const matsui = SERVICES.find(service => service.id === 'matsui');
  const fact = (service, label) => service.facts.find(item => item.label.startsWith(label))?.value || '';
  // Every figure quoted in the guide must exist in the catalog facts.
  assert.ok(fact(dmmKabu, '日本株').includes('55円') && html.includes('55円'));
  assert.ok(fact(dmmKabu, '日本株').includes('880円') && html.includes('880円'));
  assert.ok(fact(dmmKabu, 'NISA').includes('無料') && html.includes('日本株・米国株とも取引手数料無料'));
  assert.ok(fact(dmmKabu, '為替手数料').includes('25銭') && html.includes('25銭'));
  assert.ok(fact(matsui, '日本株手数料').includes('50万円まで0円') && html.includes('50万円まで0円'));
  assert.ok(fact(matsui, 'NISA').includes('投資信託') && html.includes('日本株・米国株・投資信託の売買手数料が無料'));
  assert.ok(fact(matsui, '投資信託').includes('1,800銘柄以上') && html.includes('1,800銘柄以上'));
  assert.ok(fact(matsui, '投資信託').includes('100円から') && html.includes('100円から'));
  // No NISA scheme figures (allowances etc.) are asserted in the guide.
  assert.doesNotMatch(html, /1,800万円|360万円|非課税保有限度額/);
});

test('no banned solicitation wording appears in the nisa guide', () => {
  for (const banned of ['儲かる', '負けない', '稼げる', '必ず']) {
    assert.ok(!html.includes(banned), 'banned wording found: ' + banned);
  }
});
