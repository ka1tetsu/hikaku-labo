import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLifeRequest, routeQuery, siteReply, welcomeMessage, SITE_CHIPS } from '../src/shared/siteConcierge.js';

const now = new Date('2026-10-17T10:00:00+09:00');
const talk = (section, ...messages) => {
  let state = {};
  return messages.map(text => { const r = siteReply(text, state, { section, now }); state = r.state; return r.message; });
};

test('life words route fixed-cost reviews to the life domain', () => {
  assert.equal(routeQuery('スマホ代を安くしたい').domain, 'life');
  assert.equal(routeQuery('格安SIMに乗り換えたい').domain, 'life');
  assert.equal(routeQuery('光回線を安くしたい').domain, 'life');
  assert.equal(routeQuery('クレジットカードを見直したい').domain, 'life');
  assert.equal(routeQuery('保険の見直しをしたい').domain, 'life');
  assert.equal(routeQuery('固定費を見直したい').domain, 'life');
});

test('life routing does not steal travel, shopping or tools queries', () => {
  assert.equal(routeQuery('週末に行ける温泉旅行').domain, 'travel');
  assert.equal(routeQuery('パリの航空券').domain, 'travel');
  assert.equal(routeQuery('1万円以下のワイヤレスイヤホン').domain, 'products');
  assert.equal(routeQuery('スマホの充電がすぐ切れる').domain, 'products');
  assert.equal(routeQuery('ネットショップを無料で始めたい').domain, 'tools');
});

test('life parsing reuses the selector condition enums', () => {
  const sim = parseLifeRequest('月10GBくらい使って、店舗で相談したい');
  assert.equal(sim.category, 'sim');
  assert.equal(sim.sim.usage, '10');
  assert.equal(sim.sim.support, 'store');
  const big = parseLifeRequest('格安SIMで50GB使いたい');
  assert.equal(big.sim.usage, 'unlimited');
  const hikari = parseLifeRequest('マンションでスマホはドコモ、光回線を安くしたい');
  assert.equal(hikari.category, 'hikari');
  assert.equal(hikari.hikari.housing, 'mansion');
  assert.equal(hikari.hikari.carrier, 'docomo');
  const card = parseLifeRequest('クレジットカードを還元率で選びたい');
  assert.equal(card.category, 'card');
  assert.equal(card.card.priority, 'rate');
});

test('a sim question gets a selector URL in the savings.js format', () => {
  const [message] = talk('site', 'スマホ代を安くしたい');
  assert.equal(message.domain, 'life');
  assert.equal(message.selectorUrl, '/sim/?usage=10&support=online&calls=few#selector');
  assert.ok(message.summary.includes('格安SIM・スマホ料金'));
});

test('follow-up conditions stay in life and refine the selector URL', () => {
  const [, second] = talk('site', 'スマホ代を安くしたい', '〜30GB使いたい');
  assert.equal(second.domain, 'life');
  assert.equal(second.selectorUrl, '/sim/?usage=30&support=online&calls=few#selector');
  const [, third] = talk('site', 'スマホ代を安くしたい', '店舗で相談したい');
  assert.equal(third.selectorUrl, '/sim/?usage=10&support=store&calls=few#selector');
});

test('hikari, card and insurance questions reach their pages', () => {
  const [hikari] = talk('site', 'マンションでスマホはドコモ、光回線を安くしたい');
  assert.equal(hikari.domain, 'life');
  assert.equal(hikari.selectorUrl, '/hikari/?housing=mansion&carrier=docomo&area=kanto#selector');
  const [card] = talk('site', 'クレジットカードを見直したい');
  assert.equal(card.domain, 'life');
  assert.match(card.selectorUrl, /^\/card\/\?ecosystem=none&age=u39&priority=rate#selector$/);
  const [hoken] = talk('site', '保険の見直しをしたい');
  assert.equal(hoken.domain, 'life');
  assert.equal(hoken.selectorUrl, '/hoken/');
});

test('an unspecified fixed-cost review asks which category', () => {
  const [message] = talk('site', '固定費を見直したい');
  assert.equal(message.domain, 'life');
  assert.equal(message.selectorUrl, undefined);
  assert.ok(message.chips.includes('スマホ代を安くしたい'));
  const [, sim] = talk('site', '固定費を見直したい', 'スマホ代を安くしたい');
  assert.equal(sim.selectorUrl, '/sim/?usage=10&support=online&calls=few#selector');
});

test('switching categories inside life keeps the life domain', () => {
  const [, hikari] = talk('site', 'スマホ代を安くしたい', '光回線も見直したい');
  assert.equal(hikari.domain, 'life');
  assert.match(hikari.selectorUrl, /^\/hikari\/\?/);
});

test('the site chips and welcome message offer the sim review', () => {
  assert.ok(SITE_CHIPS.site.includes('スマホ代を安くしたい'));
  assert.ok(welcomeMessage('site').chips.includes('スマホ代を安くしたい'));
});
