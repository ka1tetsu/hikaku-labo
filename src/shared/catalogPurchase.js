import { buildRakutenAffiliateUrl } from '../api.js';
export function catalogPurchaseTarget(item) {
  if(!item||typeof item!=='object')return null;
  const store=item?.sourceStore;
  if(store&&store!=='rakuten'&&store!=='yahoo')return null;
  const raw=store?item.itemUrl:buildRakutenAffiliateUrl(item,item?.itemName||'');
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
    return {url:url.href,merchant:store==='yahoo'?'yahoo-shopping':'rakuten',label:store==='yahoo'?'Yahoo!ショッピング':'楽天市場',sponsored:store?Boolean(item.sponsored):url.hostname==='hb.afl.rakuten.co.jp'};
  }catch{return null;}
}
