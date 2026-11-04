import SiteFooter from '../shared/SiteFooter.jsx';
// Server-rendered long-tail pages (no hydration). Interactive bits — the concierge,
// the header "AIに相談" button and click tracking — come from conciergeMount.jsx.
import SiteHeader from '../shared/SiteHeader.jsx';
import { CARD_SERVICES, CHECKED_AT, HIKARI_SERVICES, SIM_SERVICES } from './catalog.js';
import { rankHikari, simPlanFor } from './score.js';
import { serviceLink } from './affiliate.js';
import { AREA_PAGES, CARD_DETAIL_PAGES, HIKARI_DETAIL_PAGES, SIM_DETAIL_PAGES, SIM_PAIRS, areaLabel } from './pages.js';

const yen = n => n.toLocaleString('ja-JP') + '円';
const USAGES = [['3', '〜3GB'], ['10', '〜10GB'], ['30', '〜30GB'], ['unlimited', '無制限・大容量']];
const CALLS = {
  '5min': '5分以内の国内通話が無料（プランに込み）', '5min-some': '5分かけ放題または月70分無料通話つきのプランあり',
  '10min-some': '10分かけ放題込みのプランあり', app: 'Rakuten Linkアプリで国内通話無料', null: '通話定額はオプション',
};

function Cta({ service, env, placement, section = 'life' }) {
  const link = serviceLink(service, env);
  return <a className="sv-cta" href={link.url} target="_blank" rel={link.sponsored ? 'sponsored noopener' : 'noopener noreferrer'}
    data-track="outbound" data-section={section} data-merchant={service.id} data-placement={placement} data-sponsored={String(link.sponsored)}>
    {service.name}の公式サイト ↗{link.sponsored && <em className="sv-pr">PR</em>}</a>;
}

function Shell({ crumbs, kicker, title, lead, children }) {
  return <div className="sv-page">
    <SiteHeader active="life" />
    <main id="main-content">
      <section className="sv-hero sv-hero-compact"><div className="sv-wrap">
        <nav className="sv-crumbs" aria-label="パンくずリスト">{crumbs.map(([href, label], i) => <span key={href}>{i > 0 && ' › '}<a href={href}>{label}</a></span>)}</nav>
        <span className="sv-kicker">✳ {kicker}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
        <p className="sv-checked">情報の確認日：{CHECKED_AT}（公式サイト・公式発表をもとに編集部が確認）</p>
      </div></section>
      {children}
      <section className="sv-wrap sv-disclosure">
        <h2>広告・情報について</h2>
        <p>「PR」表示のリンクはアフィリエイト広告です。リンク経由で申込みが成立すると、Vivlicaが紹介料を受け取る場合があります。比較の結論は料金と条件だけで決めており、報酬額は使っていません。</p>
        <p>料金・特典・条件は変更されることがあります。申込前に必ず各社の公式サイトで最新の内容を確認してください。</p>
      </section>
    </main>
    <SiteFooter />
  </div>;
}

