import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const GUIDES = ['travel-budget', 'hotel-cancellation', 'lodging-tax'];
const guide = slug => content(`guides/${slug}/index.html`);
// Same pattern as scripts/verify-build.mjs, so every block here is also parsed there.
const structuredData = html => [...html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map(([, json]) => JSON.parse(json));
const updated = html => html.match(/更新 (\d{4}-\d{2}-\d{2})/)?.[1];

test('each travel guide links to the other two travel guides and to the planner', () => {
  for (const slug of GUIDES) {
    const html = guide(slug);
    for (const other of GUIDES.filter(s => s !== slug)) {
      assert.ok(html.includes(`href="/guides/${other}/"`), `${slug} -> ${other}`);
    }
    assert.ok(html.includes('href="/travel/#planner"'), slug);
  }
});

test('each travel guide has Article structured data that matches the visible page', () => {
  for (const slug of GUIDES) {
    const html = guide(slug);
    const data = structuredData(html);
    assert.ok(data.some(item => item['@type'] === 'BreadcrumbList'), slug);
    const article = data.find(item => item['@type'] === 'Article');
    assert.ok(article, slug);
    assert.equal(article['@context'], 'https://schema.org');
    assert.equal(article.headline, html.match(/<h1>([^<]+)<\/h1>/)[1], slug);
    assert.equal(article.description, html.match(/<meta name="description" content="([^"]+)">/)[1], slug);
    assert.equal(article.inLanguage, 'ja');
    assert.equal(article.mainEntityOfPage, `https://vivlica.com/guides/${slug}/`);
    // dateModified must be the update date shown to readers, not an invented publish date.
    assert.match(article.dateModified, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(article.dateModified, updated(html), slug);
    assert.equal(article.publisher?.name, 'Vivlica');
  }
});

test('lodging tax guide is re-checked before the Tokyo rate change on 2027-04-01', () => {
  // Tokyo moves to 3% on 2027-04-01. From 2027-03-01 this fails until the guide is
  // re-checked against the official pages and its update date is moved forward.
  const reviewFrom = '2027-03-01';
  const today = new Date().toISOString().slice(0, 10);
  if (today < reviewFrom) return;
  assert.ok(updated(guide('lodging-tax')) >= reviewFrom, '宿泊税ガイドを東京都の2027-04-01の税率変更に合わせて見直し、更新日を進めてください');
});
