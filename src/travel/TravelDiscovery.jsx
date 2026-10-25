import { useMemo, useRef, useState } from 'react';
import { DESTINATION_CATALOG, DOMESTIC_REGIONS, INTERESTS, OVERSEAS_REGIONS } from './destinations.js';
import { COUNTRY_INDEX, countryByCode, flagOf } from './countries.js';
import { suggestDestinations, rankPlanStyles, makeItinerary, shareableTripUrl, SORTS } from './recommender.js';
import { buildPlaceLinks } from './bookingLinks.js';
import { LINK_CONFIG } from './linkConfig.js';
import TravelSearchBox from './TravelSearchBox.jsx';
import BookingHub, { AffiliateNote, BookingLinkList } from './BookingLinks.jsx';

const getCity = id => DESTINATION_CATALOG.find(city=>city.id===id)||DESTINATION_CATALOG[0];
const tags = ids => INTERESTS.filter(i=>ids.includes(i.id)).map(i=>i.label);
const DOMESTIC_COUNT = DESTINATION_CATALOG.filter(d=>d.area==='domestic').length;
const OVERSEAS_COUNT = DESTINATION_CATALOG.length-DOMESTIC_COUNT;
const PAGE = 12;
const placeLabel = d => d.area==='domestic' ? '国内・'+d.region : (countryByCode(d.country)?.name||d.region);
const costLabel = level => '¥'.repeat(level)+'·'.repeat(5-level);

