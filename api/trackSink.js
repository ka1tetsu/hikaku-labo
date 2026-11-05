// Optional durable sink for /api/track events (R1 / funnel M2).
//
// Until TRACK_PERSIST_URL is configured, tracking stays log-only: the events
// exist solely in the function log, exactly as before this module existed.
// When it is configured, every validated event is also POSTed to that HTTPS
// endpoint as a single NDJSON line — byte-identical to the record written to
// the function log — so whatever accumulates the lines into daily files
// (events-YYYY-MM-DD.ndjson) can be fed straight into
// scripts/revenue-report.mjs (see scripts/fetch-track-logs.mjs).
//
// The sink never adds fields: no cookies, IP, user agent, referrer or search
// keyword is recorded here or in api/track.js. It also never throws and never
// fails the tracking response; the function log remains the fallback record.

const DEFAULT_TIMEOUT_MS = 1500;

// Returns { url, token } or null when persistence is not (validly) configured.
// Only https endpoints are accepted so event data is never sent in cleartext.
export function sinkConfig(env = process.env) {
  const url = env.TRACK_PERSIST_URL;
  if (!url) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:') return null;
  return { url, token: env.TRACK_PERSIST_TOKEN || null };
}

// Appends one event record to the configured sink. Resolves true only when
// the endpoint accepted the line; resolves false when unconfigured, timed
// out, or rejected. Never rejects.
export async function persistEvent(record, { env = process.env, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const config = sinkConfig(env);
  if (!config) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();
  try {
    const response = await fetchImpl(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
      },
      body: `${JSON.stringify(record)}\n`,
      signal: controller.signal,
    });
    return Boolean(response?.ok);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
