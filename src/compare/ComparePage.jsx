import { useEffect, useMemo, useState } from 'react';
import SiteFooter from '../shared/SiteFooter.jsx';
import { searchResponse } from '../shared/searchRequest.js';
import SiteHeader from '../shared/SiteHeader.jsx';
import SiteConcierge from '../shared/SiteConcierge.jsx';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { MERCHANTS, MERCHANT_KINDS, storeLinks } from '../shared/merchants.js';
import { parseProductRequest } from '../shared/productAdvisor.js';
import { openConcierge } from '../shared/conciergeActions.js';
import './compare.css';

const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');
const EXAMPLES = ['ソニー WH-1000XM5', 'AirPods Pro', 'ロボット掃除機', '電気ケトル', 'Nintendo Switch', '加湿器'];
const ENV = import.meta.env;

function readParams() {
  if (typeof window === 'undefined') return { q: '', ref: '', jan: '' };
  const params = new URLSearchParams(window.location.search);
  return { q: params.get('q') || '', ref: params.get('ref') || '', jan: params.get('jan') || '' };
}

function OfferRow({ offer, rank, cheapest }) {
  const track = () => recordOutboundClick({ section: 'products', merchant: offer.store === 'yahoo' ? 'yahoo-shopping' : 'rakuten', placement: 'compare-offer', sponsored: offer.sponsored });
  return <li className={'cp-offer' + (cheapest ? ' is-cheapest' : '')}>
    <span className="cp-rank">{rank}</span>
    {offer.image ? <img src={offer.image} alt="" loading="lazy" width="64" height="64" /> : <span className="cp-noimg" aria-hidden="true">🛍️</span>}
    <div className="cp-offer-body">
      <div className="cp-offer-store"><b className={'cp-store cp-store-' + offer.store}>{offer.storeName}</b><span>{offer.shopName}</span>{cheapest && <em className="cp-best">最安</em>}</div>
      <p className="cp-offer-title">{offer.title.length > 90 ? offer.title.slice(0, 90) + '…' : offer.title}</p>
      <p className="cp-offer-meta">{offer.shippingFree ? '送料無料' : '送料別（店舗で確認）'}{offer.reviewCount > 0 ? `・★${offer.reviewAverage.toFixed(1)}（${offer.reviewCount.toLocaleString('ja-JP')}件）` : ''}</p>
    </div>
    <div className="cp-offer-price">
      <strong>{yen(offer.effectivePrice)}</strong>
      <small>{offer.point > 0 ? `価格 ${yen(offer.price)} − ${offer.point.toLocaleString('ja-JP')}pt` : `価格 ${yen(offer.price)}`}</small>
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

  useEffect(() => {
    if (!query.q && !query.jan) return undefined;
    let alive = true;
    const controller = new AbortController();
    const params = new URLSearchParams();
    for (const key of ['q', 'ref', 'jan']) if (query[key]) params.set(key, query[key]);
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
    const request = parseProductRequest(text);
    const q = request.need || request.maxPrice || request.minPrice ? request.keyword || text : text;
    const next = { q, ref: '', jan: /^\d{8}$|^\d{13}$/.test(text) ? text : '' };
    setQuery(next);
    setShowSimilar(false);
    const url = new URL(window.location.href);
    url.search = new URLSearchParams(Object.entries(next).filter(([, v]) => v)).toString();
    window.history.replaceState({}, '', url.pathname + url.search);
  }
  const pick = text => { setInput(text); setQuery({ q: text, ref: '', jan: '' }); window.history.replaceState({}, '', '/compare/?q=' + encodeURIComponent(text)); };

  const offers = (state.data?.offers || []).filter(o => !freeOnly || o.shippingFree);
  const same = offers.filter(o => o.sameProduct);
  const similar = offers.filter(o => !o.sameProduct);
  const main = same.length ? same : similar;
  const rest = same.length ? similar : [];
  const cheapest = main[0];
  const stores = storeLinks(query.q || input, { env: ENV, reference: query.ref });
  const sources = state.data?.sources || {};

  return <div className="cp-page">
    <SiteHeader active="products" />
    <main id="main-content">
      <section className="cp-hero">
        <div className="cp-wrap">
          <span className="cp-kicker">✳ PRICE COMPARISON — ALL STORES</span>
          <h1>買う前に、<em>主要ショップ</em>の価格を比較。</h1>
          <p>楽天市場・Yahoo!ショッピングの実際の販売価格を、ポイント還元後の「実質価格」で並べます。Amazon・家電量販店・フリマも同じキーワードでまとめて確認できます。</p>
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
            <li><b>同じ商品を見分ける</b>型番やJANコードが一致する出品を「同じ商品」としてまとめ、実質価格の安い順に並べます。</li>
            <li><b>ほかのショップも一括確認</b>APIのないショップは、同じキーワードの検索結果へ直接リンクします（価格はリンク先で確認）。</li>
          </ol>
          <h2>比較できるショップ</h2>
          <div className="cp-store-list">{MERCHANTS.map(m => <span key={m.id} className={m.priced ? 'priced' : ''}>{m.name}{m.priced ? '（価格を自動比較）' : ''}</span>)}</div>
        </section>}

        {(query.q || query.jan) && <section className="cp-results" aria-live="polite">
          <div className="cp-results-head">
            <div><span className="cp-kicker">RESULTS</span><h2>「{query.ref || query.q || query.jan}」の価格比較</h2>
              {state.data?.fetchedAt && <p>取得時刻：{new Date(state.data.fetchedAt).toLocaleString('ja-JP')}（価格・在庫は変動します）</p>}</div>
            <label className="cp-toggle"><input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} />送料無料のみ</label>
          </div>
          {state.loading && <p className="cp-muted">各ショップの価格を取得しています…</p>}
          {state.error && <p className="cp-error">{state.error}</p>}
          {cheapest && <div className="cp-summary">
            <div><span>{same.length ? '取得した同じ出品で最安（実質）' : '取得した近い商品の最安（実質）'}</span><strong>{yen(cheapest.effectivePrice)}</strong><small>{cheapest.storeName}・{cheapest.shopName}</small></div>
            <div><span>価格の幅</span><strong>{yen(Math.min(...main.map(o => o.effectivePrice)))}〜{yen(Math.max(...main.map(o => o.effectivePrice)))}</strong><small>{main.length}件の出品</small></div>
            <div><span>比較したショップ</span><strong>{[sources.rakuten === 'ok' && '楽天', sources.yahoo === 'ok' && 'Yahoo!'].filter(Boolean).join('・') || '—'}</strong><small>{sources.yahoo === 'disabled' ? 'Yahoo!は価格自動取得の準備中' : 'APIで取得した実際の価格'}</small></div>
          </div>}
          {cheapest && <div className="cp-next-step"><strong>{cheapest.storeName}で販売条件を確認</strong><p>表示価格は送料や個別のクーポン適用後の総額ではありません。購入前に型番・送料・納期・返品条件を確認してください。</p><a className="vl-primary" href={cheapest.url} target="_blank" rel={cheapest.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'} onClick={() => recordOutboundClick({ section: 'products', merchant: cheapest.store === 'yahoo' ? 'yahoo-shopping' : 'rakuten', placement: 'compare-top-offer', sponsored: cheapest.sponsored })}>この出品の価格・在庫を確認 ↗{cheapest.sponsored && <small>PR</small>}</a></div>}
          {!state.loading && state.data && !same.length && main.length > 0 && <p className="cp-note">型番が一致する出品が見つからなかったため、近い商品を表示しています。型番やJANコードで検索すると精度が上がります。</p>}
          {main.length > 0 && <ol className="cp-offers">{main.slice(0, 15).map((offer, index) => <OfferRow key={offer.store + offer.url} offer={offer} rank={index + 1} cheapest={index === 0} />)}</ol>}
          {!state.loading && state.data && offers.length === 0 && <p className="cp-muted">価格を取得できる出品が見つかりませんでした。下のショップで直接探してください。</p>}
          {rest.length > 0 && <div className="cp-similar">
            <button type="button" onClick={() => setShowSimilar(v => !v)} aria-expanded={showSimilar}>{showSimilar ? '▲' : '▼'} 型番が異なる・近い商品（{rest.length}件）</button>
            {showSimilar && <ol className="cp-offers">{rest.slice(0, 15).map((offer, index) => <OfferRow key={offer.store + offer.url} offer={offer} rank={index + 1} cheapest={false} />)}</ol>}
          </div>}
          <button type="button" className="cp-ask" onClick={() => openConcierge(`${query.ref || query.q}を探してる`)}>✳ 迷ったらAIコンシェルジュに相談</button>
        </section>}

        {(query.q || input.trim()) && <section className="cp-stores">
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
          <p>「PR」表示のリンクはアフィリエイト広告です。リンク経由で購入が成立すると、VivlicaがショップやASPから紹介料を受け取る場合があります。価格の並び順は実質価格（価格−付与ポイント）で決めており、報酬額は使っていません。</p>
          <p>価格・ポイント・送料・在庫は各ショップの公式APIから取得した時点の情報です。購入前に販売ページで最新の条件を確認してください。APIのないショップの価格を自動収集（スクレイピング）することはしていません。</p>
        </section>
      </div>
    </main>
    <SiteFooter />
    <SiteConcierge section="products" />
  </div>;
}