export default function TravelDiscovery({ selectedId, onSelect, nights, setNights, travelers, setTravelers, rooms, setRooms, depart, setDepart, budget, pace, setPace, styleChoice, setStyleChoice, concierge }) {
  const [area,setArea] = useState('all');
  const [region,setRegion] = useState('すべて');
  const [scope,setScope] = useState(null);
  const [interests,setInterests] = useState(['food','history']);
  const [month,setMonth] = useState(0);
  const [maxHours,setMaxHours] = useState(0);
  const [maxCost,setMaxCost] = useState(0);
  const [sort,setSort] = useState('match');
  const [visible,setVisible] = useState(PAGE);
  const [external,setExternal] = useState('');
  const [compareIds,setCompareIds]=useState([]);
  const [copyState,setCopyState]=useState('');
  const resultRef=useRef(null);
  const listRef=useRef(null);
  const destination=getCity(selectedId);
  const ranked=useMemo(()=>rankPlanStyles(destination,{interests,pace}),[destination,interests,pace]);
  const chosenStyle=ranked.find(s=>s.id===styleChoice)||ranked[0];
  const routes=useMemo(()=>makeItinerary(destination,chosenStyle.id,nights,pace),[destination,chosenStyle,nights,pace]);
  const suggested=useMemo(()=>{
    const list=suggestDestinations({chosenId:selectedId,interests,region,area,month,maxHours,maxCost,sort});
    if(!scope) return list;
    return list.filter(d=>(!(scope.countries?.length||scope.regions?.length)||scope.countries?.includes(d.country)||scope.regions?.includes(d.region))
      &&(!scope.area||d.area===scope.area));
  },[selectedId,interests,region,area,month,maxHours,maxCost,sort,scope]);
  const compared=compareIds.map(getCity);
  const regionOptions=area==='domestic'?DOMESTIC_REGIONS:area==='overseas'?OVERSEAS_REGIONS:[...DOMESTIC_REGIONS,...OVERSEAS_REGIONS];

  function goToDestination(city){
    onSelect(city.id);
    setStyleChoice(null);
    setCopyState('');
    setExternal('');
    if(typeof window!=='undefined') {
      const url=new URL(window.location.href);
      url.searchParams.set('destination',city.id);
      window.history.replaceState({},'',url.pathname+url.search);
    }
    resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function applyScope(next){
    setScope(next.countries?.length||next.regions?.length||next.area?next:null);
    if(next.interests?.length) setInterests(next.interests);
    setArea('all');setRegion('すべて');setVisible(PAGE);setExternal('');
    listRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function toggleInterest(id){
    setInterests(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
    setStyleChoice(null);
  }
  function toggleCompare(id){
    setCompareIds(current=>{
      if(current.includes(id)) return current.filter(x=>x!==id);
      if(current.length>=3) return current;
      return [...current,id];
    });
  }
  function resetFilters(){
    setArea('all');setRegion('すべて');setScope(null);setMonth(0);setMaxHours(0);setMaxCost(0);setSort('match');setVisible(PAGE);
  }
  async function copyPlan(){
    if(typeof window==='undefined')return;
    const href=shareableTripUrl(window.location.href,destination.id,chosenStyle.id,nights,pace);
    try{
      await navigator.clipboard.writeText(href);
      setCopyState('プランのリンクをコピーしました');
    }catch{
      setCopyState('ブラウザのアドレスをコピーしてください');
    }
  }
  const externalLinks=external?buildPlaceLinks(external,{config:LINK_CONFIG,nights,adults:travelers}):[];

  return <>
    <section className="tvx-hero" aria-labelledby="tvx-title">
      <div className="tv-wrap tvx-hero-grid">
        <div>
          <div className="tvx-eyebrow"><span className="tvx-sparkle">✳</span> VIVLICA TRAVEL — WORLDWIDE</div>
          <h1 id="tvx-title">世界中から、<br/><em>ぴったりの旅</em>を見つけよう。</h1>
          <p className="tvx-hero-lead">国内も海外も、都市名・国名・名所・「やりたいこと」で検索。AIコンシェルジュに相談すれば、モデルコースから航空券・ホテルの比較、旅の予算までひとつの画面で。</p>
          <TravelSearchBox onDestination={goToDestination} onScope={applyScope} onExternal={setExternal}/>
          <nav className="tv-booking-shortcuts" aria-label="旅行先が決まっている方へ"><a href="#booking">宿・航空券を探す →</a><a href="#planner">旅行予算を計算する →</a></nav>
          {external&&<div className="tvw-external" role="region" aria-label="掲載外の場所の検索">
            <div className="tvw-external-head"><strong>「{external}」を世界中の予約サイトで検索</strong><button type="button" onClick={()=>setExternal('')} aria-label="閉じる">×</button></div>
            <p>編集部のモデルコースは未掲載の場所です。情報を作り話で補わず、宿・航空券・地図を直接検索できるリンクを用意しました。</p>
            <BookingLinkList links={externalLinks} placement="search-external"/>
            <AffiliateNote/>
          </div>}
          <div className="tvx-shortcuts"><span>人気の目的地</span>{['kyoto','naha','seoul','taipei','bangkok','honolulu','paris'].map(id=>{const d=getCity(id);return <button key={id} type="button" onClick={()=>goToDestination(d)}>{d.emoji} {d.name}</button>;})}</div>
          <p className="tvx-hero-note">登録不要 · 国内{DOMESTIC_COUNT}都市＋海外{OVERSEAS_COUNT}都市のモデルコース · {COUNTRY_INDEX.length}の国と地域から検索（宿・交通の予約は各予約サイトで）</p>
        </div>
        <div className="tvx-hero-art" aria-hidden="true">
          <div className="tvx-art-orbit tvx-art-orbit-one"/><div className="tvx-art-orbit tvx-art-orbit-two"/>
          <span className="tvx-art-title">FIND YOUR<br/>NEXT ESCAPE<span>✦</span></span>
          <span className="tvx-art-spot tvx-art-spot-a">⛩️<small>KYOTO</small></span>
          <span className="tvx-art-spot tvx-art-spot-b">🗼<small>PARIS</small></span>
          <span className="tvx-art-spot tvx-art-spot-c">🌺<small>HAWAII</small></span>
          <span className="tvx-art-compass">↗</span>
        </div>
      </div>
    </section>
    <div className="tv-wrap tvx-trust-strip" aria-label="このサイトでできること">
      <div><b>01</b><span>世界の旅先を探す</span></div><div><b>02</b><span>AIに旅を相談</span></div>
      <div><b>03</b><span>航空券・宿を比較</span></div><div><b>04</b><span>旅の予算を計算</span></div>
    </div>

    {concierge}

    <section className="tv-wrap tvx-discover" id="destinations" aria-labelledby="tvx-discover-title" ref={listRef}>
      <div className="tvx-section-header"><div><span className="tvx-kicker">EXPLORE DESTINATIONS</span><h2 id="tvx-discover-title">次の旅先を見つける。</h2><p>エリア・行きたい月・移動時間・旅費感で絞り込み。好きなテーマを選ぶと相性の良い順に並びます。</p></div><span className="tvx-count">国内 {DOMESTIC_COUNT} ＋ 海外 {OVERSEAS_COUNT} 都市</span></div>
      <div className="tvx-filter-panel">
        <div className="tvw-area-tabs" role="group" aria-label="国内・海外">
          {[['all','すべて'],['domestic','🗾 国内'],['overseas','🌏 海外']].map(([id,label])=><button key={id} type="button" aria-pressed={area===id} className={area===id?'active':''}
            onClick={()=>{setArea(id);setRegion('すべて');setScope(null);setVisible(PAGE);}}>{label}</button>)}
        </div>
        <fieldset><legend>旅でしたいこと <small>複数選べます</small></legend>
          <div className="tvx-interest-row">{INTERESTS.map(x=><button key={x.id} type="button" className={interests.includes(x.id)?'active':''}
            aria-pressed={interests.includes(x.id)} onClick={()=>toggleInterest(x.id)}>{x.emoji} {x.label}</button>)}</div>
        </fieldset>
        <div className="tvx-filter-bottom tvw-filter-grid">
          <label>エリア<select value={region} onChange={e=>{setRegion(e.target.value);setScope(null);setVisible(PAGE);}}>
            <option value="すべて">すべて</option>
            {regionOptions.map(r=><option key={r} value={r}>{r}</option>)}
          </select></label>
          <label>行きたい月<select value={month} onChange={e=>{setMonth(Number(e.target.value));setVisible(PAGE);}}>
            <option value={0}>指定なし</option>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1}月がベストシーズン</option>)}
          </select></label>
          <label>東京からの移動<select value={maxHours} onChange={e=>{setMaxHours(Number(e.target.value));setVisible(PAGE);}}>
            <option value={0}>指定なし</option><option value={3}>3時間以内</option><option value={6}>6時間以内</option><option value={10}>10時間以内</option><option value={15}>15時間以内</option>
          </select></label>
          <label>旅費感<select value={maxCost} onChange={e=>{setMaxCost(Number(e.target.value));setVisible(PAGE);}}>
            <option value={0}>指定なし</option><option value={2}>¥¥ まで（安め）</option><option value={3}>¥¥¥ まで</option><option value={4}>¥¥¥¥ まで</option>
          </select></label>
          <label>並び順<select value={sort} onChange={e=>setSort(e.target.value)}>{SORTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        </div>
        <div className="tvw-filter-foot">
          {scope&&<span className="tvw-scope">絞り込み中：{scope.label}<button type="button" onClick={()=>setScope(null)} aria-label="絞り込みを解除">×</button></span>}
          <span className="tvx-filter-caption">移動時間・旅費感（¥1〜5）・ベストシーズンは編集部の目安で、実際の運賃や人気順位ではありません。</span>
          <button type="button" className="tvw-text-button" onClick={resetFilters}>条件をクリア</button>
        </div>
      </div>
      <p className="tvw-result-count" aria-live="polite">{suggested.length}件の旅先</p>
      <div className="tvx-destination-grid">{suggested.slice(0,visible).map(d=>{
        const isSelected=d.id===selectedId;
        const checked=compareIds.includes(d.id);
        const tint=d.interests.includes('beach')?'beach':d.interests.includes('nature')?'nature':d.interests.includes('city')?'city':'culture';
        return <article className={'tvx-destination-card '+tint+(isSelected?' selected':'')} key={d.id}>
          <div className="tvx-destination-cover">
            <div className="tvx-destination-topline"><span>{flagOf(d.country)} {placeLabel(d)}</span><span>{d.interests.filter(i=>interests.includes(i)).length} / {interests.length||0} テーマ一致</span></div>
            <div className="tvx-destination-emblem" aria-hidden="true">{d.emoji}</div>
            <div className="tvx-destination-cover-bottom"><strong>{d.name}</strong><span>{d.nameEn.toUpperCase()}</span></div>
          </div>
          <div className="tvx-destination-content"><p>{d.tagline}</p>
            <dl className="tvw-card-facts">
              <div><dt>移動</dt><dd>{d.area==='domestic'?d.access:'約'+d.hours+'時間'}</dd></div>
              <div><dt>旅費感</dt><dd aria-label={'5段階中'+d.costLevel}>{costLabel(d.costLevel)}</dd></div>
              <div><dt>時期</dt><dd>{d.bestMonths.slice(0,4).join('・')}月{d.bestMonths.length>4?'…':''}</dd></div>
            </dl>
            <div className="tvx-destination-tags">{tags(d.interests).slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div>
            <div className="tvx-destination-actions">
              <button type="button" className="tvx-card-primary" onClick={()=>goToDestination(d)}>{isSelected?'選択中の旅行先':'プランを見る'} <span aria-hidden="true">↗</span></button>
              <button type="button" className={'tvx-card-compare'+(checked?' active':'')} disabled={!checked&&compareIds.length>=3}
                aria-pressed={checked} aria-label={d.name+(checked?'を比較から外す':'を比較に追加')} onClick={()=>toggleCompare(d.id)}>{checked?'✓ 比較中':'+ 比較'}</button>
            </div>
          </div>
        </article>;
      })}</div>
      {suggested.length>visible&&<div className="tvw-more"><button type="button" onClick={()=>setVisible(v=>v+PAGE)}>さらに表示（残り{suggested.length-visible}件）</button></div>}
      {suggested.length===0&&<div className="tvx-empty">この条件に一致する行き先はまだありません。<button type="button" className="tvw-text-button" onClick={resetFilters}>条件をクリア</button></div>}
    </section>

    {compareIds.length>0&&<section className="tv-wrap tvx-comparison" id="compare" aria-labelledby="tvx-compare-title">
      <div className="tvx-section-header"><div><span className="tvx-kicker">DESTINATION COMPARISON</span><h2 id="tvx-compare-title">旅先を横並びで比較。</h2><p>{compareIds.length===1?'あと1つ選ぶと違いが分かりやすくなります。':'目的と立ち寄り先を、同じ条件で比べられます。'}</p></div><button type="button" className="tvx-clear" onClick={()=>setCompareIds([])}>比較をリセット</button></div>
      <div className="tvx-compare-scroll" role="region" tabIndex="0" aria-label="行き先の比較表（左右にスクロールできます）">
        <table><thead><tr><th scope="col">比較項目</th>{compared.map(d=><th scope="col" key={d.id}><strong>{d.emoji} {d.name}</strong><button type="button" onClick={()=>toggleCompare(d.id)} aria-label={d.name+'を比較から外す'}>×</button></th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">国・エリア</th>{compared.map(d=><td key={d.id}>{flagOf(d.country)} {placeLabel(d)}</td>)}</tr>
            <tr><th scope="row">アクセスの目安</th>{compared.map(d=><td key={d.id}>{d.access}</td>)}</tr>
            <tr><th scope="row">ベストシーズン</th>{compared.map(d=><td key={d.id}>{d.bestMonths.join('・')}月</td>)}</tr>
            <tr><th scope="row">旅費感</th>{compared.map(d=><td key={d.id}>{costLabel(d.costLevel)}</td>)}</tr>
            <tr><th scope="row">旅の特徴</th>{compared.map(d=><td key={d.id}>{d.tagline}</td>)}</tr>
            <tr><th scope="row">合うテーマ</th>{compared.map(d=><td key={d.id}>{tags(d.interests).join('・')}</td>)}</tr>
            <tr><th scope="row">王道の立ち寄り先</th>{compared.map(d=><td key={d.id}>{d.routes.classic.slice(0,3).join(' / ')}</td>)}</tr>
            <tr><th scope="row">事前の確認</th>{compared.map(d=><td key={d.id}>{d.note}</td>)}</tr>
            <tr><th scope="row">旅行プラン</th>{compared.map(d=><td key={d.id}><button type="button" className="tvx-table-select" onClick={()=>goToDestination(d)}>コースを表示 →</button></td>)}</tr>
          </tbody>
        </table>
      </div><p className="tvx-table-note">※ 比較は編集部が整理した旅行の特色と目安です。宿泊費・運賃の実売価格や運行時間を比較した表ではありません。</p>
    </section>}

    <section className="tvx-plan-section" id="recommendations" ref={resultRef} aria-labelledby="tvx-plan-title">
      <div className="tv-wrap">
        <div className="tvx-section-header"><div><span className="tvx-kicker">YOUR CUSTOM TRIP</span><h2 id="tvx-plan-title">{destination.emoji} {destination.name}の、おすすめモデルコース。</h2><p>{destination.tagline}。旅行日数と過ごし方から、3つのプランを提案します。</p></div><span className="tvx-result-badge">モデルプラン / 無料</span></div>
        <div className="tvx-trip-controls">
          <label>宿泊日数<select value={nights} onChange={e=>setNights(Number(e.target.value))}>{[0,1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n===0?'日帰り':n+'泊'+(n+1)+'日'}</option>)}</select></label>
          <label>旅行のペース<select value={pace} onChange={e=>{setPace(e.target.value);setStyleChoice(null);}}>
            <option value="relaxed">ゆったり（1日1スポット）</option><option value="standard">ほどよく（1日2スポット）</option><option value="active">たっぷり（1日3スポット）</option></select></label>
          <div className="tvx-trip-controls-note">アクセス：{destination.access}。同じ地域のスポットを中心に提案しますが、訪問順・移動時間は確定ルートではありません。</div>
        </div>
        <div className="tvx-style-grid">{ranked.map((style,index)=><button type="button" key={style.id} aria-pressed={chosenStyle.id===style.id}
          onClick={()=>{setStyleChoice(style.id);setCopyState('');}} className={'tvx-style-card'+(chosenStyle.id===style.id?' active':'')}>
          <span className="tvx-style-emoji">{style.emoji}</span><span className="tvx-style-body"><strong>{style.label}</strong><small>{style.subtitle}</small></span><span className="tvx-style-tag">{index===0?'好みに合う候補':'選択可能'}</span></button>)}</div>
        <div className="tvx-itinerary">
          <div className="tvx-itinerary-header">
            <div><span className="tvx-kicker">SUGGESTED ITINERARY</span><h3>{destination.name}・{chosenStyle.label} <small>{nights===0?'日帰り':nights+'泊'+(nights+1)+'日'}</small></h3><p>おすすめ理由：{tags(destination.interests.filter(i=>interests.includes(i))).join('・')||'この都市の特色'}を楽しみやすい候補です。ベストシーズンの目安は{destination.bestMonths.join('・')}月。</p></div>
            <button type="button" onClick={copyPlan} className="tvx-copy">↗ プランを共有</button>
          </div>
          {copyState&&<p className="tvx-copy-state" role="status">{copyState}</p>}
          <div className="tvx-itinerary-days">{routes.map(day=><div className="tvx-day" key={day.day}>
            <div className="tvx-day-index">DAY <strong>{String(day.day).padStart(2,'0')}</strong></div>
            <div className="tvx-day-contents"><h4>{day.label}</h4><ol>{day.stops.map((stop,index)=><li key={stop}><span aria-hidden="true">{index+1}</span>{stop}</li>)}</ol></div>
          </div>)}</div>
          <div className="tvx-itinerary-source"><span>現地で確認：</span><a href={destination.source} target="_blank" rel="noopener noreferrer">{destination.sourceLabel} ↗</a><span>{destination.note}</span></div>
        </div>
        <BookingHub key={destination.id} destination={destination} nights={nights} travelers={travelers} setTravelers={setTravelers} rooms={rooms} setRooms={setRooms} depart={depart} setDepart={setDepart}/>
        <div className="tvx-plan-bottom">
          <div><strong>旅費も一緒に考える。</strong><p>この旅を実現するための宿泊費・交通費を、ご自身の予算から計算できます。</p></div>
          <a href="#planner" className="tvx-plan-budget-link">この旅の予算を計算する →</a>
          <p className="tvx-budget-preview">現在の入力予算モデル：全員で約 <b>¥{budget.total.toLocaleString('ja-JP')}</b>（宿泊費は指定単価に基づく）</p>
        </div>
      </div>
    </section>
  </>;
}
