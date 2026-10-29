import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRelease, inspectRelease, ORIGIN } from '../scripts/release-recovery.mjs';
const sha = 'a'.repeat(40), old = 'b'.repeat(40);
const release = commit => JSON.stringify({ schemaVersion: 1, commit, origin: ORIGIN });
test('only exact production SHA is considered successfully published', () => {
  assert.equal(classifyRelease({status:200,body:release(sha),expectedCommit:sha}).state,'current');
  assert.deepEqual(classifyRelease({status:200,body:release(old),expectedCommit:sha}).state,'stale');
});
test('wrong origin, invalid JSON and missing metadata are unknown, never publish triggers', () => {
  for (const body of ['{}','not json',JSON.stringify({schemaVersion:1,commit:old,origin:'https://evil.example'}),JSON.stringify({schemaVersion:0,commit:old,origin:ORIGIN})]) {
    assert.equal(classifyRelease({status:200,body,expectedCommit:sha}).state,'unknown');
  }
  assert.equal(classifyRelease({status:404,body:'',expectedCommit:sha}).state,'unknown');
  assert.equal(classifyRelease({status:200,body:release(old),expectedCommit:'bad'}).state,'unknown');
});
test('inspector never follows redirects and returns unknown on connectivity failure', async () => {
  const result = await inspectRelease(sha,{fetcher:async(url,opts)=>{
    assert.match(url,/\/release\.json\?verify=/);
    assert.equal(opts.redirect,'error');
    return new Response(release(old),{status:200});
  }});
  assert.equal(result.state,'stale');
  assert.equal((await inspectRelease(sha,{fetcher:async()=>{throw Error('offline')}})).state,'unknown');
});
