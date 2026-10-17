// Aggregate-only analytics store on Upstash Redis (Vercel Marketplace "Upstash for Redis").
// Only daily counters are kept. Visitors are counted with a HyperLogLog of a hash that is
// salted per day, so no IP address, user agent or visitor ID is ever written to storage.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const PREFIX = 'hk:';
const TTL_SECONDS = 60 * 60 * 24 * 400;
export const MAX_RANGE_DAYS = 120;
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|curl|wget|python|node-fetch/i;

export function storeConfig(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ''), token, salt: env.ANALYTICS_SALT || token } : null;
}

export async function redis(config, commands, fetchImpl = fetch) {
  const response = await fetchImpl(config.url + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + config.token, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!response.ok) throw new Error('store_http_' + response.status);
  const results = await response.json();
  return results.map(item => {
    if (item?.error) throw new Error('store_error');
    return item?.result;
  });
}

// Calendar day in Japan time, which is how ASP reports are grouped.
export function jstDay(date = new Date()) {
  return new Date(date.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
}
export function dayRange(from, to) {
  const days = [];
  for (let t = Date.parse(from + 'T00:00:00Z'); t <= Date.parse(to + 'T00:00:00Z') && days.length < MAX_RANGE_DAYS; t += 86400e3) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}
export const isDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z'));

export function isBot(req) {
  const ua = req.headers['user-agent'] || '';
  return !ua || BOT_UA.test(ua);
}

// Same browser on the same day → same hash; the salt changes daily so days cannot be linked.
export function visitorHash(req, day, salt) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  const ua = req.headers['user-agent'] || '';
  const daySalt = createHmac('sha256', salt).update(day).digest();
  return createHmac('sha256', daySalt).update(ip + '|' + ua).digest('base64url').slice(0, 22);
}

const key = (day, name) => `${PREFIX}${day}:${name}`;
// Counter hashes are tiny and kept indefinitely; only the visitor sketches (up to 12 KB each) expire.
// Each page view costs 6 Redis commands and each click 2, which matters on the free tier.
const withExpiry = (commands, keys) => [...commands, ...[...new Set(keys)].map(k => ['EXPIRE', k, TTL_SECONDS])];

export function viewCommands({ page, source }, req, config, day = jstDay()) {
  const visitor = visitorHash(req, day, config.salt);
  const keys = [key(day, 'views'), key(day, 'src'), key(day, 'uv'), key(day, 'uv:' + page)];
  return withExpiry([
    ['HINCRBY', keys[0], page, 1],
    ['HINCRBY', keys[1], source || 'unknown', 1],
    ['PFADD', keys[2], visitor],
    ['PFADD', keys[3], visitor],
  ], keys.slice(2));
}

export function clickCommands({ section, merchant, placement, sponsored }, day = jstDay()) {
  return [
    ['HINCRBY', key(day, 'clicks'), `${section}|${merchant}|${sponsored ? 'pr' : 'free'}`, 1],
    ['HINCRBY', key(day, 'placements'), `${section}|${placement}`, 1],
  ];
}

// Imported/manual rows overwrite (re-importing a report never double counts);
// postbacks from an ASP add up in separate hashes.
export function conversionCommands(rows, mode = 'set') {
  const commands = [];
  for (const row of rows) {
    const conv = key(row.day, mode === 'set' ? 'conv' : 'conv-pb');
    const rev = key(row.day, mode === 'set' ? 'rev' : 'rev-pb');
    if (mode === 'set') {
      commands.push(['HSET', conv, row.merchant, row.conversions], ['HSET', rev, row.merchant, row.revenue]);
    } else {
      commands.push(['HINCRBY', conv, row.merchant, row.conversions], ['HINCRBY', rev, row.merchant, row.revenue]);
    }
  }
  return commands;
}

export function cleanLabel(value) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text && text.length <= 40 && !/[\p{Cc}|]/u.test(text) ? text : null;
}
export function cleanConversionRow(row) {
  if (!row || typeof row !== 'object') return null;
  const merchant = cleanLabel(row.merchant);
  const conversions = Number(row.conversions);
  const revenue = Number(row.revenue ?? 0);
  if (!isDay(row.day) || !merchant) return null;
  if (!Number.isInteger(conversions) || conversions < 0 || conversions > 100000) return null;
  if (!Number.isInteger(revenue) || revenue < 0 || revenue > 100000000) return null;
  return { day: row.day, merchant, conversions, revenue };
}

