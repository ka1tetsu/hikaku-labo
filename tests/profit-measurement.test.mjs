import test from 'node:test';
import assert from 'node:assert/strict';
import { revenueReport } from '../scripts/revenue-report.mjs';
import { FUNNEL_ACTIONS, validFunnelEvent } from '../src/shared/outboundSchema.js';

const interval = { from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z' };
const timestamp = '2026-10-20T00:00:00Z';
const funnel = action => ({ type: 'hikaku_funnel', timestamp, action, page: action.startsWith('product_') ? 'compare' : action.startsWith('travel_') ? 'travel' : 'home' });
const finance = () => ({ ...interval, confirmedCommission: 5000, operatingCosts: 3000, merchants: [
  { merchant: 'rakuten', confirmedCommission: 4000, directCosts: 1000, aspClicks: 200, confirmedOrders: 4 },
  { merchant: 'amazon', confirmedCommission: 0, directCosts: 1000, aspClicks: 0 },
] });

test('every accepted funnel action survives reporting, including all shopping milestones', () => {
  const events = FUNNEL_ACTIONS.map(funnel);
  assert.ok(events.every(({ action, page }) => validFunnelEvent({ event: 'funnel', action, page })));
  const report = revenueReport(events, interval);
  assert.equal(report.ignoredRecords, 0);
  assert.equal(report.includedRecords, events.length);
  const row = report.pages.find(r => r.page === 'compare');
  for (const key of ['productSearches', 'productResultsReady', 'productOffersSelected', 'productTargetsSaved', 'productManualReady']) assert.equal(row[key], 1);
  assert.equal(report.financials, null);
  assert.ok(report.nextActions.some(r => r.action === 'connect_settlement_totals'));
});

test('product diagnosis distinguishes missing results from results with no outbound interaction', () => {
  const failed = revenueReport([funnel('product_search')], interval);
  assert.ok(failed.nextActions.some(r => r.action === 'review_product_results'));
  const ready = revenueReport([funnel('product_search'), funnel('product_results_ready')], interval);
  assert.ok(!ready.nextActions.some(r => r.action === 'review_product_results'));
  assert.ok(ready.nextActions.some(r => r.action === 'review_product_next_step'));
  const clicked = revenueReport([funnel('product_results_ready'), { type: 'hikaku_outbound', timestamp, page: 'compare', section: 'products', merchant: 'rakuten', placement: 'compare-offer', sponsored: true }], interval);
  assert.ok(!clicked.nextActions.some(r => r.action === 'review_product_next_step'));
});

test('settlement reconciles contribution and shared costs without double counting', () => {
  const report = revenueReport([], { ...interval, finance: finance() });
  assert.equal(report.financials.profit, 2000);
  const result = report.merchantFinancials;
  assert.equal(result.unallocatedCommission, 1000);
  assert.equal(result.sharedOrUnallocatedCosts, 1000);
  assert.equal(result.merchants[0].periodCommissionPerAspClick, 20);
  assert.equal(result.merchants[1].periodCommissionPerAspClick, null);
  assert.equal(result.merchants[1].confirmedOrders, null);
  assert.equal(result.merchants.reduce((sum, row) => sum + row.contribution, 0) + result.unallocatedCommission - result.sharedOrUnallocatedCosts, report.financials.profit);
  assert.ok(report.nextActions.some(r => r.action === 'review_merchant_costs' && r.merchant === 'amazon'));
});

test('missing breakdown remains unknown and invalid or overallocated settlements fail closed', () => {
  assert.equal(revenueReport([], interval).merchantFinancials, null);
  const base = finance(); delete base.merchants;
  assert.equal(revenueReport([], { ...interval, finance: base }).merchantFinancials, null);
  for (const merchants of [null, {}, [finance().merchants[0], finance().merchants[0]], [{ merchant: 'made-up', confirmedCommission: 0, directCosts: 0 }], [{ merchant: 'rakuten', confirmedCommission: 6000, directCosts: 0 }], [{ merchant: 'rakuten', confirmedCommission: 0, directCosts: 4000 }], [{ merchant: 'rakuten', confirmedCommission: '5', directCosts: 0 }], [{ merchant: 'rakuten', confirmedCommission: 0, directCosts: 0, aspClicks: -1 }], [{ merchant: 'rakuten', confirmedCommission: 0, directCosts: 0, confirmedOrders: 1.5 }], [{ merchant: 'rakuten', confirmedCommission: 0, directCosts: 0, email: 'private@example.test' }]]) {
    assert.throws(() => revenueReport([], { ...interval, finance: { ...base, merchants } }));
  }
});
