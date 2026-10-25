# vivlica.comへ追加費用を抑えて統合する

**自動化版を追加しました。** 以下は選択肢の比較資料です。[最初のGitHub接続と公開](CLOUDFLARE-ONE-TIME.md)では、Workers向けAPIアダプター・Custom Domain・www転送・ビルドを用意済みです。従来の手動API移植は不要になりました。アカウント接続・本番公開・秘密値の移行は別途確認が必要です。

確認日：2026-10-25。ここでの「無料」は追加のDNS・TLS・ホスティング料金を指します。取得済みの`.com`の更新料まで永続的に0円になるものではありません。登録業者の移管や新しいドメインの購入は必要ありません。

## 公開DNSの実測

Google Public DNSのHTTPS APIで確認しました。

| 対象 | 結果 |
| --- | --- |
| `vivlica.com` NS | `carrera.ns.cloudflare.com` と `nash.ns.cloudflare.com` |
| `vivlica.com` A | NOERRORだが回答なし |
| `vivlica.com` AAAA | NOERRORだが回答なし |
| `www.vivlica.com` A・CNAME | NXDOMAIN |
| `vivlica.com` CAA | 回答なし |

ドメインのDNSはCloudflareへ委任されていますが、Web接続先が設定されていません。現在の阻害要因は、サイトをもう一つ作ることではなく、公開先を決めてドメインを関連付け、DNSを設定することです。この環境からのHTTPS接続はプロキシのCONNECT段階で失敗しているため、vivlica.comのHTTP・証明書が正常だとは判定していません。

DNSは変更され得ます。設定直前に管理画面の最新レコードと所有権を確認してください。公開DNSだけでは、そのCloudflareアカウントを操作できる権限は得られません。

## 推奨の分岐

| 方法 | 追加月額 | 今の機能との相性 | 判断 |
| --- | --- | --- | --- |
| すでに契約しているVercel Pro／Enterpriseに独自ドメインを追加 | 通常はドメイン接続の追加契約不要。既存プラン料金・利用量課金は残る | Viteと`api/`をそのまま利用 | 既存契約が商用対応なら最短 |
| Vercel Hobbyを商用アフィリエイトのまま使い続ける | 料金だけなら0円でも、公式の商用利用条件に合わない | 技術的に表示できても推奨できない | 無料案には含めない |
| Cloudflare Pages Freeに静的部分を公開 | 無料枠内でホスティング・独自ドメイン・TLSは0円 | 診断・計算・旅行提案・検索リンク・記事は動く。VercelのAPIは自動移植されない | ホスティング月額0円を優先する場合の候補 |
| Cloudflare Pages Functions／Workers FreeへAPIも移植 | 無料枠内で0円 | API・計測を含められるが実装と接続検証が必要 | 全機能を保ちたい場合の後続工程 |

Vercel公式のHobby説明は「non-commercial, personal use only」。[商用利用の定義](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)には、アフィリエイトを主目的とするサイトと広告掲載が明記されています。現在の契約プラン・請求額にはアクセスしていないため、Hobbyだと断定したり、勝手にProへ課金変更したりはしていません。

## A：既存のVercel商用契約に追加する最短手順

