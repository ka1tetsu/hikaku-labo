import test from 'node:test';
import assert from 'node:assert/strict';
import diagnostic from '../api/diag.js';
import { providerGate } from '../server/providerGate.js';
import { getOptimizedAffiliateRoute } from '../src/optimizationEngine.js';
import { deriveProductQuery } from '../src/shared/priceCompare.js';
import { inspectReferralMarkup, auditLive } from '../scripts/audit-live.mjs';

function response() { return { code:0,body:null,headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(value){this.body=value;return this} }; }

test('public diagnostics are passive and expose presence without credential fragments', async () => {
 const previous=globalThis.fetch, key=process.env.RAKUTEN_ACCESS_KEY;
 let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('unexpected provider call')};
 process.env.RAKUTEN_ACCESS_KEY='private-fixture-never-show';
 try {
  const res=response();await diagnostic({method:'GET',query:{},headers:{}},res);
  assert.equal(res.code,200);assert.equal(res.body.mode,'passive');assert.deepEqual(res.body.probes,[]);assert.equal(calls,0);
  assert.deepEqual(res.body.config.accessKey,{set:true});
  const json=JSON.stringify(res.body);assert.ok(!json.includes('private-fixture'));assert.ok(!json.includes('head'));assert.ok(!json.includes('length'));
 } finally {globalThis.fetch=previous;if(key===undefined)delete process.env.RAKUTEN_ACCESS_KEY;else process.env.RAKUTEN_ACCESS_KEY=key}
});

test('an active diagnostic cannot consume provider quota without operator authentication', async () => {
 const old=process.env.OPERATIONS_TOKEN,previous=globalThis.fetch;
 let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('unexpected provider call')};
 try {
  delete process.env.OPERATIONS_TOKEN;
  let res=response();await diagnostic({method:'GET',query:{probe:'1'},headers:{}},res);assert.equal(res.code,503);
  process.env.OPERATIONS_TOKEN='operator-fixture';
  res=response();await diagnostic({method:'GET',query:{probe:'1'},headers:{authorization:'Bearer other-fixture'}},res);assert.equal(res.code,401);
  res=response();await diagnostic({method:'POST',query:{},headers:{}},res);assert.equal(res.code,405);
  assert.equal(calls,0);
 } finally {globalThis.fetch=previous;if(old===undefined)delete process.env.OPERATIONS_TOKEN;else process.env.OPERATIONS_TOKEN=old}
});

test('provider pause expires so an external registration repair can be detected', () => {
 let time=1000;const gate=providerGate({ttlMs:60000,now:()=>time});
 assert.equal(gate.remaining(),0);gate.reject();assert.equal(gate.remaining(),60);
 time+=59001;assert.equal(gate.remaining(),1);time+=999;assert.equal(gate.remaining(),0);
 gate.reject();gate.reset();assert.equal(gate.remaining(),0);
});

test('repeat site-registration failures stop additional warm-instance provider traffic', async () => {
 const oldKey=process.env.RAKUTEN_ACCESS_KEY,previous=globalThis.fetch;
 process.env.RAKUTEN_ACCESS_KEY='provider-test-fixture';let calls=0;
 try {
  const {fetchRakutenSearch}=await import('../api/search.js?revenue-circuit-test');
  globalThis.fetch=async()=>{calls++;return new Response('{"error":"HTTP_REFERRER_NOT_ALLOWED"}',{status:403})};
  assert.equal((await fetchRakutenSearch({keyword:'headphones',genreId:'',page:1})).status,403);
  const count=calls;const blocked=await fetchRakutenSearch({keyword:'camera',genreId:'',page:1});
  assert.equal(blocked.status,503);assert.ok(blocked.retryAfter>0&&blocked.retryAfter<=60);assert.equal(calls,count);
 } finally {globalThis.fetch=previous;if(oldKey===undefined)delete process.env.RAKUTEN_ACCESS_KEY;else process.env.RAKUTEN_ACCESS_KEY=oldKey}
});

test('product routing preserves model intent without fabricated commission estimates', () => {
 const title='【送料無料 ポイント10倍】ソニー ワイヤレスヘッドホン WH-1000XM5 ブラック';
 const query=deriveProductQuery(title);assert.match(query,/WH-1000XM5/);assert.ok(!query.includes('送料無料'));
 const routed=getOptimizedAffiliateRoute({itemName:title,itemUrl:'https://item.rakuten.co.jp/test/model/'},query,50000);
 assert.equal(routed.winnerPlatform,'rakuten');assert.match(decodeURIComponent(routed.bestUrl),/item.rakuten.co.jp\/test\/model/);
 assert.equal(routed.expectedReward,undefined);assert.equal(routed.estimatedRates,undefined);
});

