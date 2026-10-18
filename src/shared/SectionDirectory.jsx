import { SITE_SECTIONS } from './siteDirectory.js';

export default function SectionDirectory() {
  return <section className="hl-directory" aria-labelledby="hl-directory-title">
    <div className="hl-directory-head">
      <div>
        <span className="hl-kicker"><span className="hl-kicker-dot"/> RESEARCH & COMPARISON</span>
        <h1 id="hl-directory-title">毎日の支出に、<em>納得できる選択</em>を。</h1>
        <p>スマホ代を見直す、買い物を比べる、旅行を計画する。予算と使い方から選べる、{SITE_SECTIONS.length}つの無料比較ツール。</p>
      </div>
      <div className="hl-directory-aside" aria-label="比較対象カテゴリ数"><strong>{String(SITE_SECTIONS.length).padStart(2, '0')}</strong><span>比較カテゴリ</span><small>商品・IT・旅行・通信とお金</small></div>
    </div>
    <div className="hl-directory-start"><a href="#savings">スマホ代の年間差額を診断 →</a><a href="/compare/">型番で商品価格を比較 →</a></div>
    <div className="hl-directory-grid">
      {SITE_SECTIONS.map(section => <a key={section.id}
        className={'hl-directory-card hl-directory-' + section.id}
        href={section.id === 'products' ? '#results' : section.href}>
        <div className="hl-directory-card-top"><span className="hl-directory-icon"><img src={'/icons/tabler/' + section.icon + '.svg'} alt="" aria-hidden="true" width="25" height="25"/></span><span className="hl-directory-metric">{section.metric}</span></div>
        <h2>{section.heading}</h2><p>{section.description}</p>
        <span className="hl-directory-action">{section.action}<img src="/icons/tabler/arrow-up-right.svg" alt="" aria-hidden="true" width="17" height="17"/></span>
      </a>)}
    </div>
    <p className="hl-directory-caveat">※ 情報の取得元や更新頻度は各ページに記載しています。広告・アフィリエイトリンクを含む場合があります。</p>
  </section>;
}
