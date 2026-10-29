export function toggleHotel(selected, id, limit = 4) {
  return selected.includes(id) ? selected.filter(value => value !== id) : selected.length < limit ? [...selected, id] : selected;
}

export function hotelQuote(total, { nights, travelers, rooms }) {
  if (typeof total !== 'string' || !/^\d{1,9}$/.test(total) || Number(total) <= 0) return null;
  if (![nights, travelers, rooms].every(value => Number.isInteger(value) && value > 0)) return null;
  const amount = Number(total);
  return { total: amount, perPerson: Math.round(amount / travelers), perRoomNight: Math.round(amount / rooms / nights) };
}
