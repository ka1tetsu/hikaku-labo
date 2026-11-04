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

test('cards expose verified application details and GOLD U stays a separate paid product', () => {
  // (c) 全カードに申込条件等の details があり、年会費の行を必ず含む
  for (const s of CARD_SERVICES) {
    assert.ok(Array.isArray(s.details) && s.details.length >= 3, s.id);
    assert.ok(s.details.some(([label]) => label === '年会費'), s.id);
  }
  // (b) dカード GOLD U は通常版とは別商品：年会費は金額明記、年齢条件は maxAge で扱う
  const goldU = CARD_SERVICES.find(s => s.id === 'd-card-gold-u');
  assert.ok(goldU);
  assert.match(goldU.fee, /3,300円/);
  assert.equal(goldU.maxAge, 29);
  assert.equal(goldU.rate, 1.0);
  assert.ok(goldU.sourceUrl.startsWith('https://dcard.docomo.ne.jp/'));
  // 既存カードの相対順位は変えない（デフォルト条件での従来の並びを GOLD U を除いて維持）
  const order = rankCards({}).map(r => r.service.id).filter(id => id !== 'd-card-gold-u');
  assert.deepEqual(order, ['recruit-card', 'aupay-card', 'd-card', 'jcb-w', 'paypay-card', 'rakuten-card', 'smbc-nl']);
  // 40歳以上では申込対象外として大きく減点される
  assert.ok(rankCards({ age: 'o40' }).find(r => r.service.id === 'd-card-gold-u').score < 30);
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
  // 事実情報の整理表は五十音順の並びを維持し、Related から /life/ ハブへ導線を持つ
  assert.deepEqual(HOKEN_SERVICES.map(s => s.id), ['hoken-clinic', 'hokennomadoguchi', 'hoken-minaoshi-lab']);
  assert.match(page, /sv-hoken-table/);
  assert.match(page, /hoken: \[\['\/life\/'/);
  // 表の事実項目は summary の記載範囲だけを使う（未確認の項目はフィールドを持たない）
  const clinic = HOKEN_SERVICES.find(s => s.id === 'hoken-clinic');
  assert.equal(clinic.feature, '複数の保険会社の商品を取り扱う');
  assert.ok(!('consultMethods' in clinic) && !('storeNetwork' in clinic));
  const lab = HOKEN_SERVICES.find(s => s.id === 'hoken-minaoshi-lab');
  assert.equal(lab.consultMethods, '訪問・オンライン');
  assert.ok(HOKEN_SERVICES.every(s => s.fee === '無料'));
});

test('long-tail pages cover every SIM pair and every region once', async () => {
  const { SIM_PAIRS, AREA_PAGES, AREAS } = await import('../src/services/pages.js');
  assert.equal(SIM_PAIRS.length, SIM_SERVICES.length * (SIM_SERVICES.length - 1) / 2);
  assert.equal(new Set(SIM_PAIRS.map(p => p.path)).size, SIM_PAIRS.length);
  assert.ok(SIM_PAIRS.every(p => /^\/sim\/vs\/[a-z0-9-]+\/$/.test(p.path)));
  assert.equal(AREA_PAGES.length, AREAS.length);
  for (const [area] of AREAS) assert.ok(rankHikari({ area, carrier: 'docomo' }).some(r => r.available), area);
  const script = readFileSync(new URL('../scripts/prerender.mjs', import.meta.url), 'utf8');
  assert.match(script, /STATIC_PAGES/);
  assert.match(script, /SITE_ORIGIN/);
  assert.match(script, /sitemap\.xml/);
});
