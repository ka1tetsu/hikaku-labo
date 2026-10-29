import { useEffect, useRef, useState } from 'react';
import { japanToday, parseStaySearch, sortStays } from './staySearch.js';
import { addDays, buildStayLinks } from './bookingLinks.js';
import { BookingLinkList } from './BookingLinks.jsx';
import { LINK_CONFIG } from './linkConfig.js';
import { searchResponse } from '../shared/searchRequest.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import YahooTravelAd from './YahooTravelAd.jsx';

const yen = value => value.toLocaleString('ja-JP') + '円';
const messages = {
  not_connected: '現在、宿泊検索の接続を準備しています。下の予約サイトで条件を確認できます。',
  site_registration_rejected: '現在、宿泊検索に接続できません。下の予約サイトで条件を確認できます。',
  rate_limited: '検索が混み合っています。少し時間をおいて再検索するか、予約サイトで確認してください。',
};
export default function StaySearch() {
  const today = japanToday();
  const [form, setForm] = useState({ place: '', checkin: addDays(today, 1), checkout: addDays(today, 2), adults: '2', breakfast: 'false', onsen: 'false' });
  const [search, setSearch] = useState(null);
  const [state, setState] = useState({ loading: false, data: null, error: '' });
  const [order, setOrder] = useState('price');
  const active = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  const edit = name => event => {
    active.current?.abort(); active.current = null;
    setForm(previous => ({ ...previous, [name]: event.target.type === 'checkbox' ? String(event.target.checked) : event.target.value }));
    setSearch(null); setState({ loading: false, data: null, error: '' });
  };
  async function submit(event) {
    event.preventDefault();
    active.current?.abort();
    const next = parseStaySearch(form);
    if (!next) { setState({ loading: false, data: null, error: '場所は2文字以上、日程は今日以降の1〜30泊、大人は1室1〜10名で指定してください。' }); return; }
    setSearch(next); setState({ loading: true, data: null, error: '' });
    const controller = new AbortController(); active.current = controller;
    try {
      const params = new URLSearchParams(Object.entries(next).map(([key, value]) => [key, String(value)]));
      const response = await searchResponse('/api/stays?' + params, { signal: controller.signal, timeoutMs: 15000 });
      const data = await response.json();
      if (active.current !== controller) return;
      if (!response.ok || data.status !== 'ok' || !Array.isArray(data.offers)) throw new Error(Object.hasOwn(messages, data.status) ? data.status : 'search_unavailable');
      setState({ loading: false, data, error: '' });
    } catch (error) {
      if (active.current !== controller) return;
      setState({ loading: false, data: null, error: error.name === 'TimeoutError' ? '検索に時間がかかっています。再検索するか予約サイトで確認してください。' : Object.hasOwn(messages, error.message) ? messages[error.message] : '宿泊情報を取得できませんでした。予約サイトで直接確認できます。' });
    }
  }
  const nights = search ? (Date.parse(search.checkout) - Date.parse(search.checkin)) / 86400000 : 0;
  const links = search ? buildStayLinks({ destination: { name: search.place, area: 'domestic' }, query: search.place, checkin: search.checkin, checkout: search.checkout, nights, adults: search.adults, rooms: 1, config: LINK_CONFIG }) : [];
  const offers = sortStays(state.data?.offers || [], order);
  const cheapestFirstNight = sortStays(state.data?.offers || [], 'price').find(offer => Number.isSafeInteger(offer.firstNightTotal) && offer.firstNightTotal > 0) || null;
  return <section className="tv-wrap tv-stay-search" id="stay-search" aria-labelledby="stay-search-title">
    <h2 id="stay-search-title">泊まりたい場所と日程から、宿を探す</h2>
    <p>国内の地名・駅名・宿名と宿泊条件を入力。取得できた空室プランから、初泊の参考料金が最も低い候補をすぐ確認できます。Yahoo!トラベルを含む各予約サイトの実際の総額は、下の比較ツールでも確認できます。</p>
    <form onSubmit={submit} className="tv-stay-form">
      <label>場所・駅名・宿名<input type="search" required minLength="2" maxLength="80" placeholder="例：函館、草津温泉、京都駅" value={form.place} onChange={edit('place')} /></label>
      <label>チェックイン<input type="date" required min={today} value={form.checkin} onChange={edit('checkin')} /></label>
      <label>チェックアウト<input type="date" required min={addDays(form.checkin || today, 1)} value={form.checkout} onChange={edit('checkout')} /></label>
      <label>大人の人数（1室）<select aria-label="大人の人数（1室）" value={form.adults} onChange={edit('adults')}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}名</option>)}</select></label>
      <label className="tv-stay-check"><input type="checkbox" checked={form.breakfast === 'true'} onChange={edit('breakfast')} />朝食付き</label>
      <label className="tv-stay-check"><input type="checkbox" checked={form.onsen === 'true'} onChange={edit('onsen')} />温泉あり</label>
      <button className="vl-primary" disabled={state.loading} type="submit">{state.loading ? '空室を確認しています…' : '空室のある宿を探す'}</button>
    </form>
    <p className="tv-stay-note">現在は大人のみ・1室の検索です。複数室・子どもを含む予約は予約サイトで条件を設定してください。</p>
    <div aria-live="polite" aria-busy={state.loading}>
      {state.error && <p role="alert">{state.error}</p>}
      {state.data && <>
        <div className="tv-stay-results-head"><h3>条件に合う宿泊プラン：{offers.length}件</h3><label>並び順<select aria-label="並び順" value={order} onChange={event => setOrder(event.target.value)}><option value="rating">口コミ評価が高い順</option><option value="price">初泊料金が安い順</option></select></label></div>
        {cheapestFirstNight && <div className="tv-stay-best" aria-label="取得した候補の初泊料金が最も低いプラン">
          <div><span>取得した候補で初泊料金が最も低いプラン</span>
            <strong>{cheapestFirstNight.name}</strong><p>初泊1泊分：<b>{yen(cheapestFirstNight.firstNightTotal)}</b></p>
            <small>楽天トラベルから取得した初泊だけの参考額。全泊分の最終支払額・Yahoo!トラベルを含む他社最安値ではありません。</small>
          </div>
          <a href={cheapestFirstNight.url} target="_blank" rel={cheapestFirstNight.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
            onClick={() => recordOutboundClick({section:'travel',merchant:'rakuten-travel',placement:'stay-lowest',sponsored:cheapestFirstNight.sponsored})}>
            {cheapestFirstNight.reservationLink ? 'このプランの総額を確認' : 'この施設の最新プランを見る'} ↗{cheapestFirstNight.sponsored ? '（PR）' : ''}
          </a>
        </div>}
        <p>{search.checkin}〜{search.checkout}・{nights}泊・大人{search.adults}名・1室。場所の検索上位{state.data.candidatesChecked}施設から取得した候補です。全施設の最安・最適を保証するものではありません。</p>
        <p>金額は楽天トラベルから取得した初泊1泊分の合計料金です。全泊分の総額ではありません。評価順は同評価なら初泊料金の安い順。現地徴収分・キャンセル条件・最終総額は予約先で確認してください。</p>
        {offers.length === 0 ? <p>今回の候補に条件の合う空室プランは見つかりませんでした。地域全体の満室を示すものではありません。日程や場所を変えるか、予約サイトで確認してください。</p> : <div className="tv-hotel-table-scroll" role="region" tabIndex="0" aria-label="宿泊プラン比較表（横スクロールできます）"><table className="tv-stay-table"><caption>同じ日程・人数で取得した候補</caption><thead><tr><th scope="col">宿・プラン</th><th scope="col">口コミ</th><th scope="col">初泊1泊分の合計</th><th scope="col">食事</th><th scope="col">最新条件</th></tr></thead><tbody>{offers.map(offer => <tr key={offer.id}><th scope="row">{offer.name}<small>{offer.address}</small><small>{offer.roomName} / {offer.planName}</small></th><td>{offer.rating === null ? '評価なし' : `★${offer.rating}（${offer.reviewCount}件）`}</td><td>{offer.firstNightTotal === null ? '料金未取得' : yen(offer.firstNightTotal)}</td><td>{offer.breakfast ? '朝食あり' : '朝食なし'}・{offer.dinner ? '夕食あり' : '夕食なし'}</td><td><a href={offer.url} target="_blank" rel={offer.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'} onClick={() => recordOutboundClick({ section: 'travel', merchant: 'rakuten-travel', placement: 'stay-search-plan', sponsored: offer.sponsored })}>{offer.reservationLink ? 'プラン・総額を確認' : '施設情報を確認'} ↗{offer.sponsored && '（PR）'}</a></td></tr>)}</tbody></table></div>}
        <p>取得時刻：{new Date(state.data.observedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}（日本時間）。空室・料金は変動します。<a href="https://webservice.rakuten.co.jp/" target="_blank" rel="noopener noreferrer">Powered by Rakuten Web Service</a></p>
      </>}
    </div>
    {search && <div className="tv-stay-alternatives"><h3>Yahoo!トラベルなどでも、同じ条件で確認</h3>
        <p>「最安値」は一つの予約サイト内でも日付・部屋・クーポンで変わります。Yahoo!トラベルを含む他社の税込・追加料金込み総額を確認し、同じ条件で比べてください。</p>
        <YahooTravelAd variant="banner234" placement="stay-yahoo-ad" />
        <BookingLinkList links={links} placement="stay-search-fallback" />
        <a className="tv-stay-compare-action" href="#travel-total-cost">Yahoo!トラベルと他社の支払総額を比較する →</a>
      </div>}
  </section>;
}
