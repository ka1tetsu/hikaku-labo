import { useState } from 'react';
import { hotelQuote, toggleHotel } from './hotelComparison.js';

const yen = value => value.toLocaleString('ja-JP') + '円';

export function HotelComparisonPicker({ hotels, ...trip }) {
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const visible = hotels.filter(hotel => hotel.name.normalize('NFKC').toLocaleLowerCase('ja').includes(query.normalize('NFKC').trim().toLocaleLowerCase('ja')));
  return <div className="tv-hotel-picker">
    <label>比較に追加する宿を探す<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="宿名で絞り込む" /></label>
    <p>このエリアの登録済み施設：{hotels.length}件。楽天トラベルの全施設一覧ではありません。</p>
    <div className="tv-hotel-choices">{visible.map(hotel => <label key={hotel.id}><input type="checkbox" checked={selected.includes(hotel.id)} disabled={!selected.includes(hotel.id) && selected.length >= 4} onChange={() => setSelected(previous => toggleHotel(previous, hotel.id))} />{hotel.name}を比較に追加</label>)}</div>
    {!visible.length && <p>条件に合う登録済みの宿がありません。検索語や旅行先エリアを変更してください。</p>}
    {selected.length >= 4 && <p role="status">比較は4施設までです。入れ替える場合は選択を外してください。</p>}
    <HotelComparison hotels={hotels.filter(hotel => selected.includes(hotel.id))} {...trip} onRemove={id => setSelected(previous => previous.filter(value => value !== id))} />
  </div>;
}

export default function HotelComparison({ hotels, nights, travelers, rooms, depart, checkout, onRemove }) {
  const [quotes, setQuotes] = useState({});
  const [notes, setNotes] = useState({});
  const update = (setter, id) => event => setter(previous => ({ ...previous, [id]: event.target.value }));
  if (!hotels.length) return <p className="tv-hotel-compare-hint">「比較に追加」で最大4施設を横並びにできます。</p>;
  const amounts = hotels.map(hotel => hotelQuote(quotes[hotel.id], { nights, travelers, rooms }));
  return <section className="tv-hotel-compare" aria-label="選んだ宿の比較">
    <h4>選んだ宿を横並びで比較（{hotels.length}/4件）</h4>
    <p>{depart}〜{checkout}・{nights}泊・大人{travelers}名・{rooms}室。各予約先で同じ条件を設定し、全員・全室・全泊分の支払総額を入力してください。税込・食事・部屋タイプ・現地徴収分をそろえて確認しましょう。</p>
    <p>金額とメモはこの画面での手入力です。予約サイトから取得した料金ではありません。旅行条件を変えると入力はリセットされます。</p>
    <div className="tv-hotel-table-scroll" tabIndex="0" role="region" aria-label="宿の比較表（横スクロールできます）">
      <table><caption>予約先で確認した条件の比較</caption><thead><tr><th scope="col">比較項目</th>{hotels.map(hotel => <th scope="col" key={hotel.id}>{hotel.name}<br/><button type="button" onClick={() => onRemove(hotel.id)} aria-label={hotel.name + 'を比較から外す'}>比較から外す</button></th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">全員・全泊の支払総額</th>{hotels.map(hotel => <td key={hotel.id}><label><span className="tv-hotel-input-label">{hotel.name}の総額（円）</span><input type="number" min="1" max="999999999" step="1" inputMode="numeric" placeholder="予約先で確認して入力" value={quotes[hotel.id] || ''} onChange={update(setQuotes, hotel.id)} /></label></td>)}</tr>
          <tr><th scope="row">1人あたり（全泊分）</th>{hotels.map((hotel, i) => <td key={hotel.id}>{amounts[i] ? yen(amounts[i].perPerson) : '未入力'}</td>)}</tr>
          <tr><th scope="row">1室1泊あたり</th>{hotels.map((hotel, i) => <td key={hotel.id}>{amounts[i] ? yen(amounts[i].perRoomNight) : '未入力'}</td>)}</tr>
          <tr><th scope="row">部屋・食事・キャンセル条件</th>{hotels.map(hotel => <td key={hotel.id}><label><span className="tv-hotel-input-label">{hotel.name}の条件メモ</span><textarea maxLength="500" placeholder="例：禁煙・朝食付き・無料キャンセル期限" value={notes[hotel.id] || ''} onChange={update(setNotes, hotel.id)} /></label></td>)}</tr>
        </tbody>
      </table>
    </div>
    <p>入力内容は送信・保存しません。空室・料金は変動するため、予約確定前に最新の条件をご確認ください。</p>
  </section>;
}
