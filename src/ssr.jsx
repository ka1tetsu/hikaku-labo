import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import ToolsPage from './tools/ToolsPage.jsx';
import TravelPage from './travel/TravelPage.jsx';
import ComparePage from './compare/ComparePage.jsx';
import ServicesPage from './services/ServicesPage.jsx';

// Built HTML file → page element. Used only by scripts/prerender.mjs.
export const PAGES = {
  'index.html': () => <App />,
  'tools/index.html': () => <ToolsPage />,
  'travel/index.html': () => <TravelPage />,
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
