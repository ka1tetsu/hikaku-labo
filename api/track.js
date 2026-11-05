// First-party, minimal structured analytics. Vercel function logs only,
// plus an optional durable NDJSON sink when TRACK_PERSIST_URL is configured
// (see api/trackSink.js and docs/VIVLICA-LAUNCH.md).
// No cookies, IP, user agent, device ID, page referrer or search keyword recorded.
import { validOutboundEvent, validViewEvent, validFunnelEvent } from '../src/shared/outboundSchema.js';
import { persistEvent } from './trackSink.js';

// The response is completed first so tracking stays fire-and-forget for the
// browser; the handler then stays alive until the sink append settles
// (bounded by the sink timeout). When the sink is unconfigured this is a
// no-op and behavior is identical to the previous log-only handler.
async function respond(res, record) {
  const pending = persistEvent(record);
  res.status(204).end();
  try { await pending; } catch { /* persistEvent never rejects; belt and braces */ }
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

  if (Buffer.byteLength(JSON.stringify(body) || '', 'utf8') > 512) return res.status(413).json({ error: 'body_too_large' });
  if (validFunnelEvent(body)) {
    const record = { type: 'hikaku_funnel', page: body.page, action: body.action, timestamp: new Date().toISOString() };
    console.info(JSON.stringify(record));
    return respond(res, record);
  }
  if (validViewEvent(body)) {
    const record = { type: 'hikaku_view', page: body.page, timestamp: new Date().toISOString() };
    console.info(JSON.stringify(record));
    return respond(res, record);
  }
  if (!validOutboundEvent(body)) return res.status(400).json({ error: 'invalid_event' });
  const record = {
    type: 'hikaku_outbound',
    section: body.section, merchant: body.merchant,
    placement: body.placement, sponsored: body.sponsored,
    ...(body.page ? { page: body.page } : {}),
    timestamp: new Date().toISOString(),
  };
  console.info(JSON.stringify(record));
  return respond(res, record);
}
