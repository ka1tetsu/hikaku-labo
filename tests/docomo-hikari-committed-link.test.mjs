import test from 'node:test';
import assert from 'node:assert/strict';
import { HIKARI_SERVICES } from '../src/services/catalog.js';
import { serviceLink } from '../src/services/affiliate.js';
import { PUBLIC_AFFILIATE_LINKS } from '../src/shared/publicAffiliateLinks.js';

const docomoHikari = HIKARI_SERVICES.find(s => s.id === 'docomo-hikari');
const committed = PUBLIC_AFFILIATE_LINKS['docomo-hikari'];

test('the committed Docomo Hikari link has the shape issued by A8.net', () => {
  assert.ok(docomoHikari, 'docomo-hikari exists in the hikari catalog');
  assert.equal(typeof committed, 'string');
  const url = new URL(committed);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'px.a8.net');
  assert.equal(url.pathname, '/svt/ejp');
  // a8mat identifies the media/program/material for the GMO Tokutoku BB Docomo
  // Hikari program; a transcription error silently loses the commission.
  assert.equal(url.search, '?a8mat=4BGD79+F468GQ+50+54MIOY');
});

test('the hikari pages send Docomo Hikari through the committed link unless an env value overrides it', () => {
  assert.deepEqual(serviceLink(docomoHikari, {}), { url: new URL(committed).href, sponsored: true });
  const override = 'https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=3786828&pid=892740851';
  assert.deepEqual(serviceLink(docomoHikari, { VITE_AFF_URL_DOCOMO_HIKARI: override }), { url: override, sponsored: true });
  assert.deepEqual(serviceLink(docomoHikari, { VITE_AFF_URL_DOCOMO_HIKARI: 'https://evil.example/x' }), { url: docomoHikari.officialUrl, sponsored: false });
});
