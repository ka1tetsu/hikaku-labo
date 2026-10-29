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

test('existing Rakuten account quick wins come first and disappear once configured', async () => {
  const { RAKUTEN_GROUP_QUICK_WINS } = await import('../scripts/monetization-checklist.mjs');
  const empty = monetizationChecklist({}, 'https://vivlica.com');
  assert.equal(empty.blockers[0].code, 'rakuten_group_quick_wins');
  assert.match(empty.blockers[0].action, /VITE_AFF_URL_RAKUTEN_MOBILE/);
  assert.match(empty.blockers[0].action, /VITE_AFF_URL_RAKUTEN_CARD/);
  for (const item of RAKUTEN_GROUP_QUICK_WINS) {
    assert.match(item.sourceUrl, /^https:\/\/affiliate\.rakuten\.co\.jp\//);
    assert.ok(item.reward > 0 && item.checkedAt);
  }
  const configured = monetizationChecklist({
    VITE_AFF_URL_RAKUTEN_MOBILE: 'https://hb.afl.rakuten.co.jp/hsc/x/?link_type=text',
    VITE_AFF_URL_RAKUTEN_CARD: 'https://hb.afl.rakuten.co.jp/hsc/y/?link_type=text',
  }, 'https://vivlica.com');
  assert.equal(configured.blockers.some(x => x.code === 'rakuten_group_quick_wins'), false);
  assert.equal(configured.blockers.some(x => x.code === 'affiliate_url_rejected'), false);
});

test('a configured but invalid affiliate URL is reported instead of silently earning nothing', () => {
  const report = monetizationChecklist({
    VITE_AFF_URL_RAKUTEN_CARD: 'http://hb.afl.rakuten.co.jp/hsc/y/',
    VITE_AFF_URL_IIJMIO: 'https://example.com/track',
  }, 'https://vivlica.com');
  const rejected = report.blockers.find(x => x.code === 'affiliate_url_rejected');
  assert.ok(rejected);
  assert.match(rejected.message, /VITE_AFF_URL_RAKUTEN_CARD/);
  assert.match(rejected.message, /VITE_AFF_URL_IIJMIO/);
  assert.equal(report.blockers[0].priority, 0);
});

test('hosting commercial-use reminder cites Vercel terms and can be acknowledged', () => {
  const report = monetizationChecklist({}, 'https://vivlica.com');
  const hosting = report.blockers.find(x => x.code === 'hosting_commercial_terms');
  assert.match(hosting.message, /vercel\.com\/docs\/limits\/fair-use-guidelines/);
  assert.match(hosting.action, /CLOUDFLARE-ONE-TIME/);
  const ok = monetizationChecklist({ VIVLICA_HOSTING_COMMERCIAL_OK: 'true' }, 'https://vivlica.com');
  assert.equal(ok.blockers.some(x => x.code === 'hosting_commercial_terms'), false);
});
