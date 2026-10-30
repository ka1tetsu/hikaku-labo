import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRAVEL_PROVIDERS } from '../src/travel/providers.js';
import { buildStayLinks } from '../src/travel/bookingLinks.js';
import { globalProviderTarget } from '../src/travel/searchLinkAdapter.js';
import { prepareProviderRows, filterProviderRows, providerComparisonRows } from '../src/travel/providerBoard.js';

const source = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const hotel = { id:'kyoto',name:'京都',area:'domestic',iata:'KIX',international:false };
const criteria = { stayLinks:buildStayLinks({
  destination:hotel,query:'京都',checkin:'2026-11-16',checkout:'2026-11-19',nights:3,
  adults:2,rooms:1,config:{}
}),originCode:'TYO',destination:{id:'seoul',name:'ソウル',iata:'ICN',international:true},
departureDate:'2026-11-16',returnDate:'2026-11-19',nights:3,travelers:2,rooms:1,config:{} };

test('many distinct official providers in one directory including additional domestic and global OTA sites',()=>{
  assert.equal(TRAVEL_PROVIDERS.length,29);
  assert.equal(new Set(TRAVEL_PROVIDERS.map(p=>p.id)).size,29);
  for(const id of ['yahoo-travel','rakuten-travel','booking','agoda','jalan','ikyu','relux','jtb','trip-hotels','expedia-flights','skyscanner','google-flights']){
    assert.ok(TRAVEL_PROVIDERS.some(p=>p.id===id),id);
  }
  for(const provider of TRAVEL_PROVIDERS){
    const url=new URL(provider.url);
    assert.equal(url.protocol,'https:');
    assert.equal(provider.affiliate,false);
    assert.ok(provider.capabilities.length>=1);
  }
});
test('Booking.com and Expedia hotel searches carry actual entered city, dates, people and rooms',()=>{
  const rows=prepareProviderRows(TRAVEL_PROVIDERS.filter(x=>x.type==='hotel'),criteria);
  const booking=rows.find(x=>x.provider.id==='booking');
  const expedia=rows.find(x=>x.provider.id==='expedia');
  assert.equal(booking.hasSearchHandoff,true);
  assert.equal(expedia.hasSearchHandoff,true);
  assert.deepEqual(booking.transferredFields,['目的地','宿泊日','人数','部屋数']);
  const url=new URL(booking.target.url);
  assert.equal(url.searchParams.get('ss'),'京都');
  assert.equal(url.searchParams.get('checkin'),'2026-11-16');
  assert.equal(url.searchParams.get('checkout'),'2026-11-19');
  assert.equal(url.searchParams.get('group_adults'),'2');
  assert.equal(booking.priceJPY,null);
  assert.equal(booking.target.sponsored,false);
});
test('Expedia flights handoff only with a supported route and valid date, never invent unknown flights',()=>{
  const provider=TRAVEL_PROVIDERS.find(x=>x.id==='expedia-flights');
  const ready=globalProviderTarget(provider,criteria);
  assert.equal(ready.carriesSearch,true);
  assert.match(ready.url,/Flights-Search/);
  assert.match(ready.url,/2026/);
  assert.equal(ready.sponsored,false);
  const empty=globalProviderTarget(provider,{...criteria,originCode:'INVALID'});
  assert.equal(empty.carriesSearch,false);
  assert.equal(empty.url,provider.url);
});
test('sites without verified compatible deep links do not imply that any search conditions were carried',()=>{
  const row=prepareProviderRows(TRAVEL_PROVIDERS,criteria).find(x=>x.provider.id==='yahoo-travel');
  assert.equal(row.hasSearchHandoff,false);
  assert.deepEqual(row.transferredFields,[]);
  assert.equal(row.priceStatus,'not_fetched');
  assert.equal(row.priceJPY,null);
  const airline=prepareProviderRows(TRAVEL_PROVIDERS,criteria).find(x=>x.provider.id==='ana');
  assert.equal(airline.hasSearchHandoff,false);
});
test('comparison ranking depends on search handoff, never ad commissions or fake price data',()=>{
  const input=prepareProviderRows(TRAVEL_PROVIDERS.filter(x=>x.type==='hotel'),criteria);
  const ranked=filterProviderRows(input,{sort:'handoff'});
  assert.ok(ranked[0].hasSearchHandoff);
  const after=ranked.findIndex(x=>!x.hasSearchHandoff);
  assert.ok(after>=1);
  assert.ok(ranked.slice(after).every(x=>!x.hasSearchHandoff));
  const filtered=filterProviderRows(input,{phrase:'キャンセル'});
  assert.ok(filtered.every(x=>[x.provider.name,...x.provider.capabilities].join(' ').includes('キャンセル')));
  assert.ok(filterProviderRows(input,{onlySearchReady:true}).every(x=>x.hasSearchHandoff));
  assert.deepEqual(filterProviderRows(input,{phrase:'実在しないサイト名'}),[]);
  assert.equal(providerComparisonRows().find(x=>x.label==='現在の料金').get(ranked[0]),'未取得：予約サイトで確認');
});
test('multi-site OTA UI supports filters, accessible 4-way comparison and transparent pricing',()=>{
  const board=source('src/travel/MultiProviderBoard.jsx');
  const search=source('src/travel/GlobalTravelSearch.jsx');
  const home=source('src/travel/TravelDiscovery.jsx');
  assert.match(search,/<MultiProviderBoard/);
  assert.match(search,/useState\('hotel'\)/);
  assert.match(board,/layout === 'cards'/);
  assert.match(board,/setSelected/);
  assert.match(board,/ids.length < 4/);
  assert.match(board,/role="region"/);
  assert.match(board,/YahooTravelAd/);
  assert.match(board,/料金を取得/);
  assert.match(board,/sponsored noopener noreferrer/);
  assert.match(board,/href="#travel-total-cost"/);
  assert.match(home,/href="#global-travel-compare"/);
});
