import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pageId, validViewEvent } from '../src/shared/outboundSchema.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const guide = () => content('guides/shinkansen-reservation/index.html');
const LINKS_TO = ['travel-budget', 'hotel-cancellation', 'long-weekends', 'expressway-holiday'];
const LINKED_FROM = ['long-weekends', 'expressway-holiday'];
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];

test('shinkansen reservation guide is built, listed in the sitemap and linked with the other travel guides', () => {
  assert.match(content('vite.config.js'), /'guide-shinkansen-reservation': fileURLToPath\(new URL\('\.\/guides\/shinkansen-reservation\/index\.html'/);
  assert.ok(content('public/sitemap.xml').includes('<loc>https://vivlica.com/guides/shinkansen-reservation/</loc>'));
  const html = guide();
  assert.match(html, /rel="canonical" href="https:\/\/vivlica\.com\/guides\/shinkansen-reservation\/"/);
  assert.ok(html.includes('href="/travel/#planner"'));
  assert.match(html, /<title>[^<]*新幹線[^<]*<\/title>/);
  for (const slug of LINKS_TO) assert.ok(html.includes(`href="/guides/${slug}/"`), `shinkansen-reservation -> ${slug}`);
  for (const slug of LINKED_FROM) assert.ok(content(`guides/${slug}/index.html`).includes('href="/guides/shinkansen-reservation/"'), `${slug} -> shinkansen-reservation`);
});

test('shinkansen reservation guide has its own page ID so views are measured', () => {
  assert.equal(pageId('/guides/shinkansen-reservation/'), 'guide-shinkansen-reservation');
  assert.equal(validViewEvent({ event: 'view', page: 'guide-shinkansen-reservation' }), true);
});

test('shinkansen reservation guide has Article structured data that matches the visible page', () => {
  const html = guide();
  const data = structuredData(html);
  assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'));
  const article = data.find(item => item['@type'] === 'Article');
  assert.ok(article);
  assert.equal(article['@context'], 'https://schema.org');
  assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1]);
  assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert.equal(article.inLanguage, 'ja');
  assert.equal(article.mainEntityOfPage, 'https://vivlica.com/guides/shinkansen-reservation/');
  assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(article.dateModified, updated(html));
  assert.equal(article.publisher?.name, 'Vivlica');
});

test('shinkansen reservation guide states the sale rule, marks the table as calculated and cites official pages only', () => {
  const html = guide();
  assert.ok(html.includes('1か月前（前月の同じ日）の午前10時'));
  // The date table is computed from the rule, so the page must say so.
  assert.ok(html.includes('から数えた日付です'));
  assert.ok(html.includes('JRが年末年始用に別の日付を発表したものではありません'));
  // 12/31 has no same day in the previous month, so it goes on sale on 12/1.
  assert.match(html, /<td>2026年12月31日（木）<\/td><td>12月1日（火）<\/td>/);
  assert.match(html, /<td>2026年12月26日（土）<\/td><td>11月26日（木）<\/td>/);
  assert.match(html, /<td>2026年12月20日（日）<\/td><td>11月20日（金）<\/td><td>11月13日（金）<\/td>/);
  assert.equal((html.match(/<tr><td>20\d\d年/g) || []).length, 23);
  for (const source of [
    'https://railway.jr-central.co.jp/nozomi/',
    'https://secure.okbiz.jp/eki-net/faq/show/1718',
    'https://secure.okbiz.jp/eki-net/faq/show/1586',
    'https://www.jr-odekake.net/goyoyaku/e5489/reservation/',
    'https://smart-ex.jp/reservation/useful/pre_time/',
  ]) assert.ok(html.includes(`href="${source}"`), source);
  assert.doesNotMatch(html, /jr-group\.jp/);
  // Fares and discount rates are not published here.
  assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /[円％%]/);
});

test('shinkansen reservation guide leads to the planner without numbers or ad code', () => {
  const html = guide();
  const bridge = html.indexOf('<h2>新幹線の日程が決まったら、宿泊費の上限を計算する</h2>');
  const end = html.indexOf('</article>');
  assert.ok(bridge > 0 && end > bridge);
  const section = html.slice(bridge, end);
  assert.match(section, /href="\/travel\/#planner"/);
  assert.match(section, /PR・広告/);
  assert.doesNotMatch(section.replace(/<[^>]*>/g, ''), /[0-9０-９]/);
  assert.doesNotMatch(html, /a8\.net|a8mat=/);
});

test('shinkansen reservation guide is re-checked once the 2026 year-end period has passed', () => {
  // From 2027-01-12 this fails until the table is replaced (or the page retired)
  // and the update date is moved forward.
  const reviewFrom = '2027-01-12';
  const today = new Date().toISOString().slice(0, 10);
  if (today < reviewFrom) return;
  assert.ok(updated(guide()) >= reviewFrom, '年末年始が過ぎたら、発売日の表を次の繁忙期に差し替えるか、ページを見直して更新日を進めてください');
});
