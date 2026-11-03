import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogPurchaseTarget} from '../src/shared/catalogPurchase.js';
test('catalog comparison preserves the actual Yahoo listing and ordinary-link attribution',()=>{
 const target=catalogPurchaseTarget({sourceStore:'yahoo',itemUrl:'https://store.shopping.yahoo.co.jp/qa/model.html',sponsored:false});
 assert.equal(target.url,'https://store.shopping.yahoo.co.jp/qa/model.html');assert.equal(target.merchant,'yahoo-shopping');assert.equal(target.sponsored,false);
});
test('catalog comparison preserves approved referral URLs and rejects unusable explicit-source targets',()=>{
 const url='https://hb.afl.rakuten.co.jp/hgc/test/?pc=example';
 assert.equal(catalogPurchaseTarget({sourceStore:'rakuten',itemUrl:url,sponsored:true}).url,url);
 for(const itemUrl of ['javascript:alert(1)','http://store.shopping.yahoo.co.jp/x','https://user:pass@example.org/x'])assert.equal(catalogPurchaseTarget({sourceStore:'yahoo',itemUrl}),null);
 assert.equal(catalogPurchaseTarget({sourceStore:'unknown',itemUrl:'https://example.org/x'}),null);
});
