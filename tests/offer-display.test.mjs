import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRICE_SORTS, displayValue, displayRange, sortDisplayedOffers } from '../src/shared/offerDisplay.js';

const offers=[
  { title:'現金価格が低い商品',price:40000,point:1000,effectivePrice:39000,reviewCount:3 },
  { title:'ポイントが多い商品',price:45000,point:9000,effectivePrice:36000,reviewCount:2 },
  { title:'別モデル',price:30000,point:0,effectivePrice:30000,reviewCount:4 },
];
test('cash is the default; reward-adjusted ordering is explicitly opt-in',()=>{
  assert.deepEqual(Object.keys(PRICE_SORTS),['cash','points']);
  assert.equal(displayValue(offers[0]),40000);
  assert.equal(displayValue(offers[0],'points'),39000);
  const matched=offers.slice(0,2);
  const snapshot=structuredClone(matched);
  assert.deepEqual(sortDisplayedOffers(matched).map(x=>x.title),['現金価格が低い商品','ポイントが多い商品']);
  assert.deepEqual(sortDisplayedOffers(matched,'points').map(x=>x.title),['ポイントが多い商品','現金価格が低い商品']);
  assert.deepEqual(matched,snapshot,'sorting must not mutate source API offers');
});
test('ranges and bad or missing reward data remain safe',()=>{
  assert.deepEqual(displayRange(offers.slice(0,2)),{low:40000,high:45000});
  assert.deepEqual(displayRange(offers.slice(0,2),'points'),{low:36000,high:39000});
  assert.equal(displayRange([]),null);
  assert.equal(displayValue({price:100,effectivePrice:undefined},'points'),100);
  assert.equal(displayValue({price:100,effectivePrice:Infinity},'points'),100);
  assert.equal(displayValue({price:100,effectivePrice:-100},'points'),100);
  assert.deepEqual(sortDisplayedOffers(offers,'not-a-mode').map(x=>x.price),[30000,40000,45000]);
});
test('user interface distinguishes cash checkout price from points and does not overclaim cheapest',()=>{
  const view=readFileSync(new URL('../src/compare/ComparePage.jsx',import.meta.url),'utf8');
  const api=readFileSync(new URL('../api/compare.js',import.meta.url),'utf8');
  assert.match(view,/useState\("cash"\)/);
  assert.match(view,/id="cp-price-sort"/);
  assert.match(view,/現金値引きではなく/);
  assert.match(view,/ポイント考慮後は参考値/);
  assert.match(view,/商品価格はポイント差引前/);
  assert.match(view,/filterOffers/);
  assert.match(view,/表示候補の価格が最小/);
  assert.doesNotMatch(view,/実質価格（価格−付与ポイント）で決めており/);
  assert.match(api,/slice\(0, 80\)/);
});
