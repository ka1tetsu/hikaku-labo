import { useMemo, useState } from 'react';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { ORIGINS, addDays, buildFlightLinks, buildRailLinks, buildStayLinks, isoDate } from './bookingLinks.js';
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
export default function BookingHub({ destination, nights, travelers, setTravelers, rooms, setRooms, depart, setDepart }) {
  const [tab, setTab] = useState('stays');
  const [origin, setOrigin] = useState('TYO');
  const [oneWay, setOneWay] = useState(false);
  const adults = travelers;
  const activeTab = nights === 0 ? 'flights' : tab;
  const ret = addDays(depart, Math.max(0, nights));
  const flights = useMemo(() => buildFlightLinks({ originCode: origin, destination, depart, ret, adults, oneWay, config: LINK_CONFIG }), [origin, destination, depart, ret, adults, oneWay]);
  const stays = useMemo(() => buildStayLinks({ destination, checkin: depart, checkout: ret, nights, adults, rooms, config: LINK_CONFIG }), [destination, depart, ret, nights, adults, rooms]);
  const rail = flights.length ? [] : buildRailLinks({ destination, nights, config: LINK_CONFIG });
  const today = isoDate(new Date());

  return <div className="tvw-hub" id="booking">
    <div className="tvw-hub-head">
      <div><span className="tvx-kicker">FLIGHTS &amp; STAYS</span><h3>{destination.emoji} {destination.name}への航空券・ホテルを比較</h3>
        <p>対応する条件を引き継いで、各予約サイトを開けます。楽天は行き先のみ引き継ぎます。価格・空室と残りの条件は予約先で確認してください。</p></div>
      <div className="tvw-tabs" role="tablist" aria-label="検索の種類">
        <button type="button" role="tab" aria-selected={activeTab === 'flights'} className={activeTab === 'flights' ? 'active' : ''} onClick={() => setTab('flights')}>✈️ 航空券</button>
        <button type="button" role="tab" disabled={nights === 0} aria-selected={activeTab === 'stays'} className={activeTab === 'stays' ? 'active' : ''} onClick={() => setTab('stays')}>🏨 ホテル・宿</button>
      </div>
    </div>
    <div className="tvw-hub-form">
      {activeTab === 'flights' && <label>出発地<select value={origin} onChange={e => setOrigin(e.target.value)}>{ORIGINS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select></label>}
      <label>{activeTab === 'flights' ? '出発日' : 'チェックイン'}<input type="date" value={depart} min={today} onChange={e => e.target.value && setDepart(e.target.value)} /></label>
      <label>{activeTab === 'flights' ? (oneWay ? '片道' : '帰着日') : 'チェックアウト'}<input type="date" value={ret} readOnly aria-describedby="tvw-ret-note" /></label>
      <label>人数<select value={adults} onChange={e => setTravelers(Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>大人{n}名</option>)}</select></label>
      {activeTab === 'stays' && <label>部屋数<select value={rooms} onChange={e => setRooms(Number(e.target.value))}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}室</option>)}</select></label>}
      {activeTab === 'flights' && <label className="tvw-check"><input type="checkbox" checked={oneWay} onChange={e => setOneWay(e.target.checked)} />片道</label>}
      <small id="tvw-ret-note">帰着日は上の「宿泊日数」（{nights === 0 ? '日帰り' : nights + '泊'}）から自動計算。各サイトで変更できます。</small>
    </div>
    {activeTab === 'flights' && adults > 9 && <p>航空券リンクは大人9名までです。10名以上は予約先で人数を再設定してください。</p>}
    {activeTab === 'flights' && (flights.length
      ? <BookingLinkList links={flights} placement="hub-flights" />
      : <div className="tvw-hub-empty"><p>{destination.flight ? `${destination.name}は出発地と同じ空港エリアです。` : `${destination.name}には空港がありません（${destination.access}）。`}鉄道・バスでのアクセスがおすすめです。</p><BookingLinkList links={rail} placement="hub-rail" /></div>)}
    {activeTab === 'stays' && <BookingLinkList links={stays} placement="hub-stays" />}
    <AffiliateNote />
  </div>;
}
