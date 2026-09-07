// Vercel Serverless API Route - proxies requests to Rakuten Ichiba Item Search
// Adds required Referer/Origin headers that Rakuten openapi requires

// --- 認証情報 ---------------------------------------------------------------
// いずれも環境変数を優先。未設定時は下記の既定値にフォールバックします。
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || 'a4bab65a-01f3-4a12-becc-728ead3fa3e7';
const SITE_URL = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

// 💰 収益の生命線。affiliateId を送らないと楽天APIは affiliateUrl / affiliateRate を
// 返さず、商品リンクは全て非アフィリエイトの素のURLになり成果が1円も発生しません。
// このIDはアフィリエイトリンクのURLに現れる公開値のため既定値として保持します。
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '432a9f67.243910f6.432a9f68.e28a199a';

// ⚠️ accessKey はシークレットのためソースに埋め込みません。
// 未設定の場合は applicationId だけで通る app.rakuten.co.jp を使用します。
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || '';

// accessKey が要る新ゲートウェイと、applicationId だけで通る従来エンドポイント
const OPENAPI_ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601';
const LEGACY_ENDPOINT = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

function buildParams({ keyword, genreId, page, withAccessKey }) {
    const params = new URLSearchParams({
        format: 'json',
        keyword,
        applicationId: RAKUTEN_APP_ID,
        hits: 20,
        page,
        imageFlag: 1,
    });
    if (genreId) params.append('genreId', genreId);
    if (RAKUTEN_AFFILIATE_ID) params.append('affiliateId', RAKUTEN_AFFILIATE_ID);
    if (withAccessKey && RAKUTEN_ACCESS_KEY) params.append('accessKey', RAKUTEN_ACCESS_KEY);
    return params;
}

function fetchRakuten(url) {
    return fetch(url, {
        headers: {
            'Referer': SITE_URL + '/',
            'Origin': SITE_URL,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            'Accept': 'application/json',
        },
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { keyword = '', genreId = '', page = 1 } = req.query;
    const opts = { keyword, genreId, page };

    // accessKey があれば新ゲートウェイを試し、認証で弾かれたら従来エンドポイントへ退避する。
    // accessKey が無ければ最初から従来エンドポイントを使う。
    const attempts = RAKUTEN_ACCESS_KEY
        ? [
            { name: 'openapi', url: `${OPENAPI_ENDPOINT}?${buildParams({ ...opts, withAccessKey: true })}` },
            { name: 'legacy', url: `${LEGACY_ENDPOINT}?${buildParams({ ...opts, withAccessKey: false })}` },
        ]
        : [
            { name: 'legacy', url: `${LEGACY_ENDPOINT}?${buildParams({ ...opts, withAccessKey: false })}` },
        ];

    let lastStatus = 500;
    let lastBody = 'no attempt executed';

    for (const attempt of attempts) {
        try {
            const rakutenRes = await fetchRakuten(attempt.url);
            const text = await rakutenRes.text();

            if (rakutenRes.ok) {
                res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
                res.setHeader('X-Rakuten-Endpoint', attempt.name);
                // アフィリエイトIDが効いているかフロント/運用側から確認できるようにする
                res.setHeader('X-Rakuten-Affiliate', RAKUTEN_AFFILIATE_ID ? 'on' : 'off');
                return res.status(200).send(text);
            }

            lastStatus = rakutenRes.status;
            lastBody = text;

            // 認証・権限以外のエラー（404やレート制限など）は退避しても直らないので即返す
            if (![401, 403].includes(rakutenRes.status)) break;
        } catch (err) {
            lastStatus = 500;
            lastBody = err.message;
        }
    }

    return res.status(lastStatus).json({ error: lastBody });
}
