import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('hotel cancellation guide is built, listed in the sitemap and linked from the budget guide', () => {
  assert.match(content('vite.config.js'), /'guide-hotel-cancellation': fileURLToPath\(new URL\('\.\/guides\/hotel-cancellation\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/hotel-cancellation/</loc>'));
  assert.match(content('guides/travel-budget/index.html'), /href="\/guides\/hotel-cancellation\/"/);
  const guide = content('guides/hotel-cancellation/index.html');
  assert.match(guide, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/hotel-cancellation\/"/);
  assert.match(guide, /application\/ld\+json/);
  assert.match(guide, /href="\/guides\/travel-budget\/"/);
});

test('hotel cancellation guide cites its statistics and leads to the planner without ad code', () => {
  const guide = content('guides/hotel-cancellation/index.html');
  // Figures copied from the National Consumer Affairs Center release of 2023-09-20.
  for (const figure of ['2,306件', '4,488件', '51.9％']) assert.ok(guide.includes(figure), figure);
  assert.match(guide, /href="https:\/\/www\.kokusen\.go\.jp\/news\/data\/n-20230920_1\.html"/);
  assert.match(guide, /href="https:\/\/www\.kokusen\.go\.jp\/mimamori\/mj_mailmag\/mj-shinsen533\.html"/);
  const bridge = guide.indexOf('<h2>取り消しの条件まで含めて宿泊費の上限を決める</h2>');
  const end = guide.indexOf('</article>');
  assert.ok(bridge > 0 && end > bridge);
  const section = guide.slice(bridge, end);
  assert.match(section, /href="\/travel\/#planner"/);
  assert.match(section, /PR・広告/);
  // No invented prices, rates or availability in the bridge copy.
  assert.doesNotMatch(section, /[0-9０-９]/);
  assert.doesNotMatch(guide, /a8\.net|a8mat=/);
});
