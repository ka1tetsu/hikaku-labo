import { ANALYTICS_MERCHANTS } from '../src/shared/outboundSchema.js';

// Operator-only settlement input. Never join anonymous site clicks to orders or
// use commission to change consumer rankings. Missing attribution stays unknown.
export function merchantFinancials(finance) {
  if (finance?.merchants === undefined) return null;
  if (!Array.isArray(finance.merchants)) throw new Error('Finance merchants must be an array.');
  const seen = new Set();
  const money = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const count = n => Number.isSafeInteger(n) && n >= 0;
  const allowed = new Set(['merchant', 'confirmedCommission', 'directCosts', 'aspClicks', 'confirmedOrders']);
  const merchants = finance.merchants.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row) || Object.keys(row).some(key => !allowed.has(key)) || !ANALYTICS_MERCHANTS.includes(row.merchant) || seen.has(row.merchant)) throw new Error('Use unique known merchant IDs and aggregate settlement fields only.');
    seen.add(row.merchant);
    if (!money(row.confirmedCommission) || !money(row.directCosts)) throw new Error('Merchant commission and direct costs must be nonnegative JPY numbers.');
    for (const key of ['aspClicks', 'confirmedOrders']) if (row[key] !== undefined && !count(row[key])) throw new Error('ASP counts must be nonnegative safe integers.');
    return {
      merchant: row.merchant,
      confirmedCommission: row.confirmedCommission,
      directCosts: row.directCosts,
      contribution: row.confirmedCommission - row.directCosts,
      aspClicks: row.aspClicks ?? null,
      confirmedOrders: row.confirmedOrders ?? null,
      // This is a period ratio, not cohort EPC or evidence of future ad returns.
      periodCommissionPerAspClick: row.aspClicks > 0 ? row.confirmedCommission / row.aspClicks : null,
    };
  });
  const commission = merchants.reduce((sum, row) => sum + row.confirmedCommission, 0);
  const costs = merchants.reduce((sum, row) => sum + row.directCosts, 0);
  if (!Number.isFinite(commission) || !Number.isFinite(costs) || commission > finance.confirmedCommission + 1e-6 || costs > finance.operatingCosts + 1e-6) throw new Error('Merchant totals must not exceed site settlement and operating cost totals.');
  return {
    merchants: merchants.sort((a, b) => b.contribution - a.contribution || a.merchant.localeCompare(b.merchant)),
    unallocatedCommission: Math.max(0, finance.confirmedCommission - commission),
    sharedOrUnallocatedCosts: Math.max(0, finance.operatingCosts - costs),
    notes: [
      'Owner-supplied aggregates for the report interval, not independently verified; direct costs must already be included in site operatingCosts.',
      'Contribution excludes shared costs and is not merchant net profit. Unlisted merchants are unknown, not zero.',
      'ASP clicks differ from site interactions. Settlement can relate to earlier clicks; the period ratio is not cohort EPC, conversion rate or a safe advertising bid.',
    ],
  };
}
