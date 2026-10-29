import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { hotelQuote, toggleHotel } from '../src/travel/hotelComparison.js';
import { importTravelAds, importTravelAdDirectory } from '../scripts/import-travel-ad.mjs';

const original = await readFile(new URL('../src/travel/ads/rakuten-hotel-126.html', import.meta.url), 'utf8');
// Synthetic fixtures only; never inserted into the repository's real catalog.
const second = original.replaceAll('126', '127').replaceAll('ホテル法華クラブ函館', 'テスト用函館旅館');

test('comparison selection toggles and never exceeds four facilities', () => {
  let selected = [];
  for (const id of ['a', 'b', 'c', 'd', 'e']) selected = toggleHotel(selected, id);
  assert.deepEqual(selected, ['a', 'b', 'c', 'd']);
  selected = toggleHotel(selected, 'b');
  assert.deepEqual(toggleHotel(selected, 'e'), ['a', 'c', 'd', 'e']);
});

test('quotes compare all-night totals with the same people, room and night counts', () => {
  const trip = { nights: 2, travelers: 4, rooms: 2 };
  assert.deepEqual(hotelQuote('80000', trip), { total: 80000, perPerson: 20000, perRoomNight: 20000 });
  for (const value of ['', '-100', '0', '12.5', '1000000000', 'Infinity', undefined]) assert.equal(hotelQuote(value, trip), null);
  assert.equal(hotelQuote('80000', { ...trip, nights: 0 }), null);
  assert.equal(hotelQuote('80000', { ...trip, travelers: 0 }), null);
});

test('directory import registers all nested materials once and validates the batch before writes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hotel-batch-'));
  const source = join(root, 'source'), destination = pathToFileURL(join(root, 'registered') + '/');
  try {
    await mkdir(join(source, 'nested'), { recursive: true });
    await writeFile(join(source, 'one.html'), original);
    await writeFile(join(source, 'nested', 'two.html'), second);
    const result = await importTravelAdDirectory(source, { directory: destination });
    assert.equal(result.length, 2);
    assert.ok(result.every(ad => ad.status === 'added'));
    assert.equal((await importTravelAdDirectory(source, { directory: destination })).every(ad => ad.status === 'unchanged'), true);
    const index = await readFile(new URL('index.json', destination), 'utf8');
    await assert.rejects(importTravelAds([second.replace('テスト用', '変更用'), '<script>bad</script>'], { directory: destination, replace: true }));
    assert.equal(await readFile(new URL('index.json', destination), 'utf8'), index);
    assert.equal(await readFile(new URL('rakuten-hotel-127.html', destination), 'utf8'), second);
    await assert.rejects(importTravelAds([original, original.replace('ホテル法華クラブ函館', '別の函館ホテル')], { directory: destination, replace: true }));
    assert.equal(await readFile(new URL('index.json', destination), 'utf8'), index);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('comparison renders named columns and common-condition guidance without inventing quotes', async () => {
  const { createServer } = await import('vite');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { default: HotelComparison } = await vite.ssrLoadModule('/src/travel/HotelComparison.jsx');
    const html = renderToStaticMarkup(createElement(HotelComparison, { hotels: [{ id: 'one', name: 'テスト旅館A' }, { id: 'two', name: 'テスト旅館B' }], nights: 2, travelers: 4, rooms: 2, depart: '2026-11-01', checkout: '2026-11-03', onRemove() {} }));
    for (const expected of ['テスト旅館A', 'テスト旅館B', '2/4件', '大人4名', '2室', '1室1泊あたり', 'キャンセル条件', '手入力', '未入力']) assert.ok(html.includes(expected), expected);
    assert.ok(!html.includes('value="80000"'));
    assert.ok(!html.includes('最安'));
  } finally { await vite.close(); }
});
