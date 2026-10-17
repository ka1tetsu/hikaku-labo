// First-party, minimal structured analytics: Vercel function logs, plus daily aggregate
// counters when Upstash Redis is connected (see api/_analytics.js and docs/ANALYTICS.md).
// No cookies; no IP, user agent, device ID, page referrer URL or search keyword is stored.
import { validOutboundEvent, validViewEvent } from '../src/shared/outboundSchema.js';
import { clickCommands, isBot, redis, storeConfig, viewCommands } from './_analytics.js';

async function store(commands) {
  const config = storeConfig();
  if (!config) return;
  try {
    await redis(config, typeof commands === 'function' ? commands(config) : commands);
  } catch {
    console.warn(JSON.stringify({ type: 'hikaku_analytics_store_failed' }));
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const origin = req.headers.origin;
  try {
    if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'invalid_origin' });
  } catch { return res.status(403).json({ error: 'invalid_origin' }); }

  if (Number(req.headers['content-length'] || 0) > 512) return res.status(413).json({ error: 'body_too_large' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch { return res.status(400).json({ error: 'invalid_json' }); }

  if (validViewEvent(body)) {
    console.info(JSON.stringify({ type: 'hikaku_view', page: body.page, src: body.src || 'unknown', timestamp: new Date().toISOString() }));
    if (!isBot(req)) await store(config => viewCommands({ page: body.page, source: body.src }, req, config));
    return res.status(204).end();
  }
  if (!validOutboundEvent(body)) return res.status(400).json({ error: 'invalid_event' });
  console.info(JSON.stringify({
    type: 'hikaku_outbound',
    section: body.section, merchant: body.merchant,
    placement: body.placement, sponsored: body.sponsored,
    timestamp: new Date().toISOString(),
  }));
  if (!isBot(req)) await store(clickCommands(body));
  return res.status(204).end();
}
