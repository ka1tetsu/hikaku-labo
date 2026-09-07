// 楽天には認証方式の異なる2つのAPI基盤があり、applicationId の形式で見分けられる。
//
//   従来（楽天ウェブサービス / webservice.rakuten.co.jp で発行）
//     applicationId: 19桁前後の数字   accessKey: 不要
//     endpoint: app.rakuten.co.jp
//
//   新（Rakuten Developers で発行）
//     applicationId: UUID形式         accessKey: 必須 (pk_ で始まる)
//     endpoint: openapi.rakuten.co.jp
//
// 形式に合わないエンドポイントを叩くと
// {"error":"wrong_parameter","error_description":"specify valid applicationId"} が返る。

export const OPENAPI_ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601';
export const LEGACY_ENDPOINT = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEGACY_ID_RE = /^\d{17,20}$/;

export function detectPlatform(applicationId, accessKey) {
    if (UUID_RE.test(applicationId)) {
        return accessKey
            ? {
                platform: 'developers',
                endpoint: OPENAPI_ENDPOINT,
                usesAccessKey: true,
                ok: true,
            }
            : {
                platform: 'developers',
                endpoint: OPENAPI_ENDPOINT,
                usesAccessKey: true,
                ok: false,
                // accessKey が無いと新基盤は通らず、従来基盤はUUIDを受け付けない。
                // 退避先が存在しないので、無駄な通信をせず理由を返す。
                reason:
                    'applicationId が UUID 形式（Rakuten Developers 発行）ですが、RAKUTEN_ACCESS_KEY が未設定です。' +
                    'この組み合わせでは楽天APIを呼び出せません。' +
                    'Rakuten Developers で発行した accessKey (pk_ で始まる文字列) を環境変数 RAKUTEN_ACCESS_KEY に設定するか、' +
                    '楽天ウェブサービス (webservice.rakuten.co.jp) で19桁の applicationId を発行して RAKUTEN_APP_ID に設定してください。',
            };
    }

    if (LEGACY_ID_RE.test(applicationId)) {
        return {
            platform: 'webservice',
            endpoint: LEGACY_ENDPOINT,
            usesAccessKey: false,
            ok: true,
        };
    }

    return {
        platform: 'unknown',
        endpoint: LEGACY_ENDPOINT,
        usesAccessKey: Boolean(accessKey),
        ok: false,
        reason:
            'applicationId が既知のどちらの形式にも一致しません。' +
            '楽天ウェブサービスなら19桁の数字、Rakuten Developers なら UUID 形式である必要があります。',
    };
}
