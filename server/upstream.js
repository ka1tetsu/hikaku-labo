// A bounded provider request including the response body. Preserve TLS checks;
// let callers decide which responses may be cached or retried.
export async function upstreamResponse(url, { timeoutMs = 4000, ...options } = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  // The signal also bounds body reading, not only the arrival of HTTP headers.
  const body = await response.text();
  return { ok: response.ok, status: response.status, text: body };
}
