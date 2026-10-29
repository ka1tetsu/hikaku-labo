import { parseProductRequest } from './productAdvisor.js';

export function compareBudget(query = {}) {
  const price = value => {
    const text = String(value ?? '');
    return /^\d{1,9}$/.test(text) && Number(text) > 0 ? Number(text) : 0;
  };
  const minPrice = price(query.minPrice), maxPrice = price(query.maxPrice);
  // Reversed ranges are not silently discarded or widened.
  return { minPrice, maxPrice };
}

export function comparisonInput(input) {
  const text = String(input || '').trim();
  const request = parseProductRequest(text);
  const q = request.need || request.maxPrice || request.minPrice ? request.keyword || text : text;
  return { q, ref: '', jan: /^(?:\d{8}|\d{13})$/.test(text) ? text : '', ...compareBudget(request) };
}

// Budget applies to the listed price before points, excluding unreported shipping.
export function withinCompareBudget(offer, { minPrice = 0, maxPrice = 0 } = {}) {
  return (!minPrice || offer.price >= minPrice) && (!maxPrice || offer.price <= maxPrice);
}
