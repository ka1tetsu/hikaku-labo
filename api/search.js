// Vercel Serverless API Route - proxies requests to Rakuten openapi
// Adds required Referer/Origin headers that Rakuten openapi requires

const RAKUTEN_APP_ID = 'ec65ace1-9e87-4d23-83e4-b54103335b56';
const RAKUTEN_ACCESS_KEY = 'pk_thp8WuFagFNOQh9VnsoWHJ8mAQhhRsHt4NWvW4wUA4q';
const SITE_URL = 'https://hikaku-labo.vercel.app';

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
        return res.status(200).send(text);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
