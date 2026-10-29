import { useEffect, useMemo, useState } from 'react';
import { compareManualOffers, MANUAL_STORES } from './manualCompare.js';
import { recordFunnelEvent, recordOutboundClick } from '../shared/outboundClient.js';
import './manual-compare.css';

const money = n => '¥' + n.toLocaleString('ja-JP');
const LABELS = { rakuten: '楽天市場', amazon: 'Amazon', 'yahoo-shopping': 'Yahoo!ショッピング' };
const newRows = () => MANUAL_STORES.map(storeId => ({
  storeId, price: '', shipping: '', discount: '0', points: '0',
}));

export default function ManualStoreCompare({ keyword, stores }) {
  const [rows, setRows] = useState(newRows);
  const [sameProduct, setSameProduct] = useState(false);
  const [sort, setSort] = useState('cash');
  const [reviewed, setReviewed] = useState(false);
  const [opened, setOpened] = useState(false);
  const comparison = useMemo(() => compareManualOffers(rows, { sort }), [rows, sort]);

  useEffect(() => {
    setRows(newRows());
    setSameProduct(false);
    setReviewed(false);
    setOpened(false);
    setSort('cash');
  }, [keyword]);

  const change = (storeId, key, value) => {
    setRows(previous => previous.map(row => row.storeId === storeId ? { ...row, [key]: value } : row));
    setReviewed(false);
  };
  const target = storeId => stores.find(store => store.id === storeId);
  const track = (store, placement) => recordOutboundClick({
    section: 'products', merchant: store.id, placement, sponsored: store.sponsored,
  });
  const submit = event => {
    event.preventDefault();
    if (!sameProduct || !comparison.comparisonPossible) return;
    setReviewed(true);
    recordFunnelEvent('product_manual_ready');
  };

  return <section className="cp-manual" id="cp-manual" aria-labelledby="cp-manual-heading">
    <div className="cp-manual-head">
      <div><span className="cp-kicker">PRICE CHECK / MANUAL</span>
        <h2 id="cp-manual-heading">自動取得できない価格も、3ショップで比較。</h2>
        <p>各ショップで<strong>同じ商品・同じ型番と容量</strong>を確認し、販売ページの税込価格を入力。送料・確定済みの即時値引きを含む現金支払額で比べられます。ログインや価格データの送信は不要です。</p>
      </div>
      {!opened && <button className="cp-manual-open" type="button" onClick={() => setOpened(true)}>自分で確認した価格を比較する →</button>}
    </div>
    {opened && <form onSubmit={submit}>
      <div className="cp-manual-steps" aria-label="比較の手順"><span>1. ショップで同型番を確認</span><span>2. 税・送料を入力</span><span>3. 同条件で比較</span></div>
      <div className="cp-manual-rows">{rows.map(row => {
        const link = target(row.storeId);
        return <fieldset className="cp-manual-row" key={row.storeId}>
          <legend>{LABELS[row.storeId]}</legend>
          {link && <a className="cp-manual-external" target="_blank" href={link.url} rel={link.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
            onClick={() => track(link, 'manual-research')}>{LABELS[row.storeId]}で商品を探す ↗{link.sponsored && <small> PR</small>}</a>}
          <p>検索結果で型番・状態・販売者を確認し、価格を転記してください。</p>
          <div className="cp-manual-fields">
            {[
              ['price','商品の税込価格','例：39800'],
              ['shipping','送料（無料なら0）','未確認なら空欄'],
              ['discount','確定済みの即時値引き','なければ0'],
              ['points','後日付与ポイント相当額','なければ0']
            ].map(([key,label,placeholder]) =>
              <label key={key}>{label}（円）
                <input type="number" min="0" max="999999999" inputMode="numeric" placeholder={placeholder}
                  value={row[key]} onChange={e => change(row.storeId,key,e.target.value)} />
              </label>)}
          </div>
        </fieldset>;
      })}</div>
      <label className="cp-manual-confirm"><input type="checkbox" checked={sameProduct} onChange={e => { setSameProduct(e.target.checked); setReviewed(false); }}/>
        <span>入力した候補はすべて<strong>同じ商品・型番・容量・新品/中古の条件</strong>で、送料と即時値引きの対象条件を確認した（未入力の候補は比較対象外）</span>
      </label>
      <div className="cp-manual-actions">
        <button className="cp-manual-submit" type="submit" disabled={!sameProduct || !comparison.comparisonPossible}>入力した価格を比較する</button>
        <label>結果の並び順
          <select value={sort} onChange={e => { setSort(e.target.value); setReviewed(false); }}>
            <option value="cash">現金支払額が安い順</option>
            <option value="points">ポイント考慮後の参考額順</option>
          </select>
        </label>
      </div>
      {!comparison.comparisonPossible && <p className="cp-manual-hint">異なる2ショップ以上で「商品価格」と「送料」を入力してください。送料不明・未入力の場合、0円とはみなしません。値引きとポイントは現金支払額以下にしてください。</p>}
      {reviewed && sameProduct && comparison.comparisonPossible && <div className="cp-manual-results" aria-live="polite">
        <h3>入力した候補の比較結果</h3>
        {comparison.sort === 'points' && <p>以下の順位は後日ポイントを差し引いた参考額順です。実際に支払う現金額とは異なります。</p>}
        <ol>{comparison.ranked.map((entry, index) => {
          const link = target(entry.row.storeId);
          return <li key={entry.row.storeId}>
            <div><span>{index + 1}位　{LABELS[entry.row.storeId]}</span>
              <strong>{money(entry.cost.cashPayable)}</strong>
              <small>現金支払額（税込商品価格＋確認済み送料−即時値引き）</small>
              <small>後日ポイント {money(entry.cost.points)} ／ ポイント考慮後の参考額 {money(entry.cost.pointsAdjustedIllustration)}</small>
            </div>
            {link && <a href={link.url} target="_blank" rel={link.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
              onClick={() => track(link, 'manual-result')}>このショップで最終条件を確認 ↗{link.sponsored && <small> PR</small>}</a>}
          </li>;
        })}</ol>
        {comparison.ranked.length >= 2 && <p>1位と2位の{comparison.sort === 'points' ? '参考額' : '現金支払額'}の差：<strong>{money(
          (comparison.sort === 'points' ? comparison.ranked[1].cost.pointsAdjustedIllustration - comparison.ranked[0].cost.pointsAdjustedIllustration : comparison.ranked[1].cost.cashPayable - comparison.ranked[0].cost.cashPayable)
        )}</strong>（手入力の候補のみ）</p>}
        <p className="cp-manual-disclosure">実際の販売価格・在庫は確認できません。販売ページで税・送料・決済手数料・クーポン適用・ポイント付与条件・返品方法・保証を再確認してください。世界最安値を保証しません。表示順位は紹介料と無関係です。</p>
      </div>}
    </form>}
    {!opened && <p className="cp-manual-privacy">価格APIが使えない場合でも利用できます。実際の購入や支払は各ショップで行います。</p>}
    {opened && <p className="cp-manual-privacy">価格・送料・入力した商品条件はブラウザ内でのみ計算。比較操作の回数と、外部リンクのクリック種別だけを匿名集計します。</p>}
  </section>;
}