1. [既存プロジェクトのDomains](https://vercel.com/ka1tetsus-projects/hikaku-labo/settings/domains)で`vivlica.com`と`www.vivlica.com`を追加する。同じプロジェクトを使用し、別プロジェクトやサーバーは契約しない。
2. Vercelが**そのプロジェクトに表示した正確なA／CNAMEと、必要なら所有確認TXT**をCloudflare DNSに設定する。古い記事の固定IPやCNAMEを推測して入れない。最初はDNS onlyでVercelの検証・証明書発行を確認する。既存のMX・SPF・DKIMなどメール用レコードは維持する。
3. ドメインの検証完了後、両ホストのHTTPSと主要ページを確認する。この段階では旧ドメインの転送をまだ強制しない。
4. 楽天APIと各ASPに新ドメインを登録する。Yahoo!トラベルの新媒体条件が確認できるまでは、既存A8素材を新ドメインで有効化しない。
5. Vercelの本番環境変数に`SITE_ORIGIN=https://vivlica.com`、`SITE_URL=https://vivlica.com`を設定し再デプロイする。新ドメインの掲載条件を確認済みの場合だけ`VITE_A8_TRAVEL_REGISTERED_ORIGIN=https://vivlica.com`を設定する。今回、`vercel.json`が`SITE_ORIGIN`を旧ドメインへ強制上書きする制約を解消し、未設定時だけ旧ドメインを使うようにした。
6. 新ホストでcanonical・OGP・構造化データ・robots・サイトマップ・APIを検証し、旧ホストとwwwから新ホストへパスとクエリを保つ恒久転送を設定する。旧ホストへのアクセスで旧版HTMLが先に配信されないことも確認する。
7. Search Consoleで所有権確認、新サイトマップの送信、利用できる場合は旧プロパティからアドレス変更を行う。GitHub Actionsの公開監査先も新ホストへ変更する。

ここまでなら、既存の商用プランを利用する場合、移行目的の新しい月額サービスは不要です。Vercel Pro自体の料金は0円にはなりません。

## B：ホスティング月額0円を優先するCloudflare案

### 使える無料枠

Cloudflare公式資料で確認したPages Freeの枠は月500ビルド、独自ドメイン100個／プロジェクト、静的ファイル20,000個、1ファイル25 MiBです。Functionsを呼ばない静的配信は無料・回数無制限とされています。現在のビルドは63ページを含む112ファイル、最大ファイル約165 KBなので、静的部分はこの枠内です。

動的なPages Functions／Workers Freeは合算で1日100,000リクエスト、CPU時間10 ms／実行という別枠です。静的ページ全部をFunctions経由にすると無料枠を消費するため、動的呼び出しを必要な`/api/*`に限定します。上限を超えない保証ではなく、Free枠を監視して運用する案です。

### 設定する内容

1. 既存のCloudflareアカウントでWorkers & PagesからPagesプロジェクトを作成し、`ka1tetsu/hikaku-labo`のGitHub連携を許可する。PagesのGit連携を使う場合はGit連携方式で作り、Direct Uploadと混同しない。
2. ルートはリポジトリ直下、ビルドは`npm run build`、出力は`dist`。`next-app`は指定しない。Node.jsは22を指定する。
3. ビルド環境変数を`SITE_ORIGIN=https://vivlica.com`にする。既存の承認済み公開広告設定がある場合のみ同じ値を安全に移す。APIキーを`VITE_`へ移さない。
4. 初回の`<プロジェクト>.pages.dev`で静的表示・診断・旅行・記事・ショップリンクを検証する。Vercelの`vercel.json`によるヘッダー・転送はCloudflareには自動反映されない。必要な設定をPagesの`_headers`・`_redirects`等へ移し、キャッシュ・転送ループを確認する。
5. Pagesの**Custom domains**から`vivlica.com`を追加する。DNSはすでにCloudflareなので、同じアカウントのゾーンに関連付ける。Pagesが作成・指定する正確なCNAMEを使う。先にDNSだけを手作業で`pages.dev`へ向けない。公式資料は、この関連付けを省くと522になる場合があると説明している。
6. `www.vivlica.com`も追加し、ホスト条件付きのCloudflare Redirect Ruleでルートの`https://vivlica.com`へパス・クエリを保って301または308転送する。HTTP→HTTPSも確認する。TLS証明書はCloudflareの発行を待って検証する。
7. 新媒体のASP登録、サイトマップ・正規URL・Search Console、API移植後の実機検査を終えてから旧サイトの転送・停止を判断する。

### APIは別途移植が必要

このリポジトリはVercel用の`req, res`形式で、`process.env`・`Buffer`・`node:crypto`等を使っています。Cloudflareに`dist`だけを置いても、以下は動きません。

| API | 必要な対応 |
| --- | --- |
| `/api/track` | Worker／Pages Functionsの`Request`と`Response`へ変換。匿名項目・512バイト上限・同一オリジン検査を維持。ログの継続保存方法も確認 |
| `/api/search`・`/api/compare` | `env`から秘密値を参照し、承認済みの楽天／Yahoo公式APIを呼ぶ。許可サイト、タイムアウト、正常時キャッシュ、拒否時の短時間停止を維持 |
| `/api/diag` | 受動検査を基本とし、秘密値を返さない。外部プローブの管理者認証を移植 |
| `/api/flight-prices` | 商用データ利用の許可と接続がある場合のみ移植。未接続を最安値として表示しない |
| `/api/article`・`/api/reviewSummary` | 通常利用に不要な有料機能。無料化の初期移行では有効化せず、管理者認証・費用上限を維持する |

静的部分だけ先に移す場合、商品価格の取得とサーバー側の計測は利用できません。APIが止まっていても、今回追加した検索リンク、ブラウザ内の診断・計算・旅行提案は使えますが、「全機能を無料で移植済み」とは呼べません。今のVercel APIをそのまま無料の商用バックエンドとして残す案も、Hobbyの利用条件の問題を解消しません。

旧`hikaku-labo.vercel.app`の転送はVercel側でしか制御できません。他社の設定でそのサブドメインを取得・転送することはできないため、旧ホストの移行期間の扱いは既存契約条件も確認します。

## 公開を切り替える前の確認

- `/`・`/travel/`・`/compare/`・`/life/`・`/tools/`・記事をスマートフォンでも開ける。
- 両ホストのDNS・証明書・HTTPSを確認し、www／旧ホストの転送がパス・クエリを保つ。
- 新ホストでcanonical・robots・サイトマップがすべて新ホストを指す。
- APIと匿名イベントを実際に検証し、価格APIの503をHTTP 200のページ表示と混同しない。
- 広告掲載条件・所有IDを確認する。計測確認のために自分で広告を連打しない。
- 未接続の新ホストへ転送を先行させず、障害時は旧ホストへ戻せる状態を残す。

今回、新ドメイン指定のローカルビルドと63ページの生成物検証は成功しています。Cloudflare／Vercelのアカウント操作、DNS変更、課金プラン変更、新ドメインの本番公開は実施していません。

## 一次資料

2026-10-25にVercel公式とCloudflare公式ドキュメント／公式GitHub原稿を確認しました。料金・上限・管理画面は変更され得るため、実際の申込画面でも確認します。

- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Vercelの商用利用条件](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)
- [Vercelへの独自ドメイン追加](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Cloudflare Pagesの制限](https://developers.cloudflare.com/pages/platform/limits/)
- [Cloudflare Pages Functionsの料金](https://developers.cloudflare.com/pages/functions/pricing/)
- [Cloudflare Workersの料金](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Pagesの独自ドメイン](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [公開DNSの確認例](https://dns.google/resolve?name=vivlica.com&type=A)
