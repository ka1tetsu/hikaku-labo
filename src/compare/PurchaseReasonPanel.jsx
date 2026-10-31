import {buyingDecisionCandidates} from '../shared/buyingDecisionCandidates.js';
import {offerKey,shippingLabel} from '../shared/compareWorkbench.js';
import {recordOutboundClick} from '../shared/outboundClient.js';

const yen=n=>'¥'+Number(n).toLocaleString('ja-JP');
export default function PurchaseReasonPanel({offers=[],selectedKeys=[],onChoose}) {
  const candidates=buyingDecisionCandidates(offers);
  return <section className="cp-reasons" aria-labelledby="cp-reasons-heading">
    <header className="cp-reasons-head"><span>BUYER'S DECISION DESK</span>
      <h3 id="cp-reasons-heading">何を重視して購入先を決めますか？</h3>
      <p>広告料で決めたおすすめではありません。<strong>同一型番・JANと照合できた商品だけ</strong>から、価格・商品口コミ・販売店評価を独立した基準で調べます。</p>
    </header>
    <div className="cp-reasons-grid">{candidates.map(({key,label,offer,why})=><article key={key} className="cp-reason-option">
      <h4>{label}</h4>
      {offer?<><div className="cp-reason-result">
        <strong>{offer.storeName}・{offer.shopName||'販売店名未取得'}</strong>
        <span>{offer.title.length>80?offer.title.slice(0,80)+'…':offer.title}</span>
        <b>{yen(offer.price)} <small>商品価格</small></b>
        <small>{shippingLabel(offer)}</small>
        <small>{offer.reviewCount>0?'商品 ★'+offer.reviewAverage.toFixed(1)+'（'+offer.reviewCount+'件）':'商品口コミ未取得'} /
          {offer.sellerReviewCount>0?' 販売店 ★'+offer.sellerReviewAverage.toFixed(1)+'（'+offer.sellerReviewCount+'件）':' 販売店評価未取得'}</small>
      </div>
      <p>{why}</p>
      <div className="cp-reason-actions">
        <button type="button" disabled={!selectedKeys.includes(offerKey(offer))&&selectedKeys.length>=4}
          aria-pressed={selectedKeys.includes(offerKey(offer))}
          onClick={()=>onChoose(offer)}>{selectedKeys.includes(offerKey(offer))?'比較対象から外す':'この出品を比較表に追加'}</button>
        {offer.reviewUrl&&<a href={offer.reviewUrl} target="_blank" rel="noopener noreferrer">口コミ原文 ↗</a>}
        <a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          onClick={()=>recordOutboundClick({section:'products',merchant:offer.store==='yahoo'?'yahoo-shopping':'rakuten',placement:'reason-outbound',sponsored:offer.sponsored})}>
          販売ページ ↗{offer.sponsored&&<small> PR</small>}</a>
      </div></>:<p className="cp-reason-no-offer">{why}。評価が「未取得」であることは低評価という意味ではありません。</p>}
    </article>)}</div>
    <p className="cp-reasons-caution">商品口コミと販売店口コミは別の指標です。点数・件数の多さは真偽・品質・満足を保証しません。送料別・条件付き無料・不明の出品は「現金総額の最安」に選びません。購入前に型番、状態、色・容量、返品、保証、送料と価格を販売先で再確認してください。</p>
  </section>;
}
