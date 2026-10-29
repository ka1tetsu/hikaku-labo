import { useState } from 'react';
import { compareCancellationDecisions } from './cancellationDecision.js';
import { recordFunnelEvent } from '../shared/outboundClient.js';

const yen = value => Math.abs(value).toLocaleString('ja-JP') + '円';

export default function CancellationDecision() {
  const [amounts, setAmounts] = useState({
    flexibleTotal: '', restrictedTotal: '', flexibleFee: '', restrictedFee: '',
  });
  const [sameTerms, setSameTerms] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const result = compareCancellationDecisions(amounts);
  const edit = (field, value) => {
    setAmounts(previous => ({ ...previous, [field]: value }));
    setReviewed(false);
  };
  const submit = event => {
    event.preventDefault();
    if (!result || !sameTerms) return;
    setReviewed(true);
    recordFunnelEvent('travel_cancellation_review');
  };

  return <section className="gx-cancel-decision" id="travel-cancellation" aria-labelledby="gx-cancel-title">
    <div className="gx-heading">
      <span className="gx-kicker">CANCELLATION TRADE-OFF</span>
      <h3 id="gx-cancel-title">返金不可とキャンセル可能。価格差だけで選ばない。</h3>
      <p>候補2つについて、各予約サイトに表示された<strong>予約全体の支払総額</strong>と、<strong>同じタイミングで取り消す場合のキャンセル料</strong>を入力してください。旅行できた場合の節約額と、取り消した場合の負担を比較できます。</p>
    </div>
    <form onSubmit={submit}>
      <div className="gx-cancel-grid">
        <fieldset>
          <legend>A｜キャンセル条件が柔軟なプラン</legend>
          <label>予約全体の支払総額（円）
            <input type="number" min="1" max="999999999" required inputMode="numeric" value={amounts.flexibleTotal}
              onChange={e => edit('flexibleTotal', e.target.value)} placeholder="予約サイトで確認した総額" />
          </label>
          <label>その時点に取り消した場合のキャンセル料（円）
            <input type="number" min="0" max="999999999" required inputMode="numeric" value={amounts.flexibleFee}
              onChange={e => edit('flexibleFee', e.target.value)} placeholder="無料期間内なら0" />
          </label>
        </fieldset>
        <fieldset>
          <legend>B｜キャンセル制約が強いプラン</legend>
          <label>予約全体の支払総額（円）
            <input type="number" min="1" max="999999999" required inputMode="numeric" value={amounts.restrictedTotal}
              onChange={e => edit('restrictedTotal', e.target.value)} placeholder="予約サイトで確認した総額" />
          </label>
          <label>同じ時点に取り消した場合のキャンセル料（円）
            <input type="number" min="0" max="999999999" required inputMode="numeric" value={amounts.restrictedFee}
              onChange={e => edit('restrictedFee', e.target.value)} placeholder="全額負担なら予約総額" />
          </label>
        </fieldset>
      </div>
      <label className="gx-cancel-confirm">
        <input type="checkbox" checked={sameTerms} onChange={e => { setSameTerms(e.target.checked); setReviewed(false); }} />
        <span>宿・部屋・日程・人数・食事等をそろえ、キャンセル料も同じキャンセル日時で確認しました</span>
      </label>
      <button type="submit" className="gx-cancel-action" disabled={!result || !sameTerms}>2つのプランを比較する</button>
      {Object.values(amounts).every(value => value !== '') && !result &&
        <p role="status">正の予約総額と、予約総額以下のキャンセル料を入力してください。</p>}
    </form>
    {reviewed && result && sameTerms && <div className="gx-cancel-result" aria-live="polite">
      <h4>入力した2プランの比較結果</h4>
      <dl>
        <div><dt>予定どおり旅行した場合</dt><dd>{result.savingsIfTravel > 0
          ? 'Bの方が ' + yen(result.savingsIfTravel) + ' 安い'
          : result.savingsIfTravel < 0 ? 'Aの方が ' + yen(result.savingsIfTravel) + ' 安い' : '支払総額は同じ'}</dd></div>
        <div><dt>同じ日時にキャンセルした場合</dt><dd>{result.extraCostIfCancel > 0
          ? 'Bのキャンセル料が ' + yen(result.extraCostIfCancel) + ' 高い'
          : result.extraCostIfCancel < 0 ? 'Aのキャンセル料が ' + yen(result.extraCostIfCancel) + ' 高い' : 'キャンセル料は同じ'}</dd></div>
      </dl>
      {result.cancellationThreshold !== null && <p>参考：旅行する／取り消すの2通りだけを仮定し、取消時の負担と旅行実施時の支払いを加重平均すると、両プランの計算上の分岐点はキャンセル確率 <strong>{(result.cancellationThreshold * 100).toFixed(1)}%</strong> です。これはキャンセル確率の予測でも推奨でもありません。</p>}
      <p>取消料の発生時刻、変更可否、返金方法、追加手数料はプランごとに異なります。条件が変わったら再入力してください。</p>
      <a href="#travel-total-cost">他社の総支払額も比較する →</a>
    </div>}
    <p className="gx-cancel-note">価格の自動取得は行いません。入力値は端末内の計算だけに使用し、サーバーへ送信しません（結果表示の操作回数のみ匿名集計）。「無料キャンセル」でも期限後は料金が発生する場合があります。<a href="/guides/hotel-cancellation/">キャンセル条件の確認方法</a>と<a href="https://travel.rakuten.co.jp/help/point/03.html" target="_blank" rel="noopener noreferrer">楽天トラベルの公式説明</a>を参照してください。</p>
  </section>;
}
