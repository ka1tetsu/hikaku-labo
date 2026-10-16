import { useState } from 'react';
import { CATEGORIES, LAST_REVIEWED } from './catalog.js';
import { rankServices } from './score.js';
import { outboundLink, recordOutbound } from './affiliate.js';
import './tools.css';

const BUDGETS = [
  { id: 'free', label: '無料で始めたい' },
  { id: 'starter', label: '〜2,000円/月' },
  { id: 'standard', label: '〜5,000円/月' },
  { id: 'flexible', label: '機能を優先' },
];
const PRIORITIES = [
  { id: 'easy', label: '使いやすさ', sign: '◎' },
  { id: 'cost', label: '価格', sign: '¥' },
  { id: 'design', label: 'デザイン', sign: '✳' },
  { id: 'scale', label: '拡張性', sign: '↗' },
];
const ICON = { website: '◧', shop: '▦', wordpress: '◉' };

function OfficialLink({ service, compact = false }) {
  const destination = outboundLink(service);
  return (
    <a
      className={compact ? 'tl-secondary-link' : 'tl-visit'}
      href={destination.url}
      target="_blank"
      rel={destination.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
      onClick={() => recordOutbound(service, destination.sponsored)}
    >
      {destination.sponsored ? '広告リンクで公式サイトへ' : '公式サイトで確認'}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

function PlanCard({ service, index, selected, toggle }) {
  return (
    <article className={'tl-card ' + (index === 0 ? 'tl-first' : '')}>
      <div className="tl-card-top">
        <div className="tl-company">
          <span className="tl-monogram" style={{ background: service.accent }} aria-hidden="true">{service.mark}</span>
          <div>
            <div className="tl-company-name">{service.name}</div>
            <p>{service.subtitle}</p>
          </div>
        </div>
        <div className="tl-rank">{index === 0 ? '条件との一致度が高い' : '候補 ' + (index + 1)}</div>
      </div>
      <div className="tl-card-content">
        <div className="tl-score">
          <strong>{service.score}<small>/100</small></strong>
          <span>独自の条件適合スコア</span>
        </div>
        <p className="tl-summary">{service.summary}</p>
        <div className="tl-price">
          <span>参考料金</span>
          <strong>{service.price.label}</strong>
          <small>{service.price.detail}</small>
        </div>
        <div className="tl-tags">
          {service.strengths.map(tag => <span key={tag}>{tag}</span>)}
        </div>
        <div className="tl-prose">
          <b>選定理由</b>
          {service.reasons.map(reason => <p key={reason}>✓ {reason}</p>)}
        </div>
        <div className="tl-caution">
          <b>確認ポイント</b>
          <p>{service.cautions.join('／')}</p>
          {service.priceRequiresReview && <p>選択した予算内かどうかは必ず公式料金で確認してください。</p>}
        </div>
      </div>
      <div className="tl-card-actions">
        <OfficialLink service={service} />
        <button
          className={'tl-compare-toggle ' + (selected ? 'is-active' : '')}
          type="button"
          onClick={() => toggle(service.id)}
          aria-pressed={selected}
        >{selected ? '✓ 比較対象に追加済み' : '＋ 比較に追加'}</button>
      </div>
      <a className="tl-source" href={service.sourceUrl} target="_blank" rel="noopener noreferrer">情報の確認元（公式） ↗</a>
    </article>
  );
}

export default function ToolsPage() {
  const [category, setCategory] = useState('website');
  const [budget, setBudget] = useState('standard');
  const [priority, setPriority] = useState('easy');
  const [selectedIds, setSelectedIds] = useState([]);
  const [onlySelection, setOnlySelection] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const ranking = rankServices({ category, budget, priority });
  const displayed = onlySelection ? ranking.filter(service => selectedIds.includes(service.id)) : ranking;
  const comparison = ranking.filter(service => selectedIds.includes(service.id));
  function changeCategory(next) {
    setCategory(next);
    setSelectedIds([]);
    setOnlySelection(false);
  }
  function toggle(id) {
    setSelectedIds(current => current.includes(id) ? current.filter(x => x !== id) : current.length < 3 ? [...current, id] : current);
  }
  return (
    <div className="tl-page">
      <header className="tl-header">
        <div className="tl-wrap tl-nav">
          <a href="/" className="tl-logo" aria-label="比較ラボのトップへ"><span className="tl-logo-icon">✳</span>比較ラボ<span className="tl-logo-light"> / tools</span></a>
          <div className="tl-nav-end">
            <a href="/" className="tl-back">商品価格比較へ ↗</a>
            <a href="#selector" className="tl-nav-action">無料で診断する <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </header>

      <main>
        <section className="tl-hero">
          <div className="tl-wrap tl-hero-grid">
            <div className="tl-hero-copy">
              <span className="tl-eyebrow"><span className="tl-dot"/> THE SMART WAY TO CHOOSE TOOLS</span>
              <h1>あなたの仕事に、<br/><em>ちょうどいい</em>ツールを。</h1>
              <p>Webサイト、ネットショップ、WordPress。目的と予算を選ぶだけで、公式情報に基づいてサービスを整理。広告報酬の多さではなく、条件との一致度で比較します。</p>
              <div className="tl-hero-cta">
                <a href="#selector" className="tl-hero-button">無料で診断を始める <span>↗</span></a>
                <span>登録不要 / 3つの条件で比較</span>
              </div>
              <div className="tl-trust"><span>✓ 根拠は公式サイト</span><span>✓ 広告表示を明示</span><span>✓ 無料で比較</span></div>
            </div>
            <div className="tl-hero-visual" aria-hidden="true">
              <div className="tl-floating-label">YOUR TOOL MATCH</div>
              <div className="tl-visual-card">
                <div className="tl-visual-top"><span>サービス選定</span><span className="tl-live-mark">● ANALYSIS</span></div>
                <div className="tl-visual-line"><span>01 / 目的</span><strong>Webサイト制作</strong><span>✓</span></div>
                <div className="tl-visual-line"><span>02 / 予算</span><strong>月5,000円以内</strong><span>✓</span></div>
                <div className="tl-visual-line"><span>03 / 重視</span><strong>使いやすさ</strong><span>✓</span></div>
                <div className="tl-visual-result"><span>CONSIDER</span><b>サービスを比較</b><i>↗</i></div>
              </div>
              <span className="tl-visual-deco tl-deco-a">✳</span><span className="tl-visual-deco tl-deco-b">✳</span>
            </div>
          </div>
        </section>

        <section className="tl-steps tl-wrap" aria-label="使い方">
          <div><span>01</span><b>目的を選ぶ</b><p>何を作りたいか</p></div>
          <div><span>02</span><b>予算を決める</b><p>無理のない月額で</p></div>
          <div><span>03</span><b>根拠を比べる</b><p>メリットも注意点も</p></div>
        </section>

        <section className="tl-work tl-wrap" id="selector">
          <div className="tl-section-head">
            <div><span className="tl-overline">FREE TOOL SELECTOR</span><h2>あなたに合うサービスを診断</h2><p>入力結果に合わせて順位が変わります。気になる候補は最大3つまで横並びで比較できます。</p></div>
            <span className="tl-counter">約1分で完了</span>
          </div>
          <div className="tl-work-grid">
            <aside className="tl-form" aria-label="診断条件">
              <div className="tl-form-heading"><span className="tl-square">✳</span><div><strong>あなたの条件</strong><small>あとからいつでも変更できます</small></div></div>
              <fieldset>
                <legend><span>01</span> 何を作りたいですか？</legend>
                <div className="tl-category-list">
                  {CATEGORIES.map(item => (
                    <button type="button" key={item.id} className={'tl-choice ' + (category === item.id ? 'active' : '')} aria-pressed={category === item.id} onClick={() => changeCategory(item.id)}>
                      <span className="tl-choice-icon">{ICON[item.id]}</span>
                      <span className="tl-choice-text"><b>{item.title}</b><small>{item.detail}</small></span>
                      <span className="tl-radio-dot"/>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend><span>02</span> 月額予算はどのくらい？</legend>
                <div className="tl-option-grid">
                  {BUDGETS.map(item => <button key={item.id} type="button" aria-pressed={budget === item.id} className={'tl-option ' + (budget === item.id ? 'active' : '')} onClick={() => setBudget(item.id)}>{item.label}</button>)}
                </div>
              </fieldset>
              <fieldset>
                <legend><span>03</span> 何を重視しますか？</legend>
                <div className="tl-option-grid">
                  {PRIORITIES.map(item => <button key={item.id} type="button" aria-pressed={priority === item.id} className={'tl-option ' + (priority === item.id ? 'active' : '')} onClick={() => setPriority(item.id)}><span aria-hidden="true">{item.sign} </span>{item.label}</button>)}
                </div>
              </fieldset>
              <button type="button" className="tl-reset" onClick={() => {changeCategory('website');setBudget('standard');setPriority('easy');}}>↺ 条件をリセット</button>
              <p className="tl-form-note">広告掲載の有無や紹介報酬額は、適合スコアの計算に使用しません。</p>
            </aside>

            <div className="tl-results" aria-live="polite">
              <div className="tl-results-head">
                <div><span className="tl-overline">YOUR RECOMMENDATIONS</span><h3>{CATEGORIES.find(x => x.id === category).title} — 比較結果</h3><p>公開された機能と参考価格から独自ルールで点数化。AI生成による根拠の捏造はしません。</p></div>
                <span className="tl-result-count">{ranking.length}件を比較</span>
              </div>
              <div className="tl-results-actions">
                <span>並び順：条件適合スコア順</span>
                <button type="button" disabled={selectedIds.length === 0} onClick={() => setOnlySelection(v => !v)}>{onlySelection ? 'すべて表示' : '選択した候補のみ表示'}（{selectedIds.length}/3）</button>
              </div>
              <div className="tl-cards">
                {displayed.map((service, index) => <PlanCard key={service.id} service={service} index={ranking.findIndex(x => x.id === service.id)} selected={selectedIds.includes(service.id)} toggle={toggle}/>)}
              </div>
              {displayed.length === 0 && <div className="tl-empty">比較するサービスを選択してください。</div>}
              <p className="tl-note">掲載料金は取得・確認時点の参考情報です。キャンペーン、契約期間、税区分、決済手数料などは異なります。最終申込前に必ず公式サイトをご確認ください。</p>
            </div>
          </div>
        </section>

        {comparison.length > 0 && <section className="tl-compare-section tl-wrap" id="compare">
          <div className="tl-section-head"><div><span className="tl-overline">SIDE BY SIDE</span><h2>候補を横並びで比較</h2></div><button className="tl-clear" onClick={() => {setSelectedIds([]);setOnlySelection(false);}}>選択を解除</button></div>
          <div className="tl-table-wrap"><table className="tl-table">
            <thead><tr><th scope="col">比較項目</th>{comparison.map(s => <th scope="col" key={s.id}>{s.name}</th>)}</tr></thead>
            <tbody>
              <tr><th scope="row">条件スコア</th>{comparison.map(s=><td key={s.id}><strong>{s.score}/100</strong></td>)}</tr>
              <tr><th scope="row">参考料金</th>{comparison.map(s=><td key={s.id}>{s.price.label}<small>{s.price.detail}</small></td>)}</tr>
              <tr><th scope="row">主な特徴</th>{comparison.map(s=><td key={s.id}>{s.strengths.join(' / ')}</td>)}</tr>
              <tr><th scope="row">確認ポイント</th>{comparison.map(s=><td key={s.id}>{s.cautions.join(' / ')}</td>)}</tr>
              <tr><th scope="row">公式サイト</th>{comparison.map(s=><td key={s.id}><OfficialLink service={s} compact/></td>)}</tr>
            </tbody>
          </table></div>
        </section>}

        <section className="tl-method tl-wrap">
          <div className="tl-method-heading"><span className="tl-overline">HOW WE COMPARE</span><h2>広告よりも、納得できる選び方を。</h2></div>
          <div className="tl-method-grid">
            <article><span>01 / VERIFIED</span><h3>情報源を明示</h3><p>公式の料金・機能ページを各サービスに添付。出典のない価格や架空のユーザー評価は掲載しません。</p></article>
            <article><span>02 / INDEPENDENT</span><h3>公平な選定ロジック</h3><p>入力した目的・予算・優先項目だけで点数化。紹介報酬や広告契約の有無は順位に影響しません。</p></article>
            <article><span>03 / TRANSPARENT</span><h3>広告をはっきり表示</h3><p>広告契約が成立したリンクだけPRとして表示し、未承認時は通常の公式サイトへ案内します。</p></article>
          </div>
          <button className="tl-method-toggle" type="button" aria-expanded={showHelp} onClick={() => setShowHelp(v => !v)}>{showHelp ? '採点方法を閉じる −' : '採点方法を詳しく見る ＋'}</button>
          {showHelp && <p className="tl-method-detail">各カテゴリに該当する候補を55点から開始し、確認できる参考月額が設定予算内なら17点加算、超過なら17点減点します。優先する特徴があれば24点、特定条件では追加4点です。未確認の料金は予算内として加点しません。スコアは統計モデルの確率ではなく選択補助の独自指標であり、実際の品質・速度・サポートを保証するものではありません。</p>}
        </section>
      </main>

      <footer className="tl-footer">
        <div className="tl-wrap tl-footer-top">
          <div><div className="tl-footer-brand"><span>✳</span> 比較ラボ / tools</div><p>必要なものを、必要なだけ。<br/>納得できるサービス選びのために。</p></div>
          <div><b>サイト内リンク</b><a href="/">商品価格比較</a><a href="#selector">無料診断</a><a href="#disclosure">広告の開示</a></div>
          <div><b>情報の注意事項</b><p>情報確認日：{LAST_REVIEWED}</p><p>料金と提供機能は予告なく変更されることがあります。</p></div>
        </div>
        <div className="tl-wrap tl-footer-disclosure" id="disclosure">
          <h3>広告・アフィリエイトに関する開示</h3>
          <p>当サイトは広告・アフィリエイトプログラムから報酬を受け取る場合があります。提携が承認された広告リンクには「広告リンク」と表示します。広告契約のないサービスも掲載し、ランキングには広告報酬額を使用しません。現時点でリンクの承認・報酬発生は保証されません。</p>
          <h3>プライバシー</h3>
          <p>診断で選んだ条件はこのページ内で処理し、氏名・メールアドレスを収集しません。公式サイトへのクリック時にはサービスIDと広告リンクの有無だけを、運営上の集計目的で当サイトに送信します。外部サイトでのデータ取扱いはリンク先の規定をご確認ください。</p>
        </div>
        <div className="tl-wrap tl-footer-bottom">© 2026 比較ラボ <a href="#selector">ページ上部へ ↑</a></div>
      </footer>
    </div>
  );
}
