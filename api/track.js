// First-party, minimal structured analytics. Vercel function logs only.
// No cookies, IP, user agent, device ID, page referrer or search keyword recorded.
import { validOutboundEvent, validViewEvent, validFunnelEvent } from '../src/shared/outboundSchema.js';

export default function handler(req, res) {
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
    console.info(JSON.stringify({ type: 'hikaku_funnel', page: body.page, action: body.action, timestamp: new Date().toISOString() }));
    return res.status(204).end();
  }
  if (validViewEvent(body)) {
    console.info(JSON.stringify({ type: 'hikaku_view', page: body.page, timestamp: new Date().toISOString() }));
    return res.status(204).end();
  }
  if (!validOutboundEvent(body)) return res.status(400).json({ error: 'invalid_event' });
  console.info(JSON.stringify({
    type: 'hikaku_outbound',
    section: body.section, merchant: body.merchant,
    placement: body.placement, sponsored: body.sponsored,
    ...(body.page ? { page: body.page } : {}),
    timestamp: new Date().toISOString(),
  }));
  return res.status(204).end();
}
