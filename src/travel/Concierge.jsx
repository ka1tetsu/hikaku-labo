import ConciergeChat from '../shared/ConciergeChat.jsx';

// Travel page section hosting the site-wide concierge (it also answers shopping and
// web-tool questions). Runs fully in the browser — no AI API.
export default function Concierge({ onShow }) {
  return <section className="tv-wrap tvw-concierge" id="concierge" aria-labelledby="tvw-concierge-title">
    <div className="tvx-section-header">
      <div><span className="tvx-kicker">TRAVEL SEARCH BY CONDITIONS</span><h2 id="tvw-concierge-title">旅の条件を書いて、候補を絞り込む。</h2>
        <p>「12月・3泊・温泉・予算10万円」と入力すると、編集済みの旅行先データから条件の近い候補を整理します。モデルコースはたたき台です。運賃、空室、移動時間は予約先などで別途確認してください。</p></div>
      <span className="tvx-result-badge">登録不要・無料</span>
    </div>
    <ConciergeChat section="travel" onAction={onShow} />
  </section>;
}
