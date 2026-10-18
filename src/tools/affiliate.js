import { serviceLink } from '../services/affiliate.js';
import { recordOutboundClick } from '../shared/outboundClient.js';

// 承認されていない広告URLを挿入しないでください。
// ASPまたは広告主の承認後、対象IDに https:// の成果計測URLを記入してください。
// 計測URL未設定時は必ず公式URLに送ります（売上は計上されません）。
export const APPROVED_AFFILIATE_LINKS = {
  // shopify: 'https://...approved-tracking-url...',
};

export function outboundLink(service, env = import.meta.env || {}) {
  const configured = serviceLink(service, env);
  if (configured.sponsored) return configured;
  const candidate = APPROVED_AFFILIATE_LINKS[service.id];
  if (typeof candidate === 'string') {
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' && !url.username && !url.password) {
        return { url: url.href, sponsored: true };
      }
    } catch { /* 設定不備は公式リンクにフォールバック */ }
  }
  return { url: service.officialUrl, sponsored: false };
}

export function recordOutbound(service, sponsored, placement = 'service-card') {
  recordOutboundClick({ section: 'tools', merchant: service.id, sponsored, placement });
}
