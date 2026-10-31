import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchEvidence, normalizeRakutenOffer, normalizeYahooOffer, rankOffers } from '../src/shared/priceCompare.js';
import { SHIPPING_LABEL, filterOffers, offerSummary, shippingLabel, offerKey } from '../src/shared/compareWorkbench.js';
import { PRICE_SORTS } from '../src/shared/offerDisplay.js';

const make=(title,price,extra={})=>({store:'rakuten',storeName:'楽天市場',title,price,effectivePrice:price-100,point:100,
  url:'https://item.rakuten.co.jp/example/'+price+'/',reviewAverage:4,reviewCount:30,shopName:'テスト店',
  shippingFree:true,shippingStatus:'free',jan:'',...extra});
test('strong model evidence only, not just similar broad text',()=>{
  const same=make('ソニー WH-1000XM5 ワイヤレスヘッドホン',42000);
  const other=make('ソニー WH-1000XM4 ワイヤレスヘッドホン',31000);
  assert.equal(matchEvidence('ソニー WH-1000XM5',same).kind,'model');
  assert.equal(matchEvidence('ソニー WH-1000XM5',other).sameProduct,false);
  const generic=matchEvidence('ワイヤレスヘッドホン',same);
  assert.equal(generic.kind,'unverified');
  assert.equal(generic.sameProduct,false);
});
test('identical JAN is strong evidence; conflicting JAN never silently wins on title',()=>{
  const a=make('イヤホン 商品A',5000,{jan:'4548736132580'});
  const b=make('イヤホン 商品A',4000,{jan:'4900000000000'});
  assert.equal(matchEvidence('イヤホン 商品A',a,'4548736132580').kind,'jan');
  assert.equal(matchEvidence('イヤホン 商品A',b,'4548736132580').kind,'mismatch');
  const ranked=rankOffers([b,a],'イヤホン 商品A','4548736132580');
  assert.equal(ranked[0].sameProduct,true);
  assert.equal(ranked[1].sameProduct,false);
});
test('non-product accessories cannot be promoted just because their title mentions a model',()=>{
  const casing=make('ソニー WH-1000XM5 専用保護ケース',1500);
  const product=make('ソニー WH-1000XM5 ヘッドホン',50000);
  const ranked=rankOffers([casing,product],'ソニー WH-1000XM5');
  assert.equal(ranked[0].sameProduct,true);
  assert.equal(ranked[1].sameProduct,false);
});
test('duplicate URLs are removed but separate stores with same model remain',()=>{
  const a=make('ソニー WH-1000XM5',42000);
  const b=make('SONY WH-1000XM5',43000,{store:'yahoo',url:'https://store.shopping.yahoo.co.jp/example/1.html'});
  assert.equal(rankOffers([a,a,b],'WH-1000XM5').length,2);
});
test('postage unknown never becomes confirmed paid shipping',()=>{
  assert.equal(normalizeRakutenOffer({itemPrice:12000,itemUrl:'https://item.rakuten.co.jp/example/test/',itemName:'商品'}).shippingStatus,'unknown');
  assert.equal(normalizeRakutenOffer({itemPrice:12000,postageFlag:1,itemUrl:'https://item.rakuten.co.jp/example/test/',itemName:'商品'}).shippingStatus,'extra');
  assert.equal(normalizeRakutenOffer({itemPrice:12000,postageFlag:0,itemUrl:'https://item.rakuten.co.jp/example/test/',itemName:'商品'}).shippingStatus,'free');
  assert.equal(normalizeYahooOffer({price:5000,shipping:{code:2},url:'https://store.shopping.yahoo.co.jp/example/p.html',name:'商品'}).shippingStatus,'free');
  assert.equal(shippingLabel({shippingStatus:'unknown'}),SHIPPING_LABEL.unknown);
});
test('buyer can filter by store, shipping, review, price and title and compare display order',()=>{
  const a=make('ソニー WH-1000XM5 ブラック',45000,{reviewAverage:4.7,reviewCount:200,matchBasis:'model',sameProduct:true});
  const b=make('ソニー WH-1000XM5 シルバー',40000,{reviewAverage:4.1,reviewCount:40,shippingFree:false,shippingStatus:'unknown',store:'yahoo',url:'https://store.shopping.yahoo.co.jp/b/x',sameProduct:true,matchBasis:'jan'});
  const c=make('ソニー WH-1000XM4',30000,{reviewAverage:4.9,reviewCount:500,matchBasis:'unverified',sameProduct:false});
  const rows=[a,b,c];
  assert.deepEqual(filterOffers(rows,{sort:'cash'}).map(x=>x.price),[30000,40000,45000]);
  assert.deepEqual(filterOffers(rows,{sort:'points'}).map(x=>x.price),[30000,40000,45000]);
  assert.deepEqual(filterOffers(rows,{sort:'rating'}).map(x=>x.price),[30000,45000,40000]);
  assert.deepEqual(filterOffers(rows,{sort:'reviews'}).map(x=>x.price),[30000,45000,40000]);
  assert.deepEqual(filterOffers(rows,{shipping:'free'}).map(x=>x.price),[30000,45000]);
  assert.deepEqual(filterOffers(rows,{shipping:'known'}).map(x=>x.price),[30000,45000]);
  assert.deepEqual(filterOffers(rows,{store:'yahoo'}).map(x=>x.price),[40000]);
  assert.deepEqual(filterOffers(rows,{includeUnverified:false}).map(x=>x.price),[40000,45000]);
  assert.deepEqual(filterOffers(rows,{keyword:'ブラック'}).map(x=>x.price),[45000]);
  assert.deepEqual(filterOffers(rows,{maxPrice:42000,reviewMin:4.5}).map(x=>x.price),[30000]);
  assert.equal(offerSummary(rows).evidence,1);
  assert.equal(new Set(rows.map(offerKey)).size,3);
  assert.ok(PRICE_SORTS.rating&&PRICE_SORTS.reviews);
});
test('price workbench is wired into real main comparison UI and remains transparent about unconnected merchants',()=>{
  const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const page=read('src/compare/ComparePage.jsx');
  const workbench=read('src/compare/OfferWorkbench.jsx');
  assert.match(page,/<OfferFilters/);
  assert.match(page,/<OfferShortlist/);
  assert.match(page,/copyComparisonLink/);
  assert.match(page,/selectedKeys\.length>=4/);
  assert.match(page,/型番・JAN/);
  assert.match(workbench,/compare-shortlist/);
  assert.match(workbench,/未取得/);
  assert.match(workbench,/sponsored noopener noreferrer/);
  assert.match(read('src/components/ProductCard.jsx'),/表示候補の参考額が最小/);
});
