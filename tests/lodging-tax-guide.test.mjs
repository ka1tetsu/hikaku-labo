import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('lodging tax guide is built, listed in the sitemap and linked from the budget guide', () => {
  assert.match(content('vite.config.js'), /'guide-lodging-tax': fileURLToPath\(new URL\('\.\/guides\/lodging-tax\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/lodging-tax/</loc>'));
  assert.match(content('guides/travel-budget/index.html'), /href="\/guides\/lodging-tax\/"/);
  const guide = content('guides/lodging-tax/index.html');
  assert.match(guide, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/lodging-tax\/"/);
  assert.match(guide, /application\/ld\+json/);
  assert.match(guide, /href="\/guides\/travel-budget\/"/);
});

test('lodging tax guide cites official sources for its tax amounts and leads to the planner without ad code', () => {
  const guide = content('guides/lodging-tax/index.html');
  // Amounts copied from the official municipal and MIC pages checked on 2026-10-21.
  for (const figure of ['10,000円以上15,000円未満は100円', '6,000円以上20,000円未満は400円', '20,000円以上は500円', '1人1日150円', '一泊は150円、日帰りは100円', '宿泊税は1,000円', '<strong>3％</strong>']) {
    assert.ok(guide.includes(figure), figure);
  }
  for (const source of [
    'https://www.tax.metro.tokyo.lg.jp/kazei/leisure/shuk/%EF%BC%92',
    'https://www.city.kyoto.lg.jp/gyozai/page/0000236942.html',
    'https://www.city.kyoto.lg.jp/gyozai/page/0000249302.html',
    'https://www.pref.osaka.lg.jp/o050040/zei/alacarte/osakafunoshukuhakushisetsunishukuhakusuruminasama.html',
    'https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/149767_20.html',
    'https://www.city.sapporo.jp/citytax/syurui/nyutou.html',
  ]) assert.ok(guide.includes(`href="${source}"`), source);
  const bridge = guide.indexOf('<h2>宿泊税・入湯税まで見込んで旅行予算を立てる</h2>');
  const end = guide.indexOf('</article>');
  assert.ok(bridge > 0 && end > bridge);
  const section = guide.slice(bridge, end);
  assert.match(section, /href="\/travel\/#planner"/);
  assert.match(section, /PR・広告/);
  // No invented prices, rates or availability in the bridge copy (tag names such as h2/h3 are not copy).
  assert.doesNotMatch(section.replace(/<[^>]*>/g, ''), /[0-9０-９]/);
  assert.doesNotMatch(guide, /a8\.net|a8mat=/);
});
