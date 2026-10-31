import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rakutenPayload} from '../src/shared/rakutenPayload.js';
import {filterOffers,OFFER_SORTS} from '../src/shared/compareWorkbench.js';

const item={itemName:'ソニー WH-1000XM5',itemPrice:45000,itemUrl:'https://item.rakuten.co.jp/demo/x/'};
test('Rakuten official 2026 formatVersion=2 responds with lowercase items',()=>{
 const result=rakutenPayload({items:[item],count:120,pageCount:6});
 assert.deepEqual(result.items,[item]);assert.equal(result.pageCount,6);
 assert.equal(result.count,120);
});
test('Rakuten 2026 default formatVersion=1 uses lowercase item wrappers',()=>{
 const result=rakutenPayload(JSON.stringify({items:[{item}],count:1,pageCount:1}));
 assert.deepEqual(result.items,[item]);
});
test('Rakuten old wrappers remain supported for historical compatibility',()=>{
 assert.deepEqual(rakutenPayload({Items:[{Item:item}]}).items,[item]);
 assert.deepEqual(rakutenPayload({Items:[item]}).items,[item]);
});
test('unexpected provider success is rejected rather than interpreted as zero items',()=>{
 for(const body of [{error:'wrong_parameter'},{data:[]},null,[],{items:'invalid'},{items:[null]},{items:'',Items:null}])
   assert.throws(()=>rakutenPayload(body));
 assert.deepEqual(rakutenPayload({items:[],count:0}).items,[],'explicitly empty valid results are allowed');
});
test('official source recommendation order is separate from cash price ranking',()=>{
 const offers=[
  {title:'関連度上位',price:5000,sourceRank:0,sameProduct:false,reviewCount:5},
  {title:'関連度下位',price:1000,sourceRank:1,sameProduct:false,reviewCount:500}
 ];
 assert.ok(OFFER_SORTS.recommended);
 assert.deepEqual(filterOffers(offers,{sort:'recommended'}).map(o=>o.price),[5000,1000]);
 assert.deepEqual(filterOffers(offers,{sort:'cash'}).map(o=>o.price),[1000,5000]);
});
test('compare UI sends mode and page, and supports external research sources',()=>{
 const view=readFileSync(new URL('../src/compare/ComparePage.jsx',import.meta.url),'utf8');
 const api=readFileSync(new URL('../api/search.js',import.meta.url),'utf8');
 assert.match(view,/params.set\('mode',queryMode\)/);
 assert.match(view,/params.set\('page',String\(page\)\)/);
 assert.match(view,/次の30件を探す/);
 assert.match(view,/Googleのショッピング検索で探す/);
 assert.match(api,/formatVersion: '2'/);
 assert.match(api,/rakutenPayload\(text\)/);
});
