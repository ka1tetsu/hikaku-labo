// Safe activation diagnostics: this reports readiness, not actual earnings.
// It never prints API tokens, advertising URLs, or financial secrets.
import { travelAffiliateEnabled } from '../src/travel/a8TravelAds.js';
import { travelLinkConfig } from '../src/travel/bookingLinks.js';
import { affiliateBundle } from '../src/shared/affiliateConfig.js';
import { SERVICE_IDS } from '../src/services/catalog.js';
import { SERVICES } from '../src/tools/catalog.js';
import { siteOrigin, SITE_ORIGIN } from '../src/shared/site.js';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
  if (!activeA8) blockers.push({
    priority: 1, code: 'a8_domain_unverified',
    message: canonical + ' のA8.net登録と広告設定が、この監査環境では確認できません。旧URL登録を新ドメインの許可とみなしません。',
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
    blockers,
  };
}

export function activationMarkdown(report) {
  return [
    '# Vivlica 利益化アクション',
    '',
    '確認: ' + report.checkedAt,
    '対象: ' + report.origin,
    'A8広告表示: ' + (report.a8RenderedWithCurrentSettings ? 'ビルド設定上有効（提携継続を確認）' : '無効・要確認'),
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
