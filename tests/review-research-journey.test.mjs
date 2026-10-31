import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {reviewCoverage,reviewResearchOffers,REVIEW_PRESETS} from '../src/shared/reviewResearch.js';
import {filterOffers} from '../src/shared/compareWorkbench.js';
import {normalizeYahooOffer,normalizeRakutenOffer} from '../src/shared/priceCompare.js';

const base={store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'出品店',title:'SONY WH-1000XM5',
price:30000,url:'https://store.shopping.yahoo.co.jp/store/p.html',
reviewAverage:4.5,reviewCount:150,sellerReviewAverage:4.9,sellerReviewCount:200,
sameProduct:true,matchBasis:'model'};
test('product and seller source counts are distinct; no cross-store star average invented',()=>{
 const data=[base,{...base,store:'rakuten',url:'https://item.rakuten.co.jp/demo/item/',reviewCount:0,reviewAverage:0,sellerReviewCount:0,sellerReviewAverage:0},
   {...base,url:'https://store.shopping.yahoo.co.jp/store/a.html',sameProduct:false,reviewCount:3}];
 const stats=reviewCoverage(data);
 assert.deepEqual(stats,{total:3,productReviewed:2,sellerReviewed:2,productUnknown:1,sourceCounts:{yahoo:2,rakuten:0}});
 assert.equal(reviewCoverage([]).productReviewed,0);
 assert.equal(reviewCoverage(null).total,0);
});
test('research only ranks actual verified same-model candidates when any exist',()=>{
 const similar={...base,title:'安いイヤホンケース',url:'https://store.shopping.yahoo.co.jp/other/x.html',reviewCount:1000,reviewAverage:5,sameProduct:false,matchBasis:'unverified'};
 const strong={...base,title:'SONY WH-1000XM5',reviewAverage:4.5,reviewCount:300,url:'https://store.shopping.yahoo.co.jp/other/p.html'};
 const weak={...base,reviewAverage:5,reviewCount:1};
 const x=reviewResearchOffers([similar,weak,strong]);
 assert.equal(x.verifiedOnly,true);
 assert.deepEqual(x.rows.map(o=>o.reviewCount),[300,1]);
 const y=reviewResearchOffers([similar]);
 assert.equal(y.verifiedOnly,false);
 assert.equal(y.rows.length,1);
});
test('review counts and shop reputation are optional independent filters, unknown ratings never pass',()=>{
 const fresh={...base,reviewCount:5,sellerReviewCount:100,sellerReviewAverage:4.8};
 const trusted={...base,url:'https://store.shopping.yahoo.co.jp/other/trusted.html',reviewCount:60,sellerReviewCount:300,sellerReviewAverage:4.4};
 const missing={...base,url:'https://store.shopping.yahoo.co.jp/other/missing.html',reviewCount:0,reviewAverage:0,sellerReviewCount:0};
 assert.deepEqual(filterOffers([fresh,trusted,missing],{reviewMin:4,minReviewCount:20}).map(o=>o.reviewCount),[60]);
 assert.deepEqual(filterOffers([fresh,trusted,missing],{sellerRatingMin:4.5}).map(o=>o.reviewCount),[5]);
 assert.deepEqual(filterOffers([fresh,trusted,missing],{minReviewCount:100}),[]);
 assert.deepEqual(filterOffers([fresh,trusted,missing],{sort:'rating'}).map(o=>o.reviewCount),[60,5,0]);
 assert.deepEqual(REVIEW_PRESETS.map(x=>x.minReviewCount),[20,50]);
});
test('use only legitimate Yahoo official review and store URLs; never fabricate Rakuten URLs',()=>{
 const yahoo=normalizeYahooOffer({
 name:'SONY WH-1000XM5',price:29000,url:'https://store.shopping.yahoo.co.jp/abc/p.html',
 review:{rate:4.5,count:150,url:'https://shopping.yahoo.co.jp/review/item/list?store_id=abc&page_key=p'},
 seller:{name:'ショップ',url:'https://store.shopping.yahoo.co.jp/abc/',review:{rate:4.8,count:200}},
 });
 assert.equal(yahoo.reviewUrl,'https://shopping.yahoo.co.jp/review/item/list?store_id=abc&page_key=p');
 assert.equal(yahoo.sellerReviewAverage,4.8);
 const spoof=normalizeYahooOffer({name:'商品',price:2000,url:'https://store.shopping.yahoo.co.jp/s/item',
 review:{rate:4.2,count:15,url:'https://shopping.yahoo.co.jp.evil.invalid/review/bad'},
 seller:{name:'店',url:'javascript:alert(1)',review:{rate:4.6,count:30}},
 });
 assert.equal(spoof.reviewUrl,null);
 assert.equal(spoof.storeUrl,null);
 const rakuten=normalizeRakutenOffer({itemName:'商品',itemPrice:3000,reviewAverage:4.2,reviewCount:25,itemUrl:'https://item.rakuten.co.jp/demo/'});
 assert.equal(rakuten.reviewUrl,null);
});
test('real review journey contains presets, provenance, Amazon research and empty-filter reset',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const page=read('src/compare/ComparePage.jsx');
 const panel=read('src/compare/ReviewResearchPanel.jsx');
 const controls=read('src/compare/OfferWorkbench.jsx');
 assert.match(page,/<ReviewResearchPanel/);
 assert.match(page,/applyReviewPreset/);
 assert.match(page,/minReviewCount:'0'/);
 assert.match(panel,/Amazonで口コミを見る/);
 assert.match(panel,/商品口コミの原文を読む/);
 assert.match(panel,/販売店の評価（別指標）/);
 assert.match(panel,/投稿件数が少ない/);
 assert.match(panel,/aria-pressed/);
 assert.match(controls,/口コミの最低件数/);
 assert.match(controls,/販売店の評価（商品とは別）/);
 assert.match(page,/絞り込みを解除してすべて表示/);
});
