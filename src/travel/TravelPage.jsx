import { recordOutboundClick } from '../shared/outboundClient.js';
import { useMemo, useState } from 'react';
import SiteHeader from '../shared/SiteHeader.jsx';
import { calculateTravelBudget } from './budget.js';
import { DESTINATION_CATALOG } from './destinations.js';
import TravelDiscovery from './TravelDiscovery.jsx';
import GlobalTravelSearch from './GlobalTravelSearch.jsx';
import { travelAffiliateEnabled, YAHOO_TRAVEL_A8_CREATIVES } from './a8TravelAds.js';
import './travel.css';
import '../shared/travel-refresh.css';
import './travel-discovery.css';

const yen = (value) => '¥' + value.toLocaleString('ja-JP');
const AD_READY = travelAffiliateEnabled(import.meta.env);

function BookingAd({ variant }) {
  const onAdClick = (event) => {
    if (event.target.closest('a[href^="https://px.a8.net/"]')) {
      recordOutboundClick({ section: 'travel', merchant: 'yahoo-travel', placement: variant, sponsored: true });
    }
  };
  if (!AD_READY) return <div className="tv-ad-placeholder">
    <span className="tv-ad-label">宿泊プランを調べる</span>
    <p>最新の宿泊料金やポイント条件は予約サイトでご確認ください。</p>
    <a href="https://travel.yahoo.co.jp/" target="_blank" rel="noopener noreferrer">Yahoo!トラベルの公式サイト ↗</a>
  </div>;
  return <div className="tv-affiliate-ad" aria-label="Yahoo!トラベル アフィリエイト広告" onClick={onAdClick}>
    <span className="tv-ad-label">PR・広告 / Yahoo!トラベル</span>
    <div dangerouslySetInnerHTML={{ __html: YAHOO_TRAVEL_A8_CREATIVES[variant] }} />
  </div>;
}
const ADVICE = [
  { number: '01', title: '同じ条件で比べる', body: '宿泊日、人数、食事、部屋タイプが違うと料金も変わります。できる限り同じ条件で比較しましょう。' },
  { number: '02', title: '支払総額を確認', body: 'ポイント即時利用やクーポンは条件次第。予約確認画面で実際の支払総額をチェックしましょう。' },
  { number: '03', title: 'キャンセル規定を読む', body: '返金可否、駐車場、現地での追加料金など、見落としやすい条件も確認しましょう。' },
];

function NumberSelect({ label, values, value, onChange, formatter = String }) {
  return <label className="tv-number-field"><span>{label}</span><select value={value} onChange={event => onChange(Number(event.target.value))}>
    {values.map(n => <option key={n} value={n}>{formatter(n)}</option>)}
  </select></label>;
}

