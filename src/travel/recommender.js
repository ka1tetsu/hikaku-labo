import { DESTINATION_CATALOG } from './destinations.js';
import { normalizeText, searchTravel } from './search.js';

export const STYLES = Object.freeze([
  { id:'classic', label:'王道を楽しむ', emoji:'📍', subtitle:'はじめてでも巡りやすい定番中心', interests:['history','city','family'] },
  { id:'food', label:'ご当地グルメ', emoji:'🍡', subtitle:'食と街歩きを主役に', interests:['food','city'] },
  { id:'slow', label:'のんびり癒やし', emoji:'🌿', subtitle:'詰め込みすぎず景色を楽しむ', interests:['nature','relax'] },
]);
export function normalizeDestinationQuery(value='') {
  return normalizeText(value);
}
export function searchDestinations(input, catalog=DESTINATION_CATALOG) {
  if (!normalizeText(input)) return catalog;
  return searchTravel(input,{catalog}).destinations.map(hit=>hit.destination);
}
export function matchDestination(input,catalog=DESTINATION_CATALOG) {
  if (!normalizeText(input)) return null;
  return searchDestinations(input,catalog)[0]||null;
}
export function destinationMatch(destination, interests=[]) {
  const safe=Array.isArray(interests)?interests:[];
  return safe.filter(i=>destination.interests.includes(i)).length;
}
export const SORTS = Object.freeze([
  { id:'match', label:'好みに合う順' },
  { id:'hours', label:'移動時間が短い順' },
  { id:'cost', label:'物価・旅費感が安い順' },
  { id:'name', label:'名前順' },
]);
export function suggestDestinations({ chosenId='', interests=[], region='すべて', query='', area='all', country='', month=0, maxHours=0, maxCost=0, sort='match' }={},catalog=DESTINATION_CATALOG) {
  const searched=searchDestinations(query,catalog);
  const order=new Map(searched.map((d,index)=>[d.id,index]));
  const byName=(a,b)=>a.name.localeCompare(b.name,'ja');
  const compare={
    match:(a,b)=>destinationMatch(b,interests)-destinationMatch(a,interests)||Number(b.id===chosenId)-Number(a.id===chosenId)||(query?order.get(a.id)-order.get(b.id):0)||a.hours-b.hours||byName(a,b),
    hours:(a,b)=>a.hours-b.hours||byName(a,b),
    cost:(a,b)=>a.costLevel-b.costLevel||destinationMatch(b,interests)-destinationMatch(a,interests)||byName(a,b),
    name:byName,
  }[sort]||byName;
  return searched.filter(d=>(region==='すべて'||d.region===region)
    &&(area==='all'||d.area===area)
    &&(!country||d.country===country)
    &&(!month||d.bestMonths.includes(Number(month)))
    &&(!maxHours||d.hours<=maxHours)
    &&(!maxCost||d.costLevel<=maxCost))
    .sort(compare);
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
