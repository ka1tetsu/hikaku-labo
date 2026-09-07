// Vercel Serverless API Route - proxies requests to Rakuten Ichiba Item Search
// Adds required Referer/Origin headers that Rakuten openapi requires

import { detectPlatform, OPENAPI_ENDPOINT } from './rakutenCredentials.js';

// --- 認証情報 ---------------------------------------------------------------
// いずれも環境変数を優先。未設定時は下記の既定値にフォールバックします。
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || 'a4bab65a-01f3-4a12-becc-728ead3fa3e7';
const SITE_URL = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

// 💰 収益の生命線。affiliateId を送らないと楽天APIは affiliateUrl / affiliateRate を
// 返さず、商品リンクは全て非アフィリエイトの素のURLになり成果が1円も発生しません。
// このIDはアフィリエイトリンクのURLに現れる公開値のため既定値として保持します。
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '432a9f67.243910f6.432a9f68.e28a199a';

// ⚠️ accessKey はシークレットのためソースに埋め込みません。
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || '';

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

    // applicationId の形式から、叩くべきエンドポイントを決める。
    // 形式に合わないエンドポイントを叩いても "specify valid applicationId" になるだけなので、
    // 呼び出す前に設定の不整合を検出して理由を返す。
    const detected = detectPlatform(RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY);

    if (!detected.ok) {
        res.setHeader('X-Rakuten-Config', 'invalid');
        return res.status(500).json({
            error: detected.reason,
            platform: detected.platform,
            hint: '/api/diag で現在の設定と楽天からの応答を確認できます。',
        });
    }

    const url = `${OPENAPI_ENDPOINT}?${buildParams({ ...opts, withAccessKey: true })}`;

    try {
        const rakutenRes = await fetchRakuten(url);
        const text = await rakutenRes.text();

        if (!rakutenRes.ok) {
            return res.status(rakutenRes.status).json({ error: text });
        }

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        // アフィリエイトIDが効いているかフロント/運用側から確認できるようにする
        res.setHeader('X-Rakuten-Affiliate', RAKUTEN_AFFILIATE_ID ? 'on' : 'off');
        return res.status(200).send(text);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
