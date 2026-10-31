// Explainable, deliberately conservative reference score, NOT a test result.
// Product and seller star aggregates only come from provider-licensed APIs.
// Missing rating evidence is marked incomplete, never imputed as a bad rating.
// Paid commissions, affiliate tracking, points and guessed shipping are excluded.
import {reviewMetrics,confidenceAdjustedRating,ratingIndex} from './reviewEvidence.js';

export const CONSUMER_PROFILES=Object.freeze({
  price:Object.freeze({label:'価格重視',price:100,product:0,seller:0}),
  balanced:Object.freeze({label:'バランス',price:55,product:30,seller:15}),
  product:Object.freeze({label:'商品口コミ重視',price:20,product:65,seller:15}),
  seller:Object.freeze({label:'販売店評価重視',price:20,product:20,seller:60}),
});

export function scoreConsumerOffers(offers=[], profileId='balanced') {
  const profile=CONSUMER_PROFILES[profileId]||CONSUMER_PROFILES.balanced;
  const candidates=(Array.isArray(offers)?offers:[]).filter(o=>o?.sameProduct===true &&
    ['model','jan'].includes(o.matchBasis) && Number.isSafeInteger(o.price) && o.price>0 &&
    o.shippingStatus==='free' && o.inStock!==false &&
    typeof o.url==='string' && o.url.startsWith('https://'));
  // The price denominator is the cheapest complete, officially free-shipping
  // listing in the same returned dataset; not a market-wide price.
  const minPrice=candidates.length?Math.min(...candidates.map(o=>o.price)):null;
  const rows=candidates.map(offer=>{
    const product=reviewMetrics(offer.reviewAverage,offer.reviewCount);
    const seller=reviewMetrics(offer.sellerReviewAverage,offer.sellerReviewCount);
    const missing=[];
    if(profile.product>0&&!product.available)missing.push('商品口コミ');
    if(profile.seller>0&&!seller.available)missing.push('販売店評価');
    const priceIndex=100*minPrice/offer.price;
    const productIndex=product.available?ratingIndex(product.average,product.count):null;
    const sellerIndex=seller.available?ratingIndex(seller.average,seller.count):null;
    // Do not silently renormalize remaining weights: doing so would make an
    // incompletely reviewed store look objectively comparable to reviewed ones.
    const index=missing.length?null:
      (priceIndex*profile.price+(productIndex??0)*profile.product+(sellerIndex??0)*profile.seller)/100;
    return {
      offer,index,priceIndex,productIndex,sellerIndex,missing,
      productBayes:product.available?confidenceAdjustedRating(product.average,product.count):null,
      sellerBayes:seller.available?confidenceAdjustedRating(seller.average,seller.count):null,
      scoreKind:missing.length?'incomplete':'eligible',
    };
  });
  const ranked=rows.filter(row=>row.index!==null).sort((a,b)=>
    b.index-a.index||a.offer.price-b.offer.price||a.offer.url.localeCompare(b.offer.url));
  const incomplete=rows.filter(row=>row.index===null).sort((a,b)=>a.offer.price-b.offer.price);
  return {profile,profileId:Object.hasOwn(CONSUMER_PROFILES,profileId)?profileId:'balanced',
    ranked,incomplete,eligibleCount:candidates.length,lowestVerifiedFreePrice:minPrice,
    missingCount:incomplete.length,excludedCount:(Array.isArray(offers)?offers:[]).length-candidates.length};
}
