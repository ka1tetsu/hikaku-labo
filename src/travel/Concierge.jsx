import ConciergeChat from '../shared/ConciergeChat.jsx';

// Travel page section hosting the site-wide concierge (it also answers shopping and
// web-tool questions). Runs fully in the browser — no AI API.
export default function Concierge({ onShow }) {
  return <section className="tv-wrap tvw-concierge" id="concierge" aria-labelledby="tvw-concierge-title">
    <div className="tvx-section-header">
      <div><span className="tvx-kicker">AI TRAVEL CONCIERGE</span><h2 id="tvw-concierge-title">旅の相談は、AIコンシェルジュに。</h2>
        <p>「12月に3泊、温泉とグルメ。予算は1人10万円」のような具体的な条件でも、「どこか癒やされる所に行きたい」のようなざっくりした相談でもOK。行き先の提案、モデルコース、航空券・ホテル探しまで手伝います。</p></div>
      <span className="tvx-result-badge">登録不要・無料</span>
    </div>
    <ConciergeChat section="travel" onAction={onShow} />
  </section>;
}
