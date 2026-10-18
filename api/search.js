// Vercel Serverless API Route - proxies requests to Rakuten Ichiba Item Search
// Adds required Referer/Origin headers that Rakuten openapi requires

import { upstreamResponse } from '../server/upstream.js';
import { detectPlatform, OPENAPI_ENDPOINT } from '../server/rakutenCredentials.js';

// --- 認証情報 ---------------------------------------------------------------
// いずれも環境変数を優先。未設定時は下記の既定値にフォールバックします。
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || '4c29f89d-b874-4910-a38b-1d8e0314c2a3';
const SITE_URL = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

// 💰 収益の生命線。affiliateId を送らないと楽天APIは affiliateUrl / affiliateRate を
// 返さず、商品リンクは全て非アフィリエイトの素のURLになり成果が1円も発生しません。
// このIDはアフィリエイトリンクのURLに現れる公開値のため既定値として保持します。
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '432a9f67.243910f6.432a9f68.e28a199a';

// ⚠️ accessKey はシークレットのためソースに埋め込みません。
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || '';

// Optional narrowing used by the concierge. Only whitelisted, bounded values reach Rakuten.
const SORTS = ['standard', '+itemPrice', '-itemPrice', '-reviewCount', '-reviewAverage'];
export function searchFilters(query = {}) {
    const price = value => {
        const n = Math.floor(Number(value));
        return Number.isFinite(n) && n > 0 && n <= 999999999 ? String(n) : '';
    };
    return {
        minPrice: price(query.minPrice),
        maxPrice: price(query.maxPrice),
        sort: SORTS.includes(query.sort) ? query.sort : '',
        postageFlag: query.postageFlag === '1' ? '1' : '',
    };
}

function buildParams({ keyword, genreId, page, withAccessKey, filters = {} }) {
    const params = new URLSearchParams({
        format: 'json',
        keyword,
        applicationId: RAKUTEN_APP_ID,
        hits: 20,
        page,
        imageFlag: 1,
    });
    if (genreId) params.append('genreId', genreId);
    for (const [key, value] of Object.entries(filters)) if (value && value !== 'standard') params.append(key, value);
    if (RAKUTEN_AFFILIATE_ID) params.append('affiliateId', RAKUTEN_AFFILIATE_ID);
    if (withAccessKey && RAKUTEN_ACCESS_KEY) params.append('accessKey', RAKUTEN_ACCESS_KEY);
    return params;
}

function fetchRakuten(url, timeoutMs) {
    return upstreamResponse(url, {
        timeoutMs,
        headers: {
            'Referer': SITE_URL + '/',
            'Origin': SITE_URL,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            'Accept': 'application/json',
        },
    });
}

// Shared by /api/search and /api/compare. Returns the raw Rakuten response text.
export async function fetchRakutenSearch(opts) {
    const detected = detectPlatform(RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY);
    if (!detected.ok) return { ok: false, status: 500, text: detected.reason, affiliateState: 'off' };
    // affiliateId を付けると楽天アフィリエイト側のサイト登録が照合され、
    // 未登録だと HTTP_REFERRER_NOT_ALLOWED で全体が失敗する。
    // 商品が1件も出ないよりは、成果計測なしでも表示できる方を優先し、
    // 失敗した場合は affiliateId を外して再試行する。
    const paramsWithAffiliate = buildParams({ ...opts, withAccessKey: true });
    const paramsWithout = new URLSearchParams(paramsWithAffiliate);
    paramsWithout.delete('affiliateId');

    const attempts = RAKUTEN_AFFILIATE_ID
        ? [['on', paramsWithAffiliate], ['off', paramsWithout]]
        : [['off', paramsWithout]];

    let lastStatus = 500;
    let lastBody = 'no attempt executed';

    const deadline = Date.now() + 7000;
    for (const [affiliateState, params] of attempts) {
        try {
            const rakutenRes = await fetchRakuten(`${OPENAPI_ENDPOINT}?${params}`, Math.max(1, Math.min(4000, deadline - Date.now())));
            const text = rakutenRes.text;

            if (rakutenRes.ok) return { ok: true, status: 200, text, affiliateState };

            lastStatus = rakutenRes.status;
            lastBody = text;
            // Only an affiliate-specific rejection can improve by removing the
            // affiliate parameter. Do not double traffic on outages or limits.
            if (![400,403].includes(lastStatus) || !/affiliate|HTTP_REFERRER_NOT_ALLOWED/i.test(text)) break;
        } catch (err) {
            lastStatus = 500;
            lastBody = err.name === 'TimeoutError' ? 'provider_timeout' : 'provider_unavailable';
            break;
        }
    }

    return { ok: false, status: lastStatus, text: lastBody, affiliateState: 'off' };
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

    const { keyword = '', genreId = '', page = 1 } = req.query || {};
    if (typeof keyword !== 'string' || keyword.length > 128 || !/^\d{0,12}$/.test(String(genreId)) || !Number.isInteger(Number(page)) || Number(page) < 1 || Number(page) > 100 || (!keyword.trim() && !genreId)) return res.status(400).json({ error: 'invalid_search' });
    const opts = { keyword, genreId, page, filters: searchFilters(req.query) };

    // applicationId の形式から、叩くべきエンドポイントを決める。
    // 形式に合わないエンドポイントを叩いても "specify valid applicationId" になるだけなので、
    // 呼び出す前に設定の不整合を検出して理由を返す。
    const detected = detectPlatform(RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY);

    if (!detected.ok) {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Rakuten-Config', 'invalid');
        return res.status(500).json({
            error: detected.reason,
            platform: detected.platform,
            hint: '/api/diag で現在の設定と楽天からの応答を確認できます。',
        });
    }

    const result = await fetchRakutenSearch(opts);
    if (result.ok) {
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        // 成果計測が効いているかを運用側から確認できるようにする
        res.setHeader('X-Rakuten-Affiliate', result.affiliateState);
        return res.status(200).send(result.text);
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(result.status >= 400 && result.status <= 599 ? result.status : 502).json({ error: 'search_unavailable' });
}
