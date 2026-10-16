import test from 'node:test';
import assert from 'node:assert/strict';
import { SERVICES, CATEGORIES } from '../src/tools/catalog.js';
import { rankServices } from '../src/tools/score.js';

test('all catalog URLs are HTTPS and prices are nonnegative or unknown', () => {
  for (const entry of SERVICES) {
    assert.match(entry.officialUrl, /^https:\/\//);
    assert.match(entry.sourceUrl, /^https:\/\//);
    assert.ok(entry.price.monthlyMin === null || entry.price.monthlyMin >= 0);
  }
});

test('every category provides multiple alternatives and all service ids are unique', () => {
  assert.equal(new Set(SERVICES.map(x => x.id)).size, SERVICES.length);
  for (const item of CATEGORIES) assert.ok(rankServices({ category: item.id }).length >= 2);
});

test('cost-sensitive free shop prioritizes BASE without implying guaranteed savings', () => {
  const result = rankServices({ category: 'shop', budget: 'free', priority: 'cost' });
  assert.equal(result[0].id, 'base');
  assert.ok(result.every(x => x.score >= 0 && x.score <= 100));
  assert.ok(result.every(x => x.reasons.length > 0));
});

test('unknown and above-budget prices are not claimed to be confirmed affordable', () => {
  const result = rankServices({ category: 'wordpress', budget: 'free' });
  assert.ok(result.every(x => x.budgetConfirmed === false));
  assert.equal(rankServices({ category: 'bad' }).length, 0);
});
