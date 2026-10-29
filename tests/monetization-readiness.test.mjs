import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { matchScore, normalizeRakutenOffer, rankOffers } from '../src/shared/priceCompare.js';
import { pageId, validViewEvent, validFunnelEvent, PAGE_IDS } from '../src/shared/outboundSchema.js';
import { AREA_PAGES, SIM_PAIRS } from '../src/services/pages.js';
import { wrapRakuten } from '../api/compare.js';
import { revenueReport } from '../scripts/revenue-report.mjs';
import { auditLive, auditMarkdown } from '../scripts/audit-live.mjs';

test('compatible parts and longer model codes cannot win the same-product ranking', () => {
  const reference = 'ソニー WH-1000XM5';
  const titles = ['WH-1000XM5 用 交換イヤーパッド', 'WH-1000XM5 保護ケース', 'WH-1000XM50 ヘッドホン'];
  for (const title of titles) assert.ok(matchScore(reference, title) < 80, title);
  assert.ok(matchScore(reference, 'SONY WH1000XM5 ヘッドホン 専用ケース付き') >= 80);
  assert.ok(matchScore('AirPods Pro', 'AirPods Pro 充電ケース') < 80);
  const offers = [...titles, reference].map((itemName, i) => normalizeRakutenOffer({ itemName, itemPrice: (i + 1) * 1000, itemUrl: 'https://item.rakuten.co.jp/test/' + i }));
  assert.equal(rankOffers(offers, reference)[0].title, reference);
  assert.equal(rankOffers(offers, reference).filter(offer => offer.sameProduct).length, 1);
});

test('price-comparison links retain public-ID tracking when the provider omits affiliateUrl', () => {
  const itemUrl = 'https://item.rakuten.co.jp/example/headphones/';
  const item = { itemName: 'WH-1000XM5', itemPrice: 40000, itemUrl };
  const offer = normalizeRakutenOffer(item, wrapRakuten);
  assert.equal(offer.sponsored, true);
  const url = new URL(offer.url);
  assert.equal(url.hostname, 'hb.afl.rakuten.co.jp');
  assert.equal(url.searchParams.get('pc'), itemUrl);
  assert.equal(normalizeRakutenOffer({ ...item, affiliateUrl: 'https://hb.afl.rakuten.co.jp/original' }, wrapRakuten).url, 'https://hb.afl.rakuten.co.jp/original');
  for (const unsafe of ['https://evil.example/', 'javascript:alert(1)', 'https://item.rakuten.co.jp.evil.example/', 'https://user:password@item.rakuten.co.jp/x']) assert.equal(wrapRakuten(unsafe), unsafe);
});

