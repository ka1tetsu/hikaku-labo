import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseProductRequest, pickProducts } from '../src/shared/productAdvisor.js';
import { adviseTools, parseToolsRequest } from '../src/shared/toolsAdvisor.js';
import { routeQuery, siteReply } from '../src/shared/siteConcierge.js';
import { searchFilters } from '../api/search.js';

const now = new Date('2026-10-17T10:00:00+09:00');
const talk = (section, ...messages) => {
  let state = {};
  return messages.map(text => { const r = siteReply(text, state, { section, now }); state = r.state; return r.message; });
};

test('concrete shopping requests become exact search conditions', () => {
  const r = parseProductRequest('1万円以下で音質のいいワイヤレスイヤホンが欲しい');
  assert.equal(r.keyword, '高音質 ワイヤレスイヤホン');
  assert.equal(r.maxPrice, 10000);
  assert.deepEqual([parseProductRequest('五千円〜1万円の財布').minPrice, parseProductRequest('五千円〜1万円の財布').maxPrice], [5000, 10000]);
  assert.equal(parseProductRequest('安いノートパソコン').sort, '+itemPrice');
  const kettle = parseProductRequest('高評価の電気ケトル 送料無料');
  assert.equal(kettle.sort, '-reviewAverage');
  assert.equal(kettle.freeShipping, true);
});

test('vague shopping wishes map to concrete starting points', () => {
  const gift = parseProductRequest('母の日のプレゼント 3000円くらい');
  assert.equal(gift.need.label, '母の日・お母さんへのギフト');
  assert.equal(gift.keyword, '母の日 ギフト');
  assert.ok(gift.minPrice < 3000 && gift.maxPrice > 3000);
  assert.ok(parseProductRequest('在宅ワークを快適にしたい').need.keywords.includes('オフィスチェア'));
});

test('product picks never exceed the requested price range', () => {
  const items = [1000, 5000, 12000, 9000].map((p, i) => ({ itemCode: String(i), itemPrice: p, effectivePrice: p, reviewCount: 10, reviewAverage: 4, isFreeShipping: i !== 3 }));
  assert.deepEqual(pickProducts(items, { maxPrice: 10000, minPrice: 2000 }).map(i => i.itemPrice), [5000, 9000]);
  assert.deepEqual(pickProducts(items, { maxPrice: 10000, freeShipping: true }).map(i => i.itemPrice), [1000, 5000]);
});

test('web tool requests reuse the source-backed ranking', () => {
  const shop = adviseTools(parseToolsRequest('ネットショップを無料で始めたい'));
  assert.equal(shop.category, 'shop');
  assert.equal(shop.budget, 'free');
  assert.equal(shop.services[0].id, 'base');
  assert.match(shop.selectorUrl, /^\/tools\/\?category=shop&budget=free/);
  assert.equal(parseToolsRequest('月3000円以内でWordPress').budget, 'standard');
  assert.equal(parseToolsRequest('ブログで副業したい').category, 'wordpress');
  assert.ok(adviseTools(parseToolsRequest('何かツールを教えて')).needsCategory);
});

test('one concierge routes travel, shopping and web tool questions', () => {
  assert.equal(routeQuery('パリ').domain, 'travel');
  assert.equal(routeQuery('週末に行ける温泉旅行').domain, 'travel');
  assert.equal(routeQuery('1万円以下のワイヤレスイヤホン').domain, 'products');
  assert.equal(routeQuery('旅行グッズが欲しい').domain, 'products');
  assert.equal(routeQuery('イタリア製の財布').domain, 'products');
  assert.equal(routeQuery('ネットショップを無料で始めたい').domain, 'tools');
  assert.equal(routeQuery('もっと安く', { previous: 'products' }).domain, 'products');
  assert.equal(routeQuery('おすすめは？', { section: 'tools' }).domain, 'tools');
});

test('follow-ups refine the same topic and switching topics works mid-conversation', () => {
  const [first, cheaper, more, trip, shop] = talk('products', '1万円以下のワイヤレスイヤホン', 'もっと安く', '他の商品も見たい', '冬にオーロラを見たい', 'ネットショップを無料で始めたい');
  assert.equal(first.productQuery.maxPrice, 10000);
  assert.equal(cheaper.productQuery.maxPrice, 7000);
  assert.equal(cheaper.productQuery.sort, '+itemPrice');
  assert.equal(more.productQuery.page, 2);
  assert.equal(trip.domain, 'travel');
  assert.equal(trip.cards[0].id, 'reykjavik');
  assert.equal(shop.toolCards[0].id, 'base');
  const [vague] = talk('site', 'なんかいい感じのやつ');
  assert.ok(vague.chips.length >= 3);
});

test('product search proxy only forwards whitelisted filters', () => {
  assert.deepEqual(searchFilters({ minPrice: '2000', maxPrice: '10000', sort: '+itemPrice', postageFlag: '1' }), { minPrice: '2000', maxPrice: '10000', sort: '+itemPrice', postageFlag: '1' });
  assert.deepEqual(searchFilters({ minPrice: '-5', maxPrice: 'abc', sort: 'DROP', postageFlag: 'yes' }), { minPrice: '', maxPrice: '', sort: '', postageFlag: '' });
});

test('the concierge is available on every public page', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  assert.match(read('src/App.jsx'), /<SiteConcierge section="products"/);
  assert.match(read('src/tools/ToolsPage.jsx'), /<SiteConcierge section="tools"/);
  assert.match(read('src/travel/TravelPage.jsx'), /<SiteConcierge section="travel"/);
  for (const guide of ['guides/travel-budget/index.html', 'guides/website-tools/index.html']) assert.match(read(guide), /conciergeMount\.jsx/);
  assert.match(read('src/shared/SiteConcierge.jsx'), /lazy\(\(\) => import\('\.\/ConciergeChat\.jsx'\)\)/);
});

test('product keywords keep brands and specs but drop filler words', () => {
  assert.equal(parseProductRequest('ダイソンのドライヤー').keyword, 'ダイソン ドライヤー');
  assert.equal(parseProductRequest('米 10kg').keyword, '米 10kg');
  assert.equal(parseProductRequest('いやほん').keyword, 'イヤホン');
  assert.equal(parseProductRequest('ルンバみたいなやつ').keyword, 'ロボット掃除機');
  assert.equal(parseProductRequest('スマホの充電がすぐ切れる').keyword, 'モバイルバッテリー');
});

test('products page search and header use the concierge helpers', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  assert.match(read('src/App.jsx'), /parseProductRequest\(text\)/);
  assert.match(read('src/shared/SiteHeader.jsx'), /openConcierge\(\)/);
});
