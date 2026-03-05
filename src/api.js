import { useState, useEffect, useCallback } from 'react';

const RAKUTEN_APP_ID = 'ec65ace1-9e87-4d23-83e4-b54103335b56';
const AMAZON_TAG = 'kuronekosanta-22';

// Rakuten affiliate URL builder - just add affiliate tag to item URL
function buildRakutenAffiliateUrl(item) {
    // affiliateUrl is provided directly by Rakuten API if affiliate ID is set
    // Otherwise, fallback to itemUrl (will still get commission if user auto-tracked)
    return item.affiliateUrl || item.itemUrl;
}

function buildAmazonAffiliateUrl(keyword) {
    return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${AMAZON_TAG}`;
}

export async function searchRakutenItems(keyword, genreId = '', page = 1) {
    const params = new URLSearchParams({
        format: 'json',
        keyword,
        applicationId: RAKUTEN_APP_ID,
        hits: 20,
        page,
        sort: '-reviewCount',
        imageFlag: 1,
    });
    if (genreId) params.append('genreId', genreId);

    const res = await fetch(`https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?${params}`);
    if (!res.ok) throw new Error('Rakuten API error');
    return res.json();
}

export { buildRakutenAffiliateUrl, buildAmazonAffiliateUrl, AMAZON_TAG };
