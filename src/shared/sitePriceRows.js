// One row per merchant, with separately provable list price and cash total.
// Never invent or extrapolate non-API prices. A price can only be tied to its
// returned merchant, source link and a verified JAN/model candidate.
export function sitePriceRows(offers=[], stores=[], sources={}) {
  const list=(Array.isArray(offers)?offers:[]).filter(o=>
    o?.sameProduct===true && ['jan','model'].includes(o.matchBasis) &&
    Number.isSafeInteger(o.price)&&o.price>0&&o.inStock!==false&&
    typeof o.url==='string'&&o.url.startsWith('https://'));
  const sourceId=o=>o.store==='yahoo'?'yahoo-shopping':o.store==='rakuten'?'rakuten':null;
  const sites=(Array.isArray(stores)?stores:[]);
  const rows=sites.map(store=>{
    const merchantOffers=list.filter(o=>sourceId(o)===store.id);
    const byPrice=(a,b)=>a.price-b.price||String(a.url).localeCompare(String(b.url));
    const least=[...merchantOffers].sort(byPrice)[0]||null;
    const shippingKnown=[...merchantOffers].filter(o=>o.shippingStatus==='free').sort(byPrice);
    const total=shippingKnown[0]||null;
    const connected=['rakuten','yahoo-shopping'].includes(store.id);
    const status=store.id==='rakuten'?sources.rakuten:store.id==='yahoo-shopping'?sources.yahoo:null;
    const state=merchantOffers.length?'priced':!connected?'not-connected':
      status==='error'?'failed':status==='skipped'?'not-checked':
      status==='disabled'?'not-connected':status==='ok'?'no-match':'unavailable';
    return {
      id:store.id,name:store.name,
      state,connected,listedPrice:least?.price??null,totalPrice:total?.price??null,
      cheapestOffer:least,verifiedFreeOffer:total,
      offerCount:merchantOffers.length,
      sellerName:(total||least)?.shopName||null,
      productUrl:(total||least)?.url||null,
      researchUrl:store.url,sponsored:(total||least)?.sponsored??store.sponsored??false,
      viaGoogle:Boolean(store.viaGoogle),
      shippingStatus:least?.shippingStatus??null
    };
  });
  // Show the priced sites first, but preserve merchant order within that group.
  return rows.sort((a,b)=>Number(b.state==='priced')-Number(a.state==='priced'));
}
export function pricedSiteCount(rows=[]) {
  return rows.filter(row=>row.state==='priced').length;
}
