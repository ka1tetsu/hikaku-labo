import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRailLinks, buildStayLinks, tripDates, travelLinkConfig } from '../src/travel/bookingLinks.js';
import { DESTINATION_CATALOG } from '../src/travel/destinations.js';
import { providerTarget, TRAVEL_PROVIDERS } from '../src/travel/providers.js';

const city = id => DESTINATION_CATALOG.find(destination => destination.id === id);
const options = { destination: city('paris'), checkin: '2026-11-01', checkout: '2026-11-04', nights: 3, adults: 10, rooms: 4 };

test('stay search preserves ten adults and the selected dates and rooms', () => {
  const links = buildStayLinks(options);
  const booking = new URL(links.find(link => link.provider === 'booking').href);
  assert.equal(booking.searchParams.get('group_adults'), '10');
  assert.equal(booking.searchParams.get('no_rooms'), '4');
  assert.equal(booking.searchParams.get('checkin'), '2026-11-01');
  assert.equal(booking.searchParams.get('checkout'), '2026-11-04');
  assert.equal(booking.searchParams.get('ss'), city('paris').nameEn);
  assert.deepEqual(buildStayLinks({ ...options, nights: 0 }), []);
  assert.deepEqual(buildRailLinks({ destination: city('kyoto'), nights: 0 }), []);
});

test('global hotel cards use the existing referral configuration and the destination search', () => {
  const stayLinks = buildStayLinks(options);
  const rakuten = providerTarget(TRAVEL_PROVIDERS.find(provider => provider.id === 'rakuten-travel'), { stayLinks });
  assert.equal(rakuten.sponsored, true);
  const target = new URL(new URL(rakuten.url).searchParams.get('pc'));
  assert.equal(target.pathname, '/keyword_overseas/Search.do');
  assert.equal(target.searchParams.get('f_query'), city('paris').name);
  assert.match(rakuten.note, /日付・人数・部屋数は予約先で設定/);
  const booking = providerTarget(TRAVEL_PROVIDERS.find(provider => provider.id === 'booking'), { stayLinks });
  assert.equal(booking.sponsored, false);
  assert.equal(new URL(booking.url).searchParams.get('group_adults'), '10');
  const disabled = buildStayLinks({ ...options, config: travelLinkConfig({ VITE_RAKUTEN_TRAVEL_DISABLED: 'true' }) });
  assert.equal(providerTarget(TRAVEL_PROVIDERS.find(provider => provider.id === 'rakuten-travel'), { stayLinks: disabled }).sponsored, false);
});

test('nonexistent calendar dates are replaced rather than producing impossible booking URLs', () => {
  const today = new Date('2026-10-25T12:00:00');
  assert.equal(tripDates({ depart: '2026-02-31', today }).depart, '2026-11-24');
  assert.equal(tripDates({ depart: '2028-02-29', ret: '2028-03-01', today }).depart, '2028-02-29');
  assert.equal(tripDates({ depart: '2026-11-01', ret: '2026-11-01', nights: 0 }).ret, '2026-11-01');
});