const PAGES_FOR_UV = ['home', 'compare', 'tools', 'life', 'sim', 'hikari', 'card', 'hoken', 'travel', 'sim-vs', 'hikari-area', 'guide-travel-budget', 'guide-website-tools'];
const toMap = flat => {
  const map = {};
  if (Array.isArray(flat)) for (let i = 0; i < flat.length; i += 2) map[flat[i]] = Number(flat[i + 1]) || 0;
  else if (flat && typeof flat === 'object') for (const [k, v] of Object.entries(flat)) map[k] = Number(v) || 0;
  return map;
};
const sum = map => Object.values(map).reduce((a, b) => a + b, 0);
const addInto = (target, map) => { for (const [k, v] of Object.entries(map)) target[k] = (target[k] || 0) + v; };

export async function readStats(config, days, fetchImpl = fetch) {
  const HASHES = ['views', 'src', 'clicks', 'placements', 'conv', 'rev', 'conv-pb', 'rev-pb'];
  const commands = [];
  for (const day of days) {
    for (const name of HASHES) commands.push(['HGETALL', key(day, name)]);
    commands.push(['PFCOUNT', key(day, 'uv')]);
  }
  commands.push(['PFCOUNT', ...days.map(day => key(day, 'uv'))]);
  for (const page of PAGES_FOR_UV) commands.push(['PFCOUNT', ...days.map(day => key(day, 'uv:' + page))]);
  const results = await redis(config, commands, fetchImpl);

  const per = HASHES.length + 1;
  const all = Object.fromEntries(HASHES.map(name => [name, {}]));
  const daily = days.map((day, i) => {
    const maps = Object.fromEntries(HASHES.map((name, j) => [name, toMap(results[i * per + j])]));
    for (const name of HASHES) addInto(all[name], maps[name]);
    return {
      day,
      visitors: Number(results[i * per + HASHES.length]) || 0,
      views: sum(maps.views),
      clicks: sum(maps.clicks),
      conversions: sum(maps.conv) + sum(maps['conv-pb']),
      revenue: sum(maps.rev) + sum(maps['rev-pb']),
    };
  });
  const tail = results.slice(days.length * per);
  const uniqueVisitors = Number(tail[0]) || 0;
  const pageVisitors = Object.fromEntries(PAGES_FOR_UV.map((page, i) => [page, Number(tail[i + 1]) || 0]));

  const merchants = {};
  const merchant = (name, section = '') => (merchants[name] ||= { merchant: name, section, clicks: 0, sponsoredClicks: 0, conversions: 0, revenue: 0 });
  for (const [field, count] of Object.entries(all.clicks)) {
    const [section, name, kind] = field.split('|');
    const row = merchant(name, section);
    row.section ||= section;
    row.clicks += count;
    if (kind === 'pr') row.sponsoredClicks += count;
  }
  for (const [name, n] of Object.entries(all.conv)) merchant(name).conversions += n;
  for (const [name, n] of Object.entries(all['conv-pb'])) merchant(name).conversions += n;
  for (const [name, n] of Object.entries(all.rev)) merchant(name).revenue += n;
  for (const [name, n] of Object.entries(all['rev-pb'])) merchant(name).revenue += n;

  const byCount = (a, b) => b[1] - a[1];
  return {
    range: { from: days[0], to: days[days.length - 1], days: days.length },
    totals: {
      visitors: uniqueVisitors,
      views: sum(all.views),
      clicks: sum(all.clicks),
      conversions: sum(all.conv) + sum(all['conv-pb']),
      revenue: sum(all.rev) + sum(all['rev-pb']),
    },
    daily,
    pages: Object.entries(all.views).sort(byCount).map(([page, views]) => ({ page, views, visitors: pageVisitors[page] || 0 })),
    sources: Object.entries(all.src).sort(byCount).map(([source, views]) => ({ source, views })),
    merchants: Object.values(merchants).sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks),
    placements: Object.entries(all.placements).sort(byCount).map(([field, clicks]) => {
      const [section, placement] = field.split('|');
      return { section, placement, clicks };
    }),
  };
}

export function safeEqual(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || expected.length < 16) return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
