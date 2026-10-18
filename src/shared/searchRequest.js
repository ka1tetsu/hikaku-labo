// Abort superseded searches and bound waiting time. Only the current response
// should affect a result list; query strings and prices are never logged here.
export async function searchResponse(url, { signal, timeoutMs = 9000 } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal?.aborted) abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('Search timed out', 'TimeoutError')), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.text();
    return new Response([204,205,304].includes(response.status) ? null : body, { status: response.status, statusText: response.statusText, headers: response.headers });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
