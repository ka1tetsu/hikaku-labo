#!/usr/bin/env node
// Fail only for new primary Impeccable findings per file/rule; preserve existing debt.
import fs from 'node:fs';
import path from 'node:path';
const [baseFile, headFile, baseCodeFile, headCodeFile, baseDir, headDir] = process.argv.slice(2);
if (![baseFile,headFile,baseCodeFile,headCodeFile,baseDir,headDir].every(Boolean)) {
  throw new Error('Usage: impeccable-gate.mjs base.json head.json base.status head.status baseDir headDir');
}
function readScan(file, status, root) {
  const code=Number(fs.readFileSync(status,'utf8').trim());
  if (![0,2].includes(code)) throw new Error('Detector scan failed with exit code '+code+': '+file);
  const obj=JSON.parse(fs.readFileSync(file,'utf8'));
  const data=Array.isArray(obj)?obj:(Array.isArray(obj.findings)?obj.findings:obj.results);
  if (!Array.isArray(data)) throw new Error('Unknown detector JSON shape: '+file);
  return data.filter(x=>x.advisory!==true && x.isAdvisory!==true && x.severity!=='advisory').map(x=>{
    const rule=x.antipattern??x.ruleId??x.rule_id??x.rule??x.id??x.code;
    const name=typeof rule==='string'?rule:(rule?.id??rule?.name);
    if (!name) throw new Error('Missing rule identifier in '+file+': '+JSON.stringify(x).slice(0,200));
    const value=String(x.file??x.filename??x.path??x.source?.file??x.location?.file??'<unknown>').replaceAll('\\','/');
    const fileName=path.isAbsolute(value)?path.relative(root,value).replaceAll('\\','/'):value.replace(/^\.\//,'');
    return {file:fileName,rule:String(name),key:fileName+'\t'+String(name)};
  });
}
function counts(items) {const result=new Map();for(const item of items)result.set(item.key,(result.get(item.key)??0)+1);return result}
try {
  const base=readScan(baseFile,baseCodeFile,baseDir);
  const head=readScan(headFile,headCodeFile,headDir);
  const previous=counts(base),current=counts(head);
  const added=[...current].flatMap(([key,count])=>{
    const extra=count-(previous.get(key)??0);if(extra<=0)return [];
    const [file,rule]=key.split('\t');return [{file,rule,extra}];
  });
  const report=['## Impeccable site-wide design gate','','| Revision | Primary findings |','|---|---:|',
    '| Base | '+base.length+' |','| Head | '+head.length+' |','',
    'New primary findings: **'+added.reduce((n,x)=>n+x.extra,0)+'**','',
    ...added.map(x=>'- '+x.file+': '+x.rule+' (+'+x.extra+')')].join('\n')+'\n';
  console.log(report);
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
  for(const item of added.slice(0,40))console.error('::error file='+item.file+'::New Impeccable issue '+item.rule+' (+'+item.extra+')');
  if(added.length)process.exitCode=2;
} catch(error) {
  console.error('::error::Impeccable design gate could not compare scans: '+error.message);
  process.exitCode=1;
}
