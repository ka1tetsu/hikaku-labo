import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildMallSearchLinks,
  buildYahooAffiliateUrl,
  cleanSearchKeyword,
  wrapWithRakutenAffiliate,
} from '../src/api.js';
import {
  PRODUCT_CATEGORIES,
  categoryFromPath,
  findCategoryByGenreId,
  resolveInitialView,
} from '../src/shared/productCategories.js';
import { DESTINATIONS, rakutenTravelAreaUrl } from '../src/travel/budget.js';
import { parseTrackEvent } from '../api/track.js';
import { normalizeSearchQuery } from '../api/search.js';
import { setHead, injectApp, buildSitemap } from '../scripts/prerender.mjs';

const text = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('every mall search link carries its affiliate tracking', () => {
  const links = Object.fromEntries(buildMallSearchLinks('ワイヤレスイヤホン').map(l => [l.id, l.url]));
  assert.match(links.rakuten, /^https:\/\/hb\.afl\.rakuten\.co\.jp\/hgc\//);
  assert.match(links.amazon, /[?&]tag=kuronekosanta-22/);
  assert.match(links.yahoo, /^https:\/\/ck\.jp\.ap\.valuecommerce\.com\/servlet\/referral\?sid=/);
  assert.match(buildYahooAffiliateUrl('x'), /^https:/);
});

test('home page never links to Rakuten search without affiliate wrapping', () => {
  // 以前は「主要モール」バーの楽天リンクが素の search.rakuten.co.jp で、成果が発生しなかった
  assert.doesNotMatch(text('src/App.jsx'), /href=\{`https:\/\/search\.rakuten\.co\.jp/);
});

test('cross-mall keywords drop promotional noise from Rakuten item names', () => {
  assert.equal(cleanSearchKeyword('【送料無料】【ポイント10倍】Apple iPhone 15 128GB'), 'Apple iPhone 15');
  assert.equal(cleanSearchKeyword('★クーポンで最大20%OFF★ パナソニック ドラム式洗濯機 NA-LX129CL'), 'パナソニック ドラム式洗濯機 NA-LX129CL');
  assert.ok(cleanSearchKeyword('【あす楽】').length > 0);
});

test('category genre ids are unique, numeric and not the previously wrong values', () => {
  const wrong = new Set(['101240', '501293', '201026', '213010', '216131', '100804', '568453']);
  assert.equal(new Set(PRODUCT_CATEGORIES.map(c => c.slug)).size, PRODUCT_CATEGORIES.length);
  assert.equal(new Set(PRODUCT_CATEGORIES.map(c => c.genreId)).size, PRODUCT_CATEGORIES.length);
  for (const c of PRODUCT_CATEGORIES) {
    assert.match(c.genreId, /^\d+$/);
    assert.ok(!wrong.has(c.genreId), `${c.label} uses an unrelated Rakuten genre`);
    assert.ok(c.guide.length >= 3 && c.related.length >= 3 && c.description.length > 40);
  }
});

test('URLs resolve to the same view on server and client', () => {
  assert.equal(categoryFromPath('/category/pc/').slug, 'pc');
  assert.equal(categoryFromPath('/category/pc').slug, 'pc');
  assert.equal(categoryFromPath('/category/unknown/'), null);
  assert.equal(resolveInitialView('/category/tv/').category.slug, 'tv');
  assert.deepEqual(resolveInitialView('/', '?keyword=カメラ'), { category: null, keyword: 'カメラ' });
  assert.equal(resolveInitialView('/', '?genreId=100026').category.slug, 'pc');
  assert.equal(findCategoryByGenreId('999'), null);
});

test('Rakuten Travel links cover all 47 prefectures and are affiliate-wrapped', () => {
  const slugs = DESTINATIONS.flatMap(d => d.prefectures.map(p => p.slug));
  assert.equal(slugs.length, 47);
  assert.equal(new Set(slugs).size, 47);
  assert.equal(rakutenTravelAreaUrl('kyoto'), 'https://travel.rakuten.co.jp/yado/kyoto/');
  assert.equal(rakutenTravelAreaUrl('../evil'), 'https://travel.rakuten.co.jp/');
  assert.match(wrapWithRakutenAffiliate(rakutenTravelAreaUrl('kyoto')), /^https:\/\/hb\.afl\.rakuten\.co\.jp\/hgc\/.+pc=https%3A%2F%2Ftravel\.rakuten\.co\.jp/);
});

test('click tracking accepts only allow-listed values', () => {
  assert.deepEqual(parseTrackEvent({ event: 'outbound', section: 'products', target: 'amazon', placement: 'card-cta', sponsored: true }),
    { type: 'outbound', section: 'products', target: 'amazon', placement: 'card-cta', sponsored: true });
  assert.equal(parseTrackEvent({ event: 'outbound', section: 'products', target: 'evil.com', sponsored: true }), null);
  assert.equal(parseTrackEvent({ event: 'outbound', section: 'x', target: 'amazon', sponsored: true }), null);
  assert.equal(parseTrackEvent({ event: 'outbound', section: 'travel', target: 'rakuten-travel', placement: '<script>', sponsored: true }).placement, 'unknown');
  // ITツール診断の旧形式も引き続き受け付ける
  assert.equal(parseTrackEvent({ event: 'outbound', serviceId: 'shopify', sponsored: false }).type, 'tools_outbound');
});

test('search proxy clamps inputs and no longer allows cross-origin use', () => {
  assert.deepEqual(normalizeSearchQuery({ keyword: ' a ', genreId: '100026', page: '500' }), { keyword: 'a', genreId: '100026', page: 100 });
  assert.equal(normalizeSearchQuery({ genreId: '1; drop' }).genreId, '');
  assert.equal(normalizeSearchQuery({ page: 'x' }).page, 1);
  assert.doesNotMatch(text('api/search.js'), /Access-Control-Allow-Origin', '\*'/);
});

test('unused paid-LLM proxy endpoints are not deployed', () => {
  const files = ['api/article.js', 'api/reviewSummary.js'];
  for (const f of files) assert.throws(() => text(f));
});

test('prerender helpers set per-page SEO head and inject markup safely', () => {
  const template = '<html><head><title>x</title><meta name="description" content="d" /><link rel="canonical" href="c" /><meta property="og:title" content="o" /></head><body><div id="root"></div></body></html>';
  const html = injectApp(setHead(template, {
    title: 'A&B', description: '説明"', canonical: 'https://e.x/category/pc/',
    structuredData: [{ name: '</script><b>' }],
  }), '<p>$& ok</p>');
  assert.match(html, /<title>A&amp;B<\/title>/);
  assert.match(html, /content="説明&quot;"/);
  assert.match(html, /href="https:\/\/e\.x\/category\/pc\/"/);
  assert.match(html, /property="og:title" content="A&amp;B"/);
  assert.doesNotMatch(html, /<\/script><b>/);
  assert.match(html, /<div id="root"><p>\$& ok<\/p><\/div>/);
  assert.match(buildSitemap(['https://e.x/'], '2026-10-16'), /<loc>https:\/\/e\.x\/<\/loc><lastmod>2026-10-16<\/lastmod>/);
});
