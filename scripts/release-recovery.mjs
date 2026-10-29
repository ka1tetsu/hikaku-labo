// Verify exactly which commit has reached vivlica.com before any retry.
// This helper never calls Vercel, uses secrets, or deploys independently.
import { pathToFileURL } from 'node:url';

export const ORIGIN = 'https://vivlica.com';
const SHA = /^[0-9a-f]{40}$/i;
export function classifyRelease({ status, body, expectedCommit, origin = ORIGIN }) {
  if (!SHA.test(expectedCommit || '')) return { state: 'unknown', reason: 'invalid_expected_commit' };
  if (status !== 200) return { state: 'unknown', reason: 'release_endpoint_unavailable', status };
  let data;
  try { data = typeof body === 'string' ? JSON.parse(body) : body; }
  catch { return { state: 'unknown', reason: 'invalid_release_json' }; }
  if (data?.schemaVersion !== 1 || data.origin !== origin || !SHA.test(data.commit || ''))
    return { state: 'unknown', reason: 'untrusted_release_metadata' };
  return { state: data.commit.toLowerCase() === expectedCommit.toLowerCase() ? 'current' : 'stale', deployedCommit: data.commit, expectedCommit };
}
export async function inspectRelease(expectedCommit, { fetcher = fetch, origin = ORIGIN } = {}) {
  try {
    const url = `${origin}/release.json?verify=${encodeURIComponent(expectedCommit)}`;
    const response = await fetcher(url, { redirect: 'error', headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(12000) });
    return classifyRelease({ status: response.status, body: await response.text(), expectedCommit, origin });
  } catch (error) {
    return { state: 'unknown', reason: error?.name === 'TimeoutError' ? 'timeout' : 'network_error' };
  }
}
async function run() {
  const [mode, sha] = process.argv.slice(2);
  if (!['check', 'wait'].includes(mode) || !SHA.test(sha || '')) throw Error('Usage: node scripts/release-recovery.mjs check|wait <40-character SHA>');
  const checks = mode === 'wait' ? 36 : 1;
  for (let i = 0; i < checks; i++) {
    const state = await inspectRelease(sha);
    console.log(JSON.stringify({ attempt: i + 1, ...state }));
    if (state.state === 'current') return;
    if (mode === 'check') { process.exitCode = state.state === 'stale' ? 2 : 3; return; }
    if (i < checks - 1) await new Promise(resolve => setTimeout(resolve, 15000));
  }
  process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run().catch(error => { console.error(error.message); process.exitCode = 1; });
