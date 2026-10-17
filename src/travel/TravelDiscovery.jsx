import { useMemo, useRef, useState } from 'react';
import { DESTINATION_CATALOG, DESTINATION_REGIONS, INTERESTS } from './destinations.js';
import { searchDestinations, suggestDestinations, rankPlanStyles, makeItinerary, shareableTripUrl, STYLES } from './recommender.js';

const getCity = id => DESTINATION_CATALOG.find(city=>city.id===id)||DESTINATION_CATALOG[0];
const tags = ids => INTERESTS.filter(i=>ids.includes(i)).map(i=>i.label);

export default function TravelDiscovery({ selectedId, onSelect, nights, setNights, budget }) {
  const [query,setQuery] = useState('');
  const [searchError,setSearchError] = useState('');
  const [region,setRegion] = useState('すべて');
  const [interests,setInterests] = useState(['food','history']);
  const [pace,setPace] = useState(() => {
    const p=typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('pace');
    return ['relaxed','standard','active'].includes(p)?p:'standard';
  });
  const [styleChoice,setStyleChoice]=useState(() => {
    const s=typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('style');
    return STYLES.some(x=>x.id===s)?s:null;
  });
  const [compareIds,setCompareIds]=useState([]);
  const [copyState,setCopyState]=useState('');
  const resultRef=useRef(null);
  const destination=getCity(selectedId);
  const ranked=useMemo(()=>rankPlanStyles(destination,{interests,pace}),[destination,interests,pace]);
  const chosenStyle=ranked.find(s=>s.id===styleChoice)||ranked[0];
  const routes=useMemo(()=>makeItinerary(destination,chosenStyle.id,nights,pace),[destination,chosenStyle,nights,pace]);
  const matches=useMemo(()=>searchDestinations(query),[query]);
  const suggested=useMemo(()=>suggestDestinations({chosenId:selectedId,interests,region}),[selectedId,interests,region]);
  const compared=compareIds.map(getCity);

  function goToDestination(city){
    onSelect(city.id);
    setSearchError('');
    setQuery('');
    setStyleChoice(null);
    setCopyState('');
    if(typeof window!=='undefined') {
      const url=new URL(window.location.href);
      url.searchParams.set('destination',city.id);
      window.history.replaceState({},'',url.pathname+url.search);
    }
    resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function submitSearch(e){
    e.preventDefault();
    const hit=query.trim()?matches[0]:null;
    if(hit) goToDestination(hit);
    else setSearchError('目的地が未入力か、まだ対応していない場所です。下の18都市から選択してください。観光地の情報を捏造せず、掲載都市を順次増やします。');
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
  return <>
    <section className="tvx-hero" aria-labelledby="tvx-title">
      <div className="tv-wrap tvx-hero-grid">
        <div>
          <div className="tvx-eyebrow"><span className="tvx-sparkle">✳</span> HIKAKU LABO TRAVEL</div>
          <h1 id="tvx-title">行きたい場所から、<br/><em>ぴったりの旅</em>を見つけよう。</h1>
          <p className="tvx-hero-lead">目的地を入力するだけで、あなたの好み・日数に合わせたモデルコースを提案。全国の行き先を比べて、旅の予算までひとつの画面で。</p>
          <form className="tvx-search" role="search" onSubmit={submitSearch}>
            <label htmlFor="tvx-destination-search">どこに行きたいですか？</label>
            <div className="tvx-search-control">
              <span aria-hidden="true">⌕</span>
              <input id="tvx-destination-search" type="search" value={query}
                onChange={e=>{setQuery(e.target.value);setSearchError('');}}
                placeholder="例：京都、札幌、金沢、佐渡…" autoComplete="off" list="tvx-destinations"/>
              <datalist id="tvx-destinations">{DESTINATION_CATALOG.map(d=><option key={d.id} value={d.name}/>)}</datalist>
              <button type="submit">プランを探す <span aria-hidden="true">→</span></button>
            </div>
            {query.trim()&&matches.length>0&&<div className="tvx-suggestions" aria-label="目的地の検索候補">
              {matches.slice(0,5).map(d=><button type="button" key={d.id} onClick={()=>goToDestination(d)}>{d.emoji} {d.name}<small>{d.region}</small></button>)}
            </div>}
            {searchError&&<p className="tvx-search-error" role="alert">{searchError}</p>}
          </form>
          <div className="tvx-shortcuts"><span>人気の目的地</span>{['kyoto','tokyo','sapporo','naha'].map(id=>{const d=getCity(id);return <button key={id} type="button" onClick={()=>goToDestination(d)}>{d.name} ↗</button>;})}</div>
          <p className="tvx-hero-note">登録不要 · 国内18都市 · 旅行プランは編集部監修のモデルコース（宿・交通の予約ではありません）</p>
        </div>
        <div className="tvx-hero-art" aria-hidden="true">
          <div className="tvx-art-orbit tvx-art-orbit-one"/><div className="tvx-art-orbit tvx-art-orbit-two"/>
          <span className="tvx-art-title">FIND YOUR<br/>NEXT ESCAPE<span>✦</span></span>
          <span className="tvx-art-spot tvx-art-spot-a">⛩️<small>KYOTO</small></span>
          <span className="tvx-art-spot tvx-art-spot-b">🌺<small>OKINAWA</small></span>
          <span className="tvx-art-spot tvx-art-spot-c">❄️<small>HOKKAIDO</small></span>
          <span className="tvx-art-compass">↗</span>
        </div>
      </div>
    </section>

    <div className="tv-wrap tvx-trust-strip" aria-label="このサイトでできること">
      <div><b>01</b><span>旅行先を探す</span></div><div><b>02</b><span>モデルコースを選ぶ</span></div>
      <div><b>03</b><span>行き先を比較</span></div><div><b>04</b><span>予算と宿を確認</span></div>
    </div>

    <section className="tv-wrap tvx-discover" id="destinations" aria-labelledby="tvx-discover-title">
      <div className="tvx-section-header"><div><span className="tvx-kicker">EXPLORE DESTINATIONS</span><h2 id="tvx-discover-title">次の旅先を見つける。</h2><p>好きな旅行スタイルを選ぶと、相性の良い行き先が先に表示されます。</p></div><span className="tvx-count">国内 {DESTINATION_CATALOG.length} 都市</span></div>
      <div className="tvx-filter-panel">
        <fieldset><legend>旅でしたいこと <small>複数選べます</small></legend>
          <div className="tvx-interest-row">{INTERESTS.map(x=><button key={x.id} type="button" className={interests.includes(x.id)?'active':''}
            aria-pressed={interests.includes(x.id)} onClick={()=>toggleInterest(x.id)}>{x.emoji} {x.label}</button>)}</div>
        </fieldset>
        <div className="tvx-filter-bottom">
          <label htmlFor="tvx-region">エリアで絞り込む</label>
          <select id="tvx-region" value={region} onChange={e=>setRegion(e.target.value)}>
            {DESTINATION_REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
          </select>
          <span className="tvx-filter-caption">おすすめ順は好みとの一致数で並べ替え。実際の人気順位ではありません。</span>
        </div>
      </div>
      <div className="tvx-destination-grid">{suggested.map(d=>{
        const isSelected=d.id===selectedId;
        const checked=compareIds.includes(d.id);
        const tint=d.interests.includes('nature')?'nature':d.interests.includes('city')?'city':'culture';
        return <article className={'tvx-destination-card '+tint+(isSelected?' selected':'')} key={d.id}>
          <div className="tvx-destination-cover">
            <div className="tvx-destination-topline"><span>{d.region}</span><span>{d.interests.filter(i=>interests.includes(i)).length} / {interests.length||0} テーマ一致</span></div>
            <div className="tvx-destination-emblem" aria-hidden="true">{d.emoji}</div>
            <div className="tvx-destination-cover-bottom"><strong>{d.name}</strong><span>{d.id.toUpperCase()}</span></div>
          </div>
          <div className="tvx-destination-content"><p>{d.tagline}</p><div className="tvx-destination-tags">{tags(d.interests).slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div>
            <div className="tvx-destination-actions">
              <button type="button" className="tvx-card-primary" onClick={()=>goToDestination(d)}>{isSelected?'選択中の旅行先':'プランを見る'} <span aria-hidden="true">↗</span></button>
              <button type="button" className={'tvx-card-compare'+(checked?' active':'')} disabled={!checked&&compareIds.length>=3}
                aria-pressed={checked} aria-label={d.name+(checked?'を比較から外す':'を比較に追加')} onClick={()=>toggleCompare(d.id)}>{checked?'✓ 比較中':'+ 比較'}</button>
            </div>
          </div>
        </article>;
      })}</div>
      {suggested.length===0&&<div className="tvx-empty">この条件に一致する行き先はまだありません。エリアを「すべて」に変更してください。</div>}
    </section>

    {compareIds.length>0&&<section className="tv-wrap tvx-comparison" id="compare" aria-labelledby="tvx-compare-title">
      <div className="tvx-section-header"><div><span className="tvx-kicker">DESTINATION COMPARISON</span><h2 id="tvx-compare-title">旅先を横並びで比較。</h2><p>{compareIds.length===1?'あと1つ選ぶと違いが分かりやすくなります。':'目的と立ち寄り先を、同じ条件で比べられます。'}</p></div><button type="button" className="tvx-clear" onClick={()=>setCompareIds([])}>比較をリセット</button></div>
      <div className="tvx-compare-scroll" role="region" tabIndex="0" aria-label="行き先の比較表（左右にスクロールできます）">
        <table><thead><tr><th scope="col">比較項目</th>{compared.map(d=><th scope="col" key={d.id}><strong>{d.emoji} {d.name}</strong><button type="button" onClick={()=>toggleCompare(d.id)} aria-label={d.name+'を比較から外す'}>×</button></th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">エリア</th>{compared.map(d=><td key={d.id}>{d.region}</td>)}</tr>
            <tr><th scope="row">旅の特徴</th>{compared.map(d=><td key={d.id}>{d.tagline}</td>)}</tr>
            <tr><th scope="row">合うテーマ</th>{compared.map(d=><td key={d.id}>{tags(d.interests).join('・')}</td>)}</tr>
            <tr><th scope="row">王道の立ち寄り先</th>{compared.map(d=><td key={d.id}>{d.routes.classic.slice(0,3).join(' / ')}</td>)}</tr>
            <tr><th scope="row">事前の確認</th>{compared.map(d=><td key={d.id}>{d.note}</td>)}</tr>
            <tr><th scope="row">旅行プラン</th>{compared.map(d=><td key={d.id}><button type="button" className="tvx-table-select" onClick={()=>goToDestination(d)}>コースを表示 →</button></td>)}</tr>
          </tbody>
        </table>
      </div><p className="tvx-table-note">※ 比較は編集部が整理した旅行の特色です。宿泊費・交通費の地域別実売価格や運行時間を比較した表ではありません。</p>
    </section>}

    <section className="tvx-plan-section" id="recommendations" ref={resultRef} aria-labelledby="tvx-plan-title">
      <div className="tv-wrap">
        <div className="tvx-section-header"><div><span className="tvx-kicker">YOUR CUSTOM TRIP</span><h2 id="tvx-plan-title">{destination.emoji} {destination.name}の、おすすめモデルコース。</h2><p>{destination.tagline}。旅行日数と過ごし方から、3つのプランを提案します。</p></div><span className="tvx-result-badge">モデルプラン / 無料</span></div>
        <div className="tvx-trip-controls">
          <label>宿泊日数<select value={nights} onChange={e=>setNights(Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option key={n} value={n}>{n===0?'日帰り':n+'泊'+(n+1)+'日'}</option>)}</select></label>
          <label>旅行のペース<select value={pace} onChange={e=>{setPace(e.target.value);setStyleChoice(null);}}>
            <option value="relaxed">ゆったり（1日1スポット）</option><option value="standard">ほどよく（1日2スポット）</option><option value="active">たっぷり（1日3スポット）</option></select></label>
          <div className="tvx-trip-controls-note">同じ地域のスポットを中心に提案しますが、訪問順・移動時間は確定ルートではありません。</div>
        </div>
        <div className="tvx-style-grid">{ranked.map((style,index)=><button type="button" key={style.id} aria-pressed={chosenStyle.id===style.id}
          onClick={()=>{setStyleChoice(style.id);setCopyState('');}} className={'tvx-style-card'+(chosenStyle.id===style.id?' active':'')}>
          <span className="tvx-style-emoji">{style.emoji}</span><span className="tvx-style-body"><strong>{style.label}</strong><small>{style.subtitle}</small></span><span className="tvx-style-tag">{index===0?'好みに合う候補':'選択可能'}</span></button>)}</div>
        <div className="tvx-itinerary">
          <div className="tvx-itinerary-header">
            <div><span className="tvx-kicker">SUGGESTED ITINERARY</span><h3>{destination.name}・{chosenStyle.label} <small>{nights===0?'日帰り':nights+'泊'+(nights+1)+'日'}</small></h3><p>おすすめ理由：{tags(destination.interests.filter(i=>interests.includes(i))).join('・')||'この都市の特色'}を楽しみやすい候補です。</p></div>
            <button type="button" onClick={copyPlan} className="tvx-copy">↗ プランを共有</button>
          </div>
          {copyState&&<p className="tvx-copy-state" role="status">{copyState}</p>}
          <div className="tvx-itinerary-days">{routes.map(day=><div className="tvx-day" key={day.day}>
            <div className="tvx-day-index">DAY <strong>{String(day.day).padStart(2,'0')}</strong></div>
            <div className="tvx-day-contents"><h4>{day.label}</h4><ol>{day.stops.map((stop,index)=><li key={stop}><span aria-hidden="true">{index+1}</span>{stop}</li>)}</ol></div>
          </div>)}</div>
          <div className="tvx-itinerary-source"><span>現地で確認：</span><a href={destination.source} target="_blank" rel="noopener noreferrer">日本政府観光局（JNTO）の旅行先ガイド ↗</a><span>{destination.note}</span></div>
        </div>
        <div className="tvx-plan-bottom">
          <div><strong>旅費も一緒に考える。</strong><p>この旅を実現するための宿泊費・交通費を、ご自身の予算から計算できます。</p></div>
          <a href="#planner" className="tvx-plan-budget-link">この旅の予算を計算する →</a>
          <p className="tvx-budget-preview">現在の入力予算モデル：全員で約 <b>¥{budget.total.toLocaleString('ja-JP')}</b>（宿泊費は指定単価に基づく）</p>
        </div>
      </div>
    </section>
  </>;
}
