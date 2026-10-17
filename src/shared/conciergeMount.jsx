import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SiteConcierge from './SiteConcierge.jsx';
import { recordOutboundClick, recordPageView } from './outboundClient.js';
import { openConcierge } from './conciergeActions.js';

recordPageView();

// Static pages are not hydrated: wire the header button and outbound click logging here.
document.addEventListener('click', event => {
  if (event.target.closest('.hl-header-ai')) { openConcierge(); return; }
  const link = event.target.closest('a[data-track="outbound"]');
  if (link) recordOutboundClick({ section: link.dataset.section, merchant: link.dataset.merchant, placement: link.dataset.placement, sponsored: link.dataset.sponsored === 'true' });
});

// Adds the floating AI concierge to static pages (guides).
const host = document.createElement('div');
host.id = 'hikaku-concierge';
document.body.appendChild(host);
createRoot(host).render(<StrictMode><SiteConcierge section={document.body.dataset.conciergeSection || 'site'} /></StrictMode>);
