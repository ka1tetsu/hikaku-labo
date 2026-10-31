import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validBooking } from '../src/travel/bookingStarter.js';
import { buildStayLinks } from '../src/travel/bookingLinks.js';
const sample={place:'京都駅',checkin:'2026-11-09',checkout:'2026-11-11',adults:2,rooms:1};
test('explicit valid travel buyer conditions preserve date and guests',()=>{
  const request=validBooking(sample,'2026-10-31');
  assert.equal(request?.nights,2);
  const links=buildStayLinks({destination:{name:request.place,area:'domestic'},checkin:request.checkin,checkout:request.checkout,nights:request.nights,adults:request.adults,rooms:request.rooms,config:{rakutenId:'432a9f67.243910f6.432a9f68.e28a199a'}});
  assert.ok(links.some(x=>x.merchant==='rakuten-travel'&&x.sponsored));
  assert.equal(new URL(links.find(x=>x.provider==='booking').href).searchParams.get('checkin'),'2026-11-09');
});
test('cannot search an absent place, reversed date or past stay',()=>{
  for(const f of [{...sample,place:' '},{...sample,checkout:'2026-11-08'},{...sample,checkin:'2026-10-20',checkout:'2026-10-22'},{...sample,checkout:'2027-01-01'}])
    assert.equal(validBooking(f,'2026-10-31'),null);
});
test('front-page booking starter has actual source links and a registered Yahoo ad',()=>{
  const front=readFileSync(new URL('../src/travel/TravelDiscovery.jsx',import.meta.url),'utf8');
  const starter=readFileSync(new URL('../src/travel/BookingStarter.jsx',import.meta.url),'utf8');
  assert.match(front,/<BookingStarter\s*\/>/);
  assert.match(front,/href="#stay-booking"/);
  assert.match(starter,/YahooTravelAd/);
  assert.match(starter,/buildStayLinks/);
  assert.match(starter,/placement:'stay-quick'/);
  assert.match(starter,/価格は予約先で確認/);
});
