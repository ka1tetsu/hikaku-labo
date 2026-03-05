import { buildAmazonAffiliateUrl, buildRakutenAffiliateUrl, buildYahooAffiliateUrl } from './api';

// --------------------------------------------------------------------------
// 🚀 Dynamic Yield Affiliate Routing Engine (最高益ルーティングエンジン)
// 各種ASP（アフィリエイトプロバイダ）の現在のキャンペーンや利率を
// リアルタイムに比較し、手取り報酬が最も高くなるリンクを動的に生成します。
// --------------------------------------------------------------------------
export function getOptimizedAffiliateRoute(item, keyword, price) {
    const numPrice = Number(price) || 0;

    // リアルタイムの各社基本利率（本番ではA8.netやValueCommerceのAPIから取得）
    let rates = {
        amazon: 0.02,  // 基本 2%
        rakuten: 0.03, // 基本 3%
        yahoo: 0.01    // 基本 1%
    };

    // --- カテゴリによる単価の最適化 ---
    const isSmartphone = keyword.includes('スマホ') || keyword.includes('iPhone');
    const isPC = keyword.includes('パソコン') || keyword.includes('PC') || keyword.includes('Mac');

    if (isSmartphone || isPC) {
        rates.amazon = 0.005; // Amazonのガジェット系は上限や利率が低い
        rates.yahoo = 0.04;   // Yahooはガジェット系に強いキャンペーンが多い
    }

    // --- 日付や時間帯による動的キャンペーンの上乗せ（シミュレーション） ---
    const today = new Date().getDate();
    if (today % 5 === 0) rates.yahoo += 0.04; // Yahoo 5のつく日（+4%）
    if (today === 18) rates.rakuten += 0.03;  // 楽天ご愛顧感謝デー（+3%）

    // タイムセール等突発的なブーストをシミュレート
    const randomBoost = Math.random();
    if (randomBoost > 0.8) rates.amazon += 0.02; // Amazonタイムセール祭り
    else if (randomBoost > 0.6) rates.rakuten += 0.05; // 楽天お買い物マラソン

    // --- 最終的なアフィリエイト予想報酬額の計算 ---
    const expectedRewards = {
        amazon: Math.floor(numPrice * rates.amazon),
        rakuten: Math.floor(numPrice * rates.rakuten),
        yahoo: Math.floor(numPrice * rates.yahoo),
    };

    // 最も報酬が高いプラットフォームを選出
    let winner = 'rakuten';
    let maxReward = expectedRewards.rakuten;

    if (expectedRewards.amazon > maxReward) {
        winner = 'amazon';
        maxReward = expectedRewards.amazon;
    }
    if (expectedRewards.yahoo > maxReward) {
        winner = 'yahoo';
        maxReward = expectedRewards.yahoo;
    }

    // 勝利したプラットフォームのURLを生成
    const baseRakutenUrl = buildRakutenAffiliateUrl(item);
    const urls = {
        amazon: buildAmazonAffiliateUrl(keyword),
        rakuten: baseRakutenUrl !== '#' ? baseRakutenUrl : `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`,
        yahoo: buildYahooAffiliateUrl(keyword)
    };

    return {
        winnerPlatform: winner, // 'amazon' | 'rakuten' | 'yahoo'
        bestUrl: urls[winner],
        expectedReward: maxReward,
        ratesEnforced: {
            amazon: `${(rates.amazon * 100).toFixed(1)}%`,
            rakuten: `${(rates.rakuten * 100).toFixed(1)}%`,
            yahoo: `${(rates.yahoo * 100).toFixed(1)}%`
        }
    };
}
