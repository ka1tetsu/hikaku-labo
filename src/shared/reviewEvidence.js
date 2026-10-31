// Ratings are licensed provider aggregates; never scrape review text or imply
// that a store's fulfillment rating describes the product itself.
export function reviewMetrics(average, count) {
  const r=Number(average), n=Number(count);
  return Number.isFinite(r) && r>=1 && r<=5 && Number.isSafeInteger(n) && n>0
    ? {average:r, count:n, available:true}
    : {average:0, count:0, available:false};
}
export const RATING_PRIOR = Object.freeze({mean:3.8,count:15});
export function confidenceAdjustedRating(average, count) {
  const r=reviewMetrics(average,count);
  if (!r.available) return -1;
  // Public, fixed editorial prior: not an empirically estimated category mean.
  // Shrinks the effect of a tiny review sample without falsely inventing votes.
  return (r.average*r.count + RATING_PRIOR.mean*RATING_PRIOR.count)/
    (r.count+RATING_PRIOR.count);
}
// Convert a Bayesian 1..5 star value to a 0..100 reference scale.
export function ratingIndex(average,count) {
  const b=confidenceAdjustedRating(average,count);
  return b<0?null:25*(b-1);
}
export function safeProviderReviewUrl(rawUrl,store='yahoo') {
  if (store!=='yahoo' || typeof rawUrl!=='string') return null;
  try {
    const u=new URL(rawUrl);
    if (u.protocol!=='https:' || u.username || u.password ||
        u.hostname!=='shopping.yahoo.co.jp' ||
        !u.pathname.startsWith('/review/')) return null;
    return u.href;
  } catch { return null; }
}
export function safeStoreUrl(rawUrl,store='yahoo') {
  if(store!=='yahoo'||typeof rawUrl!=='string') return null;
  try {
    const u=new URL(rawUrl);
    if(u.protocol!=='https:'||u.username||u.password||
      !['store.shopping.yahoo.co.jp','shopping.yahoo.co.jp'].includes(u.hostname))return null;
    return u.href;
  }catch{return null;}
}
