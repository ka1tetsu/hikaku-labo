import test from 'node:test';
import assert from 'node:assert/strict';
import { affiliateBundle, affiliateCandidate } from '../src/shared/affiliateConfig.js';
import { serviceLink } from '../src/services/affiliate.js';
import { outboundLink } from '../src/tools/affiliate.js';
import { revenueReport } from '../scripts/revenue-report.mjs';
import { searchResponse } from '../src/shared/searchRequest.js';
import { upstreamResponse } from '../server/upstream.js';

const service = { id: 'iijmio', officialUrl: 'https://www.iijmio.jp/' };
const referral = 'https://px.a8.net/svt/ejp?a8mat=TEST';

test('one bundle configures approved referrals for communication and IT without changing defaults', () => {
  const env = { VITE_AFFILIATE_LINKS: JSON.stringify({ iijmio: referral, 'xserver-wp': referral }) };
  assert.equal(serviceLink(service, env).sponsored, true);
  assert.equal(outboundLink({ id: 'xserver-wp', officialUrl: 'https://www.xserver.ne.jp/' }, env).sponsored, true);
  assert.deepEqual(serviceLink(service, {}), { url: service.officialUrl, sponsored: false });
  assert.equal(affiliateCandidate('iijmio', { ...env, VITE_AFF_URL_IIJMIO: 'https://evil.example/' }), 'https://evil.example/');
  assert.equal(serviceLink(service, { ...env, VITE_AFF_URL_IIJMIO: 'https://evil.example/' }).sponsored, false);
  assert.equal(serviceLink(service, { ...env, VITE_AFF_URL_IIJMIO: '' }).sponsored, true);
});

test('bundle rejects broken, unknown and oversized settings; unsafe URLs stay official', () => {
  for (const raw of ['[1]', 'null', '{bad}', '{"unknown-service":"https://example.com"}', '{"__proto__":"x"}', '{"iijmio":42}', 'x'.repeat(32769)]) {
    assert.equal(affiliateBundle(raw).error, 'invalid_bundle');
    assert.equal(serviceLink(service, { VITE_AFFILIATE_LINKS: raw }).sponsored, false);
  }
  for (const url of ['javascript:alert(1)', 'https://user:pass@px.a8.net/x', 'http://px.a8.net/x', 'https://px.a8.net.evil.example/']) assert.equal(serviceLink(service, { VITE_AFFILIATE_LINKS: JSON.stringify({ iijmio: url }) }).sponsored, false);
});

test('action report separates direct-result traffic, legacy attribution and eligible referral setup', () => {
  const timestamp = '2026-10-18T12:00:00Z';
  const click = (merchant, page, placement) => ({type:'hikaku_outbound',section:merchant==='yodobashi'?'products':'life',merchant,placement,sponsored:false,timestamp,...(page?{page}:{})});
  const events = [
    { type: 'hikaku_funnel', page: 'home', action: 'savings_complete', timestamp },
    click('iijmio','home','savings-result'), click('iijmio',null,'sim-rank'), click('yodobashi','compare','compare-store'),
    { type: 'hikaku_funnel', page: 'life', action: 'savings_complete', timestamp },
  ];
  const result = revenueReport(events);
  assert.equal(result.merchants.find(row=>row.merchant==='iijmio').officialClicks,2);
  assert.equal(result.pages.find(row=>row.page==='home').savingsDirectClicks,1);
  assert.equal(result.nextActions.some(row=>row.action==='review_savings_next_step'&&row.page==='home'),false);
  assert.equal(result.nextActions.some(row=>row.action==='review_savings_next_step'&&row.page==='life'),true);
  assert.equal(result.nextActions.find(row=>row.action==='review_referral_setup').merchant,'iijmio');
  assert.equal(result.nextActions.some(row=>row.merchant==='yodobashi'),false);
  assert.equal(result.financials,null);
});

test('report flags negative settled profit using supplied costs, without inferring revenue from clicks', () => {
  const from='2026-10-01T00:00:00Z',to='2026-11-01T00:00:00Z';
  const result=revenueReport([],{from,to,finance:{from,to,confirmedCommission:500,operatingCosts:1000}});
  assert.equal(result.nextActions[0].action,'review_costs');
  assert.equal(result.financials.profit,-500);
});

test('search cancellation propagates and timeout includes reading the response body', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url,{signal}) => {
      signal.throwIfAborted();
      return { text: () => new Promise((_resolve,reject) => signal.addEventListener('abort',()=>reject(signal.reason),{once:true})) };
    };
    await assert.rejects(searchResponse('/api/search', {timeoutMs:10}), {name:'TimeoutError'});
    const controller=new AbortController();controller.abort();
    await assert.rejects(searchResponse('/api/search',{signal:controller.signal}),{name:'AbortError'});
    const keepAlive=setInterval(()=>{},100);
    try {await assert.rejects(upstreamResponse('https://provider.example/',{timeoutMs:10}),{name:'TimeoutError'})}
    finally {clearInterval(keepAlive)}
    globalThis.fetch=async()=>new Response('{"ok":true}',{status:200,headers:{'content-type':'application/json'}});
    assert.deepEqual(await (await searchResponse('/api/search')).json(),{ok:true});
  } finally {globalThis.fetch=original}
});

test('Rakuten retries only affiliate rejection and does not double provider outages or rate limits', async () => {
  const originalFetch=globalThis.fetch, originalKey=process.env.RAKUTEN_ACCESS_KEY;
  process.env.RAKUTEN_ACCESS_KEY='mock-only-not-a-provider-credential';
  try {
    const { fetchRakutenSearch }=await import('../api/search.js?profit-retry-test');
    const opts={keyword:'headphones',genreId:'',page:1};
    let requests=[];
    globalThis.fetch=async url=>{requests.push(url);return new Response('{"error":"rate_limit"}',{status:429})};
    assert.equal((await fetchRakutenSearch(opts)).status,429);assert.equal(requests.length,1);
    requests=[];
    globalThis.fetch=async url=>{requests.push(url);return new Response('{"error":"upstream_unavailable"}',{status:503})};
    assert.equal((await fetchRakutenSearch(opts)).status,503);assert.equal(requests.length,1);
    requests=[];
    globalThis.fetch=async url=>{requests.push(url);return requests.length===1?new Response('{"error":"affiliateId HTTP_REFERRER_NOT_ALLOWED"}',{status:403}):new Response('{"Items":[]}',{status:200})};
    const result=await fetchRakutenSearch(opts);
    assert.equal(result.ok,true);assert.equal(result.affiliateState,'off');assert.equal(requests.length,2);
    assert.equal(new URL(requests[0]).searchParams.has('affiliateId'),true);
    assert.equal(new URL(requests[1]).searchParams.has('affiliateId'),false);
  } finally {
    globalThis.fetch=originalFetch;
    if(originalKey===undefined)delete process.env.RAKUTEN_ACCESS_KEY;else process.env.RAKUTEN_ACCESS_KEY=originalKey;
  }
});
