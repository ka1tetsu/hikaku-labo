// Quote normalization guard: no fake live prices and no non-comparable "lowest"
// flags. A price can only be called cheapest when at least two same-scope,
 // licensed provider quotes disclose the complete total and were checked recently.
export function normalizeQuote(q){
  if(!q||typeof q!=='object'||typeof q.provider!=='string')return null;
  if(!['flight','hotel','activity','car','connectivity'].includes(q.type))return null;
  if(!Number.isFinite(q.total)||q.total<0||!Number.isSafeInteger(q.total))return null;
  if(!['JPY','USD','EUR'].includes(q.currency))return null;
  if(!q.taxIncluded||!q.feesIncluded||!q.totalForAllTravelers)return null;
  if(!/^[A-Za-z0-9_-]{1,36}$/.test(q.provider))return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(q.departureDate||''))return null;
  if(!Number.isInteger(q.travelers)||q.travelers<=0)return null;
  if(q.type==='flight' && typeof q.baggageIncluded!=='boolean')return null;
  if(!q.sourceLicenseApproved || !q.checkedAt)return null;
  const checked=Date.parse(q.checkedAt);
  if(!Number.isFinite(checked))return null;
  return {...q,checkedAt:new Date(checked).toISOString()};
}
export function compareQuotes(quotes=[],now=Date.now()){
  const valid=quotes.map(normalizeQuote).filter(Boolean).filter(q=>now-Date.parse(q.checkedAt)>=0&&now-Date.parse(q.checkedAt)<=60*60*1000);
  const groups=new Map();
  for(const q of valid){
    // Same supplier scope, dates, currency, passenger count and baggage / breakfast terms.
    const key=[q.type,q.origin||'',q.destination||'',q.departureDate,q.returnDate||'',q.nights??'',q.travelers,
      q.rooms??'',q.currency,q.type==='flight'?q.baggageIncluded:q.type==='hotel'?Boolean(q.breakfastIncluded):''].join('|');
    groups.set(key,[...(groups.get(key)||[]),q]);
  }
  const results=[];
  for(const [key,group] of groups){
    const providers=new Set(group.map(q=>q.provider));
    const ordered=[...group].sort((a,b)=>a.total-b.total);
    results.push({key,offers:ordered,canClaimCheapest:providers.size>=2,best:providers.size>=2?ordered[0]:null});
  }
  return results;
}
