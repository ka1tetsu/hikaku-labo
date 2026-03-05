// Vercel Serverless API Route - proxies requests to Rakuten openapi
// This runs server-side, fixing the CORS issue

const RAKUTEN_APP_ID = 'ec65ace1-9e87-4d23-83e4-b54103335b56';
const RAKUTEN_ACCESS_KEY = 'pk_thp8WuFagFNOQh9VnsoWHJ8mAQhhRsHt4NWvW4wUA4q';

export default async function handler(req, res) {
    // Allow CORS from our own frontend
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

    try {
        const rakutenRes = await fetch(
            `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?${params}`
        );

        if (!rakutenRes.ok) {
            const errText = await rakutenRes.text();
            return res.status(rakutenRes.status).json({ error: errText });
        }

        const data = await rakutenRes.json();
        // Cache the response for 5 minutes to save API quota
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
