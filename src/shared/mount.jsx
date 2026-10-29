import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { recordPageView } from './outboundClient.js';

// Pages are prerendered at build time (scripts/prerender.mjs) so search engines and
// first paint see real content; the browser then hydrates the same markup.
export function mount(element) {
  recordPageView();
  const root = document.getElementById('root');
  const tree = <StrictMode>{element}</StrictMode>;
  // URL parameters (?destination=, ?q=, ?keyword=…) change the first render, so the
  // prerendered default markup is replaced instead of hydrated.
  if (root.firstElementChild && !window.location.search) {
    hydrateRoot(root, tree);
    return;
  }
  root.textContent = '';
  createRoot(root).render(tree);
}
