import { SITE_SECTIONS } from './siteDirectory.js';
import './foundation.css';

export default function SiteHeader({ active = 'products', children }) {
  return <div className="hl-chrome">
    <a className="hl-skip" href="#main-content">メインコンテンツへ移動</a>
    <div className="hl-header">
      <div className="hl-container hl-header-row">
        <a href="/" className="hl-brand" aria-label="比較ラボ：トップページ">
          <span className="hl-brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span className="hl-brand-text">比較ラボ<small>HIKAKU LABO</small></span>
        </a>
        <nav className="hl-main-nav" aria-label="比較ラボのサイト内ナビゲーション">
          {SITE_SECTIONS.map(section => <a
            key={section.id}
            href={section.href}
            aria-current={section.id === active ? 'page' : undefined}
            className={'hl-nav-item' + (section.id === active ? ' is-current' : '')}
          ><img src={'/icons/tabler/' + section.icon + '.svg'} alt="" aria-hidden="true" width="18" height="18"/><span>{section.nav}</span></a>)}
        </nav>
        <a className="hl-header-link" href="/#results">比較を始める <img src="/icons/tabler/arrow-up-right.svg" alt="" aria-hidden="true" width="16" height="16"/></a>
      </div>
    </div>
    {children}
  </div>;
}
