import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DESTINATION_CATALOG } from '../src/travel/destinations.js';
import { COUNTRY_INDEX } from '../src/travel/countries.js';
import { searchTravel, scanTravelText, editDistance, normalizeText } from '../src/travel/search.js';
import { suggestDestinations } from '../src/travel/recommender.js';
import { buildFlightLinks, buildPlaceLinks, buildStayLinks, safeLinkPrefix, travelLinkConfig, tripDates } from '../src/travel/bookingLinks.js';
import { conciergeReply, parseTravelRequest, recommendTrips } from '../src/travel/concierge.js';
import { validOutboundEvent } from '../src/shared/outboundSchema.js';

const get = id => DESTINATION_CATALOG.find(d => d.id === id);
const top = q => searchTravel(q).destinations[0]?.destination.id;
const now = new Date('2026-10-17T10:00:00+09:00');

test('every country and territory is searchable by Japanese or English name', () => {
  assert.ok(COUNTRY_INDEX.length >= 200);
  assert.equal(new Set(COUNTRY_INDEX.map(c => c.code)).size, COUNTRY_INDEX.length);
  for (const q of ['タイ', 'イギリス', 'アメリカ', 'Germany', 'ブラジル', 'ケニア']) assert.ok(searchTravel(q).countries.length > 0, q);
  assert.deepEqual(searchTravel('韓国').destinations.slice(0, 3).map(x => x.destination.country), ['KR', 'KR', 'KR']);
});

test('search handles kana, romaji, typos, landmarks and natural phrases', () => {
  assert.equal(top('ばんこく'), 'bangkok');
  assert.equal(top('barcelna'), 'barcelona');
  assert.equal(top('ニューヨク'), 'newyork');
  assert.equal(top('ベネチア'), 'venice');
  assert.equal(top('エッフェル塔'), 'paris');
  assert.equal(top('マチュピチュ'), 'cusco');
  assert.equal(top('タイのビーチ'), 'phuket');
  assert.equal(top('京都'), 'kyoto');
  assert.ok(!searchTravel('京都').destinations.some(x => x.destination.id === 'tokyo'));
  assert.ok(searchTravel('北欧').destinations.every(x => ['FI', 'DK', 'IS', 'SE', 'NO'].includes(x.destination.country)));
  assert.equal(searchTravel('nonexistent-neverland').mode, 'none');
  assert.equal(editDistance('paris', 'pairs'), 1);
  assert.equal(normalizeText('Cancún'), 'cancun');
});

test('scanner does not mistake verbs for country names', () => {
  assert.deepEqual(scanTravelText('他の候補も見たい').countries, []);
  assert.deepEqual(scanTravelText('タイに行きたい').countries, ['TH']);
  assert.deepEqual(scanTravelText('インドネシアのビーチ').countries, ['ID']);
});

test('destination filters cover area, month, travel time and price feel', () => {
  const list = suggestDestinations({ area: 'overseas', month: 12, maxHours: 6, maxCost: 2 });
  assert.ok(list.length > 0);
  assert.ok(list.every(d => d.area === 'overseas' && d.bestMonths.includes(12) && d.hours <= 6 && d.costLevel <= 2));
  const byHours = suggestDestinations({ area: 'overseas', sort: 'hours' });
  assert.ok(byHours.every((d, i) => i === 0 || byHours[i - 1].hours <= d.hours));
});

test('flight and hotel links are plain deep links unless a real affiliate ID is configured', () => {
  const plain = travelLinkConfig({ VITE_RAKUTEN_TRAVEL_DISABLED: 'true' });
  const flights = buildFlightLinks({ destination: get('bangkok'), depart: '2026-12-01', ret: '2026-12-08', adults: 2, config: plain });
  assert.ok(flights.length >= 4);
  assert.ok(flights.every(link => link.sponsored === false && link.href.startsWith('https://')));
  const trip = new URL(flights.find(l => l.provider === 'tripcom').href);
  assert.equal(trip.searchParams.get('acity'), 'bkk');
  assert.equal(trip.searchParams.get('rdate'), '2026-12-08');

  const paid = travelLinkConfig({ VITE_TRIPCOM_ALLIANCE_ID: '123456', VITE_TRIPCOM_SID: '654321', VITE_BOOKING_AID: '112233',
    VITE_EXPEDIA_LINK_PREFIX: 'https://px.a8.net/svt/ejp?a8mat=TEST&a8ejpredirect=' });
  const paidFlights = buildFlightLinks({ destination: get('bangkok'), config: paid });
  const tripPaid = new URL(paidFlights.find(l => l.provider === 'tripcom').href);
  assert.equal(tripPaid.searchParams.get('Allianceid'), '123456');
  assert.ok(paidFlights.find(l => l.provider === 'expedia').href.startsWith('https://px.a8.net/'));
  assert.equal(paidFlights.find(l => l.provider === 'google').sponsored, false);
  const rakuten = paidFlights.find(l => l.provider === 'rakuten');
  assert.ok(rakuten.sponsored && rakuten.href.startsWith('https://hb.afl.rakuten.co.jp/hgc/'));
  const stays = buildStayLinks({ destination: get('kyoto'), config: paid });
  assert.equal(new URL(stays.find(l => l.provider === 'booking').href).searchParams.get('aid'), '112233');
  assert.match(decodeURIComponent(stays.find(l => l.provider === 'rakuten').href), /keyword\/Search\.do/);
  assert.equal(buildFlightLinks({ destination: get('hakone') }).length, 0);
});

