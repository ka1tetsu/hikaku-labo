# 本番デプロイ自動復旧（2026年11月以降）

ユーザーの希望: **Actions/Vercelの無料枠制限が解除されたら追加操作なしに最新のmainをvivlica.comで公開する。**

## 復旧フロー
- デプロイの再試行は **11月1日以降**、日本時間午前9:17に指定日のみ。**10月中は絶対に自動リトライしない**。
- GitHub Actions scheduleが動いたら `https://vivlica.com/release.json` を確認し、`origin`・`schemaVersion`・コミットSHAが正しいことを検証。GitHubの最新mainと一致していれば何もしない。
- 正しいドメインであることが検証でき、main SHAが古い場合だけ**空コミットを1つ追加**し、Vercelの既存GitHub連携で再ビルドを試行する。空コミットは内容を変更せず、前回のCIを通過したソースを再公開するためのもの。GitHub Actionsの予約投稿自体はVercelの無制限ビルドを保証しない。
- 各試行の後、公開された`release.json`が**新しい空コミットを含むmainのSHA**と一致することを待って確認する。
- レスポンスが不明、リダイレクト、対象外ドメイン、同時更新の場合は安全に停止。強制pushや機密資格情報の出力は禁止。
- 11月以降も実行枠が戻らない・GitHub Actionsが無効・GITHUB_TOKENの書込禁止・Vercel Git連携切断・Vercelチーム認証が必要な状況では**自動復旧は保証できない**。この場合はログに明示し、手作業が必要な可能性が残る。
- 既存デプロイのVercelチームに対するこちらの接続権限の403は、**GitHubからVercelの既存Git連携を利用するこのフローの障害とは別**。ただし必要なGit連携自体が解除されていた場合は動かない。

## 実行枠の節約
- 起動間隔は月8回、毎回実サイトの公開済みSHAを先に確認。
- `npm ci` と `npm build` はこのジョブでは実行せず、Vercelでの本番ビルドと公開照合だけを行う。
- **公開済みなら0回ビルド**。古い場合だけ最大1回の再試行。
- 本番監査（`.github/workflows/production-affiliate-audit.yml`）やブラウザQAは別ワークフローで実施。再試行の空コミットはGitHubの`GITHUB_TOKEN`でプッシュされ、GitHub標準の再帰防止により他の`push`ワークフローを自動起動させないことがある。公開検証はこのリトライジョブ内でも実施する。

## 事前検証
`node --test tests/release-recovery.test.mjs`

## 最新UIのレビュー
過去のブラウザQA画像は[GitHub Actionsアーティファクト](https://github.com/ka1tetsu/hikaku-labo/actions/runs/40834042185)にも残してある。最新画面の検証済み画像と、実際にVercel上に公開されていることは別。
## 再デプロイの安全ゲート（追補）
- 2026年11月以降の再試行前に、**最新mainのpushコミットに対する3つの成功済みGitHub Actions**をGitHub APIで確認する。
- 必須: `Tools selector CI`、`Impeccable sitewide design gate`、`Vivlica real-browser design QA`。別SHAのPRだけ成功していても不可。
- `Production and affiliate readiness audit`は旧サイトでSHAがずれている間、失敗し得るため公開前ゲートから除外。公開後はリリースSHA一致を必須とする。
- GitHub APIの検証が不能・権限不足・テスト未完了・失敗の場合は**デプロイを開始しない**。

## 公開が完了したときのスクリーンショット
- 最新の`release.json`が新しいmain SHAと一致したときだけ、匿名のPlaywright Chromiumでホーム、商品価格比較、ITツール比較、旅行比較の**計8画面（デスクトップ＋モバイル）**を撮影する。
- `/api/track`への計測リクエストを止め、広告・アフィリエイトのリンクをクリックしない。
- 全画面がHTTP 200で指定ドメイン内に残り、最後の再照合でも同じSHAであった場合に限って、GitHub Actionsの`vivlica-verified-live-pages`アーティファクトへ画像と`report.json`を保存する（30日保存）。
- ジョブ結果のURLから本人がページを確認できる。**スクリーンショットは実サイトの確認資料であり、本番デプロイ自体は別途SHA照合で判断する。**
- 公開成功の通知には、最新GitHub Actionsの実行URL・確認コミット・8枚のアーティファクト案内を添える。
