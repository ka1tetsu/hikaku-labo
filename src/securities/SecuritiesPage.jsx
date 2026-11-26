import SiteFooter from '../shared/SiteFooter.jsx';
import AdSlot from '../shared/AdSlot.jsx';
import SiteHeader from '../shared/SiteHeader.jsx';
import { CHECKED_AT, GROUPS, getServices } from './catalog.js';
import { outboundLink, recordOutbound } from './affiliate.js';
import './securities.css';

function OfficialLink({ service, placement = 'securities-card' }) {
  const destination = outboundLink(service);
  return (
    <a
      className="sc-visit"
      href={destination.url}
      target="_blank"
      rel={destination.sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
      onClick={() => recordOutbound(service, destination.sponsored, placement)}
    >
      {destination.sponsored ? '広告リンクで公式サイトへ' : '公式サイトで確認'}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

function ServiceCard({ service, group }) {
  return (
    <article className="sc-card">
      <div className="sc-card-top">
        <div className="sc-company">
          <span className="sc-monogram" style={{ background: service.accent }} aria-hidden="true">{service.mark}</span>
          <div>
            <div className="sc-company-name">{service.name}</div>
            <p>{service.operator}／{service.kind}</p>
          </div>
        </div>
      </div>
      <div className="sc-card-content">
        <p className="sc-summary">{service.summary}</p>
        <dl className="sc-facts">
          {service.facts.map(fact => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="sc-prose">
          <b>向いている人</b>
          <p>{service.fit}</p>
        </div>
        <div className="sc-caution">
          <b>注意点</b>
          <p>{service.cautions.join('／')}</p>
        </div>
        <p className="sc-risk-near">{group.risk}</p>
      </div>
      <div className="sc-card-actions">
        <OfficialLink service={service} />
      </div>
      <a className="sc-source" href={service.sourceUrl} target="_blank" rel="noopener noreferrer">情報の確認元（公式） ↗</a>
    </article>
  );
}

export default function SecuritiesPage() {
  return (
    <div className="sc-page">
      <SiteHeader active="securities" />

      <main id="main-content">
        <section className="sc-hero">
          <div className="sc-wrap">
            <p className="sc-pr">PR（広告を含みます）：このページのリンクの一部は広告リンクです。経由して口座開設等が成立した場合、当サイトが報酬を受け取ることがあります。</p>
            <span className="sc-eyebrow"><span className="sc-dot" /> 証券・FXの比較</span>
            <h1>手数料と条件で、<br /><em>証券口座・FX口座を選ぶ。</em></h1>
            <p className="sc-lead">株式・NISA口座と、FX・CFDはリスクの性質が違うため、グループを分けて掲載します。各社の手数料・取扱範囲は公式ページで確認した事実だけを載せ、広告報酬の額で並び順を変えることはしません。</p>
            <div className="sc-trust"><span>✓ 根拠は公式サイト</span><span>✓ 広告表示を明示</span><span>✓ リスクも併記</span></div>
          </div>
        </section>

        <section className="sc-method sc-wrap" aria-label="選定基準">
          <h2>このページの選定基準</h2>
          <ul>
            <li>掲載数値はすべて各社の公式ページで確認し、出典URLと確認日（{CHECKED_AT}）を併記しています。</li>
            <li>並び順は手数料体系や取扱範囲など、確認できる事実の説明順です。広告報酬額は並び順・評価に使用しません。</li>
            <li>株式・投資信託と、レバレッジ取引であるFX・CFDは、同じランキングに混ぜずグループを分けています。</li>
            <li>投資に「必ず利益が出る」ことはありません。申込前に各社の公式サイトで最新の条件とリスク説明を確認してください。</li>
            <li>新NISAの口座選びの観点（手数料無料の範囲・取扱商品・積立額）は<a href="/guides/nisa-guide/">新NISAの証券口座の選び方ガイド</a>で手順を整理しています。</li>
            <li>FX・CFDの口座選びの観点（スプレッドの条件・取引単位・ロスカットの水準）は<a href="/guides/fx-guide/">FX口座の選び方ガイド</a>で手順を整理しています。</li>
          </ul>
        </section>

        {GROUPS.map(group => (
          <section key={group.id} className="sc-group sc-wrap" aria-label={group.title}>
            <div className="sc-section-head">
              <div>
                <span className="sc-overline">{group.detail}</span>
                <h2>{group.title}</h2>
                <p>{group.basis}</p>
              </div>
              <span className="sc-counter">{getServices(group.id).length}件を掲載</span>
            </div>
            <p className="sc-risk-box">{group.risk}</p>
            <div className="sc-cards">
              {getServices(group.id).map(service => <ServiceCard key={service.id} service={service} group={group} />)}
            </div>
          </section>
        ))}

        <section className="sc-notes sc-wrap" aria-label="投資に関する注意事項">
          <h2>申込前に確認すること</h2>
          <ul>
            <li>株式や投資信託は価格変動により投資元本を割り込む（元本割れ）可能性があります。元本や収益が保証された商品ではありません。</li>
            <li>FX・CFDはレバレッジ取引のため、価格変動により預けた証拠金を上回る損失（元本を上回る損失）が発生する可能性があります。失っても生活に支障のない余裕資金の範囲で検討してください。</li>
            <li>口座開設には年齢などの申込条件があります。対象かどうかは各社の公式サイトで確認してください。</li>
            <li>掲載した手数料・スプレッド・取扱銘柄は {CHECKED_AT} 時点で公式ページを確認した内容です。変更されることがあるため、申込前に必ず公式サイトで最新情報を確認してください。</li>
          </ul>
        </section>
      </main>

      <footer className="sc-footer">
        <div className="sc-wrap sc-footer-disclosure" id="disclosure">
          <h3>広告・アフィリエイトに関する開示</h3>
          <p>当サイトは広告・アフィリエイトプログラムから報酬を受け取る場合があります。提携が承認された広告リンクには「広告リンク」と表示します。広告契約のないサービスも掲載し、並び順には広告報酬額を使用しません。現時点でリンクの承認・報酬発生は保証されません。</p>
          <h3>プライバシー</h3>
          <p>このページでは氏名・メールアドレスを収集しません。ページ種別、外部リンクのサービスID・配置・広告リンクの有無を、運営上の集計目的で当サイトに送信します。外部サイトでのデータ取扱いはリンク先の規定をご確認ください。</p>
          <p>情報確認日：{CHECKED_AT}</p>
        </div>
        <div className="sc-wrap sc-footer-bottom">© 2026 Vivlica <a href="#main-content">ページ上部へ ↑</a></div>
      </footer>
      <AdSlot placement="footer" />
      <SiteFooter />
    </div>
  );
}
