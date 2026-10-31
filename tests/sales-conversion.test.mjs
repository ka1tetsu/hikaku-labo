import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { purchaseChoices, sourceNotice } from '../src/shared/buyerDecision.js';
import { normalizeYahooOffer } from '../src/shared/priceCompare.js';
import { shippingLabel } from '../src/shared/compareWorkbench.js';
import { validFunnelEvent } from '../src/shared/outboundSchema.js';

const offer=(price,extra={})=>({
  store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'例の店',
  title:'ソニー WH-1000XM5',url:'https://store.shopping.yahoo.co.jp/test/'+price+'.html',
  price,point:0,shippingStatus:'unknown',sameProduct:true,matchBasis:'model',reviewCount:30,...extra
});

test('buyer decision only features verified same-product candidates, never commission signals',()=>{
  const cheapAccessory=offer(1000,{sameProduct:false,matchBasis:'unverified',sponsored:true});
  const wrongJan=offer(500,{sameProduct:false,matchBasis:'mismatch'});
  const first=offer(20000,{sponsored:false});
  const shipped=offer(21200,{shippingStatus:'free',sponsored:true,reviewCount:200});
  const picks=purchaseChoices([cheapAccessory,wrongJan,shipped,first]);
  assert.deepEqual(picks.map(p=>p.kind),['cash','shipping']);
  assert.equal(picks[0].offer,first);
  assert.equal(picks[1].offer,shipped);
  assert.equal(picks[1].priceDifference,1200);
  assert.equal(purchaseChoices([cheapAccessory,wrongJan]).length,0);
  assert.equal(purchaseChoices([first]).length,1);
  assert.deepEqual([first,shipped].map(x=>x.price),[20000,21200],'input API data not mutated');
});
test('partial source errors never claim all marketplaces were compared',()=>{
  const notice=sourceNotice({rakuten:'error',yahoo:'ok'});
  assert.deepEqual(notice.active,['Yahoo!ショッピング']);
  assert.deepEqual(notice.unavailable,['楽天市場']);
  assert.match(notice.message,/楽天市場は今回取得できませんでした/);
  assert.equal(sourceNotice({rakuten:'disabled',yahoo:'disabled'}),null);
});
test('modern Yahoo limited PayPay rewards and conditional-free shipping are respected',()=>{
  const normalized=normalizeYahooOffer({
    name:'ソニー WH-1000XM5',price:30000,
    point:{amount:0,bonusAmount:0,lyLimitedBonusAmount:420,premiumAmount:1200,lyLimitedPremiumBonusAmount:2200},
    shipping:{code:3},
    url:'https://store.shopping.yahoo.co.jp/test/x.html'
  });
  assert.equal(normalized.point,420);
  assert.equal(normalized.pointKind,'paypay-limited');
  assert.equal(normalized.effectivePrice,29580);
  assert.equal(normalized.shippingStatus,'conditional');
  assert.equal(normalized.shippingFree,false);
  assert.match(shippingLabel(normalized),/条件付き送料無料/);
  const legacy=normalizeYahooOffer({name:'x',price:5000,point:{amount:150},url:'https://store.shopping.yahoo.co.jp/test/y.html'});
  assert.equal(legacy.point,150);
  assert.equal(legacy.pointKind,'provider');
  const missing=normalizeYahooOffer({name:'x',price:5000,url:'https://store.shopping.yahoo.co.jp/test/z.html'});
  assert.equal(missing.point,0);
});
test('anonymous product funnel milestones exclude unrelated sections and private details',()=>{
  for(const action of ['product_search','product_results_ready','product_offer_selected','product_target_saved']){
    assert.equal(validFunnelEvent({event:'funnel',page:'compare',action}),true);
    assert.equal(validFunnelEvent({event:'funnel',page:'travel',action}),false);
    assert.equal(validFunnelEvent({event:'funnel',page:'compare',action,query:'secret'}),false);
  }
});
test('purchase buttons and search-to-outbound UX are rendered in the real comparison route',()=>{
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const page=read('src/compare/ComparePage.jsx'), choices=read('src/compare/BuyerChoices.jsx');
  assert.match(page,/<BuyerChoices/);
  assert.match(page,/cp-provider-notice/);
  assert.match(page,/recordFunnelEvent\('product_search'\)/);
  assert.match(choices,/decision-cash/);
  assert.match(choices,/decision-shipping/);
  assert.match(choices,/sponsored noopener noreferrer/);
  assert.match(choices,/送料/);
});
