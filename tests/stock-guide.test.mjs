import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';
import { SERVICES } from '../src/securities/catalog.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];
const html = content('guides/stock-guide/index.html');

test('stock-guide is built, listed in the sitemap and linked both ways with /securities/', () => {
  assert.match(content('vite.config.js'), /'guide-stock-guide': fileURLToPath\(new URL\('\.\/guides\/stock-guide\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/stock-guide/</loc>'));
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/stock-guide\/"/);
  assert.ok(html.includes('href="/securities/"'), 'guide -> securities hub');
  assert.ok(content('src/securities/SecuritiesPage.jsx').includes('/guides/stock-guide/'), 'securities page -> guide');
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('stock-guide has its own page ID so views are measured', () => {
  assert.equal(pageId('/guides/stock-guide/'), 'guide-stock-guide');
  assert.equal(validViewEvent({ event: 'view', page: 'guide-stock-guide' }), true);
});

test('stock-guide has Article structured data that matches the visible page', () => {
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/stock-guide/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('stock-guide carries PR disclosure in the first view and stock risk text', () => {
  assert.ok(html.includes('PR（広告を含みます）'));
  assert.ok(html.indexOf('PR（広告を含みます）') < html.indexOf('<article>'), 'PR disclosure precedes the article body');
  assert.ok(html.includes('元本割れ'), 'principal-loss warning');
  assert.ok(html.includes('保証された商品ではありません'));
  assert.ok(html.includes('余裕資金の範囲で検討してください'));
});

test('stock-guide numbers come from the checked securities catalog, nothing invented', () => {
  const dmmKabu = SERVICES.find(service => service.id === 'dmm-kabu');
  const matsui = SERVICES.find(service => service.id === 'matsui');
  const fact = (service, label) => service.facts.find(item => item.label.startsWith(label))?.value || '';
  // Every figure quoted in the guide must exist in the catalog facts.
  assert.ok(fact(dmmKabu, '日本株 現物手数料').includes('55円') && html.includes('5万円以下 55円'));
  assert.ok(fact(dmmKabu, '日本株 現物手数料').includes('880円') && html.includes('300万円超 880円'));
  assert.ok(fact(dmmKabu, '米国株 現物手数料').includes('0.495%') && html.includes('約定金額×0.495%'));
  assert.ok(fact(dmmKabu, '為替手数料').includes('25銭') && html.includes('1ドルあたり25銭'));
  assert.ok(fact(dmmKabu, 'NISA').includes('現物取引のみ') && html.includes('現物取引のみ'));
  assert.ok(fact(dmmKabu, 'アカウント登録・管理手数料').includes('0円') && html.includes('アカウント登録・管理手数料0円'));
  assert.ok(fact(dmmKabu, '単元未満株').includes('550円') && html.includes('取次手数料550円'));
  assert.ok(fact(matsui, '日本株手数料').includes('50万円まで0円') && html.includes('50万円まで0円'));
  assert.ok(fact(matsui, '日本株手数料').includes('110,000円') && html.includes('110,000円が上限'));
  assert.ok(fact(matsui, '25歳以下の手数料').includes('無料') && html.includes('25歳以下は金額にかかわらず無料'));
  assert.ok(fact(matsui, '米国株 現物手数料').includes('上限22米ドル') && html.includes('上限22米ドル'));
  assert.ok(fact(matsui, 'NISA').includes('投資信託') && html.includes('日本株・米国株・投資信託の売買手数料が無料'));
  assert.ok(fact(matsui, '投資信託').includes('1,800銘柄以上') && html.includes('取扱い1,800銘柄以上'));
  assert.ok(fact(matsui, '投資信託').includes('100円から') && html.includes('積立は100円から'));
  assert.ok(fact(matsui, '口座開設').includes('無料') && html.includes('口座開設無料'));
  // The fee-unit caution comes from the catalog, not from memory.
  assert.ok(matsui.cautions.some(text => text.includes('1日の約定代金合計')) && html.includes('1日の約定代金合計で決まる'));
  assert.ok(dmmKabu.cautions.some(text => text.includes('為替手数料')) && html.includes('為替手数料（片道25銭／ドル）'));
  assert.ok(dmmKabu.cautions.some(text => text.includes('買増しができず')) && html.includes('買増しができず'));
  // No worked profit/loss simulation figures are presented as examples.
  assert.doesNotMatch(html, /計算例/);
});

test('no banned solicitation wording appears in the stock guide', () => {
  for (const banned of ['儲かる', '負けない', '稼げる', '必ず']) {
    assert.ok(!html.includes(banned), 'banned wording found: ' + banned);
  }
});
