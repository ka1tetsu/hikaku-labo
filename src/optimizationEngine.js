import {
    buildAmazonAffiliateUrl,
    buildRakutenAffiliateUrl,
    buildRakutenSearchAffiliateUrl,
    buildYahooAffiliateUrl,
    hasRakutenAffiliate,
} from './api';

// --------------------------------------------------------------------------
// 🚀 Affiliate Routing Engine (楽天ファースト版)
//
// 方針: 楽天アフィリエイトを最優先で送客する。
// 楽天リンクが「実際に成果計測される」限り、常に楽天を選ぶ。
// 計測できない場合（アフィリエイトID未設定かつAPIがaffiliateUrlを返さない）だけ、
// クリックを無駄にしないため Amazon / Yahoo に逃がす。
// --------------------------------------------------------------------------

// 参考料率。あくまで内部の見込み計算用で、ユーザーに事実として表示しないこと。
// 楽天APIが affiliateRate を返す場合はそちら（実料率）を優先して使う。
const REFERENCE_RATES = {
    rakuten: 0.03, // 楽天アフィリエイト 標準 3%
    amazon: 0.02,  // Amazonアソシエイト 商品カテゴリにより変動
    yahoo: 0.01,   // バリューコマース 標準 1%
};

// カテゴリ別の実勢に近い補正（ガジェット系はAmazonの料率が大きく下がる）
function getReferenceRates(keyword = '') {
    const rates = { ...REFERENCE_RATES };
    const isSmartphone = keyword.includes('スマホ') || keyword.includes('iPhone');
    const isPC = keyword.includes('パソコン') || keyword.includes('PC') || keyword.includes('Mac');

    if (isSmartphone || isPC) {
        rates.amazon = 0.005; // Amazonのガジェット系は上限・料率ともに低い
        rates.yahoo = 0.04;
    }
    return rates;
}

export function getOptimizedAffiliateRoute(item, keyword, price) {
    const numPrice = Number(price) || 0;
    const rates = getReferenceRates(keyword || '');

    // 楽天APIが返す実料率(affiliateRate は % 単位)があれば最優先で採用
    const apiRate = Number(item?.affiliateRate);
    if (apiRate > 0) rates.rakuten = apiRate / 100;

    const expectedRewards = {
        rakuten: Math.floor(numPrice * rates.rakuten),
        amazon: Math.floor(numPrice * rates.amazon),
        yahoo: Math.floor(numPrice * rates.yahoo),
    };

    const rakutenUrl = buildRakutenAffiliateUrl(item, keyword);
    const rakutenTracked = hasRakutenAffiliate(item);

    // --- 楽天ファースト: 計測できるなら理由を問わず楽天に送る ---
    if (rakutenTracked) {
        return {
            winnerPlatform: 'rakuten',
            bestUrl: rakutenUrl,
            expectedReward: expectedRewards.rakuten,
            rakutenTracked: true,
            // 料率は推定値。UI上で確定値として見せないこと。
            estimatedRates: formatRates(rates),
        };
    }

    // --- フォールバック: 楽天が計測不能なときだけ他ASPを比較 ---
    const fallback = expectedRewards.amazon >= expectedRewards.yahoo ? 'amazon' : 'yahoo';
    const fallbackUrls = {
        amazon: buildAmazonAffiliateUrl(keyword),
        yahoo: buildYahooAffiliateUrl(keyword),
    };

    if (import.meta.env?.DEV) {
        console.warn(
            '[optimizationEngine] 楽天リンクが計測不能のため %s へ退避しました。' +
            'VITE_RAKUTEN_AFFILIATE_ID / RAKUTEN_AFFILIATE_ID を設定してください。',
            fallback
        );
    }

    return {
        winnerPlatform: fallback,
        bestUrl: fallbackUrls[fallback],
        expectedReward: expectedRewards[fallback],
        rakutenTracked: false,
        rakutenFallbackUrl: buildRakutenSearchAffiliateUrl(keyword),
        estimatedRates: formatRates(rates),
    };
}

function formatRates(rates) {
    return {
        rakuten: `${(rates.rakuten * 100).toFixed(1)}%`,
        amazon: `${(rates.amazon * 100).toFixed(1)}%`,
        yahoo: `${(rates.yahoo * 100).toFixed(1)}%`,
    };
}
