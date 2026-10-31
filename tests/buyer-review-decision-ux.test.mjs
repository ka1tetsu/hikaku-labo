import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buyingDecisionCandidates} from '../src/shared/buyingDecisionCandidates.js';
import {reviewResearchOffers} from '../src/shared/reviewResearch.js';

const base={store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'Aショップ',title:'WH-1000XM5 ヘッドホン',
  price:30000,url:'https://store.shopping.yahoo.co.jp/a/123.html',sameProduct:true,matchBasis:'model',
  shippingStatus:'free',inStock:true,reviewAverage:4.5,reviewCount:120,sellerReviewAverage:4.6,sellerReviewCount:300};
const make=(changes={})=>({...base,...changes});
test('independent decisions are transparent and never commission-weighted',()=>{
 const cheapest=make({price:28000,reviewAverage:0,reviewCount:0,sellerReviewCount:0,
   url:'https://store.shopping.yahoo.co.jp/a/cheapest.html',sponsored:false});
 const product=make({price:30000,reviewAverage:4.7,reviewCount:200,sellerReviewAverage:4.2,sellerReviewCount:25,
   url:'https://store.shopping.yahoo.co.jp/a/product.html',sponsored:true});
 const seller=make({price:32000,reviewAverage:4.0,reviewCount:30,sellerReviewAverage:4.9,sellerReviewCount:600,
   url:'https://store.shopping.yahoo.co.jp/a/seller.html',sponsored:true});
 const result=buyingDecisionCandidates([seller,product,cheapest]);
 assert.deepEqual(result.map(x=>x.key),['cash','product','seller']);
 assert.deepEqual(result.map(x=>x.offer?.price),[28000,30000,32000]);
 assert.deepEqual(buyingDecisionCandidates([seller,product,{...cheapest,sponsored:true}]).map(x=>x.offer?.price),[28000,30000,32000]);
});
test('unknown shipping and tiny review samples cannot claim cheapest or high-confidence choices',()=>{
 const cheapUncertain=make({price:200,shippingStatus:'unknown',reviewAverage:5,reviewCount:1,sellerReviewAverage:5,sellerReviewCount:1,
   url:'https://store.shopping.yahoo.co.jp/a/unknown.html'});
 const reliable=make({price:5000,shippingStatus:'free',reviewAverage:4.3,reviewCount:180,sellerReviewAverage:4.4,sellerReviewCount:70,
   url:'https://store.shopping.yahoo.co.jp/a/reliable.html'});
 const result=buyingDecisionCandidates([cheapUncertain,reliable]);
 assert.equal(result[0].offer.url,reliable.url);
 assert.equal(result[1].offer.url,reliable.url);
 assert.equal(result[2].offer.url,reliable.url);
});
test('similar accessories, explicitly out-of-stock listings and no-data ratings are excluded',()=>{
 const accessory=make({price:1,reviewAverage:5,reviewCount:9999,sellerReviewAverage:5,sellerReviewCount:9999,sameProduct:false,
   url:'https://store.shopping.yahoo.co.jp/a/case.html'});
 const out=make({price:2,inStock:false,reviewAverage:5,reviewCount:1000,
   url:'https://store.shopping.yahoo.co.jp/a/out.html'});
 const none=make({price:45000,reviewCount:0,sellerReviewCount:0,
   shippingStatus:'unknown',url:'https://store.shopping.yahoo.co.jp/a/no.html'});
 const result=buyingDecisionCandidates([accessory,out,none]);
 assert.ok(result.every(x=>x.offer===null));
 assert.ok(result.every(x=>x.why.length>10));
});
test('when a verified product has no reviews, unrelated highly-rated accessories never replace it',()=>{
 const exact=make({reviewAverage:0,reviewCount:0});
 const caseReview=make({title:'WH-1000XM5 収納ケース',sameProduct:false,matchBasis:'unverified',
   reviewAverage:5,reviewCount:10000,url:'https://store.shopping.yahoo.co.jp/a/case.html'});
 const result=reviewResearchOffers([caseReview,exact]);
 assert.equal(result.verifiedOnly,true);
 assert.deepEqual(result.rows,[]);
 const noVerified=reviewResearchOffers([caseReview]);
 assert.equal(noVerified.verifiedOnly,false);
 assert.deepEqual(noVerified.rows,[caseReview]);
});
test('evidence-to-shortlist controls, decision section and skip-navigation are wired into the actual page',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const page=read('src/compare/ComparePage.jsx');
 const review=read('src/compare/ReviewResearchPanel.jsx');
 const decision=read('src/compare/PurchaseReasonPanel.jsx');
 assert.match(page,/<PurchaseReasonPanel/);
 assert.match(page,/onChoose=\{chooseFromReview\}/);
 assert.match(page,/getElementById\\('cp-shortlist-title'\\)/); // matches reference to actual target
 assert.match(review,/価格と条件の比較表に追加/);
 assert.match(review,/別の商品やアクセサリーの高評価を代わりに表示していません/);
 assert.match(decision,/広告料で決めたおすすめではありません/);
 assert.match(page,/cp-quick-nav/);
 assert.match(page,/cp-research-title/);
 assert.match(page,/cp-allshops-title/);
});
