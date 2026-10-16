import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validOutboundEvent } from '../src/shared/outboundSchema.js';
import handler from '../api/track.js';

const content = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('anonymous outbound schema accepts real placements on each page', () => {
  for (const [section, merchant, placement] of [
    ['travel','yahoo-travel','banner234'],
    ['products','rakuten','product-primary'],
    ['tools','shopify','service-card'],
  ]) {
    assert.equal(validOutboundEvent({event:'outbound',section,merchant,placement,sponsored:true}),true);
  }
});

test('event schema rejects unknown merchants, identifiers and personal data', () => {
  const base = {event:'outbound',section:'travel',merchant:'yahoo-travel',placement:'banner300',sponsored:true};
  for (const event of [
    {...base, section:'unknown'},
    {...base, placement:'this-is-an-unreasonably-long-identifier-over-36-characters'},
    {...base, merchant:'shopify'},
    {...base, sponsored:'true'},
    {...base, keyword:'secret'},
    {...base, userId:'abc'},
    {...base, placement:'../../'},
    {},
  ]) assert.equal(validOutboundEvent(event),false);
});

test('tracker endpoint enforces origin and logs no identification fields', () => {
  const originalLog=console.info;const events=[];
  console.info=event=>events.push(JSON.parse(event));
  function request(req) {
    let status=200;let payload=null;
    const res={setHeader(){},status(s){status=s;return this},json(p){payload=p;return this},end(){return this}};
    handler(req,res);
    return {status,payload};
  }
  try {
    const good={method:'POST',headers:{host:'hikaku-labo.vercel.app',origin:'https://hikaku-labo.vercel.app','content-length':'110'},body:{event:'outbound',section:'travel',merchant:'yahoo-travel',placement:'banner234',sponsored:true}};
    assert.equal(request(good).status,204);
    assert.equal(events.length,1);
    assert.deepEqual(Object.keys(events[0]).sort(), ['merchant','placement','section','sponsored','timestamp','type'].sort());
    assert.equal(request({...good,headers:{...good.headers,origin:'https://other.example'}}).status,403);
    assert.equal(request({...good,body:{...good.body,keyword:'foo'}}).status,400);
    assert.equal(request({...good,method:'GET'}).status,405);
  } finally { console.info=originalLog; }
});

test('all public guide URLs are crawlable and not disguised affiliate tracking', () => {
  const sitemap=content('public/sitemap.xml');
  const robots=content('public/robots.txt');
  assert.match(robots,/Sitemap: https:\/\/hikaku-labo\.vercel\.app\/sitemap\.xml/);
  for (const path of ['/', '/tools/', '/travel/', '/guides/travel-budget/', '/guides/website-tools/']) {
    assert.ok(sitemap.includes('https://hikaku-labo.vercel.app'+path));
  }
  const a=content('guides/travel-budget/index.html');
  const b=content('guides/website-tools/index.html');
  assert.match(a, /href="\/travel\/#planner"/);
  assert.match(b, /href="\/tools\/#selector"/);
  assert.match(content('src/App.jsx'),/buildRakutenSearchAffiliateUrl\(kw\)/);
});

test('A8 original creative HTML stays unmodified with its exact pixels', () => {
  const a8=content('src/travel/a8TravelAds.js');
  assert.match(a8,/4AZ9C4\+21TRSI\+4ZCO\+65U41/);
  assert.match(a8,/4AZ9C4\+21TRSI\+4ZCO\+65ME9/);
  assert.match(a8, /src="https:\/\/www13\.a8\.net\/0\.gif/);
});
