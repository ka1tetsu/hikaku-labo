import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HIKARI_DETAIL_PAGES } from '../src/services/pages.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = content('src/services/StaticPages.jsx');
const hikariArea = source.slice(source.indexOf('export function HikariAreaPage'), source.indexOf('// Per-service detail pages'));

test('hikari area pages link listed service names to their detail pages', () => {
  // The area service list is the regional entry point into per-service detail
  // pages: names link only when a detail page exists (eo光・コミュファ光・
  // So-net光 have none and stay plain text).
  assert.ok(hikariArea.includes('HIKARI_DETAIL_PAGES.some(p => p.id === s.id)'), 'link is gated on detail page existence');
  assert.ok(hikariArea.includes('href={`/hikari/${s.id}/`}'), 'name links to the detail page');
  assert.ok(content('src/services/services.css').includes('.sv-service-link{'), 'link style is not scoped to tables only');
});

test('hikari guide links every revenue detail page it names, including GMO', () => {
  const html = content('guides/hikari-guide/index.html');
  for (const id of ['docomo-hikari', 'au-hikari', 'nuro-hikari', 'gmo-hikari']) {
    assert.ok(HIKARI_DETAIL_PAGES.some(p => p.id === id), `${id} has a detail page`);
    assert.ok(html.includes(`href="/hikari/${id}/"`), `guide -> ${id}`);
  }
  // GMO has no smartphone set discount; the guide must say so, not imply one.
  assert.ok(html.includes('GMOとくとくBB光</a>はスマホとのセット割がなく'));
});

test('category top pick links to the service detail page when one exists', () => {
  const page = content('src/services/ServicesPage.jsx');
  assert.ok(page.includes('detailPath(category, top.service.id)'), 'top pick resolves the detail path');
  assert.ok(page.includes('の詳細（{DETAIL_LABELS[category]}）を見る'), 'top pick detail link label matches the ranking rows');
});
