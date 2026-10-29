import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SITE_SECTIONS, isActiveSection } from '../src/shared/siteDirectory.js';

const text = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('all public sections have one shared route and Tabler icons', () => {
  assert.deepEqual(SITE_SECTIONS.map(item => item.href), ['/', '/tools/', '/life/', '/travel/', '/database']);
  assert.equal(new Set(SITE_SECTIONS.map(item => item.id)).size, 5);
  for (const item of SITE_SECTIONS) {
    assert.equal(isActiveSection(item.id), true);
    assert.ok(existsSync(new URL('../public/icons/tabler/' + item.icon + '.svg', import.meta.url)));
  }
  assert.ok(text('public/icons/tabler/LICENSE').includes('MIT License'));
});

test('shared navigation supports screen readers and route-specific current item', () => {
  const header = text('src/shared/SiteHeader.jsx');
  assert.match(header, /aria-current=/);
  assert.match(header, /href="#main-content"/);
  assert.match(header, /aria-label="Vivlicaのサイト内ナビゲーション"/);
  for (const page of ['src/App.jsx', 'src/tools/ToolsPage.jsx', 'src/travel/TravelPage.jsx']) {
    assert.match(text(page), /id="main-content"/);
  }
});

test('home, tools and travel all load shared navigation and differentiated overlays', () => {
  assert.match(text('src/components/Header.jsx'), /SiteHeader active="products"/);
  assert.match(text('src/App.jsx'), /SectionDirectory/);
  assert.match(text('src/tools/ToolsPage.jsx'), /SiteHeader active="tools"/);
  assert.match(text('src/travel/TravelPage.jsx'), /SiteHeader active="travel"/);
  for (const filename of ['home-refresh', 'tools-refresh', 'travel-refresh']) {
    assert.ok(text('src/shared/' + filename + '.css').length > 300);
  }
});

test('advertisement content remains independent from navigation and visual refresh', () => {
  const travelPage = text('src/travel/TravelPage.jsx');
  assert.match(travelPage, /YAHOO_TRAVEL_A8_CREATIVES/);
  assert.match(travelPage, /PR・広告/);
  assert.match(text('src/tools/ToolsPage.jsx'), /A8_AD_PLACEMENTS/);
  assert.match(text('src/components/ProductCard.jsx'), /getOptimizedAffiliateRoute/);
});
