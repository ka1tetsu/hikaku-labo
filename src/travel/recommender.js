import { DESTINATION_CATALOG } from './destinations.js';

export const STYLES = Object.freeze([
  { id:'classic', label:'王道を楽しむ', emoji:'📍', subtitle:'はじめてでも巡りやすい定番中心', interests:['history','city','family'] },
  { id:'food', label:'ご当地グルメ', emoji:'🍡', subtitle:'食と街歩きを主役に', interests:['food','city'] },
  { id:'slow', label:'のんびり癒やし', emoji:'🌿', subtitle:'詰め込みすぎず景色を楽しむ', interests:['nature','relax'] },
]);
export function normalizeDestinationQuery(value='') {
  return String(value).normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/[\s・／/、,]/g,'').trim();
}
export function searchDestinations(input, catalog=DESTINATION_CATALOG) {
  const q=normalizeDestinationQuery(input);
  if (!q) return catalog;
  return catalog.map(d=>{
    const names=d.aliases.map(normalizeDestinationQuery);
    let rank=0;
    if (names.some(a=>a===q)) rank=3;
    else if (names.some(a=>a.startsWith(q))) rank=2;
    else if (names.some(a=>a.includes(q))) rank=1;
    return {d,rank};
  }).filter(x=>x.rank>0).sort((a,b)=>b.rank-a.rank || a.d.name.localeCompare(b.d.name,'ja')).map(x=>x.d);
}
export function matchDestination(input,catalog=DESTINATION_CATALOG) {
  return searchDestinations(input,catalog)[0]||null;
}
export function destinationMatch(destination, interests=[]) {
  const safe=Array.isArray(interests)?interests:[];
  return safe.filter(i=>destination.interests.includes(i)).length;
}
export function suggestDestinations({ chosenId='', interests=[], region='すべて', query='' }={},catalog=DESTINATION_CATALOG) {
  const searched=searchDestinations(query,catalog);
  return searched.filter(d=>region==='すべて'||d.region===region)
    .sort((a,b)=>destinationMatch(b,interests)-destinationMatch(a,interests)||Number(b.id===chosenId)-Number(a.id===chosenId)||a.name.localeCompare(b.name,'ja'));
}
export function rankPlanStyles(destination,{interests=[],pace='standard'}={}) {
  return STYLES.map(style=>{
    const preferred=style.interests.filter(i=>interests.includes(i)).length;
    const local=style.interests.filter(i=>destination.interests.includes(i)).length;
    // A transparent preference-fit heuristic, NOT a quality score or booking rating.
    const score=Math.min(99,57 + preferred*11 + local*6 + (style.id==='slow'&&pace==='relaxed'?7:0)
      + (style.id==='classic'&&pace==='active'?4:0));
    return {...style,matchScore:score};
  }).sort((a,b)=>b.matchScore-a.matchScore||STYLES.findIndex(s=>s.id===a.id)-STYLES.findIndex(s=>s.id===b.id));
}
export function makeItinerary(destination,styleId='classic',nights=2,pace='standard') {
  const source=destination.routes[styleId]||destination.routes.classic;
  const days=Math.min(6,Math.max(1,Math.floor(Number(nights)||0)+1));
  const stopsPerDay=pace==='relaxed'?1:pace==='active'?3:2;
  const chunks=[];
  for(let day=0;day<days;day++){
    const slice=source.slice(day*stopsPerDay,(day+1)*stopsPerDay);
    // Once the curated suggestions are exhausted, do not invent extra attractions
    // or silently repeat them: mark as flexible time to refine with official info.
    chunks.push({
      day:day+1,
      label:day===0?'到着日・街の雰囲気に慣れる':day===days-1?'最終日・移動の余裕を確保':'エリアをゆっくり楽しむ',
      stops:slice.length?slice:['自由散策・休息（営業時間と帰路を確認）'],
    });
  }
  return chunks;
}
export function shareableTripUrl(base,destinationId,styleId,nights,pace='standard'){
  const url=new URL(base);
  url.searchParams.set('destination',destinationId);
  url.searchParams.set('style',styleId);
  url.searchParams.set('nights',String(nights));
  url.searchParams.set('pace',pace);
  return url.toString();
}
