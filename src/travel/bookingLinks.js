// Flight & hotel search deep links — plain URLs, no partner API calls.
// A link is labelled sponsored ONLY when a real affiliate ID for that partner is
// configured; otherwise it is an ordinary outbound link and earns nothing.
// IDs are public build-time values (VITE_*): never put secrets here.
import { RAKUTEN_AFFILIATE_ID } from '../api.js';

export const ORIGINS = Object.freeze([
  { code: 'TYO', label: '東京（羽田・成田）', skyscanner: 'tyoa' },
  { code: 'OSA', label: '大阪（関西・伊丹）', skyscanner: 'osaa' },
  { code: 'NGO', label: '名古屋（中部）', skyscanner: 'ngo' },
  { code: 'FUK', label: '福岡', skyscanner: 'fuk' },
  { code: 'SPK', label: '札幌（新千歳）', skyscanner: 'cts' },
  { code: 'OKA', label: '沖縄（那覇）', skyscanner: 'oka' },
  { code: 'SDJ', label: '仙台', skyscanner: 'sdj' },
  { code: 'HIJ', label: '広島', skyscanner: 'hij' },
]);

// Affiliate networks whose deep-link wrappers accept the destination URL appended
// (URL-encoded) at the end, e.g. A8.net "a8ejpredirect=", ValueCommerce "vc_url=",
// Impact "?u=", Travelpayouts "&u=".
const PREFIX_HOSTS = ['px.a8.net', 'ck.jp.ap.valuecommerce.com', 'af.moshimo.com', 'h.accesstrade.net', 'click.linksynergy.com', 'tp.media', 'prf.hn'];
export function safeLinkPrefix(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    const allowed = PREFIX_HOSTS.includes(url.hostname) || url.hostname.endsWith('.pxf.io');
    if (url.protocol !== 'https:' || !allowed || !/[=]$/.test(value.trim())) return null;
    return value.trim();
  } catch {
    return null;
  }
}
const digits = value => (typeof value === 'string' && /^\d{3,12}$/.test(value.trim()) ? value.trim() : null);

export function travelLinkConfig(env = {}) {
  const rakutenId = env.VITE_RAKUTEN_AFFILIATE_ID || RAKUTEN_AFFILIATE_ID;
  return {
    rakutenId: env.VITE_RAKUTEN_TRAVEL_DISABLED === 'true' || !/^[0-9a-f.]{20,}$/i.test(rakutenId || '') ? null : rakutenId,
    tripcom: digits(env.VITE_TRIPCOM_ALLIANCE_ID) && digits(env.VITE_TRIPCOM_SID)
      ? { allianceId: digits(env.VITE_TRIPCOM_ALLIANCE_ID), sid: digits(env.VITE_TRIPCOM_SID) } : null,
    bookingAid: digits(env.VITE_BOOKING_AID),
    skyscannerPrefix: safeLinkPrefix(env.VITE_SKYSCANNER_LINK_PREFIX),
    expediaPrefix: safeLinkPrefix(env.VITE_EXPEDIA_LINK_PREFIX),
  };
}

const rakutenWrap = (url, id) => `https://hb.afl.rakuten.co.jp/hgc/${id}/?pc=${encodeURIComponent(url)}&m=${encodeURIComponent(url)}`;
const prefixWrap = (url, prefix) => prefix + encodeURIComponent(url);

const pad = n => String(n).padStart(2, '0');
export function isoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}
const validIso = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
// Fill missing / invalid / reversed dates with sensible defaults (≈1 month ahead).
export function tripDates({ depart, ret, nights = 2, today = new Date() } = {}) {
  const start = validIso(depart) ? depart : addDays(isoDate(today), 30);
  const stay = Math.max(0, Math.min(30, Math.floor(Number(nights) || 0)));
  const end = validIso(ret) && ret >= start ? ret : addDays(start, Math.max(1, stay));
  return { depart: start, ret: end };
}

