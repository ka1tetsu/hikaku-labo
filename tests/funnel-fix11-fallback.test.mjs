import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STORE_MERCHANTS, validOutboundEvent } from '../src/shared/outboundSchema.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const app = content('src/App.jsx');
const errorBox = app.slice(app.indexOf('className="error-box"'), app.indexOf('className="empty-state"'));
const searchLinks = content('src/components/ProductSearchLinks.jsx');

test('google is a valid products merchant for fallback click measurement', () => {
  assert.ok(STORE_MERCHANTS.includes('google'));
  assert.equal(validOutboundEvent({ event: 'outbound', section: 'products', merchant: 'google', placement: 'search-fallback', sponsored: false }), true);
  assert.equal(validOutboundEvent({ event: 'outbound', section: 'products', merchant: 'google', placement: 'search-fallback', sponsored: false, page: 'home' }), true);
  // Google fallback measurement is products-only; it must not leak into other sections.
  assert.equal(validOutboundEvent({ event: 'outbound', section: 'life', merchant: 'google', placement: 'search-fallback', sponsored: false }), false);
  assert.equal(validOutboundEvent({ event: 'outbound', section: 'travel', merchant: 'google', placement: 'search-fallback', sponsored: false }), false);
});

test('ProductSearchLinks measures its Google fallback links', () => {
  const fallbacks = searchLinks.match(/merchant: 'google', placement: 'search-fallback', sponsored: false/g) || [];
  assert.equal(fallbacks.length, 2, 'both Google links record a search-fallback click');
  // The sponsored mall links keep their existing measurement and PR labelling.
  assert.ok(searchLinks.includes("placement: 'search-direct', sponsored: true"));
  assert.ok(searchLinks.includes('rel="sponsored noopener noreferrer"'));
});

test('error box offers the measured mall search links as the API-failure fallback', () => {
  assert.ok(errorBox.includes('<ProductSearchLinks keyword={query || activeCategory?.label || \'\'} />'), 'error box reuses ProductSearchLinks');
  assert.ok(errorBox.includes('公式APIの商品情報を取得できませんでした'), 'failure wording stays explicit');
  assert.ok(errorBox.includes('もう一度読み込む'), 'retry action is preserved');
  assert.ok(errorBox.includes("merchant: 'google', placement: 'search-fallback', sponsored: false"), 'error box Google link is measured');
  // The standalone instance must not duplicate the one inside the error box.
  assert.ok(app.includes('hasSearched && !error && <ProductSearchLinks'), 'standalone links are hidden while the error box is shown');
});
