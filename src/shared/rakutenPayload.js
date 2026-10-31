// Rakuten's 2026-07-01 API returns lower-case "items" with
// "item" wrappers by default; formatVersion=2 returns plain items.
// Legacy proxies used capitalized "Items"/"Item". Read both safely.
export function rakutenPayload(input) {
  const body = typeof input === 'string' ? JSON.parse(input) : input;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid_rakuten_payload');
  const entries = Array.isArray(body.items) ? body.items
    : Array.isArray(body.Items) ? body.Items : null;
  if (!entries) throw new Error('invalid_rakuten_items');
  const items = entries.map(row => row?.item ?? row?.Item ?? row)
    .filter(row => row && typeof row === 'object' && !Array.isArray(row));
  if (items.length !== entries.length) throw new Error('invalid_rakuten_item');
  return { items, pageCount: Number.isInteger(body.pageCount) ? body.pageCount : 1,
    count: Number.isInteger(body.count) ? body.count : items.length };
}
