import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { manualOfferCost, compareManualOffers, MANUAL_STORES } from '../src/compare/manualCompare.js';
import { validFunnelEvent } from '../src/shared/outboundSchema.js';
import { storeLinks } from '../src/shared/merchants.js';

const a = { storeId: 'rakuten', price: '39800', shipping: '0', discount: '1000', points: '3000' };
const b = { storeId: 'amazon', price: '38000', shipping: '850', discount: '0', points: '0' };
test('manual same-product comparison chooses cash cost and keeps later points separate', () => {
  const result = compareManualOffers([a,b],{sort:'cash'});
  assert.equal(result.comparisonPossible,true);
  assert.deepEqual(MANUAL_STORES,['rakuten','amazon','yahoo-shopping']);
  assert.equal(result.cheapest.row.storeId,'rakuten');
  assert.equal(result.cheapest.cost.cashPayable,38800);
  assert.equal(manualOfferCost(a).cashPayable,38800);
  assert.equal(manualOfferCost(a).pointsAdjustedIllustration,35800);
});
test('points ordering is deliberately opt-in; cash payment remains visible and unmodified',()=>{
  const x = compareManualOffers([
    {...a,price:'41000',discount:'0'},
    b
  ]);
  const y = compareManualOffers([
    {...a,price:'41000',discount:'0'},
    b
  ], {sort:'points'});
  assert.equal(x.cheapest.row.storeId,'amazon');
  assert.equal(y.cheapest.row.storeId,'rakuten');
  assert.equal(y.cheapest.cost.cashPayable,41000);
});
test('invalid or unknown shipping cannot silently be treated as free',()=>{
  for(const bad of [
    {...a,shipping:''},{...a,price:''},{...a,price:'0'},{...a,price:'-1'},
    {...a,price:'12.5'},{...a,shipping:'2,000'},{...a,discount:'40000'},
    {...a,points:'99999'},{...a,storeId:'fake'},{...a,price:'1000000000'}
  ]) assert.equal(manualOfferCost(bad),null);
  assert.equal(compareManualOffers([a,a]).comparisonPossible,false);
  assert.equal(compareManualOffers([a]).comparisonPossible,false);
  assert.equal(compareManualOffers([a,{...b,shipping:''}]).comparisonPossible,false);
});
test('browser-only calculator uses registered approved/ordinary store search links and no price data analytics',()=>{
  const ui=readFileSync(new URL('../src/compare/ManualStoreCompare.jsx',import.meta.url),'utf8');
  const parent=readFileSync(new URL('../src/compare/ComparePage.jsx',import.meta.url),'utf8');
  const travel=readFileSync(new URL('../src/travel/StaySearch.jsx',import.meta.url),'utf8');
  assert.match(parent,/ManualStoreCompare/);
  assert.match(parent,/href="#cp-manual"/); // link to the manual comparison on API failure
  assert.match(ui,/store\.sponsored/);
  assert.match(ui,/recordFunnelEvent\('product_manual_ready'\)/);
  assert.match(ui,/recordOutboundClick/);
  assert.match(ui,/sameProduct && comparison\.comparisonPossible/);
  assert.doesNotMatch(ui,/fetch\(|localStorage|sessionStorage/);
  assert.match(travel,/stay-quick/);
  const refs=storeLinks('WH-1000XM5');
  assert.ok(refs.find(x=>x.id==='rakuten').url.startsWith('https://'));
  assert.ok(refs.find(x=>x.id==='amazon').url.startsWith('https://'));
  assert.equal(validFunnelEvent({event:'funnel',page:'compare',action:'product_manual_ready'}),true);
  assert.equal(validFunnelEvent({event:'funnel',page:'travel',action:'product_manual_ready'}),false);
});
