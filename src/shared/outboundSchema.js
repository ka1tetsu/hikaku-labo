import { SERVICE_IDS } from '../services/catalog.js';
import { TRAVEL_PROVIDERS } from '../travel/providers.js';

// First-party, cookie-free event logger for deliberate outbound clicks.
// No IP, user agent, session IDs, search terms, destination URLs or query strings.
export const ANALYTICS_SECTIONS = Object.freeze(['products', 'tools', 'travel', 'life']);
export const TRAVEL_MERCHANTS = Object.freeze(['yahoo-travel', 'rakuten-travel', 'trip-com', 'skyscanner', 'expedia', 'booking', 'google-flights', 'google-maps', ...TRAVEL_PROVIDERS.map(p => p.id)].filter((id, i, all) => all.indexOf(id) === i));
export const STORE_MERCHANTS = Object.freeze(['rakuten', 'amazon', 'yahoo-shopping', 'au-pay', 'qoo10', 'yodobashi', 'biccamera', 'apple', 'iherb', 'mercari', 'rakuma', 'paypay-fleamarket']);
export const ANALYTICS_MERCHANTS = Object.freeze([...STORE_MERCHANTS, 'studio', 'wix', 'base', 'shopify', 'xserver-wp', 'kinsta', ...TRAVEL_MERCHANTS, ...SERVICE_IDS]);

export function validOutboundEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (body.event !== 'outbound' || !ANALYTICS_SECTIONS.includes(body.section)) return false;
  if (!ANALYTICS_MERCHANTS.includes(body.merchant)) return false;
  if (typeof body.sponsored !== 'boolean') return false;
  if (!/^[a-z0-9_-]{1,36}$/.test(body.placement || '')) return false;
  if (body.section === 'travel' && !TRAVEL_MERCHANTS.includes(body.merchant)) return false;
  if (body.section === 'products' && !STORE_MERCHANTS.includes(body.merchant)) return false;
  if (body.section === 'life' && !SERVICE_IDS.includes(body.merchant)) return false;
  if (body.section === 'tools' && !['studio', 'wix', 'base', 'shopify', 'xserver-wp', 'kinsta'].includes(body.merchant)) return false;
  return Object.keys(body).every(key => ['event','section','merchant','sponsored','placement'].includes(key));
}

// Page views (no identifiers) so outbound clicks can be turned into a click-through rate.
export const PAGE_IDS = Object.freeze({
  '/': 'home', '/compare/': 'compare', '/tools/': 'tools', '/life/': 'life', '/sim/': 'sim', '/hikari/': 'hikari',
  '/card/': 'card', '/hoken/': 'hoken', '/travel/': 'travel', '/guides/travel-budget/': 'guide-travel-budget', '/guides/website-tools/': 'guide-website-tools',
});
export function validViewEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return body.event === 'view' && [...Object.values(PAGE_IDS), 'sim-vs', 'hikari-area'].includes(body.page) && Object.keys(body).every(key => ['event', 'page'].includes(key));
}
