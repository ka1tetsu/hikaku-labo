# 楽天商品検索APIの本番接続確認

2026-10-29のvivlica.com実監査では、`/api/compare`がHTTP 200でも`sources.rakuten=error`、`sources.yahoo=disabled`だった。

## 修正済み
- `api/search.js`の参照元既定値を旧`https://hikaku-labo.vercel.app`から`https://vivlica.com`へ変更。明示的に設定された`SITE_URL`は維持。
- 必須`RAKUTEN_ACCESS_KEY`を**URLパラメータに入れず**、公式APIが対応する`accessKey`ヘッダーから渡す。リクエストURL・リバースプロキシのURLログに秘密鍵が露出しないようにする。
- 公式2026-07-01 APIエンドポイントとアフィリエイトパラメータは変更しない。
- 検証はネットワーク通信をモックしたNodeテストで行い、実キーを利用しない。

## まだ本番で必要な可能性がある事項
- `RAKUTEN_APP_ID`（UUID）と`RAKUTEN_ACCESS_KEY`（pk_）がVercel **Production**に存在することを確認する。キーはGitHubやチャットに貼らず、Vercel環境変数として追加する。
- 楽天アプリの登録サイトが`vivlica.com`であること。旧サイトとして登録している場合は楽天の管理画面で適切に登録・承認を確認する。
- Vercelに明示的な`SITE_URL`が設定されている場合は`https://vivlica.com`か、登録した正規のURLと一致しているか確認する。
- Yahoo自動取得は`YAHOO_SHOPPING_CLIENT_ID`が未設定の場合`disabled`。正式なAPIクライアントIDを運営者が設定するまでは自動取得できない。
- `/api/diag`は公開で機密を出さない受動的検査。積極的な外部接続試験は`OPERATIONS_TOKEN`がある運営者のみ実行可能。修正だけで本番API復旧を保証しない。

出典: [楽天公式 2026-07-01 商品検索API](https://webservice.rakuten.co.jp/documentation/ichiba-item-search)。
