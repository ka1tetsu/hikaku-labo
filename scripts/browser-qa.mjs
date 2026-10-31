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
 await interaction('compact-mobile-concierge',{width:375,height:812},async page=>{
   await page.goto(origin+'/compare/',{waitUntil:'domcontentloaded'});
   const trigger=page.locator('.hcl-launcher');
   await trigger.waitFor({timeout:6000});
   const rect=await trigger.boundingBox();
   if(!rect || rect.width>56 || rect.height>56)throw Error('Floating assistant blocks mobile comparison screen');
   if((await trigger.getAttribute('aria-label'))!=='条件を相談')throw Error('Assistant has no mobile accessible name');
   await trigger.click();
   const dialog=page.getByRole('dialog',{name:'Vivlica 条件検索アシスタント'});
   await dialog.waitFor({timeout:6000});
   await page.keyboard.press('Escape');
   if(await dialog.isVisible())throw Error('Escape failed to close assistant');
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
   await page.locator('.cp-results').screenshot({path:path.join(out,'interaction-cash-vs-points.png'),animations:'disabled'});
 });
 await interaction('checkout-and-private-price-target',{width:375,height:812},async page=>{
   const makeOffer=(name,price,shippingStatus,url)=>({
     store:'rakuten',storeName:'楽天市場',shopName:name,title:'WH-1000XM5 ヘッドホン '+name,
     price,point:500,effectivePrice:price-500,shippingStatus,shippingFree:shippingStatus==='free',
     image:'',url,sponsored:false,reviewCount:20,reviewAverage:4.5,sameProduct:true,matchBasis:'model',match:95,
   });
   await page.route('**/api/compare?**',async route=>route.fulfill({
     status:200,contentType:'application/json',body:JSON.stringify({
       sources:{rakuten:'ok',yahoo:'disabled'},fetchedAt:'2026-10-31T06:00:00.000Z',
       offers:[makeOffer('出品店A',29900,'unknown','https://item.rakuten.co.jp/a/x/'),
         makeOffer('出品店B',32000,'free','https://item.rakuten.co.jp/b/x/')],
     }),
   }));
   await page.goto(origin+'/compare/?q=WH-1000XM5',{waitUntil:'domcontentloaded'});
   const picks=page.locator('.cp-offers .cp-pick input');
   await picks.first().waitFor({timeout:8000});
   await picks.nth(0).check();await picks.nth(1).check();
   const checkout=page.locator('.cp-checkout');
   if(!(await checkout.innerText()).includes('送料が未確定'))throw Error('Missing-shipping should stay unpriced');
   await checkout.getByRole('spinbutton',{name:'出品店Aの送料'}).fill('1000');
   await checkout.getByRole('spinbutton',{name:'出品店Aのクーポン額'}).fill('2000');
   if(!(await checkout.innerText()).includes('¥28,900'))throw Error('Checkout total was not adjusted to ¥28,900');
   await page.locator('#cp-target-input').fill('30000');
   await page.locator('.cp-watch-form button').click();
   const watch=page.locator('.cp-watch');
   if(!(await watch.innerText()).includes('目標以下'))throw Error('Verified model price did not trigger on-visit threshold');
   const stored=await page.evaluate(()=>localStorage.getItem('vivlica-product-targets-v1'));
   if(!stored||stored.includes('shopName')||stored.includes('offers')||stored.includes('effectivePrice'))throw Error('Merchant data leaked into target storage');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('.cp-watch-list li').first().waitFor({timeout:8000});
   if(!(await page.locator('.cp-watch-list').innerText()).includes('¥30,000'))throw Error('Price target did not persist locally');
   await watch.screenshot({path:path.join(out,'interaction-price-target-mobile.png'),animations:'disabled'});
 });
 await interaction('multi-store-verified-lowest-with-manual-price',{width:375,height:812},async page=>{
   const offer=(price,store,shippingStatus,shopName)=>{
     const root=store==='yahoo'?'https://store.shopping.yahoo.co.jp/qa/':'https://item.rakuten.co.jp/qa/';
     return {store,storeName:store==='yahoo'?'Yahoo!ショッピング':'楽天市場',shopName,
       title:'ソニー WH-1000XM5',price,point:500,effectivePrice:price-500,
       url:root+price+'.html',sponsored:false,image:'',reviewAverage:4.2,reviewCount:80,
       shippingStatus,shippingFree:shippingStatus==='free',sameProduct:true,matchBasis:'model',inStock:true};
   };
   await page.route('**/api/compare?**',route=>route.fulfill({
     status:200,contentType:'application/json',
     body:JSON.stringify({sources:{yahoo:'ok',rakuten:'ok'},mode:'price',page:1,pageCount:1,
       offers:[offer(1000,'yahoo','unknown','送料未定'),offer(26000,'yahoo','free','A店'),offer(30000,'rakuten','free','B店')],
       fetchedAt:'2026-10-31T09:00:00.000Z'})
   }));
   await page.goto(origin+'/compare/?q=WH-1000XM5',{waitUntil:'domcontentloaded'});
   await page.locator('.cp-allshops').waitFor({timeout:10000});
   const board=await page.locator('.cp-allshops').innerText();
   if(!board.includes('¥26,000')||!board.includes('¥30,000'))throw Error('Verified multi-seller prices missing');
   if(!(await page.locator('.cp-allshops-winner').innerText()).includes('¥26,000'))throw Error('Unknown shipping listing falsely won');
   if((await page.locator('.cp-allshops-web-grid a').count())<16)throw Error('Not enough merchant discovery links');
   await page.getByRole('button',{name:'他社の価格を加えて最安を探す'}).click();
   await page.locator('#cp-manual form').waitFor({timeout:7000});
   await page.locator('#cp-add-store').selectOption('edion');
   const row=page.locator('.cp-manual-row').filter({hasText:'エディオンネットショップ'});
   await row.locator('input[type=number]').nth(0).fill('25000');
   await row.locator('input[type=number]').nth(1).fill('0');
   await row.locator('input[type=number]').nth(2).fill('500');
   await row.locator('input[type=number]').nth(3).fill('200');
   await page.locator('.cp-manual-confirm input').check();
   await page.getByRole('button',{name:'確認できた全ショップを安い順に比較する'}).click();
   await page.locator('.cp-manual-winner').waitFor({timeout:5000});
   const best=await page.locator('.cp-manual-winner').innerText();
   if(!best.includes('¥24,500')||!best.includes('エディオン'))throw Error('User verified retailer did not become cheapest');
   if(!(await page.locator('.cp-manual-results').innerText()).includes('¥26,000'))throw Error('API price excluded from merged ranking');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>3)throw Error('Multi-store comparison horizontal overflow '+overflow+'px');
 });
 await interaction('amazon-review-evidence-manual-handoff',{width:375,height:812},async page=>{
   const offer=(price,store='yahoo')=>({
     store,storeName:store==='yahoo'?'Yahoo!ショッピング':'楽天市場',shopName:'サンプル販売店',
     title:'SONY WH-1000XM5',price,point:0,effectivePrice:price,
     url:store==='yahoo'?'https://store.shopping.yahoo.co.jp/store/1.html':'https://item.rakuten.co.jp/store/1/',
     sponsored:false,image:'',reviewAverage:4.5,reviewCount:120,
     reviewUrl:store==='yahoo'?'https://shopping.yahoo.co.jp/review/item/list?store_id=store&page_key=1':null,
     sellerReviewAverage:4.8,sellerReviewCount:200,
     storeUrl:store==='yahoo'?'https://store.shopping.yahoo.co.jp/store/':null,
     shippingStatus:'free',sameProduct:true,matchBasis:'model',sourceRank:0
   });
   await page.route('**/api/compare?**',route=>route.fulfill({
     status:200,contentType:'application/json',
     body:JSON.stringify({sources:{yahoo:'ok',rakuten:'ok'},mode:'price',pageCount:1,
       fetchedAt:'2026-10-31T09:00:00.000Z',offers:[offer(31900),offer(33300,'rakuten')]})
   }));
   await page.goto(origin+'/compare/?q=WH-1000XM5',{waitUntil:'domcontentloaded'});
   await page.locator('.cp-three-way-amazon').waitFor({timeout:10000});
   if(!(await page.locator('.cp-three-way-amazon').innerText()).includes('価格・星評価は未取得')) throw Error('Amazon false price/ratings claim');
   const amz=page.locator('.cp-three-way-amazon a');
   if(!(await amz.getAttribute('href')).includes('amazon.co.jp')) throw Error('Amazon search action broken');
   const review=page.locator('.cp-review-evidence').first();
   if(!(await review.getAttribute('href')).startsWith('https://shopping.yahoo.co.jp/review/')) throw Error('Official product review URL missing');
   if(!(await page.locator('.cp-seller-evidence').first().innerText()).includes('販売店の評価')) throw Error('Seller feedback not separate');
   await page.getByRole('button',{name:'Amazonの価格を入力して3社比較する'}).click();
   await page.locator('#cp-manual form').waitFor({timeout:5000});
   if(!(await page.locator('#cp-manual form').innerText()).includes('Amazon')) throw Error('Amazon manual price entry did not open');
   if(!(await page.locator('.cp-three-way-shop').first().innerText()).includes('¥33,300')) {
     // Source order does not matter; compare display must include both known source prices.
     const content=await page.locator('.cp-three-way').innerText();
     if(!content.includes('¥31,900')||!content.includes('¥33,300'))throw Error('Retrieved source prices not displayed');
   }
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>3)throw Error('Amazon/review panel overflow '+overflow+'px');
 });
 await interaction('shopping-purchase-choice-mobile',{width:375,height:812},async page=>{
   const makeOffer=(shop,price,shippingStatus,url)=>({
     store:'yahoo',storeName:'Yahoo!ショッピング',shopName:shop,
     title:'ソニー WH-1000XM5 ヘッドホン '+shop,price,point:300,
     pointKind:'paypay-limited',effectivePrice:price-300,shippingStatus,shippingFree:shippingStatus==='free',
     image:'',url,sponsored:true,reviewAverage:4.5,reviewCount:80,matchBasis:'model',sameProduct:true,
   });
   await page.route('**/api/compare?**',route=>route.fulfill({
     status:200,contentType:'application/json',
     body:JSON.stringify({
       sources:{rakuten:'error',yahoo:'ok'},fetchedAt:'2026-10-31T06:00:00.000Z',
       offers:[makeOffer('A店',20000,'unknown','https://store.shopping.yahoo.co.jp/a/1.html'),
         makeOffer('B店',21100,'free','https://store.shopping.yahoo.co.jp/b/2.html')]
     }),
   }));
   await page.goto(origin+'/compare/?q=WH-1000XM5',{waitUntil:'domcontentloaded'});
   await page.locator('.cp-choice-link').first().waitFor({timeout:8000});
   const choiceCards=page.locator('.cp-choice-option');
   if(await choiceCards.count()!==2)throw Error('Missing cash and free shipping decision paths');
   if(!(await choiceCards.first().innerText()).includes('¥20,000'))throw Error('Cheapest cash candidate not featured');
   if(!(await choiceCards.nth(1).innerText()).includes('送料無料'))throw Error('Free-shipping alternative missing');
   if(!(await page.locator('.cp-provider-notice').innerText()).includes('楽天市場は今回取得できませんでした'))throw Error('Provider outage hidden');
   const link=await choiceCards.first().locator('a').getAttribute('href');
   if(!link?.startsWith('https://store.shopping.yahoo.co.jp/'))throw Error('Source link not retained');
   if(!(await choiceCards.first().locator('a').getAttribute('rel')).includes('sponsored'))throw Error('PR link disclosure missing');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>3)throw Error('Mobile purchase choice overflow '+overflow+'px');
   await page.locator('.cp-choice').screenshot({path:path.join(out,'interaction-purchase-choice-mobile.png'),animations:'disabled'});
 });
 await interaction('yahoo-home-recommendations-mobile',{width:375,height:812},async page=>{
   await page.route('**/api/compare?**',route=>{
     const url=new URL(route.request().url());
     if(url.searchParams.get('mode')!=='recommended')throw Error('Home discovery did not request recommendation mode');
     const offer=(price,rank)=>({store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'テスト店',title:'ワイヤレスイヤホン '+rank,price,point:0,effectivePrice:price,
       url:'https://store.shopping.yahoo.co.jp/qa/'+rank+'.html',sponsored:true,image:'',reviewAverage:4.0,reviewCount:1,
       shippingStatus:'unknown',sameProduct:false,matchBasis:'unverified',sourceRank:rank});
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sources:{rakuten:'skipped',yahoo:'ok'},mode:'recommended',pageCount:1,offers:[offer(9000,0),offer(7000,1)]})});
   });
   await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
   await page.locator('.product-card').first().waitFor({timeout:10000});
   const cards=page.locator('.product-card');
   if(await cards.count()!==2)throw Error('Yahoo offers missing from home');
   if(!(await cards.first().innerText()).includes('¥9,000'))throw Error('Relevance rank lost in discovery');
   const link=await cards.first().locator('.btn-primary-cta').getAttribute('href');
   if(!link?.includes('store.shopping.yahoo.co.jp/qa/0.html'))throw Error('Yahoo product was misrouted to Rakuten/Amazon');
   if(!(await page.locator('.hl-travel-priority').innerText()).includes('航空券'))throw Error('Travel priority entry not visible');
   if(await page.evaluate(()=>window.scrollY)>70)throw Error('Homepage unexpectedly auto-scrolled past travel entry');
   if(!(await cards.first().locator('.btn-primary-cta').innerText()).includes('PR'))throw Error('Primary affiliate action missing visible PR disclosure');
   await page.locator('.hl-catalog-filters select').nth(2).selectOption('4.5');
   await page.locator('.hl-filter-empty').waitFor({timeout:4000});
   if(await cards.count()!==0)throw Error('Review filter did not remove low-rated results');
   await page.getByRole('button',{name:'絞り込みを解除'}).click();
   if(await cards.count()!==2)throw Error('Reset filters did not restore results');
   await page.locator('.hl-shipping-checkbox input').check();
   await page.locator('.hl-filter-empty').waitFor({timeout:4000});
   await page.getByRole('button',{name:'絞り込みを解除'}).click();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>3)throw Error('Home horizontal overflow '+overflow+'px');
 });
 await interaction('model-search-ascending-yahoo',{width:1440,height:900},async page=>{
   await page.route('**/api/compare?**',route=>{
     const url=new URL(route.request().url());
     if(url.searchParams.get('mode')!=='price')throw Error('Exact model did not request price sorting');
     const offer=(price)=>({store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'テスト店',title:'ソニー WH-1000XM5',price,point:0,effectivePrice:price,
       url:'https://store.shopping.yahoo.co.jp/qa/'+price+'.html',sponsored:false,image:'',reviewAverage:4.5,reviewCount:20,
       shippingStatus:'free',sameProduct:true,matchBasis:'model'});
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sources:{rakuten:'error',yahoo:'ok'},mode:'price',pageCount:1,offers:[offer(45000),offer(31000)]})});
   });
   await page.goto(origin+'/?keyword=WH-1000XM5',{waitUntil:'domcontentloaded'});
   await page.locator('.product-card').first().waitFor({timeout:10000});
   if((await page.locator('.sort-select').inputValue())!=='price-asc')throw Error('Exact model must default to cash price');
   if(!(await page.locator('.product-card').first().innerText()).includes('¥31,000'))throw Error('Price ascending lost');
   if(!(await page.locator('.hl-provider-status').innerText()).includes('楽天市場 取得できませんでした'))throw Error('Rakuten outage hidden');
 });
 await interaction('travel-booking-hub-first',{width:375,height:812},async page=>{
   await page.goto(origin+'/travel/?destination=naha',{waitUntil:'domcontentloaded'});
   await page.locator('#booking').waitFor({timeout:10000});
   if(!(await page.locator('#booking h3').innerText()).includes('那覇'))throw Error('Requested city not shown in booking hub');
   if(!(await page.locator('.tvw-google-discovery').innerText()).includes('Google'))throw Error('Google discovery links absent');
   const pos=await page.evaluate(()=>({
     booking:[...document.querySelectorAll('*')].indexOf(document.querySelector('#booking')),
     itinerary:[...document.querySelectorAll('*')].indexOf(document.querySelector('.tvx-itinerary')),
   }));
   if(pos.booking<0||pos.itinerary<0||pos.booking>pos.itinerary)throw Error('Booking hub still appears after itinerary');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>3)throw Error('Travel hub horizontal overflow '+overflow+'px');
 });
 await interaction('compare-recommended-pages-google-mobile',{width:375,height:812},async page=>{
   let calls=0;
   await page.route('**/api/compare?**',route=>{
     const params=new URL(route.request().url()).searchParams;
     if(params.get('mode')!=='recommended')throw Error('Broad query did not use relevance order');
     const n=Number(params.get('page')||1);calls++;
     const offer=(price,rank)=>({store:'yahoo',storeName:'Yahoo!ショッピング',shopName:'動作検証店',
       title:'ロボット掃除機 候補'+n+'-'+rank,price,point:0,effectivePrice:price,sourceRank:rank,
       url:'https://store.shopping.yahoo.co.jp/example/'+n+'-'+rank+'.html',sponsored:false,
       image:'',reviewAverage:4.2,reviewCount:5,shippingStatus:'unknown',sameProduct:false,matchBasis:'unverified'});
     return route.fulfill({status:200,contentType:'application/json',
       body:JSON.stringify({sources:{rakuten:'skipped',yahoo:'ok'},mode:'recommended',page:n,pageCount:3,
         fetchedAt:'2026-10-31T08:00:00Z',offers:[offer(42000,0),offer(20000,1)]})});
   });
   await page.goto(origin+'/compare/?q='+encodeURIComponent('ロボット掃除機'),{waitUntil:'domcontentloaded'});
   await page.locator('.cp-offer').first().waitFor({timeout:10000});
   if((await page.locator('#cp-price-sort').inputValue())!=='recommended')throw Error('Expected recommendations for broad discovery');
   if(!(await page.locator('.cp-offer').first().innerText()).includes('¥42,000'))throw Error('Source relevance ordering lost');
   await page.getByRole('button',{name:'次の30件を探す'}).click();
   await page.locator('.cp-offer').first().waitFor({timeout:10000});
   await page.waitForFunction(()=>document.querySelector('.cp-offer-title')?.textContent?.includes('候補2-0'),null,{timeout:10000});
   if(calls<2)throw Error('Next page did not fetch additional provider results');
   if(!(await page.locator('.cp-google-links').innerText()).includes('Google'))throw Error('External search missing');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   if(overflow>3)throw Error('Compare pagination mobile overflow '+overflow+'px');
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
