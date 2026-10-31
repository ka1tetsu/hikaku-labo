import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewMetrics, confidenceAdjustedRating, safeProviderReviewUrl, safeStoreUrl} from '../src/shared/reviewEvidence.js';
import {normalizeYahooOffer,normalizeRakutenOffer} from '../src/shared/priceCompare.js';
import {filterOffers} from '../src/shared/compareWorkbench.js';

test('Yahoo official product and seller ratings stay separate and link to the provider review page',()=>{
 const o=normalizeYahooOffer({name:'SONY WH-1000XM5',price:35000,url:'https://store.shopping.yahoo.co.jp/example/p.html',
    review:{rate:4.6,count:145,url:'https://shopping.yahoo.co.jp/review/item/list?store_id=example&page_key=p'},
    seller:{name:'販売店',url:'https://store.shopping.yahoo.co.jp/example/',review:{rate:4.9,count:360}},
    shipping:{code:2},inStock:true});
 assert.equal(o.reviewAverage,4.6);
 assert.equal(o.reviewCount,145);
 assert.ok(o.reviewUrl?.startsWith('https://shopping.yahoo.co.jp/review/'));
 assert.equal(o.sellerReviewAverage,4.9);
 assert.equal(o.sellerReviewCount,360);
 assert.equal(o.inStock,true);
 assert.equal(o.storeUrl,'https://store.shopping.yahoo.co.jp/example/');
});
test('ratings validate plausible averages with positive counts and never treat no data as five stars',()=>{
 assert.deepEqual(reviewMetrics(4.5,12),{average:4.5,count:12,available:true});
 for(const [rate,count] of [[0,0],[5,0],[7,30],[3.9,-1],['abc',20],[4.1,0]])
   assert.equal(reviewMetrics(rate,count).available,false);
 assert.equal(confidenceAdjustedRating(4.9,1)<confidenceAdjustedRating(4.5,300),true);
 assert.equal(confidenceAdjustedRating(0,0),-1);
});
test('review links reject third-party URLs, misleading seller domains and non-HTTPS',()=>{
 assert.equal(safeProviderReviewUrl('https://shopping.yahoo.co.jp/review/item/list?store_id=a'),'https://shopping.yahoo.co.jp/review/item/list?store_id=a');
 for(const x of ['https://shopping.yahoo.co.jp.evil.com/review/a','http://shopping.yahoo.co.jp/review/a',
 'https://shopping.yahoo.co.jp/account','javascript:alert(1)','https://evil.com/review/'])
 assert.equal(safeProviderReviewUrl(x),null);
 assert.equal(safeStoreUrl('https://store.shopping.yahoo.co.jp/example/'),'https://store.shopping.yahoo.co.jp/example/');
 assert.equal(safeStoreUrl('https://store.shopping.yahoo.co.jp.bad.test/example/'),null);
});
test('review ranking accounts for review count; only verified review data may qualify',()=>{
 const offers=[
  {price:3000,reviewAverage:5,reviewCount:1,title:'少数'},
  {price:4500,reviewAverage:4.5,reviewCount:300,title:'多数'},
  {price:2000,reviewAverage:0,reviewCount:0,title:'未取得'},
 ];
 assert.deepEqual(filterOffers(offers,{sort:'rating'}).map(x=>x.title),['多数','少数','未取得']);
 assert.deepEqual(filterOffers(offers,{reviewMin:4.0}).map(x=>x.title),['少数','多数']);
});
test('Rakuten review link not invented and count from product API is retained',()=>{
 const o=normalizeRakutenOffer({itemName:'商品',itemPrice:5000,reviewAverage:4.3,reviewCount:37,itemUrl:'https://item.rakuten.co.jp/test/item/'});
 assert.equal(o.reviewCount,37);
 assert.equal(o.reviewAverage,4.3);
 assert.equal(o.reviewUrl,null);
});
test('Amazon comparison shows unknown when no authorized API is connected and manual price handoff exists',()=>{
 const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
 const panel=read('src/compare/AmazonComparePanel.jsx');
 const page=read('src/compare/ComparePage.jsx');
 assert.match(panel,/Amazon\.co\.jp/);
 assert.match(panel,/価格・星評価は未取得/);
 assert.match(panel,/Amazonの価格を入力して3社比較する/);
 assert.match(page,/<AmazonComparePanel/);
 assert.match(page,/onOpenManual/);
 assert.doesNotMatch(panel,/amazonPrice\s*[:=]\s*\d+/i);
});
