import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DESTINATION_CATALOG} from '../src/travel/destinations.js';
import {makeItinerary} from '../src/travel/recommender.js';
import {TOKYO_STAY_AREAS,itineraryStayArea,itineraryHotelNights} from '../src/travel/itineraryNearbyHotels.js';
import {buildStayLinks,addDays} from '../src/travel/bookingLinks.js';

const city=id=>DESTINATION_CATALOG.find(d=>d.id===id);
test('Tokyo classic 2-night plan shows Asakusa and Tokyo Station real hotel choices',()=>{
 const days=makeItinerary(city('tokyo'),'classic',2,'standard');
 assert.equal(days.length,3);
 assert.equal(itineraryStayArea(city('tokyo'),days[0]).id,'asakusa');
 assert.equal(itineraryStayArea(city('tokyo'),days[1]).id,'marunouchi');
 assert.equal(itineraryStayArea(city('tokyo'),days[2]).id,'shinjuku');
 assert.deepEqual(days.map(day=>itineraryHotelNights(2,day)),[true,true,false]);
 assert.equal(itineraryHotelNights(0,days[0]),false);
 assert.equal(itineraryHotelNights(1,days[1]),false);
});
test('each curated hotel has an HTTPS official access source and non-fictional location',()=>{
 assert.equal(Object.values(TOKYO_STAY_AREAS).length,3);
 const ids=[],names=[];
 for(const area of Object.values(TOKYO_STAY_AREAS)){
   assert.ok(area.label&&area.why&&area.hotels.length>=2);
   for(const hotel of area.hotels){
     assert.match(hotel.id,/^[a-z-]+$/);
     assert.ok(hotel.name&&hotel.location&&hotel.access&&hotel.source);
     assert.equal(new URL(hotel.url).protocol,'https:');
     assert.ok(['richmondhotel.jp','www.tobuhotel.co.jp','marunouchi.metropolitan.jp',
       'www.tokyostationhotel.jp','www.toyoko-inn.com','gracery.com'].includes(new URL(hotel.url).hostname));
     assert.ok(!('price' in hotel)&&!('rating' in hotel)&&!('available' in hotel));
     ids.push(hotel.id);names.push(hotel.name);
   }
 }
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(new Set(names).size,names.length);
});
test('nearby hotels never fabricate geographic matches for overseas or unrecognized stops',()=>{
 assert.equal(itineraryStayArea(city('kyoto'),makeItinerary(city('kyoto'),'classic',2)[0]),null);
 assert.equal(itineraryStayArea(city('tokyo'),{stops:['自由散策・休息（営業時間と帰路を確認）']}),null);
 assert.equal(itineraryStayArea(null,{stops:['浅草']}),null);
 assert.equal(itineraryStayArea(city('tokyo'),null),null);
});
test('booking link preserves full-trip dates, adults and rooms while using hotel name as search',()=>{
 const name=TOKYO_STAY_AREAS.asakusa.hotels[0].name;
 const links=buildStayLinks({query:name+' 東京',checkin:'2026-11-12',checkout:addDays('2026-11-12',2),nights:2,adults:3,rooms:2});
 const booking=new URL(links.find(x=>x.provider==='booking').href);
 assert.equal(booking.searchParams.get('ss'),name+' 東京');
 assert.equal(booking.searchParams.get('checkin'),'2026-11-12');
 assert.equal(booking.searchParams.get('checkout'),'2026-11-14');
 assert.equal(booking.searchParams.get('group_adults'),'3');
 assert.equal(booking.searchParams.get('no_rooms'),'2');
 assert.deepEqual(buildStayLinks({query:name,nights:0}),[]);
});
test('itinerary app shows hotel cards within each overnight day and discloses missing prices',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const page=read('src/travel/TravelDiscovery.jsx');
 const panel=read('src/travel/ItineraryNearbyHotels.jsx');
 assert.match(page,/<ItineraryNearbyHotels destination=\{destination\} day=\{day\}/);
 assert.match(panel,/itineraryHotelNights/);
 assert.match(panel,/全\{nights\}泊を同じホテルで探す/);
 assert.match(panel,/公式サイトで立地確認/);
 assert.match(panel,/空室・宿泊料金・評価は取得していません/);
 assert.match(panel,/recordOutboundClick/);
 assert.doesNotMatch(panel,/hotelMinCharge|hotel\.price|\{hotel\.reviewAverage\}/);
});