test('JAN-only requests reach Rakuten and return tracked offers without Yahoo credentials', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const { default: handler } = await import('./api/compare.js');
    const requests = [];
    globalThis.fetch = async url => {
      requests.push(new URL(url));
      return new Response(JSON.stringify({Items:[{Item:{itemName:'WH-1000XM5',itemPrice:40000,itemUrl:'https://item.rakuten.co.jp/test/product/'}}]}));
    };
    let body, status;
    const res = {setHeader(){},status(code){status=code;return this},json(value){body=value;return this}};
    await handler({method:'GET',query:{jan:'4548736132580'}},res);
    assert.equal(status,200);
    assert.equal(requests.length,1);
    assert.equal(requests[0].searchParams.get('keyword'),'4548736132580');
    assert.equal(body.sources.rakuten,'ok');
    assert.equal(body.offers[0].sponsored,true);
    assert.equal(new URL(body.offers[0].url).hostname,'hb.afl.rakuten.co.jp');
  `], { cwd: new URL('../', import.meta.url), env: { ...process.env, RAKUTEN_ACCESS_KEY: 'test-fixture', YAHOO_SHOPPING_CLIENT_ID: '' }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('all published landing pages are measured individually without accepting arbitrary paths', () => {
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const paths = [...sitemap.matchAll(/<loc>https:\/\/vivlica\.com([^<]*)<\/loc>/g)].map(match => match[1]);
  for (const path of [...paths, ...SIM_PAIRS.map(pair => pair.path), ...AREA_PAGES.map(page => page.path)]) {
    const page = pageId(path);
    assert.ok(page, path);
    assert.equal(validViewEvent({ event: 'view', page }), true, path);
  }
  assert.equal(new Set(Object.values(PAGE_IDS)).size, Object.keys(PAGE_IDS).length);
  for (const path of ['/sim/vs/private-search/', '/hikari/area/private/', '/guides/unknown/', '/sim/?secret=1', 'toString', '__proto__']) assert.equal(pageId(path), null);
  assert.equal(validViewEvent({ event: 'view', page: 'sim-vs' }), true); // old exports
});

test('guide handoffs are counted separately and produce actionable missing-handoff reports', () => {
  const timestamp = '2026-10-25T01:00:00Z';
  const view = page => ({ type: 'hikaku_view', page, timestamp });
  const report = revenueReport([
    view('guide-hotel-cancellation'), view('guide-lodging-tax'),
    { type: 'hikaku_funnel', page: 'guide-hotel-cancellation', action: 'guide_compare', timestamp },
  ]);
  assert.equal(report.pages.find(row => row.page === 'guide-hotel-cancellation').guideComparisons, 1);
  assert.equal(report.pages.find(row => row.page === 'guide-hotel-cancellation').selectorChanges, 0);
  assert.deepEqual(report.nextActions.filter(row => row.action === 'review_guide_next_step').map(row => row.page), ['guide-lodging-tax']);
  assert.equal(report.financials, null);
  assert.equal(validFunnelEvent({ event: 'funnel', page: 'guide-lodging-tax', action: 'guide_compare', keyword: 'private' }), false);
});

test('network failure leaves site, referral setup and profit unknown instead of diagnosing an outage', async () => {
  let requests = 0;
  const report = await auditLive({ fetcher: async () => { requests++; throw new Error('proxy connection denied'); } });
  assert.equal(requests, 1);
  assert.equal(report.auditStatus, 'incomplete');
  assert.equal(report.monetizationStatus, 'unknown');
  assert.equal(report.checks[0].passed, null);
  assert.equal(report.findings[0].code, 'audit_unreachable');
  assert.equal(report.findings.some(finding => finding.code === 'repair_product_search'), false);
  assert.match(auditMarkdown(report), /未接続・不明/);
});

test('HTTP 200 with empty price data and absent affiliate URLs is not monetization readiness', async () => {
  const fetcher = async url => {
    const { pathname } = new URL(url);
    if (pathname === '/api/track') return new Response('{"error":"invalid_event"}', { status: 400 });
    if (pathname === '/api/search') return new Response('{"Items":[{"Item":{"itemName":"WH-1000XM5"}}]}');
    if (pathname === '/api/compare') return new Response('{"sources":{"rakuten":"ok","yahoo":"disabled"},"offers":[]}');
    if (pathname === '/robots.txt') return new Response('Sitemap: https://site.example/sitemap.xml');
    if (pathname === '/sitemap.xml') return new Response('<loc>https://site.example/guides/travel-budget/</loc>');
    return new Response('<h1>Vivlica</h1><link rel="canonical" href="https://wrong.example/"><a href="https://official.example/">official</a>');
  };
  const report = await auditLive({ origin: 'https://site.example', fetcher });
  assert.equal(report.hardFailures, 0);
  assert.equal(report.auditStatus, 'complete');
  assert.equal(report.monetizationStatus, 'action_required');
  for (const code of ['product_referrals_missing', 'empty_price_comparison', 'review_canonical_origin', 'review_referral_placements']) assert.ok(report.findings.some(finding => finding.code === code), code);
  assert.match(auditMarkdown(report), /product_referrals_missing/);
});

test('complete provider and referral checks still leave actual profit unverified', async () => {
  const requests = [];
  const fetcher = async url => {
    const parsed = new URL(url), path = parsed.pathname;
    requests.push(parsed);
    if (path === '/api/track') return new Response('{"error":"invalid_event"}', { status: 400 });
    if (path === '/api/search') return new Response('{"Items":[{"Item":{"itemPrice":40000,"affiliateUrl":"https://hb.afl.rakuten.co.jp/test"}}]}');
    if (path === '/api/compare') return new Response('{"sources":{"rakuten":"ok","yahoo":"disabled"},"offers":[{"price":40000}]}');
    if (path === '/robots.txt') return new Response('Sitemap: https://site.example/sitemap.xml');
    if (path === '/sitemap.xml') return new Response('<loc>https://site.example/guides/travel-budget/</loc>');
    return new Response(`<h1>Vivlica</h1><link rel="canonical" href="https://site.example${path}"><a href="https://hb.afl.rakuten.co.jp/test">shop</a>`);
  };
  const report = await auditLive({ origin: 'https://site.example', fetcher });
  assert.equal(report.monetizationStatus, 'configured_not_verified');
  assert.deepEqual(report.findings, []);
  assert.equal(report.financials, null);
  assert.ok(requests.every(url => url.hostname === 'site.example'));
});

test('strict audit CLI fails actionable missing referrals even when every page responds', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import { resolve } from 'node:path';
    process.argv = [process.execPath, resolve('scripts/audit-live.mjs'), '--origin', 'https://site.example', '--require-monetization'];
    globalThis.fetch = async url => {
      const path = new URL(url).pathname;
      if (path === '/api/track') return new Response('{"error":"invalid_event"}', {status:400});
      if (path === '/api/search') return new Response('{"Items":[]}');
      if (path === '/api/compare') return new Response('{"sources":{"rakuten":"error","yahoo":"disabled"},"offers":[]}');
      if (path === '/robots.txt') return new Response('Sitemap: https://site.example/sitemap.xml');
      if (path === '/sitemap.xml') return new Response('<loc>https://site.example/guides/travel-budget/</loc>');
      return new Response('<h1>Vivlica</h1><link rel="canonical" href="https://site.example' + path + '">');
    };
    await import('./scripts/audit-live.mjs');
  `], { cwd: new URL('../', import.meta.url), env: { ...process.env, GITHUB_ACTIONS: 'false' }, encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.hardFailures, 0);
  assert.equal(report.monetizationStatus, 'action_required');
  assert.ok(report.findings.some(finding => finding.code === 'empty_product_search'));
});
