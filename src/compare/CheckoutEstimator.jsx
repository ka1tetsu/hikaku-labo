import { useState } from 'react';
import { checkoutComparison } from '../shared/checkoutEstimate.js';
import { offerKey, shippingLabel } from '../shared/compareWorkbench.js';

const yen = value => '¥' + Math.round(value).toLocaleString('ja-JP');

export default function CheckoutEstimator({ offers }) {
  const [adjustments, setAdjustments] = useState({});
  if (!offers.length) return null;
  const comparison = checkoutComparison(offers, adjustments, offerKey);
  const readyCount = comparison.rows.length - comparison.missingCount;
  const change = (key, field, value) => setAdjustments(current => ({
    ...current, [key]: { ...(current[key] || {}), [field]: value },
  }));

  return <section className="cp-checkout" aria-labelledby="cp-checkout-title">
    <div className="cp-checkout-heading">
      <div><h4 id="cp-checkout-title">送料・クーポンを反映した支払見込額</h4>
        <p>ショップで送料や適用可能なクーポン額を確認し、選んだ出品ごとに入力してください。</p></div>
      <button type="button" onClick={() => setAdjustments({})}>入力を消去</button>
    </div>
    <div className="cp-checkout-grid">
      {comparison.rows.map(row => {
        const offer = row.offer;
        const key = offerKey(offer);
        const inputs = adjustments[key] || {};
        const isFree = offer.shippingStatus === 'free' || offer.shippingFree === true;
        const winner = comparison.cheapest && comparison.cheapest.offer === offer && readyCount > 1;
        return <div key={key} className={'cp-checkout-entry' + (winner ? ' is-lowest' : '')}>
          <p className="cp-checkout-shop">{offer.storeName} · {offer.shopName || '店名未取得'}</p>
          <p className="cp-checkout-item">{offer.title}</p>
          <p className="cp-checkout-base">API取得の商品価格 <b>{yen(offer.price)}</b></p>
          <div className="cp-checkout-fields">
            {isFree ? <p className="cp-checkout-freeship">{shippingLabel(offer)}：{yen(0)}として計算</p> :
              <label>送料（税込・円）
                <input type="number" min="0" max="999999999" step="1" inputMode="numeric"
                  value={inputs.shipping ?? ''} onChange={e => change(key, 'shipping', e.target.value)}
                  placeholder="未確認なら空欄" aria-label={offer.shopName + 'の送料'}/></label>}
            <label>使えるクーポン額（円）
              <input type="number" min="0" max="999999999" step="1" inputMode="numeric"
                value={inputs.coupon ?? ''} onChange={e => change(key, 'coupon', e.target.value)}
                placeholder="なければ0円" aria-label={offer.shopName + 'のクーポン額'}/></label>
          </div>
          {row.status === 'ready' ? <div className="cp-checkout-total">
            <span>{winner ? '入力済み候補の支払見込額が最小' : '支払見込額（ポイント差引前）'}</span>
            <strong>{yen(row.total)}</strong>
            {row.point > 0 && <small>ポイントを差し引くと参考{yen(row.afterPoints)}（実際の支払額ではありません）</small>}
          </div> : <p className="cp-checkout-pending" role="status">
            {row.status === 'needs-shipping' ? '送料が未確定のため総額は比較対象外です。' : '金額を確認してください。整数・0円以上で、クーポンは合計額以下にしてください。'}
          </p>}
        </div>;
      })}
    </div>
    <p className="cp-checkout-summary" aria-live="polite">{readyCount} / {offers.length}件の支払見込額を比較中。
      {comparison.cheapest ? ' 入力済み候補の最小額は' + yen(comparison.cheapest.total) + '。' : '送料を入力すると比較できます。'}
      {comparison.difference !== null ? ' 入力済み候補の最大差額は' + yen(comparison.difference) + '。' : ''}</p>
    <p className="cp-checkout-note">計算式：商品価格 ＋ 送料 − 入力したクーポン額。ポイントは後日付与の可能性があるため支払見込額から引きません。税・代引手数料・会員割引・送料地域差・在庫・クーポン適用可否は未確認です。価格や入力内容は保存・送信しません。表示は見積りであり、注文前にショップの最終支払額を確認してください。</p>
  </section>;
}
