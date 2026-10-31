import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {combinedPriceComparison} from '../src/shared/multiShopPrices.js';
import {MANUAL_STORES,ALL_MANUAL_STORES,compareManualOffers} from '../src/compare/manualCompare.js';
import {MERCHANT_IDS,storeLinks} from '../src/shared/merchants.js';

const auto=(price,shippingStatus='free',extra={})=>({
 store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'A店',title:'SONY WH-1000XM5',
 price,url:'https://store.shopping.yahoo.co.jp/test/'+price+'.html',
 shippingStatus,sameProduct:true,matchBasis:'model',inStock:true,point:500,...extra,
});
const manual=(storeId,price,shipping='0',extra={})=>({
 storeId,price:String(price),shipping:String(shipping),discount:'0',points:'0',...extra
});

test('actual confirmed cash totals rank by shipping-inclusive cash, never reward deductions',()=>{
 const ranked=combinedPriceComparison({
   offers:[auto(20000,'unknown'),auto(23000,'free')],
   manualRows:[manual('amazon',21000,500),manual('yodobashi',22000,0)],
   confirmedSameProduct:true,
 });
 assert.equal(ranked.comparableCount,3);
 assert.equal(ranked.cheapest.storeId,'amazon');
 assert.equal(ranked.cheapest.cashTotal,21500);
 assert.equal(ranked.difference,500); // yodobashi ¥22,000
 assert.equal(ranked.incomplete.length,1);
 assert.equal(ranked.incomplete[0].itemPrice,20000);
 assert.equal(ranked.shopCount,3);
 assert.equal(ranked.status,'compared');
 assert.equal(ranked.ready[2].cashTotal,23000);
 assert.equal(ranked.ready[2].points,500);
});
test('a cheaper uncertain-shipping listing cannot beat a real known-total offer',()=>{
 const res=combinedPriceComparison({offers:[
 auto(100,'conditional'),auto(1000,'extra'),auto(1500,'unknown'),
 auto(1800,'free'),auto(1700,'free',{sameProduct:false}),
 auto(300,'free',{inStock:false}),auto(200,'free',{matchBasis:'unverified'})
 ]});
 assert.equal(res.cheapest.cashTotal,1800);
 assert.equal(res.incomplete.length,3);
 assert.equal(res.status,'single');
 assert.equal(res.comparableCount,1);
});
test('one checked manual price can compete with one API-confirmed offer',()=>{
 const a=combinedPriceComparison({offers:[auto(36000,'free')],
   manualRows:[manual('biccamera',35000,350,{discount:'500',points:'3000'})],confirmedSameProduct:true});
 assert.equal(a.cheapest.storeId,'biccamera');
 assert.equal(a.cheapest.cashTotal,34850);
 assert.equal(a.difference,1150);
 assert.equal(a.ready.find(x=>x.storeId==='biccamera').points,3000);
});
test('manual amounts are ignored until same-model condition is actively confirmed',()=>{
 const options={offers:[auto(30000)],manualRows:[manual('amazon',1,0)]};
 assert.equal(combinedPriceComparison(options).cheapest.cashTotal,30000);
 assert.equal(combinedPriceComparison({...options,confirmedSameProduct:true}).cheapest.cashTotal,1);
});
test('invalid shipping, coupons, unknown domains and duplicate store entries cannot change winner',()=>{
 const rows=[
  manual('amazon',25000,''),
  manual('fake-store',100,0),
  manual('mercari',31000,500),
  manual('mercari',1,0),
  manual('sofmap',30500,500,{discount:'40000'})
 ];
 const x=combinedPriceComparison({offers:[auto(35000)],manualRows:rows,confirmedSameProduct:true});
 assert.equal(x.cheapest.storeId,'mercari');
 assert.equal(x.cheapest.cashTotal,31500);
 assert.equal(x.ready.length,2);
});
test('12 traditional + six additional Japanese retailer sources are supported, while defaults stay simple',()=>{
 assert.deepEqual(MANUAL_STORES,['rakuten','amazon','yahoo-shopping']);
 assert.equal(ALL_MANUAL_STORES.length,18);
 assert.equal(new Set(ALL_MANUAL_STORES).size,18);
 assert.ok(ALL_MANUAL_STORES.every(id=>MERCHANT_IDS.includes(id)));
 assert.ok(storeLinks('WH-1000XM5').length>=16);
 for(const id of ['edion','joshin','nojima','sofmap','kojima','tsukumo']){
   const link=storeLinks('WH-1000XM5').find(s=>s.id===id);
   assert.match(link.url,/^https:\/\/www\.google\.com\/search\?/);
   assert.ok(decodeURIComponent(link.url).includes('site:'));
   assert.equal(link.sponsored,false);
 }
 const ranked=compareManualOffers([
  manual('amazon',25000,0),
  manual('edion',24000,0),
  manual('joshin',26000,0)
 ]);
 assert.equal(ranked.comparisonPossible,true);
 assert.equal(ranked.cheapest.row.storeId,'edion');
});
test('real comparison screens expose 18-store search, source-backed lowest and opt-in combined buyer prices',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const page=read('src/compare/ComparePage.jsx');
 const board=read('src/compare/ShopPriceBoard.jsx');
 const form=read('src/compare/ManualStoreCompare.jsx');
 assert.match(page,/<ShopPriceBoard/);
 assert.match(page,/autoOffers=\{rawOffers\}/);
 assert.match(board,/multistore-cheapest/);
 assert.match(board,/multistore-search/);
 assert.match(board,/送料が未確定の安い出品も見る/);
 assert.match(form,/combinedPriceComparison/);
 assert.match(form,/18ショップまで/);
 assert.match(form,/comparison\.comparisonPossible/);
 assert.match(form,/追加するショップを選択/);
 assert.match(form,/source==='api'/);
 assert.match(form,/recordFunnelEvent\('product_manual_ready'\)/);
 assert.doesNotMatch(form,/localStorage|sessionStorage|fetch\(/);
});
