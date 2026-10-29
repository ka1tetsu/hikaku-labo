#!/usr/bin/env node
// Count changes in the number of Impeccable primary findings per file and rule.
// Full reports are kept; older findings are not silently ignored.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base=process.env.IMPECCABLE_BASE_DIR;
if(!base){console.error('IMPECCABLE_BASE_DIR is required');process.exit(1);}
const version='4.7.0';
const targets=['src/','guides/','index.html','tools/index.html','travel/index.html','compare/index.html','life/index.html','sim/index.html','hikari/index.html','card/index.html','hoken/index.html','public/guides.css'];
const command=['--yes','impeccable@'+version,'detect','--json',...targets];
const reportDir=resolve(process.env.IMPECCABLE_REPORT_DIR||'impeccable-reports');
mkdirSync(reportDir,{recursive:true});
function scan(cwd,name){
  const result=spawnSync('npx',command,{cwd,encoding:'utf8',maxBuffer:30*1024*1024,timeout:180000,env:{...process.env,DO_NOT_TRACK:'1',IMPECCABLE_NO_TELEMETRY:'1'}});
  writeFileSync(resolve(reportDir,name+'.json'),result.stdout||'');
  writeFileSync(resolve(reportDir,name+'.stderr.txt'),result.stderr||'');
  if(result.error||![0,2].includes(result.status))throw new Error(name+': detector execution failed '+result.status+' '+String(result.error?.message||result.stderr||'').slice(-1500));
  let parsed;try{parsed=JSON.parse(result.stdout)}catch{throw new Error(name+': unexpected detector JSON');}
  const entries=Array.isArray(parsed)?parsed:Array.isArray(parsed.findings)?parsed.findings:Array.isArray(parsed.results)?parsed.results:null;
  if(!entries)throw new Error(name+': unsupported detector JSON schema');
  return entries.filter(item=>item&&typeof item==='object'&&item.advisory!==true&&item.severity!=='advisory');
}
function normalizeFile(item){
  let p=String(item.file||item.path||item.filename||item.location?.file||item.source?.file||'unknown').replaceAll('\\','/');
  const m=p.match(/(?:^|\/)(src|guides|tools|travel|compare|life|sim|hikari|card|hoken|public)\/.+$/);
  if(m)p=p.slice(p.length-m[0].length+(m[0].startsWith('/')?1:0));
  if(p.endsWith('/index.html')&&!p.includes('src/'))p=p.replace(/^.*\/(index\.html)$/,'$1');
  return p;
}
function key(item){return String(item.ruleId||item.rule_id||item.rule||item.id||item.code||'unknown-rule')+'|'+normalizeFile(item);}
function counts(items){const count=new Map();for(const item of items){const k=key(item);count.set(k,(count.get(k)||0)+1);}return count;}
try{
  const before=scan(resolve(base),'base'),after=scan(process.cwd(),'head');
  const b=counts(before),a=counts(after);
  const regressions=[...a.entries()].filter(([k,n])=>n>(b.get(k)||0))
    .map(([k,n])=>({ruleAndFile:k,previous:b.get(k)||0,current:n,added:n-(b.get(k)||0)}));
  const report={package:'impeccable@'+version,scanTargets:targets,baselinePrimary:before.length,currentPrimary:after.length,regressions,
    baselineMethod:'Per-file, per-rule primary finding counts compared with merge base.',
    limitation:'Count-based ratchets can miss an offsetting change. Inspect rendered designs at desktop and mobile viewports too.'};
  writeFileSync(resolve(reportDir,'summary.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(process.env.GITHUB_STEP_SUMMARY)writeFileSync(process.env.GITHUB_STEP_SUMMARY,
    '## Impeccable full-site report\n\nBefore: '+before.length+' primary findings; after: '+after.length+'; new rule/file groups: **'+regressions.length+'**.\n\nDownload JSON artifact for detailed source findings.\n',{flag:'a'});
  if(regressions.length>0)process.exitCode=2;
}catch(error){console.error(error.stack||String(error));process.exitCode=1;}
