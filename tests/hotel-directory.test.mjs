import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validHotelNo, hotelPagePath, normaliseHotelDetails } from '../src/travel/hotelDetails.js';
import { findHotelById } from '../api/hotel.js';
import { parseStaySearch } from '../src/travel/staySearch.js';
import { normalizeStays, findStays } from '../api/stays.js';
import { travelAffiliateEnabled, YAHOO_TRAVEL_A8_CREATIVES } from '../src/travel/a8TravelAds.js';

const fixture={hotels:[{hotel:[
  {hotelBasicInfo:{
    hotelNo:12345,hotelName:'架空のホテル（テスト用）',hotelInformationUrl:'https://travel.rakuten.co.jp/HOTEL/12345/12345.html',
    hotelImageUrl:'https://img.travel.rakuten.co.jp/example.jpg',roomImageUrl:'https://trvimg.r10s.jp/example.png',
    reviewAverage:4.6,reviewCount:89,hotelMinCharge:11000,address1:'テスト県',address2:'サンプル市',
    hotelSpecial:'これはテスト用データ',nearestStation:'サンプル駅',access:'徒歩5分',
  }},
  {hotelDetailInfo:{areaName:'サンプル',checkinTime:'15:00',checkoutTime:'11:00'}},
  {hotelRatingInfo:{locationAverage:4.5,roomAverage:4.2,serviceAverage:4.6}},
  {hotelPolicyInfo:{note:'テスト用規約'}},
]}]};