test('markup audit counts referral anchors but does not follow or expose referral URL values', () => {
 const html=`<a href="https://hb.afl.rakuten.co.jp/hgc/test/?pc=private-parameter">shop</a><a href='//px.a8.net/svt/ejp?a8mat=hidden'>ad</a><a href="https://www.amazon.co.jp/s?tag=test" rel="sponsored noopener">amazon</a><a href="https://www.amazon.co.jp/">plain</a><a href="javascript:alert(1)">invalid</a>`;
 const result=inspectReferralMarkup(html);assert.equal(result.referralAnchors,3);assert.equal(result.hosts['px.a8.net'],1);
 assert.ok(!JSON.stringify(result).includes('private-parameter'));assert.ok(!JSON.stringify(result).includes('a8mat'));
});

test('live audit distinguishes a functional site from broken price providers and missing referrals', async () => {
 const requests=[];
 const fetcher=async(url,options)=>{
  requests.push({url,options});const u=new URL(url);
  if(u.pathname==='/api/track')return new Response('{"error":"invalid_event"}',{status:400});
  if(u.pathname==='/api/search')return new Response('{"error":"search_unavailable"}',{status:403});
  if(u.pathname==='/api/compare')return new Response('{"sources":{"rakuten":"error","yahoo":"disabled"},"offers":[]}',{status:200});
  if(u.pathname==='/robots.txt')return new Response('Sitemap: https://site.example/sitemap.xml');
  if(u.pathname==='/sitemap.xml')return new Response('<loc>https://site.example/guides/travel-budget/</loc>');
  return new Response('<h1>Vivlica</h1><a href="https://ordinary.example/">official</a>');
 };
 const report=await auditLive({origin:'https://site.example',fetcher});
 assert.equal(report.hardFailures,0);assert.equal(report.financials,null);
 assert.ok(report.findings.some(f=>f.code==='repair_product_search'));assert.ok(report.findings.some(f=>f.code==='no_live_price_source'));
 assert.ok(report.findings.some(f=>f.code==='review_referral_placements'&&f.path==='/tools/'));
 assert.ok(requests.every(r=>new URL(r.url).hostname==='site.example'));
 assert.equal(JSON.parse(requests.find(r=>r.options.method==='POST').options.body).event,'invalid');
});

test('live audit fails broken first-party pages rather than accepting sign-in HTML as a working app', async () => {
 const fetcher=async()=>new Response('<title>Sign in</title>',{status:200});
 const report=await auditLive({origin:'https://site.example',fetcher,includePrices:false});
 assert.ok(report.hardFailures>0);assert.ok(report.findings.some(f=>f.code==='page_unavailable'));
 await assert.rejects(auditLive({origin:'http://site.example',fetcher}));
});

test('live audit waits for the exact deployed commit before accepting an old successful page', async () => {
 const expected='b'.repeat(40);let releases=0,waits=0;
 const fetcher=async url=>{
  const u=new URL(url);
  if(u.pathname==='/release.json')return new Response(JSON.stringify({commit:++releases===1?'a'.repeat(40):expected,origin:'https://site.example'}));
  if(u.pathname==='/api/diag')return new Response('{"mode":"passive","probes":[]}');
  if(u.pathname==='/api/track')return new Response('{"error":"invalid_event"}',{status:400});
  if(u.pathname==='/robots.txt')return new Response('Sitemap: https://site.example/sitemap.xml');
  if(u.pathname==='/sitemap.xml')return new Response('<loc>https://site.example/guides/travel-budget/</loc>');
  return new Response('<h1>Vivlica</h1>');
 };
 const result=await auditLive({origin:'https://site.example',fetcher,expectedCommit:expected,includePrices:false,wait:async()=>{waits++}});
 assert.equal(result.hardFailures,0);assert.equal(releases,2);assert.equal(waits,1);
 const stale=await auditLive({origin:'https://site.example',fetcher:async()=>new Response('{}'),expectedCommit:expected,releaseAttempts:1,includePrices:false});
 assert.equal(stale.hardFailures,1);assert.equal(stale.findings[0].code,'deployment_not_current');
});
