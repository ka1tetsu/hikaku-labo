import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SiteConcierge from './SiteConcierge.jsx';
import { recordPageView } from './outboundClient.js';

recordPageView();

// Adds the floating AI concierge to static pages (guides).
const host = document.createElement('div');
host.id = 'hikaku-concierge';
document.body.appendChild(host);
createRoot(host).render(<StrictMode><SiteConcierge section={document.body.dataset.conciergeSection || 'site'} /></StrictMode>);
