// Shopper-side filters over currently retrieved, source-backed offers.
// Filtering never creates listings, infers delivery cost, or expands API coverage.
export const CATALOG_FILTER_DEFAULTS = Object.freeze({
  store: 'all', freeShippingOnly: false, minReview: 0, maxPrice: 0,
});
export function filterCatalogResults(items = [], selected = {}) {
  const source = ['all','rakuten','yahoo'].includes(selected.store) ? selected.store : 'all';
  const maxPrice = Number.isFinite(Number(selected.maxPrice)) && Number(selected.maxPrice) > 0 ? Number(selected.maxPrice) : 0;
  const minReview = [0,4,4.5].includes(Number(selected.minReview)) ? Number(selected.minReview) : 0;
  return (Array.isArray(items) ? items : []).filter(item => {
    if (source !== 'all' && item.sourceStore !== source) return false;
    if (selected.freeShippingOnly === true && item.shippingStatus !== 'free') return false;
    if (maxPrice && !(Number(item.itemPrice) <= maxPrice)) return false;
    if (minReview && !(Number(item.reviewCount) > 0 && Number(item.reviewAverage) >= minReview)) return false;
    return true;
  });
}
export function catalogFilterCount(filters = {}) {
  return (filters.store && filters.store !== 'all' ? 1 : 0)
    + (filters.freeShippingOnly ? 1 : 0)
    + (Number(filters.maxPrice) > 0 ? 1 : 0)
    + (Number(filters.minReview) > 0 ? 1 : 0);
}
