import { useEffect, useMemo, useRef, useState } from 'react';
import { japanToday, parseStaySearch, sortStays, stayRecommendation } from './staySearch.js';
import { hotelPagePath } from './hotelDetails.js';
import { addDays, buildStayLinks } from './bookingLinks.js';
import { LINK_CONFIG } from './linkConfig.js';
import { searchResponse } from '../shared/searchRequest.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import TotalCostComparator from './TotalCostComparator.jsx';
import { googleTravelDiscovery, googleWebSearch } from './googleDiscovery.js';
import './hotel-search.css';

const yen=value=>value.toLocaleString('ja-JP')+'円';
const messages={
  not_connected:'現在、楽天トラベルの宿泊検索APIが未接続です。下の予約サイトで直接確認できます。',
  site_registration_rejected:'宿泊候補を取得できませんでした。下の各社検索で同じ日程の宿を探し、確認した総額を比較できます。',
  rate_limited:'検索が混み合っています。少し時間をおいて再検索してください。',
};
const number=value=>Number.isSafeInteger(value)&&value>0?value:null;

export default function StaySearch(){
  const today=japanToday();
  const [form,setForm]=useState({place:'',checkin:addDays(today,1),checkout:addDays(today,2),adults:'2',breakfast:'false',onsen:'false'});
  const [comparisonHotel,setComparisonHotel]=useState('');
  const [search,setSearch]=useState(null);
  const [state,setState]=useState({loading:false,data:null,error:''});
  const [order,setOrder]=useState('recommended');
  const [view,setView]=useState('cards');
  const [maxPrice,setMaxPrice]=useState('');
  const [minRating,setMinRating]=useState('0');
  const [showBreakfast,setShowBreakfast]=useState(false);
  const [nameFilter,setNameFilter]=useState('');
  const [selected,setSelected]=useState([]);
  const active=useRef(null);
  useEffect(()=>()=>active.current?.abort(),[]);
  const edit=name=>event=>{
    active.current?.abort();active.current=null;
    setForm(current=>{
      const value=event.target.type==='checkbox'?String(event.target.checked):event.target.value;
      const next={...current,[name]:value};
      if(name==='checkin'&&value&&next.checkout<=value)next.checkout=addDays(value,1);
      return next;
    });
    setComparisonHotel('');
    setSearch(null);setSelected([]);
    setState({loading:false,data:null,error:''});
  };
  async function runSearch(page=1){
    active.current?.abort();
    const next=parseStaySearch({...form,page});
    if(!next){setState({loading:false,data:null,error:'場所は2文字以上、日程は今日以降の1〜30泊、大人は1室1〜10名で指定してください。'});return;}
    if(page===1){setMaxPrice('');setMinRating('0');setNameFilter('');setShowBreakfast(false);setOrder('recommended');}
    setSearch(next);setState({loading:true,data:null,error:''});setSelected([]);
    const controller=new AbortController();active.current=controller;
    try{
      const params=new URLSearchParams(Object.entries(next).map(([key,value])=>[key,String(value)]));
      const response=await searchResponse('/api/stays?'+params,{signal:controller.signal,timeoutMs:15000});
      const data=await response.json();
      if(active.current!==controller)return;
      if(!response.ok||data.status!=='ok'||!Array.isArray(data.offers))throw new Error(Object.hasOwn(messages,data.status)?data.status:'unavailable');
      setState({loading:false,data,error:''});
    }catch(error){
      if(active.current!==controller)return;
      setState({loading:false,data:null,error:error.name==='TimeoutError'?'検索に時間がかかっています。再検索するか予約サイトで確認してください。':Object.hasOwn(messages,error.message)?messages[error.message]:'宿泊情報を取得できませんでした。予約サイトで直接確認できます。'});
    }
  }
  const submit=event=>{event.preventDefault();runSearch(1);};
  const offers=useMemo(()=>sortStays(state.data?.offers||[],order),[state.data,order]);
  const filteredOffers=useMemo(()=>offers.filter(offer=>{
    if(nameFilter.trim()&&!((offer.name+' '+offer.planName+' '+offer.address).toLocaleLowerCase('ja').includes(nameFilter.trim().toLocaleLowerCase('ja'))))return false;
    if(maxPrice && (!number(offer.firstNightTotal)||offer.firstNightTotal>Number(maxPrice)))return false;
    if(Number(minRating)>0 && (offer.rating===null||offer.rating<Number(minRating)))return false;
    if(showBreakfast&&!offer.breakfast)return false;
    return true;
  }),[offers,maxPrice,minRating,showBreakfast,nameFilter]);
  const cheapestFirstNight=sortStays(filteredOffers,'price').find(offer=>number(offer.firstNightTotal))||null;
  const selectedRows=selected.map(id=>filteredOffers.find(offer=>offer.id===id)).filter(Boolean);
  const toggleSelected=id=>setSelected(prev=>prev.includes(id)?prev.filter(item=>item!==id):prev.length<3?[...prev,id]:prev);
  const nights=search?(Date.parse(search.checkout)-Date.parse(search.checkin))/86400000:0;
  const quickSearch=useMemo(()=>parseStaySearch({...form,page:1},today),[form,today]);
  const comparisonSearch=search||quickSearch;
  const comparisonCriteria=comparisonSearch?{
    hotelName:comparisonHotel, departureDate:comparisonSearch.checkin,returnDate:comparisonSearch.checkout,travelers:comparisonSearch.adults,rooms:1,
    stayLinks:buildStayLinks({query:comparisonHotel||comparisonSearch.place,checkin:comparisonSearch.checkin,checkout:comparisonSearch.checkout,nights:(Date.parse(comparisonSearch.checkout)-Date.parse(comparisonSearch.checkin))/86400000,adults:comparisonSearch.adults,rooms:1,config:LINK_CONFIG}),
  }:{};
  const comparisonKey=JSON.stringify([comparisonSearch?.place,comparisonSearch?.checkin,comparisonSearch?.checkout,comparisonSearch?.adults,comparisonHotel]);
  const discover=comparisonSearch?googleTravelDiscovery({place:comparisonHotel||comparisonSearch.place,depart:comparisonSearch.checkin,checkout:comparisonSearch.checkout,adults:comparisonSearch.adults}):[];
  function compareHotel(offer){
    setComparisonHotel(offer.name);
    requestAnimationFrame(()=>document.getElementById('stay-site-comparison')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
  const morePages=state.data?.pageCount>1;
  const booking=(offer,placement)=>recordOutboundClick({section:'travel',merchant:'rakuten-travel',placement,sponsored:offer.sponsored});
  return <section className="tv-wrap tv-stay-search" id="stay-search" aria-labelledby="stay-search-title">
    <div className="hs-heading"><div>
      <h2 id="stay-search-title">日付と場所から探す</h2>
      </div>
      {search&&<a href="#travel-total-cost" className="hs-to-compare">各社の総額を比較 →</a>}</div>
    <form onSubmit={submit} className="tv-stay-form hs-search-form">
      <label>場所・駅名・宿名<input type="search" required minLength="2" maxLength="80" placeholder="例：函館、草津温泉、京都駅" value={form.place} onChange={edit('place')} /></label>
      <label>チェックイン<input type="date" required min={today} value={form.checkin} onChange={edit('checkin')} /></label>
      <label>チェックアウト<input type="date" required min={addDays(form.checkin||today,1)} value={form.checkout} onChange={edit('checkout')} /></label>
      <label>大人の人数（1室）<select value={form.adults} onChange={edit('adults')}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}名</option>)}</select></label>
      <label className="tv-stay-check"><input type="checkbox" checked={form.breakfast==='true'} onChange={edit('breakfast')}/>朝食付き希望</label>
      <label className="tv-stay-check"><input type="checkbox" checked={form.onsen==='true'} onChange={edit('onsen')}/>温泉あり希望</label>
      <button className="vl-primary" disabled={state.loading} type="submit">{state.loading?'空室を確認中…':'この条件で検索'}</button>
    </form>
    <p className="tv-stay-note">国内・大人のみ・1室の検索です。複数室・お子様の人数は予約先で指定してください。すべての宿泊施設の網羅は保証しません。</p>
    <div aria-live="polite" aria-busy={state.loading}>
      {state.error&&<p className="hs-error" role="alert">{state.error}</p>}
      {state.loading&&<div className="hs-loading" role="status"><span>最新の宿泊候補を取得しています…</span></div>}
      {state.data&&<>
        <div className="hs-results-header"><div><span className="hs-kicker">RESULTS / RAKUTEN TRAVEL</span>
          <h3>取得した宿泊プラン {offers.length}件</h3><p>{search.place} ・ {search.checkin}〜{search.checkout} ・ {nights}泊 ・ 大人{search.adults}名 ・ 1室</p></div>
          <div className="hs-view-toggle" role="group" aria-label="結果の表示方法">
            <button type="button" aria-pressed={view==='cards'} onClick={()=>setView('cards')}>▦ カード</button>
            <button type="button" aria-pressed={view==='table'} onClick={()=>setView('table')}>☷ 一覧表</button>
          </div>
        </div>
        <div className="hs-controls">
          <label>並び順<select aria-label="並び順" value={order} onChange={event=>setOrder(event.target.value)}><option value="recommended">おすすめ順（料金＋口コミ件数）</option><option value="price">初泊料金が安い順</option><option value="rating">口コミ評価が高い順</option></select></label>
          <label>初泊の上限（円）<input type="number" min="1" max="999999999" placeholder="指定なし" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}/></label>
          <label>最低口コミ評価<select value={minRating} onChange={e=>setMinRating(e.target.value)}><option value="0">指定なし</option><option value="3.5">3.5以上</option><option value="4">4.0以上</option><option value="4.5">4.5以上</option></select></label>
          <label>施設名・プラン内を検索<input type="search" placeholder="例：露天風呂、駅前" value={nameFilter} maxLength={80} onChange={e=>setNameFilter(e.target.value)}/></label>
          <label className="hs-control-check"><input type="checkbox" checked={showBreakfast} onChange={e=>setShowBreakfast(e.target.checked)}/>朝食ありのみ</label>
          <button type="button" onClick={()=>{setMaxPrice('');setMinRating('0');setNameFilter('');setShowBreakfast(false);}}>条件をクリア</button>
        </div>
        <div className="hs-filter-count"><span>表示中：{filteredOffers.length}件 / 取得 {offers.length}件（{search.page}ページ目）</span><span>絞り込みは取得済み候補にのみ適用されます</span></div>
        <details className="hs-ranking-method"><summary>おすすめ順の理由を見る</summary><p>スコア＝100×［0.6×（取得候補の最低初泊額÷そのプランの初泊額）＋0.4×（口コミ評価÷5）×（口コミ件数÷（口コミ件数＋20））］。口コミの少ない高評価に偏らない計算です。料金未取得は最後に並び、口コミ未取得の加点は0です。広告報酬・Google掲載順位は使いません。取得したページ内だけの相対評価です。</p></details>
        {cheapestFirstNight&&<div className="tv-stay-best"><div><span>現在の表示候補で初泊料金が最も低いプラン</span>
          <strong>{cheapestFirstNight.name}</strong><p>初泊1泊分：<b>{yen(cheapestFirstNight.firstNightTotal)}</b></p>
          <small>楽天トラベルから取得した初泊だけの参考額。全泊分の最終支払額・Yahoo!トラベルを含む他社最安値ではありません。</small></div>
          <a href={cheapestFirstNight.url} target="_blank" rel={cheapestFirstNight.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'} onClick={()=>booking(cheapestFirstNight,'stay-lowest')}>
            {cheapestFirstNight.reservationLink?'プランの総額を確認':'施設の最新プランを見る'} ↗{cheapestFirstNight.sponsored?'（PR）':''}</a></div>}
        <p className="hs-source-note">価格は楽天トラベルの「初泊1泊分の合計」です。全泊分の総額・現地徴収費用や実際の空室は予約先でご確認ください。全ホテル・全予約サイトの最安値ではありません。</p>
        {filteredOffers.length===0?<div className="hs-empty">条件に合う候補が見つかりません。検索条件を緩めるか、別の検索ページで確認してください。</div>
        :view==='cards'?<div className="hs-card-grid">{filteredOffers.map(offer=><article className="hs-hotel-card" key={offer.id}>
          {offer.image?<img src={offer.image} loading="lazy" alt={offer.name+'のホテル・旅館の写真（楽天トラベル提供）'}/>:<div className="hs-photo-empty" aria-hidden="true">🏨</div>}
          <div className="hs-card-body">{order==='recommended'&&<p className="hs-recommend-score">{stayRecommendation(offer,offers)?`おすすめ ${stayRecommendation(offer,offers).score.toFixed(1)}点 / 100`:'料金未取得・順位の評価対象外'}</p>}<div className="hs-card-label">{offer.rating!==null?'★ '+offer.rating.toFixed(2)+'（'+offer.reviewCount+'件）':'口コミ未取得'}{offer.breakfast&&<span>朝食あり</span>}</div>
            <h4>{offer.name}</h4><p>{offer.address}</p><small>{offer.roomName||'客室条件未取得'} / {offer.planName||'宿泊プラン'}</small>
            <div className="hs-price-row"><span>楽天での初泊参考額</span><strong>{offer.firstNightTotal===null?'未取得':yen(offer.firstNightTotal)}</strong></div>
            <div className="hs-card-actions"><a href={hotelPagePath(offer.hotelNo)||'/travel/#stay-search'}>施設の詳細を見る →</a>
              <a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'} onClick={()=>booking(offer,'stay-search-plan')}>
                {offer.reservationLink?'予約時の総額を確認':'楽天で確認'} ↗{offer.sponsored?' PR':''}</a></div>
            <button className="hs-site-compare" type="button" onClick={()=>compareHotel(offer)}>この宿を各社で比較 →</button>
            <button className="hs-compare-toggle" type="button" aria-pressed={selected.includes(offer.id)}
              disabled={!selected.includes(offer.id)&&selected.length>=3}
              onClick={()=>toggleSelected(offer.id)}>{selected.includes(offer.id)?'✓ 比較候補から外す':'＋ 3件まで比較する'}</button>
          </div></article>)}</div>
        :<div className="tv-hotel-table-scroll" role="region" tabIndex="0" aria-label="取得した宿泊プラン一覧（横スクロールできます）"><table className="tv-stay-table">
          <caption>同一検索条件で取得した楽天トラベル宿泊候補</caption><thead><tr><th scope="col">ホテル・旅館</th><th scope="col">口コミ</th><th scope="col">初泊の参考額</th><th scope="col">食事</th><th scope="col">比較・予約</th></tr></thead>
          <tbody>{filteredOffers.map(offer=><tr key={offer.id}><th scope="row">{offer.name}<small>{offer.address}</small><small>{offer.roomName} / {offer.planName}</small></th>
            <td>{offer.rating===null?'評価なし':'★'+offer.rating.toFixed(2)+'（'+offer.reviewCount+'件）'}</td><td>{offer.firstNightTotal===null?'未取得':yen(offer.firstNightTotal)}</td>
            <td>{offer.breakfast?'朝食あり':'朝食なし'} / {offer.dinner?'夕食あり':'夕食なし'}</td><td><a href={hotelPagePath(offer.hotelNo)||'/travel/'}>詳細を見る →</a>
              <a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'} onClick={()=>booking(offer,'stay-search-plan')}>予約先 ↗{offer.sponsored?'（PR）':''}</a>
              <button type="button" onClick={()=>compareHotel(offer)}>各社で比較</button>
              <button type="button" aria-pressed={selected.includes(offer.id)} disabled={!selected.includes(offer.id)&&selected.length>=3} onClick={()=>toggleSelected(offer.id)}>{selected.includes(offer.id)?'比較から外す':'＋ 比較'}</button></td></tr>)}</tbody></table></div>}
        {selectedRows.length>0&&<aside className="hs-selected" aria-label="選択した施設の比較"><div><h4>選択した{selectedRows.length}件を比べる</h4><button type="button" onClick={()=>setSelected([])}>すべて解除</button></div>
          <div className="hs-selected-grid">{selectedRows.map(offer=><article key={offer.id}><strong>{offer.name}</strong>
            <span>初泊：{offer.firstNightTotal!==null?yen(offer.firstNightTotal):'料金未取得'}</span>
            <small>{offer.rating!==null?'★'+offer.rating.toFixed(2):'口コミ未取得'} / {offer.breakfast?'朝食あり':'朝食なし'}</small>
            <a href={hotelPagePath(offer.hotelNo)||'/travel/#stay-search'}>施設詳細へ →</a></article>)}</div>
          <p>施設やプランにより宿泊日・食事・部屋タイプが異なります。初泊額は最終支払額ではありません。</p>
          <a href="#travel-total-cost">Yahoo!トラベルなども含む総額比較へ →</a></aside>}
        {morePages&&<nav className="hs-pagination" aria-label="宿泊施設検索結果ページ">
          <button type="button" disabled={state.loading||search.page<=1} onClick={()=>runSearch(search.page-1)}>← 前の30件</button>
          <span>{search.page} / {state.data.pageCount} ページ（上限100ページ）</span>
          <button type="button" disabled={state.loading||search.page>=state.data.pageCount} onClick={()=>runSearch(search.page+1)}>次の30件 →</button>
        </nav>}
        <p className="hs-source-note">更新確認：{new Date(state.data.observedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}（日本時間）。<a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer">Powered by Rakuten Web Service</a></p>
      </>}
    </div>
    {!search&&<p id="travel-total-cost" className="tv-stay-note">検索後に、同じ宿の予約サイト別比較を利用できます。</p>}
    {search&&comparisonSearch&&<div className="hs-provider-workspace" id="stay-site-comparison">
      <h3>宿を選んで、予約サイトの料金を比較</h3>
      <p>{comparisonSearch.place} · {comparisonSearch.checkin}〜{comparisonSearch.checkout} · 大人{comparisonSearch.adults}名 · 1室</p>
      <label className="hs-hotel-name">比較する宿の名前<input type="search" value={comparisonHotel} maxLength={100} placeholder="候補の宿名を入れると各社で探しやすくなります" onChange={e=>setComparisonHotel(e.target.value)}/></label>
      <details className="hs-google-tools"><summary>Googleで宿・公式情報・地図を探す</summary>
        <p>Googleで候補を探し、最新料金・日程・人数は予約先で確認してください。検索結果はこの画面のおすすめ順位に自動反映されません。</p>
        <div>{discover.slice(0,2).map(link=><a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}
        {comparisonHotel&&<><a href={googleWebSearch(`"${comparisonHotel.replaceAll('"','')}" 公式 客室 キャンセル`)} target="_blank" rel="noopener noreferrer">宿の公式情報を探す ↗</a>
        <a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(comparisonHotel+' '+comparisonSearch.place)} target="_blank" rel="noopener noreferrer">地図で立地を確認 ↗</a></>}</div>
      </details>
      <TotalCostComparator key={comparisonKey} compact searchCriteria={comparisonCriteria}/>
    </div>}
  </section>;
}
