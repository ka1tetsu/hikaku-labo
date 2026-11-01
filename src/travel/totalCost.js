import { TRAVEL_PROVIDERS } from './providers.js';
// Privacy-first calculator for user-entered quotes; NOT a live booking price feed.
// Do not compare offers whose trip terms are not confirmed equivalent.
const safeYen = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const str=String(value).trim();
  if (!/^\d{1,9}$/.test(str)) return null;
  const parsed=Number(str);
  return Number.isSafeInteger(parsed) && parsed>=0 ? parsed : null;
};
export const QUOTE_CATEGORIES=Object.freeze([
  {id:'flight',label:'航空券'},{id:'hotel',label:'ホテル・宿泊'},
]);
export function quoteCost(quote){
  if(!quote || !['flight','hotel'].includes(quote.type) || !TRAVEL_PROVIDERS.some(p=>p.id===quote.providerId && p.type===quote.type))return null;
  const base=safeYen(quote.base), taxes=safeYen(quote.taxes),
    extras=safeYen(quote.extras),discount=safeYen(quote.discount),
    points=safeYen(quote.points);
  if([base,taxes,extras,discount,points].some(v=>v===null))return null;
  const subtotal=base+taxes+extras;
  if(!Number.isSafeInteger(subtotal)||discount>subtotal)return null;
  return Object.freeze({
    cashPayable:subtotal-discount,nonCashPoints:points,
    pointsAdjustedIllustration:Math.max(0,subtotal-discount-points),
    subtotal,base,taxes,extras,discount,
    confirmedComparable:quote.sameConditions===true,
  });
}
export function compareEnteredQuotes(quotes,{type}={}){
  const valid=quotes.map((quote,index)=>({quote,index,cost:quoteCost(quote)}))
    .filter(x=>x.cost && x.quote.type===(type||x.quote.type) && x.cost.confirmedComparable);
  // At least two DISTINCT providers are needed for a meaningful cross-site comparison.
  const uniqueProviders=new Set(valid.map(x=>x.quote.providerId));
  const comparisonPossible=uniqueProviders.size>=2 && valid.length>=2;
  valid.sort((a,b)=>a.cost.cashPayable-b.cost.cashPayable||a.index-b.index);
  return {
    comparisonPossible,
    ranked:valid.map((row,index)=>({...row,rank:comparisonPossible?index+1:null})),
    cheapestAmongEntered:comparisonPossible?valid[0]:null,
    excludedCount:quotes.length-valid.length,
    caveat:'利用者が入力した税込・追加料金込みの候補内だけを比較。料金の正確性、同等条件、空席・空室、最新価格はサイト側では確認していません。後日ポイントは実際の支払額から差し引きません。',
  };
}

// An explicit preference model, evaluated only over comparable entered quotes.
// A missing cancellation fee changes the entire pool to price-only: it cannot
// make an incompletely documented offer look more flexible than another one.
export function rankEnteredQuotes(quotes, { type = 'hotel', preference = 'balanced', cancellationDate = '' } = {}) {
  const result = compareEnteredQuotes(quotes, { type });
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(cancellationDate) && Number.isFinite(Date.parse(cancellationDate)) && new Date(cancellationDate).toISOString().slice(0,10) === cancellationDate;
  const fees = result.ranked.map(row => safeYen(row.quote.cancellationFee));
  const usesCancellation = preference !== 'price' && dateValid && result.comparisonPossible && fees.every((fee, i) => fee !== null && fee <= result.ranked[i].cost.cashPayable);
  const priceWeight = usesCancellation ? (preference === 'flexible' ? 0.5 : 0.8) : 1;
  const minimum = result.ranked[0]?.cost.cashPayable ?? 0;
  const ranked = result.ranked.map((row, i) => {
    const pricePart = row.cost.cashPayable === 0 ? 1 : minimum / row.cost.cashPayable;
    const flexibilityPart = usesCancellation ? (row.cost.cashPayable === 0 ? 1 : 1 - fees[i] / row.cost.cashPayable) : 0;
    const score = 100 * (priceWeight * pricePart + (1 - priceWeight) * flexibilityPart);
    return { ...row, score, cancellationFee: fees[i], pricePart, flexibilityPart };
  }).sort((a,b) => b.score - a.score || a.cost.cashPayable - b.cost.cashPayable || a.index - b.index).map((row,index)=>({...row,rank:result.comparisonPossible?index+1:null}));
  return { ...result, ranked, recommended: result.comparisonPossible ? ranked[0] : null, usesCancellation, priceWeight };
}
