import test from 'node:test';
import assert from 'node:assert/strict';
import { SERVICE_IDS } from '../src/services/catalog.js';
import { SERVICES } from '../src/tools/catalog.js';
import { serviceLink } from '../src/services/affiliate.js';
import { affiliateCandidate } from '../src/shared/affiliateConfig.js';
import { PUBLIC_AFFILIATE_LINKS } from '../src/shared/publicAffiliateLinks.js';

const KNOWN = new Set([...SERVICE_IDS, ...SERVICES.map(s => s.id)]);
const RAKUTEN_LINK = 'https://hb.afl.rakuten.co.jp/hsc/TEST.TEST.TEST.TEST/?link_type=hybrid_url&ut=TEST';
const A8_LINK = 'https://px.a8.net/svt/ejp?a8mat=TEST';
const committed = { 'rakuten-mobile': RAKUTEN_LINK };

test('every committed public link targets a known service and is accepted as sponsored', () => {
  assert.ok(Object.isFrozen(PUBLIC_AFFILIATE_LINKS));
  for (const [id, url] of Object.entries(PUBLIC_AFFILIATE_LINKS)) {
    assert.ok(KNOWN.has(id), 'unknown service id: ' + id);
    const link = serviceLink({ id, officialUrl: 'https://official.example/' }, {});
    assert.deepEqual(link, { url: new URL(url).href, sponsored: true }, id);
  }
});

test('committed links are used only when no environment value is set', () => {
  assert.equal(affiliateCandidate('rakuten-mobile', {}, committed), RAKUTEN_LINK);
  assert.equal(affiliateCandidate('rakuten-mobile', { VITE_AFF_URL_RAKUTEN_MOBILE: A8_LINK }, committed), A8_LINK);
  assert.equal(affiliateCandidate('rakuten-mobile', { VITE_AFFILIATE_LINKS: JSON.stringify({ 'rakuten-mobile': A8_LINK }) }, committed), A8_LINK);
  assert.equal(affiliateCandidate('iijmio', {}, committed), undefined);
});

test('an invalid environment bundle still fails closed instead of using committed links', () => {
  assert.equal(affiliateCandidate('rakuten-mobile', { VITE_AFFILIATE_LINKS: '{not json' }, committed), undefined);
  assert.equal(affiliateCandidate('rakuten-mobile', { VITE_AFFILIATE_LINKS: JSON.stringify({ 'no-such-id': A8_LINK }) }, committed), undefined);
});

test('unknown ids and non-string committed values are ignored', () => {
  assert.equal(affiliateCandidate('no-such-id', {}, { 'no-such-id': RAKUTEN_LINK }), undefined);
  assert.equal(affiliateCandidate('rakuten-mobile', {}, { 'rakuten-mobile': 123 }), undefined);
  assert.equal(affiliateCandidate('rakuten-mobile', {}, null), undefined);
});
