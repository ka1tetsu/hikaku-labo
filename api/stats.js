// Owner-only analytics API for /admin/.
//   GET  /api/stats?days=30                      → aggregated visitors, views, clicks, conversions
//   POST /api/stats {rows:[{day,merchant,conversions,revenue}]} → save ASP report rows (overwrite per day×merchant)
//   GET|POST /api/stats?postback=<POSTBACK_KEY>&merchant=..&count=1&amount=..  → ASP conversion postback (adds up)
// Requires ADMIN_TOKEN (16+ chars) and Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN).
import { MAX_RANGE_DAYS, cleanConversionRow, conversionCommands, dayRange, isDay, jstDay, readStats, redis, safeEqual, storeConfig } from './_analytics.js';

const MAX_ROWS = 1000;

function bearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function rangeFromQuery(query, today = jstDay()) {
  if (isDay(query.from) && isDay(query.to) && query.from <= query.to) return dayRange(query.from, query.to > today ? today : query.to);
  const days = Math.min(MAX_RANGE_DAYS, Math.max(1, Number.parseInt(query.days, 10) || 30));
  const from = new Date(Date.parse(today + 'T00:00:00Z') - (days - 1) * 86400e3).toISOString().slice(0, 10);
  return dayRange(from, today);
}

async function postback(req, res, config) {
  const query = req.query || {};
  if (!safeEqual(String(query.postback || ''), process.env.POSTBACK_KEY || '')) return res.status(401).json({ error: 'unauthorized' });
  const row = cleanConversionRow({
    day: isDay(query.day) ? query.day : jstDay(),
    merchant: query.merchant,
    conversions: query.count === undefined ? 1 : Number(query.count),
    revenue: Math.round(Number(query.amount ?? query.revenue ?? 0)),
  });
  if (!row) return res.status(400).json({ error: 'invalid_conversion' });
  await redis(config, conversionCommands([row], 'add'));
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const config = storeConfig();
  if (!config) return res.status(503).json({ error: 'store_not_configured' });

  try {
    if (req.query?.postback !== undefined) return await postback(req, res, config);

    const adminToken = process.env.ADMIN_TOKEN || '';
    if (adminToken.length < 16) return res.status(503).json({ error: 'admin_not_configured' });
    if (!safeEqual(bearer(req), adminToken)) return res.status(401).json({ error: 'unauthorized' });

    if (req.method === 'GET') return res.status(200).json(await readStats(config, rangeFromQuery(req.query || {})));
    if (req.method === 'POST') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch { return res.status(400).json({ error: 'invalid_json' }); }
      const rows = Array.isArray(body?.rows) ? body.rows : null;
      if (!rows || rows.length === 0 || rows.length > MAX_ROWS) return res.status(400).json({ error: 'invalid_rows' });
      const clean = rows.map(cleanConversionRow);
      const bad = clean.findIndex(row => !row);
      if (bad >= 0) return res.status(400).json({ error: 'invalid_row', row: bad + 1 });
      await redis(config, conversionCommands(clean, 'set'));
      return res.status(200).json({ ok: true, saved: clean.length });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch {
    return res.status(502).json({ error: 'store_unavailable' });
  }
}
