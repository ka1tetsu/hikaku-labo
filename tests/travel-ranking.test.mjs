import test from 'node:test';
import assert from 'node:assert/strict';
import { rankEnteredQuotes } from '../src/travel/totalCost.js';
import { stayRecommendation, sortStays } from '../src/travel/staySearch.js';
const quote=(id,providerId,base,cancellationFee)=>({id,providerId,type:'hotel',base,taxes:'0',extras:'0',discount:'0',points:'0',sameConditions:true,cancellationFee});
const rows=[quote(1,'booking','10000','10000'),quote(2,'rakuten-travel','11000','0')];
test('flexibility can outweigh a small price difference with an explained score',()=>{
 const result=rankEnteredQuotes(rows,{preference:'balanced',cancellationDate:'2026-12-01'});
 assert.equal(result.usesCancellation,true);
 assert.equal(result.recommended.quote.id,2);
 assert.ok(Math.abs(result.recommended.score-(80*10000/11000+20))<1e-8);
 assert.equal(rankEnteredQuotes(rows,{preference:'price'}).recommended.quote.id,1);
});
test('unknown or impossible cancellation fee switches whole pool to price-only',()=>{
 for(const fee of ['',undefined,'-1','12000']){
  const result=rankEnteredQuotes([rows[0],{...rows[1],cancellationFee:fee}],{cancellationDate:'2026-12-01'});
  assert.equal(result.usesCancellation,false);
  assert.equal(result.recommended.quote.id,1);
 }
 assert.equal(rankEnteredQuotes(rows,{cancellationDate:'2026-02-30'}).usesCancellation,false);
});
test('unconfirmed, single-provider and mixed-category quotes do not produce a cross-site winner',()=>{
 assert.equal(rankEnteredQuotes([rows[0],{...rows[1],sameConditions:false}]).recommended,null);
 assert.equal(rankEnteredQuotes([rows[0],{...rows[1],providerId:'booking'}]).recommended,null);
 assert.equal(rankEnteredQuotes([rows[0],{...rows[1],type:'flight'}]).recommended,null);
});
test('zero payable is finite, future points and commission do not change rankings',()=>{
 const input=[{...rows[0],base:'0',cancellationFee:'0'},{...rows[1],points:'999999999',commission:999999}];
 const result=rankEnteredQuotes(input,{cancellationDate:'2026-12-01'});
 assert.equal(result.recommended.quote.id,1);
 assert.ok(result.ranked.every(row=>Number.isFinite(row.score)&&row.score>=0&&row.score<=100));
});
test('hotel ranking discounts tiny review samples and never treats missing price as a bargain',()=>{
 const hotels=[{id:'few',firstNightTotal:10000,rating:5,reviewCount:1},{id:'many',firstNightTotal:10000,rating:4.5,reviewCount:500},{id:'unknown',firstNightTotal:null,rating:5,reviewCount:9000}];
 assert.deepEqual(sortStays(hotels,'recommended').map(x=>x.id),['many','few','unknown']);
 assert.equal(stayRecommendation(hotels[2],hotels),null);
 assert.equal(stayRecommendation({firstNightTotal:10000,rating:null},hotels).ratingPart,0);
});