export function SimPairPage({ a, b, env = {} }) {
  const A = SIM_SERVICES.find(s => s.id === a), B = SIM_SERVICES.find(s => s.id === b);
  const verdicts = USAGES.map(([usage, label]) => {
    const pa = simPlanFor(A, usage), pb = simPlanFor(B, usage);
    let text;
    if (!pa && !pb) text = `どちらも掲載プランなし（公式で確認）`;
    else if (!pa || !pb) text = `${(pa ? A : B).name} ${yen((pa || pb).price)}／月（${(pa ? B : A).name}は確認済みの該当プランなし・公式で確認）`;
    else if (pa.price === pb.price) text = `同額（${yen(pa.price)}／月）`;
    else {
      const [win, lose, wp, lp] = pa.price < pb.price ? [A, B, pa, pb] : [B, A, pb, pa];
      text = `${win.name}が月${yen(lp.price - wp.price)}安い（${win.name} ${yen(wp.price)} ／ ${lose.name} ${yen(lp.price)}）`;
    }
    return [label, text];
  });
  const related = SIM_PAIRS.filter(p => (p.a === a || p.b === a || p.a === b || p.b === b) && !(p.a === a && p.b === b)).slice(0, 10);
  const row = (label, fn) => <tr><th scope="row">{label}</th><td>{fn(A)}</td><td>{fn(B)}</td></tr>;
  return <Shell crumbs={[['/', 'Vivlica'], ['/life/', '通信・お金'], ['/sim/', '格安SIM比較'], [`/sim/vs/${a}-${b}/`, `${A.name}と${B.name}`]]}
    kicker="SIM COMPARISON" title={`${A.name}と${B.name}の比較｜料金・通話・サポートの違い`}
    lead={`${A.name}（${A.networkLabel}）と${B.name}（${B.networkLabel}）を、毎月のデータ量ごとの料金、通話、店舗サポートで比べました。`}>
    <section className="sv-wrap sv-guide">
      <h2>結論：データ量ごとの安いほう</h2>
      <ul className="sv-verdicts">{verdicts.map(([label, text]) => <li key={label}><b>{label}</b><span>{text}</span></li>)}</ul>
      <p className="sv-note">税込・割引前の基本料金での比較です（通話料・オプション・端末代は含みません）。{A.store !== B.store ? `店舗で相談したいなら${A.store ? A.name : B.name}が向いています。` : ''}</p>
      <div className="sv-cta-row"><Cta service={A} env={env} placement="sim-vs" /><Cta service={B} env={env} placement="sim-vs" /></div>
    </section>
    <section className="sv-wrap sv-guide">
      <h2>違いを表で比べる</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <thead><tr><th scope="col">項目</th><th scope="col">{A.name}</th><th scope="col">{B.name}</th></tr></thead>
        <tbody>
          {row('回線', s => s.networkLabel)}
          {row('店舗サポート', s => (s.store ? 'あり' : 'なし（オンライン中心）'))}
          {row('通話', s => CALLS[s.calls])}
          {row('料金プラン', s => <ul>{s.plans.map(p => <li key={p.gb + '-' + p.price}>{p.label || (Number.isFinite(p.gb) ? p.gb + 'GB' : '無制限')}：{yen(p.price)}</li>)}</ul>)}
          {row('特徴', s => <ul>{s.facts.map(f => <li key={f}>{f}</li>)}</ul>)}
          {row('注意点', s => <ul>{s.cautions.map(f => <li key={f}>{f}</li>)}</ul>)}
          {row('出典', s => <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">公式情報 ↗</a>)}
        </tbody>
      </table></div>
      <div className="sv-cta-row"><Cta service={A} env={env} placement="sim-vs" /><Cta service={B} env={env} placement="sim-vs" /></div>
    </section>
    <section className="sv-wrap sv-related">
      <h2>ほかの比較</h2>
      <div><a href="/sim/"><strong>条件を入れて主要9社で比べる →</strong><span>データ量・通話・サポートから順位を出す無料ツール</span></a>
        {related.map(p => <a key={p.slug} href={p.path}><strong>{p.title} →</strong><span>料金・通話・サポートの違い</span></a>)}</div>
    </section>
  </Shell>;
}

const CARRIERS = [['docomo', 'ドコモ・ahamo'], ['au', 'au・UQモバイル'], ['softbank', 'ソフトバンク・ワイモバイル'], ['rakuten', '楽天モバイル'], ['none', 'その他・格安SIM']];

export function HikariAreaPage({ area, env = {} }) {
  const label = areaLabel(area);
  const available = HIKARI_SERVICES.filter(s => s.areas === 'all' || s.areas.includes(area));
  const unavailable = HIKARI_SERVICES.filter(s => !available.includes(s));
  const picks = CARRIERS.map(([carrier, carrierLabel]) => {
    const house = rankHikari({ housing: 'house', carrier, area })[0];
    const mansion = rankHikari({ housing: 'mansion', carrier, area })[0];
    return { carrier, carrierLabel, house, mansion };
  });
  const availableIds = new Set(available.map(s => s.id));
  const candidates = [...new Map(picks.flatMap(p => [p.house.service, p.mansion.service])
    .filter(s => availableIds.has(s.id)).map(s => [s.id, s])).values()];
  const pickName = r => availableIds.has(r.service.id)
    ? <a className="sv-service-link" href={`#service-${r.service.id}`}><b>{r.service.name}</b></a>
    : <b>{r.service.name}</b>;
  return <Shell crumbs={[['/', 'Vivlica'], ['/life/', '通信・お金'], ['/hikari/', '光回線比較'], [`/hikari/area/${area}/`, `${label}の光回線`]]}
    kicker="HOME INTERNET BY AREA" title={`${label}で選べる光回線｜スマホ別のおすすめとセット割`}
    lead={`${label}で申し込める主な光回線を、使っているスマホとのセット割と提供エリアから整理しました。`}>
    <section className="sv-wrap sv-guide">
      <h2>使っているスマホ別：{label}の候補</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <thead><tr><th scope="col">使っているスマホ</th><th scope="col">戸建て</th><th scope="col">マンション</th></tr></thead>
        <tbody>{picks.map(p => <tr key={p.carrier}><th scope="row">{p.carrierLabel}</th>
          <td>{pickName(p.house)}<br /><small>{p.house.reasons.join('・')}</small></td>
          <td>{pickName(p.mansion)}<br /><small>{p.mansion.reasons.join('・')}</small></td></tr>)}</tbody>
      </table></div>
      <p className="sv-note">候補の公式サイトで、住所・建物ごとの提供状況を確認できます。</p>
      <div className="sv-cta-row">{candidates.map(s => <Cta key={s.id} service={s} env={env} placement="hikari-area-table" />)}</div>
      <p className="sv-note">セット割と提供エリア、標準プランの月額目安から出した結果です。実際に申し込めるかは住所・建物で変わるため、各社の公式サイトで提供状況を確認してください。</p>
    </section>
    <section className="sv-wrap sv-guide">
      <h2>{label}で申し込める主な光回線</h2>
      <ul className="sv-area-list">{available.map(s => <li key={s.id} id={`service-${s.id}`}>
        <strong>{s.name}</strong><span>{s.summary}</span>
        <small>戸建て：{s.house ? yen(s.house) + '（目安）' : '公式で確認'} ／ マンション：{s.mansion ? yen(s.mansion) + '（目安）' : '公式で確認'}</small>
        <small>セット割：{s.bundle.map(c => CARRIERS.find(([id]) => id === c)?.[1]).join('、')}</small>
        <Cta service={s} env={env} placement="hikari-area" />
      </li>)}</ul>
      {unavailable.length > 0 && <p className="sv-note">{unavailable.map(s => s.name).join('・')}は、{label}では提供されていないか、ごく一部の地域に限られます。</p>}
    </section>
    <section className="sv-wrap sv-related">
      <h2>ほかの地域・比較</h2>
      <div><a href="/hikari/"><strong>条件を入れて光回線を比べる →</strong><span>住まい・地域・スマホから順位を出す無料ツール</span></a>
        {AREA_PAGES.filter(p => p.area !== area).map(p => <a key={p.area} href={p.path}><strong>{p.title} →</strong><span>スマホ別のおすすめとセット割</span></a>)}</div>
    </section>
  </Shell>;
}

// Per-service detail pages (K1). Content is limited to what the catalog entry
// itself carries (plan tables, facts, cautions, details, sources) — nothing is
// added beyond the checked catalog data.
export function SimServicePage({ id, env = {} }) {
  const s = SIM_SERVICES.find(x => x.id === id);
  const pairs = SIM_PAIRS.filter(p => p.a === id || p.b === id);
  const others = SIM_DETAIL_PAGES.filter(p => p.id !== id);
  return <Shell crumbs={[['/', 'Vivlica'], ['/life/', '通信・お金'], ['/sim/', '格安SIM比較'], [`/sim/${id}/`, s.name]]}
    kicker="MOBILE PLAN" title={`${s.name}の料金プラン・特徴・注意点`}
    lead={s.summary}>
    <section className="sv-wrap sv-guide">
      <h2>{s.name}の料金プラン（全プラン）</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <thead><tr><th scope="col">プラン</th><th scope="col">月額（税込）</th></tr></thead>
        <tbody>{s.plans.map(p => <tr key={p.gb + '-' + p.price}><th scope="row">{p.label || (Number.isFinite(p.gb) ? p.gb + 'GB' : '無制限')}</th><td>{yen(p.price)}</td></tr>)}</tbody>
      </table></div>
      <p className="sv-note">税込・割引前の基本料金です（通話料・オプション・端末代は含みません）。キャンペーン・割引は条件つきで、内容は変わることがあります。最新の条件は公式サイトで確認してください。</p>
      <div className="sv-cta-row"><Cta service={s} env={env} placement="sim-detail" /></div>
    </section>
    <section className="sv-wrap sv-guide">
      <h2>基本情報と特徴</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <tbody>
          <tr><th scope="row">回線</th><td>{s.networkLabel}</td></tr>
          <tr><th scope="row">店舗サポート</th><td>{s.store ? 'あり' : 'なし（オンライン中心）'}</td></tr>
          <tr><th scope="row">通話</th><td>{CALLS[s.calls]}</td></tr>
          <tr><th scope="row">特徴</th><td><ul>{s.facts.map(f => <li key={f}>{f}</li>)}</ul></td></tr>
        </tbody>
      </table></div>
    </section>
    <section className="sv-wrap sv-guide">
      <h2>注意点</h2>
      <ul>{s.cautions.map(c => <li key={c}>{c}</li>)}</ul>
      <p className="sv-note">出典：<a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">公式情報 ↗</a>（確認日はページ上部に記載）</p>
    </section>
    <section className="sv-wrap sv-related">
      <h2>条件で比べる・2社比較</h2>
      <div><a href="/sim/"><strong>条件を入れて主要9社で比べる →</strong><span>データ量・通話・サポートから順位を出す無料ツール</span></a>
        {pairs.map(p => <a key={p.slug} href={p.path}><strong>{p.title} →</strong><span>料金・通話・サポートの違い</span></a>)}</div>
      <h2>ほかの格安SIMの料金・プラン</h2>
      <div className="sv-link-list">{others.map(p => <a key={p.id} href={p.path}>{p.title}</a>)}</div>
    </section>
  </Shell>;
}

export function HikariServicePage({ id, env = {} }) {
  const s = HIKARI_SERVICES.find(x => x.id === id);
  const areaPages = AREA_PAGES.filter(p => s.areas === 'all' || s.areas.includes(p.area));
  const others = HIKARI_DETAIL_PAGES.filter(p => p.id !== id);
  const price = v => (v ? yen(v) + '（目安）' : '公式で確認');
  return <Shell crumbs={[['/', 'Vivlica'], ['/life/', '通信・お金'], ['/hikari/', '光回線比較'], [`/hikari/${id}/`, s.name]]}
    kicker="HOME INTERNET" title={`${s.name}の料金・提供エリア・セット割`}
    lead={s.summary}>
    <section className="sv-wrap sv-guide">
      <h2>{s.name}の月額料金（目安）</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <thead><tr><th scope="col">住まい</th><th scope="col">月額（税込・目安）</th></tr></thead>
        <tbody>
          <tr><th scope="row">戸建て</th><td>{price(s.house)}</td></tr>
          <tr><th scope="row">マンション</th><td>{price(s.mansion)}</td></tr>
        </tbody>
      </table></div>
      <p className="sv-note">標準プランの月額目安（税込）です。キャッシュバック等の実質額は扱っていません。キャンペーン・割引は条件つきで、工事費・契約期間でも負担は変わります。申込前に公式の条件を確認してください。</p>
      <div className="sv-cta-row"><Cta service={s} env={env} placement="hikari-detail" /></div>
    </section>
    <section className="sv-wrap sv-guide">
      <h2>提供エリアとセット割</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <tbody>
          <tr><th scope="row">提供エリア</th><td>{s.areas === 'all' ? '全国（フレッツ光エリア）' : s.areas.map(a => areaLabel(a)).join('・')}</td></tr>
          <tr><th scope="row">セット割の対象スマホ</th><td>{s.bundle.map(c => CARRIERS.find(([cid]) => cid === c)?.[1]).join('、')}</td></tr>
          <tr><th scope="row">特徴</th><td><ul>{s.facts.map(f => <li key={f}>{f}</li>)}</ul></td></tr>
        </tbody>
      </table></div>
      <p className="sv-note">実際に申し込めるかは住所・建物で変わります。公式サイトで提供状況を確認してください。</p>
    </section>
    <section className="sv-wrap sv-guide">
      <h2>注意点</h2>
      <ul>{s.cautions.map(c => <li key={c}>{c}</li>)}</ul>
      <p className="sv-note">出典：<a href={s.officialUrl} target="_blank" rel="noopener noreferrer">公式サイト ↗</a>（確認日はページ上部に記載）</p>
    </section>
    <section className="sv-wrap sv-related">
      <h2>地域別に見る・ほかの光回線</h2>
      <div><a href="/hikari/"><strong>条件を入れて光回線を比べる →</strong><span>住まい・地域・スマホから順位を出す無料ツール</span></a>
        {areaPages.map(p => <a key={p.area} href={p.path}><strong>{p.title} →</strong><span>スマホ別のおすすめとセット割</span></a>)}
        {others.map(p => <a key={p.id} href={p.path}><strong>{p.title} →</strong><span>月額目安と提供エリア</span></a>)}</div>
    </section>
  </Shell>;
}

export function CardServicePage({ id, env = {} }) {
  const s = CARD_SERVICES.find(x => x.id === id);
  const others = CARD_DETAIL_PAGES.filter(p => p.id !== id);
  return <Shell crumbs={[['/', 'Vivlica'], ['/life/', '通信・お金'], ['/card/', 'クレジットカード比較'], [`/card/${id}/`, s.name]]}
    kicker="CREDIT CARD" title={`${s.name}の年会費・還元率・申込条件`}
    lead={s.summary}>
    <section className="sv-wrap sv-guide">
      <h2>{s.name}の基本情報</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <tbody>
          <tr><th scope="row">年会費</th><td>{s.fee}</td></tr>
          <tr><th scope="row">基本還元率</th><td>{s.rate.toFixed(1)}%</td></tr>
          <tr><th scope="row">特徴</th><td><ul>{s.facts.map(f => <li key={f}>{f}</li>)}</ul></td></tr>
        </tbody>
      </table></div>
      <p className="sv-note">還元率は通常利用時の基本値です。キャンペーンや「最大◯%」の上乗せ還元は条件つきのため含んでいません。条件は各社の公式サイトで確認してください。</p>
      <div className="sv-cta-row"><Cta service={s} env={env} placement="card-detail" /></div>
    </section>
    {s.details && <section className="sv-wrap sv-guide">
      <h2>申込条件・詳細</h2>
      <div className="sv-table-scroll"><table className="sv-table">
        <tbody>{s.details.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody>
      </table></div>
    </section>}
    <section className="sv-wrap sv-guide">
      <h2>注意点</h2>
      <ul>{s.cautions.map(c => <li key={c}>{c}</li>)}</ul>
      <p className="sv-note">出典：<a href={s.sourceUrl || s.officialUrl} target="_blank" rel="noopener noreferrer">公式情報 ↗</a>（確認日はページ上部に記載）</p>
    </section>
    <section className="sv-wrap sv-related">
      <h2>条件で比べる・ほかのカード</h2>
      <div><a href="/card/"><strong>条件を入れてカードを比べる →</strong><span>よく使うサービス・年齢・重視することから順位を出す無料ツール</span></a>
        {others.map(p => <a key={p.id} href={p.path}><strong>{p.title} →</strong><span>年会費・基本還元率・申込条件</span></a>)}</div>
    </section>
  </Shell>;
}

