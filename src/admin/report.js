// Pure helpers for the owner dashboard (tested in tests/analytics.test.mjs).

export const PAGE_LABELS = Object.freeze({
  home: 'トップ（商品比較）', compare: '全ショップ価格比較', tools: 'ITサービス診断', life: '通信・お金',
  sim: '格安SIM比較', hikari: '光回線比較', card: 'クレジットカード比較', hoken: '保険の見直し',
  travel: '比較ラボトラベル', 'sim-vs': '格安SIM 2社比較ページ', 'hikari-area': '地域別 光回線ページ',
  'guide-travel-budget': 'ガイド：旅行予算', 'guide-website-tools': 'ガイド：Web制作ツール',
});

export const SOURCE_LABELS = Object.freeze({
  direct: '直接・ブックマーク', internal: 'サイト内の移動', google: 'Google検索', yahoo: 'Yahoo!検索', bing: 'Bing検索',
  'search-other': 'その他の検索', x: 'X（Twitter）', instagram: 'Instagram', facebook: 'Facebook', line: 'LINE',
  youtube: 'YouTube', tiktok: 'TikTok', 'social-other': 'その他のSNS', referral: 'ほかのサイトのリンク', unknown: '不明',
});

export const SECTION_LABELS = Object.freeze({ products: '商品', tools: 'IT', travel: '旅行', life: '通信・お金' });

export const rate = (part, whole) => (whole > 0 ? (part / whole) * 100 : null);
export const formatRate = value => (value === null ? '—' : value.toFixed(value < 10 ? 1 : 0) + '%');
export const formatYen = n => '¥' + Math.round(n).toLocaleString('ja-JP');
export const formatCount = n => Math.round(n).toLocaleString('ja-JP');

// Accepts pasted CSV or spreadsheet rows: 日付, ショップ/ASP案件名, 件数, 報酬額（円）.
// Header lines and blank lines are skipped. "2026/10/01" and "¥1,200" are accepted.
export function parseConversionCsv(text) {
  const rows = [];
  const errors = [];
  String(text || '').split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const cells = splitLine(line);
    const day = normalizeDay(cells[0]);
    if (!day) {
      if (rows.length === 0 && errors.length === 0) return; // header
      errors.push(index + 1);
      return;
    }
    const conversions = toInt(cells[2]);
    const revenue = cells[3] === undefined || cells[3].trim() === '' ? 0 : toInt(cells[3]);
    const merchant = (cells[1] || '').trim();
    if (!merchant || conversions === null || revenue === null) { errors.push(index + 1); return; }
    rows.push({ day, merchant, conversions, revenue });
  });
  return { rows, errors };
}

function splitLine(line) {
  const sep = line.includes('\t') ? '\t' : ',';
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (ch === sep && !quoted) { cells.push(cell); cell = ''; } else cell += ch;
  }
  cells.push(cell);
  return cells.map(c => c.trim());
}

function normalizeDay(value) {
  const m = String(value || '').normalize('NFKC').trim().match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?/);
  if (!m) return null;
  const day = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return Number.isNaN(Date.parse(day + 'T00:00:00Z')) ? null : day;
}

function toInt(value) {
  const text = String(value ?? '').normalize('NFKC').replace(/[¥円,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  return Math.round(Number(text));
}

export function dailyCsv(daily) {
  const head = '日付,訪問者数,ページビュー,外部リンククリック,成果件数,報酬額';
  return [head, ...daily.map(d => [d.day, d.visitors, d.views, d.clicks, d.conversions, d.revenue].join(','))].join('\n') + '\n';
}
