import {combinedPriceComparison} from '../shared/multiShopPrices.js';
import {recordOutboundClick} from '../shared/outboundClient.js';
import {shippingLabel} from '../shared/compareWorkbench.js';

const money=n=>'¥'+Math.round(n).toLocaleString('ja-JP');
const sourceName={rakuten:'楽天市場',yahoo:'Yahoo!ショッピング'};

export default function ShopPriceBoard({offers=[],stores=[],onOpenManual}) {
  const comparison=combinedPriceComparison({offers});
  const leads=comparison.ready.slice(0,12);
  const withoutShipping=comparison.incomplete.slice(0,5);
  return <section className="cp-allshops" aria-labelledby="cp-allshops-title">
    <div className="cp-allshops-heading">
      <div><span>SHOP PRICE DESK</span><h3 id="cp-allshops-title">販売店ごとの安い価格を探す</h3>
        <p>同一JAN・型番を照合した候補のみで、送料が確実に0円と分かる出品だけ現金支払額で順位を付けます。全店舗・すべての出品の最安保証ではありません。</p></div>
      <strong>{comparison.shopCount}販売店の送料込み判定を表示</strong>
    </div>
    {comparison.cheapest ? <div className="cp-allshops-winner">
      <div><span>送料込みと確認できた候補内の最安</span>
        <strong>{money(comparison.cheapest.cashTotal)}</strong>
        <small>{comparison.cheapest.storeName} / {comparison.cheapest.shopName||'販売店名未取得'} · 送料0円（取得元表示）</small>
        {comparison.status==='single' && <small>比較可能な出品が1件だけです。その他の販売店の条件も確認してください。</small>}
      </div>
      {comparison.cheapest.url && <a href={comparison.cheapest.url} target="_blank"
        rel={comparison.cheapest.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
        onClick={()=>recordOutboundClick({section:'products',merchant:comparison.cheapest.storeId,placement:'multistore-cheapest',sponsored:comparison.cheapest.sponsored})}>
        この出品の販売条件を見る ↗{comparison.cheapest.sponsored&&<small> PR</small>}</a>}
    </div> : <p className="cp-allshops-missing" role="status">取得結果に、JAN・型番の照合と送料0円の両方を確認できた出品はまだありません。下の各サイトで同じ型番を探し、送料を含めて比較できます。</p>}
    {leads.length>0 && <div className="cp-allshops-table-scroll" role="region" tabIndex="0" aria-label="送料0円が確認できた出品の価格順位。スマホでは横にスクロールできます">
      <table className="cp-allshops-table"><caption>公式APIの取得済み価格のうち、同じ型番・送料無料と確認できた出品（最大12件）</caption>
        <thead><tr><th scope="col">順位</th><th scope="col">モール・販売店</th><th scope="col">商品価格</th><th scope="col">送料込み確認額</th><th scope="col">購入先</th></tr></thead>
        <tbody>{leads.map((offer,i)=><tr key={offer.id}>
          <td>{i===0?'最安候補':i+1+'位'}</td>
          <td><strong>{offer.storeName}</strong><small>{offer.shopName||'販売店名未取得'} · {offer.verification}</small></td>
          <td>{money(offer.itemPrice)}</td><td><strong>{money(offer.cashTotal)}</strong><small>送料0円と表示</small></td>
          <td><a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
            onClick={()=>recordOutboundClick({section:'products',merchant:offer.storeId,placement:'multistore-ranked',sponsored:offer.sponsored})}>
            販売条件 ↗{offer.sponsored&&<small> PR</small>}</a></td>
        </tr>)}</tbody></table>
    </div>}
    {withoutShipping.length>0 && <details className="cp-allshops-unverified">
      <summary>送料が未確定の安い出品も見る（{comparison.excludedShippingCount}件）</summary>
      <ol>{withoutShipping.map(offer=><li key={offer.id}>
        <span>{offer.storeName}・{offer.shopName||'販売店未取得'}</span><strong>{money(offer.itemPrice)}</strong>
        <small>{shippingLabel({shippingStatus:offer.shippingStatus})}・送料込み順位には含めません</small>
        <a href={offer.url} target="_blank" rel={offer.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          onClick={()=>recordOutboundClick({section:'products',merchant:offer.storeId,placement:'multistore-unverified-shipping',sponsored:offer.sponsored})}>
          送料を確認 ↗{offer.sponsored&&' PR'}</a>
      </li>)}</ol>
    </details>}
    <div className="cp-allshops-web">
      <div className="cp-allshops-web-head"><h4>他の通販サイトでも同じ型番を探す</h4>
        <p>以下は公式サイトの検索結果へのリンクです。未接続サイトの価格・口コミは自動取得していません。</p></div>
      <div className="cp-allshops-web-grid">
        {stores.map(store=><a key={store.id} href={store.url} target="_blank"
          rel={store.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
          onClick={()=>recordOutboundClick({section:'products',merchant:store.id,placement:'multistore-search',sponsored:store.sponsored})}>
          <strong>{store.name}</strong><span>価格を調べる ↗{store.sponsored&&<small> PR</small>}</span>
        </a>)}
      </div>
    </div>
    <div className="cp-allshops-next"><p>Amazon・ヨドバシ・家電量販店などで確認した価格を追加すると、楽天・Yahoo!の取得済み出品と**同じ順位表**で送料込み支払額を比較できます。</p>
      <button type="button" onClick={onOpenManual}>他社の価格を加えて最安を探す →</button></div>
    <p className="cp-allshops-foot">自動取得した送料「別・条件付き無料・不明」を0円とはみなしません。価格・在庫は取得時点で変動します。複数の色・容量・付属品の一致は保証しません。広告報酬は順位に使用していません。</p>
  </section>;
}
