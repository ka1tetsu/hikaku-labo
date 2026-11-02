import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';

// Place at tests/expressway-holiday-guide.test.mjs
const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const guide = () => content('guides/expressway-holiday/index.html');
const LINKS_TO = ['travel-budget', 'hotel-cancellation', 'long-weekends'];
const LINKED_FROM = ['travel-budget', 'long-weekends'];
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];

test('expressway holiday guide is built, listed in the sitemap and linked with the other travel guides', () => {
  assert.match(content('vite.config.js'), /'guide-expressway-holiday': fileURLToPath\(new URL\('\.\/guides\/expressway-holiday\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/expressway-holiday/</loc>'));
  const html = guide();
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/expressway-holiday\/"/);
  assert.ok(html.includes('href="/travel/#planner"'));
  assert.match(html, /<title>[^<]*高速道路の休日割引[^<]*<\/title>/);
  for (const slug of LINKS_TO) assert.ok(html.includes(`href="/guides/${slug}/"`), `expressway-holiday -> ${slug}`);
  for (const slug of LINKED_FROM) assert.ok(content(`guides/${slug}/index.html`).includes('href="/guides/expressway-holiday/"'), `${slug} -> expressway-holiday`);
});

test('expressway holiday guide has its own page ID so views are measured', () => {
  assert.equal(pageId('/guides/expressway-holiday/'), 'guide-expressway-holiday');
  assert.equal(validViewEvent({ event: 'view', page: 'guide-expressway-holiday' }), true);
});

test('expressway holiday guide has Article structured data that matches the visible page', () => {
  const html = guide();
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/expressway-holiday/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('expressway holiday guide cites the NEXCO pages and lists the excluded dates', () => {
  const html = guide();
  // Dates read from the official calendar image on the NEXCO West page, checked 2026-11-03.
  for (const date of ['2026年12月26日', '2026年12月27日', '2027年1月1日', '2027年1月2日', '2027年1月3日', '2027年1月9日', '2027年1月10日', '2027年1月11日']) {
    assert.ok(html.includes(`<td>${date}</td>`), date);
  }
  assert.equal((html.match(/<td>適用除外<\/td>/g) || []).length, 8);
  assert.ok(html.includes('約30％割引'));
  for (const source of [
    'https://www.w-nexco.co.jp/etc/etc_info/etc_time/discount_holiday.html',
    'https://www.w-nexco.co.jp/etc/etc_info/etc_time/img/discount_holiday/2026_holiday_cl.jpg',
    'https://dc2.c-nexco.co.jp/etc/discount/etc/holiday/',
  ]) assert.ok(html.includes(`href="${source}"`), source);
  // The dates come from reading an image, so the page must say so.
  assert.ok(html.includes('目で見て読み取った'));
});

test('expressway holiday guide leads to the planner without numbers or ad code', () => {
  const html = guide();
  const bridge = html.indexOf('<h2>日程が決まったら、宿泊費の上限を計算する</h2>');
  const end = html.indexOf('</article>');
  assert.ok(bridge > 0 && end > bridge);
  const section = html.slice(bridge, end);
  assert.match(section, /href="\/travel\/#planner"/);
  assert.match(section, /PR・広告/);
  assert.doesNotMatch(section.replace(/<[^>]*>/g, ''), /[0-9０-９]/);
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('expressway holiday guide is re-checked once the 2026 year-end period has passed', () => {
  // From 2027-01-15 this fails until the page is re-checked against the 2027 NEXCO calendar
  // (or retired) and the update date is moved forward.
  const reviewFrom = '2027-01-15';
  const today = new Date().toISOString().slice(0, 10);
  if (today < reviewFrom) return;
  assert.ok(updated(guide()) >= reviewFrom, '年末年始が過ぎたら、NEXCOの最新の適用日カレンダーで見直し、更新日を進めてください');
});
