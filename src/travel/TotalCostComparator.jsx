import { useEffect, useMemo, useRef, useState } from 'react';
import { compareEnteredQuotes } from './totalCost.js';
import { TRAVEL_PROVIDERS } from './providers.js';
import { globalProviderTarget } from './searchLinkAdapter.js';
import YahooTravelAd from './YahooTravelAd.jsx';
import { recordFunnelEvent, recordOutboundClick } from '../shared/outboundClient.js';
import './total-cost.css';

const blank=(id,type,providerId='')=>({id,type,providerId,base:'',taxes:'0',extras:'0',discount:'0',points:'0',sameConditions:false});
const yen=n=>n.toLocaleString('ja-JP')+'円';

export default function TotalCostComparator({ searchCriteria = {} }){
  const [kind,setKind]=useState('hotel');
  const [offers,setOffers]=useState(()=>[blank(1,'hotel','yahoo-travel'),blank(2,'hotel','rakuten-travel')]);
  const [nextId,setNextId]=useState(3);
  const [notice,setNotice]=useState('');
  const recordedReady=useRef(false);
  const providers=TRAVEL_PROVIDERS.filter(x=>x.type===kind);
  const result=useMemo(()=>compareEnteredQuotes(offers,{type:kind}),[offers,kind]);
  useEffect(()=>{
    if(result.comparisonPossible && !recordedReady.current){
      recordedReady.current=true;
      recordFunnelEvent('travel_quote_ready');
    }
  },[result.comparisonPossible]);
  const edit=(id,key,value)=>setOffers(rows=>rows.map(row=>row.id===id?{...row,[key]:value}:row));
  const setCategory=value=>{setKind(value);setOffers(value==='hotel'?[blank(1,value,'yahoo-travel'),blank(2,value,'rakuten-travel')]:[blank(1,value),blank(2,value)]);setNextId(3);setNotice('');};
  const addOffer=()=>{if(offers.length<4){setOffers(rows=>[...rows,blank(nextId,kind)]);setNextId(x=>x+1);}};
  const displayProvider=id=>TRAVEL_PROVIDERS.find(p=>p.id===id)?.name||id;
  const visit=id=>{
    const provider=TRAVEL_PROVIDERS.find(p=>p.id===id);
    return provider?globalProviderTarget(provider,searchCriteria):null;
  };
  const handleClick=(id,sponsored)=>recordOutboundClick({section:'travel',merchant:id,placement:'user-quote',sponsored});
  const bestQuote = result.cheapestAmongEntered?.quote || null;
  const bestTarget = bestQuote ? visit(bestQuote.providerId) : null;
  const copy=async()=>{
    const lines=['旅行予約の総支払額比較（手入力・予約時の実価格未検証）'].concat(
      result.ranked.map((row,i)=>(i+1)+'. '+displayProvider(row.quote.providerId)+'：支払総額 '+yen(row.cost.cashPayable)+'、後日ポイント '+yen(row.cost.nonCashPoints)),
      ['予約サイトにて税・手数料・荷物代・取消条件・最新の販売価格を再確認してください。']
    );
    try{await navigator.clipboard.writeText(lines.join('\n'));setNotice('比較結果をコピーしました。');}
    catch{setNotice('コピーできませんでした。');}
  };
  return <section className="gx-cost-section" id="travel-total-cost" aria-labelledby="gx-cost-heading">
    <div className="gx-heading"><span className="gx-kicker">ALL-IN PRICE CHECK</span>
      <h2 id="gx-cost-heading">Yahoo!トラベルと他社。<br/>どこが安いか、総額で比べよう。</h2>
      <p>Yahoo!トラベル、楽天トラベル、Booking.comなどの実際の予約画面で価格を確認して入力。宿泊日・人数・部屋条件をそろえ、税・手数料・即時割引も含めて最も支払総額が低い候補を選べます。価格の自動取得や最安値保証ではありません。</p>
      <p><a href="/guides/travel-total-cost/">航空券・宿の追加費用を見落とさない比較ガイド →</a></p>
    </div>
    <div className="gx-cost-head"><label htmlFor="gx-cost-kind">比較する旅行サービス</label>
      <select id="gx-cost-kind" value={kind} onChange={e=>setCategory(e.target.value)}>
        <option value="flight">航空券</option><option value="hotel">ホテル・宿泊</option></select>
      <span>ステップ1：各社で金額を確認 → 2：入力 → 3：安い候補を選ぶ</span>
    </div>
    <div className="gx-cost-grid">{offers.map((offer,index)=>{
      const provider=providers.find(p=>p.id===offer.providerId);
      const target=provider?visit(provider.id):null;
      const entry=result.ranked.find(x=>x.quote.id===offer.id);
      return <fieldset className="gx-cost-card" key={offer.id}>
        <legend>候補 {index+1}</legend>
        <label>予約サイト<select value={offer.providerId} onChange={e=>edit(offer.id,'providerId',e.target.value)}>
          <option value="">サイトを選択</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <label>表示された価格の合計（円）<input type="number" min="0" max="999999999" inputMode="numeric"
          placeholder="例：40000" value={offer.base} onChange={e=>edit(offer.id,'base',e.target.value)}/></label>
        <div className="gx-cost-details">{[
          ['taxes','別途の税・サービス料'],
          ['extras',kind==='flight'?'荷物・座席・決済手数料':'清掃・現地徴収・追加料金'],
          ['discount','確定している即時値引き'],
          ['points','後日付与されるポイント']
        ].map(([field,label])=><label key={field}>{label}（円）<input type="number" min="0" max="999999999"
          inputMode="numeric" value={offer[field]} onChange={e=>edit(offer.id,field,e.target.value)}/></label>)}</div>
        <label className="gx-cost-confirm"><input type="checkbox" checked={offer.sameConditions} onChange={e=>edit(offer.id,'sameConditions',e.target.checked)}/>
          <span>日付・人数・{kind==='flight'?'片道/往復・荷物条件':'泊数・部屋/食事条件'}が同じで、必要な追加費用も確認済み</span></label>
        {entry&&<p className="gx-cost-preview">計算した支払総額 <strong>{yen(entry.cost.cashPayable)}</strong></p>}
        <div className="gx-cost-buttons">{target&&<a href={target.url} rel={target.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          target="_blank" onClick={()=>handleClick(provider.id,target.sponsored)}>
          {provider.name}で確認 ↗{target.sponsored?'（PR）':''}</a>}
          {offers.length>2&&<button type="button" onClick={()=>setOffers(rows=>rows.filter(x=>x.id!==offer.id))}>この候補を削除</button>}</div>
      </fieldset>;
    })}</div>
    {offers.length<4&&<button className="gx-cost-add" type="button" onClick={addOffer}>＋ 比較候補を追加</button>}
    <div className="gx-cost-result" aria-live="polite"><h3>入力した候補の比較結果</h3>
      {result.comparisonPossible?<><div className="gx-cost-winner"><span>入力した候補の中で支払総額が一番低い</span>
            <strong>{displayProvider(result.cheapestAmongEntered.quote.providerId)}</strong>
            <b>{yen(result.cheapestAmongEntered.cost.cashPayable)}</b>
            {result.ranked.length > 1 && result.ranked[1].cost.cashPayable > result.cheapestAmongEntered.cost.cashPayable && <p>次点との差額：{yen(result.ranked[1].cost.cashPayable - result.cheapestAmongEntered.cost.cashPayable)}（手入力による計算）</p>}
            {bestTarget && <a className="gx-cost-winning-cta" href={bestTarget.url} target="_blank"
              rel={bestTarget.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={() => handleClick(bestQuote.providerId,bestTarget.sponsored)}>
              {displayProvider(bestQuote.providerId)}で最新の金額・空室を確認 ↗{bestTarget.sponsored?'（PR）':''}
            </a>}
            <small>予約サイト側で最終支払額が変わる場合があります。広告料は順位に影響しません。</small>
          </div>
        <ol>{result.ranked.map(row=><li key={row.quote.id}><span>{displayProvider(row.quote.providerId)}</span><strong>{yen(row.cost.cashPayable)}</strong>
          <small>後日ポイント {yen(row.cost.nonCashPoints)}（支払額から控除せず）</small></li>)}</ol>
        <button className="gx-cost-copy" type="button" onClick={copy}>比較結果をコピー</button>
        {notice&&<p role="status">{notice}</p>}</>
        :<p>異なる2社以上の候補でサイト名・価格・税/追加料金を入力し、同条件であることを確認してください。未入力の候補は比較対象外です。</p>}
      {kind==='hotel' && <div className="gx-cost-yahoo"><h4>Yahoo!トラベルも比較してみる</h4><p>料金は予約日・人数・ポイントの即時利用によって変わります。他社と同じ条件を確認してください。</p><YahooTravelAd variant="banner300" placement="cost-yahoo-ad" /></div>}
      <p className="gx-cost-caveat">{result.caveat}</p>
      <p className="gx-cost-caveat">後日ポイントは現金支払額から差し引きません。返金可否、現地徴収、価格の通貨、換算レート、最新の空席/空室は予約先で再確認してください。</p>
    </div>
  </section>;
}
