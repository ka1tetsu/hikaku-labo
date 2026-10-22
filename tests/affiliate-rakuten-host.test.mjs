import test from 'node:test';
import assert from 'node:assert/strict';
import { SIM_SERVICES } from '../src/services/catalog.js';
import { serviceLink } from '../src/services/affiliate.js';

const rakuten = SIM_SERVICES.find(s => s.id === 'rakuten-mobile');
const iij = SIM_SERVICES.find(s => s.id === 'iijmio');
const RAKUTEN_LINK = 'https://hb.afl.rakuten.co.jp/hsc/TEST.TEST.TEST.TEST/?link_type=hybrid_url&ut=TEST';

test('Rakuten Affiliate https links are sponsored and kept unchanged', () => {
  assert.ok(rakuten, 'rakuten-mobile exists in the SIM catalog');
  const link = serviceLink(rakuten, { VITE_AFF_URL_RAKUTEN_MOBILE: RAKUTEN_LINK });
  assert.deepEqual(link, { url: new URL(RAKUTEN_LINK).href, sponsored: true });
  assert.equal(link.url, RAKUTEN_LINK);
});

test('non-https, look-alike or credentialed Rakuten hosts fall back to the official URL', () => {
  const official = { url: rakuten.officialUrl, sponsored: false };
  for (const value of [
    'http://hb.afl.rakuten.co.jp/hsc/TEST/',
    'https://hb.afl.rakuten.co.jp.example.com/hsc/TEST/',
    'https://evil-hb.afl.rakuten.co.jp/hsc/TEST/',
    'https://afl.rakuten.co.jp/hsc/TEST/',
    'https://user:pass@hb.afl.rakuten.co.jp/hsc/TEST/',
    'not a url',
  ]) {
    assert.deepEqual(serviceLink(rakuten, { VITE_AFF_URL_RAKUTEN_MOBILE: value }), official, value);
  }
  assert.deepEqual(serviceLink(rakuten, {}), official);
});

test('existing ASP behaviour is unchanged', () => {
  assert.deepEqual(serviceLink(iij, { VITE_AFF_URL_IIJMIO: 'https://px.a8.net/svt/ejp?a8mat=TEST' }), { url: 'https://px.a8.net/svt/ejp?a8mat=TEST', sponsored: true });
  assert.equal(serviceLink(iij, { VITE_AFF_URL_IIJMIO: 'https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=TEST' }).sponsored, true);
  assert.equal(serviceLink(iij, { VITE_AFF_URL_IIJMIO: 'https://evil.example/x' }).sponsored, false);
});
