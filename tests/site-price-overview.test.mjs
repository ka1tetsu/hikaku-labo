import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sitePriceRows,pricedSiteCount} from '../src/shared/sitePriceRows.js';
import {storeLinks} from '../src/shared/merchants.js';

const mall=(store,price,shippingStatus='free',other={})=>({
  store,storeName:store==='yahoo'?'Yahoo!ショッピング':'楽天市場',shopName:'正規出品店',
  title:'SONY WH-1000XM5',price,shippingStatus,sameProduct:true,
  matchBasis:'model',inStock:true,reviewAverage:4.6,reviewCount:50,
  url:store==='yahoo'?'https://store.shopping.yahoo.co.jp/qa/'+price+'.html':
    'https://item.rakuten.co.jp/qa/'+price+'/',...other,
});
const stores=storeLinks('WH-1000XM5');

test('shows actual product price and separate verified free-shipping amount per site',()=>{
 const offers=[
  mall('yahoo',18000,'unknown'),
  mall('yahoo',23000,'free',{shopName:'送料無料の店'}),
  mall('rakuten',25000,'free'),
  mall('rakuten',19000,'conditional')
 ];
 const rows=sitePriceRows(offers,stores,{rakuten:'ok',yahoo:'ok'});
 assert.equal(rows.length,stores.length);
 assert.equal(pricedSiteCount(rows),2);
 const yahoo=rows.find(row=>row.id==='yahoo-shopping');
 assert.equal(yahoo.listedPrice,18000);
 assert.equal(yahoo.totalPrice,23000);
 assert.equal(yahoo.offerCount,2);
 assert.equal(yahoo.sellerName,'送料無料の店');
 assert.ok(yahoo.productUrl.includes('/23000.html'));
 const rakuten=rows.find(row=>row.id==='rakuten');
 assert.equal(rakuten.listedPrice,19000);
 assert.equal(rakuten.totalPrice,25000);
 const amazon=rows.find(row=>row.id==='amazon');
 assert.equal(amazon.listedPrice,null);
 assert.equal(amazon.totalPrice,null);
 assert.equal(amazon.state,'not-connected');
 assert.ok(amazon.researchUrl.includes('amazon.co.jp'));
});

test('all 18 site names are visible; other sources are unknown, never invented zeros',()=>{
 const rows=sitePriceRows([mall('yahoo',22000)],stores,{yahoo:'ok',rakuten:'error'});
 assert.equal(rows.length,18);
 assert.equal(rows.find(x=>x.id==='rakuten').state,'failed');
 assert.equal(rows.find(x=>x.id==='amazon').state,'not-connected');
 assert.ok(rows.filter(x=>x.state==='not-connected').length>=15);
 for(const row of rows.filter(x=>x.state!=='priced')){
   assert.equal(row.listedPrice,null);
   assert.equal(row.totalPrice,null);
   assert.equal(row.productUrl,null);
 }
 const noExact=sitePriceRows([
  mall('yahoo',100,{},{sameProduct:false}),
  mall('yahoo',110,'free',{inStock:false}),
  mall('yahoo',120,'free',{matchBasis:'unverified'}),
  mall('yahoo',130,'free',{url:'http://untrusted.test'}),
 ],stores,{yahoo:'ok',rakuten:'skipped'});
 assert.equal(noExact.find(x=>x.id==='yahoo-shopping').state,'no-match');
 assert.equal(noExact.find(x=>x.id==='rakuten').state,'not-checked');
 assert.equal(pricedSiteCount(noExact),0);
});
test('unknown source status and disabled provider are never called fetched',()=>{
 const a=sitePriceRows([],stores,{yahoo:'disabled',rakuten:'error'});
 const b=sitePriceRows([],stores,{yahoo:'ok',rakuten:'ok'});
 assert.equal(a.find(x=>x.id==='yahoo-shopping').state,'not-connected');
 assert.equal(b.find(x=>x.id==='yahoo-shopping').state,'no-match');
 assert.equal(a.find(x=>x.id==='rakuten').state,'failed');
 assert.equal(sitePriceRows([],[],{}).length,0);
});
test('comparison page shows site-by-site prices above review filters, and source action links',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const page=read('src/compare/ComparePage.jsx');
 const panel=read('src/compare/SitePriceOverview.jsx');
 assert.ok(page.indexOf('<SitePriceOverview')<page.indexOf('<OfferFilters'));
 assert.match(page,/site-prices/);
 assert.match(panel,/どの通販サイトで、いくら？/);
 assert.match(panel,/送料込み確認額/);
 assert.match(panel,/その他\{others.length\}サイト/);
 assert.match(panel,/data-site-id=\{row.id\}/);
 assert.match(panel,/価格API未接続/);
 assert.match(panel,/取得失敗/);
 assert.match(panel,/異なる出品の金額の場合があります/);
 assert.match(panel,/rel=\{row.sponsored\?'sponsored noopener noreferrer'/);
});
