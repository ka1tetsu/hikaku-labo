import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const guide = () => content('guides/long-weekends/index.html');
const OTHER_GUIDES = ['travel-budget', 'hotel-cancellation', 'lodging-tax'];
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];

test('long weekends guide is built, listed in the sitemap and linked with the other travel guides', () => {
  assert.match(content('vite.config.js'), /'guide-long-weekends': fileURLToPath\(new URL\('\.\/guides\/long-weekends\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/long-weekends/</loc>'));
  const html = guide();
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/long-weekends\/"/);
  assert.ok(html.includes('href="/travel/#planner"'));
  for (const slug of OTHER_GUIDES) {
    assert.ok(html.includes(`href="/guides/${slug}/"`), `long-weekends -> ${slug}`);
    assert.ok(content(`guides/${slug}/index.html`).includes('href="/guides/long-weekends/"'), `${slug} -> long-weekends`);
  }
});

test('long weekends guide has Article structured data that matches the visible page', () => {
  const html = guide();
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/long-weekends/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('long weekends guide cites the Cabinet Office and NAOJ for its dates', () => {
  const html = guide();
  // Dates copied from the Cabinet Office holiday page and the NAOJ 2027 almanac (published 2026-02-02), checked 2026-10-22.
  for (const figure of ['1月11日', '3月21日', '3月22日', '5月3日〜5日', '7月19日', '9月20日', '9月23日', '10月11日', '17日が休みになります', '1月・3月・7月・9月・10月の5回']) {
    assert.ok(html.includes(figure), figure);
  }
  for (const source of [
    'https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html',
    'https://eco.mtk.nao.ac.jp/koyomi/yoko/2027/rekiyou271.html',
    'https://eco.mtk.nao.ac.jp/koyomi/yoko/2026/rekiyou261.html',
  ]) assert.ok(html.includes(`href="${source}"`), source);
});

test('long weekends guide leads to the planner without numbers or ad code', () => {
  const html = guide();
  const bridge = html.indexOf('<h2>連休の日程が決まったら、宿泊費の上限を計算する</h2>');
  const end = html.indexOf('</article>');
  assert.ok(bridge > 0 && end > bridge);
  const section = html.slice(bridge, end);
  assert.match(section, /href="\/travel\/#planner"/);
  assert.match(section, /PR・広告/);
  // No invented prices, rates or availability in the bridge copy (tag names such as h2/h3 are not copy).
  assert.doesNotMatch(section.replace(/<[^>]*>/g, ''), /[0-9０-９]/);
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('long weekends guide is re-checked when the 2028 holidays are published', () => {
  // The Cabinet Office posts the 2028 holidays in February 2027. From 2027-02-01 this fails until
  // the table is re-checked against the official pages and the update date is moved forward.
  const reviewFrom = '2027-02-01';
  const today = new Date().toISOString().slice(0, 10);
  if (today < reviewFrom) return;
  assert.ok(updated(guide()) >= reviewFrom, '内閣府が2028年の祝日を載せたら、連休ガイドの表を見直して更新日を進めてください');
});
