# Vivlica

商品・通信・IT・旅行を、予算と使い方から比較する React / Vite サイト。
現在の本番URLは `https://hikaku-labo.vercel.app`。移管先は `https://vivlica.com` で、DNS・ドメイン接続確認後に切り替えます。旧「比較ラボ」のパスを維持します。

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

Node.js 22 を使用します。クラウド環境では各シェルで
`export PATH=/workspace/.cloud-tools/node_modules/.bin:$PATH` を実行してください。
Viteはフロントエンド用です。`api/` はVercelのサーバーレス関数として動作します。
APIキーのないローカル環境では商品検索を取得できませんが、料金診断・比較ツール・ショップへの検索リンクは利用できます。

```sh
npm run test:all
npm run lint
npm run build
npm run verify:build
npm run audit:affiliate
```

- 固定費診断: `/life/#savings`（トップページにも設置）
- 比較: `/compare/`、`/sim/`、`/hikari/`、`/card/`、`/tools/`、`/travel/`
- 比較方針: `/editorial-policy/`、`/about/`、`/privacy/`
- 送客集計: `npm run report:revenue -- logs.ndjson`

公開前に [Vivlicaへの統合・収益運用](docs/VIVLICA-LAUNCH.md) を参照してください。

広告URLは `VITE_AFFILIATE_LINKS` のJSONでまとめて設定できます。承認済みの公開成果URLだけを設定してください。
送客レポートの `nextActions` は、通常リンクへの送客、診断結果からの移動、入力した確定報酬と実費に基づいて確認対象を示します。

本番の収益導線とAPIの状態は `npm run audit:live` で確認できます。[実行状況と本人接続が必要な作業](docs/REVENUE-NEXT-ACTIONS.md) に外部設定の確認先をまとめています。
