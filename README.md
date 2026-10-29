# Vivlica

商品・通信・IT・旅行を、予算と使い方から比較する React / Vite サイト。
本番URLは `https://vivlica.com` です。ドメイン登録はムームードメイン、DNSとサイト配信はVercelを使用します。旧「比較ラボ」のパスを維持します。

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

- 宿泊検索: `/travel/#stay-search`（国内・大人1室、日程・人数・朝食・温泉の条件で検索）。[接続と料金表示の範囲](docs/STAY-SEARCH.md)
- 固定費診断: `/life/#savings`（トップページにも設置）
- 比較: `/compare/`、`/sim/`、`/hikari/`、`/card/`、`/tools/`、`/travel/`
- 比較方針: `/editorial-policy/`、`/about/`、`/privacy/`
- 送客集計: `npm run report:revenue -- logs.ndjson`

公開前に [Vivlicaへの統合・収益運用](docs/VIVLICA-LAUNCH.md) を参照してください。

広告URLは `VITE_AFFILIATE_LINKS` のJSONでまとめて設定できます。承認済みの公開成果URLだけを設定してください。
楽天トラベルの施設別HTML素材は `npm run ads:import -- --file 素材.html` で旅行先の判定・掲載設定・クリック計測を自動登録できます。[広告HTMLの自動登録](docs/AD-IMPORT.md)を参照してください。
送客レポートの `nextActions` は、通常リンクへの送客、診断結果からの移動、入力した確定報酬と実費に基づいて確認対象を示します。

本番の収益導線とAPIの状態は `npm run audit:live` で確認できます。[実行状況と本人接続が必要な作業](docs/REVENUE-NEXT-ACTIONS.md) に外部設定の確認先をまとめています。

[収益化の原因分析と改善](docs/MONETIZATION-ANALYSIS.md)に、再現した不具合、修正内容、毎日の自動監査、実績確認が必要な項目をまとめています。`audit:live -- --require-monetization` は、ページが応答していても収益導線に要対応があれば終了コード2を返します。

追加の[短期利益改善と実行内容](docs/IMMEDIATE-PROFIT-PLAN.md)、[vivlica.comへの無料統合手順](docs/VIVLICA-FREE-DOMAIN.md)も参照してください。無料統合はホスティングの利用条件とAPI移植の有無を分けて判断します。

Cloudflare向けのビルド・API互換処理・DNS/TLS自動設定・www転送を用意しました。[最初のGitHub接続と公開](docs/CLOUDFLARE-ONE-TIME.md)後は自動更新できます。`npm run check:cloudflare`で公開せず検証できます。

## AI生成文章とUIの品質

全ページ共通の出典・比較条件・欠落データの表示と、Impeccableを使ったUIデザインの機械検査を導入しました。

```sh
npm run audit:design
```

PRではCIがサイト全体のUIソースを検査し、既存ベースラインと比べて増えた検出数をブロックします。監査JSONはGitHub Actionsから入手できます。文章の方針、限界、エージェント導入は [全サイトのImpeccable監査](docs/IMPECCABLE-SITEWIDE.md)、[PRODUCT.md](PRODUCT.md)、[DESIGN.md](DESIGN.md) を参照してください。未検証のAI記事を大量公開することはせず、草案が必要なら `npm run generate:articles -- --drafts-only` として公開対象外に出力します。
