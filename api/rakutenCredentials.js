// 楽天市場APIの認証設定を検証する。
//
// 従来版の市場API (app.rakuten.co.jp/services/api/IchibaItem/...) は
// 2026-02-09 に廃止された。現在有効なのは openapi.rakuten.co.jp のみで、
// 認証には Rakuten Web Service で発行される次の2つが必要:
//
//   Application ID : UUID形式
//   Access Key     : pk_ で始まる文字列（シークレット。ソースに埋め込まない）
//
// 発行元: https://webservice.rakuten.co.jp/app/list

export const OPENAPI_ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEGACY_ID_RE = /^\d{17,20}$/;

const APP_LIST_URL = 'https://webservice.rakuten.co.jp/app/list';

export function detectPlatform(applicationId, accessKey) {
    const base = { endpoint: OPENAPI_ENDPOINT, usesAccessKey: true };

    if (LEGACY_ID_RE.test(applicationId)) {
        return {
            ...base,
            platform: 'legacy-shutdown',
            ok: false,
            reason:
                `RAKUTEN_APP_ID が19桁の数字（従来版のアプリID）です。` +
                `従来版の楽天市場APIは2026-02-09に廃止されており、このIDでは接続できません。` +
                `${APP_LIST_URL} で発行される UUID 形式の Application ID を使用してください。`,
        };
    }

    if (!UUID_RE.test(applicationId)) {
        return {
            ...base,
            platform: 'unknown',
            ok: false,
            reason:
                `RAKUTEN_APP_ID が UUID 形式ではありません。` +
                `${APP_LIST_URL} の Application ID をそのまま設定してください。`,
        };
    }

    if (!accessKey) {
        return {
            ...base,
            platform: 'rakuten-webservice',
            ok: false,
            reason:
                `RAKUTEN_ACCESS_KEY が未設定です。楽天市場APIは Application ID と Access Key の両方を要求します。` +
                `${APP_LIST_URL} の Access Key（pk_ で始まる文字列）を、Vercel の ` +
                `Settings → Environment Variables に RAKUTEN_ACCESS_KEY として追加してください。` +
                `シークレットのためソースには含めていません。`,
        };
    }

    return { ...base, platform: 'rakuten-webservice', ok: true };
}
