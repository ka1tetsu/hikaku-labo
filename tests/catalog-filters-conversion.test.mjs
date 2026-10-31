import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOG_FILTER_DEFAULTS, catalogFilterCount, filterCatalogResults } from '../src/shared/catalogFilters.js';

const listings = [
  {sourceStore:'yahoo',itemPrice:7200,shippingStatus:'free',reviewAverage:4.6,reviewCount:128,itemCode:'a'},
  {sourceStore:'rakuten',itemPrice:4900,shippingStatus:'extra',reviewAverage:4.9,reviewCount:33,itemCode:'b'},
  {sourceStore:'yahoo',itemPrice:3900,shippingStatus:'conditional',reviewAverage:4.9,reviewCount:4,itemCode:'c'},
  {sourceStore:'yahoo',itemPrice:2700,shippingStatus:'unknown',reviewAverage:5,reviewCount:0,itemCode:'d'},
];
test('all real offers remain in original source ranking by default',()=>{
 const copy=structuredClone(listings);
 assert.deepEqual(filterCatalogResults(listings,CATALOG_FILTER_DEFAULTS),listings);
 assert.deepEqual(listings,copy);
 assert.equal(catalogFilterCount(CATALOG_FILTER_DEFAULTS),0);
});
test('free shipping is only unconditional provider-confirmed free, not conditional or unknown',()=>{
 assert.deepEqual(filterCatalogResults(listings,{freeShippingOnly:true}).map(x=>x.itemCode),['a']);
});
test('review filters reject unrated products even with a meaningless rating value',()=>{
 assert.deepEqual(filterCatalogResults(listings,{minReview:4.5}).map(x=>x.itemCode),['a','b','c']);
 assert.deepEqual(filterCatalogResults(listings,{minReview:4}).map(x=>x.itemCode),['a','b','c']);
});
test('price budget and source filters combine without assuming unavailable market coverage',()=>{
 assert.deepEqual(filterCatalogResults(listings,{maxPrice:5000,store:'yahoo'}).map(x=>x.itemCode),['c','d']);
 assert.deepEqual(filterCatalogResults(listings,{maxPrice:5000,store:'rakuten'}).map(x=>x.itemCode),['b']);
 assert.deepEqual(filterCatalogResults(listings,{maxPrice:5000,store:'yahoo',freeShippingOnly:true}),[]);
 assert.equal(catalogFilterCount({store:'yahoo',maxPrice:5000,minReview:4.5,freeShippingOnly:true}),4);
 assert.equal(catalogFilterCount({store:'all',maxPrice:0,minReview:0,freeShippingOnly:false}),0);
});
test('unknown values cannot silently apply unrecognized filters',()=>{
 assert.deepEqual(filterCatalogResults(listings,{store:'external',minReview:12,maxPrice:-1}),listings);
 assert.deepEqual(filterCatalogResults(null,{store:'all'}),[]);
});
test('home page does not auto-scroll on opening; user-triggered search does',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const page=read('src/App.jsx');
 assert.match(page,/if \(options.scroll === true\) document.getElementById\('results'\)/);
 assert.match(page,/doSearch\('ワイヤレスイヤホン', '', 1\);/);
 assert.match(page,/doSearch\(text, '', 1, \{ scroll: true \}\);/);
 assert.match(page,/filterCatalogResults\(products, catalogFilters\)/);
 assert.match(page,/visibleProducts\.filter\(item => item.sameProduct\)/);
 assert.match(page,/hl-catalog-filter-panel/);
 assert.match(page,/送料込み総額ではなく/);
});
test('buyer sees sponsored disclosure on every paid shopping action',()=>{
 const card=readFileSync(new URL('../src/components/ProductCard.jsx',import.meta.url),'utf8');
 assert.match(card,/primarySponsored && <span className="product-pr-tag">PR<\/span>/);
 assert.match(card,/Amazonで探す <small className="product-pr-tag">PR<\/small>/);
 assert.match(card,/Yahoo!で探す <small className="product-pr-tag">PR<\/small>/);
 assert.match(card,/primaryRel = primarySponsored \?/);
});
