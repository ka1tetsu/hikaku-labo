import { useEffect, useMemo, useRef, useState } from 'react';
import { rankEnteredQuotes } from './totalCost.js';
import { TRAVEL_PROVIDERS } from './providers.js';
import { globalProviderTarget } from './searchLinkAdapter.js';
import YahooTravelAd from './YahooTravelAd.jsx';
import { googleWebSearch } from './googleDiscovery.js';
import CancellationDecision from './CancellationDecision.jsx';
import { recordFunnelEvent, recordOutboundClick } from '../shared/outboundClient.js';
import './total-cost.css';

const blank=(id,type,providerId='')=>({id,type,providerId,base:'',taxes:'0',extras:'0',discount:'0',points:'0',cancellationFee:'',sameConditions:false});
const yen=n=>n.toLocaleString('ja-JP')+'円';

export default function TotalCostComparator({ searchCriteria = {}, compact = false }){
  const [preference,setPreference]=useState(compact?'price':'balanced');
  const [cancellationDate,setCancellationDate]=useState('');
  const [kind,setKind]=useState('hotel');
  const [offers,setOffers]=useState(()=>[blank(1,'hotel','yahoo-travel'),blank(2,'hotel','rakuten-travel'),...(compact?[blank(3,'hotel','booking')]:[])]);
  const [nextId,setNextId]=useState(compact?4:3);
  const [notice,setNotice]=useState('');
  const recordedReady=useRef(false);
  const providers=TRAVEL_PROVIDERS.filter(x=>x.type===kind);
  const result=useMemo(()=>rankEnteredQuotes(offers,{type:kind,preference,cancellationDate:searchCriteria.departureDate&&cancellationDate>searchCriteria.departureDate?'':cancellationDate}),[offers,kind,preference,cancellationDate,searchCriteria.departureDate]);
  useEffect(()=>{
    if(result.comparisonPossible && !recordedReady.current){
      recordedReady.current=true;
      recordFunnelEvent('travel_quote_ready');
    }
  },[result.comparisonPossible]);
  const edit=(id,key,value)=>setOffers(rows=>rows.map(row=>row.id===id?(key==='providerId'?blank(row.id,kind,value):{...row,[key]:value}):row));
  const setCategory=value=>{setKind(value);setOffers(value==='hotel'?[blank(1,value,'yahoo-travel'),blank(2,value,'rakuten-travel')]:[blank(1,value),blank(2,value)]);setNextId(3);setNotice('');};
  const addOffer=()=>{if(offers.length<4){const unused=providers.find(provider=>!offers.some(row=>row.providerId===provider.id));setOffers(rows=>[...rows,blank(nextId,kind,compact?unused?.id||'':'')]);setNextId(x=>x+1);}};
  const displayProvider=id=>TRAVEL_PROVIDERS.find(p=>p.id===id)?.name||id;
  const visit=id=>{
    const provider=TRAVEL_PROVIDERS.find(p=>p.id===id);
    return provider?globalProviderTarget(provider,searchCriteria):null;
  };
  const handleClick=(id,sponsored)=>recordOutboundClick({section:'travel',merchant:id,placement:'user-quote',sponsored});
  const bestQuote = result.recommended?.quote || null;
  const bestTarget = bestQuote ? visit(bestQuote.providerId) : null;
  const copy=async()=>{
    const lines=['旅行予約の総支払額比較（手入力・予約時の実価格未検証）'].concat(
      result.ranked.map((row,i)=>(i+1)+'. '+displayProvider(row.quote.providerId)+'：スコア '+row.score.toFixed(1)+'、支払総額 '+yen(row.cost.cashPayable)+'、後日ポイント '+yen(row.cost.nonCashPoints)),
      ['予約サイトにて税・手数料・荷物代・取消条件・最新の販売価格を再確認してください。']
    );
    try{await navigator.clipboard.writeText(lines.join('\n'));setNotice('比較結果をコピーしました。');}
    catch{setNotice('コピーできませんでした。');}
  };
  return <section className={'gx-cost-section'+(compact?' gx-cost-integrated':'')} id="travel-total-cost" aria-labelledby="gx-cost-heading">
    {compact?<div className="gx-heading"><h4 id="gx-cost-heading">予約サイト別の料金</h4><p>各社で確認した全員・全泊の金額を入力。同じ宿・客室・食事条件で比較します。料金は手入力です。</p></div>:<div className="gx-heading"><span className="gx-kicker">ALL-IN PRICE CHECK</span>
      <h2 id="gx-cost-heading">予約サイトを比べて、自分に合うプランを選ぶ。</h2>
      <p>各社の予約画面で確認した全員・全泊の金額を入力すると、自動で並び替えます。日付・人数・宿・客室・食事をそろえてください。入力はこの画面だけで計算します。各社料金の自動取得には対応していません。</p>
      <p><a href="/guides/travel-total-cost/">航空券・宿の追加費用を見落とさない比較ガイド →</a></p>
    </div>}
    <div className="gx-cost-preferences">
      <label>大切にすること<select value={preference} onChange={e=>setPreference(e.target.value)}><option value="balanced">料金と取消条件のバランス</option><option value="price">支払総額の安さ</option><option value="flexible">取り消すときの負担の小ささ</option></select></label>
      {preference!=='price'&&<label>取消料を比べる日（予約先の現地時間）<input type="date" max={searchCriteria.departureDate||undefined} value={cancellationDate} onChange={e=>{setCancellationDate(e.target.value);setOffers(rows=>rows.map(row=>({...row,cancellationFee:'',sameConditions:false})));}}/></label>}
      {preference!=='price'&&<p>同じ日・時刻に取り消す場合の料金を各社で確認してください。</p>}
    </div>
    {!compact&&<div className="gx-cost-head"><label htmlFor="gx-cost-kind">比較する旅行サービス</label>
      <select id="gx-cost-kind" value={kind} onChange={e=>setCategory(e.target.value)}>
        <option value="flight">航空券</option><option value="hotel">ホテル・宿泊</option></select>
      <span>ステップ1：各社で金額を確認 → 2：入力 → 3：おすすめ順で選ぶ</span>
    </div>}
    <div className="gx-cost-grid">{offers.map((offer,index)=>{
      const provider=providers.find(p=>p.id===offer.providerId);
      const target=provider?visit(provider.id):null;
      const entry=result.ranked.find(x=>x.quote.id===offer.id);
      return <fieldset className="gx-cost-card" key={offer.id}>
        <legend>{compact?provider?.name||`候補 ${index+1}`:`候補 ${index+1}`}</legend>
        <label>予約サイト<select aria-label="予約サイト" value={offer.providerId} onChange={e=>edit(offer.id,'providerId',e.target.value)}>
          <option value="">サイトを選択</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select></label>
        <label>{compact?'全員・全泊の表示料金（円）':'表示された価格の合計（円）'}<input type="number" min="0" max="999999999" inputMode="numeric"
          placeholder="例：40000" value={offer.base} onChange={e=>edit(offer.id,'base',e.target.value)}/></label>
        <details className="gx-cost-adjustments" open={compact?undefined:true}><summary>税・追加料金・割引・ポイントを調整</summary><div className="gx-cost-details">{[
          ['taxes','別途の税・サービス料'],
          ['extras',kind==='flight'?'荷物・座席・決済手数料':'清掃・現地徴収・追加料金'],
          ['discount','確定している即時値引き'],
          ['points','後日付与されるポイント']
        ].map(([field,label])=><label key={field}>{label}（円）<input type="number" min="0" max="999999999"
          inputMode="numeric" value={offer[field]} onChange={e=>edit(offer.id,field,e.target.value)}/></label>)}</div><p>表示料金に含まれる費用は追加しないでください。後日ポイントは支払額から引きません。</p></details>
        {preference!=='price'&&<label>上で指定した同じ日時のキャンセル料（円）<input type="number" min="0" max="999999999" inputMode="numeric" placeholder="無料なら0、未確認なら空欄" value={offer.cancellationFee} onChange={e=>edit(offer.id,'cancellationFee',e.target.value)}/></label>}
        {!compact&&<label className="gx-cost-confirm"><input type="checkbox" checked={offer.sameConditions} onChange={e=>edit(offer.id,'sameConditions',e.target.checked)}/>
          <span>日付・人数・{kind==='flight'?'片道/往復・荷物条件':'泊数・宿・部屋/食事条件'}が同じで、必要な追加費用も確認済み</span></label>}
        {entry&&<p className="gx-cost-preview">計算した支払総額 <strong>{yen(entry.cost.cashPayable)}</strong></p>}
        {kind==='hotel'&&provider&&searchCriteria.hotelName&&<a className="gx-provider-google" href={googleWebSearch(`site:${new URL(provider.url).hostname} "${searchCriteria.hotelName.replaceAll('"','')}" ${searchCriteria.departureDate||''} ${searchCriteria.returnDate||''} ${searchCriteria.travelers||2}名`)} target="_blank" rel="noopener noreferrer">Googleでこのサイトの同じ宿を探す ↗</a>}
        <div className="gx-cost-buttons">{target&&<a href={target.url} rel={target.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          target="_blank" onClick={()=>handleClick(provider.id,target.sponsored)}>
          {provider.name}で確認 ↗{target.sponsored?'（PR）':''}</a>}
          {compact&&target&&<small className="gx-transfer-note">{target.carriesSearch?target.note:'宿名・日程・人数は予約先で指定'}</small>}
          {offers.length>2&&<button type="button" onClick={()=>setOffers(rows=>rows.filter(x=>x.id!==offer.id))}>この候補を削除</button>}</div>
      </fieldset>;
    })}</div>
    {offers.length<4&&<button className="gx-cost-add" type="button" onClick={addOffer}>＋ 比較候補を追加</button>}
    {compact&&<label className="gx-cost-confirm gx-cost-shared-confirm"><input type="checkbox" checked={offers.every(row=>row.sameConditions)} onChange={e=>{const checked=e.target.checked;setOffers(rows=>rows.map(row=>({...row,sameConditions:checked})));}}/><span>入力した料金は、同じ宿・日程・人数・客室・食事条件で、税・追加費用も確認済み</span></label>}
    <details className="gx-ranking-method"><summary>おすすめスコアの計算方法</summary><p>料金点＝比較内の最低総額÷その候補の総額。取消条件点＝1−指定日時の取消料÷その候補の総額。バランスは料金80%＋取消条件20%、取消負担重視は50%ずつ、料金重視は料金100%で計算し、100点満点で表示します。無料の候補の料金点は1とします。後日ポイント・広告報酬・Google掲載順位は加点しません。</p><p>指定日や取消料が未入力・無効な候補がある場合は、全候補を料金100%で仮並びします。スコアは入力した候補間の比較で、サービス全体の評価ではありません。</p>{compact&&<p>{result.caveat} 最新の空室・料金・返金条件は予約先で確認してください。</p>}</details>
    <div className="gx-cost-result" aria-live="polite"><h3>入力した候補の比較結果</h3>
      {compact&&result.comparisonPossible&&<p>{result.ranked.length}件を比較中。未入力・条件未確認の{result.excludedCount}件は対象外です。</p>}
      {result.comparisonPossible?<><div className="gx-cost-winner"><span>{result.usesCancellation?'入力した条件でおすすめの候補':'料金のみで比較した候補'}</span>
            <strong>{displayProvider(result.recommended.quote.providerId)}</strong>
            <b>{yen(result.recommended.cost.cashPayable)}</b>
            <p>おすすめスコア：{result.recommended.score.toFixed(1)} / 100</p>
            {!result.usesCancellation&&preference!=='price'&&<p>取消料の比較が未完成のため、現在は料金だけで並べています。</p>}
            {bestTarget && <a className="gx-cost-winning-cta" href={bestTarget.url} target="_blank"
              rel={bestTarget.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={() => handleClick(bestQuote.providerId,bestTarget.sponsored)}>
              {displayProvider(bestQuote.providerId)}で最新の金額・空室を確認 ↗{bestTarget.sponsored?'（PR）':''}
            </a>}
            <small>予約サイト側で最終支払額が変わる場合があります。広告料は順位に影響しません。</small>
          </div>
        <ol>{result.ranked.map(row=><li key={row.quote.id}><span>{displayProvider(row.quote.providerId)}</span><strong>{yen(row.cost.cashPayable)} · {row.score.toFixed(1)}点</strong>
          <small>{result.usesCancellation?`指定日時の取消料 ${yen(row.cancellationFee)} / `:""}後日ポイント {yen(row.cost.nonCashPoints)}（支払額から控除せず）</small></li>)}</ol>
        <button className="gx-cost-copy" type="button" onClick={copy}>比較結果をコピー</button>
        {notice&&<p role="status">{notice}</p>}</>
        :<p>異なる2社以上の候補でサイト名・価格・税/追加料金を入力し、同条件であることを確認してください。未入力の候補は比較対象外です。</p>}
      {!compact&&<p className="gx-cost-caveat">{result.caveat}</p>}
      {!compact&&<p className="gx-cost-caveat">後日ポイントは現金支払額から差し引きません。返金可否、現地徴収、価格の通貨、換算レート、最新の空席/空室は予約先で再確認してください。</p>}
    </div>
    {kind==='hotel'&&<YahooTravelAd variant="banner234" placement="cost-yahoo-ad"/>}
    {!compact&&<CancellationDecision />}
  </section>;
}
