import test from 'node:test';
import assert from 'node:assert/strict';
import { SIM_SERVICES } from '../src/services/catalog.js';
import { serviceLink } from '../src/services/affiliate.js';
import { PUBLIC_AFFILIATE_LINKS } from '../src/shared/publicAffiliateLinks.js';

const rakuten = SIM_SERVICES.find(s => s.id === 'rakuten-mobile');
const committed = PUBLIC_AFFILIATE_LINKS['rakuten-mobile'];

test('the committed Rakuten Mobile link has the shape issued by the Rakuten link builder', () => {
  assert.equal(typeof committed, 'string');
  const url = new URL(committed);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'hb.afl.rakuten.co.jp');
  const [, kind, ids] = url.pathname.split('/');
  assert.equal(kind, 'hsc');
  assert.match(ids, /^[0-9a-f]{8}(\.[0-9a-f]{8}){3}$/);
  // `ut` is base64 JSON describing the link; a transcription error breaks the decode.
  const meta = JSON.parse(Buffer.from(url.searchParams.get('ut'), 'base64').toString('utf8'));
  assert.equal(meta.page, 'shop');
});

test('the SIM page sends Rakuten Mobile through the committed link unless an env value overrides it', () => {
  assert.deepEqual(serviceLink(rakuten, {}), { url: new URL(committed).href, sponsored: true });
  const override = 'https://px.a8.net/svt/ejp?a8mat=TEST';
  assert.deepEqual(serviceLink(rakuten, { VITE_AFF_URL_RAKUTEN_MOBILE: override }), { url: override, sponsored: true });
  assert.deepEqual(serviceLink(rakuten, { VITE_AFF_URL_RAKUTEN_MOBILE: 'https://evil.example/x' }), { url: rakuten.officialUrl, sponsored: false });
});