test('hotel identifiers are strict and shareable links are safe',()=>{
  assert.equal(validHotelNo('12345'),true);
  for(const x of ['0','-1','123abc','1/../','1?x=2','00123','1'.repeat(11),'']) assert.equal(validHotelNo(x),false);
  assert.equal(hotelPagePath('12345'),'/travel/hotels/?id=12345');
  assert.equal(hotelPagePath('bad'),null);
});
test('detail uses only matching real API data; does not hallucinate properties',()=>{
  const item=normaliseHotelDetails(fixture,'12345');
  assert.equal(item.name,'架空のホテル（テスト用）');
  assert.equal(item.priceGuideJPY,11000);
  assert.equal(item.priceKind,'one_room_one_night_from_guide_not_live');
  assert.equal(item.reviewAverage,4.6);
  assert.equal(item.ratingDetails.location,4.5);
  assert.equal(item.image,'https://img.travel.rakuten.co.jp/example.jpg');
  assert.equal(item.sponsored,false);
  assert.equal(normaliseHotelDetails(fixture,'54321'),null);
  assert.equal(normaliseHotelDetails({hotels:[]},'12345'),null);
});
test('untrusted provider links and photos cannot escape Rakuten allowlist',()=>{
  const copy=JSON.parse(JSON.stringify(fixture));
  copy.hotels[0].hotel[0].hotelBasicInfo.hotelInformationUrl='https://phishing.example.com/';
  copy.hotels[0].hotel[0].hotelBasicInfo.hotelImageUrl='https://evil.example.com/pixel';
  copy.hotels[0].hotel[0].hotelBasicInfo.roomImageUrl='https://bad.invalid/x';
  const hotel=normaliseHotelDetails(copy,'12345');
  assert.equal(hotel.url,null);
  assert.equal(hotel.image,null);
  assert.equal(hotel.roomImage,null);
});
test('API rejects malformed IDs and missing access keys without leaking secrets',async()=>{
  assert.deepEqual(await findHotelById('123abc',{env:{}}),{status:'invalid_id',hotel:null});
  assert.deepEqual(await findHotelById('12345',{env:{}}),{status:'not_connected',hotel:null});
});
test('hotel detail endpoint obtains licensed provider data with server-only access key',async()=>{
  let called='';
  const result=await findHotelById('12345',{env:{RAKUTEN_ACCESS_KEY:'secret-access-key'},
    request:async(url,options)=>{called=url;assert.equal(options.headers.accessKey,'secret-access-key');return {ok:true,status:200,text:JSON.stringify(fixture)};},
  });
  assert.equal(result.status,'ok');
  assert.equal(result.hotel.id,'12345');
  assert.equal(new URL(called).searchParams.get('hotelNo'),'12345');
  assert.equal(called.includes('secret-access-key'),false);
  assert.equal(called.includes('HotelDetailSearch/20260731'),true);
});
test('pagination is limited to 100 pages and does not assume full inventory',()=>{
  const base={place:'京都駅',checkin:'2026-11-05',checkout:'2026-11-07',adults:'2'};
  assert.equal(parseStaySearch(base,'2026-10-29').page,1);
  assert.equal(parseStaySearch({...base,page:'100'},'2026-10-29').page,100);
  for(const page of ['0','101','NaN','1.1','-1'])assert.equal(parseStaySearch({...base,page},'2026-10-29'),null);
});
test('paged provider search filters properties and reports result-page bounds',async()=>{
  const keyword={pagingInfo:{pageCount:4},hotels:[{hotel:[{hotelBasicInfo:{hotelNo:12345}}]}]};
  const vacant={hotels:[{hotel:[
    {hotelBasicInfo:{hotelNo:12345,hotelName:'テスト旅館',hotelImageUrl:'https://img.travel.rakuten.co.jp/example.jpg',hotelInformationUrl:'https://travel.rakuten.co.jp/HOTEL/12345/12345.html'}},
    {roomInfo:[{roomBasicInfo:{roomName:'ツイン',planId:'1',roomClass:'A'}},{dailyCharge:{total:18000,stayDate:'2026-11-05'}}]},
  ]}]};
  const search=parseStaySearch({place:'京都駅',checkin:'2026-11-05',checkout:'2026-11-07',adults:'2',page:'2'},'2026-10-29');
  const urls=[];
  const output=await findStays(search,{env:{RAKUTEN_ACCESS_KEY:'hidden'},request:async url=>{
    urls.push(url);return {ok:true,status:200,text:JSON.stringify(url.includes('KeywordHotelSearch')?keyword:vacant)};
  }});
  assert.equal(output.status,'ok');
  assert.equal(output.page,2);
  assert.equal(output.pageCount,4);
  assert.equal(output.offers[0].image,'https://img.travel.rakuten.co.jp/example.jpg');
  assert.ok(urls.some(url=>new URL(url).searchParams.get('page')==='2'));
});
test('A8 confirmed canonical origin is enabled, disable switch and original creative are intact',()=>{
  assert.equal(travelAffiliateEnabled({}),true);
  assert.equal(travelAffiliateEnabled({VITE_A8_TRAVEL_DISABLED:'true'}),false);
  assert.equal(travelAffiliateEnabled({VITE_SITE_ORIGIN:'https://other.invalid'}),false);
  assert.equal(travelAffiliateEnabled({VITE_A8_TRAVEL_REGISTERED_ORIGIN:'https://other.invalid'}),false);
  assert.match(YAHOO_TRAVEL_A8_CREATIVES.banner234,/4AZ9C4\+21TRSI\+4ZCO\+65U41/);
  assert.match(YAHOO_TRAVEL_A8_CREATIVES.banner300,/4AZ9C4\+21TRSI\+4ZCO\+65ME9/);
});
test('detail and listing have working navigation; unverified hotels stay out of SEO sitemap',()=>{
  const page=readFileSync(new URL('../src/travel/HotelDetailPage.jsx',import.meta.url),'utf8');
  const search=readFileSync(new URL('../src/travel/StaySearch.jsx',import.meta.url),'utf8');
  const html=readFileSync(new URL('../travel/hotels/index.html',import.meta.url),'utf8');
  assert.match(page,/YahooTravelAd/);
  assert.match(search,/hotelPagePath\(offer.hotelNo\)/);
  assert.match(search,/hs-card-grid/);
  assert.match(search,/pageCount/);
  assert.match(html,/noindex,follow/);
});
