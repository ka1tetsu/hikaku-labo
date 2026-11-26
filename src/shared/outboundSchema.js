import { SERVICE_IDS } from '../services/catalog.js';
import { SERVICES as SECURITIES_SERVICES } from '../securities/catalog.js';
import { TRAVEL_PROVIDERS } from '../travel/providers.js';
import { AREA_PAGES, CARD_DETAIL_PAGES, HIKARI_DETAIL_PAGES, SIM_DETAIL_PAGES, SIM_PAIRS } from '../services/pages.js';

// First-party, cookie-free event logger for deliberate outbound clicks.
// No IP, user agent, session IDs, search terms, destination URLs or query strings.
export const ANALYTICS_SECTIONS = Object.freeze(['products', 'tools', 'travel', 'life', 'securities']);
export const SECURITIES_MERCHANTS = Object.freeze(SECURITIES_SERVICES.map(service => service.id));
export const TRAVEL_MERCHANTS = Object.freeze(['yahoo-travel', 'rakuten-travel', 'trip-com', 'skyscanner', 'expedia', 'booking', 'google-flights', 'google-maps', ...TRAVEL_PROVIDERS.map(p => p.id)].filter((id, i, all) => all.indexOf(id) === i));
export const STORE_MERCHANTS = Object.freeze(['rakuten', 'amazon', 'yahoo-shopping', 'au-pay', 'qoo10', 'yodobashi', 'biccamera', 'apple', 'iherb', 'mercari', 'rakuma', 'paypay-fleamarket', 'edion', 'joshin', 'nojima', 'sofmap', 'kojima', 'tsukumo', 'google']);
export const ANALYTICS_MERCHANTS = Object.freeze([...STORE_MERCHANTS, 'studio', 'wix', 'base', 'shopify', 'xserver-wp', 'kinsta', ...TRAVEL_MERCHANTS, ...SERVICE_IDS, ...SECURITIES_MERCHANTS]);

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
  if (body.section === 'securities' && !SECURITIES_MERCHANTS.includes(body.merchant)) return false;
  if (body.page !== undefined && !validPageId(body.page)) return false;
  return Object.keys(body).every(key => ['event','section','merchant','sponsored','placement','page'].includes(key));
}

// Page views (no identifiers) so outbound clicks can be turned into a click-through rate.
export const PAGE_IDS = Object.freeze({
  '/about/': 'about', '/editorial-policy/': 'editorial-policy', '/privacy/': 'privacy',
  '/': 'home', '/compare/': 'compare', '/tools/': 'tools', '/securities/': 'securities', '/life/': 'life', '/sim/': 'sim', '/hikari/': 'hikari',
  '/card/': 'card', '/hoken/': 'hoken', '/travel/': 'travel', '/guides/travel-budget/': 'guide-travel-budget', '/guides/travel-total-cost/': 'guide-travel-total-cost', '/guides/website-tools/': 'guide-website-tools',
  '/guides/hotel-cancellation/': 'guide-hotel-cancellation', '/guides/lodging-tax/': 'guide-lodging-tax', '/guides/long-weekends/': 'guide-long-weekends',
  '/guides/expressway-holiday/': 'guide-expressway-holiday',
  '/guides/sim-guide/': 'guide-sim-guide', '/guides/hikari-guide/': 'guide-hikari-guide', '/guides/card-guide/': 'guide-card-guide',
  '/guides/nisa-guide/': 'guide-nisa-guide',
  '/guides/fx-guide/': 'guide-fx-guide',
  '/guides/stock-guide/': 'guide-stock-guide',
  '/guides/hikari-single-guide/': 'guide-hikari-single-guide',
  '/guides/database-free/': 'guide-database-free',
  '/guides/shinkansen-reservation/': 'guide-shinkansen-reservation',
  '/en/': 'en', '/en/systeme-io-vs-thinkific/': 'en-systeme-io-vs-thinkific',
  ...Object.fromEntries(SIM_PAIRS.map(pair => [pair.path, 'sim-vs-' + pair.slug])),
  ...Object.fromEntries(AREA_PAGES.map(page => [page.path, 'hikari-area-' + page.area])),
  ...Object.fromEntries(SIM_DETAIL_PAGES.map(page => [page.path, 'sim-service-' + page.id])),
  ...Object.fromEntries(HIKARI_DETAIL_PAGES.map(page => [page.path, 'hikari-service-' + page.id])),
  ...Object.fromEntries(CARD_DETAIL_PAGES.map(page => [page.path, 'card-service-' + page.id])),
});
// Keep historical aggregate IDs readable; new events use registered page IDs.
const VALID_PAGE_IDS = new Set([...Object.values(PAGE_IDS), 'sim-vs', 'hikari-area']);
export function validViewEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return body.event === 'view' && validPageId(body.page) && Object.keys(body).every(key => ['event', 'page'].includes(key));
}

export function pageId(path) {
  return Object.hasOwn(PAGE_IDS, path) ? PAGE_IDS[path] : null;
}
export function validPageId(page) {
  return VALID_PAGE_IDS.has(page);
}
export const FUNNEL_ACTIONS = Object.freeze(['savings_complete', 'savings_compare', 'selector_change', 'sort_change', 'guide_compare', 'decision_bar_shown', 'travel_quote_ready', 'travel_cancellation_review', 'product_manual_ready', 'product_search', 'product_results_ready', 'product_offer_selected', 'product_target_saved']);
export function validFunnelEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (body.event !== 'funnel' || !validPageId(body.page) || !FUNNEL_ACTIONS.includes(body.action)) return false;
  if (['travel_quote_ready', 'travel_cancellation_review'].includes(body.action) && body.page !== 'travel') return false;
  if (body.action.startsWith('product_') && body.page !== 'compare') return false;
  // Only savings_complete may name the service it presented: an enumerated
  // catalog ID (the cheapest candidate; price order is unchanged). Funnel
  // events never carry amounts, answers or identifiers.
  if (body.merchant !== undefined && (body.action !== 'savings_complete' || !SERVICE_IDS.includes(body.merchant))) return false;
  return Object.keys(body).every(key => ['event', 'page', 'action', 'merchant'].includes(key));
}
