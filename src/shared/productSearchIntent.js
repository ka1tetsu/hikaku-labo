import { extractModelCodes } from './priceCompare.js';

// Exact model/JAN queries should compare listing prices; broad discovery should
// preserve the shopping provider's relevance ranking instead of surfacing cheap accessories.
export function isSpecificProductQuery(text = '') {
  const q = String(text).normalize('NFKC').trim();
  if (/^\d{8}$|^\d{13}$/.test(q)) return true;
  if (extractModelCodes(q).length) return true;
  // Common consumer model families use a spaced generation number.
  return /\b(?:iPhone|iPad|Galaxy|Pixel|Nintendo Switch|PS5|PlayStation)\s*\d{1,2}(?:\s+(?:Pro|Max|Plus|Ultra|Air))?\b/i.test(q);
}
export function searchModeFor(text) {
  return isSpecificProductQuery(text) ? 'price' : 'recommended';
}
