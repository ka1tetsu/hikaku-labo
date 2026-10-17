import { useEffect, useRef, useState } from 'react';
import { siteReply, welcomeMessage } from './siteConcierge.js';
import { pickProducts } from './productAdvisor.js';
import { recordOutboundClick } from './outboundClient.js';
import { runConciergeAction } from './conciergeActions.js';
import { searchRakutenItems, buildRakutenAffiliateUrl, buildRakutenSearchAffiliateUrl, buildAmazonAffiliateUrl, buildYahooAffiliateUrl } from '../api.js';
import { SERVICES } from '../tools/catalog.js';
import { outboundLink, recordOutbound } from '../tools/affiliate.js';
import { AffiliateNote, BookingLinkList } from '../travel/BookingLinks.jsx';
import { LINK_CONFIG } from '../travel/linkConfig.js';
import './concierge.css';

const yen = n => '¥' + Number(n).toLocaleString('ja-JP');

function ProductPicks({ query }) {
  const [state, setState] = useState({ loading: true, items: [], error: '' });
  const { keyword, minPrice, maxPrice, sort, freeShipping, page } = query;
  useEffect(() => {
    let alive = true;
    searchRakutenItems(keyword, '', page || 1, { minPrice, maxPrice, sort, freeShipping })
      .then(data => { if (alive) setState({ loading: false, items: pickProducts(data.items, { minPrice, maxPrice, sort, freeShipping }), error: '' }); })
      .catch(() => { if (alive) setState({ loading: false, items: [], error: '商品データを取得できませんでした。' }); });
    return () => { alive = false; };
  }, [keyword, minPrice, maxPrice, sort, freeShipping, page]);
  const track = merchant => recordOutboundClick({ section: 'products', merchant, placement: 'concierge', sponsored: true });

  return <div className="hcx-products">
    {state.loading && <p className="hcx-muted">楽天市場から商品を探しています…</p>}
    {!state.loading && state.items.length === 0 && <p className="hcx-muted">{state.error || 'この条件に合う商品が見つかりませんでした。条件を変えるか、下のリンクから各モールで探してください。'}</p>}
    {state.items.map(item => <a key={item.itemCode} className="hcx-product" href={buildRakutenAffiliateUrl(item, keyword)} target="_blank" rel="sponsored noopener" onClick={() => track('rakuten')}>
      {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" width="72" height="72" /> : <span className="hcx-product-noimg" aria-hidden="true">🛍️</span>}
      <span className="hcx-product-body">
        <strong>{item.itemName.length > 60 ? item.itemName.slice(0, 60) + '…' : item.itemName}</strong>
        <span className="hcx-product-price">{yen(item.itemPrice)}{item.pointBack > 0 && <small>実質 {yen(item.effectivePrice)}</small>}</span>
        <small>{item.reviewCount > 0 ? `★${item.reviewAverage.toFixed(1)}（${item.reviewCount.toLocaleString('ja-JP')}件）` : 'レビューなし'}{item.isFreeShipping ? '・送料無料' : ''}・{item.shopName}</small>
      </span>
      <em className="hcx-pr">PR</em>
    </a>)}
    <div className="hcx-malls">
      <span>同じキーワードで比べる：</span>
      <a href={buildRakutenSearchAffiliateUrl(keyword)} target="_blank" rel="sponsored noopener" onClick={() => track('rakuten')}>楽天</a>
      <a href={buildAmazonAffiliateUrl(keyword)} target="_blank" rel="sponsored noopener" onClick={() => track('amazon')}>Amazon</a>
      <a href={buildYahooAffiliateUrl(keyword)} target="_blank" rel="sponsored noopener" onClick={() => track('yahoo-shopping')}>Yahoo!</a>
      <button type="button" onClick={() => runConciergeAction({ type: 'products', keyword })}>比較ページで一覧を見る →</button>
    </div>
    <p className="hcx-note">「PR」はアフィリエイトリンクです。商品情報は楽天市場の取得時点のもので、最新の価格・送料・在庫は販売ページで確認してください。</p>
  </div>;
}

function ToolPicks({ cards, selectorUrl }) {
  return <div className="hcx-tools">
    {cards.map((card, index) => {
      const service = SERVICES.find(s => s.id === card.id);
      const link = service ? outboundLink(service) : null;
      return <article key={card.id} className="hcx-tool">
        <div className="hcx-tool-head"><span className="hcx-rank">{index + 1}</span><div><strong>{card.name}</strong><small>{card.subtitle}</small></div><span className="hcx-tool-score">適合度 {card.score}</span></div>
        <p className="hcx-tool-price">料金の目安：{card.price}</p>
        <ul>{card.reasons.slice(0, 2).map(reason => <li key={reason}>{reason}</li>)}</ul>
        {link && <a className="hcx-tool-link" href={link.url} target="_blank" rel={link.sponsored ? 'sponsored noopener' : 'noopener noreferrer'} onClick={() => recordOutbound(service, link.sponsored, 'concierge')}>
          公式サイトで確認 ↗{link.sponsored && <em className="hcx-pr">PR</em>}</a>}
      </article>;
    })}
    <button type="button" className="hcx-wide" onClick={() => runConciergeAction({ type: 'tools', url: selectorUrl })}>診断ページで詳しく比較する →</button>
  </div>;
}

function AssistantMessage({ message, onSend, onAction }) {
  return <div className="hcx-msg hcx-msg-bot">
    <span className="hcx-avatar" aria-hidden="true">✳</span>
    <div className="hcx-bubble">
      {message.summary?.length > 0 && <div className="hcx-summary" aria-label="読み取った条件">{message.summary.map(item => <span key={item}>{item}</span>)}</div>}
      {message.text.map(line => <p key={line}>{line}</p>)}
      {message.bullets && <ul className="hcx-bullets">{message.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
      {message.cards && <div className="hcx-cards">{message.cards.map((card, index) => <article key={card.id} className="hcx-card">
        <div className="hcx-card-head"><span className="hcx-rank">{index + 1}</span><span className="hcx-card-emoji" aria-hidden="true">{card.emoji}</span>
          <div><strong>{card.name}</strong><small>{card.region}・{card.tagline}</small></div></div>
        <ul>{card.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
        <p className="hcx-card-meta">{card.access}<br />おすすめ時期：{card.best}</p>
        {card.fit && <p className="hcx-card-fit">予算との相性：{card.fit}</p>}
        <div className="hcx-card-actions">
          <button type="button" onClick={() => onSend(card.name + 'のモデルコース')}>モデルコース</button>
          <button type="button" className="ghost" onClick={() => onSend(card.name + 'の航空券とホテル')}>航空券・宿</button>
        </div>
      </article>)}</div>}
      {message.itinerary && <div className="hcx-plan">
        <ol>{message.itinerary.days.map(day => <li key={day.day}><b>DAY {day.day}</b><span>{day.stops.join(' → ')}</span></li>)}</ol>
        <button type="button" onClick={() => onAction(message.action)}>このプランを旅行ページで開いて予算・予約まで見る →</button>
      </div>}
      {message.links && <div className="hcx-links">
        {message.links.flights?.length > 0 && <><h4>✈️ 航空券を探す</h4><BookingLinkList links={message.links.flights} placement="concierge-flights" /></>}
        {message.links.stays?.length > 0 && <><h4>🏨 宿を探す</h4><BookingLinkList links={message.links.stays} placement="concierge-stays" /></>}
        <AffiliateNote />
      </div>}
      {message.productQuery && <ProductPicks query={message.productQuery} />}
      {message.toolCards && <ToolPicks cards={message.toolCards} selectorUrl={message.selectorUrl} />}
      {message.action?.type === 'planner' && <button type="button" className="hcx-wide" onClick={() => onAction(message.action)}>予算シミュレーターを開く →</button>}
      {message.chips?.length > 0 && <div className="hcx-chips">{message.chips.map(chip => <button type="button" key={chip} onClick={() => onSend(chip)}>{chip}</button>)}</div>}
    </div>
  </div>;
}

// One concierge for the whole site: travel, shopping and web tools.
export default function ConciergeChat({ section = 'site', onAction = runConciergeAction, compact = false, autoFocus = false }) {
  const [messages, setMessages] = useState(() => [welcomeMessage(section)]);
  const [convo, setConvo] = useState({});
  const [input, setInput] = useState('');
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Bring the start of the newest exchange into view, not the bottom of a long answer.
    const log = logRef.current;
    const last = log?.querySelectorAll('.hcx-msg-user');
    if (log && last?.length) log.scrollTo({ top: last[last.length - 1].offsetTop - 12, behavior: 'smooth' });
  }, [messages]);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  function send(text) {
    const value = String(text || '').trim();
    if (!value) return;
    const { message, state } = siteReply(value, convo, { section, config: LINK_CONFIG });
    setConvo(state);
    setMessages(list => [...list, { role: 'user', text: [value] }, message].slice(-40));
    setInput('');
  }
  function reset() {
    setMessages([welcomeMessage(section)]);
    setConvo({});
    inputRef.current?.focus();
  }

  return <div className={'hcx-chat' + (compact ? ' hcx-compact' : '')}>
    <div className="hcx-log" ref={logRef} role="log" aria-live="polite" aria-label="コンシェルジュとの会話">
      {messages.map((message, index) => message.role === 'user'
        ? <div className="hcx-msg hcx-msg-user" key={index}><div className="hcx-bubble">{message.text[0]}</div></div>
        : <AssistantMessage key={index} message={message} onSend={send} onAction={onAction} />)}
    </div>
    <form className="hcx-composer" onSubmit={e => { e.preventDefault(); send(input); }}>
      <label htmlFor={'hcx-input-' + section + (compact ? '-c' : '')} className="hcx-visually-hidden">コンシェルジュへのメッセージ</label>
      <textarea id={'hcx-input-' + section + (compact ? '-c' : '')} ref={inputRef} rows={2} maxLength={400} value={input}
        placeholder="例：週末に温泉旅行／1万円以下のイヤホン／ネットショップを無料で始めたい"
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }} />
      <div className="hcx-composer-actions">
        <button type="button" className="ghost" onClick={reset}>リセット</button>
        <button type="submit" disabled={!input.trim()}>相談する ↑</button>
      </div>
    </form>
    <p className="hcx-disclaimer">{compact
      ? '外部AI APIは不使用。ブラウザ内で比較ラボのデータから提案します。料金・在庫・入国条件は公式・販売サイトで確認してください。'
      : '外部のAI APIは使わず、ブラウザ内のルールエンジンが比較ラボのデータから提案します。会話の内容はサーバーに保存されません（商品の提案時のみ、検索キーワードで楽天市場の商品を検索します）。料金・在庫・入国条件などは公式情報や販売・予約サイトで確認してください。'}</p>
  </div>;
}
