// GET /api/compare?q=<search words>&ref=<reference product title>&jan=<JAN code>
// Real-time price comparison for one product across stores with official APIs:
//   - 楽天市場 (Rakuten Ichiba Item Search, existing credentials)
//   - Yahoo!ショッピング (itemSearch v3, enabled when YAHOO_SHOPPING_CLIENT_ID is set)
// Store pages are never scraped. Prices are as returned at request time.
import { upstreamResponse } from '../server/upstream.js';
import { fetchRakutenSearch } from './search.js';
import { normalizeRakutenOffer, normalizeYahooOffer, rankOffers, summarizeOffers } from '../src/shared/priceCompare.js';
import { RAKUTEN_AFFILIATE_ID } from '../src/api.js';
import { compareBudget, withinCompareBudget } from '../src/shared/compareBudget.js';
import { rakutenPayload } from '../src/shared/rakutenPayload.js';

const YAHOO_ENDPOINT = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';
const YAHOO_CLIENT_ID = process.env.YAHOO_SHOPPING_CLIENT_ID || '';
// ValueCommerce IDs for Yahoo!ショッピング (same public values as the client-side links).
const VC_SID = process.env.YAHOO_VC_SID || '3506307';
const VC_PID = process.env.YAHOO_VC_PID || '888496181';

export function wrapRakuten(url) {
  const id = process.env.RAKUTEN_AFFILIATE_ID || RAKUTEN_AFFILIATE_ID;
  try {
    const destination = new URL(url);
    if (!id || destination.protocol !== 'https:' || destination.username || destination.password || !['item.rakuten.co.jp', 'search.rakuten.co.jp'].includes(destination.hostname)) return url;
    const encoded = encodeURIComponent(destination.href);
    return `https://hb.afl.rakuten.co.jp/hgc/${id}/?pc=${encoded}&m=${encoded}`;
  } catch { return url; }
}

export function wrapYahoo(url) {
  if (!/^https:\/\/([a-z0-9-]+\.)*shopping\.yahoo\.co\.jp\//.test(url || '') && !/^https:\/\/store\.shopping\.yahoo\.co\.jp\//.test(url || '')) return url;
  return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${VC_SID}&pid=${VC_PID}&vc_url=${encodeURIComponent(url)}`;
}

export function compareParams(query = {}) {
  const clip = (value, max) => String(value || '').normalize('NFKC').replace(/\p{Cc}/gu, '').trim().slice(0, max);
  const jan = /^\d{8}$|^\d{13}$/.test(String(query.jan || '')) ? String(query.jan) : '';
  return { q: clip(query.q, 80), ref: clip(query.ref, 200), jan };
}

async function rakutenOffers(q, budget, mode = 'price', page = 1) {
  const result = await fetchRakutenSearch({ keyword: q, genreId: '', page, filters: { sort: mode === 'recommended' ? 'standard' : '+itemPrice', ...budget } });
  if (!result.ok) return { status: 'error', offers: [] };
  const { items } = rakutenPayload(result.text);
  // The provider can omit affiliateUrl after its affiliate-parameter fallback.
  // Keep the same public-ID referral fallback used by product cards.
  return { status: 'ok', offers: items.map((item, index) => ({ ...normalizeRakutenOffer(item, wrapRakuten), sourceRank: index })) };
}

async function yahooOffers(q, jan, budget, mode = 'price', page = 1) {
  if (!YAHOO_CLIENT_ID) return { status: 'disabled', offers: [] };
  const params = new URLSearchParams({ appid: YAHOO_CLIENT_ID, results: '30', start: String(1 + (page - 1) * 30), sort: mode === 'recommended' ? '-score' : '+price', in_stock: 'true', condition: 'new', image_size: '146' });
  if (budget.minPrice) params.set('price_from', budget.minPrice);
  if (budget.maxPrice) params.set('price_to', budget.maxPrice);
  if (jan) params.set('jan_code', jan); else params.set('query', q);
  try {
    const response = await upstreamResponse(`${YAHOO_ENDPOINT}?${params}`, { headers: { 'User-Agent': 'hikaku-labo/1.0' } });
    if (!response.ok) return { status: 'error', offers: [] };
    const data = JSON.parse(response.text);
    return { status: 'ok', offers: (data.hits || []).map((hit, index) => ({ ...normalizeYahooOffer(hit, wrapYahoo), sourceRank: index })), total: Number(data.totalResultsAvailable) || 0 };
  } catch {
    return { status: 'error', offers: [] };
  }
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const { q, ref, jan } = compareParams(req.query);
  if (!q && !jan) return res.status(400).json({ error: 'q_or_jan_required' });
  const budget = compareBudget(req.query);
  // Homepage discovery uses Yahoo's official relevance ranking. Exact models use price order.
  const mode = req.query.mode === 'recommended' ? 'recommended' : 'price';
  const page = Number.isInteger(Number(req.query.page)) && Number(req.query.page) >= 1 && Number(req.query.page) <= 20 ? Number(req.query.page) : 1;
  if (budget.minPrice && budget.maxPrice && budget.minPrice > budget.maxPrice) return res.status(400).json({ error: 'invalid_price_range' });

  const [rakuten, yahoo] = await Promise.all([
    mode === 'recommended' ? Promise.resolve({status:'skipped',offers:[]}) : rakutenOffers(q || jan, budget, mode, page).catch(() => ({ status: 'error', offers: [] })),
    yahooOffers(q, jan, budget, mode, page),
  ]);
  // Preserve both cash-cheapest and rewards-cheapest candidates for client-side criteria.
  const ranked = rankOffers([...rakuten.offers, ...yahoo.offers].filter(offer => withinCompareBudget(offer, budget)), ref || q, jan);
  // For discovery, preserve each provider's relevance order; do NOT pretend that
  // a cheap accessory or similar item is the most recommended product.
  const offers = (mode === 'recommended'
    ? ranked.sort((a, b) => Number(b.sameProduct) - Number(a.sameProduct)
      || (a.sourceRank ?? 99) - (b.sourceRank ?? 99)
      || (b.reviewCount || 0) - (a.reviewCount || 0))
    : ranked).slice(0, 80);
  res.setHeader('Cache-Control', [rakuten.status, yahoo.status].includes('ok') ? 's-maxage=300, stale-while-revalidate=300' : 'no-store');
  return res.status(200).json({
    query: q, reference: ref, jan,
    ...budget,
    mode, page, pageCount: Math.max(1, Math.min(20, Math.ceil((yahoo.total || offers.length) / 30))),
    sources: { rakuten: rakuten.status, yahoo: yahoo.status },
    summary: summarizeOffers(offers),
    offers,
    fetchedAt: new Date().toISOString(),
  });
}
