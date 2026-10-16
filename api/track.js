// ファーストパーティの集計用イベント。個人情報・URLクエリ・IPを記録しません。
// 現状はVercelの関数ログ出力のみで、永続的な分析DBやダッシュボードはありません。
import { SERVICES } from '../src/tools/catalog.js';

const validServiceIds = new Set(SERVICES.map(item => item.id));

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const origin = req.headers.origin;
  try {
    if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'invalid_origin' });
  } catch {
    return res.status(403).json({ error: 'invalid_origin' });
  }

  if (Number(req.headers['content-length'] || 0) > 512) return res.status(413).json({ error: 'body_too_large' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json' });
  }
  if (!body || body.event !== 'outbound' || !validServiceIds.has(body.serviceId) || typeof body.sponsored !== 'boolean') {
    return res.status(400).json({ error: 'invalid_event' });
  }
  console.info(JSON.stringify({
    type: 'tools_outbound',
    serviceId: body.serviceId,
    sponsored: body.sponsored,
    timestamp: new Date().toISOString(),
  }));
  return res.status(204).end();
}