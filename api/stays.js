import { upstreamResponse } from '../server/upstream.js';
import { parseStaySearch } from '../src/travel/staySearch.js';
import { RAKUTEN_AFFILIATE_ID } from '../src/api.js';

const BASE = 'https://openapi.rakuten.co.jp/engine/api/Travel/';
const VERSIONS = { KeywordHotelSearch: '20260731', VacantHotelSearch: '20170426' };
function travelUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (url.hostname === 'hb.afl.rakuten.co.jp' || url.hostname === 'travel.rakuten.co.jp' || url.hostname.endsWith('.travel.rakuten.co.jp')) ? url.href : null;
  } catch { return null; }
}
function rakutenImage(raw){
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (url.hostname.endsWith('.rakuten.co.jp') || url.hostname === 'rakuten.co.jp' || url.hostname.endsWith('.r10s.jp') || url.hostname === 'r10s.jp') return url.href;
  } catch { /* reject untrusted image hosts */ }
  return null;
}
function hotelParts(group) { return Array.isArray(group?.hotel) ? group.hotel : []; }
export function candidateHotelIds(body) {
  return [...new Set((body?.hotels || []).flatMap(group => hotelParts(group).map(part => String(part.hotelBasicInfo?.hotelNo || ''))).filter(id => /^\d{1,10}$/.test(id)))].slice(0, 30);
}
export function normalizeStays(body, search) {
  const offers = [];
  for (const group of Array.isArray(body?.hotels) ? body.hotels : []) {
    const parts = hotelParts(group), basic = parts.find(part => part.hotelBasicInfo)?.hotelBasicInfo;
    if (!basic || !/^\d{1,10}$/.test(String(basic.hotelNo))) continue;
    for (const part of parts) {
      if (!Array.isArray(part.roomInfo)) continue;
      const room = part.roomInfo.find(info => info.roomBasicInfo)?.roomBasicInfo;
      const charge = part.roomInfo.find(info => info.dailyCharge)?.dailyCharge;
      if (!room) continue;
      const url = travelUrl(room.reserveUrl) || travelUrl(basic.hotelInformationUrl);
      if (!url) continue;
      const amount = Number(charge?.total), rating = Number(basic.reviewAverage);
      offers.push({
        id: `${basic.hotelNo}-${room.planId || ''}-${room.roomClass || ''}`,
        hotelNo: String(basic.hotelNo), name: String(basic.hotelName || ''), address: String(basic.address1 || '') + String(basic.address2 || ''),
        image: rakutenImage(basic.hotelThumbnailUrl) || rakutenImage(basic.hotelImageUrl),
        roomName: String(room.roomName || ''), planName: String(room.planName || ''),
        rating: rating > 0 && rating <= 5 ? rating : null,
        reviewCount: Math.max(0, Math.floor(Number(basic.reviewCount) || 0)),
        firstNightTotal: charge?.stayDate === search.checkin && Number.isSafeInteger(amount) && amount > 0 ? amount : null,
        breakfast: Number(room.withBreakfastFlag) === 1, dinner: Number(room.withDinnerFlag) === 1,
        url, sponsored: new URL(url).hostname === 'hb.afl.rakuten.co.jp', reservationLink: Boolean(travelUrl(room.reserveUrl)),
      });
    }
  }
  return offers.filter(offer => offer.name);
}
export async function findStays(search, { env = process.env, request = upstreamResponse } = {}) {
  const app = env.RAKUTEN_APP_ID || '4c29f89d-b874-4910-a38b-1d8e0314c2a3';
  if (!env.RAKUTEN_ACCESS_KEY) return { status: 'not_connected', offers: [] };
  const origin = 'https://vivlica.com';
  async function call(api, fields) {
    const params = new URLSearchParams({ applicationId: app, format: 'json', formatVersion: '1', datumType: '1', ...fields });
    const affiliate = env.RAKUTEN_AFFILIATE_ID || RAKUTEN_AFFILIATE_ID;
    if (affiliate) params.set('affiliateId', affiliate);
    const response = await request(BASE + api + '/' + VERSIONS[api] + '?' + params, { timeoutMs: 6000, headers: { accessKey: env.RAKUTEN_ACCESS_KEY, Origin: origin, Referer: origin + '/' } });
    if (response.status === 404) return { hotels: [] };
    if (!response.ok) {
      const reason = /HTTP_REFERRER_NOT_ALLOWED/i.test(response.text) ? 'site_registration_rejected' : response.status === 429 ? 'rate_limited' : 'provider_rejected';
      throw new Error(reason);
    }
    const data = JSON.parse(response.text);
    if (!Array.isArray(data.hotels)) throw new Error('invalid_response');
    return data;
  }
  try {
    const keyword = await call('KeywordHotelSearch', { keyword: search.place, hits: '30', page: String(search.page||1), responseType: 'middle' });
    const ids = candidateHotelIds(keyword);
    const pages = Math.min(100, Math.max(1, Number(keyword.pagingInfo?.pageCount)||1));
    if (!ids.length) return { status: 'ok', offers: [], candidatesChecked: 0, page: search.page||1, pageCount: pages };
    const conditions = [search.breakfast && 'breakfast', search.onsen && 'onsen'].filter(Boolean).join(',');
    const groups = [ids.slice(0, 15), ids.slice(15)].filter(group => group.length);
    const responses = await Promise.all(groups.map(group => call('VacantHotelSearch', {
      hotelNo: group.join(','), checkinDate: search.checkin, checkoutDate: search.checkout,
      adultNum: String(search.adults), roomNum: '1', hits: '30', searchPattern: '0', responseType: 'large',
      ...(conditions ? { squeezeCondition: conditions } : {}),
    })));
    // A failed batch is reported as an error rather than as no vacancies.
    const allowed = new Set(ids);
    const offers = responses.flatMap(response => normalizeStays(response, search)).filter(offer => allowed.has(offer.hotelNo) && (!search.breakfast || offer.breakfast));
    return { status: 'ok', offers: [...new Map(offers.map(offer => [offer.id, offer])).values()], candidatesChecked: ids.length, page: search.page||1, pageCount: pages };
  } catch (error) {
    const reasons = ['site_registration_rejected', 'rate_limited', 'provider_rejected'];
    return { status: reasons.includes(error.message) ? error.message : 'temporarily_unavailable', offers: [] };
  }
}
export default async function handler(req, res) {
  res.setHeader('Allow', 'GET');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const search = parseStaySearch(req.query);
  if (!search) return res.status(400).json({ error: 'invalid_search', offers: [] });
  const result = await findStays(search);
  if (result.status === 'ok') res.setHeader('Cache-Control', 'public, s-maxage=60');
  return res.status(result.status === 'ok' ? 200 : 503).json({ ...result, search, observedAt: new Date().toISOString(), scope: 'keyword_top_30', currency: 'JPY' });
}
