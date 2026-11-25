import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';
import { HIKARI_SERVICES } from '../src/services/catalog.js';
import { HIKARI_DETAIL_PAGES } from '../src/services/pages.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];
const html = content('guides/hikari-single-guide/index.html');
const yen = n => n.toLocaleString('ja-JP') + '円';
const service = id => HIKARI_SERVICES.find(s => s.id === id);

test('hikari-single-guide is built, listed in the sitemap and linked from the hikari comparison page', () => {
  assert.match(content('vite.config.js'), /'guide-hikari-single-guide': fileURLToPath\(new URL\('\.\/guides\/hikari-single-guide\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/hikari-single-guide/</loc>'));
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/hikari-single-guide\/"/);
  assert.ok(html.includes('href="/hikari/#selector"'), 'guide -> hikari comparison selector');
  assert.ok(content('src/services/ServicesPage.jsx').includes('/guides/hikari-single-guide/'), 'hikari page -> guide');
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('hikari-single-guide has its own page ID so views are measured', () => {
  assert.equal(pageId('/guides/hikari-single-guide/'), 'guide-hikari-single-guide');
  assert.equal(validViewEvent({ event: 'view', page: 'guide-hikari-single-guide' }), true);
});

test('hikari-single-guide has Article structured data that matches the visible page', () => {
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/hikari-single-guide/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('hikari-single-guide carries PR disclosure in the first view', () => {
  assert.ok(html.includes('PR（広告を含みます）'));
  assert.ok(html.indexOf('PR（広告を含みます）') < html.indexOf('<article>'), 'PR disclosure precedes the article body');
});

test('hikari-single-guide links only to detail pages that exist', () => {
  const linked = [...html.matchAll(/href="\/hikari\/([a-z0-9-]+)\/"/g)].map(m => m[1]);
  assert.ok(linked.length > 0);
  for (const id of linked) {
    assert.ok(HIKARI_DETAIL_PAGES.some(p => p.id === id), 'linked detail page exists: ' + id);
  }
  // Services without a detail page (So-net, eo, commufa) must not be linked as detail pages.
  for (const id of ['sonet-hikari', 'eo-hikari', 'commufa-hikari']) {
    assert.ok(!linked.includes(id), 'no detail link for ' + id);
  }
  // The funnel targets are all linked.
  for (const id of ['nuro-hikari', 'gmo-hikari', 'au-hikari', 'docomo-hikari']) {
    assert.ok(linked.includes(id), 'funnel detail linked: ' + id);
  }
  assert.ok(html.includes('href="/guides/hikari-guide/"'), 'guide -> hikari-guide');
  assert.ok(html.includes('href="/hikari/"'), 'guide -> hikari list');
});

test('hikari-single-guide prices come from the checked hikari catalog, nothing invented', () => {
  // Mansion prices quoted in the guide must equal the catalog values.
  for (const id of ['docomo-hikari', 'softbank-hikari', 'rakuten-hikari', 'biglobe-hikari', 'nifty-hikari', 'gmo-hikari']) {
    assert.ok(html.includes(yen(service(id).mansion)), id + ' mansion price');
  }
  // SoftBank's announced 2026-12 revision is in the catalog cautions and in the guide.
  assert.ok(service('softbank-hikari').cautions.join('').includes('4,510円') && html.includes('4,510円'));
  // NURO mansion pricing is plan-dependent in the catalog facts and quoted as such.
  assert.ok(service('nuro-hikari').facts.join('').includes('基本料金4,180円') && html.includes('ホームゲートウェイ料金550円'));
  // So-net is a 3-plan service in the catalog; all three mansion figures appear.
  const sonetFacts = service('sonet-hikari').facts.join('');
  for (const price of ['3,400円', '4,895円', '5,995円']) {
    assert.ok(sonetFacts.includes(price) && html.includes(price), 'sonet ' + price);
  }
  // GMO contract terms come from the catalog facts.
  assert.ok(service('gmo-hikari').facts.join('').includes('契約期間の縛り・解約違約金なし'));
  assert.ok(html.includes('契約期間の縛り・解約違約金がない'));
  assert.ok(service('gmo-hikari').cautions.join('').includes('3,300円') && html.includes('3,300円'));
  // No measured speeds or cashback amounts (not in the catalog) are asserted.
  assert.doesNotMatch(html, /Gbps|実質無料/);
});

test('no banned definitive wording appears in the hikari-single guide', () => {
  for (const banned of ['最安', 'おすすめ', '必ず', 'イチオシ', '一番お得', 'No.1']) {
    assert.ok(!html.includes(banned), 'banned wording found: ' + banned);
  }
});
