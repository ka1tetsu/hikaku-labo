import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/track.js';
import { sinkConfig, persistEvent } from '../api/trackSink.js';
import { dayRange, dailyLogUrl, collectTrackLogs } from '../scripts/fetch-track-logs.mjs';
import { logEvents, revenueReport } from '../scripts/revenue-report.mjs';

const RECORD = { type: 'hikaku_view', page: 'sim', timestamp: '2026-11-02T01:00:00.000Z' };

test('sink stays disabled without a valid https TRACK_PERSIST_URL', () => {
  assert.equal(sinkConfig({}), null);
  assert.equal(sinkConfig({ TRACK_PERSIST_URL: '' }), null);
  assert.equal(sinkConfig({ TRACK_PERSIST_URL: 'not a url' }), null);
  assert.equal(sinkConfig({ TRACK_PERSIST_URL: 'http://example.com/track' }), null);
  assert.deepEqual(
    sinkConfig({ TRACK_PERSIST_URL: 'https://example.com/track', TRACK_PERSIST_TOKEN: 'secret' }),
    { url: 'https://example.com/track', token: 'secret' },
  );
  assert.deepEqual(
    sinkConfig({ TRACK_PERSIST_URL: 'https://example.com/track' }),
    { url: 'https://example.com/track', token: null },
  );
});

test('persistEvent is a no-op when unconfigured and never calls fetch', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return { ok: true }; };
  assert.equal(await persistEvent(RECORD, { env: {}, fetchImpl }), false);
  assert.equal(calls, 0);
});

test('persistEvent posts the exact log record as one NDJSON line', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => { seen.push({ url, init }); return { ok: true }; };
  const env = { TRACK_PERSIST_URL: 'https://logs.example.com/append', TRACK_PERSIST_TOKEN: 'tok' };
  assert.equal(await persistEvent(RECORD, { env, fetchImpl }), true);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, 'https://logs.example.com/append');
  assert.equal(seen[0].init.method, 'POST');
  assert.equal(seen[0].init.headers['Content-Type'], 'application/x-ndjson');
  assert.equal(seen[0].init.headers.Authorization, 'Bearer tok');
  assert.equal(seen[0].init.body, `${JSON.stringify(RECORD)}\n`);
});

test('persistEvent resolves false on rejection, non-OK and timeout instead of throwing', async () => {
  const env = { TRACK_PERSIST_URL: 'https://logs.example.com/append' };
  assert.equal(await persistEvent(RECORD, { env, fetchImpl: async () => { throw new Error('down'); } }), false);
  assert.equal(await persistEvent(RECORD, { env, fetchImpl: async () => ({ ok: false, status: 500 }) }), false);
  const hanging = (url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  });
  assert.equal(await persistEvent(RECORD, { env, fetchImpl: hanging, timeoutMs: 20 }), false);
});

function mockRes() {
  const res = { statusCode: null, setHeader() {}, status(code) { this.statusCode = code; return this; }, json() { return this; }, end() { return this; } };
  return res;
}

