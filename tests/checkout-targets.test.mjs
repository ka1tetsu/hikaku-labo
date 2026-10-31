import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moneyInput, checkoutEstimate, checkoutComparison } from '../src/shared/checkoutEstimate.js';
import { WATCH_STORAGE_KEY, WATCH_MAX, makePriceTarget, watchQueryId, parsePriceTargets, savePriceTarget, priceTargetLink, evaluatePriceTarget } from '../src/shared/priceTargets.js';

const offer=(price, options={})=>({
  store:'rakuten',storeName:'楽天市場',url:'https://item.rakuten.co.jp/test/example/',
  title:'SONY WH-1000XM5',shopName:'例の店',shippingStatus:'unknown',
  shippingFree:false,point:500,price,...options,
});
const query={q:'SONY WH-1000XM5',ref:'SONY WH-1000XM5'};
test('only non-negative whole-yen buyer inputs are accepted',()=>{
  assert.equal(moneyInput(''),null);
  assert.equal(moneyInput('0'),0);
  assert.equal(moneyInput('0500'),500);
  assert.equal(moneyInput('-1'),null);
  assert.equal(moneyInput('1.5'),null);
  assert.equal(moneyInput('1e3'),null);
  assert.equal(moneyInput('1000000000'),null);
  assert.equal(moneyInput('550円'),null);
});
test('never assume unknown shipping is zero and never subtract points from cash total',()=>{
  const product=offer(12000);
  assert.equal(checkoutEstimate(product).status,'needs-shipping');
  assert.equal(checkoutEstimate(product,{coupon:'700'}).total,null);
  const estimate=checkoutEstimate(product,{shipping:'550',coupon:'700'});
  assert.equal(estimate.total,11850);
  assert.equal(estimate.afterPoints,11350);
  assert.equal(estimate.shippingSource,'buyer-entered');
  assert.equal(checkoutEstimate(offer(12000,{shippingStatus:'free'})).total,12000);
  assert.equal(checkoutEstimate(product,{shipping:'0'}).total,12000);
  assert.equal(checkoutEstimate(product,{shipping:'0',coupon:'12001'}).status,'invalid');
  assert.equal(checkoutEstimate(product,{shipping:'-100'}).status,'invalid');
});
test('checkout ranking only considers offers with an actually calculable shipping amount',()=>{
  const unknown=offer(1000,{url:'https://item.rakuten.co.jp/test/cheap/'});
  const free=offer(1500,{url:'https://item.rakuten.co.jp/test/other/',shippingStatus:'free'});
  let comparison=checkoutComparison([unknown,free]);
  assert.equal(comparison.cheapest.offer,free);
  assert.equal(comparison.missingCount,1);
  comparison=checkoutComparison([unknown,free],{'rakuten:https://item.rakuten.co.jp/test/cheap/':{shipping:'100'}});
  assert.equal(comparison.cheapest.total,1100);
  assert.equal(comparison.difference,400);
  assert.equal(comparison.missingCount,0);
});
test('price targets only store search + goal and use a bounded, deduplicated list',()=>{
  const target=makePriceTarget(query,30000);
  assert.equal(target.target,30000);
  assert.equal(target.query.q,query.q);
  assert.equal(makePriceTarget(query,0),null);
  assert.equal(makePriceTarget({},30000),null);
  assert.equal(WATCH_STORAGE_KEY,'vivlica-product-targets-v1');
  const saved=savePriceTarget([target],makePriceTarget(query,28000));
  assert.equal(saved.length,1);
  assert.equal(saved[0].target,28000);
  assert.equal(priceTargetLink(target),'/compare/?'+watchQueryId(query));
  assert.deepEqual(parsePriceTargets('{broken'),[]);
  const parsed=parsePriceTargets(JSON.stringify([target,target,{ query, target:-2 },null]));
  assert.equal(parsed.length,1);
  const many=Array.from({length:WATCH_MAX+4},(_,i)=>makePriceTarget({q:'model'+i},i+1));
  assert.equal(parsePriceTargets(JSON.stringify(many)).length,WATCH_MAX);
  assert.ok(!JSON.stringify(parsed).includes('itemPrice'));
});
test('only verified same-product API candidates can reach the saved threshold',()=>{
  const target=makePriceTarget(query,32000);
  const data={fetchedAt:'2026-10-31T06:00:00.000Z',offers:[
    {...offer(3000),sameProduct:false,matchBasis:'unverified'},
    {...offer(33000),sameProduct:true,matchBasis:'model'},
  ]};
  assert.equal(evaluatePriceTarget(target,data,query).status,'above');
  data.offers[1].price=31000;
  const result=evaluatePriceTarget(target,data,query);
  assert.equal(result.status,'reached');
  assert.equal(result.lowest,31000);
  assert.equal(evaluatePriceTarget(target,data,{q:'other'}).status,'not-checked');
  assert.equal(evaluatePriceTarget(target,{offers:[{...offer(3000),sameProduct:false,matchBasis:'unverified'}]},query).status,'not-verified');
});
test('checkout and target tools are visible on actual comparison route',()=>{
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  assert.match(read('src/compare/ComparePage.jsx'),/<PriceTargetMemo/);
  assert.match(read('src/compare/OfferWorkbench.jsx'),/<CheckoutEstimator/);
  assert.match(read('src/compare/CheckoutEstimator.jsx'),/送料.*クーポン/);
  assert.match(read('src/compare/PriceTargetMemo.jsx'),/自動監視やメール/);
});
