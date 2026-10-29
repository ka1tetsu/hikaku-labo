import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteCost, compareEnteredQuotes } from '../src/travel/totalCost.js';
import { readFileSync } from 'node:fs';

const offer=(id,providerId,amount,overrides={})=>({
  id,type:'flight',providerId,base:String(amount),taxes:'0',extras:'0',discount:'0',
  points:'0',sameConditions:true,...overrides,
});

test('all-in checkout calculator includes mandatory charges, rebates and does not subtract deferred points',()=>{
  const c=quoteCost(offer(1,'skyscanner',32000,{taxes:'2300',extras:'7800',discount:'2000',points:'6000'}));
  assert.equal(c.subtotal,42100);
  assert.equal(c.cashPayable,40100);
  assert.equal(c.nonCashPoints,6000);
  assert.equal(c.pointsAdjustedIllustration,34100);
});
test('requires positive-formatted nonnegative integer amounts, actual provider and valid category',()=>{
  for(const invalid of [
    offer(1,'skyscanner',''),offer(1,'skyscanner','abc'),offer(1,'skyscanner','1.5'),
    offer(1,'skyscanner','-3'),offer(1,'skyscanner',12000,{taxes:''}),
    offer(1,'skyscanner',12000,{discount:'12001'}),
    offer(1,'no-real-provider',1500),
    offer(1,'skyscanner',1500,{type:'hotel'}),
  ])assert.equal(quoteCost(invalid),null);
});
test('cannot call a single provider, unverified trip terms or incomplete price a comparison',()=>{
  assert.equal(compareEnteredQuotes([offer(1,'skyscanner',1000)]).comparisonPossible,false);
  assert.equal(compareEnteredQuotes([offer(1,'skyscanner',1000),offer(2,'skyscanner',1500)]).comparisonPossible,false);
  const notCompared=compareEnteredQuotes([offer(1,'skyscanner',1000),offer(2,'trip',800,{sameConditions:false})]);
  assert.equal(notCompared.comparisonPossible,false);
  assert.equal(notCompared.excludedCount,1);
  assert.equal(compareEnteredQuotes([offer(1,'skyscanner',1000),offer(2,'booking',900,{type:'hotel'})],{type:'flight'}).comparisonPossible,false);
});
test('only cheapest among explicitly entered, same-category, confirmed conditions; no claim of market cheapest',()=>{
  const result=compareEnteredQuotes([
    offer(1,'skyscanner',15000,{taxes:'3000',extras:'2000'}),
    offer(2,'trip',20000,{discount:'4500'}),
    offer(3,'kayak',13000,{sameConditions:false}),
  ],{type:'flight'});
  assert.equal(result.comparisonPossible,true);
  assert.equal(result.cheapestAmongEntered.quote.providerId,'trip');
  assert.equal(result.cheapestAmongEntered.cost.cashPayable,15500);
  assert.equal(result.ranked[1].cost.cashPayable,20000);
  assert.equal(result.excludedCount,1);
  assert.match(result.caveat,/入力した/);
});
test('hotel all-in total is supported without conflating price-only affiliate links',()=>{
  const result=compareEnteredQuotes([
    offer(1,'agoda',18000,{type:'hotel',extras:'1500'}),
    offer(2,'booking',17500,{type:'hotel',taxes:'1000'}),
  ],{type:'hotel'});
  assert.equal(result.cheapestAmongEntered.quote.providerId,'booking');
  assert.equal(result.cheapestAmongEntered.cost.cashPayable,18500);
});
test('travel page has the calculator with approved outbound referrals only',()=>{
  const source=readFileSync(new URL('../src/travel/GlobalTravelSearch.jsx',import.meta.url),'utf8');
  const card=readFileSync(new URL('../src/travel/TotalCostComparator.jsx',import.meta.url),'utf8');
  assert.match(source,/TotalCostComparator/);
  assert.match(card,/providerTarget/);
  assert.match(card,/recordOutboundClick/);
  assert.match(card,/sponsored noopener noreferrer/);
  assert.match(card,/入力した候補/);
});
