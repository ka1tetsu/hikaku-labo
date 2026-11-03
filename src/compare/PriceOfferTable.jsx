import { offerKey, shippingLabel } from '../shared/compareWorkbench.js';
import { displayValue } from '../shared/offerDisplay.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
const yen=value=>Number.isFinite(value)?'¥'+Math.round(value).toLocaleString('ja-JP'):'未取得';
export default function PriceOfferTable({offers,sort,selectedKeys,onToggle}){
  return <div className="cp-price-table-wrap" id="cp-offer-list" role="region" aria-label="販売店別の価格と販売条件"><table className="cp-price-table">
    <caption>取得した出品の価格・送料・在庫。型番一致でも色・容量・セット内容は購入先で確認してください。</caption>
    <thead><tr><th scope="col">比較</th><th scope="col">商品・販売店</th><th scope="col">商品価格</th><th scope="col">送料・在庫</th><th scope="col">商品・店舗の評価</th><th scope="col">購入先</th></tr></thead>
    <tbody className="cp-offers">{offers.map((offer,index)=>{
      const key=offerKey(offer), selected=selectedKeys.includes(key);
      return <tr className="cp-offer" key={key}>
        <td className="cp-price-pick"><label className="cp-pick"><input type="checkbox" checked={selected} disabled={!selected&&selectedKeys.length>=4} onChange={()=>onToggle(offer)}/><span>比較表に追加</span></label></td>
        <td className="cp-price-product"><p className="cp-offer-title">{offer.title}</p><strong>{offer.shopName||'販売店名未取得'}</strong><small>{offer.storeName}</small>
          <small className="cp-identity">{offer.matchBasis==='jan'?'JAN一致':offer.matchBasis==='model'?'型番一致・仕様は要確認':'同一商品か未確認'}</small>
          {/^\d{8}$|^\d{13}$/.test(offer.jan||'')&&<a className="cp-research-jan" href={'/compare/?q='+encodeURIComponent(offer.title.slice(0,80))+'&jan='+offer.jan}>JAN {offer.jan}で比較 →</a>}
        </td>
        <td className="cp-offer-price"><strong>{yen(offer.price)}</strong><small>商品価格・送料別</small>
          {sort==='points'&&<small>参考額 {yen(displayValue(offer,'points'))}（現金支払額ではない）</small>}
          {offer.point>0&&<small>{offer.point.toLocaleString('ja-JP')}pt（後日還元）</small>}
          {index===0&&sort==='cash'&&<small>表示候補の商品価格が最小</small>}
        </td>
        <td className="cp-price-conditions"><strong>{shippingLabel(offer)}</strong><small>{offer.inStock===true?'在庫あり（取得時点）':offer.inStock===false?'在庫なし（取得時点）':'在庫未取得'}</small><small>{offer.condition==='new'?'新品':offer.condition==='used'?'中古':'商品状態未取得'}</small></td>
        <td className="cp-price-reviews"><span>{offer.reviewCount>0?`商品 ★${offer.reviewAverage.toFixed(1)} / ${offer.reviewCount}件`:'商品評価 未取得'}</span>
          {offer.reviewUrl&&<a className="cp-review-evidence" onClick={()=>recordOutboundClick({section:'products',merchant:offer.store==='yahoo'?'yahoo-shopping':'rakuten',placement:'review-source-row',sponsored:false})} href={offer.reviewUrl} target="_blank" rel="noopener noreferrer">商品口コミの原文 ↗</a>}
          <small className="cp-seller-evidence">{offer.sellerReviewCount>0?`販売店の評価 ★${offer.sellerReviewAverage.toFixed(1)} / ${offer.sellerReviewCount}件`:'販売店の評価 未取得'}</small>
          {offer.storeUrl&&<a href={offer.storeUrl} target="_blank" rel="noopener noreferrer">店舗情報 ↗</a>}
        </td>
        <td className="cp-price-action"><a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'} onClick={()=>recordOutboundClick({section:'products',merchant:offer.store==='yahoo'?'yahoo-shopping':'rakuten',placement:'compare-offer',sponsored:offer.sponsored})}>ショップで確認 ↗{offer.sponsored?' PR':''}</a></td>
      </tr>;
    })}</tbody>
  </table></div>;
}
