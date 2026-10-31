# Vercel デプロイ枠の保護 — 2026-10-31

## 観測した障害
2026-10-31、Vercel Hobby project `hikaku-labo` への GitHub 連携と明示 API deploy が `402 payment_required` / `api-deployments-free-per-day` で拒否された。Vercel公式上限は Hobbyで24時間あたり100 deployment。**コード・テストの成功と、本番反映の成功は別の事実として報告する**。

## このPRで変更
`vercel.json` の `git.deploymentEnabled` を minimatch で以下に設定。
- `"**": false`: 細かな開発コミットからの自動プレビューデプロイを抑止
- `"main": true`: 既存の production branch からの自動公開を維持
- `"preview/**": true`: チームが明示的に作成したプレビュー用ブランチは公開可能

Vercelは複数パターンに一致した場合、いずれかが `true` ならデプロイする（公式 Git Configuration）。GitHub Actions の単体テスト、Vite build、Chromium実ブラウザQAはこの設定とは無関係に実行する。今後は開発PRを複数回コミットで編集してもその度に Vercel deployment枠を消費しなくなる。ただしVercelのGit連携でこの設定が認識されることと、クォータ回復後の本番検証は必要。

## 公開運用
1. GitHub PR上で unit tests / lint / build / design gate / Chromium QA が全成功したコミットだけ `main` に統合する。
2. 統合後、Vercel `production` deployment が `READY` であり、`meta.githubCommitSha` がmainに一致し、`vivlica.com` のaliasがあるかを確認する。成功するまで未公開と扱う。
3. `402 api-deployments-free-per-day` の場合、無意味な大量再試行は行わない。24時間程度の制限を待ち、既存 `production-auto-recovery.yml` の本人承認済み安全ガードで再公開を試す。手動で実施する場合も quota・料金はユーザーが決める。
4. 広告付きの商用サイトにVercel Hobbyプランを継続使用する場合、公式規約が非商用限定であることに注意。アカウントの実際の契約を確認し、適切なProプランまたは商用利用可能な基盤を検討。契約・課金は自動操作しない。

Official: https://vercel.com/docs/project-configuration/git-configuration
Limits: https://vercel.com/docs/limits
Hobby terms: https://vercel.com/docs/plans/hobby
