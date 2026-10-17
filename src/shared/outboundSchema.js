// First-party, cookie-free event logger for deliberate outbound clicks.
// No IP, user agent, session IDs, search terms, destination URLs or query strings.
export const ANALYTICS_SECTIONS = Object.freeze(['products', 'tools', 'travel']);
export const TRAVEL_MERCHANTS = Object.freeze(['yahoo-travel', 'rakuten-travel', 'trip-com', 'skyscanner', 'expedia', 'booking', 'google-flights', 'google-maps']);
export const STORE_MERCHANTS = Object.freeze(['rakuten', 'amazon', 'yahoo-shopping', 'au-pay', 'qoo10', 'yodobashi', 'biccamera', 'apple', 'iherb', 'mercari', 'rakuma', 'paypay-fleamarket']);
export const ANALYTICS_MERCHANTS = Object.freeze([...STORE_MERCHANTS, 'studio', 'wix', 'base', 'shopify', 'xserver-wp', 'kinsta', ...TRAVEL_MERCHANTS]);

export function validOutboundEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (body.event !== 'outbound' || !ANALYTICS_SECTIONS.includes(body.section)) return false;
  if (!ANALYTICS_MERCHANTS.includes(body.merchant)) return false;
  if (typeof body.sponsored !== 'boolean') return false;
  if (!/^[a-z0-9_-]{1,36}$/.test(body.placement || '')) return false;
  if (body.section === 'travel' && !TRAVEL_MERCHANTS.includes(body.merchant)) return false;
  if (body.section === 'products' && !STORE_MERCHANTS.includes(body.merchant)) return false;
  if (body.section === 'tools' && !['studio', 'wix', 'base', 'shopify', 'xserver-wp', 'kinsta'].includes(body.merchant)) return false;
  return Object.keys(body).every(key => ['event','section','merchant','sponsored','placement'].includes(key));
}
