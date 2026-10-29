import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareCancellationDecisions } from '../src/travel/cancellationDecision.js';

const quote = { flexibleTotal:'24000', restrictedTotal:'20000', flexibleFee:'0', restrictedFee:'20000' };

test('side-by-side plan scenarios expose the travel savings and cancellation tradeoff', () => {
  const r = compareCancellationDecisions(quote);
  assert.equal(r.savingsIfTravel, 4000);
  assert.equal(r.extraCostIfCancel, 20000);
  assert.equal(Number(r.cancellationThreshold.toFixed(6)), Number((1/6).toFixed(6)));
});
test('never invents a threshold when there is no ordinary cheap-versus-flexible tradeoff', () => {
  assert.equal(compareCancellationDecisions({...quote,restrictedTotal:'28000'}).cancellationThreshold,null);
  assert.equal(compareCancellationDecisions({...quote,restrictedFee:'0'}).cancellationThreshold,null);
  assert.equal(compareCancellationDecisions({...quote,flexibleFee:'500'}).extraCostIfCancel,19500);
});
test('rejects empty, negative, fractional, invalid and fee-greater-than-total amounts', () => {
  for (const bad of [
    { ...quote, flexibleTotal:'' }, { ...quote, restrictedFee:'20001' },
    { ...quote, flexibleFee:'24001' }, { ...quote, restrictedTotal:'-1' },
    { ...quote, flexibleTotal:'12.5' }, { ...quote, flexibleTotal:'0' },
    { ...quote, restrictedFee:'1,000' }, { ...quote, restrictedTotal:'1000000000' },
    { ...quote, flexibleFee:undefined },
  ]) assert.equal(compareCancellationDecisions(bad),null);
});
test('UI has no seeded fake rates, keeps comparison conditional and discloses referral differences', () => {
  const ui = readFileSync(new URL('../src/travel/CancellationDecision.jsx', import.meta.url), 'utf8');
  const parent = readFileSync(new URL('../src/travel/TotalCostComparator.jsx', import.meta.url), 'utf8');
  const schema = readFileSync(new URL('../src/shared/outboundSchema.js', import.meta.url), 'utf8');
  assert.match(ui,/sameTerms/);
  assert.match(ui,/reviewed && result && sameTerms/);
  assert.match(ui,/recordFunnelEvent\('travel_cancellation_review'\)/);
  assert.match(ui,/端末内の計算/);
  assert.match(parent,/<CancellationDecision\s*\/>/);
  assert.match(schema,/travel_cancellation_review/);
});
