import { useEffect, useMemo, useState } from 'react';
import { compareManualOffers, MANUAL_STORES, ALL_MANUAL_STORES } from './manualCompare.js';
import { combinedPriceComparison } from '../shared/multiShopPrices.js';
import { recordFunnelEvent, recordOutboundClick } from '../shared/outboundClient.js';
import './manual-compare.css';

const money = n => '¥' + Number(n).toLocaleString('ja-JP');
const DEFAULT_LABELS = {rakuten:'楽天市場',amazon:'Amazon', 'yahoo-shopping':'Yahoo!ショッピング'};
const newRows = () => MANUAL_STORES.map(storeId => ({
  storeId, price:'', shipping:'', discount:'0', points:'0',
}));

export default function ManualStoreCompare({ keyword, stores=[], autoOffers=[], openRequested = false }) {
  const [rows,setRows]=useState(newRows);
  const [sameProduct,setSameProduct]=useState(false);
  const [sort,setSort]=useState('cash');
  const [reviewed,setReviewed]=useState(false);
  const [opened,setOpened]=useState(false);
  const comparison=useMemo(()=>compareManualOffers(rows,{sort}),[rows,sort]);
  const included=useMemo(()=>rows.map(row=>{
    const store=stores.find(s=>s.id===row.storeId);
    return {...row,storeName:store?.name||DEFAULT_LABELS[row.storeId]||row.storeId,
      url:store?.url||null,sponsored:Boolean(store?.sponsored)};
  }),[rows,stores]);
  const merged=useMemo(()=>combinedPriceComparison({
    offers:autoOffers,manualRows:included,confirmedSameProduct:sameProduct,
  }),[autoOffers,included,sameProduct]);
  const available=stores.filter(store=>ALL_MANUAL_STORES.includes(store.id)&&!rows.some(row=>row.storeId===store.id));
  const isManualReady = sameProduct && comparison.comparisonPossible;
  const canCompare = isManualReady || (sameProduct && comparison.ranked.length>=1 && merged.comparableCount>=2);
  const sorted=useMemo(()=>[...merged.ready].sort((a,b)=>{
    const aValue=sort==='points'?a.cashTotal-a.points:a.cashTotal;
    const bValue=sort==='points'?b.cashTotal-b.points:b.cashTotal;
    return aValue-bValue||a.cashTotal-b.cashTotal;
  }),[merged.ready,sort]);

  useEffect(()=>{
    setRows(newRows());setSameProduct(false);setReviewed(false);
    setOpened(Boolean(openRequested));setSort('cash');
  },[keyword]);
  useEffect(()=>{ if(openRequested)setOpened(true); },[openRequested]);

  const change=(storeId,key,value)=>{
    setRows(previous=>previous.map(row=>row.storeId===storeId?{...row,[key]:value}:row));
    setReviewed(false);
  };
  const addStore=id=>{
    if(!ALL_MANUAL_STORES.includes(id)||rows.some(row=>row.storeId===id))return;
    setRows(previous=>[...previous,{storeId:id,price:'',shipping:'',discount:'0',points:'0'}]);
    setReviewed(false);
  };
  const removeStore=id=>{
    if(MANUAL_STORES.includes(id))return;
    setRows(previous=>previous.filter(row=>row.storeId!==id));
    setReviewed(false);
  };
  const target=id=>stores.find(store=>store.id===id);
  const track=(store,placement)=>recordOutboundClick({
    section:'products',merchant:store.id,placement,sponsored:store.sponsored,
  });
  const submit=event=>{
    event.preventDefault();
    if(!canCompare)return;
    setReviewed(true);
    recordFunnelEvent('product_manual_ready');
  };

  return <section className="cp-manual" id="cp-manual" aria-labelledby="cp-manual-heading">
    <div className="cp-manual-head">
      <div><span className="cp-kicker">MULTI-STORE CASH CHECK</span>
        <h2 id="cp-manual-heading">12ショップまで、送料込みの安い順に比較。</h2>
        <p>楽天・Yahoo!の公式APIで取得した<strong>同一型番・送料無料の候補</strong>に、Amazon・家電量販店・その他のサイトで自分で確認した税込価格と送料を加えられます。価格入力はこの端末内で処理します。</p>
      </div>
      {!opened && <button className="cp-manual-open" type="button" onClick={()=>setOpened(true)}>他のショップの価格を追加する →</button>}
    </div>
    {opened && <form onSubmit={submit}>
      <div className="cp-manual-steps" aria-label="比較の手順"><span>1. 同じ型番・状態を確認</span><span>2. 商品価格と送料を入力</span><span>3. 全候補を安い順に比較</span></div>
      <div className="cp-manual-add">
        <label htmlFor="cp-add-store">比較するショップを増やす（最大12サイト）
          <select id="cp-add-store" defaultValue="" onChange={e=>{addStore(e.target.value);e.target.value='';}}>
            <option value="">追加するショップを選択</option>
            {available.map(store=><option key={store.id} value={store.id}>{store.name}</option>)}
          </select>
        </label>
        <span>{rows.length}ショップ入力欄を表示中／{ALL_MANUAL_STORES.length}ショップに対応</span>
      </div>
      <div className="cp-manual-rows">{rows.map(row=>{
        const link=target(row.storeId);
        const label=link?.name||DEFAULT_LABELS[row.storeId]||row.storeId;
        return <fieldset className="cp-manual-row" key={row.storeId}>
          <legend>{label}</legend>
          {!MANUAL_STORES.includes(row.storeId) && <button type="button" className="cp-manual-remove" onClick={()=>removeStore(row.storeId)}>このショップを外す</button>}
          {link&&<a className="cp-manual-external" target="_blank" href={link.url}
            rel={link.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
            onClick={()=>track(link,'manual-research')}>{label}で商品を探す ↗{link.sponsored&&<small> PR</small>}</a>}
          <p>購入先で型番・容量・新品／中古と、税込価格・送料・返品条件を確認して入力。</p>
          <div className="cp-manual-fields">
            {[
              ['price','商品の税込価格','例：39800'],
              ['shipping','送料（無料なら0）','未確認なら空欄'],
              ['discount','確定済みの即時値引き','なければ0'],
              ['points','後日付与ポイント相当額','なければ0']
            ].map(([key,label,placeholder])=><label key={key}>{label}（円）
              <input type="number" min="0" max="999999999" inputMode="numeric" placeholder={placeholder}
                value={row[key]} onChange={e=>change(row.storeId,key,e.target.value)} />
            </label>)}
          </div>
        </fieldset>;
      })}</div>
      <label className="cp-manual-confirm"><input type="checkbox" checked={sameProduct}
        onChange={e=>{setSameProduct(e.target.checked);setReviewed(false);}}/>
        <span>入力した候補はすべて<strong>同一の商品・型番・容量・新品／中古条件</strong>であると自分で確認した。確認できない候補は入力していない。</span>
      </label>
      <div className="cp-manual-actions">
        <button className="cp-manual-submit" type="submit" disabled={!canCompare}>確認できた全ショップを安い順に比較する</button>
        <label>結果の並び順
          <select value={sort} onChange={e=>{setSort(e.target.value);setReviewed(false);}}>
            <option value="cash">送料込み現金支払額が安い順</option>
            <option value="points">後日ポイントを考慮した参考額順</option>
          </select>
        </label>
      </div>
      {!canCompare && <p className="cp-manual-hint">同一商品を確認したうえで、価格と送料を両方入力してください。送料不明は0円にしません。2件以上の比較可能な候補が必要です（公式APIの送料無料候補も含めます）。</p>}
      {reviewed && canCompare && <div className="cp-manual-results" aria-live="polite">
        <h3>最も安い購入先（確認できた候補内）</h3>
        {sorted[0]&&<div className="cp-manual-winner"><span>送料と即時値引きを含む現金支払額</span>
          <strong>{money(sorted[0].cashTotal)}</strong><b>{sorted[0].storeName}{sorted[0].shopName&&'・'+sorted[0].shopName}</b>
          <small>{sorted[0].source==='manual'?'購入者が価格と送料を確認':'公式APIの同一型番・送料無料確認済み候補'}</small></div>}
        {sort==='points'&&<p>以下は後日ポイントを差し引いた参考額順です。実際に支払う現金額とは異なります。</p>}
        <ol>{sorted.map((entry,index)=>{
          const link=entry.url?{id:entry.storeId,url:entry.url,sponsored:entry.sponsored}:target(entry.storeId);
          return <li key={entry.id}>
            <div><span>{index+1}位 {entry.storeName}{entry.shopName&&'・'+entry.shopName}
              <small className="cp-manual-source">{entry.source==='api'?'公式APIの出品':'本人が入力・確認した価格'}</small></span>
              <strong>{money(entry.cashTotal)}</strong>
              <small>現金支払額（価格＋送料−確定済み即時値引き）／送料 {money(entry.shipping)}</small>
              <small>後日ポイント {money(entry.points)} ／ ポイント考慮後の参考額 {money(entry.cashTotal-entry.points)}</small>
            </div>
            {link&&<a href={link.url} target="_blank" rel={link.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
              onClick={()=>track({...link,id:entry.storeId},'manual-result')}>このショップで最終条件を確認 ↗{link.sponsored&&<small> PR</small>}</a>}
          </li>;
        })}</ol>
        {sorted.length>=2 && <p>上位2件の{sort==='points'?'ポイント考慮後参考額':'現金支払額'}の差：<strong>{money(
          sort==='points'
            ? (sorted[1].cashTotal-sorted[1].points)-(sorted[0].cashTotal-sorted[0].points)
            : sorted[1].cashTotal-sorted[0].cashTotal
        )}</strong>（今回確認できた候補のみ）</p>}
        <p className="cp-manual-disclosure">比較できたのは、APIの同一型番・送料0円候補と、本人が送料・仕様を確認して入力した候補だけです。取得対象外の店はランキングに入りません。販売ページで税・決済手数料・クーポン・在庫・返品と保証を再確認してください。世界最安値の保証ではなく、広告報酬は順位計算に使いません。</p>
      </div>}
    </form>}
    {!opened && <p className="cp-manual-privacy">Amazon・ヨドバシ・ビックカメラ等を追加できます。料金はAPIから勝手に推測せず、販売ページで確認した額を入力します。</p>}
    {opened&&<p className="cp-manual-privacy">入力した価格・送料はブラウザ内のみで計算。検索語・入力金額は送信せず、比較操作回数と外部リンクの種類だけを匿名集計します。</p>}
  </section>;
}
