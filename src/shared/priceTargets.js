// Price targets store the user's search conditions and desired price ONLY.
// Merchant prices, images and offer details must not be retained in localStorage.
export const WATCH_STORAGE_KEY = 'vivlica-product-targets-v1';
export const WATCH_MAX = 12;
const FIELDS = ['q', 'ref', 'jan', 'minPrice', 'maxPrice'];
const MAX_LENGTH = { q: 80, ref: 200, jan: 13, minPrice: 9, maxPrice: 9 };

export function normalizedWatchQuery(input = {}) {
  const result = {};
  for (const field of FIELDS) {
    const value = String(input[field] ?? '').normalize('NFKC').trim().slice(0, MAX_LENGTH[field]);
    if (value) result[field] = value;
  }
  return result;
}

export function watchQueryId(input = {}) {
  const query = normalizedWatchQuery(input);
  return new URLSearchParams(FIELDS.filter(key => query[key]).map(key => [key, query[key]])).toString();
}

export function makePriceTarget(query, price) {
  const target = Number(price);
  const normalized = normalizedWatchQuery(query);
  if ((!normalized.q && !normalized.jan) || !Number.isSafeInteger(target) || target < 1 || target > 999999999) return null;
  return { query: normalized, target };
}

export function parsePriceTargets(raw) {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set();
    return data.slice(0, 50).map(row => makePriceTarget(row?.query, row?.target))
      .filter(row => {
        if (!row) return false;
        const key = watchQueryId(row.query);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, WATCH_MAX);
  } catch { return []; }
}

export function savePriceTarget(items, item) {
  if (!item) return items;
  const id = watchQueryId(item.query);
  return [item, ...items.filter(old => watchQueryId(old.query) !== id)].slice(0, WATCH_MAX);
}

export function priceTargetLink(item) {
  return '/compare/?' + watchQueryId(item.query);
}

export function evaluatePriceTarget(item, data, activeQuery) {
  if (!data || watchQueryId(item?.query) !== watchQueryId(activeQuery)) return { status: 'not-checked' };
  const verified = (Array.isArray(data.offers) ? data.offers : []).filter(offer =>
    offer.sameProduct === true && ['jan', 'model'].includes(offer.matchBasis) &&
    Number.isFinite(offer.price) && offer.price > 0);
  if (!verified.length) return { status: 'not-verified' };
  const best = verified.reduce((lowest, offer) => offer.price < lowest.price ? offer : lowest);
  return { status: best.price <= item.target ? 'reached' : 'above', lowest: best.price, offer: best, fetchedAt: data.fetchedAt || null };
}
