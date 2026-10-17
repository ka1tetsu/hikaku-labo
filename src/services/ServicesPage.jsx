import { useMemo, useState } from 'react';
import SiteHeader from '../shared/SiteHeader.jsx';
import SiteConcierge from '../shared/SiteConcierge.jsx';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { CHECKED_AT, HOKEN_SERVICES } from './catalog.js';
import { rankCards, rankHikari, rankSim } from './score.js';
import { serviceLink } from './affiliate.js';
import './services.css';

const ENV = import.meta.env;
const yen = n => n.toLocaleString('ja-JP') + '円';

const CATEGORY_PAGES = {
  sim: {
    path: '/sim/', kicker: 'MOBILE PLAN', title: '格安SIM・スマホ料金比較', h1: ['毎月のスマホ代を、', '使い方に合わせて最安に。'],
    lead: 'データ量・通話・店舗サポートを選ぶだけで、主要9社の公式料金から月額の安いプランを順に並べます。',
    questions: [
      { id: 'usage', label: '毎月のデータ量', options: [['3', '〜3GB（あまり使わない）'], ['10', '〜10GB（SNS・地図）'], ['30', '〜30GB（動画もよく見る）'], ['unlimited', '無制限・大容量']] },
      { id: 'calls', label: '通話', options: [['few', 'ほとんどしない'], ['5min', '短い通話が多い'], ['unlimited', '長電話もする']] },
      { id: 'support', label: 'サポート', options: [['online', 'オンラインでOK'], ['store', '店舗で相談したい']] },
      { id: 'carrier', label: '自宅の光回線', options: [['none', 'なし・わからない'], ['au', 'au系（auひかり等）'], ['softbank', 'ソフトバンク系']] },
    ],
    rank: rankSim, priceLabel: row => (row.monthly !== null ? `月額 ${yen(row.monthly)}` : '公式で確認'),
    note: '料金は税込・割引前の基本料金です（通話料・オプション・端末代は含みません）。',
  },
  hikari: {
    path: '/hikari/', kicker: 'HOME INTERNET', title: '光回線比較', h1: ['光回線は、', 'スマホとのセット割で選ぶ。'],
    lead: '住まい・地域・使っているスマホから、セット割と提供エリアに合う光回線を並べます。',
    questions: [
      { id: 'housing', label: '住まい', options: [['house', '戸建て'], ['mansion', 'マンション・アパート']] },
      { id: 'carrier', label: '使っているスマホ', options: [['docomo', 'ドコモ・ahamo'], ['au', 'au・UQモバイル'], ['softbank', 'ソフトバンク・ワイモバイル'], ['rakuten', '楽天モバイル'], ['none', 'その他・格安SIM']] },
      { id: 'area', label: '地域', options: [['hokkaido', '北海道'], ['tohoku', '東北'], ['kanto', '関東'], ['hokuriku', '北陸・甲信越'], ['tokai', '東海'], ['kansai', '関西'], ['chugoku', '中国'], ['shikoku', '四国'], ['kyushu', '九州'], ['okinawa', '沖縄']] },
    ],
    rank: rankHikari, priceLabel: row => (row.monthly ? `月額目安 ${yen(row.monthly)}` : '公式で確認'),
    note: '月額は標準プランの目安（税込）です。キャッシュバック・工事費・契約期間で実質負担は大きく変わるため、申込前に公式の条件を確認してください。',
  },
  card: {
    path: '/card/', kicker: 'CREDIT CARD', title: 'クレジットカード比較', h1: ['年会費無料カードを、', 'よく使うお店で選ぶ。'],
    lead: '年会費無料の主要カードを、基本還元率とポイント経済圏・年齢条件で比較します。「最大◯%」ではなく、どこで使っても付く基本還元率を基準にしています。',
    questions: [
      { id: 'ecosystem', label: 'よく使うサービス', options: [['none', '特になし'], ['rakuten', '楽天'], ['paypay', 'PayPay・Yahoo!'], ['docomo', 'ドコモ・dポイント'], ['au', 'au・Ponta'], ['vpoint', 'コンビニ・Vポイント']] },
      { id: 'age', label: '年齢', options: [['u39', '39歳以下'], ['o40', '40歳以上']] },
      { id: 'priority', label: '重視すること', options: [['rate', '還元率'], ['conveni', 'コンビニ・飲食店'], ['simple', 'どこでも同じ還元']] },
    ],
    rank: rankCards, priceLabel: row => `還元率 ${row.service.rate.toFixed(1)}%`,
    note: '還元率は通常利用時の基本値です。キャンペーンや「最大◯%」の上乗せは条件つきのため、各社公式で確認してください。',
  },
};

