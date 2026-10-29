import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inspectTravelAd, importTravelAd } from '../scripts/import-travel-ad.mjs';
import { validOutboundEvent } from '../src/shared/outboundSchema.js';

const original = await readFile(new URL('../src/travel/ads/rakuten-hotel-126.html', import.meta.url), 'utf8');

test('supplied hotel material automatically yields the exact facility, partner and destination', () => {
  const ad = inspectTravelAd(original);
  assert.equal(ad.name, 'ホテル法華クラブ函館');
  assert.equal(ad.hotelId, '126');
  assert.equal(ad.destinationId, 'hakodate');
  assert.equal(ad.affiliateId, '58dfeb5f.46f228d4.58dfeb60.45bb5a56');
  assert.equal(validOutboundEvent({ event: 'outbound', section: 'travel', merchant: 'rakuten-travel', placement: ad.id, sponsored: true }), true);
  const unnamedCity = original.replaceAll('ホテル法華クラブ函館', '都市名のないホテル');
  assert.throws(() => inspectTravelAd(unnamedCity), /--destination/);
  assert.equal(inspectTravelAd(unnamedCity, { destination: 'hakodate' }).destinationId, 'hakodate');
});

test('untrusted and mismatched HTML is rejected instead of published', () => {
  for (const html of [
    original + '<script>alert(1)</script>',
    original.replace('<img ', '<img onerror="alert(1)" '),
    original.replaceAll('https://hb.afl.rakuten.co.jp/', 'https://hb.afl.rakuten.co.jp.evil.example/'),
    original.replace('https://hbb.afl.rakuten.co.jp/', 'https://evil.example/'),
    original.replace('item_id=126', 'item_id=999'),
    original.replace('color:#000000', 'color:expression(alert(1))'),
    original.replace('margin:2px', 'background:url(https://evil.example/)'),
    original.replace('rel="nofollow sponsored noopener"', 'rel="nofollow"'),
    '<iframe src="https://example.com"></iframe>',
  ]) assert.throws(() => inspectTravelAd(html));
});

test('import preserves original bytes, avoids duplicates and requires explicit replacement', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'vivlica-ads-'));
  const directory = pathToFileURL(temporary + '/');
  try {
    const added = await importTravelAd(original, { directory });
    assert.equal(added.status, 'added');
    assert.equal(await readFile(new URL(added.id + '.html', directory), 'utf8'), original);
    assert.equal((await importTravelAd(original, { directory })).status, 'unchanged');
    const changed = original.replaceAll('ホテル法華クラブ函館', 'ホテル法華クラブ函館（掲載素材更新）');
    await assert.rejects(importTravelAd(changed, { directory }), /--replace/);
    assert.equal(await readFile(new URL(added.id + '.html', directory), 'utf8'), original);
    assert.equal((await importTravelAd(changed, { directory, replace: true })).status, 'replaced');
    const entries = JSON.parse(await readFile(new URL('index.json', directory), 'utf8'));
    assert.equal(entries.length, 1);
    assert.equal(entries[0].name, 'ホテル法華クラブ函館（掲載素材更新）');
    await assert.rejects(importTravelAd(original + '<script>x</script>', { directory, replace: true }));
    assert.equal(await readFile(new URL(added.id + '.html', directory), 'utf8'), changed);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test('rendered placement retains original HTML and only appears for Hakodate overnight stays', async () => {
  const { createServer } = await import('vite');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] }, logLevel: 'error' });
  try {
    const { default: HotelAds } = await vite.ssrLoadModule('/src/travel/HotelAds.jsx');
    const render = props => renderToStaticMarkup(createElement(HotelAds, props));
    const html = render({ destinationId: 'hakodate', nights: 2 });
    assert.ok(html.includes(original));
    assert.match(html, /PR・広告/);
    assert.equal(render({ destinationId: 'kyoto', nights: 2 }), '');
    assert.equal(render({ destinationId: 'hakodate', nights: 0 }), '');
    assert.equal(render({ destinationId: 'hakodate', nights: 2, disabled: true }), '');
    const { default: TravelPage } = await vite.ssrLoadModule('/src/travel/TravelPage.jsx');
    const previousWindow = globalThis.window;
    try {
      globalThis.window = { location: { search: '?destination=hakodate&nights=2' } };
      const page = renderToStaticMarkup(createElement(TravelPage));
      assert.equal(page.split(original).length - 1, 1);
      globalThis.window.location.search = '?destination=hakodate&nights=0';
      assert.ok(!renderToStaticMarkup(createElement(TravelPage)).includes(original));
      globalThis.window.location.search = '?destination=kyoto&nights=2';
      assert.ok(!renderToStaticMarkup(createElement(TravelPage)).includes(original));
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
    const tree = HotelAds({ destinationId: 'hakodate', nights: 2 });
    const ad = tree.props.children[2][0];
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, options) => { calls.push(JSON.parse(options.body)); return new Response('{}'); };
    try {
      ad.props.onClick({ target: { closest: () => null } });
      assert.equal(calls.length, 0);
      ad.props.onClick({ target: { closest: () => ({}) } });
      assert.equal(calls.length, 1);
      assert.equal(calls[0].placement, 'rakuten-hotel-126');
      assert.equal(validOutboundEvent(calls[0]), true);
    } finally { globalThis.fetch = originalFetch; }
  } finally { await vite.close(); }
});
