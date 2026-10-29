# Vivlica 実ブラウザQA

このリポジトリの `.github/workflows/browser-design-qa.yml` は Playwright の Chromium を使用し、本番ドメインに変更を加えずにローカルのViteプレビューを監査します。

## ページ範囲
`/`, `/compare/`, `/sim/`, `/hikari/`, `/card/`, `/hoken/`, `/life/`, `/tools/`, `/travel/`, `/travel/hotels/` と公開ガイド6ページ。375px、768px、1440pxのそれぞれでHTTP応答、表示見出し、横方向のページはみ出し、JavaScript例外を検査します。商品価格・ホテルの実APIが無いローカル環境でも成立する検査です。

## 実操作
スマホ料金の年間差額試算、ITツールの予算・候補追加、格安SIMの条件選択、旅行先（京都）の切替、型番検索の結果導線を実際にクリックします。

## 生成物
`artifacts/browser-qa/report.json` にページ別の幅・例外・見出しを記録し、主要画面のPC・スマホ画像を保存します。GitHub Actionsの `vivlica-browser-qa` アーティファクトを確認してください。画像比較は人間による確認が必要です。

## ローカル実行例
```sh
npm ci
npm install --no-save --no-package-lock playwright@1.64.1
npx playwright install chromium
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
# 別のターミナルから
node scripts/browser-qa.mjs
```

このQAワークフローが「成功」したことをGitHubの実際の実行結果で確認するまで、本番公開の品質保証は行いません。Impeccableの静的検出0件とブラウザ上の品質は別です。価格の更新、ASPの承認、実績収益もこの検査の対象外です。
