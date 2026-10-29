import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
function inspectHeaders(siteUrl){
  const program=`
    import {fetchRakutenSearch} from './api/search.js';
    let captured=null;
    globalThis.fetch=async(url,options)=>{
      captured={url:String(url),headers:options.headers};
      return {ok:true,status:200,text:async()=>JSON.stringify({Items:[]})};
    };
    const result=await fetchRakutenSearch({keyword:'イヤホン',genreId:'',page:1});
    if(!result.ok || !captured)throw new Error('Rakuten search fixture failed');
    console.log(JSON.stringify({url:new URL(captured.url).origin+'/[query]',params:Object.fromEntries(new URL(captured.url).searchParams),headers:captured.headers,affiliateState:result.affiliateState}));
  `;
  const env={...process.env,RAKUTEN_APP_ID:'4c29f89d-b874-4910-a38b-1d8e0314c2a3',RAKUTEN_ACCESS_KEY:'pk_fixture_do_not_publish',SITE_URL:siteUrl};
  const result=spawnSync(process.execPath,['--input-type=module','-e',program],{cwd:root,env,encoding:'utf8',timeout:10000});
  assert.equal(result.status,0,result.stderr);
  return JSON.parse(result.stdout.trim());
}
test('Rakuten defaults to the registered canonical origin and only sends accessKey in header',()=>{
  const result=inspectHeaders('');
  assert.equal(result.headers.Referer,'https://vivlica.com/');
  assert.equal(result.headers.Origin,'https://vivlica.com');
  assert.equal(result.headers.accessKey,'pk_fixture_do_not_publish');
  assert.equal(Object.hasOwn(result.params,'accessKey'),false);
  assert.equal(result.params.applicationId,'4c29f89d-b874-4910-a38b-1d8e0314c2a3');
  assert.equal(result.params.affiliateId,'432a9f67.243910f6.432a9f68.e28a199a');
  assert.equal(result.affiliateState,'on');
});
test('explicitly registered SITE_URL still works without placing the secret in URLs',()=>{
  const result=inspectHeaders('https://registered.example');
  assert.equal(result.headers.Referer,'https://registered.example/');
  assert.equal(result.headers.Origin,'https://registered.example');
  assert.equal(Object.hasOwn(result.params,'accessKey'),false);
});
