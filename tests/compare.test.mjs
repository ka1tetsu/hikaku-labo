import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cleanTitle, deriveProductQuery, extractModelCodes, matchScore, normalizeRakutenOffer, normalizeYahooOffer, rankOffers, summarizeOffers } from '../src/shared/priceCompare.js';
import { MERCHANTS, storeLink, storeLinks } from '../src/shared/merchants.js';
import { validOutboundEvent } from '../src/shared/outboundSchema.js';
import handler, { compareParams, wrapYahoo } from '../api/compare.js';

test('store listing titles become clean cross-store search phrases', () => {
  assert.equal(cleanTitle('【楽天1位】ソニー WH-1000XM5 送料無料'), 'ソニー WH-1000XM5');
  assert.deepEqual(extractModelCodes('パナソニック NA-LX129CL-W 12kg'), ['NA-LX129CL-W']);
  assert.deepEqual(extractModelCodes('Bluetooth5.3 USB-C 256GB'), []);
  assert.equal(deriveProductQuery('【楽天1位】ソニー ワイヤレスヘッドホン WH-1000XM5 ブラック 送料無料'), 'ソニー WH-1000XM5');
  assert.equal(deriveProductQuery('ワイヤレスイヤホン Bluetooth5.3 高音質 防水'), 'ワイヤレスイヤホン Bluetooth5.3 高音質');
});

test('model numbers decide whether two listings are the same product', () => {
  assert.ok(matchScore('ソニー WH-1000XM5 ブラック', 'SONY ヘッドホン WH-1000XM5(B)') >= 80);
  assert.ok(matchScore('ソニー WH-1000XM5', 'ソニー WH-1000XM4') < 80);
  assert.ok(matchScore('NA-LX129CL-W', 'Panasonic NA-LX129CL(W)') >= 80);
  assert.equal(matchScore('a', 'b', { referenceJan: '4548736132580', candidateJan: '4548736132580' }), 100);
  assert.equal(matchScore('a', 'a', { referenceJan: '4548736132580', candidateJan: '4900000000000' }), 0);
});

test('offers from both stores are ranked by real effective price, same product first', () => {
  const rakuten = normalizeRakutenOffer({ itemName: 'ソニー WH-1000XM5 B', itemPrice: 50000, pointRate: 10, postageFlag: 0, itemUrl: 'https://item.rakuten.co.jp/a/', affiliateUrl: 'https://hb.afl.rakuten.co.jp/x', shopName: 'A', mediumImageUrls: [{ imageUrl: 'https://img/x_ex=128x128' }] });
  assert.equal(rakuten.effectivePrice, 45000);
  assert.equal(rakuten.sponsored, true);
  const yahoo = normalizeYahooOffer({ name: 'SONY WH-1000XM5', price: 46000, point: { amount: 460 }, shipping: { code: 2 }, url: 'https://store.shopping.yahoo.co.jp/b/c.html', seller: { name: 'B' }, janCode: '4548736132580' }, wrapYahoo);
  assert.equal(yahoo.effectivePrice, 45540);
  assert.ok(yahoo.url.startsWith('https://ck.jp.ap.valuecommerce.com/'));
  const other = normalizeRakutenOffer({ itemName: 'ソニー WH-1000XM4', itemPrice: 30000, pointRate: 1, postageFlag: 1, itemUrl: 'https://item.rakuten.co.jp/c/' });
  const ranked = rankOffers([yahoo, other, rakuten], 'ソニー WH-1000XM5');
  assert.deepEqual(ranked.map(o => o.title), ['ソニー WH-1000XM5 B', 'SONY WH-1000XM5', 'ソニー WH-1000XM4']);
  const summary = summarizeOffers(ranked);
  assert.equal(summary.min, 45000);
  assert.equal(summary.stores, 2);
  assert.equal(summary.sameProduct, true);
});

test('compare API validates input and never wraps foreign URLs', async () => {
  assert.deepEqual(compareParams({ q: ' WH-1000XM5 ', jan: '12ab' }), { q: 'WH-1000XM5', ref: '', jan: '' });
  assert.equal(compareParams({ jan: '4548736132580' }).jan, '4548736132580');
  assert.equal(wrapYahoo('https://evil.example/x'), 'https://evil.example/x');
  let status = 0;
  const res = { setHeader() {}, status(s) { status = s; return this; }, json() { return this; } };
  await handler({ method: 'GET', query: {} }, res);
  assert.equal(status, 400);
  await handler({ method: 'POST', query: { q: 'x' } }, res);
  assert.equal(status, 405);
});

test('every store gets a search link; only configured partners are sponsored', () => {
  const links = storeLinks('WH-1000XM5');
  assert.ok(links.length >= 9);
  assert.ok(!links.some(l => l.id === 'apple' || l.id === 'iherb'));
  assert.ok(storeLinks('AirPods Pro').some(l => l.id === 'apple'));
  const byId = id => links.find(l => l.id === id);
  assert.match(byId('amazon').url, /tag=/);
  assert.ok(byId('rakuten').url.startsWith('https://hb.afl.rakuten.co.jp/'));
  assert.ok(byId('yahoo-shopping').url.startsWith('https://ck.jp.ap.valuecommerce.com/'));
  assert.equal(byId('qoo10').sponsored, false);
  const qoo10 = MERCHANTS.find(m => m.id === 'qoo10');
  const paid = storeLink(qoo10, 'x', { VITE_AFF_QOO10: 'https://px.a8.net/svt/ejp?a8mat=TEST&a8ejpredirect=' });
  assert.equal(paid.sponsored, true);
  assert.ok(paid.url.startsWith('https://px.a8.net/'));
  assert.equal(storeLink(qoo10, 'x', { VITE_AFF_QOO10: 'https://evil.example/?u=' }).sponsored, false);
  for (const m of MERCHANTS) {
    assert.ok(m.search('テスト').startsWith('https://'), m.id);
    assert.equal(validOutboundEvent({ event: 'outbound', section: 'products', merchant: m.id, placement: 'compare-store', sponsored: false }), true, m.id);
  }
});

test('compare page is built, linked and indexed', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  assert.match(read('vite.config.js'), /compare\/index\.html/);
  assert.match(read('public/sitemap.xml'), /\/compare\//);
  assert.match(read('src/components/ProductCard.jsx'), /\/compare\/\?q=/);
  assert.match(read('src/compare/ComparePage.jsx'), /「PR」表示のリンクはアフィリエイト広告/);
});