test('affiliate configuration rejects malformed or untrusted values', () => {
  assert.equal(safeLinkPrefix('https://evil.example/?u='), null);
  assert.equal(safeLinkPrefix('http://px.a8.net/svt/ejp?a8ejpredirect='), null);
  assert.equal(safeLinkPrefix('https://px.a8.net/svt/ejp?a8mat=X'), null);
  assert.ok(safeLinkPrefix('https://skyscanner.pxf.io/c/1/2/3?u='));
  assert.equal(travelLinkConfig({ VITE_BOOKING_AID: 'abc' }).bookingAid, null);
  assert.equal(travelLinkConfig({ VITE_TRIPCOM_ALLIANCE_ID: '123456' }).tripcom, null);
  const dates = tripDates({ depart: '2026-12-10', ret: '2026-12-01', nights: 3 });
  assert.deepEqual(dates, { depart: '2026-12-10', ret: '2026-12-13' });
  assert.ok(buildPlaceLinks('ハルシュタット').some(l => l.provider === 'maps'));
});

test('concierge understands Japanese trip requests without any API', () => {
  const { slots, intents } = parseTravelRequest('大阪発で12月に二泊三日、家族4人で温泉とグルメ。予算は合計20万円', { now });
  assert.equal(slots.origin, 'OSA');
  assert.deepEqual(slots.months, [12]);
  assert.equal(slots.nights, 2);
  assert.equal(slots.travelers, 4);
  assert.deepEqual(slots.budget, { amount: 200000, scope: 'total' });
  assert.ok(slots.interests.includes('relax') && slots.interests.includes('food') && slots.interests.includes('family'));
  assert.ok(!slots.destinations);
  assert.deepEqual(intents, ['budget']);
  assert.equal(parseTravelRequest('予算は1人10万円').slots.travelers, undefined);
});

test('concierge recommends, plans, links bookings and stays honest', () => {
  let r = conciergeReply('冬にオーロラを見たい', {}, { now });
  assert.equal(r.message.cards[0].id, 'reykjavik');
  r = conciergeReply('大阪発で近場の海外ビーチ、2人で合計20万円', {}, { now });
  assert.ok(r.message.cards.every(c => get(c.id).area === 'overseas' && get(c.id).hours <= 6));
  r = conciergeReply('バンコクのモデルコース', r.state, { now });
  assert.equal(r.message.itinerary.destinationId, 'bangkok');
  r = conciergeReply('航空券', r.state, { now, config: travelLinkConfig({}) });
  assert.ok(r.message.links.flights.length >= 4);
  assert.ok(r.message.text.join('').includes('予約サイトで必ず確認'));
  r = conciergeReply('ビザは必要？', r.state, { now });
  assert.match(r.message.text.join(''), /断定しません/);
  r = conciergeReply('他の候補も見たい', { slots: { interests: ['beach'] }, shown: ['phuket'] }, { now });
  assert.ok(!r.message.cards.some(c => c.id === 'phuket'));
  r = conciergeReply('ハルシュタット', {}, { now });
  assert.ok(r.message.links.stays.length > 0);
  assert.match(r.message.text[0], /作り話/);
  for (const item of recommendTrips({ budget: { amount: 50000, scope: 'person' } })) assert.ok(!/円/.test(item.fit.label));
});

test('travel outbound clicks accept new booking partners only in travel section', () => {
  for (const merchant of ['rakuten-travel', 'trip-com', 'skyscanner', 'expedia', 'booking', 'google-flights', 'google-maps']) {
    assert.equal(validOutboundEvent({ event: 'outbound', section: 'travel', merchant, placement: 'hub-flights', sponsored: false }), true);
    assert.equal(validOutboundEvent({ event: 'outbound', section: 'products', merchant, placement: 'x', sponsored: false }), false);
  }
});

test('page discloses PR links and the API-free concierge', () => {
  const page = readFileSync(new URL('../src/travel/TravelPage.jsx', import.meta.url), 'utf8');
  const concierge = readFileSync(new URL('../src/shared/ConciergeChat.jsx', import.meta.url), 'utf8');
  const links = readFileSync(new URL('../src/travel/BookingLinks.jsx', import.meta.url), 'utf8');
  assert.match(page, /「PR」/);
  assert.match(concierge, /回答は生成AIではなく/);
  assert.match(links, /rel=\{link\.sponsored \? 'sponsored noopener'/);
});
