import { rankSim } from './score.js';

const validCost = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1000000 && Number.isInteger(n) ? n : null;
};

// Device installments and optional calls are excluded on both sides. Do not
// monetize a ranking by biasing it toward a service with an advertising contract.
// Candidates are the cheapest listed plans in price order only — affiliate
// status never affects which candidates appear or their order.
export function savingsEstimate({ current, lines = 1, usage = '10', support = 'online', switchingCost = 0 } = {}) {
  const monthly = validCost(current);
  const initial = validCost(switchingCost);
  const count = Number(lines);
  if (monthly === null || initial === null || !Number.isInteger(count) || count < 1 || count > 6 || !['3','10','30','unlimited'].includes(usage) || !['online','store'].includes(support)) return null;
  const ranked = rankSim({ usage, support, calls: 'few' })
    .filter(row => row.plan && (support !== 'store' || row.service.store))
    .sort((a, b) => a.monthly - b.monthly);
  const best = ranked[0];
  if (!best) return null;
  const toCandidate = row => {
    const difference = monthly - row.monthly;
    const householdMonthly = difference * count;
    const firstYear = householdMonthly * 12 - initial;
    return {
      service: row.service, plan: row.plan, target: row.monthly,
      monthly: householdMonthly, firstYear,
      paybackMonths: householdMonthly > 0 ? Math.ceil(initial / householdMonthly) : null,
    };
  };
  const candidates = ranked.slice(0, 3).map(toCandidate);
  const top = candidates[0];
  return {
    service: top.service, plan: top.plan, target: top.target, lines: count,
    monthly: top.monthly, firstYear: top.firstYear,
    switchingCost: initial,
    paybackMonths: top.paybackMonths,
    candidates,
    comparisonUrl: '/sim/?' + new URLSearchParams({ usage, support, calls: 'few' }) + '#selector',
  };
}
