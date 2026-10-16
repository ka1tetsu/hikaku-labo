
const AMAZON_TAG = 'kuronekosanta-22';
const YAHOO_SID = '3506307';
const YAHOO_PID = '888496181';

// 💰 楽天アフィリエイトID。アフィリエイトリンクのURLに現れる公開値。
// APIが affiliateUrl を返さなかった場合に、クライアント側で計測リンクを
// 組み立てるために使う。上書きしたい場合は .env の VITE_RAKUTEN_AFFILIATE_ID で。
const RAKUTEN_AFFILIATE_ID =
    import.meta.env?.VITE_RAKUTEN_AFFILIATE_ID || '432a9f67.243910f6.432a9f68.e28a199a';

export { AMAZON_TAG, RAKUTEN_AFFILIATE_ID };

// 実際に遷移できる http(s) URL かどうか（'#' や空文字を弾く）
function isRealUrl(url) {
    return typeof url === 'string' && /^https?:\/\//.test(url);
}

// 素の楽天URLを楽天アフィリエイトの計測リンク(hb.afl.rakuten.co.jp)に包む。
// 楽天市場だけでなく楽天トラベル等、楽天アフィリエイト対象サービスのURLにも使える。
export function wrapWithRakutenAffiliate(rawUrl) {
    if (!RAKUTEN_AFFILIATE_ID || !isRealUrl(rawUrl)) return null;
    const enc = encodeURIComponent(rawUrl);
    return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFFILIATE_ID}/?pc=${enc}&m=${enc}`;
}

// 楽天市場の検索結果への計測付きリンク（商品URLが取れないときの最終手段）
export function buildRakutenSearchAffiliateUrl(keyword) {
    const searchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword || '')}/`;
    return wrapWithRakutenAffiliate(searchUrl) || searchUrl;
}

// この商品の楽天リンクが実際に成果につながる（計測される）かどうか
export function hasRakutenAffiliate(item) {
    if (isRealUrl(item?.affiliateUrl)) return true;          // APIが計測URLを返している
    if (RAKUTEN_AFFILIATE_ID) return true;                    // 自前で計測URLを組み立てられる
    return false;                                             // どちらも無い＝踏まれても収益ゼロ
}

// 楽天アフィリエイトURLを組み立てる。
// 成果が発生しない素のitemUrlをそのまま返さないことが重要（旧実装の収益漏れ箇所）。
export function buildRakutenAffiliateUrl(item, keyword = '') {
    if (isRealUrl(item?.affiliateUrl)) return item.affiliateUrl;

    const wrapped = wrapWithRakutenAffiliate(item?.itemUrl);
    if (wrapped) return wrapped;

    if (RAKUTEN_AFFILIATE_ID) return buildRakutenSearchAffiliateUrl(keyword || item?.itemName || '');

    // アフィリエイトIDが未設定のときだけ、やむを得ず非計測URLを返す
    return isRealUrl(item?.itemUrl) ? item.itemUrl : '#';
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

// 楽天の商品名は「【送料無料】【ポイント10倍】Apple iPhone 15 …」のように販促文言が先頭に付く。
// 先頭語だけを他モールの検索語にすると「【送料無料】Apple」のような無意味な検索になり、
// 送客しても目的の商品が見つからず成約しない。販促文言を除いて先頭の数語を使う。
const PROMO_WORDS = /(送料無料|送料込み?|ポイント\d+倍|P\d+倍|最大\d+%?\s*(OFF|オフ)?|\d+%\s*(OFF|オフ)|クーポン(利用|配布)?で?|あす楽|正規品|国内正規品?|新品|未使用|即納|在庫あり|期間限定|限定|セール|SALE|楽天\S*|公式|メーカー保証|お買い物マラソン|スーパーSALE)/gi;

export function cleanSearchKeyword(name = '', maxWords = 3) {
    const cleaned = String(name)
        .replace(/[【[［〔(（<＜《「『][^】\]］〕)）>＞》」』]*[】\]］〕)）>＞》」』]/g, ' ')
        .replace(/[★☆◆◇■□●○▼▲♪！!＼／\\|｜]/g, ' ')
        .replace(PROMO_WORDS, ' ')
        .replace(/[\s\u3000]+/g, ' ')
        .trim();
    const words = cleaned.split(' ').filter(Boolean).slice(0, maxWords);
    const keyword = words.join(' ').slice(0, 40).trim();
    return keyword || String(name).slice(0, 20);
}

// 楽天・Amazon・Yahoo!ショッピングの検索結果への計測付きリンク一式。
// 商品APIが使えないときの代替導線や、他モール比較ボタンで共通利用する。
export function buildMallSearchLinks(keyword) {
    const kw = String(keyword || '').trim();
    return [
        { id: 'rakuten', label: '楽天市場', url: buildRakutenSearchAffiliateUrl(kw) },
        { id: 'amazon', label: 'Amazon', url: buildAmazonAffiliateUrl(kw) },
        { id: 'yahoo', label: 'Yahoo!ショッピング', url: buildYahooAffiliateUrl(kw) },
    ];
}

// 楽天APIの生アイテムを、比較に使う実データだけに正規化する。
// ここでモックを混ぜないこと（比較の根拠が架空になるため）。
export function normalizeRakutenItem(raw) {
    const price = Number(raw.itemPrice) || 0;
    const pointRate = Number(raw.pointRate) || 1;
    const isFreeShipping = raw.postageFlag === 0;

    // ポイント還元額（1倍＝通常付与1%相当）。楽天の pointRate は倍率。
    const pointBack = Math.floor(price * (pointRate / 100));

    return {
        itemCode: raw.itemCode,
        itemName: raw.itemName || '商品名不明',
        itemPrice: price,
        itemUrl: raw.itemUrl,
        affiliateUrl: raw.affiliateUrl,
        itemCaption: raw.itemCaption || '',
        imageUrl: (raw.mediumImageUrls?.[0]?.imageUrl || '').replace('_ex=128x128', '_ex=300x300'),
        shopName: raw.shopName || '',
        shopUrl: raw.shopUrl,
        reviewAverage: Number(raw.reviewAverage) || 0,
        reviewCount: Number(raw.reviewCount) || 0,
        postageFlag: raw.postageFlag,
        isFreeShipping,
        pointRate,
        pointBack,
        // 実質価格 = 商品価格 - ポイント還元額。
        // 送料別の商品は送料額がAPIで取得できないため加算せず、UI側で注記する。
        effectivePrice: price - pointBack,
        availability: raw.availability,
        creditCardFlag: raw.creditCardFlag,
        asurakuFlag: raw.asurakuFlag,
        taxFlag: raw.taxFlag,
    };
}

// Search products via our own /api/search proxy (server-side Rakuten call)
export async function searchRakutenItems(keyword, genreId = '', page = 1) {
    const params = new URLSearchParams({ keyword, page });
    if (genreId) params.append('genreId', genreId);

    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`楽天APIの取得に失敗しました (${res.status}) ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const rawItems = (data.Items || []).map(c => c.Item ?? c);

    return {
        items: rawItems.map(normalizeRakutenItem),
        pageCount: data.pageCount || 1,
        count: data.count || rawItems.length,
        // アフィリエイト計測が効いているかの目印（1件でも affiliateUrl があれば on）
        affiliateActive: rawItems.some(i => typeof i.affiliateUrl === 'string' && i.affiliateUrl.startsWith('http')),
    };
}
