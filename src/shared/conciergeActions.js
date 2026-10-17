// Pages that can show the result in place listen for these events and call
// preventDefault(); everywhere else the concierge navigates to the right page.
export function runConciergeAction(action) {
  if (!action || typeof window === 'undefined') return;
  const event = new CustomEvent('hikaku:concierge-action', { detail: action, cancelable: true });
  if (!window.dispatchEvent(event)) return;
  if (action.type === 'show' || action.type === 'planner') {
    const params = new URLSearchParams({ destination: action.id });
    if (action.styleId) params.set('style', action.styleId);
    if (Number.isInteger(action.nights)) params.set('nights', String(action.nights));
    if (action.pace) params.set('pace', action.pace);
    window.location.href = '/travel/?' + params + (action.type === 'planner' ? '#planner' : '#recommendations');
  } else if (action.type === 'products') {
    window.location.href = '/?keyword=' + encodeURIComponent(action.keyword) + '#results';
  } else if (action.type === 'tools') {
    window.location.href = action.url;
  }
}

// Open the floating concierge, optionally sending a first message.
export function openConcierge(text = '') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('hikaku:concierge-open', { detail: { text } }));
}
