import { useMemo, useState } from 'react';
import { ALL_TRAVEL_DESTINATIONS, autocompleteDestinations, findDestination, parseTravelQuery, buildGeneralItinerary } from './globalSearch.js';
import { TRAVEL_PROVIDERS, TRAVEL_PROVIDER_TYPES, providerTarget } from './providers.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import './global-travel.css';

const yen=n=>'¥'+n.toLocaleString('ja-JP');
const LOCAL_IATA={tokyo:'TYO',osaka:'OSA',sapporo:'SPK',fukuoka:'FUK',naha:'OKA',niigata:'KIJ',nagoya:'NGO',sendai:'SDJ',hakodate:'HKD',hiroshima:'HIJ',nagasaki:'NGS'};

export default function GlobalTravelSearch({ onDomesticDestination, destination, setDestination, nights, setNights, travelers, setTravelers, showHero = true }) {
  const [query,setQuery]=useState('');
  const [parsed,setParsed]=useState(null);
  const [origin,setOrigin]=useState('東京');
  const [departureDate,setDepartureDate]=useState('');
  const [returnDate,setReturnDate]=useState('');
  const [maxBudget,setMaxBudget]=useState('');
  const [nonstop,setNonstop]=useState(false);
  const [checkedBag,setCheckedBag]=useState(false);
  const [refundable,setRefundable]=useState(false);
  const [breakfast,setBreakfast]=useState(false);
  const [rating,setRating]=useState('any');
  const [cabin,setCabin]=useState('economy');
  const [category,setCategory]=useState('flight');
  const [mobileFilters,setMobileFilters]=useState(false);
  const [status,setStatus]=useState('');
  const [fares,setFares]=useState(null);
  const [loadingFares,setLoadingFares]=useState(false);
  const location=useMemo(()=>findDestination(destination),[destination]);
  const supported=useMemo(()=>ALL_TRAVEL_DESTINATIONS.filter(d=>d.country!=='日本'),[]);
  const suggestions=useMemo(()=>autocompleteDestinations(destination,6),[destination]);
  const providers=useMemo(()=>TRAVEL_PROVIDERS.filter(p=>p.type===category),[category]);
  const plan=useMemo(()=>buildGeneralItinerary(location,nights,parsed?.interests||[]),[location,nights,parsed]);
  const originPlace=useMemo(()=>findDestination(origin),[origin]);
  const fromIata=originPlace?.iata||LOCAL_IATA[originPlace?.id]||(/^[A-Za-z]{3}$/.test(origin.trim())?origin.trim().toUpperCase():null);
  const toIata=location?.iata||LOCAL_IATA[location?.id]||(/^[A-Za-z]{3}$/.test(destination.trim())?destination.trim().toUpperCase():null);

  function searchText(event) {
    event.preventDefault();
    if(!query.trim()){setStatus('まず「東京からパリに2人で3泊」などと入力してください。');return;}
    const result=parseTravelQuery(query);
    setParsed(result);
    if(result.origin)setOrigin(result.origin);
    if(result.destination)setDestination(result.destination);
    // A single unrecognized place name still carries through; don't invent attraction details.
    if(!result.destination&&!result.origin&&query.length<=60&&!/予算|まで|から|以下|直行便|キャンセル|朝食|飛行機|航空券/.test(query))
      setDestination(query.trim());
    if(result.departureDate)setDepartureDate(result.departureDate);
    if(result.travelers)setTravelers(result.travelers);
    if(result.nights!==null)setNights(result.nights);
    if(result.budgetJPY!==null)setMaxBudget(result.budgetJPY);
    if(result.nonstop)setNonstop(true);
    if(result.checkedBag)setCheckedBag(true);
    if(result.freeCancellation)setRefundable(true);
    if(result.breakfast)setBreakfast(true);
    setStatus('読み取れた条件を下に反映しました。未対応の条件は各予約サイトで確認してください。');
    setFares(null);
    document.getElementById('global-travel-compare')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function choosePlace(item) {
    setDestination(item.name);
    setFares(null);
    if(!item.international && onDomesticDestination)onDomesticDestination(item.id);
  }
  function summaryText(){
    return [
      '目的地: '+(destination||'未指定'),'出発地: '+(origin||'未指定'),
      '出発: '+(departureDate||'未指定'),'帰着: '+(returnDate||'未指定'),
      '旅行人数: '+travelers+'名','日数: '+(nights===0?'日帰り':nights+'泊'),
      '予算上限: '+(maxBudget?yen(Number(maxBudget)):'未指定'),
      '直行便希望: '+(nonstop?'はい':'指定なし'),
      '受託手荷物: '+(checkedBag?'必要':'指定なし'),
      '無料キャンセル: '+(refundable?'希望':'指定なし'),
      '朝食付き: '+(breakfast?'希望':'指定なし'),
      'ホテル評価条件: '+(rating==='any'?'指定なし':rating+'つ星以上'),
      '航空券クラス: '+cabin,
    ].join('\n');
  }
  async function copyCriteria(){
    try{await navigator.clipboard.writeText(summaryText());setStatus('検索条件をコピーしました。各予約サイトで貼り付け・再設定できます。');}
    catch{setStatus('コピーできないため、以下の条件欄を参照してください。');}
  }
  function providerClick(provider,sponsored){
    recordOutboundClick({section:'travel',merchant:provider.id,placement:'global-'+category,sponsored});
  }
  async function loadFares(){
    if(!fromIata||!toIata||!departureDate){setStatus('参考価格を調べるには、出発地と目的地の空港コードおよび出発日が必要です。');return;}
    if(fromIata===toIata){setStatus('出発地と目的地は異なる都市を入力してください。');return;}
    setLoadingFares(true);
    setFares(null);
    try {
      const params=new URLSearchParams({origin:fromIata,destination:toIata,departure:departureDate,direct:String(nonstop)});
      const response=await fetch('/api/flight-prices?'+params);
      const data=await response.json();
      setFares(data);
    }catch{setFares({status:'temporarily_unavailable',fares:[],message:'現在、参考航空券データを確認できません。公式サイトでお調べください。'});}
    finally{setLoadingFares(false);}
  }
  return <div className="gx-wrap">
    {showHero&&<>
    <section className="gx-hero" aria-labelledby="gx-headline">
      <div className="tv-wrap gx-hero-grid">
        <div className="gx-lede">
          <div className="gx-overline"><span>✳</span> VIVLICA TRAVEL / GLOBAL SEARCH</div>
          <h1 id="gx-headline">旅の「行きたい」を、<br/><em>もっと自由に、もっと賢く。</em></h1>
          <p>国内・海外の旅行先を探して、航空券・ホテル・現地体験まで比較。希望条件を自然な言葉で入力し、検索先をまとめて整理できます。</p>
          <form onSubmit={searchText} className="gx-hero-search" role="search">
            <label htmlFor="gx-free-query">旅の条件を自由に入力</label>
            <div className="gx-search-line"><input id="gx-free-query" value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="例：東京からパリに2人で5泊、直行便、予算20万円以下" maxLength={480}/>
              <button type="submit">条件を読み取る ↗</button></div>
            <div className="gx-examples">試してみる：
              {['東京からパリに2人で5泊、直行便、予算20万円以下','京都に3泊、グルメと歴史、朝食付き','ソウルに2人で2泊、キャンセル無料'].map(x=>
                <button type="button" key={x} onClick={()=>setQuery(x)}>{x}</button>)}
            </div>
          </form>
          <p className="gx-hero-foot">無料で検索 · 現在は独自の条件整理と旅行会社への比較導線を提供 · リアルタイム最安運賃の比較は提携データ接続後</p>
        </div>
        <div className="gx-hero-visual" aria-hidden="true">
          <div className="gx-globe">◎<div className="gx-globe-lines"/></div>
          <span className="gx-floating gx-fl-a">✈️ <small>FLIGHTS</small></span>
          <span className="gx-floating gx-fl-b">🏨 <small>STAYS</small></span>
          <span className="gx-floating gx-fl-c">🌍 <small>WORLDWIDE</small></span>
          <span className="gx-visual-note">EXPLORE MORE<br/>PLAN SMARTER.</span>
        </div>
      </div>
    </section>
    <div className="tv-wrap gx-trust">
      <span>✓ 国内・海外の旅行先に対応</span><span>✓ 細かい条件を自由入力</span>
      <span>✓ 各社で最終価格を確認</span><span>✓ 広告と通常リンクを区別</span>
    </div>
    </>}
    <section id="global-travel-compare" className="tv-wrap gx-workspace" aria-labelledby="gx-workspace-title">
      <div className="gx-heading"><span className="gx-kicker">SEARCH & COMPARE</span><h2 id="gx-workspace-title">条件をそろえて、比較する。</h2>
        <p>検索サイトごとに料金・手荷物・キャンセル条件は異なります。ここではまず検索条件を整理し、実際の予約価格は各社の公式サイトで確認します。</p></div>
      {status&&<p className="gx-status" role="status">{status}</p>}
      {parsed&&<div className="gx-parsed" aria-live="polite"><b>文章から読み取った条件</b>
        <div>{[
          parsed.origin&&'出発：'+parsed.origin,parsed.destination&&'行き先：'+parsed.destination,
          parsed.departureDate&&'日付：'+parsed.departureDate,
          parsed.travelers&&parsed.travelers+'名',parsed.nights!==null&&parsed.nights+'泊',
          parsed.budgetJPY&&'予算：'+yen(parsed.budgetJPY),
          parsed.nonstop&&'直行便',parsed.checkedBag&&'預け荷物',parsed.freeCancellation&&'キャンセル無料',parsed.breakfast&&'朝食付き',
        ].filter(Boolean).map(x=><span key={x}>{x}</span>)}</div>
        <small>規則による文字解析です。生成AIによる推測ではありません。読み取れていない希望条件は各予約サイトでも入力してください。</small>
      </div>}
      <div className="gx-form">
        <div className="gx-fields-top">
          <label>出発地 / 空港都市コード<input value={origin} onChange={e=>setOrigin(e.target.value)} placeholder="例：東京、TYO、ソウル"/></label>
          <label>目的地（世界中の都市名を入力可能）<input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="例：パリ、京都、カトマンズ" list="gx-destinations"/></label>
          <datalist id="gx-destinations">{ALL_TRAVEL_DESTINATIONS.map(item=><option key={item.id} value={item.name}/>)}</datalist>
          <label>出発日<input type="date" value={departureDate} onChange={e=>setDepartureDate(e.target.value)}/></label>
          <label>帰着日（任意）<input type="date" value={returnDate} min={departureDate||undefined} onChange={e=>setReturnDate(e.target.value)}/></label>
        </div>
        {destination.trim()&&suggestions.length>0&&<div className="gx-destination-pills">{suggestions.map(item=><button key={item.id} type="button" onClick={()=>choosePlace(item)}>{item.name} <small>{item.country}</small></button>)}</div>}
        <div className="gx-form-line"><label>旅行人数<select value={travelers} onChange={e=>setTravelers(Number(e.target.value))}>{Array.from({length:10},(_,i)=><option key={i} value={i+1}>{i+1}名</option>)}</select></label>
          <label>宿泊数<select value={nights} onChange={e=>setNights(Number(e.target.value))}>{Array.from({length:15},(_,i)=><option key={i} value={i}>{i===0?'日帰り':i+'泊'}</option>)}</select></label>
          <label>旅行の予算上限（円）<input type="number" inputMode="numeric" min="0" max="10000000" step="1000" value={maxBudget} onChange={e=>setMaxBudget(e.target.value)} placeholder="予算を入力"/></label>
          <button type="button" className="gx-expand-button" aria-expanded={mobileFilters} onClick={()=>setMobileFilters(v=>!v)}>さらに詳細条件 {mobileFilters?'−':'＋'}</button></div>
        <div className={'gx-advanced'+(mobileFilters?' expanded':'')}>
          <div className="gx-flag-row">
            <label><input type="checkbox" checked={nonstop} onChange={e=>setNonstop(e.target.checked)}/>直行便のみ希望</label>
            <label><input type="checkbox" checked={checkedBag} onChange={e=>setCheckedBag(e.target.checked)}/>受託手荷物が必要</label>
            <label><input type="checkbox" checked={refundable} onChange={e=>setRefundable(e.target.checked)}/>無料キャンセル希望</label>
            <label><input type="checkbox" checked={breakfast} onChange={e=>setBreakfast(e.target.checked)}/>朝食付き希望</label>
          </div>
          <div className="gx-select-row"><label>座席クラス<select value={cabin} onChange={e=>setCabin(e.target.value)}><option value="economy">エコノミー</option><option value="premium-economy">プレミアムエコノミー</option><option value="business">ビジネス</option><option value="first">ファースト</option></select></label>
            <label>ホテルのグレード<select value={rating} onChange={e=>setRating(e.target.value)}><option value="any">指定なし</option><option value="3">3つ星以上</option><option value="4">4つ星以上</option><option value="5">5つ星</option></select></label></div>
        </div>
        <div className="gx-form-actions"><button type="button" onClick={copyCriteria}>条件をまとめてコピー <span>↗</span></button>
          <span>外部サービスへ自動入力できない条件は、移動先で設定してください。</span></div>
      </div>
      <div className="gx-summary"><strong>比較条件</strong><p>{origin||'出発地未指定'} → {destination||'目的地未指定'} ／ {departureDate||'日程未指定'} ／ {travelers}名 ／ {maxBudget?yen(Number(maxBudget))+'以下':'予算未指定'} ／ {nonstop?'直行便希望':'乗継条件なし'}</p></div>
      <div className="gx-heading gx-provider-heading"><span className="gx-kicker">TRAVEL PROVIDER DIRECTORY</span><h2>主要旅行サイトで、条件を照合。</h2>
        <p>比較先をタブで切り替えられます。料金を取得できない旅行会社については価格を表示せず、公式の検索ページへ案内します。</p></div>
      <div className="gx-type-tabs" role="tablist" aria-label="旅行サービスの分類">{TRAVEL_PROVIDER_TYPES.map(type=>
        <button role="tab" aria-selected={category===type.id} key={type.id} type="button" onClick={()=>{setCategory(type.id);setFares(null);}} className={category===type.id?'active':''}>{type.emoji} {type.label} <small>{TRAVEL_PROVIDERS.filter(p=>p.type===type.id).length}社</small></button>)}</div>
      <div className="gx-provider-grid">{providers.map(provider=>{
        const target=providerTarget(provider);
        return <article key={provider.id} className="gx-provider-card">
          <div className="gx-provider-top"><span className="gx-provider-avatar">{provider.name.slice(0,1)}</span><div><strong>{provider.name}</strong><small>{provider.capabilities.join('・')}</small></div></div>
          <p>公式サイトに移動し、上の検索条件で最終支払額を確認。</p>
          <div className="gx-provider-bottom"><span>{target.sponsored?'PR・成果報酬リンク':'公式リンク / 報酬計測なし'}</span>
            <a href={target.url} target="_blank" rel={target.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={()=>providerClick(provider,target.sponsored)}>{target.sponsored?'提携ページを見る':'公式サイトで調べる'} ↗</a></div>
        </article>;
      })}</div>
      <div className="gx-live-prices">
        <div><strong>航空券の参考価格データ（連携後に利用可能）</strong><p>Travelpayoutsの商用APIを有効にすると、指定路線の過去検索に基づく参考価格を表示できます。リアルタイムの空席・最終価格・世界最安値ではありません。</p></div>
        <button type="button" disabled={loadingFares||!departureDate||!fromIata||!toIata||fromIata===toIata} onClick={loadFares}>{loadingFares?'取得中…':'参考航空券データを確認 ↗'}</button>
      </div>
      {fares&&<section aria-label="参考航空券データ" className="gx-fare-results">
        <p>{fares.message||fares.notice}</p>
        {fares.fares?.length>0&&<div className="gx-fare-grid">{fares.fares.map((f,i)=><div key={i}><strong>{yen(f.amountJPY)}</strong><span>出発 {f.departureAt?.slice(0,10)}</span><small>{f.transfers===0?'直行便':f.transfers===null?'乗継情報なし':f.transfers+'回乗継'} / 過去検索の参考価格</small></div>)}</div>}
        <small>価格の有効性・税・手荷物・空席・変更/取消条件が確認できないため、最安値としては順位付けしません。購入前に公式予約画面の総額をご確認ください。</small>
      </section>}
      <div className="gx-destination-note">
        <h3>{destination||'世界中の目的地'}のモデル観光プラン</h3>
        {location?<p>{location.country}・{location.tagline}。掲載済みスポットをもとに、無理のない候補を日ごとに整理しています。</p>
          :<p>この場所の詳しい観光データは未収録です。世界中の都市名を入力して検索先を比較できますが、存在しない観光地を生成せず、モデルコースは確認項目中心になります。</p>}
        <div className="gx-days">{plan.slice(0,7).map(d=><div key={d.day}><b>DAY {d.day}</b><span>{d.stops.join(' / ')}</span><small>{d.note}</small></div>)}</div>
        {location&&!location.international&&<a href="#destinations" className="gx-domestic-link" onClick={()=>onDomesticDestination?.(location.id)}>国内エリアの詳しいコースを見る →</a>}
        <p className="gx-caveat">※ 訪問順は移動時間や営業日を検証した行程ではありません。渡航情報・入国規則・ビザ・現地の安全・交通手段は各国の公的機関でご確認ください。</p>
      </div>
      <div className="gx-world-count">国内18都市と海外{supported.length}都市の紹介データを収録。未収録の都市も自由入力で主要旅行サイトへ進めます。</div>
    </section>
  </div>;
}
