// Vercel Serverless API Route - proxies requests to Rakuten openapi
// Adds required Referer/Origin headers that Rakuten openapi requires

// 認証情報は環境変数を優先（Vercel の Environment Variables に設定してください）。
// 未設定の場合のみ従来のハードコード値にフォールバックします。
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || 'ec65ace1-9e87-4d23-83e4-b54103335b56';
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || 'pk_thp8WuFagFNOQh9VnsoWHJ8mAQhhRsHt4NWvW4wUA4q';
const SITE_URL = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

// 💰 これが収益の生命線。
// affiliateId を送らないと楽天APIは affiliateUrl / affiliateRate を返さず、
// 商品リンクは全て非アフィリエイトの素のURLになり成果は1円も発生しません。
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '';

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
    // affiliateId を付けると各 Item に affiliateUrl と affiliateRate(実料率) が入って返る
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
        // アフィリエイトIDが未設定なら、フロント側が気付けるようヘッダで通知する
        res.setHeader('X-Rakuten-Affiliate', RAKUTEN_AFFILIATE_ID ? 'on' : 'off');
        return res.status(200).send(text);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
