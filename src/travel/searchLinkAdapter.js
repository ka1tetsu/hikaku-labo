import { ORIGINS, buildFlightLinks } from './bookingLinks.js';
import { providerTarget } from './providers.js';

// Prefer search URLs that the site already knows how to construct for the same
// date / route / party. No speculative airport or date defaults: otherwise show
// the provider's official homepage rather than silently searching wrong dates.
const PROVIDER_MAP = Object.freeze({
  trip: 'trip-com', skyscanner: 'skyscanner', 'expedia-flights': 'expedia',
  expedia: 'expedia', 'google-flights': 'google-flights',
});

export function relevantGlobalFlightLinks({
  originCode, destination, departureDate, returnDate, nights = 2,
  travelers = 1, config = {},
} = {}) {
  if (!ORIGINS.some(row => row.code === originCode)) return [];
  if (!destination || !/^[A-Z]{3}$/.test(destination.iata || '')) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate || '')) return [];
  const start = new Date(departureDate + 'T00:00:00Z');
  if (Number.isNaN(start.valueOf()) || start.toISOString().slice(0, 10) !== departureDate) return [];
  if (returnDate && (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate) || returnDate <= departureDate)) return [];
  if (originCode === destination.iata) return [];
  return buildFlightLinks({
    originCode,
    destination: {
      ...destination,
      area: destination.international ? 'overseas' : 'domestic',
      flight: { city: destination.iata, airport: destination.iata },
    },
    depart: departureDate, ret: returnDate || undefined, nights,
    adults: travelers, oneWay: Number(nights) === 0,
    config,
  });
}

export function globalProviderTarget(provider, criteria = {}) {
  // Plain homepages remain the safe fallback if the route, origin or date
  // cannot be represented correctly by an existing supported deeplink.
  if (provider.type === 'flight') {
    const links = relevantGlobalFlightLinks(criteria);
    const merchant = PROVIDER_MAP[provider.id];
    const found = merchant && links.find(row => row.merchant === merchant);
    if (found) return {
      url: found.href, sponsored: found.sponsored,
      note: found.note + '。出発地・目的地・出発日の条件を引継ぎ（他の条件は予約先で再確認）',
      carriesSearch: true,
      transferredFields: ['出発地','目的地','搭乗日','人数'],
    };
  }
  const result = providerTarget(provider, { stayLinks: criteria.stayLinks || [] });
  const selected = provider.type === 'hotel' && criteria.stayLinks?.find(row => row.merchant === provider.id && row.href === result.url);
  return { ...result, carriesSearch: Boolean(selected), transferredFields: selected ? (provider.id === 'rakuten-travel' ? ['目的地'] : ['目的地','宿泊日','人数','部屋数']) : [] };
}
