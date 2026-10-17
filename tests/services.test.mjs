import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARD_SERVICES, HIKARI_SERVICES, HOKEN_SERVICES, SIM_SERVICES, SERVICE_IDS, CHECKED_AT } from '../src/services/catalog.js';
import { rankCards, rankHikari, rankSim, simPlanFor } from '../src/services/score.js';
import { affiliateEnvKey, serviceLink } from '../src/services/affiliate.js';
import { validOutboundEvent } from '../src/shared/outboundSchema.js';

test('every service has an official https source and unique id', () => {
  assert.match(CHECKED_AT, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Set(SERVICE_IDS).size, SERVICE_IDS.length);
  for (const s of [...SIM_SERVICES, ...HIKARI_SERVICES, ...CARD_SERVICES, ...HOKEN_SERVICES]) {
    assert.ok(s.officialUrl.startsWith('https://'), s.id);
    assert.ok(s.name && s.summary, s.id);
  }
  for (const s of SIM_SERVICES) {
    assert.ok(s.sourceUrl.startsWith('https://'), s.id);
    assert.ok(s.plans.every(p => p.price > 0 && Number.isInteger(p.price)), s.id);
  }
});

test('SIM ranking uses the cheapest plan that actually covers the data need', () => {
  assert.equal(simPlanFor(SIM_SERVICES.find(s => s.id === 'iijmio'), '3').price, 950);
  assert.equal(simPlanFor(SIM_SERVICES.find(s => s.id === 'linemo'), '30'), null);
  const unlimited = rankSim({ usage: 'unlimited' });
  assert.equal(unlimited[0].service.id, 'rakuten-mobile');
  const store = rankSim({ usage: '10', support: 'store' });
  assert.ok(store.slice(0, 3).every(r => r.service.store));
});

test('fiber ranking respects set discounts and service areas', () => {
  const kansaiAu = rankHikari({ housing: 'house', carrier: 'au', area: 'kansai' });
  assert.equal(kansaiAu[0].service.id, 'eo-hikari');
  assert.ok(kansaiAu.find(r => r.service.id === 'au-hikari').score < 30);
  assert.equal(rankHikari({ carrier: 'docomo', area: 'kanto' })[0].service.id, 'docomo-hikari');
});

test('card ranking applies age limits and ecosystems', () => {
  assert.notEqual(rankCards({ age: 'o40' })[0].service.id, 'jcb-w');
  assert.equal(rankCards({ ecosystem: 'rakuten' })[0].service.id, 'rakuten-card');
  assert.equal(rankCards({ priority: 'conveni' })[0].service.id, 'smbc-nl');
});

test('service links are sponsored only with an approved ASP tracking URL', () => {
  const iij = SIM_SERVICES.find(s => s.id === 'iijmio');
  assert.equal(affiliateEnvKey('rakuten-mobile'), 'VITE_AFF_URL_RAKUTEN_MOBILE');
  assert.deepEqual(serviceLink(iij, {}), { url: iij.officialUrl, sponsored: false });
  assert.equal(serviceLink(iij, { VITE_AFF_URL_IIJMIO: 'https://px.a8.net/svt/ejp?a8mat=TEST' }).sponsored, true);
  assert.equal(serviceLink(iij, { VITE_AFF_URL_IIJMIO: 'https://evil.example/x' }).sponsored, false);
  for (const id of SERVICE_IDS) assert.equal(validOutboundEvent({ event: 'outbound', section: 'life', merchant: id, placement: 'sim-rank', sponsored: false }), true, id);
});

test('insurance page compares no insurance products and lists services without ranking', () => {
  const page = readFileSync(new URL('../src/services/ServicesPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /特定の保険商品の比較・推奨・募集は行いません/);
  assert.match(page, /五十音順/);
  assert.ok(!HOKEN_SERVICES.some(s => 'score' in s || 'rate' in s));
});