test('track handler persists valid events identically to the log record and stays 204 when the sink fails', async () => {
  const savedUrl = process.env.TRACK_PERSIST_URL, savedToken = process.env.TRACK_PERSIST_TOKEN;
  const savedFetch = globalThis.fetch, savedInfo = console.info;
  const logged = [], posted = [];
  console.info = line => logged.push(JSON.parse(line));
  process.env.TRACK_PERSIST_URL = 'https://logs.example.com/append';
  delete process.env.TRACK_PERSIST_TOKEN;
  const body = { event: 'outbound', section: 'travel', merchant: 'yahoo-travel', placement: 'banner234', sponsored: true };
  const req = { method: 'POST', headers: { host: 'vivlica.com', origin: 'https://vivlica.com', 'content-length': '110' }, body };
  try {
    globalThis.fetch = async (url, init) => { posted.push({ url, init }); return { ok: true }; };
    const res = mockRes();
    const pending = handler(req, res);
    // Response is completed synchronously, before the sink append settles.
    assert.equal(res.statusCode, 204);
    await pending;
    assert.equal(logged.length, 1);
    assert.equal(posted.length, 1);
    assert.deepEqual(JSON.parse(posted[0].init.body), logged[0]);
    assert.deepEqual(Object.keys(logged[0]).sort(), ['merchant', 'placement', 'section', 'sponsored', 'timestamp', 'type'].sort());
    assert.equal('Authorization' in posted[0].init.headers, false);

    // A failing sink never changes the response or the log fallback.
    globalThis.fetch = async () => { throw new Error('sink down'); };
    const res2 = mockRes();
    await handler(req, res2);
    assert.equal(res2.statusCode, 204);
    assert.equal(logged.length, 2);

    // Invalid events are rejected before any persistence happens.
    posted.length = 0;
    globalThis.fetch = async (url, init) => { posted.push({ url, init }); return { ok: true }; };
    const res3 = mockRes();
    await handler({ ...req, body: { event: 'outbound', section: 'travel', merchant: 'yahoo-travel', placement: 'banner234', sponsored: true, keyword: 'x' } }, res3);
    assert.equal(res3.statusCode, 400);
    assert.equal(posted.length, 0);
  } finally {
    console.info = savedInfo;
    globalThis.fetch = savedFetch;
    if (savedUrl === undefined) delete process.env.TRACK_PERSIST_URL; else process.env.TRACK_PERSIST_URL = savedUrl;
    if (savedToken === undefined) delete process.env.TRACK_PERSIST_TOKEN; else process.env.TRACK_PERSIST_TOKEN = savedToken;
  }
});

test('dayRange is inclusive, UTC-based and bounded', () => {
  assert.deepEqual(dayRange('2026-10-31', '2026-11-02'), ['2026-10-31', '2026-11-01', '2026-11-02']);
  assert.deepEqual(dayRange('2026-11-02', '2026-11-02'), ['2026-11-02']);
  assert.throws(() => dayRange('2026-11-02', '2026-11-01'));
  assert.throws(() => dayRange('2026-02-30', '2026-03-01'));
  assert.throws(() => dayRange('2025-01-01', '2026-01-02'));
  assert.equal(dailyLogUrl('https://logs.example.com/base/', '2026-11-02'), 'https://logs.example.com/base/events-2026-11-02.ndjson');
});

test('collectTrackLogs concatenates stored days, skips 404 days and aborts on other errors', async () => {
  const lines = `${JSON.stringify(RECORD)}\n`;
  const fetchImpl = async url => {
    if (url.endsWith('events-2026-11-01.ndjson')) return { status: 200, ok: true, text: async () => lines };
    if (url.endsWith('events-2026-11-02.ndjson')) return { status: 404, ok: false, text: async () => '' };
    return { status: 200, ok: true, text: async () => lines.trim() };
  };
  const { ndjson, fetched, missing } = await collectTrackLogs({ baseUrl: 'https://logs.example.com', from: '2026-11-01', to: '2026-11-03', fetchImpl });
  assert.deepEqual(fetched, ['2026-11-01', '2026-11-03']);
  assert.deepEqual(missing, ['2026-11-02']);
  assert.equal(ndjson, `${lines}${lines}`);
  await assert.rejects(
    collectTrackLogs({ baseUrl: 'https://logs.example.com', from: '2026-11-01', to: '2026-11-01', fetchImpl: async () => ({ status: 500, ok: false, text: async () => '' }) }),
    /HTTP 500/,
  );
  await assert.rejects(collectTrackLogs({ from: '2026-11-01', to: '2026-11-01', fetchImpl }), /TRACK_LOG_BASE_URL/);
});

test('persisted NDJSON feeds revenueReport unchanged', async () => {
  const outbound = { type: 'hikaku_outbound', section: 'life', merchant: 'rakuten-mobile', placement: 'sim-rank', sponsored: false, page: 'sim', timestamp: '2026-11-02T02:00:00.000Z' };
  const ndjson = `${JSON.stringify(RECORD)}\n${JSON.stringify(outbound)}\n`;
  const report = revenueReport(logEvents(ndjson), { from: '2026-11-01T00:00:00Z', to: '2026-11-03T00:00:00Z' });
  const sim = report.pages.find(row => row.page === 'sim');
  assert.equal(sim.views, 1);
  assert.equal(sim.outboundClicks, 1);
  assert.equal(report.includedRecords, 2);
});
