import { EVIDENCE_BY_SECTION } from './evidenceContent.js';
import { SITE_SECTIONS } from './siteDirectory.js';
import { openConcierge } from './conciergeActions.js';
import './foundation.css';

export default function SiteHeader({ active = 'products', children }) {
  const evidence=EVIDENCE_BY_SECTION[active] || EVIDENCE_BY_SECTION.products;
  return <div className="hl-chrome">
    <a className="hl-skip" href="#main-content">メインコンテンツへ移動</a>
    <div className="hl-header">
      <div className="hl-container hl-header-row">
        <a href="/" className="hl-brand" aria-label="Vivlica：トップページ">
          <span className="hl-brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span className="hl-brand-text">{active === 'travel' ? 'Vivlica Travel' : 'Vivlica'}<small>{active === 'travel' ? 'VIVLICA TRAVEL' : 'VIVLICA'}</small></span>
        </a>
        <nav className="hl-main-nav" aria-label="Vivlicaのサイト内ナビゲーション">
          {SITE_SECTIONS.map(section => <a
            key={section.id}
            href={section.href}
            aria-current={section.id === active ? 'page' : undefined}
            className={'hl-nav-item' + (section.id === active ? ' is-current' : '')}
          ><img src={'/icons/tabler/' + section.icon + '.svg'} alt="" aria-hidden="true" width="18" height="18"/><span>{section.nav}</span></a>)}
        </nav>
        <button type="button" className="hl-header-ai" onClick={() => openConcierge()}><span aria-hidden="true">✳</span> 条件から相談</button>
        <a className="hl-header-link" href={active === 'travel' ? '/travel/#destinations' : '/life/#savings'}>{active === 'travel' ? '旅行先を探す' : '固定費を診断'} <img src="/icons/tabler/arrow-up-right.svg" alt="" aria-hidden="true" width="16" height="16"/></a>
      </div>
    </div>
    <details className="hl-evidence-details"><summary><strong>{evidence.title}</strong><span>{evidence.short}</span></summary><dl>
      <div><dt>情報源</dt><dd>{evidence.source}</dd></div>
      <div><dt>計算・比較方法</dt><dd>{evidence.calculation}</dd></div>
      <div><dt>含まれない情報</dt><dd>{evidence.excluded}</dd></div>
      <div><dt>最後に確認すること</dt><dd>{evidence.next}</dd></div>
    </dl><a href="/editorial-policy/">比較と広告の公開方針を見る →</a></details>
    {children}
  </div>;
}
