import { DESTINATION_CATALOG } from './destinations.js';
import { addDays } from './bookingLinks.js';
import { japanToday, parseStaySearch } from './staySearch.js';
const FIELDS=['place','checkin','checkout','adults','breakfast','onsen'];
const defaults=today=>({place:'',checkin:addDays(today,1),checkout:addDays(today,2),adults:'2',breakfast:'false',onsen:'false'});
export function initialStaySearchContext(raw='',today=japanToday()) {
  const params=new URLSearchParams(raw), form=defaults(today);
  const domestic=DESTINATION_CATALOG.find(row=>row.id===params.get('destination')&&row.area==='domestic');
  if(domestic)form.place=domestic.name;
  const nights=Number(params.get('nights'));
  if(domestic&&Number.isInteger(nights)&&nights>=1&&nights<=7)form.checkout=addDays(form.checkin,nights);
  let specified=false, repeated=false;
  for(const field of FIELDS){
    const values=params.getAll('stay_'+field);
    if(values.length){specified=true;form[field]=values[0];if(values.length>1)repeated=true;}
  }
  if(!specified)return {form,notice:''};
  const valid=parseStaySearch({...form,place:form.place||'東京'},today);
  if(valid&&!repeated)return {form:{...form,place:form.place.trim()},notice:''};
  // Expired/invalid shared dates must not silently become a different trip.
  const safePlace=typeof form.place==='string'&&form.place.length<=80&&!/\p{Cc}/u.test(form.place)?form.place:'';
  return {form:{...defaults(today),place:safePlace,checkin:'',checkout:'',adults:''},notice:'リンクの検索条件が古いか不正です。日程・人数を選び直してください。'};
}
export function staySearchUrl(search,origin,today=japanToday()) {
  const normalized=parseStaySearch({...search,breakfast:String(search.breakfast),onsen:String(search.onsen)},today);
  if(!normalized)return null;
  try{
    const url=new URL('/travel/',origin);
    if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return null;
    for(const field of FIELDS)url.searchParams.set('stay_'+field,String(normalized[field]));
    url.hash='stay-search';
    return url.href;
  }catch{return null;}
}
