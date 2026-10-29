// Per warm function instance only. A short pause after a confirmed site-policy
// rejection avoids repeatedly spending quota; expiry allows a repaired setting
// to be tested again. Price results and user search terms are never retained.
export function providerGate({ ttlMs = 60000, now = Date.now } = {}) {
  let until = 0;
  return {
    remaining: () => Math.max(0, Math.ceil((until - now()) / 1000)),
    reject: () => { until = now() + ttlMs; },
    reset: () => { until = 0; },
  };
}
