import {
    buildAmazonAffiliateUrl,
    buildRakutenAffiliateUrl,
    buildRakutenSearchAffiliateUrl,
    hasRakutenAffiliate,
} from './api.js';

// Preserve the product's source shop. Do not route a visitor using made-up
// commission rates; a configured referral URL is not proof of revenue or stock.
export function getOptimizedAffiliateRoute(item, keyword) {
    if (hasRakutenAffiliate(item)) {
        return {
            winnerPlatform: 'rakuten',
            bestUrl: buildRakutenAffiliateUrl(item, keyword),
            rakutenTracked: true,
        };
    }
    return {
        winnerPlatform: 'amazon',
        bestUrl: buildAmazonAffiliateUrl(keyword || item?.itemName || ''),
        rakutenTracked: false,
        rakutenFallbackUrl: buildRakutenSearchAffiliateUrl(keyword),
    };
}
