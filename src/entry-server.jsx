/* eslint-disable react-refresh/only-export-components -- ビルド専用エントリでHMRの対象外 */
// ビルド時の静的HTML生成用エントリ（scripts/prerender.mjs から使う）。ブラウザには配信されない。
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import ToolsPage from './tools/ToolsPage.jsx';
import TravelPage from './travel/TravelPage.jsx';

export { PRODUCT_CATEGORIES, categoryPath, categoryPageTitle } from './shared/productCategories.js';
export { SERVICES, LAST_REVIEWED } from './tools/catalog.js';
export { TRAVEL_FAQ } from './travel/faq.js';

export function render(page, path = '/') {
  const element = page === 'tools' ? <ToolsPage />
    : page === 'travel' ? <TravelPage />
      : <App initialPath={path} />;
  return renderToString(<StrictMode>{element}</StrictMode>);
}
