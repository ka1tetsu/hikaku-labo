// Cross-store price comparison for real products. Pure functions shared by the
// /api/compare serverless route, the compare page and tests. Only prices returned
// by official store APIs are compared; nothing is estimated or scraped.

const PROMO = /【[^】]*】|［[^］]*］|\[[^\]]*\]|《[^》]*》|〈[^〉]*〉|★[^★]*★|◆[^◆]*◆|■[^■]*■|(送料無料|ポイント\d+倍|最大\d+%OFF|楽天\d+位|ランキング\d*位?|あす楽|即納|当日発送|正規品|国内正規品|新品|未使用|在庫あり|お買い物マラソン|スーパーセール|クーポン|期間限定|限定価格|\d+%OFF)/g;
const STOP = new Set(['対応', '用', '付き', '付', 'セット', 'メーカー', '保証', '公式', '人気', 'おすすめ', '日本', '国内', '純正', 'タイプ', 'モデル', 'カラー', '選べる', '色']);

export function cleanTitle(title = '') {
  return String(title).normalize('NFKC').replace(PROMO, ' ').replace(/[()（）「」『』!！?？、。,／/|｜:：;；~〜]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Model numbers are the most reliable "same product" signal: WH-1000XM5, MQD83J/A, NA-LX129CL…
export function extractModelCodes(title = '') {
  const text = String(title).normalize('NFKC').toUpperCase();
  const codes = text.match(/\b[A-Z]{1,6}[-‐]?[A-Z0-9]*\d[A-Z0-9]*(?:[-‐/][A-Z0-9]+)*\b/g) || [];
  return [...new Set(codes.map(code => code.replace(/‐/g, '-')).filter(code => code.length >= 4 && /\d/.test(code) && /[A-Z]/.test(code)
    && !/^\d+(GB|TB|MB|MM|CM|KG|ML|W|V|MAH|HZ|INCH|P|K)$/.test(code) && !/^(USB|TYPE|IPHONE|IPAD|BLUETOOTH|WIFI|HDMI|LTE)\d*/.test(code)))];
}

function tokens(title) {
  return cleanTitle(title).toLowerCase().split(/\s+/).filter(t => t.length >= 2 && !STOP.has(t));
}

// Search phrase for other stores: brand-ish first word + model code, else the leading words.
export function deriveProductQuery(title = '') {
  const cleaned = cleanTitle(title);
  const codes = extractModelCodes(cleaned);
  const words = cleaned.split(' ').filter(w => w.length >= 2 && !STOP.has(w));
  if (codes.length) {
    const brand = words.find(w => !codes.some(code => w.toUpperCase().includes(code)) && !/\d/.test(w));
    return [brand, codes[0]].filter(Boolean).join(' ');
  }
  return words.slice(0, 3).join(' ');
}

// 0–100: how likely two listings are the same product.
export function matchScore(reference, candidate, { referenceJan = '', candidateJan = '' } = {}) {
  if (referenceJan && candidateJan) return referenceJan === candidateJan ? 100 : 0;
  const refCodes = extractModelCodes(reference);
  const candCodes = extractModelCodes(candidate);
  if (refCodes.length) {
    const shared = refCodes.some(code => candCodes.includes(code) || cleanTitle(candidate).toUpperCase().replace(/[-\s]/g, '').includes(code.replace(/[-\s]/g, '')));
    if (!shared) return Math.min(30, overlap(reference, candidate));
    return 85 + Math.round(overlap(reference, candidate) * 0.15);
  }
  return overlap(reference, candidate);
}
function overlap(a, b) {
  const x = new Set(tokens(a)), y = new Set(tokens(b));
  if (!x.size || !y.size) return 0;
  const common = [...x].filter(t => y.has(t)).length;
  return Math.round(100 * common / Math.min(x.size, y.size));
}

export const SAME_PRODUCT = 80;

export function normalizeRakutenOffer(raw) {
  const price = Number(raw.itemPrice) || 0;
  const pointRate = Number(raw.pointRate) || 1;
  const point = Math.floor(price * pointRate / 100);
  return {
    store: 'rakuten', storeName: '楽天市場', shopName: raw.shopName || '', title: raw.itemName || '',
    price, shippingFree: raw.postageFlag === 0, point, effectivePrice: price - point,
    url: raw.affiliateUrl || raw.itemUrl, sponsored: Boolean(raw.affiliateUrl),
    image: (raw.mediumImageUrls?.[0]?.imageUrl || raw.mediumImageUrls?.[0] || '').toString().replace('_ex=128x128', '_ex=200x200'),
    reviewAverage: Number(raw.reviewAverage) || 0, reviewCount: Number(raw.reviewCount) || 0, jan: '',
  };
}

export function normalizeYahooOffer(raw, wrapUrl = url => url) {
  const price = Number(raw.price) || 0;
  const point = Number(raw.point?.amount) || 0;
  return {
    store: 'yahoo', storeName: 'Yahoo!ショッピング', shopName: raw.seller?.name || '', title: raw.name || '',
    price, shippingFree: raw.shipping?.code === 2, point, effectivePrice: price - point,
    url: wrapUrl(raw.url), sponsored: wrapUrl(raw.url) !== raw.url,
    image: raw.image?.medium || raw.exImage?.url || '',
    reviewAverage: Number(raw.review?.rate) || 0, reviewCount: Number(raw.review?.count) || 0, jan: raw.janCode || '',
  };
}

// Same-product offers first, each group cheapest first (effective price after points).
export function rankOffers(offers, reference = '', referenceJan = '') {
  return offers
    .filter(offer => offer.price > 0 && offer.url)
    .map(offer => ({ ...offer, match: reference || referenceJan ? matchScore(reference, offer.title, { referenceJan, candidateJan: offer.jan }) : 100 }))
    .map(offer => ({ ...offer, sameProduct: offer.match >= SAME_PRODUCT }))
    .sort((a, b) => Number(b.sameProduct) - Number(a.sameProduct) || a.effectivePrice - b.effectivePrice || b.reviewCount - a.reviewCount);
}

export function summarizeOffers(offers) {
  const same = offers.filter(offer => offer.sameProduct);
  const pool = same.length ? same : offers;
  if (!pool.length) return null;
  const prices = pool.map(offer => offer.effectivePrice);
  return {
    count: pool.length, stores: [...new Set(pool.map(offer => offer.store))].length,
    min: Math.min(...prices), max: Math.max(...prices), cheapest: pool[0], sameProduct: same.length > 0,
  };
}
