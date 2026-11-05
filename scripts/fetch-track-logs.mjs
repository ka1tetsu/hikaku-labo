import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Downloads the persisted /api/track events (R1 / funnel M2) as daily NDJSON
// files named events-YYYY-MM-DD.ndjson (UTC days) below TRACK_LOG_BASE_URL,
// and concatenates them into one NDJSON file that scripts/revenue-report.mjs
// accepts unchanged:
//
//   TRACK_LOG_BASE_URL=https://<store> npm run report:fetch-logs -- --from 2026-11-01 --to 2026-11-07 --out logs.ndjson
//   npm run report:revenue -- logs.ndjson --from 2026-11-01T00:00:00Z --to 2026-11-08T00:00:00Z
//
// Days the store answers 404 for are reported as missing and skipped; any
// other failure aborts so a partial download is never mistaken for a
// complete log. Set TRACK_LOG_TOKEN when the store requires Bearer auth.

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 366;

export function parseDay(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Use ${label} as YYYY-MM-DD.`);
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value) throw new Error(`Use ${label} as a real calendar date (YYYY-MM-DD).`);
  return time;
}

// Inclusive list of UTC day strings from `from` to `to`.
export function dayRange(from, to) {
  const start = parseDay(from, '--from');
  const end = parseDay(to, '--to');
  if (end < start) throw new Error('Use a valid day range: from <= to.');
  const count = Math.round((end - start) / DAY_MS) + 1;
  if (count > MAX_DAYS) throw new Error(`Refusing to fetch more than ${MAX_DAYS} days at once.`);
  return Array.from({ length: count }, (_, i) => new Date(start + i * DAY_MS).toISOString().slice(0, 10));
}

export function dailyLogUrl(baseUrl, day) {
  return `${String(baseUrl).replace(/\/+$/, '')}/events-${day}.ndjson`;
}

export async function collectTrackLogs({ baseUrl, token, from, to, fetchImpl = fetch } = {}) {
  if (!baseUrl) throw new Error('Set TRACK_LOG_BASE_URL to the base URL that serves events-YYYY-MM-DD.ndjson files.');
  let base;
  try { base = new URL(baseUrl); } catch { throw new Error('TRACK_LOG_BASE_URL must be a valid URL.'); }
  if (base.protocol !== 'https:') throw new Error('TRACK_LOG_BASE_URL must use https.');
  const fetched = [], missing = [], chunks = [];
  for (const day of dayRange(from, to)) {
    const response = await fetchImpl(dailyLogUrl(baseUrl, day), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.status === 404) { missing.push(day); continue; }
    if (!response.ok) throw new Error(`Failed to fetch track logs for ${day}: HTTP ${response.status}.`);
    const text = await response.text();
    if (text.trim()) chunks.push(text.endsWith('\n') ? text : `${text}\n`);
    fetched.push(day);
  }
  return { ndjson: chunks.join(''), fetched, missing };
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  while (args.length) {
    const key = args.shift(), value = args.shift();
    if (!['--from', '--to', '--out'].includes(key) || !value) throw new Error('Usage: npm run report:fetch-logs -- --from YYYY-MM-DD --to YYYY-MM-DD [--out logs.ndjson]');
    options[key.slice(2)] = value;
  }
  if (!options.from || !options.to) throw new Error('Usage: npm run report:fetch-logs -- --from YYYY-MM-DD --to YYYY-MM-DD [--out logs.ndjson]');
  const { ndjson, fetched, missing } = await collectTrackLogs({
    baseUrl: process.env.TRACK_LOG_BASE_URL,
    token: process.env.TRACK_LOG_TOKEN || null,
    from: options.from,
    to: options.to,
  });
  if (missing.length) console.error(`No log file for: ${missing.join(', ')} (treated as no stored events, not as zero traffic).`);
  console.error(`Fetched ${fetched.length} day(s): ${fetched.join(', ') || 'none'}.`);
  if (options.out) {
    await writeFile(options.out, ndjson);
    console.error(`Wrote ${options.out}. Aggregate with: npm run report:revenue -- ${options.out}`);
  } else {
    process.stdout.write(ndjson);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
