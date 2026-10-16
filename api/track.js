// ファーストパーティの集計用イベント。個人情報・URLクエリ・IPを記録しません。
// 現状はVercelの関数ログ出力のみで、永続的な分析DBやダッシュボードはありません。
// Vercel の Logs で "type":"outbound" を検索すると、ページ・枠・送客先ごとのクリック数を数えられます。
import { SERVICES } from '../src/tools/catalog.js';

const validServiceIds = new Set(SERVICES.map(item => item.id));

// 受け付ける値は許可リストに限定し、任意の文字列がログに混入しないようにする
const SECTIONS = new Set(['products', 'travel', 'tools']);
const TARGETS = new Set(['rakuten', 'amazon', 'yahoo', 'rakuten-travel', 'a8-yahoo-travel', 'yahoo-travel']);
const PLACEMENT_RE = /^[a-z0-9-]{1,32}$/;

export function parseTrackEvent(body) {
  if (!body || body.event !== 'outbound' || typeof body.sponsored !== 'boolean') return null;

  // 旧形式: ITツール診断（serviceId）
  if (body.serviceId !== undefined) {
    if (!validServiceIds.has(body.serviceId)) return null;
    return { type: 'tools_outbound', serviceId: body.serviceId, sponsored: body.sponsored };
  }

  if (!SECTIONS.has(body.section)) return null;
  const target = body.section === 'tools' ? (validServiceIds.has(body.target) ? body.target : null) : (TARGETS.has(body.target) ? body.target : null);
  if (!target) return null;
  const placement = typeof body.placement === 'string' && PLACEMENT_RE.test(body.placement) ? body.placement : 'unknown';
  return { type: 'outbound', section: body.section, target, placement, sponsored: body.sponsored };
}

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
  const event = parseTrackEvent(body);
  if (!event) return res.status(400).json({ error: 'invalid_event' });

  console.info(JSON.stringify({ ...event, timestamp: new Date().toISOString() }));
  return res.status(204).end();
}
