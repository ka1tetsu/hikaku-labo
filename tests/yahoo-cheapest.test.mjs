import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sortStays } from '../src/travel/staySearch.js';
import { compareEnteredQuotes } from '../src/travel/totalCost.js';
import { travelAffiliateEnabled, YAHOO_TRAVEL_A8_CREATIVES } from '../src/travel/a8TravelAds.js';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const quote=(id,providerId,base,props={})=>({id,type:'hotel',providerId,base:String(base),taxes:'0',extras:'0',discount:'0',points:'0',sameConditions:true,...props});

test('entered Yahoo and Rakuten prices determine cheapest without sponsored ranking boost',()=>{
  const first=compareEnteredQuotes([quote(1,'yahoo-travel',30000,{discount:'7000',points:'5000'}),quote(2,'rakuten-travel',26500,{extras:'1000'})],{type:'hotel'});
  assert.equal(first.comparisonPossible,true);
  assert.equal(first.cheapestAmongEntered.quote.providerId,'yahoo-travel');
  assert.equal(first.cheapestAmongEntered.cost.cashPayable,23000);
  assert.equal(first.cheapestAmongEntered.cost.nonCashPoints,5000);
  const second=compareEnteredQuotes([quote(1,'yahoo-travel',31000),quote(2,'rakuten-travel',26500)],{type:'hotel'});
  assert.equal(second.cheapestAmongEntered.quote.providerId,'rakuten-travel');
});
test('unconfirmed / single-site prices cannot be called cheapest',()=>{
  const incomplete=compareEnteredQuotes([quote(1,'yahoo-travel',25000),quote(2,'rakuten-travel',26000,{sameConditions:false})],{type:'hotel'});
  assert.equal(incomplete.comparisonPossible,false);
  assert.equal(incomplete.cheapestAmongEntered,null);
  const single=compareEnteredQuotes([quote(1,'yahoo-travel',25000)],{type:'hotel'});
  assert.equal(single.cheapestAmongEntered,null);
});
test('Rakuten available stay list is sortable by first night, not whole-trip',()=>{
  const rows=[{id:'missing',firstNightTotal:null,rating:4.5},{id:'b',firstNightTotal:12900,rating:4.8},{id:'a',firstNightTotal:9500,rating:3.8}];
  const result=sortStays(rows,'price');
  assert.equal(result[0].id,'a');
  assert.equal(result[1].id,'b');
  assert.equal(result[2].id,'missing');
});
test('no new-domain A8 ad without registered media origin; legacy still supports prior host',()=>{
  assert.equal(travelAffiliateEnabled({}),true);
  assert.equal(travelAffiliateEnabled({VITE_SITE_ORIGIN:'https://vivlica.com',VITE_A8_TRAVEL_REGISTERED_ORIGIN:'https://hikaku-labo.vercel.app'}),false);
  assert.equal(travelAffiliateEnabled({VITE_SITE_ORIGIN:'https://vivlica.com',VITE_A8_TRAVEL_REGISTERED_ORIGIN:'https://vivlica.com'}),true);
  assert.equal(travelAffiliateEnabled({VITE_SITE_ORIGIN:'https://vivlica.com',VITE_A8_TRAVEL_REGISTERED_ORIGIN:'https://vivlica.com',VITE_A8_TRAVEL_DISABLED:'true'}),false);
});
test('Yahoo A8 banner HTML, pixel IDs and sizes are preserved without stripping links',()=>{
  const banner234=YAHOO_TRAVEL_A8_CREATIVES.banner234;
  const banner300=YAHOO_TRAVEL_A8_CREATIVES.banner300;
  assert.match(banner234,/href="https:\/\/px\.a8\.net\/svt\/ejp\?a8mat=4AZ9C4\+21TRSI\+4ZCO\+65U41"/);
  assert.match(banner300,/href="https:\/\/px\.a8\.net\/svt\/ejp\?a8mat=4AZ9C4\+21TRSI\+4ZCO\+65ME9"/);
  assert.match(banner234,/<img border="0" width="234" height="60"/);
  assert.match(banner300,/<img border="0" width="300" height="250"/);
  for (const html of [banner234,banner300]) assert.match(html,/<img border="0" width="1" height="1" src="https:\/\/www\d+\.a8\.net\/0\.gif\?a8mat=/);
});
test('travel UI offers visible lowest-choice CTAs and original Yahoo A8 material with clear PR label',()=>{
  const cheapest=source('src/travel/StaySearch.jsx');
  const compare=source('src/travel/TotalCostComparator.jsx');
  const ad=source('src/travel/YahooTravelAd.jsx');
  const home=source('src/travel/TravelDiscovery.jsx');
  assert.match(cheapest,/useState\('recommended'\)/);
  assert.match(cheapest,/cheapestFirstNight/);
  assert.match(cheapest,/全泊分の最終支払額・Yahoo!トラベルを含む他社最安値ではありません/);
  assert.match(compare,/blank\(1,'hotel','yahoo-travel'\)/);
  assert.match(compare,/blank\(2,'hotel','rakuten-travel'\)/);
  assert.match(compare,/gx-cost-winning-cta/);
  assert.match(compare,/YahooTravelAd/);
  assert.match(home,/href="#travel-total-cost"/);
  assert.match(ad,/travelAffiliateEnabled\(import\.meta\.env\)/);
  assert.match(ad,/YAHOO_TRAVEL_A8_CREATIVES\[variant\]/);
  assert.match(ad,/dangerouslySetInnerHTML=\{\{ __html: html \}\}/);
  assert.match(ad,/PR・広告/);
});
