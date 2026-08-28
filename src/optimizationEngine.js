import { buildAmazonAffiliateUrl, buildRakutenAffiliateUrl, buildYahooAffiliateUrl, buildSearchKeyword } from './api';

// --------------------------------------------------------------------------
// アフィリエイトルーティング
// 「報酬額 = 価格 × 料率 × 成約率」で期待値を比較して遷移先を決める。
// 重要なのは成約率で、商品ページへの直リンクは検索結果ページ経由より遥かに成約する。
// そのため実在する商品直リンク(楽天のaffiliateUrl)を強く優先する。
// ※ 再描画のたびに遷移先が変わると計測も体験も壊れるため、乱数は使わず決定論的に計算する。
// --------------------------------------------------------------------------

// 検索ページ経由は商品直リンクに比べて大きく成約率が落ちるため係数で表現する
const CONVERSION_WEIGHT = {
    deepLink: 1.0,   // 商品ページへの直リンク
    searchPage: 0.25, // キーワード検索の一覧ページ
};

export function getOptimizedAffiliateRoute(item, keyword, price) {
    const numPrice = Number(price) || 0;
    const searchKeyword = buildSearchKeyword(item?.itemName || keyword || '');

    // 各ASPの基本料率（本番では各ASPの管理画面値に合わせて調整する）
    const rates = {
        amazon: 0.02,  // 基本 2%
        rakuten: 0.03, // 基本 3%
        yahoo: 0.01,   // 基本 1%
    };

    // カテゴリによる料率の違いを反映
    const kw = `${searchKeyword} ${keyword || ''}`;
    const isSmartphone = kw.includes('スマホ') || kw.includes('iPhone') || kw.includes('スマートフォン');
    const isPC = kw.includes('パソコン') || kw.includes('PC') || kw.includes('Mac');
    if (isSmartphone || isPC) {
        rates.amazon = 0.005; // Amazonのガジェット系は料率上限が低い
        rates.yahoo = 0.04;   // Yahooはガジェット系のキャンペーンが手厚い
    }

    // 楽天は商品直リンクが取れているかで成約率が大きく変わる
    const rakutenUrl = buildRakutenAffiliateUrl(item || {});
    const hasRakutenDeepLink = Boolean(item?.affiliateUrl || item?.itemUrl);

    const urls = {
        amazon: buildAmazonAffiliateUrl(searchKeyword),
        rakuten: rakutenUrl,
        yahoo: buildYahooAffiliateUrl(searchKeyword),
    };

    const weights = {
        amazon: CONVERSION_WEIGHT.searchPage,
        rakuten: hasRakutenDeepLink ? CONVERSION_WEIGHT.deepLink : CONVERSION_WEIGHT.searchPage,
        yahoo: CONVERSION_WEIGHT.searchPage,
    };

    // 期待値 = 価格 × 料率 × 成約率
    const expectedValues = {
        amazon: numPrice * rates.amazon * weights.amazon,
        rakuten: numPrice * rates.rakuten * weights.rakuten,
        yahoo: numPrice * rates.yahoo * weights.yahoo,
    };

    let winner = 'rakuten';
    for (const platform of ['amazon', 'yahoo']) {
        if (expectedValues[platform] > expectedValues[winner]) winner = platform;
    }

    return {
        winnerPlatform: winner, // 'amazon' | 'rakuten' | 'yahoo'
        bestUrl: urls[winner],
        // 実際に見込める報酬額（成約率の重みを除いた素の報酬額）
        expectedReward: Math.floor(numPrice * rates[winner]),
        isDeepLink: winner === 'rakuten' && hasRakutenDeepLink,
        ratesEnforced: {
            amazon: `${(rates.amazon * 100).toFixed(1)}%`,
            rakuten: `${(rates.rakuten * 100).toFixed(1)}%`,
            yahoo: `${(rates.yahoo * 100).toFixed(1)}%`,
        },
    };
}
