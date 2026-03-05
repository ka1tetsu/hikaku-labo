const AMAZON_TAG = 'kuronekosanta-22';

export { AMAZON_TAG };

// Build Rakuten affiliate URL from item data
export function buildRakutenAffiliateUrl(item) {
    return item.affiliateUrl || item.itemUrl || '#';
}

// Build Amazon search affiliate URL
export function buildAmazonAffiliateUrl(keyword) {
    return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${AMAZON_TAG}`;
}

// Search products via our own /api/search proxy (server-side Rakuten call)
export async function searchRakutenItems(keyword, genreId = '', page = 1) {
    const params = new URLSearchParams({ keyword, page });
    if (genreId) params.append('genreId', genreId);

    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
    }
    return res.json();
}
