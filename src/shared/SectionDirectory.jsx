import { SITE_SECTIONS } from './siteDirectory.js';

export default function SectionDirectory({ headingLevel = 'h1' }) {
  const Heading = headingLevel;
  return <section className="hl-directory" aria-labelledby="hl-directory-title">
    <div className="hl-directory-head">
      <div>
        <span className="hl-kicker"><span className="hl-kicker-dot"/> RESEARCH & COMPARISON</span>
        <Heading id="hl-directory-title" className="hl-directory-title">選ぶ前に、<em>比べる軸</em>を。</Heading>
        <p>価格だけでなく、条件・使いやすさ・総費用も。判断に必要な情報を整理できる、3つの無料比較ツール。</p>
      </div>
      <div className="hl-directory-aside" aria-label="比較対象カテゴリ数"><strong>03</strong><span>比較カテゴリ</span><small>商品・IT・旅行</small></div>
    </div>
    <div className="hl-directory-grid">
      {SITE_SECTIONS.map(section => <a key={section.id}
        className={'hl-directory-card hl-directory-' + section.id}
        href={section.id === 'products' ? '#results' : section.href}>
        <div className="hl-directory-card-top"><span className="hl-directory-icon"><img src={'/icons/tabler/' + section.icon + '.svg'} alt="" aria-hidden="true" width="25" height="25"/></span><span className="hl-directory-metric">{section.metric}</span></div>
        {headingLevel === 'h1' ? <h2>{section.heading}</h2> : <h3 className="hl-directory-card-title">{section.heading}</h3>}<p>{section.description}</p>
        <span className="hl-directory-action">{section.action}<img src="/icons/tabler/arrow-up-right.svg" alt="" aria-hidden="true" width="17" height="17"/></span>
      </a>)}
    </div>
    <p className="hl-directory-caveat">※ 情報の取得元や更新頻度は各ページに記載しています。広告・アフィリエイトリンクを含む場合があります。</p>
  </section>;
}