const clampAdults = (n, max = 9) => Math.max(1, Math.min(max, Math.floor(Number(n) || 1)));

function link(provider, label, href, sponsored, merchant, note = '') {
  return { provider, label, href, sponsored, merchant, note };
}

// Flight search links. `destination.flight` holds { city, airport } IATA codes.
export function buildFlightLinks({ originCode = 'TYO', destination, depart, ret, nights, adults = 1, oneWay = false, config = travelLinkConfig() } = {}) {
  const origin = ORIGINS.find(o => o.code === originCode) || ORIGINS[0];
  if (!destination?.flight) return [];
  const to = destination.flight.city;
  if (to === origin.code) return [];
  const dates = tripDates({ depart, ret, nights });
  const people = clampAdults(adults);
  const out = [];

  const trip = new URL('https://jp.trip.com/flights/showfarefirst');
  Object.entries({ dcity: origin.code.toLowerCase(), acity: to.toLowerCase(), ddate: dates.depart, ...(oneWay ? {} : { rdate: dates.ret }),
    triptype: oneWay ? 'ow' : 'rt', class: 'y', quantity: String(people), locale: 'ja-JP', curr: 'JPY' })
    .forEach(([k, v]) => trip.searchParams.set(k, v));
  if (config.tripcom) { trip.searchParams.set('Allianceid', config.tripcom.allianceId); trip.searchParams.set('SID', config.tripcom.sid); }
  out.push(link('tripcom', 'Trip.com', trip.toString(), Boolean(config.tripcom), 'trip-com', '格安航空券をまとめて比較'));

  const yymmdd = iso => iso.slice(2).replaceAll('-', '');
  const sky = `https://www.skyscanner.jp/transport/flights/${origin.skyscanner}/${destination.flight.airport.toLowerCase()}/${yymmdd(dates.depart)}/${oneWay ? '' : yymmdd(dates.ret) + '/'}?adultsv2=${people}&cabinclass=economy`;
  out.push(link('skyscanner', 'スカイスキャナー', config.skyscannerPrefix ? prefixWrap(sky, config.skyscannerPrefix) : sky, Boolean(config.skyscannerPrefix), 'skyscanner', '航空会社・旅行会社の運賃を横断検索'));

  const slash = iso => iso.replaceAll('-', '/');
  const expedia = `https://www.expedia.co.jp/Flights-Search?trip=${oneWay ? 'oneway' : 'roundtrip'}&leg1=from:${origin.code},to:${to},departure:${slash(dates.depart)}TANYT`
    + (oneWay ? '' : `&leg2=from:${to},to:${origin.code},departure:${slash(dates.ret)}TANYT`) + `&passengers=adults:${people}&mode=search`;
  out.push(link('expedia', 'エクスペディア', config.expediaPrefix ? prefixWrap(expedia, config.expediaPrefix) : expedia, Boolean(config.expediaPrefix), 'expedia', '航空券＋ホテルのセット割も確認'));

  const google = 'https://www.google.com/travel/flights?hl=ja&curr=JPY&q=' + encodeURIComponent(`Flights to ${to} from ${origin.code} on ${dates.depart}${oneWay ? ' one way' : ' through ' + dates.ret}`);
  out.push(link('google', 'Google フライト', google, false, 'google-flights', '運賃の推移・日付ごとの最安値を確認'));

  if (config.rakutenId) {
    const rakuten = destination.area === 'domestic' ? 'https://travel.rakuten.co.jp/package/' : 'https://travel.rakuten.co.jp/kaigai/';
    out.push(link('rakuten', '楽天トラベル', rakutenWrap(rakuten, config.rakutenId), true, 'rakuten-travel',
      destination.area === 'domestic' ? 'ANA・JAL航空券＋宿のセットプラン' : '海外航空券・ツアー（楽天ポイント対象）'));
  }
  return out;
}

