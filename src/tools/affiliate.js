// 承認されていない広告URLを挿入しないでください。
// ASPまたは広告主の承認後、対象IDに https:// の成果計測URLを記入してください。
// 計測URL未設定時は必ず公式URLに送ります（売上は計上されません）。
export const APPROVED_AFFILIATE_LINKS = {
  // shopify: 'https://...approved-tracking-url...',
};

export function outboundLink(service) {
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

export function recordOutbound(service, sponsored) {
  // クライアント側から送るのはサービスIDと広告有無のみ。個人情報は収集しない。
  try {
    fetch('/api/track', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'outbound', serviceId: service.id, sponsored }),
    }).catch(() => {});
  } catch { /* 計測障害で遷移を妨げない */ }
}
