import { pageId } from './outboundSchema.js';

function send(body) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))) return;
    }
    fetch('/api/track', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  } catch {
    // Analytics must never break the page.
  }
}

// One anonymous view per page load (page id only), used as the CTR denominator.
export function recordPageView() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  const page = pageId(path);
  if (page) send(JSON.stringify({ event: 'view', page }));
}

// Logs voluntary outbound clicks only; navigation is never delayed.
// A8.net-issued HTML is deliberately NOT edited and receives no tracking parameters.
export function recordOutboundClick({ section, merchant, placement, sponsored }) {
  const page = typeof window === 'undefined' ? null : pageId(window.location.pathname);
  send(JSON.stringify({ event: 'outbound', section, merchant, placement, sponsored: Boolean(sponsored), ...(page ? { page } : {}) }));
}

// Enum-only milestones: never include bill amounts, answers or identity.
export function recordFunnelEvent(action) {
  if (typeof window === 'undefined') return;
  const page = pageId(window.location.pathname);
  if (page) send(JSON.stringify({ event: 'funnel', page, action }));
}
