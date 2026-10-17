import { PAGE_IDS } from './outboundSchema.js';

const SOURCE_HOSTS = [
  [/(^|\.)google\./, 'google'], [/(^|\.)yahoo\.(co\.jp|com)$/, 'yahoo'], [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)(duckduckgo\.com|search\.brave\.com|ecosia\.org|baidu\.com|naver\.com)$/, 'search-other'],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, 'x'], [/(^|\.)instagram\.com$/, 'instagram'], [/(^|\.)(facebook\.com|fb\.me)$/, 'facebook'],
  [/(^|\.)line\.(me|naver\.jp)$/, 'line'], [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'], [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(threads\.net|pinterest\.\w+|reddit\.com|note\.com|b\.hatena\.ne\.jp)$/, 'social-other'],
];

// Only a coarse category leaves the browser, never the referring URL.
export function trafficSource(referrer, host) {
  if (!referrer) return 'direct';
  let from;
  try { from = new URL(referrer).hostname.toLowerCase(); } catch { return 'direct'; }
  if (from === host) return 'internal';
  return SOURCE_HOSTS.find(([pattern]) => pattern.test(from))?.[1] || 'referral';
}

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

// One anonymous view per page load (page id and traffic source only), used as the CTR denominator.
export function recordPageView() {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  const page = PAGE_IDS[path] || (path.startsWith('/sim/vs/') ? 'sim-vs' : path.startsWith('/hikari/area/') ? 'hikari-area' : null);
  if (page) send(JSON.stringify({ event: 'view', page, src: trafficSource(document.referrer, window.location.hostname) }));
}

// Logs voluntary outbound clicks only; navigation is never delayed.
// A8.net-issued HTML is deliberately NOT edited and receives no tracking parameters.
export function recordOutboundClick({ section, merchant, placement, sponsored }) {
  send(JSON.stringify({ event: 'outbound', section, merchant, placement, sponsored: Boolean(sponsored) }));
}
