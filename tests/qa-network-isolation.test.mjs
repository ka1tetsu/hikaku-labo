import test from 'node:test';
import assert from 'node:assert/strict';
import { qaRequestKind, isolateQaNetwork } from '../scripts/qa-network-isolation.mjs';
const origin='https://vivlica.com';
test('QA excludes actual affiliate assets, tracking pixels and referrals with host boundaries',()=>{
 for(const url of ['https://www21.a8.net/svt/bgt?aid=example','https://www13.a8.net/0.gif','https://px.a8.net/svt/ejp','https://hb.afl.rakuten.co.jp/hgc/example/'])assert.equal(qaRequestKind(url,origin),'affiliate');
 assert.equal(qaRequestKind(origin+'/api/track',origin),'analytics');
 for(const url of [origin+'/api/stays?place=example',origin+'/assets/travel.js','https://www.booking.com/','https://a8.net.example.org/','https://example.org/api/track'])assert.equal(qaRequestKind(url,origin),null);
});
test('QA fulfills ad images locally and never forwards tracking or referral requests',async()=>{
 let handler,forwarded=0;const completed=[],blocked=[];
 await isolateQaNetwork({route:async(_,fn)=>{handler=fn;}},{origin,onBlocked:kind=>blocked.push(kind)});
 const run=(url,type)=>handler({request:()=>({url:()=>url,resourceType:()=>type}),continue:()=>forwarded++,fulfill:value=>completed.push(value)});
 await run('https://www21.a8.net/svt/bgt','image');
 await run('https://px.a8.net/svt/ejp','document');
 await run(origin+'/api/track','fetch');
 await run(origin+'/api/stays','fetch');
 assert.equal(forwarded,1);assert.deepEqual(blocked,['affiliate','affiliate','analytics']);
 assert.equal(completed[0].contentType,'image/svg+xml');assert.match(completed[0].body,/検証用/);
 assert.equal(completed[1].status,204);assert.equal(completed[2].status,204);
});
