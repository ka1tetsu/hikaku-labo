// Inspect first-party pages and APIs only. Never follow affiliate links, load ad
// pixels, send analytics events, read credentials or invent revenue figures.
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { siteOrigin, SITE_ORIGIN } from '../src/shared/site.js';

const REFERRAL_HOSTS = new Set(['hb.afl.rakuten.co.jp', 'px.a8.net', 'ck.jp.ap.valuecommerce.com', 'af.moshimo.com', 'h.accesstrade.net', 'click.linksynergy.com', 't.felmat.net', 't.afi-b.com', 'www.rentracks.jp', 'ad.presco.asia', 'tp.media', 'prf.hn']);
const attribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? match[2].replace(/&amp;/gi, '&') : '';
};

export function inspectReferralMarkup(html) {
  const hosts = {};
  for (const [tag] of html.matchAll(/<a\b[^>]*>/gi)) {
    try {
      const href = attribute(tag, 'href');
      const url = new URL(href.startsWith('//') ? 'https:' + href : href);
      if (url.protocol !== 'https:') continue;
      const sponsored = /\bsponsored\b/i.test(attribute(tag, 'rel'));
      if (REFERRAL_HOSTS.has(url.hostname) || (sponsored && ['www.amazon.co.jp', 'amazon.co.jp'].includes(url.hostname) && url.searchParams.get('tag'))) hosts[url.hostname] = (hosts[url.hostname] || 0) + 1;
    } catch { /* internal and invalid URLs are not referral evidence */ }
  }
  return { referralAnchors: Object.values(hosts).reduce((sum, n) => sum + n, 0), hosts };
}

