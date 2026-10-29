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
export function sortStays(offers, order = 'rating') {
  const price = offer => offer.firstNightTotal ?? Infinity;
  const rating = offer => offer.rating ?? -1;
  return [...offers].sort((a, b) => order === 'price' ? price(a) - price(b) || rating(b) - rating(a) : rating(b) - rating(a) || price(a) - price(b));
}