function ServiceLink({ service, placement, label = '公式サイトで確認' }) {
  const link = serviceLink(service, ENV);
  return <a className="sv-cta" href={link.url} target="_blank" rel={link.sponsored ? 'sponsored noopener' : 'noopener noreferrer'}
    onClick={() => recordOutboundClick({ section: 'life', merchant: service.id, placement, sponsored: link.sponsored })}>
    {label} ↗{link.sponsored && <em className="sv-pr">PR</em>}</a>;
}

function Selector({ category }) {
  const config = CATEGORY_PAGES[category];
  const [answers, setAnswers] = useState(() => Object.fromEntries(config.questions.map(q => [q.id, q.options[category === 'hikari' && q.id === 'area' ? 2 : 0][0]])));
  const ranking = useMemo(() => config.rank(answers), [config, answers]);
  const top = ranking[0];
  return <section className="sv-wrap sv-selector" id="selector" aria-labelledby="sv-selector-title">
    <div className="sv-top-pick" aria-live="polite">
      <span>いまの条件での1位</span>
      <strong>{top.service.name}</strong>
      <b>{config.priceLabel(top)}</b>
      <small>{top.reasons[0]}</small>
      <ServiceLink service={top.service} placement={category + '-toppick'} label="公式サイトで条件を確認" />
      <a className="sv-top-more" href="#sv-selector-title">条件を変えて比べる ↓</a>
    </div>
    <div className="sv-selector-grid">
      <aside className="sv-form" aria-label="条件">
        <h2 id="sv-selector-title">あなたの条件</h2>
        {config.questions.map((q, index) => <fieldset key={q.id}>
          <legend><span>{String(index + 1).padStart(2, '0')}</span>{q.label}</legend>
          <div className="sv-options">{q.options.map(([id, label]) => <button type="button" key={id} aria-pressed={answers[q.id] === id} className={answers[q.id] === id ? 'active' : ''}
            onClick={() => setAnswers(a => ({ ...a, [q.id]: id }))}>{label}</button>)}</div>
        </fieldset>)}
        <p className="sv-form-note">広告掲載の有無や紹介報酬額は、順位の計算に使いません。</p>
      </aside>
      <div className="sv-results" aria-live="polite">
        <p className="sv-note">{config.note}</p>
        <ol className="sv-list">{ranking.map((row, index) => <li key={row.service.id} className={'sv-item' + (index === 0 ? ' is-top' : '') + (row.score < 30 ? ' is-dim' : '')}>
          <div className="sv-item-head">
            <span className="sv-rank">{index + 1}</span>
            <div><strong>{row.service.name}</strong><small>{row.service.networkLabel || (row.service.fee ? '年会費 ' + row.service.fee : '')}</small></div>
            <div className="sv-price"><b>{config.priceLabel(row)}</b><span>適合度 {row.score}</span></div>
          </div>
          <p className="sv-summary">{row.service.summary}</p>
          <div className="sv-cols">
            <ul className="sv-good">{[...row.reasons, ...(row.service.facts || [])].slice(0, 4).map(text => <li key={text}>{text}</li>)}</ul>
            <ul className="sv-caution">{row.cautions.slice(0, 3).map(text => <li key={text}>{text}</li>)}</ul>
          </div>
          {row.service.plans && <details className="sv-plans"><summary>料金表を見る</summary><table><tbody>{row.service.plans.map(plan => <tr key={plan.gb + '-' + plan.price}><th>{plan.label || (Number.isFinite(plan.gb) ? plan.gb + 'GB' : '無制限')}</th><td>{yen(plan.price)}</td></tr>)}</tbody></table></details>}
          <ServiceLink service={row.service} placement={category + '-rank'} />
        </li>)}</ol>
      </div>
    </div>
  </section>;
}

const RELATED = {
  sim: [['/hikari/', '光回線もセット割で見直す', 'UQモバイル・ワイモバイルは自宅の光回線とのセット割あり']],
  hikari: [['/sim/', 'スマホ代も一緒に見直す', 'セット割の対象ブランドに乗り換えると合計が下がることも']],
  card: [['/sim/', '経済圏をそろえてスマホ代も見直す', '楽天・PayPay・ドコモ・auなど同じポイントで貯める']],
  hoken: [['/card/', '固定費の支払いカードも見直す', '保険料・通信費をポイント還元のあるカードで支払う']],
  life: [],
};

function Related({ category }) {
  const list = [...(RELATED[category] || []), ['/compare/', '日用品・家電は全ショップで最安比較', '楽天・Yahoo!の実売価格を同じ商品で比較']];
  return <section className="sv-wrap sv-related" aria-label="あわせて見直す">
    <h2>あわせて見直す</h2>
    <div>{list.map(([href, title, text]) => <a key={href} href={href}><strong>{title} →</strong><span>{text}</span></a>)}</div>
  </section>;
}

