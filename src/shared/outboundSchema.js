import { TRAVEL_PROVIDERS } from '../travel/providers.js';

// First-party, cookie-free event logger for deliberate outbound clicks.
// No IP, user agent, session IDs, search terms, destination URLs or query strings.
export const ANALYTICS_SECTIONS = Object.freeze(['products', 'tools', 'travel']);
export const ANALYTICS_MERCHANTS = Object.freeze(['rakuten', 'amazon', 'yahoo-shopping', 'yahoo-travel', ...TRAVEL_PROVIDERS.map(p => p.id), 'studio', 'wix', 'base', 'shopify', 'xserver-wp', 'kinsta']);

export function validOutboundEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (body.event !== 'outbound' || !ANALYTICS_SECTIONS.includes(body.section)) return false;
  if (!ANALYTICS_MERCHANTS.includes(body.merchant)) return false;
  if (typeof body.sponsored !== 'boolean') return false;
  if (!/^[a-z0-9_-]{1,36}$/.test(body.placement || '')) return false;
  if (body.section === 'travel' && body.merchant !== 'yahoo-travel' && !TRAVEL_PROVIDERS.some(p => p.id === body.merchant)) return false;
  if (body.section === 'products' && !['rakuten', 'amazon', 'yahoo-shopping'].includes(body.merchant)) return false;
  if (body.section === 'tools' && !['studio', 'wix', 'base', 'shopify', 'xserver-wp', 'kinsta'].includes(body.merchant)) return false;
  return Object.keys(body).every(key => ['event','section','merchant','sponsored','placement'].includes(key));
}
