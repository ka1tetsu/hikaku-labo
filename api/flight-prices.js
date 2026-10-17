// Optional Travelpayouts Aviasales indicative prices. This is NOT real-time
// booking inventory nor a guaranteed fare. API registration and data usage license
// must be confirmed before setting TRAVELPAYOUTS_API_TOKEN in Vercel server env.
// NEVER expose API tokens or scrape third-party websites. No booking deep links.
const validIata = value=>/^[A-Z]{3}$/.test(value);
const validDate = value=>/^\d{4}-\d{2}(-\d{2})?$/.test(value);
export function parseIndicativeSearch(query){
  const origin=String(query.origin||'').toUpperCase(),destination=String(query.destination||'').toUpperCase();
  const departure=String(query.departure||'');
  const direct=query.direct==='true';
  if(!validIata(origin)||!validIata(destination)||origin===destination||!validDate(departure))return null;
  return {origin,destination,departure,direct};
}
export function cleanIndicativeFares(body,search){
  if(!body?.success||!Array.isArray(body.data))return [];
  return body.data.slice(0,40).filter(r=>
    Number.isFinite(r.price)&&r.price>0&&Number.isSafeInteger(r.price)&&
    r.origin===search.origin&&r.destination===search.destination
    &&typeof r.departure_at==='string'&&r.departure_at.startsWith(search.departure))
    .map(r=>({
      amountJPY:r.price, // provider requested JPY (not a conversion estimate)
      currency:'JPY',origin:r.origin,destination:r.destination,
      departureAt:r.departure_at,returnAt:r.return_at||null,
      transfers:Number.isFinite(r.transfers)?r.transfers:null,
      source:'Travelpayouts / Aviasales cached user searches',
      indicative:true, baggageIncluded:null, taxesConfirmed:false,foundAt:r.found_at||null,
    })).sort((a,b)=>a.amountJPY-b.amountJPY).slice(0,8);
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','public, s-maxage=600, stale-while-revalidate=300');
  if(req.method!=='GET')return res.status(405).json({status:'error',message:'method_not_allowed'});
  const search=parseIndicativeSearch(req.query||{});
  if(!search)return res.status(400).json({status:'error',message:'valid_IATA_and_departure_required'});
  const token=process.env.TRAVELPAYOUTS_API_TOKEN;
  if(!token){
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({status:'not_connected',fares:[],message:'Travelpayoutsの商用API利用許可とトークンが未設定です。'});
  }
  const params=new URLSearchParams({
    origin:search.origin,destination:search.destination,
    departure_at:search.departure,one_way:'true',
    direct:String(search.direct),sorting:'price',limit:'20',page:'1',
    currency:'jpy',market:'jp',
  });
  try{
    const abort=new AbortController();
    const timer=setTimeout(()=>abort.abort(),6500);
    let response;
    try{
      response=await fetch('https://api.travelpayouts.com/aviasales/v3/prices_for_dates?'+params,{
        signal:abort.signal,headers:{'X-Access-Token':token,'Accept':'application/json'},
      });
    }finally{clearTimeout(timer);}
    if(!response.ok)throw new Error('upstream_status_'+response.status);
    const data=await response.json();
    return res.status(200).json({
      status:'cached_indicative',fares:cleanIndicativeFares(data,search),
      currency:'JPY',observedAt:new Date().toISOString(),
      notice:'過去の検索で見つかった参考価格です。リアルタイム空席・販売価格・燃油/税/手荷物を含む最終支払額ではなく、最安値保証もありません。',
    });
  }catch{
    res.setHeader('Cache-Control','no-store');
    return res.status(503).json({status:'temporarily_unavailable',fares:[],message:'参考航空券データを取得できませんでした。公式サイトでご確認ください。'});
  }
}
