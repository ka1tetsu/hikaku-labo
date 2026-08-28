// Vercel Serverless API Route - proxies requests to Rakuten openapi
// Adds required Referer/Origin headers that Rakuten openapi requires

// 認証情報は環境変数を優先（未設定時は従来値にフォールバックして動作を維持）
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || 'ec65ace1-9e87-4d23-83e4-b54103335b56';
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || 'pk_thp8WuFagFNOQh9VnsoWHJ8mAQhhRsHt4NWvW4wUA4q';
// ★売上の要： affiliateId を渡さないとレスポンスに affiliateUrl が入らず、
//   リンクが通常URL扱いになって報酬が一切発生しない。
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '';
const SITE_URL = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { keyword = '', genreId = '', page = 1 } = req.query;

    const params = new URLSearchParams({
        format: 'json',
        keyword,
        applicationId: RAKUTEN_APP_ID,
        accessKey: RAKUTEN_ACCESS_KEY,
        hits: 20,
        page,
        imageFlag: 1,
    });
    if (genreId) params.append('genreId', genreId);
    if (RAKUTEN_AFFILIATE_ID) params.append('affiliateId', RAKUTEN_AFFILIATE_ID);

    const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?${params}`;

    try {
        const rakutenRes = await fetch(url, {
            headers: {
                'Referer': SITE_URL + '/',
                'Origin': SITE_URL,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': 'application/json',
            },
        });

        const text = await rakutenRes.text();

        if (!rakutenRes.ok) {
            return res.status(rakutenRes.status).json({ error: text });
        }

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        // アフィリエイトID未設定は「報酬ゼロ」の状態なのでレスポンスヘッダで警告を出す
        if (!RAKUTEN_AFFILIATE_ID) {
            res.setHeader('X-Affiliate-Warning', 'RAKUTEN_AFFILIATE_ID is not set; links earn no commission');
        }
        return res.status(200).send(text);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
