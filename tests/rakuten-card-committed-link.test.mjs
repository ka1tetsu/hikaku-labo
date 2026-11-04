import test from 'node:test';
import assert from 'node:assert/strict';
import { CARD_SERVICES } from '../src/services/catalog.js';
import { serviceLink } from '../src/services/affiliate.js';
import { PUBLIC_AFFILIATE_LINKS } from '../src/shared/publicAffiliateLinks.js';

const rakutenCard = CARD_SERVICES.find(s => s.id === 'rakuten-card');
const committed = PUBLIC_AFFILIATE_LINKS['rakuten-card'];

test('the committed Rakuten Card link has the shape issued by Rakuten Affiliate', () => {
  assert.ok(rakutenCard, 'rakuten-card exists in the card catalog');
  assert.equal(typeof committed, 'string');
  const url = new URL(committed);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'hb.afl.rakuten.co.jp');
  // The hsc path identifies the media/program/material for the Rakuten Card
  // program; a transcription error silently loses the commission.
  assert.equal(url.pathname, '/hsc/483a330d.4f37b651.433ccf31.62544894/');
  assert.equal(url.search, '?link_type=text&rafst=rc');
});

test('the card pages send Rakuten Card through the committed link unless an env value overrides it', () => {
  assert.deepEqual(serviceLink(rakutenCard, {}), { url: new URL(committed).href, sponsored: true });
  const override = 'https://hb.afl.rakuten.co.jp/hsc/58b80593.c1cc6abc.433ccf31.62544894/?link_type=text&rafst=rc';
  assert.deepEqual(serviceLink(rakutenCard, { VITE_AFF_URL_RAKUTEN_CARD: override }), { url: override, sponsored: true });
  assert.deepEqual(serviceLink(rakutenCard, { VITE_AFF_URL_RAKUTEN_CARD: 'https://evil.example/x' }), { url: rakutenCard.officialUrl, sponsored: false });
});
