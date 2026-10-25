// Reuse the tested Vercel handlers without changing their business logic.
// Workers' nodejs_compat flag supplies Buffer, crypto and process.env bindings.
export async function runHandler(handler, request, { bodyLimit = 32768 } = {}) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers);
  headers.host = url.host;
  const query = Object.fromEntries([...new Set(url.searchParams.keys())].map(key => {
    const values = url.searchParams.getAll(key);
    return [key, values.length === 1 ? values[0] : values];
  }));
  let body;
  if (request.body) {
    if (Number(headers['content-length']) > bodyLimit) return Response.json({ error: 'body_too_large' }, { status: 413 });
    const reader = request.body.getReader(), chunks = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > bodyLimit) { await reader.cancel(); return Response.json({ error: 'body_too_large' }, { status: 413 }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    body = new TextDecoder().decode(bytes);
  }
  const responseHeaders = new Headers({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  let status = 200, result = null, ended = false;
  const res = {
    setHeader(key, value) { responseHeaders.set(key, String(value)); return this; },
    status(code) { status = code; return this; },
    json(value) { responseHeaders.set('Content-Type', 'application/json; charset=utf-8'); result = JSON.stringify(value); ended = true; return this; },
    send(value) { result = value; ended = true; return this; },
    end(value = null) { result = value; ended = true; return this; },
  };
  await handler({ method: request.method, headers, query, body }, res);
  if (!ended) return Response.json({ error: 'handler_did_not_respond' }, { status: 502 });
  return new Response(request.method === 'HEAD' || [204, 205, 304].includes(status) ? null : result, { status, headers: responseHeaders });
}
