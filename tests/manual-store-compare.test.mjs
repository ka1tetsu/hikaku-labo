import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { manualOfferCost, compareManualOffers, MANUAL_STORES } from '../src/compare/manualCompare.js';
import { validFunnelEvent } from '../src/shared/outboundSchema.js';
import { storeLinks } from '../src/shared/merchants.js';
import { revenueReport } from '../scripts/revenue-report.mjs';

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

test('report counts comparison and outbound funnel events separately from any verified purchase',()=>{
  const timestamp='2026-10-29T14:00:00Z';
  const events=[
    {type:'hikaku_view',timestamp,page:'compare'},
    {type:'hikaku_funnel',timestamp,page:'compare',action:'product_manual_ready'},
    {type:'hikaku_outbound',timestamp,page:'compare',section:'products',merchant:'rakuten',placement:'manual-research',sponsored:true},
    {type:'hikaku_outbound',timestamp,page:'compare',section:'products',merchant:'amazon',placement:'manual-result',sponsored:true},
    {type:'hikaku_outbound',timestamp,page:'travel',section:'travel',merchant:'booking',placement:'stay-quick',sponsored:false},
  ];
  const report=revenueReport(events);
  const compare=report.pages.find(row=>row.page==='compare');
  assert.equal(compare.productManualReady,1);
  assert.equal(compare.productManualResearchClicks,1);
  assert.equal(compare.productManualResultClicks,1);
  assert.equal(report.pages.find(row=>row.page==='travel').travelDirectSearchClicks,1);
  assert.equal(report.financials,null);
  assert.equal(report.nextActions.some(action=>action.action==='review_product_manual_cta'),false);
  const noConversion=revenueReport(events.filter(event=>event.placement!=='manual-result'));
  assert.equal(noConversion.nextActions.some(action=>action.action==='review_product_manual_cta'),true);
});
