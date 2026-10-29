import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { runHandler } from '../cloudflare/adapter.js';
import worker from '../cloudflare/worker.js';
import redirect from '../cloudflare/redirect.js';

const request = (path, options) => new Request('https://vivlica.com' + path, options);

test('Worker dispatches every existing API and never serves HTML for unknown API paths', async () => {
  const env = { ASSETS: { fetch: async () => new Response('<h1>site</h1>') } };
  assert.equal(await (await worker.fetch(request('/sim/'), env)).text(), '<h1>site</h1>');
  for (const path of ['/api', '/api/unknown', '/api/search/']) {
    const res = await worker.fetch(request(path), env);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'not_found' });
  }
  const diagnostic = await worker.fetch(request('/api/diag'), env);
  assert.equal(diagnostic.status, 200);
  assert.deepEqual((await diagnostic.json()).probes, []);
  for (const [path, status] of [['/api/search', 400], ['/api/compare', 400], ['/api/flight-prices', 400], ['/api/article', 503]]) assert.equal((await worker.fetch(request(path), env)).status, status, path);
});

test('tracking keeps method, origin, payload, status and privacy protections in Workers', async () => {
  const original = console.info, logs = [];
  console.info = message => logs.push(JSON.parse(message));
  const event = { event: 'view', page: 'guide-hotel-cancellation' };
  const send = (body, origin = 'https://vivlica.com') => worker.fetch(request('/api/track', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), {});
  try {
    const res = await send(event);
    assert.equal(res.status, 204);
    assert.equal(await res.text(), '');
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual(Object.keys(logs[0]).sort(), ['page', 'timestamp', 'type']);
    assert.equal((await send(event, 'https://other.example')).status, 403);
    assert.equal((await send({ ...event, email: 'private@example.com' })).status, 400);
    assert.equal((await send({ event: 'invalid' })).status, 400);
    assert.equal((await worker.fetch(request('/api/track'), {})).status, 405);
    assert.equal(logs.length, 1);
  } finally { console.info = original; }
});

test('adapter bounds streamed UTF-8 bodies without trusting Content-Length', async () => {
  let called = false, cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('あ'.repeat(200))); },
    cancel() { cancelled = true; },
  });
  const res = await runHandler(() => { called = true; }, request('/api/track', { method: 'POST', body: stream, duplex: 'half' }), { bodyLimit: 512 });
  assert.equal(res.status, 413);
  assert.equal(called, false);
  assert.equal(cancelled, true);
});

test('duplicate query parameters remain arrays so existing validators reject ambiguous input', async () => {
  assert.equal((await worker.fetch(request('/api/search?keyword=one&keyword=two'), {})).status, 400);
  const res = await runHandler((req, res) => res.status(200).json({ keyword: req.query.keyword, host: req.headers.host }), request('/?keyword=one&keyword=two'));
  assert.deepEqual(await res.json(), { keyword: ['one', 'two'], host: 'vivlica.com' });
});

test('www redirect preserves paths and search parameters, without creating an open redirect', () => {
  const res = redirect.fetch(new Request('http://www.vivlica.com/sim/?usage=10&next=https%3A%2F%2Fother.example'));
  assert.equal(res.status, 308);
  assert.equal(res.headers.get('location'), 'https://vivlica.com/sim/?usage=10&next=https%3A%2F%2Fother.example');
  assert.equal(redirect.fetch(new Request('https://other.example/path')).status, 404);
});

test('Worker runs real product handlers against a mocked provider, preserving referral and cache responses', () => {
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const worker = (await import('./cloudflare/worker.js')).default;
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({Items:[{Item:{itemName:'WH-1000XM5',itemPrice:40000,itemUrl:'https://item.rakuten.co.jp/test/product/'}}]})); };
    const req = path => new Request('https://vivlica.com' + path);
    let response = await worker.fetch(req('/api/search?keyword=WH-1000XM5'), {});
    assert.equal(response.status,200);
    assert.equal((await response.json()).Items.length,1);
    assert.match(response.headers.get('cache-control'),/s-maxage=300/);
    response = await worker.fetch(req('/api/compare?jan=4548736132580'), {});
    const data = await response.json();
    assert.equal(response.status,200);
    assert.equal(data.sources.rakuten,'ok');
    assert.equal(data.offers[0].sponsored,true);
    assert.equal(calls,2);
  `], { cwd: new URL('../', import.meta.url), env: { ...process.env, RAKUTEN_ACCESS_KEY: 'test-only-fixture', YAHOO_SHOPPING_CLIENT_ID: '' }, encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr);
});
