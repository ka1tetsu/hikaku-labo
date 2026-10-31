import {buildStayLinks,addDays} from './bookingLinks.js';
import {LINK_CONFIG} from './linkConfig.js';
import {itineraryStayArea,itineraryHotelNights} from './itineraryNearbyHotels.js';
import {recordOutboundClick} from '../shared/outboundClient.js';

const mapUrl=name=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+' 東京');
function hotelSearch(name,{depart,nights,travelers,rooms}) {
  const links=buildStayLinks({query:name+' 東京',checkin:depart,checkout:addDays(depart,nights),
    nights,adults:travelers,rooms,config:LINK_CONFIG});
  return links.find(link=>link.provider==='booking')||null;
}
export default function ItineraryNearbyHotels({destination,day,nights,depart,travelers,rooms}) {
  if(!itineraryHotelNights(nights,day))return null;
  const area=itineraryStayArea(destination,day);
  const info={depart,nights,travelers,rooms};
  const fallback=buildStayLinks({destination,checkin:depart,checkout:addDays(depart,nights),
    nights,adults:travelers,rooms,config:LINK_CONFIG}).find(link=>link.provider==='booking');
  return <section className="tvx-day-hotels" aria-label={day.day+'日目の観光に便利な宿泊候補'}>
    <div className="tvx-day-hotels-header">
      <div><span>この日の観光エリアに便利な宿</span>
        <h5>{area?area.label+' のホテル候補':destination.name+' のホテルを探す'}</h5></div>
      <span>{day.day}泊目の観光エリア</span>
    </div>
    {area?<><p className="tvx-day-hotels-help">{area.why}。旅行中にホテルを毎日替える必要はありません。以下の宿は<strong>全{nights}泊を同じホテルで探す</strong>ための候補です。</p>
      <ul className="tvx-day-hotel-list">{area.hotels.map(hotel=>{
        const book=hotelSearch(hotel.name,info);
        return <li key={hotel.id} className="tvx-day-hotel">
          <div className="tvx-day-hotel-info"><strong>{hotel.name}</strong>
            <span>{hotel.location}</span><small>{hotel.access}（{hotel.source}）</small>
          </div>
          <div className="tvx-day-hotel-links">
            <a href={hotel.url} target="_blank" rel="noopener noreferrer">公式サイトで立地確認 ↗</a>
            <a href={mapUrl(hotel.name)} target="_blank" rel="noopener noreferrer">地図 ↗</a>
            {book&&<a className="tvx-hotel-booking" href={book.href} target="_blank"
              rel={book.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={()=>recordOutboundClick({section:'travel',merchant:book.merchant,placement:'itinerary-hotel',sponsored:book.sponsored})}>
              宿泊日で探す ↗{book.sponsored&&<small> PR</small>}</a>}
          </div>
        </li>;
      })}</ul></>:
      <p className="tvx-day-hotels-help">この都市のホテル名・距離を確認できるデータはありません。実在しない宿を表示せず、予約サイトで観光地周辺のホテルを探せます。</p>}
    {fallback&&<a className="tvx-hotel-area-search" href={fallback.href} target="_blank"
      rel={fallback.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
      onClick={()=>recordOutboundClick({section:'travel',merchant:fallback.merchant,placement:'itinerary-area',sponsored:fallback.sponsored})}>
      {area?area.label+'以外も含めて'+destination.name+'の宿を検索':destination.name+'のホテル検索結果を見る'} ↗
      {fallback.sponsored&&<small> PR</small>}</a>}
    <p className="tvx-day-hotels-disclaimer">
      宿泊日：{depart}〜{addDays(depart,nights)}／大人{travelers}名・{rooms}室で検索サイトへ移動します。
      空室・宿泊料金・評価は取得していません。予約サイトで宿名、泊数、人数、部屋、支払総額を再確認してください。
    </p>
  </section>;
}
