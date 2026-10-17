// Transparent fit scoring for 通信・お金 comparisons. Affiliate status never affects scores.
import { CARD_SERVICES, HIKARI_SERVICES, SIM_SERVICES } from './catalog.js';

const NEED_GB = { 3: 3, 10: 10, 30: 30, unlimited: 100 };

// Cheapest listed plan that covers the monthly data need (null when no listed plan covers it).
export function simPlanFor(service, need) {
  const gb = NEED_GB[need] ?? 10;
  const fits = service.plans.filter(plan => plan.gb >= gb).sort((a, b) => a.price - b.price);
  return fits[0] || null;
}

export function rankSim({ usage = '10', calls = 'few', support = 'online', carrier = 'none' } = {}) {
  const rows = SIM_SERVICES.map(service => {
    const plan = simPlanFor(service, usage);
    const reasons = [], cautions = [...service.cautions];
    let points = 50;
    if (plan) reasons.push(`${plan.label || plan.gb + 'GB'}：月額 ${plan.price.toLocaleString('ja-JP')}円`);
    else { points -= 30; cautions.unshift('この利用量に合う掲載プランなし（公式で確認）'); }
    if (calls !== 'few') {
      const included = service.calls === 'app' || (calls === '5min' && /5min|10min/.test(service.calls || '')) || (calls === 'unlimited' && service.calls === 'app');
      if (included) { points += 12; reasons.push(service.calls === 'app' ? 'アプリ通話で国内通話無料' : '通話定額つきのプランあり'); }
      else cautions.push('通話定額はオプション（料金は公式で確認）');
    }
    if (support === 'store') {
      if (service.store) { points += 15; reasons.push('店舗で相談できる'); } else points -= 20;
    }
    if (carrier !== 'none' && service.homeBundle?.includes(carrier)) { points += 10; reasons.push('自宅の光回線とのセット割対象'); }
    return { service, plan, monthly: plan?.price ?? null, points, reasons, cautions };
  });
  const prices = rows.filter(r => r.monthly !== null).map(r => r.monthly);
  const min = Math.min(...prices), max = Math.max(...prices);
  for (const row of rows) if (row.monthly !== null) row.points += Math.round(30 * (max - row.monthly) / Math.max(1, max - min));
  return finalize(rows);
}

export function rankHikari({ housing = 'house', carrier = 'none', area = 'kanto' } = {}) {
  const rows = HIKARI_SERVICES.map(service => {
    const reasons = [], cautions = [...service.cautions];
    const available = service.areas === 'all' || service.areas.includes(area);
    let points = 50;
    if (!available) { points -= 60; cautions.unshift('選んだエリアでは提供されていない可能性が高い'); }
    if (carrier !== 'none' && service.bundle.includes(carrier)) { points += 30; reasons.push('スマホとのセット割の対象'); }
    const monthly = service[housing] ?? null;
    if (monthly) reasons.push(`${housing === 'house' ? '戸建て' : 'マンション'}の月額目安 ${monthly.toLocaleString('ja-JP')}円`);
    else reasons.push('月額は住所・建物で異なるため公式で確認');
    if (service.areas !== 'all' && available) { points += 5; reasons.push('エリア限定の独自回線'); }
    return { service, monthly, points, reasons, cautions, available };
  });
  const prices = rows.filter(r => r.monthly).map(r => r.monthly);
  const min = Math.min(...prices), max = Math.max(...prices);
  for (const row of rows) if (row.monthly) row.points += Math.round(15 * (max - row.monthly) / Math.max(1, max - min));
  return finalize(rows);
}

export function rankCards({ ecosystem = 'none', age = 'u39', priority = 'rate' } = {}) {
  const rows = CARD_SERVICES.map(service => {
    const reasons = [`基本還元率 ${service.rate.toFixed(1)}%`, `年会費 ${service.fee}`], cautions = [...service.cautions];
    let points = 40 + Math.round(service.rate * 20);
    if (service.maxAge && age === 'o40') { points -= 80; cautions.unshift(`申込は${service.maxAge}歳以下が対象`); }
    if (ecosystem !== 'none' && service.ecosystem === ecosystem) { points += 30; reasons.push('よく使うポイント経済圏と一致'); }
    if (priority === 'conveni' && service.conveni) { points += 30; reasons.push('対象のコンビニ・飲食店で高還元'); }
    if (priority === 'simple' && service.rate >= 1.2) { points += 10; reasons.push('どこで使っても還元率が高め'); }
    return { service, monthly: null, points, reasons, cautions };
  });
  return finalize(rows);
}

function finalize(rows) {
  return rows.map(row => ({ ...row, score: Math.max(0, Math.min(100, row.points)) }))
    .sort((a, b) => b.score - a.score || (a.monthly ?? Infinity) - (b.monthly ?? Infinity) || a.service.name.localeCompare(b.service.name, 'ja'));
}
