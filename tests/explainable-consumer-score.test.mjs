import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {confidenceAdjustedRating,ratingIndex,RATING_PRIOR} from '../src/shared/reviewEvidence.js';
import {CONSUMER_PROFILES,scoreConsumerOffers} from '../src/shared/consumerScore.js';

const base={store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'A店',title:'SONY WH-1000XM5',
 price:30000,url:'https://store.shopping.yahoo.co.jp/a/30000.html',sameProduct:true,matchBasis:'model',
 shippingStatus:'free',inStock:true,reviewAverage:4.5,reviewCount:300,sellerReviewAverage:4.5,sellerReviewCount:300};
const make=(data={})=>({...base,...data});

test('published editorial Bayesian prior shrinks low-n stars, leaves large sample near raw average',()=>{
 assert.deepEqual(RATING_PRIOR,{mean:3.8,count:15});
 assert.ok(Math.abs(confidenceAdjustedRating(5,1)-3.875)<1e-10);
 assert.ok(Math.abs(confidenceAdjustedRating(4.5,300)-((4.5*300+3.8*15)/315))<1e-10);
 assert.equal(Number(confidenceAdjustedRating(4.8,10).toFixed(2)),4.20);
 assert.ok(confidenceAdjustedRating(5,1)<confidenceAdjustedRating(4.5,300));
 assert.ok(Math.abs(ratingIndex(5,1)-71.875)<1e-9);
 assert.equal(ratingIndex(0,0),null);
 assert.equal(confidenceAdjustedRating(5,0),-1);
});

test('score profile weights sum to 100 and changes genuinely switch consumer rankings',()=>{
 assert.ok(Object.values(CONSUMER_PROFILES).every(p=>p.price+p.product+p.seller===100));
 const cheap=make({price:20000,reviewAverage:3,reviewCount:100,sellerReviewAverage:3,sellerReviewCount:100,
 url:'https://store.shopping.yahoo.co.jp/a/cheap.html'});
 const wellReviewed=make({price:23000,reviewAverage:4.9,reviewCount:300,sellerReviewAverage:4.9,sellerReviewCount:300,
 url:'https://store.shopping.yahoo.co.jp/a/reviewed.html'});
 const price=scoreConsumerOffers([wellReviewed,cheap],'price');
 const review=scoreConsumerOffers([wellReviewed,cheap],'product');
 assert.equal(price.ranked[0].offer.url,cheap.url);
 assert.equal(review.ranked[0].offer.url,wellReviewed.url);
 assert.equal(price.ranked[0].index,100);
 assert.equal(price.ranked[1].index<100,true);
 assert.equal(scoreConsumerOffers([wellReviewed,cheap],'unknown').profileId,'balanced');
});
test('ratings cannot be hallucinated: absent required review metrics suspend comparison',()=>{
 const noReviews=make({price:10000,reviewAverage:0,reviewCount:0,sellerReviewAverage:0,sellerReviewCount:0});
 const balanced=scoreConsumerOffers([noReviews],'balanced');
 assert.equal(balanced.ranked.length,0);
 assert.equal(balanced.incomplete.length,1);
 assert.deepEqual(balanced.incomplete[0].missing,['商品口コミ','販売店評価']);
 assert.equal(balanced.incomplete[0].index,null);
 const price=scoreConsumerOffers([noReviews],'price');
 assert.equal(price.ranked.length,1);
 assert.equal(price.ranked[0].index,100);
 assert.equal(price.ranked[0].productBayes,null);
 assert.equal(price.ranked[0].sellerBayes,null);
});
test('a seller rating is not silently used as a missing product rating',()=>{
 const missingProduct=make({price:15000,reviewAverage:0,reviewCount:0,sellerReviewAverage:4.9,sellerReviewCount:1000});
 assert.deepEqual(scoreConsumerOffers([missingProduct],'seller').incomplete[0].missing,['商品口コミ']);
 assert.equal(scoreConsumerOffers([missingProduct],'balanced').ranked.length,0);
});
test('unverified accessories, condition-unknown shipping and out-of-stock offers never enter composite',()=>{
 const good=make({price:20000});
 const x=scoreConsumerOffers([
 good,
 make({price:50,sameProduct:false}),
 make({price:60,matchBasis:'unverified'}),
 make({price:70,shippingStatus:'unknown'}),
 make({price:80,shippingStatus:'conditional'}),
 make({price:90,inStock:false}),
 make({price:100,url:'http://unsafe.example/'}),
 make({price:0})
 ],'price');
 assert.equal(x.ranked.length,1);
 assert.equal(x.excludedCount,7);
 assert.equal(x.ranked[0].offer.url,good.url);
 assert.equal(x.lowestVerifiedFreePrice,20000);
});
test('affiliate commissions, PayPay points, ad marks and source order never bias scores',()=>{
 const candidate=make({price:23000});
 const other=make({price:25000,url:'https://store.shopping.yahoo.co.jp/a/other.html'});
 const before=scoreConsumerOffers([other,candidate],'balanced');
 const after=scoreConsumerOffers([{...candidate,sponsored:true,point:9999,effectivePrice:1,sourceRank:999},
   {...other,sponsored:false,point:0,effectivePrice:20000,sourceRank:0}],'balanced');
 assert.equal(before.ranked[0].offer.url,after.ranked[0].offer.url);
 assert.deepEqual(before.ranked.map(x=>x.index),after.ranked.map(x=>x.index));
});
test('visible site provides formula, evidence, review source and comparison actions',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const ui=read('src/compare/ConsumerScorePanel.jsx');
 const page=read('src/compare/ComparePage.jsx');
 assert.match(ui,/現在の配点/);
 assert.match(ui,/B = \(n × R/);
 assert.match(ui,/未取得を0点とすることはできない/);
 assert.match(ui,/取得元 ★/);
 assert.match(ui,/口コミ原文/);
 assert.match(ui,/横並び比較に追加/);
 assert.match(page,/<ConsumerScorePanel/);
 assert.match(page,/cp-score-title/);
});