// Hotel search links for a curated destination or a free-text place.
export function buildStayLinks({ destination = null, query = '', checkin, checkout, nights, adults = 2, rooms = 1, config = travelLinkConfig() } = {}) {
  if (nights !== undefined && Number(nights) === 0) return [];
  const nameJa = destination?.name || String(query).trim();
  const nameEn = destination?.nameEn || String(query).trim();
  if (!nameJa) return [];
  const dates = tripDates({ depart: checkin, ret: checkout, nights });
  const people = clampAdults(adults, 30);
  const roomCount = Math.max(1, Math.min(9, Math.floor(Number(rooms) || 1)));
  const out = [];

  if (config.rakutenId) {
    const kw = encodeURIComponent(nameJa);
    const domesticUrl = `https://kw.travel.rakuten.co.jp/keyword/Search.do?charset=utf-8&f_max=30&f_query=${kw}`;
    const overseasUrl = `https://kw.travel.rakuten.co.jp/keyword_overseas/Search.do?keywordsearchtype=0&charset=utf-8&f_max=30&f_query=${kw}`;
    // A free-text place could be in Japan or abroad, so offer both keyword searches.
    if (!destination || destination.area === 'domestic') out.push(link('rakuten', destination ? '楽天トラベル' : '楽天トラベル（国内）', rakutenWrap(domesticUrl, config.rakutenId), true, 'rakuten-travel', '行き先を引継ぎ。日付・人数・部屋数は予約先で設定'));
    if (!destination || destination.area !== 'domestic') out.push(link('rakuten-overseas', destination ? '楽天トラベル' : '楽天トラベル（海外）', rakutenWrap(overseasUrl, config.rakutenId), true, 'rakuten-travel', '海外の行き先を引継ぎ。日付・人数・部屋数は予約先で設定'));
  }

  const booking = new URL('https://www.booking.com/searchresults.ja.html');
  Object.entries({ ss: nameEn, checkin: dates.depart, checkout: dates.ret, group_adults: String(people), no_rooms: String(roomCount), lang: 'ja' })
    .forEach(([k, v]) => booking.searchParams.set(k, v));
  if (config.bookingAid) booking.searchParams.set('aid', config.bookingAid);
  out.push(link('booking', 'Booking.com', booking.toString(), Boolean(config.bookingAid), 'booking', '世界中のホテル・アパートを日付で検索'));

  const expedia = `https://www.expedia.co.jp/Hotel-Search?destination=${encodeURIComponent(nameEn)}&startDate=${dates.depart}&endDate=${dates.ret}&adults=${people}&rooms=${roomCount}`;
  out.push(link('expedia', 'エクスペディア', config.expediaPrefix ? prefixWrap(expedia, config.expediaPrefix) : expedia, Boolean(config.expediaPrefix), 'expedia', 'ホテル単体・航空券セットを比較'));

  return out;
}

// Destinations without an airport (or the departure city itself): rail + hotel packages.
export function buildRailLinks({ destination, nights, config = travelLinkConfig() } = {}) {
  if (Number(nights) === 0 || !config.rakutenId || destination?.area !== 'domestic') return [];
  return [link('rakuten-jr', '楽天トラベル', rakutenWrap('https://travel.rakuten.co.jp/package/jr/', config.rakutenId), true, 'rakuten-travel', 'JR・新幹線＋宿のセットプラン')];
}

// Place outside the catalog: still searchable worldwide through ordinary search URLs.
export function buildPlaceLinks(query, { config = travelLinkConfig(), nights = 2, adults = 2 } = {}) {
  const text = String(query || '').trim();
  if (!text) return [];
  return [
    ...buildStayLinks({ query: text, nights, adults, config }),
    link('google', 'Google フライト', 'https://www.google.com/travel/flights?hl=ja&curr=JPY&q=' + encodeURIComponent(text + ' 航空券'), false, 'google-flights', '行き方と航空券を調べる'),
    link('maps', 'Google マップ', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(text), false, 'google-maps', '場所と周辺の見どころを確認'),
  ];
}
