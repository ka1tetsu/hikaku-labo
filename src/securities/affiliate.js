import { serviceLink } from '../services/affiliate.js';
import { recordOutboundClick } from '../shared/outboundClient.js';

// 成果リンクは src/shared/publicAffiliateLinks.js に発行済みURLがある場合だけ
// sponsored になります。未設定・不正なURLのときは公式URLへ送ります。
export function outboundLink(service, env = import.meta.env || {}) {
  return serviceLink(service, env);
}

export function recordOutbound(service, sponsored, placement = 'securities-card') {
  recordOutboundClick({ section: 'securities', merchant: service.id, sponsored, placement });
}
