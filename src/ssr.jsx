import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import InfoPage from './shared/InfoPages.jsx';
import { INFO_PAGES } from './shared/infoContent.js';
import ToolsPage from './tools/ToolsPage.jsx';
import TravelPage from './travel/TravelPage.jsx';
import HotelDetailPage from './travel/HotelDetailPage.jsx';
import ComparePage from './compare/ComparePage.jsx';
import ServicesPage from './services/ServicesPage.jsx';
import { HikariAreaPage, SimPairPage } from './services/StaticPages.jsx';
import { AREA_PAGES, SIM_PAIRS, areaLabel } from './services/pages.js';
import { SIM_SERVICES } from './services/catalog.js';

// Built HTML file → page element. Used only by scripts/prerender.mjs.
export const PAGES = {
  'index.html': () => <App />,
  'tools/index.html': () => <ToolsPage />,
  'travel/index.html': () => <TravelPage />,
  'travel/hotels/index.html': () => <HotelDetailPage />,
  'compare/index.html': () => <ComparePage />,
  'life/index.html': () => <ServicesPage category="life" />,
  'sim/index.html': () => <ServicesPage category="sim" />,
  'hikari/index.html': () => <ServicesPage category="hikari" />,
  'card/index.html': () => <ServicesPage category="card" />,
  'hoken/index.html': () => <ServicesPage category="hoken" />,
};

export function render(file) {
  return renderToString(<StrictMode>{PAGES[file]()}</StrictMode>);
}

// Long-tail pages that exist only as static HTML (no React hydration).
const simName = id => SIM_SERVICES.find(s => s.id === id).name;
export const STATIC_PAGES = [
  ...INFO_PAGES.map(page => ({ ...page, title: page.title + '｜Vivlica', og: 'default', crumbs: [['/', 'Vivlica'], [page.path, page.title]], element: () => <InfoPage page={page} /> })),
  ...SIM_PAIRS.map(pair => ({
    path: pair.path,
    title: `${simName(pair.a)}と${simName(pair.b)}の比較【2026年10月】料金・通話・サポートの違い｜Vivlica`,
    description: `${simName(pair.a)}と${simName(pair.b)}を、データ量ごとの月額料金・通話・店舗サポートで比較。どちらが安いかを使い方別に結論から解説します。`,
    og: 'sim',
    crumbs: [['/life/', '通信・お金の比較'], ['/sim/', '格安SIM比較'], [pair.path, pair.title]],
    element: () => <SimPairPage a={pair.a} b={pair.b} env={import.meta.env} />,
  })),
  ...AREA_PAGES.map(page => ({
    path: page.path,
    title: `${areaLabel(page.area)}の光回線比較【2026年10月】スマホ別のおすすめとセット割｜Vivlica`,
    description: `${areaLabel(page.area)}で申し込める主な光回線を、ドコモ・au・ソフトバンク・楽天モバイルなど使っているスマホ別にセット割と提供エリアで整理。`,
    og: 'hikari',
    crumbs: [['/life/', '通信・お金の比較'], ['/hikari/', '光回線比較'], [page.path, page.title]],
    element: () => <HikariAreaPage area={page.area} env={import.meta.env} />,
  })),
];

export function renderStatic(page) {
  return renderToString(page.element());
}
