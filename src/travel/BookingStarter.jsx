import { useState } from 'react';
import { addDays, buildStayLinks } from './bookingLinks.js';
import { japanToday } from './staySearch.js';
import { LINK_CONFIG } from './linkConfig.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import YahooTravelAd from './YahooTravelAd.jsx';
const start=()=>addDays(japanToday(),7);
export function validBooking(f,today=japanToday()){
  const n=(Date.parse(f.checkout)-Date.parse(f.checkin))/86400000;
  return f.place.trim().length>=2&&f.checkin>=today&&Number.isInteger(n)&&n>=1&&n<=14?{...f,nights:n}:null;
}
export default function BookingStarter(){
  const [f,setF]=useState(()=>({place:'',checkin:start(),checkout:addDays(start(),2),adults:2,rooms:1}));
  const [result,setResult]=useState(null);
  const change=(k,v)=>{setF(x=>({...x,[k]:v,...(k==='checkin'?{checkout:addDays(v,2)}:{})}));setResult(null);};
  const links=result?buildStayLinks({destination:{name:result.place,area:'domestic'},checkin:result.checkin,checkout:result.checkout,nights:result.nights,adults:result.adults,rooms:result.rooms,config:LINK_CONFIG}):[];
  return <section id="stay-booking" className="tv-wrap tvw-hub">
    <h2>ホテルの予約先を、日付と人数から比較</h2>
    <p>楽天トラベル・Booking.com・Expedia・Yahoo!トラベルを確認できます。価格は予約先で確認してください。</p>
    <form className="tvw-hub-form" onSubmit={e=>{e.preventDefault();setResult(validBooking(f));}}>
      <label>泊まる場所<input type="search" required minLength={2} maxLength={80} value={f.place} placeholder="京都駅・箱根温泉など" onChange={e=>change('place',e.target.value)}/></label>
      <label>チェックイン<input type="date" required min={japanToday()} value={f.checkin} onChange={e=>change('checkin',e.target.value)}/></label>
      <label>チェックアウト<input type="date" required min={addDays(f.checkin,1)} max={addDays(f.checkin,14)} value={f.checkout} onChange={e=>change('checkout',e.target.value)}/></label>
      <label>大人<select value={f.adults} onChange={e=>change('adults',+e.target.value)}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></label>
      <label>部屋<select value={f.rooms} onChange={e=>change('rooms',+e.target.value)}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
      <button type="submit">予約サイトを比較する ↗</button>
    </form>
    {result&&<div className="tvw-hub">
      <h3>{result.place}・{result.checkin}〜{result.checkout}・{result.adults}名・{result.rooms}室</h3>
      <ul className="tvw-links">{links.map(link=><li key={link.provider}><a href={link.href} target="_blank" rel={link.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
        onClick={()=>recordOutboundClick({section:'travel',merchant:link.merchant,placement:'stay-quick',sponsored:link.sponsored})}>
        <strong>{link.label}{link.sponsored?'（PR）':''}</strong><small>{link.note}／価格は予約先で確認</small></a></li>)}</ul>
      <YahooTravelAd variant="banner234" placement="stay-quick-yahoo"/>
      <p>Yahoo!トラベルでは日付・人数を再設定してください。比較は最終支払額で行ってください。</p>
      <a href="#travel-total-cost">確認した支払総額を比較する →</a>
    </div>}
  </section>;
}
