// Safe activation diagnostics: this reports readiness, not actual earnings.
// It never prints API tokens, advertising URLs, or financial secrets.
import { travelAffiliateEnabled } from '../src/travel/a8TravelAds.js';
import { travelLinkConfig } from '../src/travel/bookingLinks.js';
import { affiliateBundle } from '../src/shared/affiliateConfig.js';
import { SERVICE_IDS, SIM_SERVICES, HIKARI_SERVICES, CARD_SERVICES, HOKEN_SERVICES } from '../src/services/catalog.js';
import { serviceLink, affiliateEnvKey } from '../src/services/affiliate.js';
import { SERVICES } from '../src/tools/catalog.js';
import { siteOrigin, SITE_ORIGIN } from '../src/shared/site.js';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 既存の楽天アフィリエイトのアカウントだけで申し込める高単価案件。
// 金額・条件は楽天アフィリエイト公式ページの掲載（確認日 2026-10-29）。変更されうるため、設定前に必ず原文で確認する。
// 専用リンクは楽天アフィリエイトの管理画面で作る。hb.afl のURLをコードで組み立てると成果対象外になりうるので作らない。
export const RAKUTEN_GROUP_QUICK_WINS = Object.freeze([
  {
    id: 'rakuten-mobile', name: '楽天モバイル', reward: 7000,
    condition: 'Rakuten最強プランの申込後、90日以内に利用開始された申込1件につき（データタイプ・端末のみ購入は対象外）',
    sourceUrl: 'https://affiliate.rakuten.co.jp/group/mobile/', checkedAt: '2026-10-29',
    note: '楽天モバイル側の案内では、参加は必ずしも全員が認められるとは限らない（https://network.mobile.rakuten.co.jp/tips/affiliate-program/）。',
  },
  {
    id: 'rakuten-card', name: '楽天カード', reward: 1500,
    condition: 'カード発行1件につき。楽天カード専用リンク経由の申込のみ（楽天プレミアムカードは別リンク）',
    sourceUrl: 'https://affiliate.rakuten.co.jp/card/', checkedAt: '2026-10-29',
    note: '楽天カードのキャンペーンページ経由や紹介者IDを使う紹介キャンペーン経由の申込は成果対象外。',
  },
]);

const SERVICE_BY_ID = Object.fromEntries([...SIM_SERVICES, ...HIKARI_SERVICES, ...CARD_SERVICES, ...HOKEN_SERVICES].map(s => [s.id, s]));

// 設定されているのに受け付け先の形式に合わず、公式リンクへ戻っている（＝報酬が出ない）サービス
export function rejectedAffiliateIds(env = {}) {
  return SERVICE_IDS.filter(id => {
    const raw = env[affiliateEnvKey(id)] || affiliateBundle(env.VITE_AFFILIATE_LINKS).links[id];
    if (typeof raw !== 'string' || !raw.trim()) return false;
    const service = SERVICE_BY_ID[id];
    return !service || !serviceLink(service, env).sponsored;
  });
}

