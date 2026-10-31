import { useEffect, useState } from 'react';
import { WATCH_STORAGE_KEY, makePriceTarget, parsePriceTargets, savePriceTarget, priceTargetLink, watchQueryId, evaluatePriceTarget } from '../shared/priceTargets.js';
const yen = n => '¥' + Number(n).toLocaleString('ja-JP');

function readLocalTargets() {
  if (typeof window === 'undefined') return [];
  try { return parsePriceTargets(window.localStorage.getItem(WATCH_STORAGE_KEY)); }
  catch { return []; }
}

export default function PriceTargetMemo({ query, data, loading }) {
  const [items, setItems] = useState([]);
  const [targetInput, setTargetInput] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { setItems(readLocalTargets()); }, []);

  function persist(next) {
    try {
      window.localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      return true;
    } catch {
      setMessage('ブラウザーで保存が許可されていません。この端末では目標価格を保存できません。');
      return false;
    }
  }
  function addTarget(event) {
    event.preventDefault();
    const target = makePriceTarget(query, targetInput);
    if (!target) {
      setMessage('検索後、1円〜999,999,999円の目標商品価格を入力してください。');
      return;
    }
    if (persist(savePriceTarget(items, target))) {
      setMessage('この端末に検索条件と目標価格のみ保存しました。価格や商品情報は保存していません。');
      setTargetInput('');
    }
  }
  function removeTarget(item) {
    const id = watchQueryId(item.query);
    if (persist(items.filter(entry => watchQueryId(entry.query) !== id))) setMessage('目標価格メモを削除しました。');
  }

  const canSave = Boolean(query.q || query.jan);
  return <section className="cp-watch" aria-labelledby="cp-watch-title">
    <div className="cp-watch-head">
      <div><h2 id="cp-watch-title">目標価格メモ</h2>
        <p>希望する金額を保存し、次にこのページで検索したときに確認できます。</p></div>
    </div>
    <form className="cp-watch-form" onSubmit={addTarget}>
      <label htmlFor="cp-target-input">この検索の商品価格がいくら以下なら購入を検討しますか？（送料・ポイント差引前）</label>
      <div><input id="cp-target-input" type="number" min="1" max="999999999" step="1"
        inputMode="numeric" placeholder="例：30000" value={targetInput}
        onChange={event => setTargetInput(event.target.value)} disabled={!canSave}/>
        <button type="submit" disabled={!canSave}>目標価格を保存</button></div>
    </form>
    {!canSave && <p className="cp-watch-tip">先に商品名・型番・JANで検索すると、目標価格を設定できます。</p>}
    {message && <p role="status" className="cp-watch-message">{message}</p>}
    {items.length > 0 && <ul className="cp-watch-list">{items.map(item => {
      const id = watchQueryId(item.query);
      const result = evaluatePriceTarget(item, data, query);
      const title = item.query.ref || item.query.q || item.query.jan;
      return <li key={id}>
        <div className="cp-watch-entry">
          <strong>{title}</strong><span>目標 {yen(item.target)}（商品価格）</span>
          <a href={priceTargetLink(item)}>この条件で価格を再確認</a>
          <button type="button" onClick={() => removeTarget(item)} aria-label={title + 'の価格メモを削除'}>削除</button>
        </div>
        {result.status === 'reached' && <p className="cp-watch-reached" role="status">今回取得した型番・JAN照合候補の最小商品価格 {yen(result.lowest)} が目標以下です。送料・仕様・購入条件をリンク先で確認してください。</p>}
        {result.status === 'above' && <p className="cp-watch-observed">今回取得した照合候補の最小商品価格は {yen(result.lowest)} です。目標価格より高い状態です。</p>}
        {result.status === 'not-verified' && !loading && <p className="cp-watch-observed">今回、型番・JAN一致を確認できる出品がないため到達判定しません。</p>}
      </li>;
    })}</ul>}
    <p className="cp-watch-tip">自動監視やメール・プッシュ通知は行いません。再訪問時に最新の検索結果を取得して判定します。楽天などのAPI価格、画像、商品詳細は保存せず、検索条件と希望額だけをこのブラウザーに保存します（最大12件・端末間同期なし）。</p>
  </section>;
}
