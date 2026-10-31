import { useEffect, useMemo, useState } from 'react';
import SiteFooter from '../shared/SiteFooter.jsx';
import { searchResponse } from '../shared/searchRequest.js';
import SiteHeader from '../shared/SiteHeader.jsx';
import SiteConcierge from '../shared/SiteConcierge.jsx';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { MERCHANTS, MERCHANT_KINDS, storeLinks } from '../shared/merchants.js';
import { compareBudget, comparisonInput, withinCompareBudget } from '../shared/compareBudget.js';
import { PRICE_SORTS, displayValue, displayRange } from '../shared/offerDisplay.js';
import { filterOffers, offerKey, shippingLabel, offerSummary } from '../shared/compareWorkbench.js';
import { OfferFilters, OfferShortlist } from './OfferWorkbench.jsx';
import { openConcierge } from '../shared/conciergeActions.js';
import ManualStoreCompare from './ManualStoreCompare.jsx';
import './compare.css';

const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');
const EXAMPLES = ['ソニー WH-1000XM5', 'AirPods Pro', 'ロボット掃除機', '電気ケトル', 'Nintendo Switch', '加湿器'];
const ENV = import.meta.env;

function readParams() {
  if (typeof window === 'undefined') return { q: '', ref: '', jan: '' };
  const params = new URLSearchParams(window.location.search);
  return { q: params.get('q') || '', ref: params.get('ref') || '', jan: params.get('jan') || '', ...compareBudget(Object.fromEntries(params)) };
}

function OfferRow({ offer, rank, cheapest, sort, selected, onToggle, selectionFull }) {
  const track = () => recordOutboundClick({ section: 'products', merchant: offer.store === 'yahoo' ? 'yahoo-shopping' : 'rakuten', placement: 'compare-offer', sponsored: offer.sponsored });
  return <li className={'cp-offer' + (cheapest ? ' is-cheapest' : '')}>
    <span className="cp-rank">{rank}</span>
    {offer.image ? <img src={offer.image} alt="" loading="lazy" width="64" height="64" /> : <span className="cp-noimg" aria-hidden="true">🛍️</span>}
    <div className="cp-offer-body">
      <div className="cp-offer-store"><b className={'cp-store cp-store-' + offer.store}>{offer.storeName}</b><span>{offer.shopName}</span>{cheapest && <em className="cp-best">{sort === 'points' ? '表示候補の参考額が最小' : '表示候補の価格が最小'}</em>}</div>
      <p className="cp-offer-title">{offer.title.length > 90 ? offer.title.slice(0, 90) + '…' : offer.title}</p>
      <p className="cp-offer-meta">{shippingLabel(offer)}{offer.reviewCount > 0 ? `・★${offer.reviewAverage.toFixed(1)}（${offer.reviewCount.toLocaleString('ja-JP')}件）` : ''}</p>
      <p className="cp-identity">{offer.matchBasis==='jan'?'JAN一致':offer.matchBasis==='model'?'型番一致・仕様は要確認':'商品名が類似・同一商品か未確認'}</p>
      <label className="cp-pick"><input type="checkbox" checked={selected} disabled={!selected&&selectionFull} onChange={()=>onToggle(offer)}/>比較表に追加</label>
    </div>
    <div className="cp-offer-price">
      <strong>{yen(offer.price)}</strong>
      <small>商品価格・送料／割引条件は別に確認</small>
      {offer.point > 0 && <small>付与予定ポイント：{offer.point.toLocaleString("ja-JP")}pt</small>}
      {sort === "points" && <small className="cp-point-estimate">ポイント考慮後の参考額：{yen(displayValue(offer, "points"))}</small>}
      <a href={offer.url} target="_blank" rel={offer.sponsored ? 'sponsored noopener' : 'noopener noreferrer'} onClick={track}>ショップで見る ↗{offer.sponsored && <em className="cp-pr">PR</em>}</a>
    </div>
  </li>;
}

