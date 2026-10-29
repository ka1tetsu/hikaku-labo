// Capture source-linked, anonymous, live production screenshots after SHA verification.
// This never submits forms, follows referrals, or sends page-view analytics.
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import {inspectRelease,ORIGIN} from './release-recovery.mjs';

const ROUTES=Object.freeze([
  {slug:'home',path:'/'},
  {slug:'compare',path:'/compare/'},
  {slug:'tools',path:'/tools/'},
  {slug:'travel',path:'/travel/'},
]);
const SIZES=Object.freeze([{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]);
export function screenshotPlan(){
  return ROUTES.flatMap(route=>SIZES.map(size=>({name:`${size.name}-${route.slug}.png`,route:route.path,viewport:{width:size.width,height:size.height}})));
}
export async function capture({commit,origin=ORIGIN,folder='artifacts/live-release'}={}){
  const before=await inspectRelease(commit,{origin});
  if(before.state!=='current')throw Error('Site is not serving the expected commit before capture');
  await mkdir(folder,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const report={source:'public production website',origin,commit,checkedAt:new Date().toISOString(),screenshots:[]};
  try {
    for(const shot of screenshotPlan()){
      const context=await browser.newContext({viewport:shot.viewport,locale:'ja-JP',timezoneId:'Asia/Tokyo',reducedMotion:'reduce'});
      const page=await context.newPage();
      await page.route('**/api/track',route=>route.abort('blockedbyclient'));
      try {
        const response=await page.goto(origin+shot.route,{waitUntil:'domcontentloaded',timeout:22000});
        if(!response || response.status()!==200 || new URL(page.url()).origin!==origin || new URL(page.url()).pathname!==shot.route)
          throw Error(`Unexpected response for ${shot.route}: ${response?.status()}`);
        await page.locator('#main-content').first().waitFor({timeout:12000});
        await page.evaluate(async()=>{if(document.fonts?.ready)await document.fonts.ready;});
        const output=path.join(folder,shot.name);
        await page.screenshot({path:output,animations:'disabled'});
        report.screenshots.push({page:shot.route,viewport:shot.viewport,file:shot.name,httpStatus:response.status()});
      }finally{await context.close();}
    }
  }finally{await browser.close();}
  const after=await inspectRelease(commit,{origin});
  if(after.state!=='current')throw Error('Production changed while screenshots were captured; refuse publication claim');
  await writeFile(path.join(folder,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Verified live release:',commit,'screenshots:',report.screenshots.length);
  return report;
}
if(process.argv[1] && process.argv[1].replace(/\\/g,'/').endsWith('/capture-live-preview.mjs')){
  capture({commit:process.argv[2]}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
