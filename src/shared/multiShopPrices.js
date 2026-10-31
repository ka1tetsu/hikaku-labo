// A buyer-facing, auditable cash-total comparison.
// API list prices can only become checkout totals when the provider explicitly
// declares free shipping. Buyer-entered prices require verified shipping and
// affirmative same-product confirmation. Unknowns are never treated as ¥0.
import { manualOfferCost } from '../compare/manualCompare.js';

const yen = n => Number.isFinite(n) && n >= 0 ? n : null;
const validOffer = o => o?.sameProduct === true &&
  ['jan','model'].includes(o?.matchBasis) &&
  Number.isSafeInteger(o.price) && o.price > 0 &&
  o.inStock !== false &&
  typeof o.url === 'string' && /^https:\/\//.test(o.url);

export function combinedPriceComparison({offers=[],manualRows=[],confirmedSameProduct=false}={}) {
  const ready=[], incomplete=[];
  for (const offer of (Array.isArray(offers)?offers:[])) {
    if (!validOffer(offer)) continue;
    const row={
      id:'api:'+offer.store+':'+offer.url,storeId:offer.store==='yahoo'?'yahoo-shopping':offer.store,
      storeName:offer.storeName||offer.store,shopName:offer.shopName||'',
      title:offer.title||'',url:offer.url,sponsored:Boolean(offer.sponsored),
      source:'api',verification:offer.matchBasis==='jan'?'JAN照合':'型番照合',
      itemPrice:offer.price,cashTotal:offer.shippingStatus==='free'?offer.price:null,
      shipping:offer.shippingStatus==='free'?0:null,
      points:Math.max(0,Math.min(offer.price,Number(offer.point)||0)),
      reviews:Number(offer.reviewCount)||0,shippingStatus:offer.shippingStatus||'unknown'
    };
    if(row.cashTotal!==null) ready.push(row);
    else incomplete.push(row);
  }
  if (confirmedSameProduct && Array.isArray(manualRows)) {
    const seen=new Set();
    for(const row of manualRows) {
      if(seen.has(row?.storeId))continue;
      seen.add(row?.storeId);
      const cost=manualOfferCost(row);
      if(!cost)continue;
      ready.push({
        id:'manual:'+row.storeId,storeId:row.storeId,
        storeName:row.storeName||row.storeId,shopName:'',
        title:'購入者が商品仕様を確認した出品',url:row.url||null,
        sponsored:Boolean(row.sponsored),source:'manual',verification:'本人確認',
        itemPrice:cost.price,cashTotal:cost.cashPayable,shipping:cost.shipping,
        points:cost.points,discount:cost.discount,shippingStatus:cost.shipping===0?'free':'extra',
      });
    }
  }
  const byCash=(a,b)=>a.cashTotal-b.cashTotal||a.itemPrice-b.itemPrice||a.id.localeCompare(b.id);
  ready.sort(byCash);
  incomplete.sort((a,b)=>a.itemPrice-b.itemPrice);
  const cheapest=ready[0]||null;
  const second=ready[1]||null;
  return {
    ready,incomplete,cheapest,
    difference:cheapest&&second?second.cashTotal-cheapest.cashTotal:null,
    comparableCount:ready.length,excludedShippingCount:incomplete.length,
    shopCount:new Set(ready.map(o=>o.storeId+':'+(o.shopName||o.storeName))).size,
    // Never present this as an all-market rate.
    status:ready.length >= 2?'compared':ready.length===1?'single':'needs-evidence'
  };
}
