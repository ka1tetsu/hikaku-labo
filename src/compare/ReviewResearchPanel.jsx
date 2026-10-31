import { reviewCoverage, reviewResearchOffers, REVIEW_PRESETS } from '../shared/reviewResearch.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { offerKey } from '../shared/compareWorkbench.js';

const money=n=>'¥'+Number(n).toLocaleString('ja-JP');
export default function ReviewResearchPanel({offers=[],stores=[],onApplyPreset,onClearPreset,activeReviewMin=0,activeReviewCount=0,onChoose,selectedKeys=[]}) {
  const coverage=reviewCoverage(offers);
  const {rows,verifiedOnly}=reviewResearchOffers(offers);
  const amazon=stores.find(s=>s.id==='amazon');
  const evidenceMissing=rows.length===0;
  return <section className="cp-research-reviews" aria-labelledby="cp-research-title">
    <div className="cp-research-heading">
      <div><span>REVIEWS / SOURCE CHECK</span><h3 id="cp-research-title">口コミ・星評価から購入先を調べる</h3>
        <p>公式APIが提供する<strong>商品レビューの平均点・投稿件数</strong>と<strong>販売店の評価</strong>を区別して確認できます。口コミ本文は転載せず、元サイトへのリンクから読めます。</p></div>
      <p role="status" className="cp-research-coverage">今回取得した{coverage.total}件中、商品評価あり <strong>{coverage.productReviewed}件</strong>・店舗評価あり <strong>{coverage.sellerReviewed}件</strong>・商品評価未取得 <strong>{coverage.productUnknown}件</strong></p>
    </div>
    <div className="cp-research-steps" role="note">
      <span><b>1</b> 星評価と投稿件数を見る</span>
      <span><b>2</b> 口コミ原文・販売店評価を確認</span>
      <span><b>3</b> 出品を比較表に入れて送料・価格を確認</span>
    </div>
    <div className="cp-research-preset" aria-label="口コミの確認条件">
      <span>評価のある商品に絞る：</span>
      {REVIEW_PRESETS.map(preset=><button type="button" key={preset.id}
        aria-pressed={Number(activeReviewMin)===preset.minReview&&Number(activeReviewCount)===preset.minReviewCount}
        onClick={()=>onApplyPreset(preset)}>{preset.label}</button>)}
      {(Number(activeReviewMin)>0||Number(activeReviewCount)>0)&&<button type="button" onClick={onClearPreset}>口コミ条件を解除</button>}
    </div>
    {!evidenceMissing && <div className="cp-research-explainer">
      <strong>{verifiedOnly?'型番・JAN照合できた出品の口コミ情報':'商品名が似た出品の口コミ情報（同一商品とは未確認）'}</strong>
      <small>各行は別々の出品・レビュー母集団です。星評価の単純合算はせず、下の並びは口コミ件数を考慮した参考順で、品質を保証するものではありません。</small>
    </div>}
    {evidenceMissing?<p className="cp-research-empty">{verifiedOnly?'型番・JANを照合できた商品の口コミが未取得です。別の商品やアクセサリーの高評価を代わりに表示していません。':'この検索ページでは、取得元が提供する商品評価を確認できませんでした。'} 評価なしを「低評価」と扱わず、販売先の最新レビューを直接確認してください。</p>:
      <div className="cp-research-list">{rows.map(offer=><article className="cp-research-item" key={offer.store+':'+offer.url}>
        <div className="cp-research-item-name"><strong>{offer.storeName}</strong><span>{offer.shopName||'販売店名未取得'}</span>
          <p>{offer.title.length>90?offer.title.slice(0,90)+'…':offer.title}</p></div>
        <div className="cp-research-item-score">
          <span>商品レビュー</span>
          <strong>★ {offer.reviewAverage.toFixed(1)} <small>/ 5</small></strong>
          <small>{offer.reviewCount.toLocaleString('ja-JP')}件の口コミ</small>
          {offer.reviewCount<20&&<em>投稿件数が少ないため慎重に確認</em>}
        </div>
        <div className="cp-research-item-seller"><span>販売店の評価（別指標）</span>
          {offer.sellerReviewCount>0?<><strong>★ {offer.sellerReviewAverage.toFixed(1)}</strong>
            <small>{offer.sellerReviewCount.toLocaleString('ja-JP')}件</small></>:<strong>未取得</strong>}
        </div>
        <div className="cp-research-item-actions">
          <span>商品価格 {money(offer.price)}</span>
          {onChoose&&<button type="button" aria-pressed={selectedKeys.includes(offerKey(offer))}
            disabled={!selectedKeys.includes(offerKey(offer))&&selectedKeys.length>=4}
            onClick={()=>onChoose(offer)}>{selectedKeys.includes(offerKey(offer))?'比較対象から外す':'価格と条件の比較表に追加 →'}</button>}
          {offer.reviewUrl?<a href={offer.reviewUrl} target="_blank" rel="noopener noreferrer">商品口コミの原文を読む ↗</a>:
            <a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={()=>recordOutboundClick({section:'products',merchant:offer.store==='yahoo'?'yahoo-shopping':'rakuten',placement:'review-check',sponsored:offer.sponsored})}>
              販売ページで口コミを調べる ↗{offer.sponsored&&<small> PR</small>}</a>}
          {offer.sellerReviewCount>0&&offer.storeUrl&&<a href={offer.storeUrl} target="_blank" rel="noopener noreferrer">販売店の情報を確認 ↗</a>}
        </div>
      </article>)}</div>}
    <div className="cp-research-other">
      <div><strong>Amazonの口コミも確認する</strong>
        <p>Amazonの星評価・本文はAPI未接続のため、このページに複製していません。Amazon公式サイトで実際の購入者の投稿・最近の低評価・レビューの対象商品を確認できます。</p></div>
      {amazon&&<a href={amazon.url} target="_blank" rel={amazon.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
        onClick={()=>recordOutboundClick({section:'products',merchant:'amazon',placement:'review-amazon-research',sponsored:amazon.sponsored})}>
        Amazonで口コミを見る ↗{amazon.sponsored&&<small> PR</small>}</a>}
    </div>
    <p className="cp-research-note">表示する星評価と件数は取得元ごとの集計値です。販売店の評価は商品品質の評価ではありません。レビューの投稿時期、価格、返品条件、保証、同一型番かどうかを原文のページで確認してください。掲載順位は広告報酬と無関係です。</p>
  </section>;
}
