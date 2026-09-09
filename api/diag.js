// 楽天API接続の診断用エンドポイント。/api/diag をブラウザで開くと使う。
// 本番で「なぜ商品が取れないのか」を切り分けるためのもの。
// シークレット(accessKey)そのものは絶対に返さず、設定の有無と長さだけを返す。

import { detectPlatform, OPENAPI_ENDPOINT } from './rakutenCredentials.js';

const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || 'a4bab65a-01f3-4a12-becc-728ead3fa3e7';
const RAKUTEN_AFFILIATE_ID = process.env.RAKUTEN_AFFILIATE_ID || '432a9f67.243910f6.432a9f68.e28a199a';
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://hikaku-labo.vercel.app';

// 秘密情報を出さずに設定状況だけ示す
function mask(value) {
    if (!value) return { set: false };
    return { set: true, length: value.length, head: value.slice(0, 4) + '…' };
}

// 楽天は登録済みサイトURLからのリクエストかを Referer で検証する (HTTP_REFERRER_NOT_ALLOWED)。
// どのヘッダーの組み合わせなら通るのかは実際に叩かないと分からないため、
// 候補を順に試して結果を並べる。
async function probe(label, url, headers) {
    const started = Date.now();
    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json', ...headers } });
        const text = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(text); } catch { /* JSONでない場合は生テキストを見る */ }

        const first = parsed?.Items?.[0]?.Item ?? parsed?.Items?.[0] ?? null;

        return {
            variant: label,
            sentReferer: headers.Referer ?? '(送信なし)',
            sentOrigin: headers.Origin ?? '(送信なし)',
            httpStatus: res.status,
            ok: res.ok,
            elapsedMs: Date.now() - started,
            itemCount: parsed?.Items?.length ?? 0,
            // 収益に直結する確認項目: affiliateUrl が返っているか
            affiliateUrlReturned: Boolean(first?.affiliateUrl),
            sampleAffiliateUrl: first?.affiliateUrl ? first.affiliateUrl.slice(0, 60) + '…' : null,
            sampleItemName: first?.itemName ?? null,
            rakutenError: res.ok ? null : (parsed?.errors?.errorMessage ?? text.slice(0, 200)),
        };
    } catch (err) {
        return { variant: label, ok: false, elapsedMs: Date.now() - started, fetchError: err.message };
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
                affiliateId: mask(RAKUTEN_AFFILIATE_ID),
                accessKey: mask(RAKUTEN_ACCESS_KEY),
                siteUrl: SITE_URL,
            },
            runtime: {
                vercelEnv: process.env.VERCEL_ENV ?? '(不明)',
                branch: process.env.VERCEL_GIT_COMMIT_REF ?? '(不明)',
                commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || '(不明)',
            },
            probes: [],
            verdict: `❌ 設定の不整合により楽天APIを呼び出せません。\n${detected.reason}`,
        });
    }

    const url = `${OPENAPI_ENDPOINT}?${withKey}`;
    const selfUrl = `https://${req.headers.host}`;

    // 判明したこと:
    //   Origin あり -> HTTP_REFERRER_NOT_ALLOWED (値を見て拒否)
    //   Origin なし -> REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING (存在しない扱い)
    // つまり楽天は Referer ではなく Origin をリファラとして読んでいる。
    // 登録URLは末尾スラッシュ付きのため、その差異を中心に総当たりする。
    const variants = [
        ['Origin=末尾スラッシュあり', { Origin: SITE_URL + '/', Referer: SITE_URL + '/' }],
        ['Origin=末尾スラッシュあり (Refererなし)', { Origin: SITE_URL + '/' }],
        ['Origin=末尾スラッシュなし (Refererなし)', { Origin: SITE_URL }],
        ['Origin/Referer ともに末尾スラッシュなし', { Origin: SITE_URL, Referer: SITE_URL }],
        ['Origin=このデプロイ自身', { Origin: selfUrl, Referer: selfUrl + '/' }],
        ['Origin=末尾スラッシュあり + UA', {
            Origin: SITE_URL + '/',
            Referer: SITE_URL + '/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        }],
    ];

    const probes = [];
    for (const [label, headers] of variants) {
        const result = await probe(label, url, headers);
        probes.push(result);
        if (result.ok) break; // 通ったらそれ以上試さない
    }

    const working = probes.find(p => p.ok);

    return res.status(200).json({
        checkedAt: new Date().toISOString(),
        config: {
            applicationId: mask(RAKUTEN_APP_ID),
            affiliateId: mask(RAKUTEN_AFFILIATE_ID),
            accessKey: mask(RAKUTEN_ACCESS_KEY),
            siteUrl: SITE_URL,
        },
        // 環境変数がどのVercel環境に紐づいているかの切り分け用
        runtime: {
            vercelEnv: process.env.VERCEL_ENV ?? '(不明)',
            branch: process.env.VERCEL_GIT_COMMIT_REF ?? '(不明)',
            commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || '(不明)',
        },
        probes,
        deployedAs: `https://${req.headers.host}`,
        verdict: !working
            ? '❌ どの組み合わせでも失敗。probes の rakutenError を確認してください。'
            + ' HTTP_REFERRER_NOT_ALLOWED が並ぶ場合は、楽天アプリ登録のサイトURLと送信Refererが一致していません。'
            : working.affiliateUrlReturned
                ? `✅ 商品取得・アフィリエイト計測ともに正常です。有効だった組み合わせ: 「${working.variant}」`
                : '⚠️ 商品は取得できますが affiliateUrl が返っていません。affiliateId がアフィリエイト未承認か、IDの形式が誤っている可能性があります（この状態では成果は発生しません）。',
    });
}
