// Client-side comparison of prices manually checked by a shopper.
// No scraped/catalogue prices, guesses, or reward-as-cash claims.
export const MANUAL_STORES = Object.freeze(['rakuten', 'amazon', 'yahoo-shopping']);
const amount = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const s = String(value).trim();
  if (!/^\d{1,9}$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
};
export function manualOfferCost(row) {
  if (!row || !MANUAL_STORES.includes(row.storeId)) return null;
  const [price, shipping, discount, points] = ['price','shipping','discount','points'].map(k => amount(row[k]));
  if ([price,shipping,discount,points].some(value => value === null) || price <= 0) return null;
  const beforeDiscount = price + shipping;
  if (!Number.isSafeInteger(beforeDiscount) || discount > beforeDiscount) return null;
  const cashPayable = beforeDiscount - discount;
  if (points > cashPayable) return null;
  return Object.freeze({ price, shipping, discount, points, cashPayable,
    pointsAdjustedIllustration: cashPayable - points });
}
export function compareManualOffers(rows = [], { sort = 'cash' } = {}) {
  if (!Array.isArray(rows) || rows.length > 3) return { ranked: [], comparisonPossible: false, excludedCount: 0 };
  const valid = rows.map((row, index) => ({ row, index, cost: manualOfferCost(row) }))
    .filter(entry => entry.cost);
  const distinct = new Set(valid.map(entry => entry.row.storeId)).size === valid.length;
  const comparisonPossible = distinct && valid.length >= 2;
  const metric = sort === 'points' ? 'pointsAdjustedIllustration' : 'cashPayable';
  const ranked = [...valid].sort((a,b) => a.cost[metric] - b.cost[metric] || a.cost.cashPayable - b.cost.cashPayable || a.index - b.index);
  return { ranked, comparisonPossible, excludedCount: rows.length - valid.length,
    cheapest: comparisonPossible ? ranked[0] : null, sort: sort === 'points' ? 'points' : 'cash' };
}
