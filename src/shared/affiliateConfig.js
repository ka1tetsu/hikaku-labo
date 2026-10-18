import { SERVICE_IDS } from '../services/catalog.js';
import { SERVICES } from '../tools/catalog.js';

const KNOWN_IDS = new Set([...SERVICE_IDS, ...SERVICES.map(service => service.id)]);

// Public ASP-issued URLs only. A single setting replaces dozens of separate
// inputs; it never changes the catalog or ranking. Do not put API keys here.
export function affiliateBundle(raw) {
  if (raw === undefined || raw === '') return { links: {}, error: null };
  if (typeof raw !== 'string' || raw.length > 32768) return { links: {}, error: 'invalid_bundle' };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).some(id => !KNOWN_IDS.has(id) || typeof parsed[id] !== 'string')) return { links: {}, error: 'invalid_bundle' };
    return { links: parsed, error: null };
  } catch { return { links: {}, error: 'invalid_bundle' }; }
}

export const affiliateEnvKey = id => 'VITE_AFF_URL_' + id.toUpperCase().replace(/[^A-Z0-9]/g, '_');

export function affiliateCandidate(id, env = {}) {
  const individual = env[affiliateEnvKey(id)];
  // An explicit invalid URL must fail closed, rather than activating an older URL.
  if (typeof individual === 'string' && individual.trim()) return individual;
  const { links } = affiliateBundle(env.VITE_AFFILIATE_LINKS);
  return Object.hasOwn(links, id) ? links[id] : undefined;
}
