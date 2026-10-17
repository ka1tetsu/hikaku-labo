import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clickCommands, cleanConversionRow, dayRange, jstDay, readStats, viewCommands, visitorHash } from '../api/_analytics.js';
import { validViewEvent } from '../src/shared/outboundSchema.js';
import { trafficSource } from '../src/shared/outboundClient.js';
import { parseConversionCsv, dailyCsv } from '../src/admin/report.js';
import track from '../api/track.js';
import stats from '../api/stats.js';

// In-memory stand-in for the Upstash REST pipeline endpoint.
function fakeRedis() {
  const db = new Map();
  const calls = [];
  const run = ([cmd, key, ...args]) => {
    if (cmd === 'HINCRBY') { const h = db.get(key) || new Map(); h.set(args[0], (h.get(args[0]) || 0) + Number(args[1])); db.set(key, h); return h.get(args[0]); }
    if (cmd === 'HSET') { const h = db.get(key) || new Map(); h.set(args[0], Number(args[1])); db.set(key, h); return 1; }
    if (cmd === 'HGETALL') return [...(db.get(key) || new Map())].flatMap(([k, v]) => [k, String(v)]);
    if (cmd === 'PFADD') { const s = db.get(key) || new Set(); s.add(args[0]); db.set(key, s); return 1; }
    if (cmd === 'PFCOUNT') return new Set([key, ...args].flatMap(k => [...(db.get(k) || [])])).size;
    if (cmd === 'EXPIRE') return 1;
    throw new Error('unexpected ' + cmd);
  };
  const fetchImpl = async (url, init) => {
    assert.ok(url.endsWith('/pipeline'));
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    const commands = JSON.parse(init.body);
    calls.push(commands);
    return { ok: true, json: async () => commands.map(c => ({ result: run(c) })) };
  };
  return { db, calls, fetchImpl };
}
const config = { url: 'https://example.upstash.io', token: 'test-token', salt: 'salt' };
const req = (ip, ua = 'Mozilla/5.0 (iPhone)') => ({ headers: { 'x-forwarded-for': ip, 'user-agent': ua } });

test('visitor hash is stable within a day, differs across days and never contains the IP', () => {
  const a = visitorHash(req('203.0.113.7'), '2026-10-17', 'salt');
  assert.equal(a, visitorHash(req('203.0.113.7'), '2026-10-17', 'salt'));
  assert.notEqual(a, visitorHash(req('203.0.113.7'), '2026-10-18', 'salt'));
  assert.notEqual(a, visitorHash(req('203.0.113.8'), '2026-10-17', 'salt'));
  assert.ok(!a.includes('203'));
  const stored = JSON.stringify(viewCommands({ page: 'sim', source: 'google' }, req('203.0.113.7'), config, '2026-10-17'));
  assert.ok(!stored.includes('203.0.113.7') && !stored.includes('iPhone'));
});

