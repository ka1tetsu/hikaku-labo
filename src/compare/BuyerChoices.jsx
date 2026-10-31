import { purchaseChoices } from '../shared/buyerDecision.js';
import { shippingLabel } from '../shared/compareWorkbench.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
const yen = n => '¥' + Number(n).toLocaleString('ja-JP');

export default function BuyerChoices({ offers, searched }) {
  const choices = purchaseChoices(offers);
  if (!choices.length) return <div className="cp-choice-unknown" role="status">
    <h3>同一型番の購入先をまだ特定できません</h3>
    <p>今回取得した商品名が似ていても、同じ製品とは限りません。型番・JANコードを入力し、色・容量・新品／中古・付属品を確認してから購入先を選んでください。</p>
  </div>;
  return <section className="cp-choice" aria-labelledby="cp-choice-title">
    <div className="cp-choice-intro">
      <div><h3 id="cp-choice-title">購入先の候補を確認</h3>
        <p>型番・JANを照合できた出品だけから、広告報酬とは無関係に商品価格と送料表示で選んでいます。</p></div>
      <span>取得候補から選出</span>
    </div>
    <div className="cp-choice-grid">
      {choices.map(({kind,label,offer,priceDifference})=><article key={kind} className="cp-choice-option">
        <p className="cp-choice-label">{label}</p>
        <p className="cp-choice-seller">{offer.storeName} · {offer.shopName || '販売店名未取得'}</p>
        <div className="cp-choice-details">
          {offer.image && <img src={offer.image} alt="" loading="lazy" width="74" height="74"/>}
          <div><strong>{yen(offer.price)}</strong><span>商品価格（税込条件は販売ページで確認）</span>
            <small>{shippingLabel(offer)}</small>
            {kind==='shipping'&&priceDifference>0&&<small>今回の最低商品価格より{yen(priceDifference)}高い</small>}</div>
        </div>
        <p className="cp-choice-product">{offer.title.slice(0,92)}{offer.title.length>92?'…':''}</p>
        <p className="cp-choice-proof">{offer.matchBasis==='jan'?'JAN一致':'型番一致'}を確認。色・容量・保証・在庫は購入先で要確認。</p>
        <a className="cp-choice-link" href={offer.url} target="_blank"
          rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          onClick={()=>recordOutboundClick({section:'products',merchant:offer.store==='yahoo'?'yahoo-shopping':'rakuten',placement:kind==='cash'?'decision-cash':'decision-shipping',sponsored:offer.sponsored})}>
          {offer.storeName}で価格と在庫を確認 <span aria-hidden="true">↗</span>{offer.sponsored&&<small>PR</small>}</a>
      </article>)}
    </div>
    <p className="cp-choice-foot">価格は取得時点の一部候補の商品代金です。送料別・条件付き無料・不明の出品は送料未加算。クーポンやポイントも最終支払額には反映していません。{searched?'他のモールの価格が取得できていない場合は、下の検索リンクでも確認してください。':''}</p>
  </section>;
}
