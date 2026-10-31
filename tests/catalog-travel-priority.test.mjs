import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isSpecificProductQuery,searchModeFor} from '../src/shared/productSearchIntent.js';
import {catalogFromComparison} from '../src/shared/catalogSearch.js';
import {googleTravelDiscovery} from '../src/travel/googleDiscovery.js';

const make=(title,price,sameProduct=false,store='yahoo')=>({
 title, price, effectivePrice:price,point:0,store,storeName:store==='yahoo'?'Yahoo!ショッピング':'楽天市場',
 shopName:'デモ店舗',url:'https://store.shopping.yahoo.co.jp/demo/'+price+'.html',
 image:'',reviewAverage:4.6,reviewCount:40,sponsored:true,shippingStatus:'free',
 sameProduct,matchBasis:sameProduct?'model':'unverified'
});

test('broad product discovery uses relevance, explicit models use price ordering',()=>{
 assert.equal(searchModeFor('ワイヤレスイヤホン'),'recommended');
 assert.equal(searchModeFor('加湿器 省エネ'),'recommended');
 assert.equal(searchModeFor('Sony WH-1000XM5'),'price');
 assert.equal(searchModeFor('4548736132580'),'price');
 assert.equal(searchModeFor('iPhone 16 Pro'),'price');
});
test('Yahoo-only results display as Yahoo listings with real merchant links',()=>{
 const expensive=make('ソニー WH-1000XM5',38000,true);
 const accessory=make('WH-1000XM5 保護ケース',500,false);
 const cheap=make('ソニー WH-1000XM5',33000,true);
 const data={sources:{rakuten:'error',yahoo:'ok'},mode:'price',pageCount:3,offers:[accessory,expensive,cheap]};
 const result=catalogFromComparison(data,'WH-1000XM5');
 assert.deepEqual(result.items.map(item=>item.itemPrice),[33000,38000]);
 assert.ok(result.items.every(item=>item.sourceStore==='yahoo'));
 assert.ok(result.items.every(item=>item.itemUrl.includes('store.shopping.yahoo.co.jp')));
 assert.ok(result.items.every(item=>item.shopName==='デモ店舗'));
 assert.equal(result.pageCount,3);
 assert.equal(result.verifiedOnly,true);
});
test('broad discovery keeps upstream score order rather than cheap unrelated accessories',()=>{
 const items=[make('ワイヤレスイヤホン おすすめ商品',24000),make('ワイヤレスイヤホン 関連商品',1500)];
 const result=catalogFromComparison({mode:'recommended',offers:items,sources:{rakuten:'skipped',yahoo:'ok'}},'ワイヤレスイヤホン');
 assert.deepEqual(result.items.map(item=>item.itemPrice),[24000,1500]);
 assert.equal(result.verifiedOnly,false);
});
test('Google flight and hotel links keep search terms separate from price and availability claims',()=>{
 const stay=googleTravelDiscovery({place:'那覇',depart:'2026-11-30',checkout:'2026-12-02',adults:2,type:'stays'});
 assert.equal(stay.length,4);
 assert.ok(stay[0].href.startsWith('https://www.google.com/search?'));
 assert.ok(decodeURIComponent(stay[0].href).includes('那覇'));
 assert.ok(stay[1].href.startsWith('https://www.google.com/travel/hotels'));
 assert.ok(stay[2].href.includes('site%3Abooking.com'));
 const flights=googleTravelDiscovery({place:'那覇',type:'flights'});
 assert.equal(flights.length,1);
 assert.deepEqual(googleTravelDiscovery({place:'  '}),[]);
});
test('travel-first hub and Google research are above the trip itinerary; home uses shared catalog',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const home=read('src/App.jsx'),page=read('src/travel/TravelDiscovery.jsx'),provider=read('api/compare.js');
 assert.match(home,/searchCatalogItems/);
 assert.match(home,/hl-travel-priority/);
 assert.match(home,/setSortMode\(isSpecificProductQuery/);
 assert.ok(page.indexOf('tv-priority-booking')<page.indexOf('<BookingStarter'));
 assert.equal((page.match(/<BookingHub /g)||[]).length,1);
 assert.match(provider,/mode === 'recommended' \? '-score' : '\+price'/);
 assert.match(provider,/mode === 'recommended' \? Promise.resolve/);
 assert.match(read('src/components/ProductCard.jsx'),/item.sourceStore/);
});
