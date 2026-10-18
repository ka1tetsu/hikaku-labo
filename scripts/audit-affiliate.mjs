// Read-only configuration inventory. Never prints link values or credentials.
import { loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { APPROVED_AFFILIATE_LINKS, outboundLink } from '../src/tools/affiliate.js';
import { A8_AD_PLACEMENTS } from '../src/tools/a8Placements.js';
import { SERVICES } from '../src/tools/catalog.js';
import { SIM_SERVICES, HIKARI_SERVICES, CARD_SERVICES, HOKEN_SERVICES } from '../src/services/catalog.js';
import { affiliateEnvKey, serviceLink } from '../src/services/affiliate.js';
import { YAHOO_TRAVEL_A8_CREATIVES, travelAffiliateEnabled } from '../src/travel/a8TravelAds.js';
import { affiliateBundle, affiliateCandidate } from '../src/shared/affiliateConfig.js';
import { SITE_ORIGIN, siteOrigin } from '../src/shared/site.js';

const cwd = fileURLToPath(new URL('../', import.meta.url));
const env = { ...loadEnv('production', cwd, 'VITE_'), ...process.env, VITE_SITE_ORIGIN: siteOrigin(process.env.SITE_ORIGIN || SITE_ORIGIN) };
const groups = { sim: SIM_SERVICES, hikari: HIKARI_SERVICES, card: CARD_SERVICES, hoken: HOKEN_SERVICES, tools: SERVICES };
const rows = Object.entries(groups).flatMap(([section, services]) => services.map(service => {
  const link = section === 'tools' ? outboundLink(service, env) : serviceLink(service, env);
  const html = section === 'tools' && typeof A8_AD_PLACEMENTS[service.id] === 'string' && Boolean(A8_AD_PLACEMENTS[service.id].trim());
  const configured = Boolean(affiliateCandidate(service.id, env) || (section === 'tools' && APPROVED_AFFILIATE_LINKS[service.id]));
  return { section, id: service.id, name: service.name, status: link.sponsored ? 'referral-configured' : html ? 'original-ad-configured' : configured ? 'invalid-link-official-fallback' : 'official-only', variable: affiliateEnvKey(service.id) };
}));
console.log(JSON.stringify({
  origin: env.VITE_SITE_ORIGIN,
  bundleStatus: affiliateBundle(env.VITE_AFFILIATE_LINKS).error || 'valid',
  services: rows,
  configuredPlacements: rows.filter(row => ['referral-configured', 'original-ad-configured'].includes(row.status)).length,
  invalidLinks: rows.filter(row => row.status === 'invalid-link-official-fallback').length,
  yahooTravelCreativesSaved: Object.keys(YAHOO_TRAVEL_A8_CREATIVES).length,
  yahooTravelAdsEnabled: travelAffiliateEnabled(env),
  yahooTravelRequirement: 'Register the current domain with A8 and confirm program conditions; then set VITE_A8_TRAVEL_REGISTERED_ORIGIN to that origin.',
  limitations: ['Configuration is not confirmation of ASP approval, account validity, conversions or revenue.', 'Existing shopping referral IDs need ownership and new-domain registration checked by the owner.'],
}, null, 2));
if (affiliateBundle(env.VITE_AFFILIATE_LINKS).error || rows.some(row => row.status === 'invalid-link-official-fallback')) process.exitCode = 2;
if (process.argv.includes('--require-placements') && !rows.some(row => ['referral-configured', 'original-ad-configured'].includes(row.status))) process.exitCode = 2;
