import { GLOBAL_DESTINATIONS, matchGlobalDestination } from './globalDestinations.js';
import { DESTINATION_CATALOG } from './destinations.js';

export const ALL_TRAVEL_DESTINATIONS=Object.freeze([
  ...DESTINATION_CATALOG.map(d=>Object.freeze({id:d.id,name:d.name,country:'日本',region:d.region,iata:null,
    stops:d.routes.classic.slice(0,3),tagline:d.tagline,international:false})),
  ...GLOBAL_DESTINATIONS,
]);
const normalize = s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s・]+/g,'');
export function findDestination(value){
  const q=normalize(value);
  if(!q)return null;
  const global=matchGlobalDestination(value);
  if(global)return global;
  return ALL_TRAVEL_DESTINATIONS.find(d=>normalize(d.name)===q||normalize(d.id)===q)||
    DESTINATION_CATALOG.flatMap(d=>d.aliases.map(a=>({alias:a,city:d}))).find(x=>normalize(x.alias)===q)?.city||null;
}
export function autocompleteDestinations(text,limit=8){
  const q=normalize(text);
  if(!q)return ALL_TRAVEL_DESTINATIONS.slice(0,limit);
  return ALL_TRAVEL_DESTINATIONS.map(d=>{
    const s=[d.name,d.id,d.country,d.iata||''].map(normalize);
    let score=s.some(x=>x===q)?3:s.some(x=>x.startsWith(q))?2:s.some(x=>x.includes(q))?1:0;
    const origin=DESTINATION_CATALOG.find(x=>x.id===d.id);
    if(origin?.aliases.some(a=>normalize(a).includes(q)))score=Math.max(score,1);
    return {d,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.d.name.localeCompare(b.d.name,'ja')).slice(0,limit).map(x=>x.d);
}
export function detectDates(input,now=new Date()){
  const text=String(input||'').normalize('NFKC');
  const iso=text.match(/(20\d\d)[/-](\d\d?)[/-](\d\d?)/);
  const jp=text.match(/(?:(20\d\d)年)?(\d{1,2})月(\d{1,2})日/);
  if(!iso&&!jp)return null;
  const yy=Number(iso?.[1]||jp?.[1]||now.getFullYear()),mm=Number(iso?.[2]||jp?.[2]),dd=Number(iso?.[3]||jp?.[3]);
  const date=new Date(Date.UTC(yy,mm-1,dd));
  if(date.getUTCFullYear()!==yy||date.getUTCMonth()!==mm-1||date.getUTCDate()!==dd)return null;
  if(yy<now.getFullYear()||yy>now.getFullYear()+3)return null;
  const fmt=date.toISOString().slice(0,10);
  if(!iso&&!jp?.[1]&&new Date(fmt+'T23:59:59Z')<now){
    const next=new Date(Date.UTC(yy+1,mm-1,dd));
    if(next.getUTCMonth()!==mm-1)return null;
    return next.toISOString().slice(0,10);
  }
  return fmt;
}
export function parseTravelQuery(text,now=new Date()){
  const q=String(text||'').normalize('NFKC').trim().slice(0,480);
  const found = ALL_TRAVEL_DESTINATIONS
    .map(d=>({city:d,at:Math.max(q.toLowerCase().indexOf(d.name.toLowerCase()),q.toLowerCase().indexOf(d.id))}))
    .filter(x=>x.at>=0).sort((a,b)=>a.at-b.at);
  const unique=[...new Map(found.map(x=>[x.city.id,x])).values()];
  let destination=unique.at(-1)?.city||null,origin=null;
  if(unique.length>=2&&/から/.test(q)){
    origin=unique[0].city;
    destination=unique.find(x=>x.city.id!==origin.id)?.city||destination;
  }
  const budget=q.match(/(?:予算|旅費|航空券|飛行機|宿代|ホテル代)[^\d]{0,7}(\d+(?:\.\d+)?)\s*(万円|千円|円)/)||
    q.match(/(\d+(?:\.\d+)?)\s*(万円|千円|円)\s*(?:以下|以内|まで)/);
  const convert=budget?Math.round(Number(budget[1])*(budget[2]==='万円'?10000:budget[2]==='千円'?1000:1)):null;
  const travelers=q.match(/(\d{1,2})\s*(?:人|名)(?:で|の旅行|旅行)?/);
  const nights=q.match(/(\d{1,2})\s*泊/);
  const date=detectDates(q,now);
  const interests={
    food:/(グルメ|食べ歩き|美食|ラーメン|food)/i,
    history:/(歴史|城|神社|寺|文化|heritage)/i,
    nature:/(自然|海|山|ハイキング|景色|ビーチ|nature)/i,
    relax:/(温泉|リゾート|のんびり|ゆっくり|relax)/i,
    city:/(街歩き|買い物|ショッピング|都市|city)/i,
    family:/(家族|子連れ|子供|ファミリー|family)/i,
  };
  const detected=Object.entries(interests).filter(([,re])=>re.test(q)).map(([key])=>key);
  return {
    raw:q,origin:origin?.name||'',destination:destination?.name||'',
    destinationId:destination?.id||null,
    departureDate:date||'',
    nights:nights?Math.min(30,Number(nights[1])):null,
    travelers:travelers?Math.min(30,Number(travelers[1])):null,
    budgetJPY:budget&&Number.isFinite(convert)?Math.min(10_000_000,convert):null,
    nonstop:/(直行便|乗継なし|乗り換えなし|nonstop|direct flight)/i.test(q),
    freeCancellation:/(キャンセル無料|無料キャンセル|返金可能|free cancellation)/i.test(q),
    checkedBag:/(預け荷物|受託手荷物|スーツケース|checked bag)/i.test(q),
    breakfast:/(朝食付き|朝食あり|breakfast)/i.test(q),
    family:/(子供|子連れ|家族)/.test(q),
    interests:detected,
  };
}
export function buildGeneralItinerary(destination,nights=2,interests=[]){
  // Exact attractions only when this destination is in editorial data.
  const days=Math.min(10,Math.max(1,Number(nights)+1));
  const stops=destination?.stops||[];
  return Array.from({length:days},(_,day)=>({
    day:day+1,
    stops:stops[day]?[stops[day]]:['観光施設・交通・営業時間を公式情報で確認して組み立てる'],
    note:day===0?'到着・移動を考慮':day===days-1?'帰路の時間に余裕を':'移動時間と休憩を確認',
    interests,
  }));
}
