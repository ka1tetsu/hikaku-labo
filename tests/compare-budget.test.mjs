import test from 'node:test';
import assert from 'node:assert/strict';
import { compareBudget, comparisonInput, withinCompareBudget } from '../src/shared/compareBudget.js';

test('natural-language comparison keeps the budget through a shareable URL', () => {
  const query = comparisonInput('1万円以下のワイヤレスイヤホン');
  assert.match(query.q, /イヤホン/);
  assert.equal(query.maxPrice, 10000);
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  assert.deepEqual(compareBudget(Object.fromEntries(params)), { minPrice: 0, maxPrice: 10000 });
  assert.deepEqual(compareBudget(comparisonInput('5千円〜1万円のイヤホン')), { minPrice: 5000, maxPrice: 10000 });
  assert.deepEqual(compareBudget(comparisonInput('イヤホン')), { minPrice: 0, maxPrice: 0 });
  assert.equal(comparisonInput('4548736132580').jan, '4548736132580');
});

test('invalid URL prices cannot reach providers and budget excludes expensive items before points', () => {
  for (const value of ['-1', 'Infinity', '1e4', '100.5', '10000&x=1', '1000000000', ['100', '200']]) {
    assert.deepEqual(compareBudget({ minPrice: value, maxPrice: value }), { minPrice: 0, maxPrice: 0 });
  }
  const budget = { minPrice: 5000, maxPrice: 10000 };
  assert.equal(withinCompareBudget({ price: 10000 }, budget), true);
  assert.equal(withinCompareBudget({ price: 4999 }, budget), false);
  assert.equal(withinCompareBudget({ price: 12000, effectivePrice: 9000 }, budget), false);
});

test('comparison API passes budget to both providers and enforces it on returned offers', async () => {
  const previousFetch = globalThis.fetch;
  const names = ['RAKUTEN_ACCESS_KEY', 'YAHOO_SHOPPING_CLIENT_ID'];
  const previous = names.map(name => process.env[name]);
  for (const name of names) process.env[name] = 'test-only-budget-fixture';
  try {
    const { default: handler } = await import('../api/compare.js?budget-test');
    const requests = [];
    globalThis.fetch = async raw => {
      const url = new URL(raw);
      requests.push(url);
      const prices = [4999, 5000, 10000, 12000];
      const body = url.hostname === 'shopping.yahooapis.jp'
        ? { hits: prices.map(price => ({ name: 'イヤホン', price, url: 'https://store.shopping.yahoo.co.jp/test/' + price, point: { amount: 3000 } })) }
        : { Items: prices.map(itemPrice => ({ Item: { itemName: 'イヤホン', itemPrice, itemUrl: 'https://item.rakuten.co.jp/test/' + itemPrice, pointRate: 30 } })) };
      return new Response(JSON.stringify(body), { status: 200 });
    };
    let status, body;
    const response = { setHeader() {}, status(value) { status = value; return this; }, json(value) { body = value; return this; } };
    await handler({ method: 'GET', query: { q: 'イヤホン', minPrice: '5000', maxPrice: '10000' } }, response);
    assert.equal(status, 200);
    assert.equal(body.offers.length, 4);
    assert.ok(body.offers.every(offer => offer.price >= 5000 && offer.price <= 10000));
    assert.deepEqual(body.sources, { rakuten: 'ok', yahoo: 'ok' });
    const rakuten = requests.find(url => url.hostname === 'openapi.rakuten.co.jp');
    const yahoo = requests.find(url => url.hostname === 'shopping.yahooapis.jp');
    assert.equal(rakuten.searchParams.get('minPrice'), '5000');
    assert.equal(rakuten.searchParams.get('maxPrice'), '10000');
    assert.equal(yahoo.searchParams.get('price_from'), '5000');
    assert.equal(yahoo.searchParams.get('price_to'), '10000');
    requests.length = 0;
    await handler({ method: 'GET', query: { q: 'イヤホン', minPrice: '10000', maxPrice: '5000' } }, response);
    assert.equal(status, 400);
    assert.equal(body.error, 'invalid_price_range');
    assert.equal(requests.length, 0);
  } finally {
    globalThis.fetch = previousFetch;
    names.forEach((name, i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; });
  }
});
