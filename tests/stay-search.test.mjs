import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStaySearch, japanToday, sortStays } from '../src/travel/staySearch.js';
import handler, { findStays, normalizeStays } from '../api/stays.js';

const input = { place: '函館', checkin: '2099-11-01', checkout: '2099-11-03', adults: '2', breakfast: 'true', onsen: 'true' };
const search = parseStaySearch(input, '2099-10-01');
const env = { RAKUTEN_APP_ID: 'test-app', RAKUTEN_ACCESS_KEY: 'test-only-private-fixture', RAKUTEN_AFFILIATE_ID: 'public-test-affiliate' };
const basic = { hotelNo: 126, hotelName: 'テスト宿', address1: '北海道', address2: '函館市', reviewAverage: 4.5, reviewCount: 50, hotelInformationUrl: 'https://travel.rakuten.co.jp/HOTEL/126/126.html' };
const body = { hotels: [{ hotel: [
  { hotelBasicInfo: basic },
  { roomInfo: [{ roomBasicInfo: { roomClass: 'twin', planId: 123, planName: '朝食付き', roomName: 'ツイン', withBreakfastFlag: 1, withDinnerFlag: 0, reserveUrl: 'https://hb.afl.rakuten.co.jp/hgc/test/?pc=example' } }, { dailyCharge: { stayDate: input.checkin, total: 24000, rakutenCharge: 12000, chargeFlag: 0 } }] },
] }] };

test('stay search validates exact dates, JST, bounds and rejects ambiguous query arrays', () => {
  assert.equal(japanToday(new Date('2026-10-27T16:00:00Z')), '2026-10-28');
  assert.equal(search.place, '函館');
  for (const patch of [ { place: 'a' }, { adults: ['2'] }, { adults: '2.5' }, { adults: '11' }, { checkin: '2099-02-31' }, { checkin: '2099-09-30' }, { checkout: input.checkin }, { checkout: '2099-12-02' }, { onsen: ['true'] }, { breakfast: 'yes' } ]) assert.equal(parseStaySearch({ ...input, ...patch }, '2099-10-01'), null, JSON.stringify(patch));
});

test('vacancy normalization retains first-night total without multiplying nights or people', () => {
  const [offer] = normalizeStays(body, search);
  assert.equal(offer.firstNightTotal, 24000);
  assert.equal(offer.breakfast, true);
  assert.equal(offer.rating, 4.5);
  assert.equal(offer.sponsored, true);
  assert.equal(Object.hasOwn(offer, 'total'), false);
  assert.equal(normalizeStays(body, { ...search, checkin: '2099-11-02' })[0].firstNightTotal, null);
  const invalid = structuredClone(body);
  invalid.hotels[0].hotel[1].roomInfo[0].roomBasicInfo.reserveUrl = 'https://evil.example/path';
  invalid.hotels[0].hotel[0].hotelBasicInfo.hotelInformationUrl = 'javascript:alert(1)';
  assert.deepEqual(normalizeStays(invalid, search), []);
});

test('official keyword and vacancy requests preserve dates, adult count, filters and secret headers', async () => {
  const calls = [];
  const result = await findStays(search, { env, request: async (raw, options) => {
    const url = new URL(raw); calls.push({ url, options });
    return { ok: true, status: 200, text: JSON.stringify(url.pathname.includes('KeywordHotelSearch') ? { hotels: [{ hotel: [{ hotelBasicInfo: basic }] }] } : body) };
  } });
  assert.equal(result.status, 'ok'); assert.equal(result.offers.length, 1);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url.pathname, /KeywordHotelSearch\/20260731$/);
  assert.equal(calls[0].url.searchParams.get('keyword'), '函館');
  assert.match(calls[1].url.pathname, /VacantHotelSearch\/20170426$/);
  for (const [key, value] of Object.entries({ hotelNo: '126', checkinDate: input.checkin, checkoutDate: input.checkout, adultNum: '2', roomNum: '1', squeezeCondition: 'breakfast,onsen' })) assert.equal(calls[1].url.searchParams.get(key), value);
  assert.equal(calls[0].options.headers.accessKey, env.RAKUTEN_ACCESS_KEY);
  assert.equal(calls[0].options.headers.Origin, 'https://vivlica.com');
  assert.equal(calls[0].url.searchParams.has('accessKey'), false);
  assert.ok(!JSON.stringify(result).includes(env.RAKUTEN_ACCESS_KEY));
});

test('missing credentials and provider failures never masquerade as no vacancies or expose raw errors', async () => {
  let called = false;
  assert.equal((await findStays(search, { env: {}, request: async () => { called = true; } })).status, 'not_connected');
  assert.equal(called, false);
  for (const [status, text, expected] of [[403, 'HTTP_REFERRER_NOT_ALLOWED private-fixture', 'site_registration_rejected'], [429, 'quota', 'rate_limited'], [200, '{}', 'temporarily_unavailable']]) {
    const result = await findStays(search, { env, request: async () => ({ ok: status === 200, status, text }) });
    assert.equal(result.status, expected); assert.deepEqual(result.offers, []);
    assert.ok(!JSON.stringify(result).includes('private-fixture'));
  }
  assert.equal((await findStays(search, { env, request: async () => ({ status: 404, ok: false, text: '{}' }) })).status, 'ok');
});

test('ranking is explicit and puts missing price and rating after known values without mutating data', () => {
  const offers = [{ id: 'a', rating: 4.5, firstNightTotal: 30000 }, { id: 'b', rating: 4.5, firstNightTotal: 20000 }, { id: 'c', rating: null, firstNightTotal: null }];
  assert.deepEqual(sortStays(offers, 'rating').map(row => row.id), ['b', 'a', 'c']);
  assert.deepEqual(sortStays(offers, 'price').map(row => row.id), ['b', 'a', 'c']);
  assert.deepEqual(offers.map(row => row.id), ['a', 'b', 'c']);
});

test('API rejects invalid searches and methods before provider calls', async () => {
  let status, payload;
  const res = { setHeader() {}, status(value) { status = value; return this; }, json(value) { payload = value; return this; } };
  await handler({ method: 'POST', query: input }, res); assert.equal(status, 405);
  await handler({ method: 'GET', query: { ...input, adults: ['2', '4'] } }, res); assert.equal(status, 400); assert.equal(payload.error, 'invalid_search');
});

test('travel search form is rendered on the actual travel page with required search inputs', async () => {
  const { createServer } = await import('vite');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { default: TravelPage } = await vite.ssrLoadModule('/src/travel/TravelPage.jsx');
    const html = renderToStaticMarkup(createElement(TravelPage));
    for (const expected of ['id="stay-search"', 'チェックイン', 'チェックアウト', '大人の人数（1室）', '空室のある宿を探す', '朝食付き', '温泉あり']) assert.ok(html.includes(expected), expected);
    assert.ok(!html.includes('条件に合う宿泊プラン：'));
  } finally { await vite.close(); }
});
