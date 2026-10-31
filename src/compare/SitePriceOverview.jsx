import {sitePriceRows,pricedSiteCount} from '../shared/sitePriceRows.js';
import {recordOutboundClick} from '../shared/outboundClient.js';

const yen=n=>'¥'+Number(n).toLocaleString('ja-JP');
const defaults=['yahoo-shopping','rakuten','amazon'];
const stateLabel={
  'not-connected':'価格API未接続',
  'failed':'取得失敗',
  'not-checked':'今回未照会',
  'no-match':'同一型番の出品なし',
  'unavailable':'価格未取得',
};
function PriceSiteRow({row}) {
  const item=row.state==='priced';
  const link=item?row.productUrl:row.researchUrl;
  const priceStatus=item?row.verifiedFreeOffer?'送料込み0円の出品を確認':'送料は未確定':stateLabel[row.state];
  const label=item?'出品を確認':'サイトで調べる';
  return <tr className={item?'cp-site-price-known':'cp-site-price-missing'} data-site-id={row.id}>
    <th scope="row"><strong>{row.name}</strong>
      <small>{item?row.offerCount+'件の同一型番・JAN候補':row.viaGoogle?'Googleの公式サイト内検索':'取得元の状態を表示'}</small>
    </th>
    <td data-label="商品価格">{item?<><strong>{yen(row.listedPrice)}</strong><small>取得候補の最安商品価格</small></>:<span>—</span>}</td>
    <td data-label="送料込み確認額">
      {row.totalPrice!==null?<><strong>{yen(row.totalPrice)}</strong><small>送料無料の出品のみ</small></>:
        <span className="cp-site-price-unconfirmed">{priceStatus}</span>}
    </td>
    <td className="cp-site-price-action">
      {link&&<a href={link} target="_blank"
        rel={row.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
        onClick={()=>recordOutboundClick({section:'products',merchant:row.id,placement:item?'site-price-item':'site-price-search',sponsored:row.sponsored})}>
        {label} ↗{row.sponsored&&<small> PR</small>}</a>}
      {item&&row.sellerName&&<small>{row.sellerName}</small>}
    </td>
  </tr>;
}
export default function SitePriceOverview({offers=[],stores=[],sources={},fetchedAt='',queryMode='price',loading=false}) {
  const rows=sitePriceRows(offers,stores,sources);
  const pricedCount=pricedSiteCount(rows);
  const primary=rows.filter(row=>row.state==='priced'||defaults.includes(row.id));
  const others=rows.filter(row=>row.state!=='priced'&&!defaults.includes(row.id));
  const cheapestComplete=rows.filter(row=>row.totalPrice!==null).sort((a,b)=>a.totalPrice-b.totalPrice)[0]||null;
  return <section className="cp-site-prices" id="site-prices" aria-labelledby="cp-site-prices-heading">
    <div className="cp-site-prices-title">
      <div><span className="cp-kicker">PRICE BY STORE</span><h3 id="cp-site-prices-heading">どの通販サイトで、いくら？</h3>
        <p>ショップごとの商品価格と、送料0円が確認できた価格を並べます。金額は実際に取得した<span>同一JAN・型番の候補</span>だけです。</p></div>
      <p role="status" className="cp-site-prices-count">価格取得 <strong>{pricedCount}</strong> / 対象 {rows.length} サイト</p>
    </div>
    {queryMode!=='price'&&<p className="cp-site-prices-notice">一般的なキーワードでは別の商品も検索に混ざります。商品を選び、型番またはJANコードで検索すると価格を表示できます。</p>}
    {cheapestComplete&&<p className="cp-site-prices-best"><strong>取得候補の送料込み最安：</strong>
      <b>{yen(cheapestComplete.totalPrice)}</b>（{cheapestComplete.name} · {cheapestComplete.sellerName||'販売店名未取得'}）
      <small>全サイト最安の保証ではありません。送料無料の出品のみを比較しています。</small></p>}
    {!loading&&rows.length>0&&<div className="cp-site-prices-table-wrap" role="region" tabIndex="0" aria-label="通販サイトごとの取得価格">
      <table className="cp-site-prices-table">
        <caption>同一JAN・型番の照合済み商品について、各サイトの価格取得状況を表示</caption>
        <thead><tr><th scope="col">通販サイト</th><th scope="col">商品価格（安い出品）</th><th scope="col">送料込み確認額</th><th scope="col">購入先・検索先</th></tr></thead>
        <tbody>{primary.map(row=><PriceSiteRow key={row.id} row={row}/>)}</tbody>
      </table>
    </div>}
    {loading&&<p className="cp-site-prices-notice" role="status">販売サイトの価格を確認しています…</p>}
    {!loading&&others.length>0&&<details className="cp-site-prices-expand">
      <summary>その他{others.length}サイトの価格取得状況・検索先を見る</summary>
      <div className="cp-site-prices-table-wrap" role="region" tabIndex="0" aria-label="その他の通販サイト">
        <table className="cp-site-prices-table">
          <caption>価格API未接続の通販サイト。価格は各サイトで確認</caption>
          <thead><tr><th scope="col">通販サイト</th><th scope="col">商品価格</th><th scope="col">送料込み確認額</th><th scope="col">検索先</th></tr></thead>
          <tbody>{others.map(row=><PriceSiteRow key={row.id} row={row}/>)}</tbody>
        </table>
      </div>
    </details>}
    {!loading&&pricedCount===0&&<p className="cp-site-prices-notice" role="status">
      今回は同一JAN・型番を照合できる価格が取得できていません。金額が不明なショップは0円ではなく「未取得」と表示しています。各サイトの検索先で価格・送料をご確認ください。
    </p>}
    <p className="cp-site-prices-foot">「商品価格（安い出品）」と「送料込み確認額」は<strong>異なる出品の金額の場合があります</strong>。購入先リンクは送料込み確認済みの出品を優先します。送料別・条件付き無料・不明は送料込みに換算せず、ポイントは現金から差し引きません。
      {fetchedAt&&<> 取得時刻：{new Date(fetchedAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo'})}（日本時間）。</>} 価格・在庫は変動します。</p>
  </section>;
}
