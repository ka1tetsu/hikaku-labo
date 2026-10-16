// Read-only setup audit. Never confuse click capability with earned commissions.
import { APPROVED_AFFILIATE_LINKS } from '../src/tools/affiliate.js';
import { A8_AD_PLACEMENTS } from '../src/tools/a8Placements.js';
import { SERVICES } from '../src/tools/catalog.js';
import { YAHOO_TRAVEL_A8_CREATIVES, travelAffiliateEnabled } from '../src/travel/a8TravelAds.js';

const IDs = new Set(SERVICES.map(item => item.id));
const validDirect = Object.entries(APPROVED_AFFILIATE_LINKS).filter(([id,url]) => IDs.has(id) && typeof url === 'string' && url.startsWith('https://'));
const a8 = Object.entries(A8_AD_PLACEMENTS).filter(([id,html]) => IDs.has(id) && typeof html === 'string' && html.trim().length > 0);
const missing = SERVICES.filter(item => !validDirect.some(([id]) => id === item.id) && !a8.some(([id]) => id === item.id)).map(x => x.name);
console.log('=== Affiliate configuration audit ===');
console.log(JSON.stringify({
  serviceCount: SERVICES.length,
  directReferralLinkCount: validDirect.length,
  a8VerbatimAdCodeCount: a8.length,
  servicesWithoutMonetizedPlacements: missing,
  yahooTravelCreativesSaved: Object.keys(YAHOO_TRAVEL_A8_CREATIVES).length,
  yahooTravelProductionAdPermission: 'not confirmed; requires registered A8.net site, advertiser approval, and Vercel production build flags',
  yahooTravelAdsEnabledByDefault: travelAffiliateEnabled({}),
  actualConversions: 'unknown; requires A8.net and advertiser settlement reports',
  actualRevenue: 'unknown; requires A8.net and advertiser settlement reports',
}, null, 2));
if (validDirect.length + a8.length === 0) {
  console.log('NOT MONETIZED: tool comparison has no configured referral or A8.net ad placements.');
  if (process.argv.includes('--require-placements')) process.exitCode = 2;
}
if (process.argv.includes('--require-placements') && missing.length > 0) {
  console.log('WARNING: Some service cards have no configured monetized placement.');
}
