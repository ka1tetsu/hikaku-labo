// 楽天API接続の診断用エンドポイント。/api/diag をブラウザで開くと使う。
// 本番で「なぜ商品が取れないのか」を切り分けるためのもの。
// シークレット(accessKey)そのものは絶対に返さず、設定の有無と長さだけを返す。

import { detectPlatform, LEGACY_ENDPOINT, OPENAPI_ENDPOINT } from './rakutenCredentials.js';

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || 'a4bab65a-01f3-4a12-becc-728ead3fa3e7';
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '432a9f67.243910f6.432a9f68.e28a199a';
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

// 秘密情報を出さずに設定状況だけ示す
function mask(value) {
    if (!value) return { set: false };
    return { set: true, length: value.length, head: value.slice(0, 4) + '…' };
}

async function probe(name, url) {
    const started = Date.now();
    try {
        const res = await fetch(url, {
            headers: {
                'Referer': SITE_URL + '/',
                'Origin': SITE_URL,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': 'application/json',
            },
        });
        const text = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(text); } catch { /* JSONでない場合は生テキストを見る */ }

        const first = parsed?.Items?.[0]?.Item ?? parsed?.Items?.[0] ?? null;

        return {
            endpoint: name,
            httpStatus: res.status,
            ok: res.ok,
            elapsedMs: Date.now() - started,
            itemCount: parsed?.Items?.length ?? 0,
            // 収益に直結する確認項目: affiliateUrl が返っているか
            affiliateUrlReturned: Boolean(first?.affiliateUrl),
            sampleAffiliateUrl: first?.affiliateUrl ? first.affiliateUrl.slice(0, 60) + '…' : null,
            sampleItemName: first?.itemName ?? null,
            // 失敗時は楽天からのエラー本文をそのまま見せる（原因がここに書いてある）
            errorBody: res.ok ? null : text.slice(0, 500),
        };
    } catch (err) {
        return { endpoint: name, ok: false, elapsedMs: Date.now() - started, fetchError: err.message };
    }
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    const base = new URLSearchParams({
        format: 'json',
        keyword: 'イヤホン',
        applicationId: RAKUTEN_APP_ID,
        hits: 1,
        imageFlag: 1,
    });
    if (RAKUTEN_AFFILIATE_ID) base.append('affiliateId', RAKUTEN_AFFILIATE_ID);

    const withKey = new URLSearchParams(base);
    if (RAKUTEN_ACCESS_KEY) withKey.append('accessKey', RAKUTEN_ACCESS_KEY);

    const detected = detectPlatform(RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY);

    // 設定の不整合が確定している場合は、無駄に楽天を叩かず理由だけ返す
    if (!detected.ok) {
        return res.status(200).json({
            checkedAt: new Date().toISOString(),
            config: {
                applicationId: mask(RAKUTEN_APP_ID),
                applicationIdFormat: detected.platform === 'developers' ? 'UUID (Rakuten Developers)' : '不明な形式',
                affiliateId: mask(RAKUTEN_AFFILIATE_ID),
                accessKey: mask(RAKUTEN_ACCESS_KEY),
                siteUrl: SITE_URL,
            },
            probes: [],
            verdict: `❌ 設定の不整合により楽天APIを呼び出せません。\n${detected.reason}`,
        });
    }

    // 形式に合うエンドポイントだけを叩く（合わない方は必ず wrong_parameter になる）
    const probes = detected.usesAccessKey
        ? [await probe('openapi (openapi.rakuten.co.jp)', `${OPENAPI_ENDPOINT}?${withKey}`)]
        : [await probe('legacy (app.rakuten.co.jp)', `${LEGACY_ENDPOINT}?${base}`)];

    const working = probes.find(p => p.ok);

    return res.status(200).json({
        checkedAt: new Date().toISOString(),
        config: {
            applicationId: mask(RAKUTEN_APP_ID),
            affiliateId: mask(RAKUTEN_AFFILIATE_ID),
            accessKey: mask(RAKUTEN_ACCESS_KEY),
            siteUrl: SITE_URL,
        },
        probes,
        verdict: !working
            ? '❌ どのエンドポイントも失敗。上の errorBody に楽天からの理由が入っています。'
            : working.affiliateUrlReturned
                ? '✅ 商品取得・アフィリエイト計測ともに正常です。'
                : '⚠️ 商品は取得できますが affiliateUrl が返っていません。affiliateId がアフィリエイト未承認か、IDの形式が誤っている可能性があります（この状態では成果は発生しません）。',
    });
}
