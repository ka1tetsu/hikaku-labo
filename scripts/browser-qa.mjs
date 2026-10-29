#!/usr/bin/env node
// Chromium route/overflow/interaction suite for deployed source built locally.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const origin=process.env.BROWSER_QA_ORIGIN || 'http://127.0.0.1:4173';
const out=process.env.BROWSER_QA_OUT || 'artifacts/browser-qa';
const routes=['/','/compare/','/sim/','/hikari/','/card/','/hoken/','/life/','/tools/','/travel/','/travel/hotels/','/guides/travel-budget/','/guides/travel-total-cost/','/guides/hotel-cancellation/','/guides/lodging-tax/','/guides/long-weekends/','/guides/website-tools/'];
const viewports=[{name:'mobile',width:375,height:812},{name:'tablet',width:768,height:1024},{name:'desktop',width:1440,height:900}];
const snapshots=new Set(['/','/compare/','/sim/','/tools/','/travel/','/guides/hotel-cancellation/']);
const failures=[];
const report={origin,startedAt:new Date().toISOString(),pages:[],interactions:[],failures};
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
function fail(where,msg){failures.push({where,msg});console.error('FAIL',where,msg)}
async function audit(page,route,viewport){
 const where=viewport.name+':'+route,errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 try{
   const response=await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:20000});
   if(response?.status()!==200)fail(where,'HTTP '+(response?.status()??'no response'));
   await page.locator('main').first().waitFor({timeout:15000});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForTimeout(180);
   const data=await page.evaluate(()=>{
     const doc=document.documentElement,body=document.body;
     const overflow=Math.max(doc.scrollWidth,body.scrollWidth)-window.innerWidth;
     const candidates=[...document.querySelectorAll('body *')].filter(el=>{
       const r=el.getBoundingClientRect(),s=getComputedStyle(el);
       return r.width>0&&r.right>innerWidth+3&&s.position!=='fixed'&&s.visibility!=='hidden';
     }).slice(0,6).map(el=>({tag:el.tagName,className:typeof el.className==='string'?el.className.slice(0,90):'',width:Math.round(el.getBoundingClientRect().width)}));
     const headings=[...document.querySelectorAll('h1')].filter(el=>el.getBoundingClientRect().width>0).map(el=>el.textContent.trim().slice(0,100));
     return {overflow,candidates,headings,mainText:document.querySelector('main')?.textContent.trim().length??0,title:document.title};
   });
   if(data.overflow>3)fail(where,'document overflow '+data.overflow+'px; '+JSON.stringify(data.candidates));
   if(!data.headings.length)fail(where,'No visible H1');
   if(data.mainText<100)fail(where,'Main text too short: '+data.mainText);
   if(errors.length)fail(where,'JavaScript exceptions: '+errors.join(' | ').slice(0,500));
   report.pages.push({route,viewport:viewport.name,status:response?.status(),...data,pageErrors:errors});
   if(snapshots.has(route)&&viewport.name!=='tablet'){
     const safe=route==='/'?'home':route.replaceAll('/','-').replace(/^-|-$/g,'');
     await page.screenshot({path:path.join(out,viewport.name+'-'+safe+'.png'),animations:'disabled',timeout:20000});
   }
 }catch(e){fail(where,e.stack?.slice(0,600)||e.message)}
}
async function interaction(name,viewport,action){
 const page=await browser.newPage({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
 try{await action(page);report.interactions.push({name,result:'passed'});console.log('PASS',name)}
 catch(e){fail(name,e.message);report.interactions.push({name,result:'failed',error:e.message})}
 finally{await page.close()}
}
try{
 for(const viewport of viewports){
   const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce'});
   for(const route of routes){const page=await context.newPage();await audit(page,route,viewport);await page.close()}
   await context.close();
 }
 await interaction('savings-estimate',{width:375,height:812},async page=>{
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await page.locator('#vl-current').fill('6000');
   await page.locator('.vl-savings button[type=submit]').click();
   await page.locator('.vl-savings-result').waitFor({timeout:6000});
   if(!(await page.locator('.vl-savings-result').innerText()).includes('円'))throw Error('No yen estimate');
   await page.locator('.vl-savings-result').screenshot({path:path.join(out,'interaction-savings.png')});
 });
 await interaction('tool-chooser',{width:1440,height:900},async page=>{
   await page.goto(origin+'/tools/',{waitUntil:'domcontentloaded'});
   const btn=page.locator('.tl-option').filter({hasText:'無料で始めたい'}).first();
   await btn.click();
   if(await btn.getAttribute('aria-pressed')!=='true')throw Error('Budget choice did not update');
   const choices=page.locator('.tl-compare-toggle');
   if(await choices.count()===0)throw Error('No comparison choices');
   await choices.first().click();
   if(await choices.first().getAttribute('aria-pressed')!=='true')throw Error('Comparison did not select');
   await page.locator('#selector').screenshot({path:path.join(out,'interaction-tools.png')});
 });
 await interaction('service-selector',{width:375,height:812},async page=>{
   await page.goto(origin+'/sim/',{waitUntil:'domcontentloaded'});
   const option=page.locator('.sv-form .sv-options button').nth(1);
   await option.click();
   if(await option.getAttribute('aria-pressed')!=='true')throw Error('Mobile-plan selection did not update');
 });
 await interaction('travel-choose-destination',{width:375,height:812},async page=>{
   await page.goto(origin+'/travel/',{waitUntil:'domcontentloaded'});
   await page.locator('.tvx-shortcuts button').filter({hasText:'京都'}).first().click();
   if(!page.url().includes('destination=kyoto'))throw Error('Choosing Kyoto did not update URL');
 });
 await interaction('cash-vs-points-shopping-order',{width:375,height:812},async page=>{
   const makeOffer=(title,price,point,url)=>({
     store:'rakuten',storeName:'楽天市場',shopName:'検証用の架空店',title,price,point,
     effectivePrice:price-point,shippingFree:true,image:'',url,
     sponsored:false,reviewCount:3,reviewAverage:4.2,sameProduct:true,match:95
   });
   await page.route('**/api/compare?**',async route=>{
     const payload={
       sources:{rakuten:'ok',yahoo:'disabled'},fetchedAt:'2026-10-29T06:00:00.000Z',
       offers:[
         makeOffer('WH-1000XM5 ポイント優先の例',45000,9000,'https://item.rakuten.co.jp/b/'),
         makeOffer('WH-1000XM5 現金価格優先の例',40000,1000,'https://item.rakuten.co.jp/a/')
       ]
     };
     await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
   });
   await page.goto(origin+'/compare/?q=WH-1000XM5',{waitUntil:'domcontentloaded'});
   const rows=page.locator('.cp-offers .cp-offer');
   await rows.first().waitFor({timeout:8000});
   if(!(await rows.first().innerText()).includes('現金価格優先の例'))throw Error('Default is not cash-price-first');
   const cash=await rows.first().locator('.cp-offer-price strong').innerText();
   if(cash!=='¥40,000')throw Error('Purchase price was not shown as ¥40,000');
   await page.locator('#cp-price-sort').selectOption('points');
   if(!(await rows.first().innerText()).includes('ポイント優先の例'))throw Error('Points criterion did not reorder results');
   if(!(await rows.first().innerText()).includes('参考額'))throw Error('Reward-adjusted value was not marked as an estimate');
   if(!(await page.locator('.cp-criteria-note').innerText()).includes('購入時の支払額ではありません'))throw Error('Missing points disclaimer');
   await page.screenshot({path:path.join(out,'interaction-cash-vs-points.png'),animations:'disabled'});
 });
 await interaction('price-search',{width:1440,height:900},async page=>{
   await page.goto(origin+'/compare/',{waitUntil:'domcontentloaded'});
   await page.locator('#cp-q').fill('WH-1000XM5');
   await page.locator('.cp-search button[type=submit]').click();
   await page.locator('.cp-results h2').first().waitFor({timeout:10000});
   if(!(await page.locator('.cp-results h2').innerText()).includes('WH-1000XM5'))throw Error('Search keyword missing');
 });
}finally{
 report.finishedAt=new Date().toISOString();
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('Audited',report.pages.length,'pages;',report.interactions.length,'interactions;',failures.length,'failures');
if(process.env.GITHUB_STEP_SUMMARY){
 await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,['## Browser QA','','Pages: '+report.pages.length,'Interactions passed: '+report.interactions.filter(x=>x.result==='passed').length+'/'+report.interactions.length,'Failures: '+failures.length,'',...failures.slice(0,30).map(x=>'- '+x.where+': '+x.msg)].join('\n')+'\n');
}
if(failures.length)process.exitCode=1;
