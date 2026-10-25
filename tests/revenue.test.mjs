import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { savingsEstimate } from '../src/services/savings.js';
import { selectorAnswers } from '../src/services/selectorState.js';
import { pageId, validFunnelEvent, validOutboundEvent } from '../src/shared/outboundSchema.js';
import { revenueReport, logEvents } from '../scripts/revenue-report.mjs';
import { siteOrigin } from '../src/shared/site.js';
import { outboundLink } from '../src/tools/affiliate.js';
import { travelAffiliateEnabled } from '../src/travel/a8TravelAds.js';
import track from '../api/track.js';

const timestamp = '2026-10-18T03:00:00Z';

test('savings includes family lines and total one-time costs, preserving losses', () => {
  const result = savingsEstimate({ current: 6000, lines: 2, usage: '10', switchingCost: 6000 });
  assert.equal(result.target, 1390);
  assert.equal(result.monthly, 9220);
  assert.equal(result.firstYear, 104640);
  assert.equal(result.paybackMonths, 1);
  assert.match(result.comparisonUrl, /usage=10&support=online&calls=few#selector/);
  const loss = savingsEstimate({ current: 500, usage: '10' });
  assert.equal(loss.firstYear, -10680);
  assert.equal(loss.paybackMonths, null);
  assert.equal(savingsEstimate({ current: 1390 }).firstYear, 0);
});

test('savings never recommends a plan lacking required data or store support', () => {
  const result = savingsEstimate({ current: '6000', usage: '30', support: 'store' });
  assert.ok(result.service.store);
  assert.ok(result.plan.gb >= 30);
  assert.ok(savingsEstimate({ current: 6000, usage: 'unlimited' }).plan.gb >= 100);
  for (const options of [{current:''}, {current:Infinity}, {current:-1}, {current:3.5}, {current:1000001}, {current:null}, {current:6000,lines:0}, {current:6000,lines:7}, {current:6000,usage:'bad'}, {current:6000,switchingCost:-1}]) assert.equal(savingsEstimate(options),null);
});

test('comparison handoff validates each parameter against the selector enums', () => {
  const questions = [{id:'usage',options:[['3','3GB'],['10','10GB']]},{id:'support',options:[['online','online'],['store','store']]}];
  assert.deepEqual(selectorAnswers(questions,'sim','?usage=10&support=store'), {usage:'10',support:'store'});
  assert.deepEqual(selectorAnswers(questions,'sim','?usage=<script>&support=other'), {usage:'3',support:'online'});
});

test('page attribution and funnel schema reject identifiers and financial inputs', () => {
  assert.equal(pageId('/compare/'),'compare');
  assert.equal(pageId('/hikari/area/kansai/'),'hikari-area-kansai');
  assert.equal(pageId('/private/'),null);
  const event = {event:'funnel',page:'home',action:'savings_complete'};
  assert.equal(validFunnelEvent(event),true);
  for(const extra of [{monthly:6000},{email:'person@example.com'},{query:'private'},{action:'anything'}]) assert.equal(validFunnelEvent({...event,...extra}),false);
  assert.equal(validOutboundEvent({event:'outbound',section:'life',merchant:'iijmio',placement:'sim-rank',sponsored:false,page:'sim'}),true);
  assert.equal(validOutboundEvent({event:'outbound',section:'life',merchant:'iijmio',placement:'sim-rank',sponsored:false,page:'/sim/?secret=1'}),false);
});

test('revenue report keeps legacy clicks, placement attribution and missing views distinct', () => {
  const event={type:'hikaku_outbound',section:'life',merchant:'iijmio',placement:'sim-rank',sponsored:true,timestamp};
  const result = revenueReport([
    {type:'hikaku_view',page:'sim',timestamp},
    {...event,page:'sim'}, {...event,page:'sim'}, event,
    {...event,page:'hikari'},
    {type:'hikaku_funnel',page:'home',action:'savings_complete',timestamp},
    {type:'hikaku_view',page:'sim',timestamp:'2025-01-01T00:00:00Z'},
    {type:'hikaku_view',page:'sim',timestamp:'2026-10-19T00:00:00Z'},
    {type:'hikaku_view',page:'sim',timestamp:'bad'},
    {type:'hikaku_view',page:'sim',timestamp,keyword:'private'},
  ],{from:'2026-10-18T00:00:00Z',to:'2026-10-19T00:00:00Z'});
  assert.equal(result.pages.find(row=>row.page==='sim').outboundClicksPer100Views,200);
  assert.equal(result.pages.find(row=>row.page==='hikari').outboundClicksPer100Views,null);
  assert.equal(result.pages.find(row=>row.page==='home').savingsCompleted,1);
  assert.equal(result.unattributedClicks,1);
  assert.equal(result.ignoredRecords,2);
  assert.equal(result.financials,null);
  assert.equal(result.placements[0].clicks,2);
});

test('profits require settlement and cost totals for the same explicit interval', () => {
  const options={from:'2026-10-01T00:00:00Z',to:'2026-11-01T00:00:00Z'};
  const finance={...options,confirmedCommission:10000,operatingCosts:3000};
  assert.equal(revenueReport([],{...options,finance}).financials.profit,7000);
  assert.throws(()=>revenueReport([],{finance}));
  assert.throws(()=>revenueReport([],{...options,finance:{...finance,operatingCosts:'3000'}}));
  assert.throws(()=>revenueReport([],{...options,finance:{...finance,from:'2026-09-01T00:00:00Z'}}));
  assert.throws(()=>revenueReport([],{from:'bad'}));
});

test('report accepts Vercel message exports and raw NDJSON without treating malformed lines as events', () => {
  const event={type:'hikaku_view',page:'sim',timestamp};
  assert.deepEqual(logEvents(JSON.stringify([{message:JSON.stringify(event)}])),[event]);
  assert.deepEqual(logEvents(JSON.stringify(event)+'\nnot-json\n'),[event,null]);
});

test('IT tools use the same configurable approved referral links and official fallback', () => {
  const service={id:'xserver-wp',officialUrl:'https://www.xserver.ne.jp/'};
  assert.equal(outboundLink(service,{VITE_AFF_URL_XSERVER_WP:'https://px.a8.net/svt/ejp?a8mat=TEST'}).sponsored,true);
  assert.deepEqual(outboundLink(service,{VITE_AFF_URL_XSERVER_WP:'javascript:alert(1)'}),{url:service.officialUrl,sponsored:false});
});

test('domain migration is host-scoped and cannot loop on Vivlica or redirect API paths locally', () => {
  const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
  assert.equal(config.outputDirectory,'dist');
  for(const rule of config.redirects) {
    assert.ok(rule.has.some(condition=>condition.type==='host'&&condition.value!=='vivlica.com'));
    assert.equal(rule.destination,'https://vivlica.com/:path*');
    assert.equal(rule.permanent,true);
  }
  assert.equal(siteOrigin('https://vivlica.com/'),'https://vivlica.com');
  for(const value of ['http://vivlica.com','https://vivlica.com/path','https://user:pass@vivlica.com','https://vivlica.com?q=x']) assert.throws(()=>siteOrigin(value));
  assert.equal(travelAffiliateEnabled({VITE_A8_TRAVEL_REGISTERED_ORIGIN:'https://vivlica.com/'}),true);
  assert.equal(travelAffiliateEnabled({VITE_A8_TRAVEL_REGISTERED_ORIGIN:'https://vivlica.com',VITE_A8_TRAVEL_DISABLED:'true'}),false);
  assert.equal(travelAffiliateEnabled({VITE_A8_TRAVEL_REGISTERED_ORIGIN:'https://vivlica.com/path'}),false);
});

test('tracking endpoint records only enum milestones and enforces actual body size', () => {
  const original=console.info,events=[];console.info=line=>events.push(JSON.parse(line));
  const request=body=>{let status;const res={setHeader(){},status(s){status=s;return this},json(){return this},end(){return this}};track({method:'POST',headers:{host:'vivlica.com',origin:'https://vivlica.com'},body},res);return status};
  try {
    assert.equal(request({event:'funnel',page:'home',action:'savings_complete'}),204);
    assert.deepEqual(Object.keys(events[0]).sort(),['type','timestamp','page','action'].sort());
    assert.equal(request({event:'funnel',page:'home',action:'savings_complete',current:6000}),400);
    assert.equal(request({payload:'x'.repeat(513)}),413);
  } finally {console.info=original}
});

test('paid AI stays disabled without both settings and rejects unauthenticated calls before spending', async () => {
  const { paidAiAccess }=await import('../server/paidAiAccess.js');
  const savedKey=process.env.OPENAI_API_KEY, savedToken=process.env.AI_GENERATION_TOKEN;
  const originalFetch=globalThis.fetch;
  let calls=0;globalThis.fetch=async()=>{calls++;throw new Error('must not call paid provider')};
  const response=()=>({code:0,setHeader(){},status(code){this.code=code;return this},json(){return this}});
  try {
    delete process.env.AI_GENERATION_TOKEN;process.env.OPENAI_API_KEY='test-only-placeholder';
    let res=response();assert.equal(paidAiAccess({method:'GET',headers:{}},res,'GET'),false);assert.equal(res.code,503);
    process.env.AI_GENERATION_TOKEN='local-test-only-placeholder';
    const article=(await import('../api/article.js')).default;
    const summary=(await import('../api/reviewSummary.js')).default;
    res=response();await article({method:'GET',headers:{},query:{}},res);assert.equal(res.code,401);
    res=response();await summary({method:'POST',headers:{}},res);assert.equal(res.code,401);
    res=response();await summary({method:'POST',headers:{authorization:'Bearer local-test-only-placeholder'},body:{reviews:['x'.repeat(1001)]}},res);assert.equal(res.code,400);
    res=response();await article({method:'GET',headers:{authorization:'Bearer local-test-only-placeholder'},query:{categoryId:'bad'}},res);assert.equal(res.code,400);
    assert.equal(calls,0);
  } finally {
    globalThis.fetch=originalFetch;
    if(savedKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=savedKey;
    if(savedToken===undefined)delete process.env.AI_GENERATION_TOKEN;else process.env.AI_GENERATION_TOKEN=savedToken;
  }
});
