import { getServices } from './catalog.js';

const LIMITS = { free: 0, starter: 2000, standard: 5000, flexible: null };

export function rankServices({ category = 'website', budget = 'standard', priority = 'easy' } = {}) {
  if (!['website', 'shop', 'wordpress'].includes(category)) return [];
  const cap = Object.prototype.hasOwnProperty.call(LIMITS, budget) ? LIMITS[budget] : LIMITS.standard;
  const priorityNames = { easy: '簡単さ', cost: '費用', design: 'デザイン', scale: '拡張性' };
  return getServices(category).map(service => {
    let points = 55;
    const reasons = [];
    const price = service.price.monthlyMin;
    if (cap !== null && price !== null) {
      if (price <= cap) {
        points += 17;
        reasons.push('月額目安が設定予算の範囲内');
      } else {
        points -= 17;
        reasons.push('掲載月額目安は設定予算を超過');
      }
    } else if (price === null) {
      reasons.push('料金は公式サイトで確認が必要');
    }
    const trait = priority === 'cost' ? 'free' : priority;
    if (service.traits.includes(trait)) {
      points += 24;
      reasons.push(priorityNames[priority] + 'の希望に合う特徴');
    } else {
      reasons.push(priorityNames[priority] + 'を優先する場合は機能確認が必要');
    }
    if (priority === 'cost' && cap !== null && price !== null && price <= cap) points += 4;
    if (priority === 'easy' && service.traits.includes('easy')) points += 4;
    return {
      ...service,
      score: Math.max(0, Math.min(100, points)),
      reasons,
      budgetConfirmed: price !== null && (cap === null || price <= cap),
      priceRequiresReview: price === null || (cap !== null && price > cap),
    };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ja'));
}
