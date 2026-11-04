// Catalog freshness (K4). A service whose catalog entry carries a dated
// price-revision notice gets `priceRevisionFrom: 'YYYY-MM-DD'` in catalog.js.
// Once that date has passed (Asia/Tokyo), the listed prices / basic rate are
// no longer treated as confirmed: ranking and display fall back to the
// existing safe-side rule — the value is shown as 「公式で確認」 and the
// service stays listed. The catalog data itself is never rewritten here;
// the flag clears when the monthly check (docs/VIVLICA-LAUNCH.md
// 「料金カタログの月次確認（鮮度運用）」) verifies the new prices against
// official sources and the entry is updated.

const TOKYO_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
});

// 'YYYY-MM-DD' for a Date (read in Asia/Tokyo) or the first 10 chars of a
// date string. String comparison of this key is chronological.
export function toDateKey(now = new Date()) {
  if (typeof now === 'string') return now.slice(0, 10);
  const date = now instanceof Date ? now : new Date(now);
  const parts = {};
  for (const part of TOKYO_PARTS.formatToParts(date)) parts[part.type] = part.value;
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// True when the service has a scheduled price revision whose date has passed
// and the post-revision values have not been re-checked yet.
export function priceRecheckRequired(service, now = new Date()) {
  const from = service?.priceRevisionFrom;
  return typeof from === 'string' && toDateKey(now) >= from;
}

// Detail rows (catalog `details`) whose label names a price-like quantity a
// scheduled review can change: annual fee, basic reward rate, points earned
// on carrier billing, family-card fee. While a recheck is required, their
// values are masked to 「公式で確認」 like any other unconfirmed price.
// Non-price rows (申込条件・国際ブランド・補償など) stay as catalogued.
const PRICE_DETAIL_LABELS = ['年会費', '基本還元率', 'ドコモ料金の還元', '家族カード'];

export function detailValue(service, [label, value], now = new Date()) {
  return priceRecheckRequired(service, now) && PRICE_DETAIL_LABELS.includes(label) ? '公式で確認' : value;
}
