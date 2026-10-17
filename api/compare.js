// GET /api/compare?q=<search words>&ref=<reference product title>&jan=<JAN code>
// Real-time price comparison for one product across stores with official APIs:
//   - 楽天市場 (Rakuten Ichiba Item Search, existing credentials)
//   - Yahoo!ショッピング (itemSearch v3, enabled when YAHOO_SHOPPING_CLIENT_ID is set)
// Store pages are never scraped. Prices are as returned at request time.
import { fetchRakutenSearch } from './search.js';
import { normalizeRakutenOffer, normalizeYahooOffer, rankOffers, summarizeOffers } from '../src/shared/priceCompare.js';

const YAHOO_ENDPOINT = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';
const YAHOO_CLIENT_ID = process.env.YAHOO_SHOPPING_CLIENT_ID || '';
// ValueCommerce IDs for Yahoo!ショッピング (same public values as the client-side links).
const VC_SID = process.env.YAHOO_VC_SID || '3506307';
const VC_PID = process.env.YAHOO_VC_PID || '888496181';

export function wrapYahoo(url) {
  if (!/^https:\/\/([a-z0-9-]+\.)*shopping\.yahoo\.co\.jp\//.test(url || '') && !/^https:\/\/store\.shopping\.yahoo\.co\.jp\//.test(url || '')) return url;
  return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${VC_SID}&pid=${VC_PID}&vc_url=${encodeURIComponent(url)}`;
}

export function compareParams(query = {}) {
  const clip = (value, max) => String(value || '').normalize('NFKC').replace(/\p{Cc}/gu, '').trim().slice(0, max);
  const jan = /^\d{8}$|^\d{13}$/.test(String(query.jan || '')) ? String(query.jan) : '';
  return { q: clip(query.q, 80), ref: clip(query.ref, 200), jan };
}

async function rakutenOffers(q) {
  const result = await fetchRakutenSearch({ keyword: q, genreId: '', page: 1, filters: { sort: '+itemPrice' } });
  if (!result.ok) return { status: 'error', offers: [] };
  const data = JSON.parse(result.text);
  const items = (data.Items || []).map(entry => entry.Item ?? entry);
  return { status: 'ok', offers: items.map(normalizeRakutenOffer) };
}

async function yahooOffers(q, jan) {
  if (!YAHOO_CLIENT_ID) return { status: 'disabled', offers: [] };
  const params = new URLSearchParams({ appid: YAHOO_CLIENT_ID, results: '30', sort: '+price', in_stock: 'true', condition: 'new', image_size: '146' });
  if (jan) params.set('jan_code', jan); else params.set('query', q);
  try {
    const response = await fetch(`${YAHOO_ENDPOINT}?${params}`, { headers: { 'User-Agent': 'hikaku-labo/1.0' } });
    if (!response.ok) return { status: 'error', offers: [] };
    const data = await response.json();
    return { status: 'ok', offers: (data.hits || []).map(hit => normalizeYahooOffer(hit, wrapYahoo)) };
  } catch {
    return { status: 'error', offers: [] };
  }
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const { q, ref, jan } = compareParams(req.query);
  if (!q && !jan) return res.status(400).json({ error: 'q_or_jan_required' });

  const [rakuten, yahoo] = await Promise.all([
    q ? rakutenOffers(q).catch(() => ({ status: 'error', offers: [] })) : { status: 'skipped', offers: [] },
    yahooOffers(q, jan),
  ]);
  const offers = rankOffers([...rakuten.offers, ...yahoo.offers], ref || q, jan).slice(0, 40);
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  return res.status(200).json({
    query: q, reference: ref, jan,
    sources: { rakuten: rakuten.status, yahoo: yahoo.status },
    summary: summarizeOffers(offers),
    offers,
    fetchedAt: new Date().toISOString(),
  });
}