test('stats aggregate unique visitors, views, sources, clicks and conversions', async () => {
  const { fetchImpl } = fakeRedis();
  const { redis } = await import('../api/_analytics.js');
  const send = commands => redis(config, commands, fetchImpl);
  await send(viewCommands({ page: 'sim', source: 'google' }, req('1.1.1.1'), config, '2026-10-16'));
  await send(viewCommands({ page: 'sim-vs', source: 'internal' }, req('1.1.1.1'), config, '2026-10-16'));
  await send(viewCommands({ page: 'sim', source: 'x' }, req('2.2.2.2'), config, '2026-10-17'));
  await send(viewCommands({ page: 'home', source: 'direct' }, req('1.1.1.1'), config, '2026-10-17'));
  await send(clickCommands({ section: 'life', merchant: 'rakuten-mobile', placement: 'sim-vs', sponsored: true }, '2026-10-16'));
  await send(clickCommands({ section: 'life', merchant: 'rakuten-mobile', placement: 'sim-result', sponsored: false }, '2026-10-17'));
  const { conversionCommands } = await import('../api/_analytics.js');
  await send(conversionCommands([{ day: '2026-10-17', merchant: 'rakuten-mobile', conversions: 1, revenue: 2000 }], 'set'));
  await send(conversionCommands([{ day: '2026-10-17', merchant: 'rakuten-mobile', conversions: 1, revenue: 2000 }], 'set')); // re-import: no double count
  await send(conversionCommands([{ day: '2026-10-17', merchant: 'amazon', conversions: 2, revenue: 150 }], 'add'));

  const report = await readStats(config, dayRange('2026-10-16', '2026-10-17'), fetchImpl);
  assert.deepEqual(report.totals, { visitors: 3, views: 4, clicks: 2, conversions: 3, revenue: 2150 });
  // Same browser on two different days counts once per day (salt rotates daily).
  assert.deepEqual(report.daily.map(d => [d.day, d.visitors, d.views]), [['2026-10-16', 1, 2], ['2026-10-17', 2, 2]]);
  assert.deepEqual(report.pages.find(p => p.page === 'sim'), { page: 'sim', views: 2, visitors: 2 });
  const mobile = report.merchants.find(m => m.merchant === 'rakuten-mobile');
  assert.deepEqual(mobile, { merchant: 'rakuten-mobile', section: 'life', clicks: 2, sponsoredClicks: 1, conversions: 1, revenue: 2000 });
  assert.equal(report.sources.length, 4);
});

test('date helpers use Japan time and cap the range', () => {
  assert.equal(jstDay(new Date('2026-10-16T15:30:00Z')), '2026-10-17');
  assert.equal(dayRange('2026-01-01', '2026-12-31').length, 120);
  assert.deepEqual(dayRange('2026-02-27', '2026-03-01'), ['2026-02-27', '2026-02-28', '2026-03-01']);
});

test('view events accept only coarse traffic sources', () => {
  assert.equal(validViewEvent({ event: 'view', page: 'sim', src: 'google' }), true);
  assert.equal(validViewEvent({ event: 'view', page: 'sim' }), true);
  assert.equal(validViewEvent({ event: 'view', page: 'sim', src: 'https://www.google.com/search?q=secret' }), false);
  assert.equal(trafficSource('', 'hikaku-labo.vercel.app'), 'direct');
  assert.equal(trafficSource('https://hikaku-labo.vercel.app/sim/', 'hikaku-labo.vercel.app'), 'internal');
  assert.equal(trafficSource('https://www.google.co.jp/', 'hikaku-labo.vercel.app'), 'google');
  assert.equal(trafficSource('https://search.yahoo.co.jp/search?p=x', 'hikaku-labo.vercel.app'), 'yahoo');
  assert.equal(trafficSource('https://t.co/abc', 'hikaku-labo.vercel.app'), 'x');
  assert.equal(trafficSource('https://example.com/post', 'hikaku-labo.vercel.app'), 'referral');
});

test('conversion rows are validated and pasted reports are parsed', () => {
  assert.deepEqual(cleanConversionRow({ day: '2026-10-17', merchant: ' 楽天モバイル ', conversions: 1, revenue: 2000 }), { day: '2026-10-17', merchant: '楽天モバイル', conversions: 1, revenue: 2000 });
  for (const bad of [{ day: '2026-13-01', merchant: 'a', conversions: 1 }, { day: '2026-10-17', merchant: 'a|b', conversions: 1 },
    { day: '2026-10-17', merchant: 'a', conversions: -1 }, { day: '2026-10-17', merchant: 'x'.repeat(41), conversions: 1 },
    { day: '2026-10-17', merchant: 'a', conversions: 1.5 }]) assert.equal(cleanConversionRow(bad), null);
  const parsed = parseConversionCsv('日付,ショップ,件数,報酬\n2026/10/1,rakuten,3,"¥1,240"\n2026-10-02\tamazon\t1\t80\n\n2026-10-03,amazon,x,1');
  assert.deepEqual(parsed.rows, [
    { day: '2026-10-01', merchant: 'rakuten', conversions: 3, revenue: 1240 },
    { day: '2026-10-02', merchant: 'amazon', conversions: 1, revenue: 80 },
  ]);
  assert.deepEqual(parsed.errors, [5]);
  assert.match(dailyCsv([{ day: '2026-10-01', visitors: 1, views: 2, clicks: 0, conversions: 0, revenue: 0 }]), /^日付,訪問者数.*\n2026-10-01,1,2,0,0,0\n$/);
});

