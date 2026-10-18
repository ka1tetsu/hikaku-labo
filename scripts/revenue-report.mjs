import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { affiliateEnvKey } from '../src/shared/affiliateConfig.js';
import { SERVICE_IDS } from '../src/services/catalog.js';
import { SERVICES } from '../src/tools/catalog.js';
import { validOutboundEvent, validViewEvent, validFunnelEvent } from '../src/shared/outboundSchema.js';

// Parse raw NDJSON events or a Vercel JSON export whose message contains an event.
export function logEvents(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { /* NDJSON below */ }
  const records = Array.isArray(parsed) ? parsed : text.split(/\r?\n/).filter(line => line.trim()).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  });
  return records.map(record => {
    if (typeof record?.message === 'string') {
      try { return JSON.parse(record.message); } catch { return null; }
    }
    return record;
  });
}

export function revenueReport(events, { from, to, finance } = {}) {
  const start = from === undefined ? -Infinity : Date.parse(from);
  const end = to === undefined ? Infinity : Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) throw new Error('Use a valid time interval: from < to (end exclusive).');
  const pages = new Map(), placements = new Map(), merchants = new Map();
  let unattributedClicks = 0, ignoredRecords = 0, includedRecords = 0;
  const rowFor = page => {
    if (!pages.has(page)) pages.set(page, { page, views: 0, outboundClicks: 0, sponsoredClicks: 0, savingsCompleted: 0, savingsComparisons: 0, savingsDirectClicks: 0, selectorChanges: 0 });
    return pages.get(page);
  };
  for (const record of events) {
    const { type, timestamp, ...fields } = record || {};
    const time = Date.parse(timestamp);
    if (!Number.isFinite(time)) { ignoredRecords++; continue; }
    if (time < start || time >= end) continue;
    if (type === 'hikaku_view' && validViewEvent({ event: 'view', ...fields })) {
      rowFor(fields.page).views++;
    } else if (type === 'hikaku_outbound' && validOutboundEvent({ event: 'outbound', ...fields })) {
      if (!merchants.has(fields.merchant)) merchants.set(fields.merchant, { merchant: fields.merchant, clicks: 0, sponsoredClicks: 0, officialClicks: 0 });
      const merchant = merchants.get(fields.merchant);
      merchant.clicks++; merchant[fields.sponsored ? 'sponsoredClicks' : 'officialClicks']++;

      if (!fields.page) { unattributedClicks++; includedRecords++; continue; }
      const row = rowFor(fields.page);
      row.outboundClicks++; row.sponsoredClicks += Number(fields.sponsored);
      if (fields.placement === 'savings-result') row.savingsDirectClicks++;
      const key = [fields.page, fields.merchant, fields.placement, fields.sponsored].join(':');
      if (!placements.has(key)) placements.set(key, { page: fields.page, merchant: fields.merchant, placement: fields.placement, sponsored: fields.sponsored, clicks: 0 });
      placements.get(key).clicks++;
    } else if (type === 'hikaku_funnel' && validFunnelEvent({ event: 'funnel', ...fields })) {
      const row = rowFor(fields.page);
      row[fields.action === 'savings_complete' ? 'savingsCompleted' : fields.action === 'savings_compare' ? 'savingsComparisons' : 'selectorChanges']++;
    } else { ignoredRecords++; continue; }
    includedRecords++;
  }
  let financials = null;
  if (finance !== undefined) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || Date.parse(finance?.from) !== start || Date.parse(finance?.to) !== end) throw new Error('Finance report must match the explicit log interval (from, to).');
    const { confirmedCommission, operatingCosts } = finance;
    if (![confirmedCommission, operatingCosts].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)) throw new Error('Use nonnegative numeric confirmedCommission and operatingCosts in JPY.');
    financials = { confirmedCommission, operatingCosts, profit: confirmedCommission - operatingCosts, currency: 'JPY', source: 'owner-supplied settlement and cost totals; not independently verified' };
  }
  const configurable = new Set([...SERVICE_IDS, ...SERVICES.map(service => service.id)]);
  const nextActions = [];
  if (financials && financials.profit < 0) nextActions.push({ action: 'review_costs', operatingCosts: financials.operatingCosts, confirmedCommission: financials.confirmedCommission, message: '同期間の確定報酬を運営費が上回っています。API・集客費用の内訳を確認してください。' });
  for (const merchant of [...merchants.values()].filter(row => row.officialClicks > 0 && configurable.has(row.merchant)).sort((a, b) => b.officialClicks - a.officialClicks).slice(0, 5)) {
    nextActions.push({ action: 'review_referral_setup', merchant: merchant.merchant, officialClicks: merchant.officialClicks, variable: affiliateEnvKey(merchant.merchant), message: '通常リンクへの送客が記録されています。提携の可否と承認済み素材の設定を確認してください。報酬の取り逃し額を示すものではありません。' });
  }
  for (const row of pages.values()) if (row.savingsCompleted > 0 && row.savingsComparisons === 0 && row.savingsDirectClicks === 0) nextActions.push({ action: 'review_savings_next_step', page: row.page, completedInteractions: row.savingsCompleted, message: '診断完了はありますが、結果からの移動が記録されていません。表示と計測を確認してください。利用者単位の離脱率ではありません。' });
  return {
    interval: { from: from || null, to: to || null, endExclusive: true }, includedRecords, ignoredRecords, unattributedClicks,
    pages: [...pages.values()].map(row => ({ ...row, outboundClicksPer100Views: row.views ? Math.round(row.outboundClicks / row.views * 10000) / 100 : null })),
    placements: [...placements.values()].sort((a, b) => b.clicks - a.clicks),
    merchants: [...merchants.values()].sort((a, b) => b.clicks - a.clicks),
    nextActions,
    financials,
    notes: ['Clicks are interactions, not people or confirmed sales; clicks per 100 views may exceed 100.', 'Incomplete hosting logs, bots and repeated clicks affect these counts. Compare the same interval.', 'Legacy clicks without page attribution are kept separately. Missing views produce null, not a zero rate.', 'Without owner-supplied settlement and cost totals, profit is unknown.'],
  };
}

async function main() {
  const args = process.argv.slice(2), file = args.shift();
  if (!file || file.startsWith('--')) throw new Error('Usage: npm run report:revenue -- logs.ndjson [--from ISO --to ISO] [--finance totals.json]');
  const options = {};
  while (args.length) {
    const key = args.shift(), value = args.shift();
    if (!['--from', '--to', '--finance'].includes(key) || !value) throw new Error('Unknown or incomplete report option');
    options[key.slice(2)] = value;
  }
  if (options.finance) options.finance = JSON.parse(await readFile(options.finance, 'utf8'));
  console.log(JSON.stringify(revenueReport(logEvents(await readFile(file, 'utf8')), options), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
