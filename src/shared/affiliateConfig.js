import { SERVICE_IDS } from '../services/catalog.js';
import { SERVICES } from '../tools/catalog.js';
import { PUBLIC_AFFILIATE_LINKS } from './publicAffiliateLinks.js';

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

export function affiliateCandidate(id, env = {}, committed = PUBLIC_AFFILIATE_LINKS) {
  const individual = env[affiliateEnvKey(id)];
  // An explicit invalid URL must fail closed, rather than activating an older URL.
  if (typeof individual === 'string' && individual.trim()) return individual;
  const { links, error } = affiliateBundle(env.VITE_AFFILIATE_LINKS);
  if (error) return undefined;
  if (Object.hasOwn(links, id)) return links[id];
  // Committed public links are the last fallback, so a reviewed PR can activate them.
  if (KNOWN_IDS.has(id) && committed && Object.hasOwn(committed, id) && typeof committed[id] === 'string') return committed[id];
  return undefined;
}
