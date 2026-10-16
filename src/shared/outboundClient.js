// Logs voluntary outbound clicks only; navigation is never delayed.
// A8.net-issued HTML is deliberately NOT edited and receives no tracking parameters.
export function recordOutboundClick({ section, merchant, placement, sponsored }) {
  try {
    const body = JSON.stringify({ event: 'outbound', section, merchant, placement, sponsored: Boolean(sponsored) });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], {type:'application/json'});
      if (navigator.sendBeacon('/api/track', blob)) return;
    }
    fetch('/api/track', {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => {});
  } catch {
    // If analytics fails, ads and user navigation must still work.
  }
}
