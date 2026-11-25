import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GROUPS, SERVICES, getServices } from '../src/securities/catalog.js';
import { outboundLink } from '../src/securities/affiliate.js';
import { serviceLink } from '../src/services/affiliate.js';
import { affiliateCandidate } from '../src/shared/affiliateConfig.js';
import { PUBLIC_AFFILIATE_LINKS } from '../src/shared/publicAffiliateLinks.js';
import { pageId, validOutboundEvent } from '../src/shared/outboundSchema.js';

const text = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const byId = id => SERVICES.find(service => service.id === id);
const fact = (service, label) => service.facts.find(item => item.label.startsWith(label))?.value || '';

test('securities catalog lists four services split by risk group, never mixed', () => {
  assert.equal(SERVICES.length, 4);
  assert.equal(new Set(SERVICES.map(s => s.id)).size, SERVICES.length);
  assert.deepEqual(getServices('stocks').map(s => s.id), ['dmm-kabu', 'matsui']);
  assert.deepEqual(getServices('fxcfd').map(s => s.id), ['dmm-fx', 'dmm-cfd']);
  assert.deepEqual(GROUPS.map(g => g.id), ['stocks', 'fxcfd']);
});

test('company names use the regulated spaced forms for the DMM brands', () => {
  assert.equal(byId('dmm-fx').name, 'DMM FX');
  assert.equal(byId('dmm-kabu').name, 'DMM 株');
  assert.equal(byId('dmm-cfd').name, 'DMM CFD');
  assert.equal(byId('matsui').name, '松井証券');
});

test('catalog facts match the officially checked values of 2026-11-26', () => {
  for (const service of SERVICES) {
    assert.match(service.officialUrl, /^https:\/\//, service.id);
    assert.match(service.sourceUrl, /^https:\/\//, service.id);
    assert.equal(service.checkedAt, '2026-11-26', service.id);
    assert.ok(service.facts.length >= 4, service.id);
    assert.ok(service.cautions.length >= 2, service.id);
  }
  assert.ok(fact(byId('dmm-fx'), 'スプレッド（米ドル/円）').includes('0.2銭'));
  assert.ok(fact(byId('dmm-fx'), '最小取引単位').includes('10,000通貨'));
  assert.ok(fact(byId('dmm-fx'), 'ロスカット').includes('50%'));
  assert.ok(fact(byId('dmm-kabu'), '日本株').includes('55円'));
  assert.ok(fact(byId('dmm-kabu'), '日本株').includes('880円'));
  assert.ok(fact(byId('dmm-kabu'), 'NISA').includes('無料'));
  assert.ok(fact(byId('dmm-cfd'), '取扱銘柄').includes('全22銘柄'));
  assert.ok(fact(byId('dmm-cfd'), 'レバレッジ上限').includes('10倍'));
  assert.ok(fact(byId('dmm-cfd'), 'レバレッジ上限').includes('20倍'));
  assert.ok(fact(byId('matsui'), '日本株手数料').includes('50万円まで0円'));
  assert.ok(fact(byId('matsui'), '投資信託').includes('1,800銘柄以上'));
});

const EXPECTED_A8MAT = {
  'dmm-fx': '?a8mat=3Z0VIB+8OKM56+1WP2+69WPU',
  'dmm-kabu': '?a8mat=455JZI+DJM1ZU+1WP2+15QP82',
  'dmm-cfd': '?a8mat=455JZI+DIF6SA+1WP2+NTJWY',
  'matsui': '?a8mat=455IFN+FHBA2+3XCC+64C3M',
};

test('each service resolves to its issued A8 text link as sponsored', () => {
  for (const service of SERVICES) {
    const committed = PUBLIC_AFFILIATE_LINKS[service.id];
    assert.equal(typeof committed, 'string', service.id);
    const url = new URL(committed);
    assert.equal(url.protocol, 'https:', service.id);
    assert.equal(url.hostname, 'px.a8.net', service.id);
    assert.equal(url.pathname, '/svt/ejp', service.id);
    // a8mat identifies the Vivlica media/program/material; a transcription
    // error silently loses the commission, so pin it exactly.
    assert.equal(url.search, EXPECTED_A8MAT[service.id], service.id);
    assert.equal(affiliateCandidate(service.id, {}), committed, service.id);
    assert.deepEqual(serviceLink(service, {}), { url: url.href, sponsored: true }, service.id);
    assert.deepEqual(outboundLink(service, {}), { url: url.href, sponsored: true }, service.id);
  }
});

test('securities outbound events and page id are registered in the schema', () => {
  assert.equal(pageId('/securities/'), 'securities');
  for (const service of SERVICES) {
    assert.equal(validOutboundEvent({ event: 'outbound', section: 'securities', merchant: service.id, sponsored: true, placement: 'securities-card' }), true, service.id);
    assert.equal(validOutboundEvent({ event: 'outbound', section: 'securities', merchant: service.id, sponsored: true, placement: 'securities-hub' }), true, service.id);
  }
  assert.equal(validOutboundEvent({ event: 'outbound', section: 'securities', merchant: 'rakuten-mobile', sponsored: true, placement: 'securities-card' }), false);
  assert.equal(validOutboundEvent({ event: 'outbound', section: 'tools', merchant: 'dmm-fx', sponsored: true, placement: 'securities-card' }), false);
});

test('page carries PR disclosure in the first view and risk text near CTAs and at the end', () => {
  const page = text('src/securities/SecuritiesPage.jsx');
  assert.ok(page.includes('PR（広告を含みます）'));
  assert.ok(page.indexOf('PR（広告を含みます）') < page.indexOf('sc-group'), 'PR disclosure precedes the service groups');
  assert.ok(page.includes('sponsored noopener'), 'sponsored rel is applied to ad links');
  assert.ok(page.includes('元本を上回る損失'), 'FX/CFD loss-exceeding-principal warning');
  assert.ok(page.includes('元本割れ'), 'equity principal-loss warning');
  const stocks = GROUPS.find(g => g.id === 'stocks');
  const fxcfd = GROUPS.find(g => g.id === 'fxcfd');
  assert.ok(stocks.risk.includes('元本割れ'));
  assert.ok(fxcfd.risk.includes('元本を上回る損失'));
});

test('no banned solicitation wording appears in the securities copy', () => {
  const sources = text('src/securities/SecuritiesPage.jsx') + text('src/securities/catalog.js');
  for (const banned of ['儲かる', '負けない', '稼げる', '必ず儲', '元本保証']) {
    assert.ok(!sources.includes(banned), 'banned wording found: ' + banned);
  }
});