function InsurancePage() {
  return <>
    <section className="sv-wrap sv-guide" aria-labelledby="sv-guide-title">
      <h2 id="sv-guide-title">保険を見直す前に整理すること</h2>
      <ol className="sv-steps">
        <li><b>公的保障を確認する</b>健康保険の高額療養費制度、遺族年金、傷病手当金など、すでに受けられる保障を先に把握します。</li>
        <li><b>必要な保障額を考える</b>家族構成・住宅ローン・貯蓄から、万一のときに不足する金額だけを民間保険で備えます。</li>
        <li><b>保険料の上限を決める</b>毎月払える額を決めてから相談すると、必要以上の契約を避けやすくなります。</li>
        <li><b>複数の提案を比べる</b>1社の提案で即決せず、保障内容・保険料・解約時の扱いを書面で比べます。</li>
      </ol>
    </section>
    <section className="sv-wrap sv-guide" aria-labelledby="sv-soudan-title">
      <h2 id="sv-soudan-title">無料の保険相談サービス</h2>
      <p>複数の保険会社の商品を扱う相談窓口では、ファイナンシャルプランナー等に無料で相談できます。相談窓口は契約が成立すると保険会社から手数料を受け取る仕組みのため、提案理由と他の選択肢を必ず確認しましょう。</p>
      <ul className="sv-soudan">{HOKEN_SERVICES.map(service => <li key={service.id}><strong>{service.name}</strong><span>{service.summary}</span><ServiceLink service={service} placement="hoken-list" label="公式サイトで相談方法を確認" /></li>)}</ul>
      <p className="sv-note">掲載は五十音順で、順位やおすすめ度ではありません。比較ラボは特定の保険商品の比較・推奨・募集は行いません。取扱保険会社数や相談方法は変わることがあるため、各公式サイトで確認してください。</p>
    </section>
  </>;
}

const HUB = [
  ['/sim/', '📱', '格安SIM・スマホ料金', 'データ量・通話・店舗サポートから、主要9社の月額を比較。'],
  ['/hikari/', '🌐', '光回線', '住まい・地域・スマホから、セット割と提供エリアで比較。'],
  ['/card/', '💳', 'クレジットカード', '年会費無料カードを基本還元率とポイント経済圏で比較。'],
  ['/hoken/', '🛡️', '保険の見直し', '必要な保障の整理と、無料保険相談の使い方。'],
];

export default function ServicesPage({ category }) {
  if (category === 'life') {
    return <PageShell category="life" current="/life/" kicker="LIFE COSTS" h1={['毎月の固定費を、', '条件に合わせて見直す。']} lead="スマホ・光回線・クレジットカード・保険。毎月かかるお金を、公式情報にもとづいて比べられます。">
      <section className="sv-wrap sv-hub">{HUB.map(([href, icon, title, text]) => <a key={href} href={href}><span aria-hidden="true">{icon}</span><strong>{title}</strong><p>{text}</p><b>比較する →</b></a>)}</section>
    </PageShell>;
  }
  if (category === 'hoken') {
    return <PageShell category="hoken" current="/hoken/" kicker="INSURANCE" h1={['保険は、', '入る前に「整理」から。']} lead="保険商品をランキングで選ぶのではなく、必要な保障を整理してから無料相談で比べるための手順をまとめました。">
      <InsurancePage />
    </PageShell>;
  }
  const config = CATEGORY_PAGES[category];
  return <PageShell category={category} current={config.path} kicker={config.kicker} h1={config.h1} lead={config.lead}>
    <Selector category={category} />
  </PageShell>;
}

function PageShell({ kicker, h1, lead, current, category, children }) {
  return <div className="sv-page">
    <SiteHeader active="life" />
    <main id="main-content">
      <section className="sv-hero"><div className="sv-wrap">
        <nav className="sv-tabs" aria-label="通信・お金の比較">{[['/sim/', '格安SIM'], ['/hikari/', '光回線'], ['/card/', 'クレジットカード'], ['/hoken/', '保険の見直し']].map(([href, label]) =>
          <a key={href} href={href} aria-current={href === current ? 'page' : undefined}>{label}</a>)}</nav>
        <span className="sv-kicker">✳ {kicker}</span>
        <h1>{h1[0]}<br /><em>{h1[1]}</em></h1>
        <p>{lead}</p>
        <p className="sv-checked">情報の確認日：{CHECKED_AT}（公式サイト・公式発表をもとに編集部が確認）</p>
      </div></section>
      {children}
      <Related category={category} />
      <section className="sv-wrap sv-disclosure">
        <h2>広告・情報について</h2>
        <p>「PR」表示のリンクはアフィリエイト広告です。リンク経由で申込みが成立すると、比較ラボが紹介料を受け取る場合があります。順位は入力した条件との適合度で決めており、報酬額は使っていません。</p>
        <p>料金・特典・条件は変更されることがあります。申込前に必ず各社の公式サイトで最新の内容を確認してください。誤りに気づいた場合は修正します。</p>
      </section>
    </main>
    <SiteConcierge section="site" />
  </div>;
}
