// アフィリエイト計測ユーティリティ
// dataLayer(GTM) と gtag(GA4) の両方に対応。どちらも未導入なら何もしない（無害）。
// 計測を有効化するには、index.html に GA4/GTM のタグを追加するだけでOK。

export function trackEvent(eventName, params = {}) {
    if (typeof window === 'undefined') return;
    try {
        // GTM (dataLayer)
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: eventName, ...params });
        // GA4 (gtag)
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, params);
        }
        if (import.meta.env?.DEV) {
            // 開発時は計測内容を確認できるようにログ出力
            console.debug('[track]', eventName, params);
        }
    } catch {
        /* 計測失敗はUXに影響させない */
    }
}

// アフィリエイトリンクのクリックを計測（成果計測・改善の基盤）
export function trackAffiliateClick({ platform, itemName, price, position }) {
    trackEvent('affiliate_click', {
        affiliate_platform: platform,
        item_name: itemName,
        value: Number(price) || 0,
        currency: 'JPY',
        list_position: position,
    });
}
