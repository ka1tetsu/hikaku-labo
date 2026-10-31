import { searchResponse } from './searchRequest.js';
import { isSpecificProductQuery, searchModeFor } from './productSearchIntent.js';

// Home page uses the same official multi-provider endpoint as /compare/.
// Do not label a Yahoo listing as Rakuten or use a fabricated fallback offer.
export function catalogFromComparison(data, keyword) {
  const raw = Array.isArray(data?.offers) ? data.offers : [];
  const specific = isSpecificProductQuery(keyword);
  const verified = raw.filter(item => item.sameProduct);
  // Exact model matching must not put cheaper, unverified accessories first.
  const filtered = specific && verified.length ? verified : raw;
  const items = filtered.filter(offer => offer.price > 0 && /^https:\/\//.test(offer.url || ''))
    .map(offer => ({
      itemCode: offer.store + ':' + offer.url,
      itemName: offer.title,
      itemPrice: offer.price,
      itemUrl: offer.url,
      affiliateUrl: offer.sponsored ? offer.url : null,
      sourceStore: offer.store,
      storeName: offer.storeName,
      shopName: offer.shopName,
      sponsored: Boolean(offer.sponsored),
      imageUrl: offer.image || '',
      itemCaption: '',
      reviewAverage: offer.reviewAverage || 0,
      reviewCount: offer.reviewCount || 0,
      reviewUrl: offer.reviewUrl || null,
      sellerReviewAverage: offer.sellerReviewAverage || 0,
      sellerReviewCount: offer.sellerReviewCount || 0,
      storeUrl: offer.storeUrl || null,
      condition: offer.condition || 'unknown',
      inStock: offer.inStock ?? null,
      pointRate: 0,
      pointBack: offer.point || 0,
      pointKind: offer.pointKind || '',
      effectivePrice: offer.effectivePrice ?? offer.price,
      shippingStatus: offer.shippingStatus || 'unknown',
      isFreeShipping: offer.shippingStatus === 'free',
      postageFlag: offer.shippingStatus === 'extra' ? 1 : offer.shippingStatus === 'free' ? 0 : undefined,
      sameProduct: Boolean(offer.sameProduct),
      matchBasis: offer.matchBasis || 'unverified',
      jan: /^\d{8}$|^\d{13}$/.test(String(offer.jan||'')) ? String(offer.jan) : '',
    }));
  // Show the source result order, unless this is a known product model.
  if (specific) items.sort((a,b) => a.itemPrice-b.itemPrice);
  return {
    items, sources: data.sources || {}, mode: data.mode || searchModeFor(keyword),
    pageCount: Number(data.pageCount) || 1, count: items.length,
    affiliateActive: items.some(x => x.sponsored),
    verifiedOnly: specific && verified.length > 0,
  };
}

export async function searchCatalogItems(keyword, genreId = '', page = 1, options = {}) {
  const mode = options.sort === '+itemPrice' || options.sort === '-itemPrice' ? 'price' : searchModeFor(keyword);
  const params = new URLSearchParams({q:keyword || genreId,mode,page:String(page)});
  if (options.minPrice) params.set('minPrice',String(options.minPrice));
  if (options.maxPrice) params.set('maxPrice',String(options.maxPrice));
  const response = await searchResponse('/api/compare?' + params, {signal:options.signal,timeoutMs:13000});
  if (!response.ok) throw new Error('公式APIから商品を取得できません。');
  const data = await response.json();
  if (!Array.isArray(data.offers)) throw new Error('商品データの形式を確認できません。');
  return catalogFromComparison(data,keyword);
}