export async function auditLive({ origin = SITE_ORIGIN, fetcher = fetch, includePrices = true, expectedCommit, releaseAttempts = 8, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const base = siteOrigin(origin), checks = [], findings = [];
  async function request(path, options = {}) {
    try {
      const response = await fetcher(base + path, { ...options, signal: AbortSignal.timeout(path.startsWith('/release.json') ? 4000 : 11000), redirect: 'error' });
      const text = await response.text();
      return { status: response.status, text };
    } catch { return { status: null, text: '' }; }
  }
  // No response is not evidence of a broken production site or missing ads.
  const home = await request('/');
  if (home.status === null) return {
    checkedAt: new Date().toISOString(), origin: base, checks: [{ path: '/', status: null, passed: null }],
    findings: [{ severity: 'action', code: 'audit_unreachable', message: '監査元から接続できません。ネットワーク許可・DNS・TLSを確認してください。サイトの障害や広告設定の有無は未判定です。' }],
    auditStatus: 'incomplete', monetizationStatus: 'unknown', hardFailures: 0, financials: null,
  };
  if (expectedCommit) {
    if (!/^[0-9a-f]{40}$/i.test(expectedCommit)) throw new Error('Expected a full deployment commit');
    let matched = false;
    for (let attempt = 0; attempt < releaseAttempts; attempt++) {
      const response = await request('/release.json?expected=' + expectedCommit);
      try { const release = JSON.parse(response.text); matched = response.status === 200 && release.commit === expectedCommit && release.origin === base; } catch { /* rollout may still serve the previous release */ }
      if (matched) break;
      if (attempt + 1 < releaseAttempts) await wait(3000);
    }
    checks.push({ path: '/release.json', passed: matched, expectedCommit });
    if (!matched) return { checkedAt: new Date().toISOString(), origin: base, checks, findings: [{ severity: 'error', code: 'deployment_not_current' }], hardFailures: 1, financials: null };
    const diagnostic = await request('/api/diag');
    let passive = false;
    try { const data = JSON.parse(diagnostic.text); passive = diagnostic.status === 200 && data.mode === 'passive' && Array.isArray(data.probes) && data.probes.length === 0 && !JSON.stringify(data).includes('head'); } catch { /* report malformed responses */ }
    checks.push({ path: '/api/diag', status: diagnostic.status, passed: passive });
    if (!passive) findings.push({ severity: 'error', code: 'diagnostic_not_passive' });
  }
  for (const path of ['/', '/travel/', '/tools/', '/sim/', '/hikari/', '/card/']) {
    const response = path === '/' && !expectedCommit ? home : await request(path);
    const appHtml = response.status === 200 && /Vivlica/i.test(response.text) && /<h1\b/i.test(response.text);
    const referrals = inspectReferralMarkup(response.text);
    checks.push({ path, status: response.status, passed: appHtml, ...referrals });
    if (!appHtml) findings.push({ severity: 'error', code: 'page_unavailable', path });
    else if (referrals.referralAnchors === 0) findings.push({ severity: 'action', code: 'review_referral_placements', path, message: '初期HTMLに成果リンクを検出できません。該当サービスの提携と承認済み素材を確認してください。' });
    if (appHtml) {
      const canonicalTag = [...response.text.matchAll(/<link\b[^>]*>/gi)].find(([tag]) => attribute(tag, 'rel').toLowerCase() === 'canonical')?.[0];
      const canonicalPassed = Boolean(canonicalTag && attribute(canonicalTag, 'href') === base + path);
      checks[checks.length - 1].canonicalPassed = canonicalPassed;
      if (!canonicalPassed) findings.push({ severity: 'action', code: 'review_canonical_origin', path, message: 'canonicalが公開先と一致しません。未接続の移管先へ検索評価を送らないよう、公開ドメインとビルド設定を確認してください。' });
    }
  }
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    const response = await request(path);
    const passed = response.status === 200 && response.text.includes(base + (path === '/robots.txt' ? '/sitemap.xml' : '/guides/travel-budget/'));
    checks.push({ path, status: response.status, passed });
    if (!passed) findings.push({ severity: 'error', code: 'search_discovery_invalid', path });
  }
  const tracking = await request('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"event":"invalid"}' });
  let trackingBody;
  try { trackingBody = JSON.parse(tracking.text); } catch { /* report the failure below */ }
  const trackingPassed = tracking.status === 400 && trackingBody?.error === 'invalid_event';
  checks.push({ path: '/api/track', status: tracking.status, passed: trackingPassed });
  if (!trackingPassed) findings.push({ severity: 'error', code: 'tracking_unavailable' });

  if (includePrices) {
    const search = await request('/api/search?keyword=WH-1000XM5&page=1');
    let data;
    try { data = JSON.parse(search.text); } catch { /* only normalized status is retained */ }
    const items = Array.isArray(data?.Items) ? data.Items : [];
    checks.push({ path: '/api/search', status: search.status, itemCount: items.length, affiliateUrlCount: items.filter(entry => Boolean((entry.Item || entry).affiliateUrl)).length });
    if (search.status !== 200) findings.push({ severity: 'action', code: 'repair_product_search', status: search.status, message: '商品APIを取得できません。キーの再発行より先に、既存設定と登録サイトの制限を確認してください。' });
    else if (items.length === 0) findings.push({ severity: 'action', code: 'empty_product_search', message: '商品APIは200ですが、検査した型番の出品がありません。本文形式と検索結果を確認してください。' });
    else if (!items.some(entry => Boolean((entry.Item || entry).affiliateUrl))) findings.push({ severity: 'action', code: 'product_referrals_missing', message: '商品は取得できましたがaffiliateUrlがありません。APIの広告設定と代替リンクの計測を確認してください。' });
    const comparison = await request('/api/compare?q=WH-1000XM5');
    let compared;
    try { compared = JSON.parse(comparison.text); } catch { /* no response body is logged */ }
    const sources = Object.fromEntries(['rakuten', 'yahoo'].map(name => [name, ['ok','error','disabled','skipped'].includes(compared?.sources?.[name]) ? compared.sources[name] : 'unknown']));
    checks.push({ path: '/api/compare', status: comparison.status, sources, offerCount: Array.isArray(compared?.offers) ? compared.offers.length : 0 });
    if (!Object.values(sources).includes('ok')) findings.push({ severity: 'action', code: 'no_live_price_source', message: '自動価格比較が未接続です。ショップへの検索リンクは継続できますが、価格取得が成功したとは扱わないでください。' });
    else if (!Array.isArray(compared?.offers) || compared.offers.length === 0) findings.push({ severity: 'action', code: 'empty_price_comparison', message: '価格ソースは応答しましたが出品を取得できていません。検索とレスポンス形式を確認してください。' });
  }
  return {
    checkedAt: new Date().toISOString(), origin: base, migrationTarget: SITE_ORIGIN,
    checks, findings,
    auditStatus: checks.some(check => check.status === null) ? 'incomplete' : 'complete',
    monetizationStatus: checks.some(check => check.status === null) ? 'unknown' : findings.length ? 'action_required' : includePrices ? 'configured_not_verified' : 'unknown',
    hardFailures: findings.filter(finding => finding.severity === 'error').length,
    financials: null,
    limitations: ['掲載されたリンクはASPの承認・有効性・成果・報酬の証明ではありません。', '初期HTMLのみを検査し、広告リンクや計測画像にはアクセスしません。', '実利益はASPの確定報酬と実費が必要です。'],
  };
}

