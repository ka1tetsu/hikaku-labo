import {useMemo,useState} from 'react';
import {CONSUMER_PROFILES,scoreConsumerOffers} from '../shared/consumerScore.js';
import {RATING_PRIOR} from '../shared/reviewEvidence.js';
import {offerKey} from '../shared/compareWorkbench.js';
import {recordOutboundClick} from '../shared/outboundClient.js';

const money=n=>'¥'+Number(n).toLocaleString('ja-JP');
const points=n=>n===null?'未取得':n.toFixed(1)+'点';
export default function ConsumerScorePanel({offers=[],selectedKeys=[],onChoose}) {
  const [profileId,setProfileId]=useState('balanced');
  const outcome=useMemo(()=>scoreConsumerOffers(offers,profileId),[offers,profileId]);
  const {profile,ranked,incomplete,eligibleCount}=outcome;
  const shown=ranked.slice(0,8);
  return <section className="cp-consumer-score" id="cp-score" aria-labelledby="cp-score-title">
    <header className="cp-score-header">
      <span className="cp-kicker">TRANSPARENT SHOPPING INDEX</span>
      <h3 id="cp-score-title">価格・口コミを数式で比較する</h3>
      <p>星の平均だけで順位を決めません。<strong>口コミ件数で補正した評価</strong>と、同一型番・JANを照合した<strong>送料無料の出品価格</strong>を、好みの配分で計算します。</p>
    </header>
    <div className="cp-score-modes" aria-label="比較で重視する基準">
      {Object.entries(CONSUMER_PROFILES).map(([id,choice])=><button type="button" key={id}
        aria-pressed={profileId===id} onClick={()=>setProfileId(id)}>{choice.label}</button>)}
    </div>
    <p className="cp-score-weights" role="status">現在の配点：<strong>価格 {profile.price}%</strong>・<strong>商品評価 {profile.product}%</strong>・<strong>販売店評価 {profile.seller}%</strong>。広告報酬・予測ポイント・未確認の送料は加点しません。</p>
    <div className="cp-score-formula">
      <div><strong>補正した星評価</strong>
        <code>B = (n × R + {RATING_PRIOR.count} × {RATING_PRIOR.mean}) / (n + {RATING_PRIOR.count})</code>
        <small>R＝取得元の星平均、n＝レビュー件数。基準の★{RATING_PRIOR.mean}と仮の{RATING_PRIOR.count}件は当サイトの固定値で、統計的な信頼区間ではありません。</small>
      </div>
      <div><strong>100点換算の参考指数</strong>
        <code>指数 = 価格点 × {profile.price}% + 商品点 × {profile.product}% + 店舗点 × {profile.seller}%</code>
        <small>価格点＝100 × 比較対象内の最低商品価格 ÷ 当該価格。口コミ点＝25 × (補正星評価 − 1)。未取得の必須評価は0点とせず順位を保留します。</small>
      </div>
    </div>
    {eligibleCount===0?<p className="cp-score-empty">同じJAN・型番を照合でき、取得元で「送料無料」と表示された出品がありません。名前が似た別商品や送料未取得の出品を数式の順位へ混ぜません。型番・JANで検索するか、下の価格比較・購入先リンクを確認してください。</p>:null}
    {eligibleCount>0&&ranked.length===0&&<div className="cp-score-empty" role="status">
      <p>この配点に必要な商品口コミまたは販売店評価が未取得です。未取得を0点とすることはできないため、総合順位は表示していません。</p>
      <button type="button" onClick={()=>setProfileId('price')}>取得済み価格だけで比較する</button>
    </div>}
    {ranked.length>0&&<div className="cp-score-list" role="list" aria-label="評価の根拠がそろった出品の参考順位">
      {shown.map((row,i)=>{
        const offer=row.offer;
        const selected=selectedKeys.includes(offerKey(offer));
        const full=selectedKeys.length>=4&&!selected;
        return <article role="listitem" className="cp-score-item" key={offerKey(offer)}>
          <div className="cp-score-item-heading">
            <span>{i+1}位 · {offer.storeName} / {offer.shopName||'店名未取得'}</span>
            <strong>{row.index.toFixed(1)} <small>/100点（参考）</small></strong>
          </div>
          <p>{offer.title.length>94?offer.title.slice(0,94)+'…':offer.title}</p>
          <div className="cp-score-metrics">
            <div><span>商品価格・送料0円表示</span><b>{money(offer.price)}</b><small>価格点 {points(row.priceIndex)}</small></div>
            <div><span>商品口コミ</span><b>{row.productBayes===null?'未取得':'補正 ★'+row.productBayes.toFixed(2)}</b>
              <small>{row.productBayes!==null?'取得元 ★'+offer.reviewAverage.toFixed(1)+' / '+offer.reviewCount.toLocaleString('ja-JP')+'件':'総合計算では未取得を加点しません'}</small></div>
            <div><span>販売店口コミ（別指標）</span><b>{row.sellerBayes===null?'未取得':'補正 ★'+row.sellerBayes.toFixed(2)}</b>
              <small>{row.sellerBayes!==null?'取得元 ★'+offer.sellerReviewAverage.toFixed(1)+' / '+offer.sellerReviewCount.toLocaleString('ja-JP')+'件':'総合計算では未取得を加点しません'}</small></div>
          </div>
          <div className="cp-score-item-actions">
            <button type="button" onClick={()=>onChoose(offer)} disabled={full}
              aria-pressed={selected}>{selected?'比較表から外す':'横並び比較に追加'}</button>
            {offer.reviewUrl&&<a href={offer.reviewUrl} target="_blank" rel="noopener noreferrer"
              onClick={()=>recordOutboundClick({section:'products',merchant:'yahoo-shopping',placement:'score-review',sponsored:false})}>口コミ原文 ↗</a>}
            <a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={()=>recordOutboundClick({section:'products',merchant:offer.store==='yahoo'?'yahoo-shopping':'rakuten',placement:'score-purchase',sponsored:offer.sponsored})}>
              購入先で条件を確認 ↗{offer.sponsored&&<small> PR</small>}</a>
          </div>
        </article>;
      })}</div>}
    {incomplete.length>0&&<details className="cp-score-incomplete">
      <summary>評価が未取得で参考指数を計算できない候補（{incomplete.length}件）</summary>
      <ul>{incomplete.slice(0,10).map(({offer,missing})=><li key={offerKey(offer)}>
        <strong>{offer.storeName}・{offer.shopName||'販売店'}</strong>
        <span>{money(offer.price)} / 送料0円表示</span><small>未取得：{missing.join('・')}</small>
        <a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          onClick={()=>recordOutboundClick({section:'products',merchant:offer.store==='yahoo'?'yahoo-shopping':'rakuten',placement:'score-incomplete',sponsored:offer.sponsored})}>
          公式販売ページで確認 ↗{offer.sponsored&&<small> PR</small>}</a>
      </li>)}</ul>
    </details>}
    <p className="cp-score-caution">参考指数は商品品質を実験で検証した結果ではありません。星評価は各出品・各モールの別々の集計であり、店舗評価は商品評価とは異なります。口コミの真偽、レビューの新しさ、保証・返品・新品／中古・容量の一致は、必ず元サイトで確認してください。Amazonの口コミ数・星評価は公式API未接続のため集計していません。</p>
  </section>;
}
