# vivlica.com の企業データ統合

本番の比較サイトは Vercel、`ka1tetsu/vividatabase` の実行基盤は既存 Cloudflare Worker
`https://vivlica.vivlica.workers.dev`。DNS、Worker名、DB、秘密鍵を変更せず、
Vercel の固定オリジンへの外部 rewrite で公開ページとAPIを同じドメインに接続する。

入口は `https://vivlica.com/database`。既に公開済みの Worker の `/` に接続するため、
企業データ側の新しいリリースを待たずに使える。React/Next のスクリプト・CSS・RSCは
`/_next`、API は既存の比較APIと衝突しない名前のみ中継する。
比較サイト `/`、`/travel/`、`/tools/`、`/compare/` とそのAPIは維持する。

`vividatabase.json` が公開経路の一覧。変更後は `npm run sync:database-routes`、
レビュー時は `npm run sync:database-routes -- --check`。
任意の中継先URLを受け付けるプロキシにはしない。

管理者ログイン・契約管理・会員認証は既存 Worker に307で案内し、OAuthの戻り先、
Cookieのスコープ、StripeのWebhook、署名用の秘密は変更しない。
統合ドメインの無料閲覧と、従来の契約ドメインの会員セッションは別。
有料利用・ログイン後の閲覧は既存 Worker で行う。販売モードも変更しない。

企業データ側の補足変更（`/database`への案内、canonical、APIの使用例）は別リポジトリ。
公開は既存の `Cloudflare launch`。その実行が請求制限で止まる場合でも、
このサイトから既に稼働している版に接続できる。公開版の更新とGitへの保存は別途確認する。

検証: `npm run test:all`、`npm run lint`、`npm run build`、`npm run verify:build`。
公開後は `/database`、`/screener`、`/quant`、`/_next` のJS/CSS、`/api/health`、
未認証の保護API遮断、元の比較・旅行ページと、ブラウザ上の検索・画面遷移を確認する。
決済、申込、メール送信、広告クリックはスモークテストで実行しない。

切り戻す場合は本変更を通常のGit revertで戻してVercelに公開する。
Cloudflare WorkerやDBの削除、DNSの切り替えは不要。