function response() {
  const res = { statusCode: 200, body: null, headers: {} };
  Object.assign(res, {
    setHeader(k, v) { res.headers[k] = v; }, status(s) { res.statusCode = s; return res; },
    json(p) { res.body = p; return res; }, end() { return res; },
  });
  return res;
}

test('stats API requires the admin token and the tracker stores aggregates only', async () => {
  const { db, fetchImpl } = fakeRedis();
  const saved = { fetch: globalThis.fetch, env: { ...process.env }, info: console.info };
  globalThis.fetch = fetchImpl;
  console.info = () => {};
  Object.assign(process.env, { KV_REST_API_URL: config.url, KV_REST_API_TOKEN: 'test-token', ADMIN_TOKEN: 'a-very-long-admin-token', POSTBACK_KEY: 'postback-key-0123456789' });
  try {
    const headers = { host: 'hikaku-labo.vercel.app', 'user-agent': 'Mozilla/5.0', 'x-forwarded-for': '198.51.100.1' };
    let res = response();
    await track({ method: 'POST', headers, body: { event: 'view', page: 'card', src: 'google' } }, res);
    assert.equal(res.statusCode, 204);
    res = response();
    await track({ method: 'POST', headers: { ...headers, 'user-agent': 'Googlebot/2.1' }, body: { event: 'view', page: 'card' } }, res);
    const keys = [...db.keys()];
    assert.ok(keys.every(k => /^hk:\d{4}-\d{2}-\d{2}:(views|src|uv|uv:card)$/.test(k)), keys.join());
    assert.equal(db.get(keys.find(k => k.endsWith(':views'))).get('card'), 1); // bot skipped

    res = response();
    await stats({ method: 'GET', headers: {}, query: {} }, res);
    assert.equal(res.statusCode, 401);
    res = response();
    await stats({ method: 'GET', headers: { authorization: 'Bearer a-very-long-admin-token' }, query: { days: '7' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.range.days, 7);
    assert.equal(res.body.totals.views, 1);

    res = response();
    await stats({ method: 'POST', headers: { authorization: 'Bearer a-very-long-admin-token' }, query: {}, body: { rows: [{ day: '2026-10-17', merchant: 'rakuten', conversions: 2, revenue: 300 }] } }, res);
    assert.deepEqual(res.body, { ok: true, saved: 1 });
    res = response();
    await stats({ method: 'POST', headers: { authorization: 'Bearer a-very-long-admin-token' }, query: {}, body: { rows: [{ day: 'x', merchant: 'rakuten', conversions: 2 }] } }, res);
    assert.equal(res.statusCode, 400);

    res = response();
    await stats({ method: 'GET', headers: {}, query: { postback: 'wrong', merchant: 'a8-x', amount: '500' } }, res);
    assert.equal(res.statusCode, 401);
    res = response();
    await stats({ method: 'GET', headers: {}, query: { postback: 'postback-key-0123456789', merchant: 'a8-x', amount: '500', day: '2026-10-17' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(db.get('hk:2026-10-17:rev-pb').get('a8-x'), 500);
  } finally {
    globalThis.fetch = saved.fetch;
    console.info = saved.info;
    for (const k of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'ADMIN_TOKEN', 'POSTBACK_KEY']) if (saved.env[k] === undefined) delete process.env[k]; else process.env[k] = saved.env[k];
  }
});

test('admin dashboard is private: noindex, disallowed in robots, absent from the sitemap', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  assert.match(read('admin/index.html'), /<meta name="robots" content="noindex,nofollow"\/>/);
  assert.match(read('public/robots.txt'), /Disallow: \/admin\//);
  assert.ok(!read('public/sitemap.xml').includes('/admin/'));
});
