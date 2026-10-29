import test from 'node:test';
import assert from 'node:assert/strict';
import { validFunnelEvent, validOutboundEvent } from '../src/shared/outboundSchema.js';
import { revenueReport } from '../scripts/revenue-report.mjs';
import { readFileSync } from 'node:fs';

const timestamp='2026-10-29T04:05:00Z';
const view={type:'hikaku_view',page:'travel',timestamp};
const ready={type:'hikaku_funnel',page:'travel',action:'travel_quote_ready',timestamp};
const outbound={type:'hikaku_outbound',page:'travel',section:'travel',merchant:'trip',placement:'user-quote',sponsored:false,timestamp};

test('anonymous finished-quote event is enum-only and bound to travel page',()=>{
  assert.equal(validFunnelEvent({event:'funnel',page:'travel',action:'travel_quote_ready'}),true);
  assert.equal(validFunnelEvent({event:'funnel',page:'home',action:'travel_quote_ready'}),false);
  assert.equal(validFunnelEvent({event:'funnel',page:'travel',action:'travel_quote_ready',price:12000}),false);
  assert.equal(validOutboundEvent({event:'outbound',page:'travel',section:'travel',merchant:'trip',placement:'user-quote',sponsored:false}),true);
  assert.equal(validOutboundEvent({event:'outbound',page:'travel',section:'travel',merchant:'trip',placement:'user-quote',sponsored:false,query:'Tokyo flights'}),false);
});
test('page counts compare-ready actions and booking-site clicks without claiming earnings',()=>{
  const report=revenueReport([view,ready,outbound],{from:'2026-10-29',to:'2026-10-30'});
  const travel=report.pages.find(x=>x.page==='travel');
  assert.equal(travel.views,1);
  assert.equal(travel.travelQuotesReady,1);
  assert.equal(travel.travelQuoteBookingClicks,1);
  assert.equal(travel.sponsoredClicks,0);
  assert.equal(report.financials,null);
  assert.equal(report.nextActions.some(x=>x.action==='review_travel_quote_cta'),false);
});
test('quote has interest but no outbound; diagnostics propose CTA review not fake conversions',()=>{
  const report=revenueReport([view,ready],{from:'2026-10-29',to:'2026-10-30'});
  assert.ok(report.nextActions.some(x=>x.action==='review_travel_quote_cta'));
  assert.equal(report.pages[0].outboundClicks,0);
  assert.equal(report.financials,null);
});
test('existing page conversion counts remain independent of travel quote metrics',()=>{
  const report=revenueReport([{type:'hikaku_view',page:'home',timestamp},view,ready],{from:'2026-10-29',to:'2026-10-30'});
  const home=report.pages.find(x=>x.page==='home');
  assert.equal(home.travelQuotesReady,0);
  assert.equal(report.pages.find(x=>x.page==='travel').travelQuotesReady,1);
});
test('frontend sends no prices or search conditions with travel quote event',()=>{
  const source=readFileSync(new URL('../src/travel/TotalCostComparator.jsx',import.meta.url),'utf8');
  assert.match(source,/recordFunnelEvent\('travel_quote_ready'\)/);
  assert.match(source,/recordOutboundClick\(\{section:'travel',merchant:id,placement:'user-quote',sponsored\}\)/);
});
