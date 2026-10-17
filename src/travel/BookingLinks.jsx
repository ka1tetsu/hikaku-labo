import { useMemo, useState } from 'react';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { ORIGINS, addDays, buildFlightLinks, buildRailLinks, buildStayLinks, tripDates } from './bookingLinks.js';
import { LINK_CONFIG } from './linkConfig.js';

export function BookingLinkList({ links, placement }) {
  if (!links?.length) return null;
  return <ul className="tvw-links">{links.map(link => <li key={link.provider + link.href}>
    <a href={link.href} target="_blank" rel={link.sponsored ? 'sponsored noopener' : 'noopener noreferrer'}
      onClick={() => recordOutboundClick({ section: 'travel', merchant: link.merchant, placement, sponsored: link.sponsored })}>
      <span className="tvw-link-main"><strong>{link.label}</strong>{link.sponsored && <em className="tvw-pr">PR</em>}</span>
      {link.note && <small>{link.note}</small>}
      <span className="tvw-link-arrow" aria-hidden="true">↗</span>
    </a>
  </li>)}</ul>;
}

export function AffiliateNote() {
  return <p className="tvw-affiliate-note">「PR」表示のリンクはアフィリエイト広告です。経由して予約が成立すると、当サイトが紹介料を受け取る場合があります。並び順は報酬額ではなく固定です。料金・空席・空室は各サイトで確認してください。</p>;
}

// Flight + hotel search for the destination shown in the itinerary.
export default function BookingHub({ destination, nights, travelers }) {
  const [tab, setTab] = useState('flights');
  const [origin, setOrigin] = useState('TYO');
  const [depart, setDepart] = useState(() => tripDates({ nights }).depart);
  const [oneWay, setOneWay] = useState(false);
  const [adults, setAdults] = useState(travelers || 2);
  const ret = addDays(depart, Math.max(1, nights));
  const flights = useMemo(() => buildFlightLinks({ originCode: origin, destination, depart, ret, adults, oneWay, config: LINK_CONFIG }), [origin, destination, depart, ret, adults, oneWay]);
  const stays = useMemo(() => buildStayLinks({ destination, checkin: depart, checkout: ret, adults, rooms: Math.ceil(adults / 2), config: LINK_CONFIG }), [destination, depart, ret, adults]);
  const rail = flights.length ? [] : buildRailLinks({ destination, config: LINK_CONFIG });
  const today = tripDates({ nights: 0, today: new Date() }).depart;

  return <div className="tvw-hub" id="booking">
    <div className="tvw-hub-head">
      <div><span className="tvx-kicker">FLIGHTS &amp; STAYS</span><h3>{destination.emoji} {destination.name}への航空券・ホテルを比較</h3>
        <p>条件を入れると、各予約サイトの検索結果ページを同じ条件で開けます。比較ラボは料金を取得・保存していません。</p></div>
      <div className="tvw-tabs" role="tablist" aria-label="検索の種類">
        <button type="button" role="tab" aria-selected={tab === 'flights'} className={tab === 'flights' ? 'active' : ''} onClick={() => setTab('flights')}>✈️ 航空券</button>
        <button type="button" role="tab" aria-selected={tab === 'stays'} className={tab === 'stays' ? 'active' : ''} onClick={() => setTab('stays')}>🏨 ホテル・宿</button>
      </div>
    </div>
    <div className="tvw-hub-form">
      {tab === 'flights' && <label>出発地<select value={origin} onChange={e => setOrigin(e.target.value)}>{ORIGINS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select></label>}
      <label>{tab === 'flights' ? '出発日' : 'チェックイン'}<input type="date" value={depart} min={today} onChange={e => e.target.value && setDepart(e.target.value)} /></label>
      <label>{tab === 'flights' ? (oneWay ? '片道' : '帰着日') : 'チェックアウト'}<input type="date" value={ret} readOnly aria-describedby="tvw-ret-note" /></label>
      <label>人数<select value={adults} onChange={e => setAdults(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>大人{n}名</option>)}</select></label>
      {tab === 'flights' && <label className="tvw-check"><input type="checkbox" checked={oneWay} onChange={e => setOneWay(e.target.checked)} />片道</label>}
      <small id="tvw-ret-note">帰着日は上の「宿泊日数」（{nights === 0 ? '日帰り' : nights + '泊'}）から自動計算。各サイトで変更できます。</small>
    </div>
    {tab === 'flights' && (flights.length
      ? <BookingLinkList links={flights} placement="hub-flights" />
      : <div className="tvw-hub-empty"><p>{destination.flight ? `${destination.name}は出発地と同じ空港エリアです。` : `${destination.name}には空港がありません（${destination.access}）。`}鉄道・バスでのアクセスがおすすめです。</p><BookingLinkList links={rail} placement="hub-rail" /></div>)}
    {tab === 'stays' && <BookingLinkList links={stays} placement="hub-stays" />}
    <AffiliateNote />
  </div>;
}
