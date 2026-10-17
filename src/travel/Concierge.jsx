import { useEffect, useRef, useState } from 'react';
import { CONCIERGE_WELCOME, conciergeReply } from './concierge.js';
import { AffiliateNote, BookingLinkList } from './BookingLinks.jsx';
import { LINK_CONFIG } from './linkConfig.js';

function AssistantMessage({ message, onSend, onShow }) {
  return <div className="tvw-msg tvw-msg-bot">
    <span className="tvw-avatar" aria-hidden="true">✳</span>
    <div className="tvw-bubble">
      {message.summary?.length > 0 && <div className="tvw-summary" aria-label="読み取った条件">{message.summary.map(item => <span key={item}>{item}</span>)}</div>}
      {message.text.map(line => <p key={line}>{line}</p>)}
      {message.bullets && <ul className="tvw-bullets">{message.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
      {message.cards && <div className="tvw-cards">{message.cards.map((card, index) => <article key={card.id} className="tvw-card">
        <div className="tvw-card-head"><span className="tvw-card-rank">{index + 1}</span><span className="tvw-card-emoji" aria-hidden="true">{card.emoji}</span>
          <div><strong>{card.name}</strong><small>{card.region}・{card.tagline}</small></div></div>
        <ul>{card.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
        <p className="tvw-card-meta">{card.access}<br />おすすめ時期：{card.best}</p>
        {card.fit && <p className="tvw-card-fit">予算との相性：{card.fit}</p>}
        <div className="tvw-card-actions">
          <button type="button" onClick={() => onSend(card.name + 'のモデルコース')}>モデルコース</button>
          <button type="button" className="ghost" onClick={() => onSend(card.name + 'の航空券とホテル')}>航空券・宿</button>
        </div>
      </article>)}</div>}
      {message.itinerary && <div className="tvw-plan">
        <ol>{message.itinerary.days.map(day => <li key={day.day}><b>DAY {day.day}</b><span>{day.stops.join(' → ')}</span></li>)}</ol>
        <button type="button" onClick={() => onShow(message.action)}>このプランをページに表示して予算・予約まで見る ↓</button>
      </div>}
      {message.links && <div className="tvw-msg-links">
        {message.links.flights?.length > 0 && <><h4>✈️ 航空券を探す</h4><BookingLinkList links={message.links.flights} placement="concierge-flights" /></>}
        {message.links.stays?.length > 0 && <><h4>🏨 宿を探す</h4><BookingLinkList links={message.links.stays} placement="concierge-stays" /></>}
        <AffiliateNote />
      </div>}
      {message.action?.type === 'planner' && <button type="button" className="tvw-inline-action" onClick={() => onShow(message.action)}>予算シミュレーターを開く ↓</button>}
      {message.chips?.length > 0 && <div className="tvw-chips">{message.chips.map(chip => <button type="button" key={chip} onClick={() => onSend(chip)}>{chip}</button>)}</div>}
    </div>
  </div>;
}

// Chat-style travel concierge. Runs fully in the browser (no AI API, nothing sent).
export default function Concierge({ onShow }) {
  const [messages, setMessages] = useState([CONCIERGE_WELCOME]);
  const [convo, setConvo] = useState({});
  const [input, setInput] = useState('');
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const log = logRef.current;
    if (log && messages.length > 1) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function send(text) {
    const value = String(text || '').trim();
    if (!value) return;
    const { message, state } = conciergeReply(value, convo, { config: LINK_CONFIG });
    setConvo(state);
    setMessages(list => [...list, { role: 'user', text: [value] }, message].slice(-40));
    setInput('');
  }
  function reset() {
    setMessages([CONCIERGE_WELCOME]);
    setConvo({});
    inputRef.current?.focus();
  }

  return <section className="tv-wrap tvw-concierge" id="concierge" aria-labelledby="tvw-concierge-title">
    <div className="tvx-section-header">
      <div><span className="tvx-kicker">AI TRAVEL CONCIERGE</span><h2 id="tvw-concierge-title">旅の相談は、AIコンシェルジュに。</h2>
        <p>「12月に3泊、温泉とグルメ。予算は1人10万円」のように書くだけ。行き先の提案、モデルコース、航空券・ホテル探しまで手伝います。</p></div>
      <span className="tvx-result-badge">登録不要・無料</span>
    </div>
    <div className="tvw-chat">
      <div className="tvw-log" ref={logRef} role="log" aria-live="polite" aria-label="コンシェルジュとの会話">
        {messages.map((message, index) => message.role === 'user'
          ? <div className="tvw-msg tvw-msg-user" key={index}><div className="tvw-bubble">{message.text[0]}</div></div>
          : <AssistantMessage key={index} message={message} onSend={send} onShow={onShow} />)}
      </div>
      <form className="tvw-composer" onSubmit={e => { e.preventDefault(); send(input); }}>
        <label htmlFor="tvw-input" className="tvw-visually-hidden">コンシェルジュへのメッセージ</label>
        <textarea id="tvw-input" ref={inputRef} rows={2} maxLength={400} value={input} placeholder="例：大阪発、GWに家族4人で近場の海外ビーチ。5時間以内がいい"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }} />
        <div className="tvw-composer-actions">
          <button type="button" className="ghost" onClick={reset}>会話をリセット</button>
          <button type="submit" disabled={!input.trim()}>相談する ↑</button>
        </div>
      </form>
      <p className="tvw-disclaimer">外部のAI APIは使わず、ブラウザ内のルールエンジンが編集部の旅行データから提案します。入力内容はサーバーに送信・保存されません。移動時間・時期・予算相性は目安で、料金・空席・入国条件は公式情報や予約サイトで必ず確認してください。</p>
    </div>
  </section>;
}
