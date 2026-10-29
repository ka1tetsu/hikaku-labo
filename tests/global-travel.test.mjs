import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_TRAVEL_DESTINATIONS, findDestination, autocompleteDestinations, parseTravelQuery, buildGeneralItinerary } from '../src/travel/globalSearch.js';
import { GLOBAL_DESTINATIONS } from '../src/travel/globalDestinations.js';
import { TRAVEL_PROVIDERS, providerTarget, TRAVEL_PROVIDER_TYPES } from '../src/travel/providers.js';
import { normalizeQuote, compareQuotes } from '../src/travel/quoteEngine.js';
import { parseIndicativeSearch, cleanIndicativeFares } from '../api/flight-prices.js';
import { validOutboundEvent } from '../src/shared/outboundSchema.js';
import { readFileSync } from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('global catalog spans continents and preserves the existing domestic 18 cities',()=>{
  assert.equal(ALL_TRAVEL_DESTINATIONS.filter(d=>d.country==='日本').length,18);
  assert.ok(GLOBAL_DESTINATIONS.length>=55);
  assert.ok(ALL_TRAVEL_DESTINATIONS.length>=73);
  assert.ok(new Set(GLOBAL_DESTINATIONS.map(d=>d.id)).size===GLOBAL_DESTINATIONS.length);
  for(const d of GLOBAL_DESTINATIONS){
    assert.ok(d.name&&d.country&&d.tagline&&d.stops.length>=2,d.id);
    assert.match(d.iata,/^[A-Z]{3}$/,d.id);
  }
});
test('global search preserves destinations inside and outside the curated index',()=>{
  assert.equal(findDestination('パリ').id,'paris');
  assert.equal(findDestination('東京').id,'tokyo');
  assert.equal(findDestination('ニューヨーク').id,'new-york');
  assert.ok(autocompleteDestinations('ソウル').some(d=>d.id==='seoul'));
  assert.equal(findDestination('未知の都市'),null);
  const generic=buildGeneralItinerary(null,2);
  assert.equal(generic.length,3);
  assert.ok(generic[0].stops[0].includes('公式情報'));
});
test('natural Japanese trip prompts extract only supported conditions',()=>{
  const now=new Date('2026-10-17T00:00:00Z');
  const parsed=parseTravelQuery('東京からパリに11月3日出発、5泊、2人、直行便、航空券20万円以下、朝食付き、キャンセル無料、預け荷物、グルメ',now);
  assert.equal(parsed.origin,'東京');
  assert.equal(parsed.destination,'パリ');
  assert.equal(parsed.departureDate,'2026-11-03');
  assert.equal(parsed.nights,5);
  assert.equal(parsed.travelers,2);
  assert.equal(parsed.budgetJPY,200000);
  assert.equal(parsed.nonstop,true);
  assert.equal(parsed.checkedBag,true);
  assert.equal(parsed.breakfast,true);
  assert.equal(parsed.freeCancellation,true);
  assert.ok(parsed.interests.includes('food'));
  const bad=parseTravelQuery('カトマンズ、宇宙旅行、全てタダ',now);
  assert.equal(bad.destination,'');
  assert.equal(bad.budgetJPY,null);
});
test('flight indicative source denies unknown IATA, invalid dates and false lowest claims',()=>{
  assert.equal(parseIndicativeSearch({origin:'TYO',destination:'LON',departure:'2027-04-02',direct:'true'}).direct,true);
  assert.equal(parseIndicativeSearch({origin:'bad code',destination:'LON',departure:'2027-04-02'}),null);
  assert.equal(parseIndicativeSearch({origin:'LON',destination:'LON',departure:'2027-04-02'}),null);
  const data={success:true,data:[
    {origin:'TYO',destination:'LON',departure_at:'2027-04-02T12:00:00Z',price:120000,transfers:0},
    {origin:'TYO',destination:'LON',departure_at:'2027-04-02T08:00:00Z',price:97000,transfers:1},
    {origin:'OSL',destination:'LON',departure_at:'2027-04-02T09:00:00Z',price:3000},
  ]};
  const found=cleanIndicativeFares(data,{origin:'TYO',destination:'LON',departure:'2027-04-02'});
  assert.equal(found.length,2);
  assert.equal(found[0].amountJPY,97000);
  assert.equal(found[0].indicative,true);
  assert.equal(found[0].taxesConfirmed,false);
});
test('price comparison requires approved source, all-in comparable totals and 2 providers',()=>{
  const checkedAt='2026-10-17T10:00:00Z';
  const sample={provider:'one',type:'flight',total:97000,currency:'JPY',taxIncluded:true,feesIncluded:true,
    totalForAllTravelers:true,baggageIncluded:true,travelers:2,origin:'TYO',destination:'LON',
    departureDate:'2027-04-02',returnDate:'',checkedAt,sourceLicenseApproved:true};
  assert.equal(normalizeQuote({...sample,sourceLicenseApproved:false}),null);
  assert.equal(normalizeQuote({...sample,baggageIncluded:undefined}),null);
  const one=compareQuotes([sample],Date.parse('2026-10-17T10:15:00Z'));
  assert.equal(one[0].canClaimCheapest,false);
  assert.equal(one[0].best,null);
  const two=compareQuotes([sample,{...sample,provider:'two',total:87000}],Date.parse('2026-10-17T10:15:00Z'));
  assert.equal(two[0].best.provider,'two');
  assert.equal(two[0].canClaimCheapest,true);
  assert.equal(compareQuotes([sample],Date.parse('2026-10-18T10:15:00Z')).length,0);
});
test('official travel providers are not falsely presented as approved affiliates',()=>{
  assert.ok(TRAVEL_PROVIDERS.length>=20);
  assert.equal(new Set(TRAVEL_PROVIDERS.map(p=>p.id)).size,TRAVEL_PROVIDERS.length);
  assert.equal(TRAVEL_PROVIDER_TYPES.length,5);
  for(const provider of TRAVEL_PROVIDERS){
    assert.equal(providerTarget(provider).sponsored,false,provider.id);
    assert.ok(providerTarget(provider).url.startsWith('https://'));
    assert.equal(validOutboundEvent({event:'outbound',section:'travel',merchant:provider.id,placement:'global-'+provider.type,sponsored:false}),true);
  }
});
test('A8 Yahoo Travel original HTML preserved and visible separate from global comparison',()=>{
  const page=source('src/travel/TravelPage.jsx');
  assert.match(page,/GlobalTravelSearch/);
  assert.match(page,/YAHOO_TRAVEL_A8_CREATIVES/);
  assert.match(source('src/travel/a8TravelAds.js'),/4AZ9C4\+21TRSI\+4ZCO\+65ME9/);
});
