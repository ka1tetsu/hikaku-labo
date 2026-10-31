// Independent consumer decisions. Never collapse prices, review means, and
// seller ratings into one unexplainable or commission-weighted "best" score.
import {reviewMetrics,confidenceAdjustedRating} from './reviewEvidence.js';

export function buyingDecisionCandidates(offers=[]) {
  const eligible=(Array.isArray(offers)?offers:[]).filter(o=>
    o?.sameProduct===true && ['jan','model'].includes(o.matchBasis) &&
    Number.isFinite(o.price) && o.price>0 && o.inStock!==false &&
    typeof o.url==='string' && o.url.startsWith('https://'));
  const byPrice=(a,b)=>a.price-b.price || (b.reviewCount||0)-(a.reviewCount||0);
  const cash=[...eligible].filter(o=>o.shippingStatus==='free').sort(byPrice)[0]||null;
  // Minimum sample-size guards; a single five-star review is not a reliable
  // reason to call a listing "review backed".
  const product=[...eligible].filter(o=>reviewMetrics(o.reviewAverage,o.reviewCount).available&&o.reviewCount>=20)
    .sort((a,b)=>confidenceAdjustedRating(b.reviewAverage,b.reviewCount)-confidenceAdjustedRating(a.reviewAverage,a.reviewCount)
      || b.reviewCount-a.reviewCount||byPrice(a,b))[0]||null;
  const seller=[...eligible].filter(o=>reviewMetrics(o.sellerReviewAverage,o.sellerReviewCount).available&&o.sellerReviewCount>=20)
    .sort((a,b)=>confidenceAdjustedRating(b.sellerReviewAverage,b.sellerReviewCount)-confidenceAdjustedRating(a.sellerReviewAverage,a.sellerReviewCount)
      || b.sellerReviewCount-a.sellerReviewCount||byPrice(a,b))[0]||null;
  return [
    {key:'cash',label:'送料0円確認済みの価格重視',offer:cash,why:cash?'型番またはJANを照合でき、取得元で送料0円と表示された候補内の最低商品価格':'送料0円・同一商品と確認できる出品なし'},
    {key:'product',label:'商品口コミを重視',offer:product,why:product?'商品口コミ20件以上の出品を、件数を考慮した評価の参考順で選出':'同一商品かつ口コミ20件以上の出品なし'},
    {key:'seller',label:'販売店の評価を重視',offer:seller,why:seller?'店舗口コミ20件以上の出品を、件数を考慮した店舗評価の参考順で選出':'店舗口コミ20件以上の同一商品出品なし'},
  ];
}
