import { recordOutboundClick } from '../shared/outboundClient.js';
import { shippingLabel } from '../shared/compareWorkbench.js';

const yen=n=>'¥'+Number(n).toLocaleString('ja-JP');
const storefronts=[['rakuten','楽天市場'],['yahoo','Yahoo!ショッピング']];

export default function AmazonComparePanel({offers=[],stores=[],onOpenManual}) {
  const amazon=stores.find(x=>x.id==='amazon');
  const verified=offers.filter(o=>o.sameProduct===true&&['model','jan'].includes(o.matchBasis)&&o.price>0);
  const info=storefronts.map(([id,label])=>{
    const source=verified.filter(o=>o.store===id).sort((a,b)=>a.price-b.price)[0]||null;
    return {id,label,offer:source};
  });
  return <section className="cp-three-way" aria-labelledby="cp-three-way-heading">
    <div className="cp-three-way-head"><h3 id="cp-three-way-heading">Amazon・楽天・Yahoo!をひと目で確認</h3>
      <p>同じ型番・JANを照合できた出品のみ価格を掲載。Amazonは公式API未接続のため、検索先で価格・星評価・在庫を確認してください。</p></div>
    <div className="cp-three-way-grid">
      {info.map(({id,label,offer})=><article key={id} className="cp-three-way-shop">
        <h4>{label}</h4>
        {offer?<><strong className="cp-three-way-price">{yen(offer.price)}</strong>
          <span>{shippingLabel(offer)} · 商品価格（送料別の場合あり）</span>
          <span>{offer.reviewCount>0&&offer.reviewAverage>0
            ? '商品口コミ ★'+offer.reviewAverage.toFixed(1)+' ／ '+offer.reviewCount.toLocaleString('ja-JP')+'件'
            : '商品口コミの評価は未取得'}</span>
          <a href={offer.url} rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'} target="_blank"
            onClick={()=>recordOutboundClick({section:'products',merchant:id==='yahoo'?'yahoo-shopping':'rakuten',placement:'three-way-price',sponsored:offer.sponsored})}>
            出品の価格・条件を確認 ↗{offer.sponsored&&<small> PR</small>}</a>
        </>:<><strong className="cp-three-way-unknown">同一型番の価格は未取得</strong>
          <span>取得できない・照合できない商品を、価格0円とみなしません。</span>
          {stores.find(x=>x.id===id)&&<a href={stores.find(x=>x.id===id).url} target="_blank"
            rel={stores.find(x=>x.id===id).sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
            onClick={()=>recordOutboundClick({section:'products',merchant:id==='yahoo'?'yahoo-shopping':'rakuten',placement:'three-way-search',sponsored:stores.find(x=>x.id===id).sponsored})}>
            {label}で検索 ↗{stores.find(x=>x.id===id).sponsored&&<small> PR</small>}</a>}</>}
      </article>)}
      <article className="cp-three-way-shop cp-three-way-amazon">
        <h4>Amazon.co.jp</h4>
        <strong className="cp-three-way-unknown">価格・星評価は未取得</strong>
        <span>Amazon公式検索で同一型番・新品／中古・送料・口コミを確認。</span>
        {amazon&&<a href={amazon.url} target="_blank" rel={amazon.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          onClick={()=>recordOutboundClick({section:'products',merchant:'amazon',placement:'three-way-amazon',sponsored:amazon.sponsored})}>
          Amazonで価格・口コミを調べる ↗{amazon.sponsored&&<small> PR</small>}</a>}
      </article>
    </div>
    <div className="cp-three-way-action">
      <p>Amazonの実際の価格も含めて比べたい場合は、各サイトで確認した税込価格・送料を入力すると、この端末内で現金支払額を比較できます。</p>
      <button type="button" onClick={onOpenManual}>Amazonの価格を入力して3社比較する →</button>
    </div>
    <p className="cp-three-way-caution">表示額は取得できた出品の一部・商品価格です。Amazonの未取得データを推定せず、送料・保証・在庫とレビューの出典を購入前に確認してください。星評価・件数はサイト間で評価母集団や集計方法が異なります。</p>
  </section>;
}