export function monetizationChecklist(env = {}, origin = SITE_ORIGIN) {
  const canonical = siteOrigin(origin);
  const config = travelLinkConfig(env);
  const activeA8 = travelAffiliateEnabled({ ...env, VITE_SITE_ORIGIN: canonical });
  const affiliate = affiliateBundle(env.VITE_AFFILIATE_LINKS);
  const serviceIds = new Set([...SERVICE_IDS, ...SERVICES.map(s=>s.id)]);
  const serviceKeys = [...serviceIds];
  const configuredServiceIds = serviceKeys.filter(id => {
    const key = 'VITE_AFF_URL_' + id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    return Boolean(env[key] || affiliate.links[id]);
  });
  const productionEnvironmentVerified = env.VIVLICA_PRODUCTION_ENV_VERIFIED === 'true';
  const blockers = [];
  const quickWins = RAKUTEN_GROUP_QUICK_WINS.filter(item => !configuredServiceIds.includes(item.id));
  if (quickWins.length) blockers.push({
    priority: 0, code: 'rakuten_group_quick_wins',
    message: '新しいASPの審査を待たずに、既存の楽天アフィリエイトで申し込める高単価案件が未設定' + (productionEnvironmentVerified ? 'です。' : 'の可能性があります（この監査環境の値）。') + ' ' +
      quickWins.map(item => `${item.name}: 1件${item.reward.toLocaleString('ja-JP')}円（${item.condition}。${item.sourceUrl} 確認日${item.checkedAt}）`).join(' / '),
    action: '楽天アフィリエイトにログインし、各サービスの専用リンク（テキスト）を作成して、' +
      quickWins.map(item => affiliateEnvKey(item.id)).join('・') + ' に設定して再デプロイ。サイト情報に ' + canonical + ' を登録。' +
      quickWins.map(item => item.note).join(' '),
  });
  const rejected = rejectedAffiliateIds(env);
  if (rejected.length) blockers.push({
    priority: 0, code: 'affiliate_url_rejected',
    message: '紹介URLが設定されているのに形式（https・許可済みASPのホスト）が合わず、公式リンクに戻っています（報酬は発生しません）: ' + rejected.map(affiliateEnvKey).join('・'),
    action: 'ASP管理画面で発行された https の計測URLをそのまま貼り直してください。',
  });
  if (env.VIVLICA_HOSTING_COMMERCIAL_OK !== 'true') blockers.push({
    priority: 1, code: 'hosting_commercial_terms',
    message: 'Vercel の Hobby プランは非商用の個人利用に限られ、アフィリエイトリンクが主目的のサイトや広告掲載は商用利用に当たります（https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage）。Pro は月額 $20 から（https://vercel.com/pricing）。',
    action: '現在のVercelの契約を確認。Hobbyなら、Cloudflare Workers Free へ移す手順（docs/CLOUDFLARE-ONE-TIME.md）か Pro への変更を選ぶ。確認後は VIVLICA_HOSTING_COMMERCIAL_OK=true でこの項目を消せる。',
  });
  if (!activeA8) blockers.push({
    priority: 1, code: 'a8_domain_unverified',
    message: canonical + ' と広告掲載環境の登録値が一致していません。広告を停止した設定がある場合、媒体登録と広告主の条件を再確認してください。',
    action: 'A8.netのサイト情報に新しいドメインを登録し、Yahoo!トラベルの提携・広告掲載URLを確認してから VITE_A8_TRAVEL_REGISTERED_ORIGIN=' + canonical + ' をVercel Productionへ設定して再デプロイ。',
  });
  if (configuredServiceIds.length === 0) blockers.push({
    priority: 1, code: 'service_affiliate_not_configured',
    message: productionEnvironmentVerified ? '通信・カード・保険・ITの紹介URLは未設定です。' : 'この監査環境では通信・カード・保険・ITの紹介URLを確認できません。Vercelの本番環境変数とは異なる場合があります。',
    action: '各ASPで提携済みの正規広告素材・計測リンクを取得し、VITE_AFFILIATE_LINKS または VITE_AFF_URL_<ID> へ設定。A8が原文HTMLを要求する案件はHTMLのまま掲載。',
  });
  if (!config.tripcom && !config.bookingAid && !config.skyscannerPrefix && !config.expediaPrefix) blockers.push({
    priority: 2, code: 'travel_partner_programs_not_configured',
    message: productionEnvironmentVerified ? 'Trip.com、Booking.com、Skyscanner、Expediaの旅行成果IDは未設定です。' : 'この監査環境でTrip.com、Booking.com、Skyscanner、Expediaの旅行成果IDを確認できません。',
    action: '選択した提携先へ承認申請を行い、提供元が許可するリンク形式だけを使用。',
  });
  blockers.push({
    priority: 1, code: 'profit_not_verified',
    message: 'ASPの確定報酬と運営請求額が未入力のため、利益は不明です。',
    action: 'A8.net・楽天などの実際の承認済み成果とVercel/ドメイン/APIの実費を同じ期間で集め、npm run report:revenue で集計。',
  });
  return {
    checkedAt: new Date().toISOString(), origin: canonical,
    yTravelA8HtmlPreserved: true, a8RenderedWithCurrentSettings: activeA8,
    servicesWithConfiguredCandidate: configuredServiceIds.length,
    supportedServices: serviceIds.size,
    travelIdConfigured: {
      rakutenPublicId: Boolean(config.rakutenId),
      tripcom: Boolean(config.tripcom), booking: Boolean(config.bookingAid),
      skyscanner: Boolean(config.skyscannerPrefix), expedia: Boolean(config.expediaPrefix),
    },
    productionEnvironmentVerified,
    configuredLinkNotProofOfApproval: true,
    actualProfitJPY: null,
    blockers: blockers.sort((a, b) => a.priority - b.priority),
  };
}

export function activationMarkdown(report) {
  return [
    '# Vivlica 利益化アクション',
    '',
    '確認: ' + report.checkedAt,
    '対象: ' + report.origin,
    'A8広告表示: ' + (report.a8RenderedWithCurrentSettings ? 'ビルド設定上有効（媒体登録は運営者申告。提携継続・実表示は未検証）' : '無効・要確認'),
    'サービス広告候補: ' + report.servicesWithConfiguredCandidate + '/' + report.supportedServices + '（監査環境の値。本番設定未検証の可能性あり）',
    '実利益: 不明（ASP確定報酬・請求額未取得）',
    '',
    ...report.blockers.flatMap(item => [
      '## 優先 ' + item.priority + ': ' + item.code,
      item.message, item.action, '',
    ]),
    'APIキーやASP管理画面の非公開情報をIssue・CIログに公開しないこと。',
    '',
  ].join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = monetizationChecklist(process.env,process.env.SITE_ORIGIN || SITE_ORIGIN);
  const summary = activationMarkdown(report);
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n' + summary);
  }
}
