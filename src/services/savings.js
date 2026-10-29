import { rankSim } from './score.js';

const validCost = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1000000 && Number.isInteger(n) ? n : null;
};

// Device installments and optional calls are excluded on both sides. Do not
// monetize a ranking by biasing it toward a service with an advertising contract.
export function savingsEstimate({ current, lines = 1, usage = '10', support = 'online', switchingCost = 0 } = {}) {
  const monthly = validCost(current);
  const initial = validCost(switchingCost);
  const count = Number(lines);
  if (monthly === null || initial === null || !Number.isInteger(count) || count < 1 || count > 6 || !['3','10','30','unlimited'].includes(usage) || !['online','store'].includes(support)) return null;
  const candidates = rankSim({ usage, support, calls: 'few' }).filter(row => row.plan && (support !== 'store' || row.service.store));
  const best = candidates.sort((a, b) => a.monthly - b.monthly)[0];
  if (!best) return null;
  const difference = monthly - best.monthly;
  const householdMonthly = difference * count;
  return {
    service: best.service, plan: best.plan, target: best.monthly, lines: count,
    monthly: householdMonthly, firstYear: householdMonthly * 12 - initial,
    switchingCost: initial,
    paybackMonths: householdMonthly > 0 ? Math.ceil(initial / householdMonthly) : null,
    comparisonUrl: '/sim/?' + new URLSearchParams({ usage, support, calls: 'few' }) + '#selector',
  };
}
