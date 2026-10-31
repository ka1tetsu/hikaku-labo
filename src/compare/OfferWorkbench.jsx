import { shippingLabel, offerKey } from '../shared/compareWorkbench.js';
import CheckoutEstimator from './CheckoutEstimator.jsx';
import { recordOutboundClick } from '../shared/outboundClient.js';
const yen=n=>'¥'+Math.round(n).toLocaleString('ja-JP');

export function OfferFilters({filters,onChange,storeOptions,visibleCount,totalCount,onReset}){
  return <section className="cp-workbench" aria-label="商品価格の詳細絞り込み">
    <div className="cp-workbench-head"><h3>販売条件で絞り込む</h3><span>{visibleCount}件 / 取得{totalCount}件</span></div>
    <div className="cp-filter-grid">
      <label>販売サイト<select value={filters.store} onChange={e=>onChange('store',e.target.value)}>
        <option value="all">すべての取得元</option>{storeOptions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </select></label>
      <label>送料の表示<select value={filters.shipping} onChange={e=>onChange('shipping',e.target.value)}>
        <option value="all">すべて</option><option value="free">送料無料の表示あり</option><option value="known">送料条件の記載あり</option>
      </select></label>
      <label>口コミの評価<select value={filters.reviewMin} onChange={e=>onChange('reviewMin',e.target.value)}>
        <option value="0">指定しない</option><option value="3">3.0以上</option><option value="4">4.0以上</option><option value="4.5">4.5以上</option>
      </select></label>
      <label>商品価格の上限（円）<input type="number" min="1" max="999999999" step="1" placeholder="指定しない"
        value={filters.maxPrice} onChange={e=>onChange('maxPrice',e.target.value)}/></label>
      <label className="cp-filter-search">出品名・店名で絞る<input type="search" maxLength={80} placeholder="容量・色・型番・店舗名など"
        value={filters.keyword} onChange={e=>onChange('keyword',e.target.value)}/></label>
    </div>
    <div className="cp-filter-foot"><label><input type="checkbox" checked={filters.verifiedOnly}
      onChange={e=>onChange('verifiedOnly',e.target.checked)}/> 型番・JAN一致の候補だけ見る</label>
      <button type="button" onClick={onReset}>絞り込みを解除</button></div>
    <p>出品ごとの送料・販売価格・ポイントは各ショップのAPI取得値です。未取得の料金や別の型番を補完して「最安」とは判定しません。</p>
  </section>;
}

export function OfferShortlist({offers,onRemove,onClear}){
  if(!offers.length)return null;
  const rows=[
    {name:'商品価格（支払額の一部）',get:o=>yen(o.price)},
    {name:'送料',get:shippingLabel},
    {name:'ポイント相当額',get:o=>(o.point||0).toLocaleString('ja-JP')+'pt（現金値引きではない）'},
    {name:'型番・JAN照合',get:o=>o.matchBasis==='jan'?'JAN一致':o.matchBasis==='model'?'型番一致（色・容量未照合）':'商品名が類似・未照合'},
    {name:'販売店',get:o=>o.shopName||'店舗名未取得'},
    {name:'口コミ',get:o=>o.reviewCount>0?'★'+o.reviewAverage.toFixed(1)+' / '+o.reviewCount+'件':'未取得'},
  ];
  return <section className="cp-shortlist" aria-labelledby="cp-shortlist-title">
    <div className="cp-shortlist-head"><div><span>購入先を決める前に</span><h3 id="cp-shortlist-title">選んだ{offers.length}件を並べて確認</h3></div>
      <button type="button" onClick={onClear}>選択をすべて解除</button></div>
    <div className="cp-shortlist-scroll" role="region" tabIndex="0" aria-label="比較した出品の一覧。スマホでは横にスクロールできます">
      <table><caption>最大4件の出品情報。送料別の額とポイントを区別して比較</caption><thead><tr>
        <th scope="col">比較項目</th>{offers.map(o=><th scope="col" key={offerKey(o)}><div className="cp-shortlist-offer">
          {o.image&&<img loading="lazy" alt="" src={o.image}/>}
          <span>{o.title.slice(0,75)}{o.title.length>75?'…':''}</span>
          <button type="button" onClick={()=>onRemove(offerKey(o))}>比較から外す</button>
        </div></th>)}</tr></thead>
        <tbody>{rows.map(row=><tr key={row.name}><th scope="row">{row.name}</th>
          {offers.map(o=><td key={offerKey(o)}>{row.get(o)}</td>)}</tr>)}
          <tr><th scope="row">ショップで最終確認</th>{offers.map(o=><td key={offerKey(o)}>
            <a href={o.url} target="_blank" rel={o.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={()=>recordOutboundClick({section:'products',merchant:o.store==='yahoo'?'yahoo-shopping':'rakuten',placement:'compare-shortlist',sponsored:o.sponsored})}>
              {o.storeName}で確認 ↗ {o.sponsored?'（PR）':''}</a></td>)}</tr>
        </tbody>
      </table></div>
    <CheckoutEstimator offers={offers}/>
    <p>型番が一致していても色・容量・セット内容・新品/中古の一致は保証できません。ポイントは現金支払額を減らさず、送料・クーポン・保証・納期は予約ではなく購入直前の画面で確認してください。</p>
  </section>;
}
