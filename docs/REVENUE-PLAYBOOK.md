# 比較ラボ 収益改善プレイブック

コード側で実施した改善と、**サイト運営者が管理画面で行う必要がある作業**をまとめます。
報酬は各ASPの管理画面で確定成果を確認するまで「発生した」とは扱いません。

## 0. 最優先：楽天APIが本番で止まっている（2026-10-16 確認）

本番の `/api/diag` は、affiliateId の有無に関係なくすべての組み合わせで
`403 HTTP_REFERRER_NOT_ALLOWED` を返しています。サーバーは Referer / Origin に
`https://hikaku-labo.vercel.app` を送っているため、**楽天側のアプリ設定で許可されていない**のが原因です。
この状態ではトップ・カテゴリページに商品が1件も表示されません（＝楽天市場からの成果がほぼ出ない）。

1. https://webservice.rakuten.co.jp/app/list で、Vercel の `RAKUTEN_APP_ID` と同じ Application ID のアプリを開く
2. アプリ種別が「Webアプリケーション」であることを確認する（「API/Backend service」はIP許可方式で、送信元IPが固定されないVercelには向きません）
3. 「許可されたWebサイト」に `https://hikaku-labo.vercel.app` を登録する（スキーム付き・末尾スラッシュなし。ワイルドカード不可）。登録済みなら `hikaku-labo.vercel.app` 表記も試す
4. 独自ドメインを使う場合は、そのドメインも追加し、Vercel の `SITE_URL` を同じ値にする
5. `/api/diag` を開き、verdict が ✅ になり `affiliateUrlReturned: true` であることを確認する

> この修正までの間も、商品データが取れないときは各モールの検索結果への計測付きリンク
> （楽天・Amazon・Yahoo!ショッピング）を表示するようにしたため、訪問が無駄になりません。

## 1. コードで実施した改善（このブランチ）

| 種類 | 内容 | 期待効果 |
|---|---|---|
| 収益漏れ | トップの「主要モール」バーの楽天リンクが素の検索URLで成果対象外だった → 楽天アフィリエイト経由に | クリックが成果対象になる |
| 収益漏れ | カテゴリの楽天ジャンルIDが無関係（パソコン=マウンテンバイク、カメラ=食品、ゲーム=鉄板 等）→ 正しいIDに修正 | カテゴリから商品が出るようになる |
| 収益漏れ | API障害時・0件時にエラー表示で離脱 → 3モールへの計測付き導線を表示。サイドバーも同様 | 障害時の訪問も収益化 |
| 成約率 | Amazon/Yahoo の検索語が「【送料無料】Apple」等になっていた → 販促文言を除いた商品名で検索 | 送客先で目的の商品が見つかる |
| 新収益源 | 旅行ページに、選択エリアの都道府県ごとの楽天トラベル（楽天アフィリエイト）リンク | Yahoo!トラベルのバナー1種だけだった導線を追加 |
| 集客(SEO) | 全ページを静的HTMLとして事前描画（従来は空の `<div id="root">` のみ） | 検索エンジンが本文・見出し・リンクを読める |
| 集客(SEO) | 商品カテゴリ別ページ `/category/<slug>/`（8ページ）を追加。固有のtitle/description/選び方ガイド | 「〇〇 価格比較」等の検索で入口が増える |
| 集客(SEO) | `sitemap.xml` / `robots.txt` / 構造化データ（WebSite検索、パンくず、FAQ）/ OGP | インデックス促進・SNS共有時の表示 |
| 集客 | 検索・カテゴリ状態をURLに反映（共有・ブックマーク・戻るボタン対応） | 再訪・共有 |
| コスト | 未使用の OpenAI 呼び出しAPI（`/api/article`, `/api/reviewSummary`）を削除。誰でもPOSTでき、`OPENAI_API_KEY` 設定時は第三者に課金を発生させられた | 不正利用による費用発生の防止 |
| コスト | `/api/search` の `Access-Control-Allow-Origin: *` を削除し入力を正規化、CDNキャッシュを延長。`/api/diag` もキャッシュ | 楽天APIのレート枠を他者に消費されない・表示高速化 |
| 品質 | ダミーのレビュー要約や「価格.comクローン」記事の量産スクリプトを削除 | 検索エンジンのスパム評価・景表法リスクの回避 |
| 計測 | 商品・旅行・ITツールの外部リンククリックを「ページ／枠／送客先」単位で記録 | どの導線が効いているか判断できる |

## 2. 運営者の作業（優先順）

1. **楽天アプリの許可サイト設定**（上記0）。
2. **Google Search Console** にサイトを登録し、`https://hikaku-labo.vercel.app/sitemap.xml` を送信。Bing Webmaster Tools にも登録（Search Console からインポート可）。
3. **各ASPのサイト登録を確認**：
   - Amazonアソシエイト：アカウントの「Webサイトとモバイルアプリ」に本サイトURLが登録されているか。未登録URLからの紹介は規約違反になり得ます。
   - バリューコマース（Yahoo!ショッピング）：サイトが登録・提携済みか。
   - 楽天アフィリエイト：楽天トラベルも同じIDで成果対象になります。
4. **ITツール診断の収益化**：現在、提携リンクが1件もありません（`npm run test:all` 後に `node scripts/audit-affiliate.mjs` で確認可）。A8.net 等でレンタルサーバー・EC構築サービスの提携を申請し、承認後に管理画面の「通常広告用」HTMLを改変せず `src/tools/a8Placements.js` に貼り付けてください（手順は `docs/AFFILIATE-TOOLS.md`）。
5. **Yahoo!トラベルのテキスト広告**：A8.net でテキストリンク素材も発行できる場合、バナーより文脈に合わせやすいので追加を検討（コードは改変せず貼り付け）。
6. **独自ドメインの検討**：`*.vercel.app` より独自ドメインのほうがASP審査や検索評価で有利な場合があります。取得したら Vercel に設定し、`SITE_URL` と楽天アプリの許可サイトを更新、`scripts/prerender.mjs` は `SITE_URL` を使ってsitemap・canonicalを出力します（Vercelのビルド環境変数に設定）。

## 3. 効果の測り方

- Vercel → Logs で `"type":"outbound"` を検索すると、`section`（products/travel/tools）・`placement`（card-cta, fallback, mall-bar, ranking, category-guide, result, cta など）・`target`（rakuten, amazon, yahoo, rakuten-travel, a8-yahoo-travel）別のクリックが分かります。個人情報・検索語は記録していません。
- Search Console：カテゴリページ（`/category/…`）の表示回数・クリック数・掲載順位。
- 各ASP管理画面：クリック数とログの差、発生・確定成果。

## 4. 次にやると効く施策（未実装）

- カテゴリページに、実際に調べた比較記事（スペック表・選び方）を人が書いて追加する。LLMによる大量生成はGoogleのスパムポリシーに抵触し得るため避ける。
- サブカテゴリ（例：ノイズキャンセリングイヤホン、ゲーミングノートPC）のページ追加。`src/shared/productCategories.js` に定義を足すと、ページ・sitemapが自動生成されます（楽天ジャンルIDは www.rakuten.co.jp/category/<id>/ で必ず確認）。
- 楽天APIが復旧したら、ビルド時に各カテゴリの上位商品を取得して静的HTMLにも載せる（現状は本文と選び方のみ静的、商品はブラウザで取得）。
