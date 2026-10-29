# 最初の接続だけで、以降の公開を自動化する

Cloudflare向けのAPI移植・ビルド・独自ドメイン・www転送設定をリポジトリへ用意しました。従来の比較手順にあるDNS・証明書・API変換を、個別に実装し直す必要はありません。

## 本人の承認が必要な最初の操作

[Cloudflare](https://dash.cloudflare.com/)へ、vivlica.comのDNSを管理しているアカウントでログインし、Workers & PagesからGitHubリポジトリを接続します。

| 項目 | 指定する内容 |
| --- | --- |
| リポジトリ | `ka1tetsu/hikaku-labo` |
| 本番ブランチ | `main` |
| Worker名 | `vivlica-hikaku-labo`（設定ファイルと同じ名前） |
| ルート | リポジトリ直下 |
| Build command | 空欄。Wranglerから必要なビルド・検証を実行 |
| Deploy command | `npm run deploy:cloudflare` |

GitHubへのアクセスを許可してDeployを実行します。Workers Freeを使い、有料プランへ切り替える必要はありません。Workers Buildsが通常作成するデプロイ用トークンは画面の管理機能に任せ、トークンをチャットへ送らないでください。

Cloudflareへのログイン・GitHubアプリへの許可は、認証のないこのクラウド環境から代行できません。実際のアカウント接続と本番デプロイは未完了です。

## 設定済みの自動処理

1. Node.js 22で依存関係を準備。
2. `vivlica.com`を正規URLとしてビルドし、63ページのリンク・メタデータを検証。
3. 既存のVercel API処理をWorkers用アダプターで実行。別のAPIを二重管理しない。
4. `vivlica.com`のCustom Domainを作成。CloudflareがDNSとTLS証明書を管理。
5. 小さな別Workerで`www.vivlica.com`を作成し、パス・クエリを保ってルートへ308転送。
6. GitHub接続後はmainへの変更から継続してビルド・公開。

通常の静的配信でアプリWorkerを起動しない設定です。動的な`/api/*`とwww転送はWorkers Freeのリクエスト枠に入ります。課金プランの変更、データベース、メール配信、有料AIの新規有効化は行いません。

同じ名前の既存Workerがある場合は、そのWorkerがこのプロジェクトのものか確認してください。既存CNAMEや別プロジェクトとのドメイン衝突は、無断で削除・上書きする構成にはしていません。

## 外部サービスの接続は維持・確認が必要

移植したAPIは`search`、`compare`、`track`、`diag`、`flight-prices`、管理者用`article`・`reviewSummary`です。

固定費診断・旅行提案・予算計算・記事・ショップ検索リンクはAPIキーなしで使えます。商品価格を取得するには、既存の楽天等の秘密値をCloudflareのWorker Secretsへ安全に移す必要があります。この環境にはその値もVercel管理認証もなく、公開APIから取り出すことはしていません。秘密値をチャットに貼らないでください。

既存の広告は新ドメインの媒体登録・掲載条件を確認します。Yahoo!トラベルのA8素材は、新ドメインの登録確認設定がなければ引き続き表示しません。既存の契約・承認をコードで代替したとは扱いません。

## 検証状況

- Node上でVercel／Workers共通APIと、ボディ上限、匿名計測、Origin制限、クエリ検証をテスト。
- Wranglerの公開なしのdry-runでアプリとwww転送をコンパイル。
- 実際のローカルWorkersランタイムでページ、API、キャッシュヘッダー、www転送を確認。
- API未接続、無効なリクエスト、未設定の有料AIは、成功として偽装せずそれぞれの状態で応答。

ローカルの検証はCloudflareアカウントへの公開や外部API認証の成功を意味しません。本番の`https://vivlica.com/release.json`と主要ページ・APIが確認できるまで、旧サイトの転送や停止は先行しません。旧Vercel側の稼働も維持しています。

## 開発者向けのコマンド

```sh
npm ci
npm run test:all
npm run lint
npm run check:cloudflare  # 公開・DNS変更なし
npm run deploy:cloudflare # Cloudflare認証とゾーンへの権限が必要
```

ファイルシステムが制限されたCodex環境でWranglerを使う場合は、事前に`export XDG_CONFIG_HOME=/workspace/.cloudflare-config`を実行します。Cloudflareアカウントへのログイン情報が、この設定だけで新しく作られることはありません。

根拠：[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Custom DomainsのDNS・TLS自動管理](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)、[Node.js環境変数の互換性](https://developers.cloudflare.com/workers/runtime-apis/nodejs/process/)。
