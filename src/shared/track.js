// 外部リンク（広告・アフィリエイト含む）クリックのファーストパーティ集計。
// 送るのは「どのページのどの枠から、どの送客先へ」だけ。個人情報・検索語・URLは送らない。
// 集計結果は Vercel の Function Logs に出る（api/track.js）。成約・報酬は各ASP管理画面で確認する。
export function trackOutbound({ section, target, placement, sponsored = true }) {
  const body = JSON.stringify({ event: 'outbound', section, target, placement, sponsored: Boolean(sponsored) });
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      // sendBeacon はページ遷移後も送信が完了しやすく、クリック遷移を遅らせない
      if (navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))) return;
    }
    fetch('/api/track', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  } catch { /* 計測の失敗で遷移を妨げない */ }
}
