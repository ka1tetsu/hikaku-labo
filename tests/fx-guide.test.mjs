import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';
import { SERVICES } from '../src/securities/catalog.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];
const html = content('guides/fx-guide/index.html');

test('fx-guide is built, listed in the sitemap and linked both ways with /securities/', () => {
  assert.match(content('vite.config.js'), /'guide-fx-guide': fileURLToPath\(new URL\('\.\/guides\/fx-guide\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/fx-guide/</loc>'));
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/fx-guide\/"/);
  assert.ok(html.includes('href="/securities/"'), 'guide -> securities hub');
  assert.ok(content('src/securities/SecuritiesPage.jsx').includes('/guides/fx-guide/'), 'securities page -> guide');
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('fx-guide has its own page ID so views are measured', () => {
  assert.equal(pageId('/guides/fx-guide/'), 'guide-fx-guide');
  assert.equal(validViewEvent({ event: 'view', page: 'guide-fx-guide' }), true);
});

test('fx-guide has Article structured data that matches the visible page', () => {
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/fx-guide/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('fx-guide carries PR disclosure in the first view and leverage risk text', () => {
  assert.ok(html.includes('PR（広告を含みます）'));
  assert.ok(html.indexOf('PR（広告を含みます）') < html.indexOf('<article>'), 'PR disclosure precedes the article body');
  assert.ok(html.includes('元本を上回る損失'), 'loss exceeding principal warning');
  assert.ok(html.includes('保証された商品ではありません'));
  assert.ok(html.includes('ロスカット'), 'stop-out mechanism explained');
});

test('fx-guide numbers come from the checked securities catalog, nothing invented', () => {
  const dmmFx = SERVICES.find(service => service.id === 'dmm-fx');
  const dmmCfd = SERVICES.find(service => service.id === 'dmm-cfd');
  const fact = (service, label) => service.facts.find(item => item.label.startsWith(label))?.value || '';
  // Every figure quoted in the guide must exist in the catalog facts.
  assert.ok(fact(dmmFx, 'スプレッド（米ドル/円）').includes('0.2銭') && html.includes('0.2銭'));
  assert.ok(fact(dmmFx, 'スプレッド（その他の主要ペア）').includes('0.4銭') && html.includes('0.4銭'));
  assert.ok(fact(dmmFx, '通貨ペア').includes('通常23ペア') && html.includes('通常23ペア＋ミニ4ペア＋ラージ4ペア'));
  assert.ok(fact(dmmFx, '最小取引単位').includes('10,000通貨') && html.includes('10,000通貨'));
  assert.ok(fact(dmmFx, '最小取引単位').includes('1,000通貨') && html.includes('1,000通貨'));
  assert.ok(fact(dmmFx, '取引手数料').includes('無料') && html.includes('取引手数料が無料'));
  assert.ok(fact(dmmFx, 'ロスカット').includes('50%') && html.includes('証拠金維持率50%以下'));
  // The fixed-in-principle window comes from the catalog caution, not from memory.
  assert.ok(dmmFx.cautions.some(text => text.includes('AM9:00〜翌AM5:00')) && html.includes('AM9:00〜翌AM5:00'));
  assert.ok(fact(dmmCfd, '取扱銘柄').includes('全22銘柄') && html.includes('全22銘柄'));
  assert.ok(fact(dmmCfd, 'レバレッジ上限').includes('株価指数10倍／商品20倍') && html.includes('株価指数10倍／商品20倍'));
  assert.ok(fact(dmmCfd, '取引手数料').includes('無料') && html.includes('無料（株価指数・商品とも'));
  assert.ok(fact(dmmCfd, 'ロスカット').includes('50%'));
  // No worked profit/loss simulation figures are presented as examples.
  assert.doesNotMatch(html, /計算例/);
});

test('no banned solicitation wording appears in the fx guide', () => {
  for (const banned of ['儲かる', '負けない', '稼げる', '必ず']) {
    assert.ok(!html.includes(banned), 'banned wording found: ' + banned);
  }
});
