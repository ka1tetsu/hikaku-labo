import { upstreamResponse } from '../server/upstream.js';
import { RAKUTEN_AFFILIATE_ID } from '../src/api.js';
import { normaliseHotelDetails, validHotelNo } from '../src/travel/hotelDetails.js';

// Rakuten's 2026-07-31 HotelDetailSearch supports any actual Rakuten hotelNo.
// An approved access key is required; do not crawl or generate fake properties.
export async function findHotelById(id,{env=process.env,request=upstreamResponse}={}){
  if(!validHotelNo(id))return {status:'invalid_id',hotel:null};
  if(!env.RAKUTEN_ACCESS_KEY)return {status:'not_connected',hotel:null};
  const params=new URLSearchParams({
    applicationId:env.RAKUTEN_APP_ID||'4c29f89d-b874-4910-a38b-1d8e0314c2a3',
    format:'json',formatVersion:'1',datumType:'1',responseType:'large',
    hotelNo:id,
  });
  const aff=env.RAKUTEN_AFFILIATE_ID||RAKUTEN_AFFILIATE_ID;
  if(aff)params.set('affiliateId',aff);
  try{
    const reply=await request('https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20260731?'+params,{
      timeoutMs:6500,
      headers:{accessKey:env.RAKUTEN_ACCESS_KEY,Origin:'https://vivlica.com',Referer:'https://vivlica.com/'},
    });
    if(reply.status===404)return {status:'not_found',hotel:null};
    if(!reply.ok){
      const reason=/HTTP_REFERRER_NOT_ALLOWED/i.test(reply.text)?'site_registration_rejected':reply.status===429?'rate_limited':'provider_unavailable';
      return {status:reason,hotel:null};
    }
    const body=JSON.parse(reply.text);
    const hotel=normaliseHotelDetails(body,id);
    return hotel?{status:'ok',hotel}:{status:'not_found',hotel:null};
  }catch{
    return {status:'provider_unavailable',hotel:null};
  }
}
export default async function handler(req,res){
  res.setHeader('Allow','GET');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(req.method!=='GET')return res.status(405).json({status:'method_not_allowed',hotel:null});
  const raw=req.query?.id;
  if(typeof raw!=='string'||!validHotelNo(raw))return res.status(400).json({status:'invalid_id',hotel:null});
  const result=await findHotelById(raw);
  const code=result.status==='ok'?200:result.status==='not_found'?404:result.status==='invalid_id'?400:503;
  res.setHeader('Cache-Control',result.status==='ok'?'public, s-maxage=300, stale-while-revalidate=120':'no-store');
  return res.status(code).json({...result,checkedAt:new Date().toISOString()});
}