export function auditMarkdown(report) {
  return [
    '# 収益導線の自動監査', '',
    `対象: ${report.origin}`, `確認日時: ${report.checkedAt}`, '',
    '| 項目 | 結果 |', '| --- | --- |',
    `| 監査完了 | ${report.auditStatus || 'incomplete'} |`,
    `| サイトの検査失敗 | ${report.hardFailures} |`,
    `| 収益導線 | ${report.monetizationStatus || 'unknown'} |`,
    '| 確定報酬・利益 | 未接続・不明 |', '',
    '## 要対応', '',
    ...report.findings.map(finding => `- ${finding.code}${finding.path ? ' (' + finding.path + ')' : ''}: ${finding.message || '応答と公開設定を確認してください。'}`),
    ...(report.findings.length ? [] : ['- 検査した範囲に問題は見つかりませんでした。ASP承認や収益の確認は別途必要です。']),
    '', '広告リンク・計測画像へのアクセスや、成果イベントの送信は行っていません。',
    'ASPの確定報酬と運営費、Search Consoleの流入実績を同期間で照合してください。', '',
  ].join('\n');
}

async function main() {
  const args = process.argv.slice(2), options = {};
  let output, summary, requireMonetization = false;
  while (args.length) {
    const key = args.shift();
    if (key === '--require-monetization') { requireMonetization = true; continue; }
    const value = args.shift();
    if (!value || !['--origin','--output','--summary'].includes(key)) throw new Error('Usage: npm run audit:live -- [--origin HTTPS_ORIGIN] [--output FILE] [--summary FILE] [--require-monetization]');
    if (key === '--origin') options.origin = value;
    else if (key === '--summary') summary = value;
    else output = value;
  }
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_SHA) options.expectedCommit = process.env.GITHUB_SHA;
  const report = await auditLive(options);
  const json = JSON.stringify(report, null, 2) + '\n';
  if (output) await writeFile(output, json, { mode: 0o600 });
  if (summary) await writeFile(summary, auditMarkdown(report), { mode: 0o600 });
  console.log(json);
  if (process.env.GITHUB_ACTIONS === 'true') {
    for (const finding of report.findings) console.log(`::${finding.severity === 'error' ? 'error' : 'warning'} title=Revenue readiness::${finding.code}${finding.path ? ' '+finding.path : ''}`);
  }
  if (report.hardFailures || report.auditStatus === 'incomplete') process.exitCode = 1;
  else if (requireMonetization && report.monetizationStatus !== 'configured_not_verified') process.exitCode = 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
