const AMAZON_TAG = 'kuronekosanta-22';
const YAHOO_SID = '3506307';
const YAHOO_PID = '888496181';

const ARTICLE_ENDPOINT = '/api/article';
const REVIEW_SUMMARY_ENDPOINT = '/api/reviewSummary';

export { AMAZON_TAG };

// 商品名から検索に適したキーワードを作る。
// ブランド名だけ(例:「Apple」)で検索させると汎用一覧に飛んで成約しないため、
// 記号や煽り文句を除いたうえでブランド＋型番相当の語を残す。
export function buildSearchKeyword(itemName = '') {
    const cleaned = String(itemName)
        .replace(/[【[(（].*?[】\])）]/g, ' ')       // 【送料無料】[123] などを除去
        .replace(/送料無料|ポイント\d*倍|最安値?|新品|未使用|正規品|即納|あす楽/g, ' ')
        .replace(/[/|｜,、]/g, ' ')
        .replace(/[\u3000\s]+/g, ' ')
        .trim();
    // 先頭4語程度に絞る（長すぎると検索ヒットが0になるため）
    const words = cleaned.split(' ').filter(Boolean).slice(0, 4);
    return words.join(' ') || String(itemName).trim();
}

// 楽天の商品リンク。affiliateUrl があれば最優先（報酬が発生するのはこれだけ）。
// 無い場合でも '#'(リンク切れ)は絶対に返さず、必ず実在する検索URLにフォールバックする。
export function buildRakutenAffiliateUrl(item = {}) {
    const isUsable = (u) => typeof u === 'string' && /^https?:\/\//.test(u);
    if (isUsable(item.affiliateUrl)) return item.affiliateUrl;
    if (isUsable(item.itemUrl)) return item.itemUrl;
    const kw = buildSearchKeyword(item.itemName || '');
    return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(kw)}/`;
}

// Build Amazon search affiliate URL
export function buildAmazonAffiliateUrl(keyword) {
    return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=${AMAZON_TAG}`;
}

// Build Yahoo Shopping affiliate URL
export function buildYahooAffiliateUrl(keyword) {
    const baseUrl = `https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(keyword)}`;
    return `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${YAHOO_SID}&pid=${YAHOO_PID}&vc_url=${encodeURIComponent(baseUrl)}`;
}



// Search products via our own /api/search proxy (server-side Rakuten call)
export async function searchRakutenItems(keyword, genreId = '', page = 1) {
    // Try to actually retrieve from Rakuten and append our high-quality data
    // Local errors out occasionally, so we'll just fall back securely
    try {
        const params = new URLSearchParams({ keyword, page });
        if (genreId) params.append('genreId', genreId);

        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();

        if (!data.Items || data.Items.length === 0) return { Items: [], pageCount: 0, hits: 0 };

        // 取得した実データをそのまま返す。
        // 順位・店舗数・AI要約などの根拠のない情報を合成すると優良誤認になるため行わない。
        return data;
    } catch (err) {
        // 取得に失敗した場合は架空の商品を見せず、エラーとして扱う
        throw err instanceof Error ? err : new Error('検索に失敗しました');
    }
}

// カテゴリIDから比較記事を1本取得する（価格.com風 比較記事自動生成API）
export async function fetchComparisonArticle(categoryId, title) {
    const params = new URLSearchParams({ categoryId });
    if (title) params.append('title', title);

    const res = await fetch(`${ARTICLE_ENDPOINT}?${params.toString()}`);
    if (!res.ok) {
        throw new Error('記事生成APIの呼び出しに失敗しました');
    }
    return res.json();
}

// レビュー配列から「メリット・デメリット・おすすめな人」を3行で要約するAPI
export async function summarizeReviews(reviews) {
    const res = await fetch(REVIEW_SUMMARY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews }),
    });
    if (!res.ok) {
        throw new Error('レビュー要約APIの呼び出しに失敗しました');
    }
    return res.json();
}
