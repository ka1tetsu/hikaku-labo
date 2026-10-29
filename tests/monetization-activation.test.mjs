import test from 'node:test';
import assert from 'node:assert/strict';
import { relevantGlobalFlightLinks, globalProviderTarget } from '../src/travel/searchLinkAdapter.js';
import { monetizationChecklist, activationMarkdown } from '../scripts/monetization-checklist.mjs';

const destination = { id: 'seoul', name: 'ソウル', iata: 'ICN', international: true };
const base = { originCode: 'TYO', destination, departureDate: '2026-11-03', nights: 2, travelers: 2,
  config: { rakutenId: null, tripcom: null, bookingAid: null, skyscannerPrefix: null, expediaPrefix: null } };

test('international flight comparison carries actual entered origin, date and travelers', () => {
  const links = relevantGlobalFlightLinks(base);
  const trip = links.find(link => link.merchant === 'trip-com');
  assert.ok(trip);
  const tripUrl = new URL(trip.href);
  assert.equal(tripUrl.searchParams.get('dcity'), 'tyo');
  assert.equal(tripUrl.searchParams.get('acity'), 'icn');
  assert.equal(tripUrl.searchParams.get('ddate'), '2026-11-03');
  assert.equal(tripUrl.searchParams.get('quantity'), '2');
  assert.equal(trip.sponsored, false);
  const provider = { id: 'trip', type: 'flight', url: 'https://jp.trip.com/' };
  const target = globalProviderTarget(provider, base);
  assert.equal(target.carriesSearch, true);
  assert.equal(target.sponsored, false);
  assert.ok(target.url.includes('ddate=2026-11-03'));
});

test('never generate a Japanese departure that user did not enter', () => {
  assert.deepEqual(relevantGlobalFlightLinks({ ...base, originCode: 'LON' }), []);
  assert.deepEqual(relevantGlobalFlightLinks({ ...base, departureDate: '' }), []);
  assert.deepEqual(relevantGlobalFlightLinks({ ...base, departureDate: '2026-02-31' }), []);
  assert.deepEqual(relevantGlobalFlightLinks({ ...base, destination: { ...destination, iata: 'TYO' } }), []);
  const official = globalProviderTarget({ id: 'trip', type: 'flight', url: 'https://jp.trip.com/' }, { ...base, originCode: 'LON' });
  assert.equal(official.carriesSearch, false);
  assert.equal(official.url, 'https://jp.trip.com/');
});

test('paid deep links only activate when real approved partner IDs are configured', () => {
  const supported = relevantGlobalFlightLinks({
    ...base, config: { ...base.config, tripcom: { allianceId: '12345', sid: '67890' } },
  });
  const trip = supported.find(link => link.merchant === 'trip-com');
  assert.equal(trip.sponsored, true);
  assert.equal(new URL(trip.href).searchParams.get('Allianceid'), '12345');
});

test('revenue activation report does not count code as real earnings or infer A8 approval', () => {
  const defaultReport = monetizationChecklist({}, 'https://vivlica.com');
  assert.equal(defaultReport.a8RenderedWithCurrentSettings, true);
  assert.equal(defaultReport.actualProfitJPY, null);
  assert.equal(defaultReport.productionEnvironmentVerified, false);
  assert.equal(defaultReport.blockers.some(x => x.code === 'a8_domain_unverified'), false);
  assert.match(activationMarkdown(defaultReport), /ASP確定報酬/);
  const registered = monetizationChecklist({
    VITE_A8_TRAVEL_REGISTERED_ORIGIN: 'https://vivlica.com',
    VITE_SITE_ORIGIN: 'https://vivlica.com',
    VIVLICA_PRODUCTION_ENV_VERIFIED: 'true',
  }, 'https://vivlica.com');
  assert.equal(registered.a8RenderedWithCurrentSettings, true);
  assert.equal(registered.blockers.some(x => x.code === 'a8_domain_unverified'), false);
});
