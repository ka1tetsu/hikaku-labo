// Passive by default: a crawler or page reload must not spend provider quota.
// Active provider checks are optional operator actions and never return key
// prefixes, raw provider bodies, item URLs or request URLs containing secrets.
import { createHash, timingSafeEqual } from 'node:crypto';
import { detectPlatform } from '../server/rakutenCredentials.js';
import { fetchRakutenSearch } from './search.js';
import { rakutenPayload } from '../src/shared/rakutenPayload.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Allow', 'GET');
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
    const applicationId = process.env.RAKUTEN_APP_ID || '4c29f89d-b874-4910-a38b-1d8e0314c2a3';
    const accessKey = process.env.RAKUTEN_ACCESS_KEY || '';
    const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || '432a9f67.243910f6.432a9f68.e28a199a';
    const detected = detectPlatform(applicationId, accessKey);
    const config = {
        applicationId: { set: Boolean(applicationId) },
        accessKey: { set: Boolean(accessKey) },
        affiliateId: { set: Boolean(affiliateId) },
    };
    if (req.query?.probe !== '1') return res.status(200).json({ config, configurationValid: detected.ok, probes: [], mode: 'passive' });
    const expected = process.env.OPERATIONS_TOKEN;
    if (!expected) return res.status(503).json({ error: 'operator_probe_disabled' });
    const header = req.headers?.authorization || '';
    const digest = value => createHash('sha256').update(value).digest();
    if (typeof header !== 'string' || !header.startsWith('Bearer ') || !timingSafeEqual(digest(header.slice(7)), digest(expected))) return res.status(401).json({ error: 'unauthorized' });
    if (!detected.ok) return res.status(200).json({ config, configurationValid: false, probes: [], reason: 'configuration_invalid' });
    const result = await fetchRakutenSearch({ keyword: 'イヤホン', genreId: '', page: 1 });
    let count = 0, affiliateReturned = false;
    if (result.ok) {
        try {
            const items = rakutenPayload(result.text).items;
            count = items.length;
            affiliateReturned = items.some(entry => Boolean(entry.affiliateUrl));
        } catch { /* malformed provider response is not exposed */ }
    }
    const reason = result.ok ? null
      : /HTTP_REFERRER_NOT_ALLOWED/i.test(result.text) ? 'site_registration_rejected'
      : result.status === 401 || result.status === 403 ? 'authentication_or_permission_rejected'
      : result.status === 429 ? 'rate_limit'
      : result.text === 'invalid_provider_format' ? 'response_format_unsupported'
      : 'provider_rejected';
    return res.status(200).json({ config, configurationValid: true, probes: [{ ok: result.ok, httpStatus: result.status, itemCount: count, affiliateUrlReturned: affiliateReturned, reason }] });
}
