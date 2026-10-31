// Pure, deterministic product-offer selection for the price comparison workbench.
// Filters operate only on offers returned by the connected official APIs.
import { displayValue, sortDisplayedOffers } from './offerDisplay.js';
import { confidenceAdjustedRating } from './reviewEvidence.js';

export const OFFER_SORTS=Object.freeze({
  recommended:'おすすめ順（取得元の検索関連度）',
  cash:'商品価格が安い順',
  points:'ポイント差引後の参考額順',
  rating:'口コミ評価順（投稿件数を考慮）',
  reviews:'口コミ件数が多い順',
});
export const SHIPPING_LABEL=Object.freeze({
  free:'送料無料（取得元の表示）',
  extra:'送料別（要確認）',
  conditional:'条件付き送料無料（条件要確認）',
  unknown:'送料条件未取得',
});
export function shippingLabel(offer) {
  return SHIPPING_LABEL[offer?.shippingStatus] || (offer?.shippingFree ? SHIPPING_LABEL.free : SHIPPING_LABEL.unknown);
}
export function filterOffers(offers, {
  store='all', shipping='all', reviewMin=0, includeUnverified=true,
  keyword='', sort='cash', maxPrice=0,
}={}){
  const search=String(keyword).normalize('NFKC').toLocaleLowerCase('ja').trim();
  let result=(Array.isArray(offers)?offers:[]).filter(offer=>{
    if(!includeUnverified && !offer.sameProduct) return false;
    if(store!=='all' && offer.store!==store) return false;
    if(shipping==='free' && !offer.shippingFree) return false;
    if(shipping==='known' && shippingLabel(offer)===SHIPPING_LABEL.unknown) return false;
    if(Number(reviewMin)>0 && !(offer.reviewCount>0 && offer.reviewAverage>=Number(reviewMin))) return false;
    if(Number(maxPrice)>0 && !(offer.price<=Number(maxPrice))) return false;
    if(search && ![offer.title,offer.shopName,offer.storeName].join(' ').normalize('NFKC').toLocaleLowerCase('ja').includes(search)) return false;
    return true;
  });
  if(sort==='recommended')result=result.sort((a,b)=>Number(b.sameProduct)-Number(a.sameProduct) || (a.sourceRank??99)-(b.sourceRank??99) || (b.reviewCount||0)-(a.reviewCount||0));
  else if(sort==='rating')result=result.sort((a,b)=>confidenceAdjustedRating(b.reviewAverage,b.reviewCount)-confidenceAdjustedRating(a.reviewAverage,a.reviewCount)||b.reviewCount-a.reviewCount||a.price-b.price);
  else if(sort==='reviews')result=result.sort((a,b)=>b.reviewCount-a.reviewCount||a.price-b.price);
  else result=sortDisplayedOffers(result,sort==='points'?'points':'cash');
  return result;
}
export function offerKey(offer){
  return String(offer.store)+':'+String(offer.url);
}
export function offerSummary(offers, sort='cash'){
  const arr=Array.isArray(offers)?offers:[];
  if(!arr.length)return null;
  const values=arr.map(o=>displayValue(o,sort==='points'?'points':'cash')).filter(Number.isFinite);
  if(!values.length)return null;
  return { count:arr.length, stores:new Set(arr.map(o=>o.store)).size,
    lowest:Math.min(...values), highest:Math.max(...values),
    sameCount:arr.filter(o=>o.sameProduct).length,
    evidence:arr.filter(o=>o.matchBasis==='jan').length };
}
