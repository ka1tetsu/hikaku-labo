export function japanToday(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export function parseStaySearch(query = {}, today = japanToday()) {
  const { place, checkin, checkout } = query;
  const adults = Number(query.adults);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(page) || page < 1 || page > 100 || (query.page !== undefined && !/^\d{1,3}$/.test(String(query.page)))) return null;
  if (!['string', 'number'].includes(typeof query.adults)) return null;
  if (typeof place !== 'string' || place.trim().length < 2 || place.length > 80 || /\p{Cc}/u.test(place)) return null;
  if (!validDate(checkin) || !validDate(checkout) || checkin < today || checkout <= checkin || (Date.parse(checkout) - Date.parse(checkin)) / 86400000 > 30) return null;
  if (!/^\d{1,2}$/.test(String(query.adults)) || !Number.isInteger(adults) || adults < 1 || adults > 10) return null;
  if (![query.breakfast, query.onsen].every(value => value === undefined || value === '' || value === 'true' || value === 'false')) return null;
  return { place: place.trim(), checkin, checkout, adults, breakfast: query.breakfast === 'true', onsen: query.onsen === 'true', page };
}
export function stayRecommendation(offer, offers) {
  const prices = offers.map(row => row.firstNightTotal).filter(value => Number.isFinite(value) && value > 0);
  if (!Number.isFinite(offer.firstNightTotal) || offer.firstNightTotal <= 0 || !prices.length) return null;
  const pricePart = Math.min(...prices) / offer.firstNightTotal;
  const reviews = Number.isFinite(offer.reviewCount) ? Math.max(0, offer.reviewCount) : 0;
  const ratingPart = Number.isFinite(offer.rating) && offer.rating > 0 && offer.rating <= 5 ? (offer.rating / 5) * (reviews / (reviews + 20)) : 0;
  return { score: 100 * (0.6 * pricePart + 0.4 * ratingPart), pricePart, ratingPart };
}
export function sortStays(offers, order = 'rating') {
  const price = offer => offer.firstNightTotal ?? Infinity;
  const rating = offer => offer.rating ?? -1;
  if (order === 'recommended') return [...offers].sort((a,b) => (stayRecommendation(b, offers)?.score ?? -1) - (stayRecommendation(a, offers)?.score ?? -1) || price(a) - price(b) || String(a.id).localeCompare(String(b.id)));
  return [...offers].sort((a, b) => order === 'price' ? price(a) - price(b) || rating(b) - rating(a) : rating(b) - rating(a) || price(a) - price(b));
}
