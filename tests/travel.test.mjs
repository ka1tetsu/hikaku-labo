import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTravelBudget, DESTINATIONS } from '../src/travel/budget.js';
import { YAHOO_TRAVEL_A8_CREATIVES, travelAffiliateEnabled } from '../src/travel/a8TravelAds.js';

test('travel calculator includes all costs with transparent assumptions', () => {
  const result = calculateTravelBudget({ nights: 2, rooms: 1, travelers: 2, perRoomNight: 15000, travelPerPerson: 10000, foodPerPersonDay: 3500, otherPerPerson: 3000 });
  assert.equal(result.lodging, 30000);
  assert.equal(result.transport, 20000);
  assert.equal(result.meals, 21000);
  assert.equal(result.other, 6000);
  assert.equal(result.total, 77000);
  assert.equal(result.perPerson, 38500);
});

test('travel budgets sanitize negative and impossible inputs', () => {
  const result = calculateTravelBudget({nights: -9, rooms: 0, travelers: -3, perRoomNight: -999, travelPerPerson: NaN});
  assert.equal(result.nights, 0);
  assert.equal(result.rooms, 1);
  assert.equal(result.travelers, 1);
  assert.equal(result.lodging, 0);
  assert.ok(Number.isFinite(result.total));
});

test('ad rendering is active after owner confirms site registration and can be disabled', () => {
  assert.equal(travelAffiliateEnabled({}), false);
  assert.equal(travelAffiliateEnabled({ VITE_A8_TRAVEL_DISABLED: 'false' }), false);
  assert.equal(travelAffiliateEnabled({ VITE_A8_TRAVEL_DISABLED: 'true' }), false);
  assert.equal(travelAffiliateEnabled({ VITE_A8_TRAVEL_REGISTERED_ORIGIN: 'https://vivlica.com' }), true);
  assert.equal(travelAffiliateEnabled({ VITE_SITE_ORIGIN: 'https://hikaku-labo.vercel.app' }), true);
});

test('supplied A8 ad materials have matching tracking IDs and untouched view pixels', () => {
  for (const html of Object.values(YAHOO_TRAVEL_A8_CREATIVES)) {
    assert.match(html, /href="https:\/\/px\.a8\.net\/svt\/ejp\?a8mat=/);
    assert.match(html, /<img border="0" width="1" height="1"/);
    assert.match(html, /rel="nofollow"/);
  }
  assert.match(YAHOO_TRAVEL_A8_CREATIVES.banner234, /4AZ9C4\+21TRSI\+4ZCO\+65U41/);
  assert.match(YAHOO_TRAVEL_A8_CREATIVES.banner300, /4AZ9C4\+21TRSI\+4ZCO\+65ME9/);
  assert.ok(DESTINATIONS.length >= 8);
});
