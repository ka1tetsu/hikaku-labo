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


## 2026年10月31日追記 — 新API JSON形式と403の切り分け
- 楽天 `/ichibams/api/IchibaItem/Search/20260701` のJSON応答は **小文字の `items`**。既定 `formatVersion=1` は `items[].item`、指定 `formatVersion=2` は `items[]` の商品オブジェクト。旧APIの `Items[].Item` と混同しない。新旧互換パーサー `src/shared/rakutenPayload.js` を導入し、`api/search.js` は公式仕様の `formatVersion=2` を指定。`api/compare.js` とブラウザー検索側でも共通パーサーを使用。未知のJSON形式を0件扱いにしない。
- Vercel Productionに `RAKUTEN_ACCESS_KEY` は**登録されている**。しかし登録済みというだけでは有効性、アプリIDとの組合せ、楽天の利用許可・サイト登録の適合性は確定しない。2026-10-31本番監査では `/api/search` が **HTTP403**、Yahooは正常、`/api/compare` のYahooは30件。楽天価格の正常取得は未確認。
- 運営者が https://webservice.rakuten.co.jp/app/list にログインして、**Application IDのUUID** と **Access Key（秘密）** の対応を確認する。Vercelの `RAKUTEN_APP_ID`（設定すればコードの既定値より優先）、`RAKUTEN_ACCESS_KEY`、`SITE_URL` と楽天の登録済みWebサイトを照合。許可のないアプリのIDや他人のキーを使わない。
- `/api/diag` は受動的な設定確認のみ。実APIテストは `OPERATIONS_TOKEN` をVercelで事前設定した運営者だけが `GET /api/diag?probe=1` をBearerで実行する。診断結果は `site_registration_rejected`、`authentication_or_permission_rejected`、`rate_limit`、`response_format_unsupported` 等の匿名化された分類を返す。外部のページやチャットにキー、レスポンス本文、署名付きリクエストURLを貼らない。
- 本番の商品ページは楽天が失敗してもYahoo結果を表示し、失敗したモールを正直に表示する。利用者に「全店比較した」と断定しない。

参考： https://webservice.rakuten.co.jp/documentation/ichiba-item-search
