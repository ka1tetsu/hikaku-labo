// Display-only sort; we keep provider APIs, source prices, referral URLs intact.
// Store points are rewards and not the amount charged at checkout.
export const PRICE_SORTS = Object.freeze({
  cash: { label: '商品価格が安い順（標準）' },
  points: { label: 'ポイント考慮後の参考額順' },
});
const finite=value=>typeof value==='number' && Number.isFinite(value) && value>=0 ? value : Number.POSITIVE_INFINITY;
export function displayValue(offer, sort='cash') {
  const price=finite(offer?.price);
  if(sort!=='points')return price;
  const adjusted=finite(offer?.effectivePrice);
  return Number.isFinite(adjusted)?adjusted:price;
}
export function sortDisplayedOffers(offers, sort='cash') {
  const mode=Object.hasOwn(PRICE_SORTS,sort)?sort:'cash';
  return [...offers].sort((a,b)=>displayValue(a,mode)-displayValue(b,mode)||
    finite(a.price)-finite(b.price)||(b.reviewCount||0)-(a.reviewCount||0));
}
export function displayRange(offers,sort='cash'){
  const values=offers.map(offer=>displayValue(offer,sort)).filter(Number.isFinite);
  return values.length?{low:Math.min(...values),high:Math.max(...values)}:null;
}