export default function ComparePage() {
  const initial = useMemo(readParams, []);
  const [input, setInput] = useState(initial.q);
  const [query, setQuery] = useState(initial);
  const [state, setState] = useState({ loading: false, data: null, error: '' });
  const [showSimilar, setShowSimilar] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [priceSort, setPriceSort] = useState("cash");
  const [filters,setFilters]=useState({store:'all',shipping:'all',reviewMin:'0',maxPrice:'',keyword:'',verifiedOnly:false});
  const [selectedKeys,setSelectedKeys]=useState([]);
  const [displayLimit,setDisplayLimit]=useState(15);

  useEffect(() => {
    if (!query.q && !query.jan) return undefined;
    let alive = true;
    const controller = new AbortController();
    const params = new URLSearchParams();
    for (const key of ['q', 'ref', 'jan', 'minPrice', 'maxPrice']) if (query[key]) params.set(key, query[key]);
    setState({ loading: true, data: null, error: '' });
    searchResponse('/api/compare?' + params, { signal: controller.signal })
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(data => { if (alive) setState({ loading: false, data, error: '' }); })
      .catch(() => { if (alive) setState({ loading: false, data: null, error: '価格データを取得できませんでした。下のリンクから各ショップで確認できます。' }); });
    return () => { alive = false; controller.abort(); };
  }, [query]);

  function submit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    // "1万円以下のワイヤレスイヤホン" → search words; plain names stay as typed.
    const next = comparisonInput(text);
    setQuery(next);
    setShowSimilar(false);setSelectedKeys([]);setDisplayLimit(15);
    const url = new URL(window.location.href);
    url.search = new URLSearchParams(Object.entries(next).filter(([, v]) => v)).toString();
    window.history.replaceState({}, '', url.pathname + url.search);
  }
  const pick = text => { setInput(text); setSelectedKeys([]);setDisplayLimit(15);setQuery({ q: text, ref: '', jan: '' }); window.history.replaceState({}, '', '/compare/?q=' + encodeURIComponent(text)); };

  const rawOffers=(state.data?.offers||[]).filter(o=>withinCompareBudget(o,query));
  const offers=filterOffers(rawOffers,{...filters,shipping:freeOnly?'free':filters.shipping,
    includeUnverified:!filters.verifiedOnly,sort:priceSort});
  const selectedOffers=rawOffers.filter(o=>selectedKeys.includes(offerKey(o))).slice(0,4);
  const changeFilter=(key,value)=>{setFilters(current=>({...current,[key]:value}));setDisplayLimit(15);};
  const toggleSelected=offer=>setSelectedKeys(current=>{
    const id=offerKey(offer);
    return current.includes(id)?current.filter(key=>key!==id):current.length<4?[...current,id]:current;
  });
  const visibleMetrics=offerSummary(offers,priceSort);
  const same = offers.filter(o => o.sameProduct);
  const similar = offers.filter(o => !o.sameProduct);
  const main = same.length ? same : similar;
  const rest = same.length ? similar : [];
  const cheapest = main.length? [...main].sort((a,b)=>displayValue(a,priceSort==='points'?'points':'cash')-displayValue(b,priceSort==='points'?'points':'cash'))[0]:null;
  const range = displayRange(main, priceSort);
  const searchTerm = query.q || query.jan || input.trim();
  const stores = storeLinks(searchTerm, { env: ENV, reference: query.ref });
  const sources = state.data?.sources || {};

  return <div className="cp-page">
    <SiteHeader active="products" />
    <main id="main-content">
      <section className="cp-hero">
        <div className="cp-wrap">
          <span className="cp-kicker">価格・送料・販売条件を比べる</span>
          <h1>買う前に、<em>主要ショップ</em>の価格を比較。</h1>
          <p>楽天市場・Yahoo!ショッピングの価格取得に対応。取得できないときも、楽天・Amazon・Yahoo!で確認した金額を入力して送料込みで比較できます。ポイントは現金値引きと区別します。</p>
          <form className="cp-search" role="search" onSubmit={submit}>
            <label htmlFor="cp-q" className="cp-visually-hidden">商品名・型番・JANコード</label>
            <input id="cp-q" type="search" value={input} onChange={e => setInput(e.target.value)} placeholder="商品名・型番・JANコード（例：WH-1000XM5）" autoComplete="off" />
            <button type="submit">価格を比較 →</button>
          </form>
          <div className="cp-examples"><span>例：</span>{EXAMPLES.map(text => <button type="button" key={text} onClick={() => pick(text)}>{text}</button>)}</div>
        </div>
      </section>

      <div className="cp-wrap cp-body">
        {!query.q && !query.jan && <section className="cp-intro">
          <h2>比較のしくみ</h2>
          <ol>
            <li><b>実際の価格を取得</b>楽天市場・Yahoo!ショッピングの公式APIから、その時点の販売価格・ポイント・送料条件を取得します。</li>
            <li><b>同じ商品を見分ける</b>型番やJANコードが一致する出品を「同じ商品」としてまとめ、商品価格が安い順を標準として並べます。</li>
            <li><b>ほかのショップも一括確認</b>APIのないショップは、同じキーワードの検索結果へ直接リンクします（価格はリンク先で確認）。</li>
          </ol>
          <h2>比較できるショップ</h2>
          <div className="cp-store-list">{MERCHANTS.map(m => <span key={m.id} className={m.priced ? 'priced' : ''}>{m.name}{m.priced ? '（価格を自動比較）' : ''}</span>)}</div>
        </section>}

        {(query.q || query.jan) && <section className="cp-results" aria-live="polite">
          <div className="cp-results-head">
            <div><span className="cp-kicker">RESULTS</span><h2>「{query.ref || query.q || query.jan}」の価格比較</h2>
              {state.data?.fetchedAt && <p>取得時刻：{new Date(state.data.fetchedAt).toLocaleString('ja-JP')}（価格・在庫は変動します）</p>}</div>
            <div className="cp-result-controls">
              <label className="cp-sort-label" htmlFor="cp-price-sort">比較基準
                <select id="cp-price-sort" value={priceSort} onChange={e => setPriceSort(e.target.value)}>
                  {Object.entries(PRICE_SORTS).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}
                </select>
              </label>
              <label className="cp-toggle"><input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} />送料無料のみ</label>
            </div>
          </div>
          {(query.minPrice > 0 || query.maxPrice > 0) && <p className="cp-note">商品価格の条件：{query.minPrice > 0 ? yen(query.minPrice) + '以上' : ''}{query.minPrice > 0 && query.maxPrice > 0 ? '・' : ''}{query.maxPrice > 0 ? yen(query.maxPrice) + '以下' : ''}（ポイント差引前・送料別）。ショップへの検索リンクにはこの価格条件は引き継がれません。</p>}
          <OfferFilters filters={filters} onChange={changeFilter}
            storeOptions={[{id:'rakuten',name:'楽天市場'},{id:'yahoo',name:'Yahoo!ショッピング'}]}
            visibleCount={offers.length} totalCount={rawOffers.length}
            onReset={()=>{setFilters({store:'all',shipping:'all',reviewMin:'0',maxPrice:'',keyword:'',verifiedOnly:false});setFreeOnly(false);setDisplayLimit(15);}}/>
          <p className="cp-criteria-note">商品価格はポイント差引前・送料別の表示です。「送料無料」は取得元の送料区分で判定します。ポイント考慮後は参考値であり、購入時の支払額ではありません。</p>
          {state.loading && <p className="cp-muted">各ショップの価格を取得しています…</p>}
          {state.error && <p className="cp-error">{state.error} <a href="#cp-manual">3ショップの価格を手入力して比較する →</a></p>}
          {visibleMetrics && <p className="cp-result-context" role="status">表示中：{visibleMetrics.count}件／{visibleMetrics.stores}モール、JAN一致{visibleMetrics.evidence}件。型番・JANが確認できない候補は同一商品と断定しません。</p>}
          {cheapest && <div className="cp-summary">
            <div><span>{priceSort === "points" ? "ポイント差引後の最も低い参考額" : (same.length ? "型番・JAN照合候補の最も低い商品価格" : "類似出品の最も低い商品価格")}</span><strong>{yen(displayValue(cheapest, priceSort))}</strong><small>{priceSort === "points" ? "現金支払額ではありません · " : ""}{cheapest.storeName}・{cheapest.shopName}</small></div>
            <div><span>{priceSort === "points" ? "ポイント考慮後の参考額の幅" : "商品価格の幅"}</span><strong>{yen(range.low)}〜{yen(range.high)}</strong><small>{main.length}件の表示候補のみ・送料別</small></div>
            <div><span>比較したショップ</span><strong>{[sources.rakuten === 'ok' && '楽天', sources.yahoo === 'ok' && 'Yahoo!'].filter(Boolean).join('・') || '—'}</strong><small>{sources.yahoo === 'disabled' ? 'Yahoo!は価格自動取得の準備中' : 'APIで取得した実際の価格'}</small></div>
          </div>}
          {cheapest && <div className="cp-next-step"><strong>{cheapest.storeName}で販売条件を確認</strong><p>型番・JANによる照合は、色・容量・新品／中古・付属品の一致を保証しません。表示価格は送料や個別のクーポン適用後の総額ではありません。購入前に型番・送料・納期・返品条件を確認してください。</p><a className="vl-primary" href={cheapest.url} target="_blank" rel={cheapest.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'} onClick={() => recordOutboundClick({ section: 'products', merchant: cheapest.store === 'yahoo' ? 'yahoo-shopping' : 'rakuten', placement: 'compare-top-offer', sponsored: cheapest.sponsored })}>この出品の価格・在庫を確認 ↗{cheapest.sponsored && <small>PR</small>}</a></div>}
          {!state.loading && state.data && !same.length && main.length > 0 && <p className="cp-note">型番が一致する出品が見つからなかったため、近い商品を表示しています。型番やJANコードで検索すると精度が上がります。</p>}
          <OfferShortlist offers={selectedOffers} onRemove={id=>setSelectedKeys(keys=>keys.filter(key=>key!==id))} onClear={()=>setSelectedKeys([])}/>
          {main.length > 0 && <ol className="cp-offers">{main.slice(0,displayLimit).map((offer, index) => <OfferRow key={offerKey(offer)} offer={offer} rank={index + 1} cheapest={index === 0&&(priceSort==='cash'||priceSort==='points')} sort={priceSort} selected={selectedKeys.includes(offerKey(offer))} selectionFull={selectedKeys.length>=4} onToggle={toggleSelected} />)}</ol>}
          {main.length > displayLimit && <button type="button" className="cp-show-more" onClick={()=>setDisplayLimit(n=>n+15)}>さらに15件表示（残り{main.length-displayLimit}件）</button>}
          {!state.loading && state.data && offers.length === 0 && <p className="cp-muted">{Object.values(sources).some(status => status === 'ok') ? '今回の取得結果に表示できる出品がありません。下のショップでも確認できます。' : '現在はショップの価格を自動取得できません。各ショップの検索結果で価格・在庫を直接確認してください。'}</p>}
          {rest.length > 0 && <div className="cp-similar">
            <button type="button" onClick={() => setShowSimilar(v => !v)} aria-expanded={showSimilar}>{showSimilar ? '▲' : '▼'} 型番が異なる・近い商品（{rest.length}件）</button>
            {showSimilar && <ol className="cp-offers">{rest.map((offer, index) => <OfferRow key={offerKey(offer)} offer={offer} rank={index + 1} cheapest={false} sort={priceSort} selected={selectedKeys.includes(offerKey(offer))} selectionFull={selectedKeys.length>=4} onToggle={toggleSelected} />)}</ol>}
          </div>}
          <button type="button" className="cp-ask" onClick={() => openConcierge(`${query.ref || query.q}を探してる`)}>✳ 条件を変えて候補を探す</button>
        </section>}

        {(query.q || query.jan) && <ManualStoreCompare keyword={searchTerm} stores={stores} />}

        {searchTerm && <section className="cp-stores">
          <h2>ほかのショップでも探す</h2>
          <p>同じキーワードの検索結果を開きます。これらのショップは価格を自動取得していないため、価格・送料はリンク先で確認してください。</p>
          {Object.entries(MERCHANT_KINDS).map(([kind, label]) => {
            const list = stores.filter(store => store.kind === kind);
            return list.length > 0 && <div key={kind} className="cp-store-group"><h3>{label}</h3><div className="cp-store-grid">{list.map(store =>
              <a key={store.id} href={store.url} target="_blank" rel={store.sponsored ? 'sponsored noopener' : 'noopener noreferrer'}
                onClick={() => recordOutboundClick({ section: 'products', merchant: store.id, placement: 'compare-store', sponsored: store.sponsored })}>
                <strong>{store.name}</strong>{store.sponsored && <em className="cp-pr">PR</em>}<span aria-hidden="true">↗</span></a>)}</div></div>;
          })}
        </section>}

        <section className="cp-disclosure">
          <h2>広告・データについて</h2>
          <p>「PR」表示のリンクはアフィリエイト広告です。リンク経由で購入が成立すると、VivlicaがショップやASPから紹介料を受け取る場合があります。並び順は商品価格を安い順に並べるのが標準です。口コミ評価・件数やポイント差引後の参考額でも並び替えられます。ポイントは購入時の現金値引きではなく、広告報酬額は順位計算に使っていません。</p>
          <p>価格・ポイント・送料・在庫は各ショップの公式APIから取得した時点の情報です。購入前に販売ページで最新の条件を確認してください。APIのないショップの価格を自動収集（スクレイピング）することはしていません。</p>
        </section>
      </div>
    </main>
    <SiteFooter />
    <SiteConcierge section="products" />
  </div>;
}
