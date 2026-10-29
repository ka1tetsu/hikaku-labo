import ads from './ads/index.json';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { HotelComparisonPicker } from './HotelComparison.jsx';

const originals = import.meta.glob('./ads/*.html', { query: '?raw', import: 'default', eager: true });

export default function HotelAds({ destinationId, nights, travelers = 2, rooms = 1, depart = '', checkout = '', disabled = import.meta.env.VITE_RAKUTEN_TRAVEL_DISABLED === 'true' }) {
  if (disabled || !(nights > 0)) return null;
  const matches = ads.filter(ad => ad.destinationId === destinationId && originals['./ads/' + ad.id + '.html']);
  if (!matches.length) return null;
  return <section className="tv-hotel-ads" aria-label="楽天トラベルの宿泊広告">
    <h4>このエリアの掲載宿を確認</h4>
    <p>PR・広告 / 楽天トラベル。日付・人数・部屋数は引き継がれません。空室・支払総額・キャンセル条件は予約先で確認してください。</p>
    {matches.map(ad => <div key={ad.id} className="tv-hotel-ad" onClick={event => {
      if (event.target.closest('a[href^="https://hb.afl.rakuten.co.jp/"]')) recordOutboundClick({ section: 'travel', merchant: 'rakuten-travel', placement: ad.id, sponsored: true });
    }} dangerouslySetInnerHTML={{ __html: originals['./ads/' + ad.id + '.html'] }} />)}
    <HotelComparisonPicker key={[destinationId, nights, travelers, rooms, depart, checkout].join(':')} hotels={matches} nights={nights} travelers={travelers} rooms={rooms} depart={depart} checkout={checkout} />
  </section>;
}
