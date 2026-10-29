import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyReleaseChecks,inspectReleaseChecks} from '../scripts/recovery-preflight.mjs';
const sha='a'.repeat(40), other='b'.repeat(40);
const names=['Tools selector CI','Impeccable sitewide design gate','Vivlica real-browser design QA'];
const run=(name,conclusion='success',props={})=>({name,head_sha:sha,event:'push',status:'completed',conclusion,id:10,...props});
test('all three source checks must pass on exact main SHA',()=>{
  const list=names.map(n=>run(n));
  assert.equal(classifyReleaseChecks(list,sha).ok,true);
  assert.equal(classifyReleaseChecks(list,other).ok,false);
  assert.equal(classifyReleaseChecks(list.slice(1),sha).ok,false);
  assert.equal(classifyReleaseChecks([...list,run('Production and affiliate readiness audit','failure')],sha).ok,true);
});
test('PR successes or tests on old SHA cannot authorize a production retry',()=>{
  const list=names.map(n=>run(n));
  assert.equal(classifyReleaseChecks(list.map(x=>({...x,event:'pull_request'})),sha).ok,false);
  assert.equal(classifyReleaseChecks(list.map(x=>({...x,head_sha:other})),sha).ok,false);
  assert.equal(classifyReleaseChecks([...list.slice(1),run(names[0],'failure')],sha).ok,false);
  assert.equal(classifyReleaseChecks([...list.slice(1),run(names[0],'success',{status:'in_progress'})],sha).ok,false);
});
test('API requires exact repo, SHA, read token; unavailable checks fail closed',async()=>{
  const denied=await inspectReleaseChecks(sha,{repository:'ka1tetsu/hikaku-labo',token:'test',fetcher:async()=>({ok:false,status:403})});
  assert.equal(denied.ok,false);
  assert.equal(denied.reason,'github_api_error');
  const success=await inspectReleaseChecks(sha,{repository:'ka1tetsu/hikaku-labo',token:'test',fetcher:async(url,options)=>{
    assert.match(url,/head_sha=aaaaaaaa/);
    assert.equal(options.redirect,'error');
    return {ok:true,json:async()=>({workflow_runs:names.map(n=>run(n))})};
  }});
  assert.equal(success.ok,true);
  assert.equal((await inspectReleaseChecks(sha,{repository:'ka1tetsu/hikaku-labo',token:''})).ok,false);
});
