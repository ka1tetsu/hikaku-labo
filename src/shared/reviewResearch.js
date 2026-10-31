// Source-backed discovery, not an independent laboratory review ranking.
// A product with zero reported reviews is unknown, not a bad/zero-star product.
import { reviewMetrics, confidenceAdjustedRating } from './reviewEvidence.js';

const score = offer => confidenceAdjustedRating(offer.reviewAverage,offer.reviewCount);
export function reviewCoverage(offers=[]) {
  const list=Array.isArray(offers)?offers:[];
  const withProduct=list.filter(o=>reviewMetrics(o.reviewAverage,o.reviewCount).available);
  const withSeller=list.filter(o=>reviewMetrics(o.sellerReviewAverage,o.sellerReviewCount).available);
  return {
    total:list.length,productReviewed:withProduct.length,sellerReviewed:withSeller.length,
    productUnknown:list.length-withProduct.length,
    sourceCounts:{
      yahoo:withProduct.filter(o=>o.store==='yahoo').length,
      rakuten:withProduct.filter(o=>o.store==='rakuten').length,
    },
  };
}
export function reviewResearchOffers(offers=[],limit=4) {
  const list=Array.isArray(offers)?offers:[];
  const verified=list.filter(o=>o.sameProduct===true&&['jan','model'].includes(o.matchBasis));
  const verifiedOnly=verified.length>0;
  // If the product is identifiable but has no ratings, don't replace its
  // missing evidence with a highly rated accessory or a different model.
  const matchingPool=verifiedOnly?verified:list;
  const pool=matchingPool.filter(o=>reviewMetrics(o.reviewAverage,o.reviewCount).available);
  return {
    verifiedOnly,
    rows:[...pool].sort((a,b)=>score(b)-score(a)
      || b.reviewCount-a.reviewCount || a.price-b.price)
      .slice(0,Number.isInteger(limit)&&limit>0&&limit<=12?limit:4),
  };
}
export const REVIEW_PRESETS=Object.freeze([
  {id:'balanced',label:'★4.0以上・20件以上',minReview:4,minReviewCount:20},
  {id:'high-evidence',label:'★4.5以上・50件以上',minReview:4.5,minReviewCount:50},
]);