export default function TravelPage() {
  const [destination, setDestination] = useState(() => {
    const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('destination');
    return DESTINATION_CATALOG.some(item => item.id === requested) ? requested : 'kyoto';
  });
  const [nights, setNights] = useState(2);
  const [travelers, setTravelers] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [perRoomNight, setPerRoomNight] = useState(15000);
  const [travelPerPerson, setTravelPerPerson] = useState(10000);
  const [foodPerPersonDay, setFoodPerPersonDay] = useState(3500);
  const [otherPerPerson, setOtherPerPerson] = useState(3000);
  const budget = useMemo(() => calculateTravelBudget({ nights, travelers, rooms, perRoomNight, travelPerPerson, foodPerPersonDay, otherPerPerson }), [nights, travelers, rooms, perRoomNight, travelPerPerson, foodPerPersonDay, otherPerPerson]);
  const rows = [
    { name: '宿泊費', total: budget.lodging, color: 'green' },
    { name: '交通費', total: budget.transport, color: 'yellow' },
    { name: '食費', total: budget.meals, color: 'purple' },
    { name: 'その他', total: budget.other, color: 'gray' },
  ];
  const place = DESTINATION_CATALOG.find(x => x.id === destination) || DESTINATION_CATALOG[0];
  return <div className="tv-page">
    <SiteHeader active="travel" />
    <main id="main-content">
      <GlobalTravelSearch onDomesticDestination={setDestination} />
      <TravelDiscovery selectedId={destination} onSelect={setDestination} nights={nights} setNights={setNights} budget={budget}/>

      <section className="tv-wrap tv-planner-section" id="planner">
        <div className="tv-section-heading"><div><span className="tv-eyebrow">YOUR TRAVEL BUDGET</span><h2>{place.name}の旅費を、<br/>まとめてシミュレーション。</h2><p>宿泊先の販売価格ではなく、あなたが入力した金額に基づく予算モデルです。</p></div><span className="tv-free-chip">FREE TOOL</span></div>
        <div className="tv-planner-grid">
          <div className="tv-form"><div className="tv-form-heading"><strong>旅行の条件</strong><small>いつでも変更できます</small></div>
            <label className="tv-destination-label" htmlFor="tv-destination">旅行先エリア</label>
            <select id="tv-destination" className="tv-destination" value={destination} onChange={e => setDestination(e.target.value)}>{DESTINATION_CATALOG.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <p className="tv-hint">{place.note}</p>
            <div className="tv-fields">
              <NumberSelect label="宿泊日数" values={Array.from({length:6},(_,i)=>i)} value={nights} onChange={setNights} formatter={n=>n===0?'日帰り':n+'泊'}/>
              <NumberSelect label="旅行人数" values={Array.from({length:10},(_,i)=>i+1)} value={travelers} onChange={setTravelers} formatter={n=>n+'名'}/>
              <NumberSelect label="部屋数" values={[1,2,3,4,5]} value={rooms} onChange={setRooms} formatter={n=>n+'室'}/>
              <NumberSelect label="1室1泊の宿泊予算" values={[5000,8000,10000,15000,20000,30000,50000,80000,100000]} value={perRoomNight} onChange={setPerRoomNight} formatter={yen}/>
              <NumberSelect label="往復交通費 / 人" values={[0,3000,5000,10000,15000,20000,30000,50000,80000]} value={travelPerPerson} onChange={setTravelPerPerson} formatter={yen}/>
              <NumberSelect label="食費 / 人・日" values={[0,1500,2500,3500,5000,8000,10000,15000]} value={foodPerPersonDay} onChange={setFoodPerPersonDay} formatter={yen}/>
              <NumberSelect label="観光・その他 / 人" values={[0,1000,3000,5000,10000,20000,30000,50000]} value={otherPerPerson} onChange={setOtherPerPerson} formatter={yen}/>
            </div>
            <p className="tv-calculator-note">※ 宿泊費は1室1泊の予算×部屋数×泊数（日帰りは0円）。食費は（泊数＋1日）×人数で計算。実際のホテル料金・空室・税金・ポイント還元を取得したものではありません。</p>
          </div>
          <aside className="tv-result" aria-live="polite"><span className="tv-eyebrow">YOUR ESTIMATED COST</span><h3>旅行費用の目安</h3>
            <div className="tv-total">{yen(budget.total)}<small> / 全員分</small></div><p className="tv-per-person">1人あたり 約 <b>{yen(budget.perPerson)}</b></p>
            <div className="tv-cost-bar">{rows.map(row=><div key={row.name} className={'tv-bar-'+row.color} style={{flex:row.total, display:row.total?'block':'none'}}/>)}{budget.total===0&&<div style={{background:'#e2e6e0',flex:1}}/>}</div>
            <div className="tv-cost-breakdown">{rows.map(row=><div key={row.name}><span><i className={'tv-cost-dot tv-bar-'+row.color}/>{row.name}</span><strong>{yen(row.total)}</strong></div>)}</div>
            <div className="tv-result-booking"><strong>次は宿泊プランを比較</strong><p>宿泊費の目安 {yen(budget.lodging)} に合わせて、日付・人数・食事条件などを揃えてチェック。</p><BookingAd variant="banner234"/></div>
          </aside>
        </div>
      </section>

      <section className="tv-guide" id="guide"><div className="tv-wrap"><span className="tv-eyebrow">BEFORE YOU BOOK</span><h2>予約前に確かめたい、<br/>3つのチェックポイント。</h2><div className="tv-guide-cards">{ADVICE.map(item=><article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></div></section>
      <section className="tv-wrap tv-booking-cta"><div><span className="tv-eyebrow">FIND YOUR STAY</span><h2>実際の宿泊プランを、<br/>自分の条件で探そう。</h2><p>Yahoo!トラベルではエリア・宿泊日・人数などで探せます。表示価格やポイントの適用条件、キャンセル規定は予約前に公式サイトで確認してください。</p></div><BookingAd variant="banner300"/></section>
      <div className="tv-wrap tv-editorial-link"><div><strong>予約前に失敗しないための比較ガイド</strong><p>宿泊費・交通費・食費に加えて、支払総額やキャンセル条件も確認。</p></div><a href="/guides/travel-budget/">宿泊予約のチェックリストを見る ↗</a></div>
      <section className="tv-wrap tv-faq"><span className="tv-eyebrow">Q & A</span><h2>宿泊予約について</h2>
        <details><summary>表示された料金は最新の宿泊料金ですか？</summary><p>いいえ。入力した単価をもとに計算した予算の目安です。実際のプラン価格、空室、ポイント適用条件は予約サイトでご確認ください。</p></details>
        <details><summary>ポイント即時利用・クーポンは計算されますか？</summary><p>自動反映されません。利用資格、支払方法、対象プラン等で条件が異なるため、予約確認画面の金額をご確認ください。</p></details>
        <details><summary>比較ラボで直接予約できますか？</summary><p>できません。比較ラボは旅行予算の計画を支援するサイトです。予約・支払・キャンセル手続きは旅行予約サイトでお願いします。</p></details>
      </section>
    </main>
    <footer className="tv-footer"><div className="tv-wrap tv-footer-columns"><div><strong>✳ 比較ラボトラベル</strong><p>旅の計画をもっとわかりやすく。</p></div><div><b>サイト内リンク</b><a href="/">商品価格比較</a><a href="/tools/">ITツール比較</a><a href="#planner">予算シミュレーション</a></div><div><b>PR・アフィリエイトについて</b><p>当サイトでは広告が掲載される場合があります。広告リンク経由で予約等が成立した場合、当サイトが紹介報酬を受け取ることがあります。A8.netに登録済みのサイトとして広告を掲載しています。広告掲載条件が変更された場合は掲載を停止します。</p></div></div><div className="tv-wrap tv-footer-bottom">© 2026 比較ラボ <a href="#planner">ページ上部へ ↑</a></div></footer>
  </div>;
}
