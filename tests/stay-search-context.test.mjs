import test from 'node:test';
import assert from 'node:assert/strict';
import { initialStaySearchContext, staySearchUrl } from '../src/travel/staySearchContext.js';
const today='2099-11-01';
const search={place:'新潟市',checkin:'2099-11-03',checkout:'2099-11-05',adults:4,breakfast:true,onsen:false,page:9,price:10000,hotelName:'private note'};
test('shared stay link restores exact supported conditions and excludes quote/private fields',()=>{
 const url=new URL(staySearchUrl(search,'https://vivlica.com',today));
 assert.equal(url.pathname,'/travel/');assert.equal(url.hash,'#stay-search');
 assert.deepEqual([...url.searchParams.keys()].sort(),['stay_adults','stay_breakfast','stay_checkin','stay_checkout','stay_onsen','stay_place']);
 const result=initialStaySearchContext(url.search,today);
 assert.equal(result.notice,'');assert.deepEqual(result.form,{place:'新潟市',checkin:search.checkin,checkout:search.checkout,adults:'4',breakfast:'true',onsen:'false'});
});
test('domestic itinerary destinations prefill the lodging place and nights without guessing overseas support',()=>{
 const result=initialStaySearchContext('?destination=tokyo&nights=3',today);
 assert.equal(result.form.place,'東京');assert.equal(result.form.checkout,'2099-11-05');
 assert.equal(initialStaySearchContext('?destination=paris',today).form.place,'');
});
test('expired or impossible shared conditions require re-entry, not silent replacement dates',()=>{
 for(const patch of ['stay_checkin=2020-01-01','stay_checkout=2099-02-31','stay_adults=20','stay_onsen=yes','stay_adults=2&stay_adults=4']){
  const result=initialStaySearchContext('?stay_place=新潟市&'+patch,today);
  assert.ok(result.notice);assert.equal(result.form.checkin,'');assert.equal(result.form.checkout,'');assert.equal(result.form.adults,'');
 }
});
test('explicit stay context overrides a separate itinerary and rejects invalid share inputs',()=>{
 assert.equal(initialStaySearchContext('?destination=tokyo&stay_place=新潟市',today).form.place,'新潟市');
 assert.equal(staySearchUrl({...search,adults:0},'https://vivlica.com',today),null);
 assert.equal(staySearchUrl(search,'javascript:alert(1)',today),null);
});
