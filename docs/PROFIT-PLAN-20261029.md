# 利益化の優先順位 — 2026-10-29（原文で確認した根拠つき）

この文書は、公式ページと測定記事を原文で確認して決めた「次にやること」の順番です。
ASPの管理画面・Vercelの契約・Search Console のデータは見ていません。報酬額は各公式ページの掲載額で、変更されることがあります。
クリック数や掲載リンク数は利益ではありません。利益＝同じ期間の確定報酬−実費です。

## 本番の実測（2026-10-29）

| 項目 | 結果 |
|---|---|
| https://vivlica.com | 200。公開中の版は main（4ab5621）と一致 |
| 初期HTMLの成果リンク | トップ12件（楽天4・Amazon4・Yahoo4）、旅行6件（楽天3・A8 3）。`/tools/` `/sim/` `/hikari/` `/card/` は0件 |
| 楽天の商品API | 403（許可サイトの設定。`docs/RAKUTEN-PRODUCTION-CONNECTION.md`） |
| 旧 https://hikaku-labo.vercel.app | 404 `DEPLOYMENT_NOT_FOUND`（Vercel のドメイン設定から外れている） |

## 1. 審査待ちなしで今日できる高単価案件（運営者の作業・最優先）

既存の楽天アフィリエイトのアカウントで申し込める案件です。サイトのコードは対応済みで、環境変数を1つ入れて再デプロイするだけで `/sim/`・楽天モバイルを含む比較ページ8本・`/card/` に「PR」付きで表示されます（ダミーURLでビルドして確認済み）。

| 案件 | 報酬（公式の掲載） | 条件の要点 | 設定先 | 原文 |
|---|---|---|---|---|
| 楽天モバイル | 1件 7,000円 | Rakuten最強プランの申込後90日以内に利用開始。データタイプ・端末のみ購入は対象外。参加は全員が認められるとは限らない | `VITE_AFF_URL_RAKUTEN_MOBILE` | https://affiliate.rakuten.co.jp/group/mobile/ ・ https://network.mobile.rakuten.co.jp/tips/affiliate-program/ |
| 楽天カード | 1件 1,500円 | カード発行時のみ。楽天カード専用リンク経由のみ（プレミアムは別リンク）。キャンペーンページ経由・紹介者ID経由は対象外 | `VITE_AFF_URL_RAKUTEN_CARD` | https://affiliate.rakuten.co.jp/card/ |
| 楽天トラベル | 料率 1.0% | 旅行ページで既存IDのリンクを掲載済み | 設定済み | https://affiliate.rakuten.co.jp/group/ |

手順:
1. 楽天アフィリエイトの「サイト情報」に `https://vivlica.com` を登録（リンク作成の前提。https://affiliate.rakuten.co.jp/guides/link/ ）
2. 楽天モバイル・楽天カードのページで「テキスト」のリンクを作成し、URL部分（`https://hb.afl.rakuten.co.jp/...`）を Vercel の Production 環境変数に設定して再デプロイ
3. `npm run audit:activation` で、先頭の `rakuten_group_quick_wins` が消え、`affiliate_url_rejected` が出ていないことを確認

リンクはコードで組み立てていません。管理画面の専用リンク以外は成果対象外になりうるためです。

## 2. ホスティングの規約（赤字・停止のリスク）

Vercel 公式の Fair Use Guidelines は「Hobby teams are restricted to non-commercial personal use only」とし、商用の例に「Affiliate linking is the primary purpose of the site」と広告掲載を挙げています（https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage ）。Pro は月額 $20 からです（https://vercel.com/pricing ）。

- 契約が Pro 以上なら問題なし。`VIVLICA_HOSTING_COMMERCIAL_OK=true` でチェックリストから消せます
- Hobby なら、準備済みの Cloudflare Workers Free への移行（`docs/CLOUDFLARE-ONE-TIME.md`）が月額0円の選択肢です。Cloudflare の規約に、無料プランを非商用に限る記述は探した範囲では見つかりませんでした（https://www.cloudflare.com/terms/ ）。Workers Free のリクエスト上限は1日100,000件です（https://developers.cloudflare.com/workers/platform/pricing/ ）

少ない報酬のうちは月額 $20 がそのまま赤字になりうるため、報酬が出る前に決めておく価値があります。

## 3. 旧ドメインの404

`hikaku-labo.vercel.app` は A8.net や楽天に登録されていた可能性があるURLです。Vercel のプロジェクト設定（Domains）に `hikaku-labo.vercel.app` を戻し、`vivlica.com` への転送にすると、古いリンクやブックマークからの訪問を失いません。

## 4. 検索流入について原文が示すこと

- Ahrefs の測定では、新しく公開されたページのうち1年以内に上位10位に入ったのは 1.74%（別の抽出方法では 6.11%）。上位に入ったページの 40.82% は1か月以内に入っている（https://ahrefs.com/blog/how-long-does-it-take-to-rank/ ）。検索だけで早く利益を出すのは難しく、上の1・2のように「すでにある訪問を報酬に変える」作業の優先度が高い理由です
- Google のスパムポリシーは、商品説明を写しただけで付加価値のないアフィリエイトを「Thin affiliation」とし、良い例として価格情報・比較・カテゴリの案内を挙げています。付加価値なしにページを大量生成することは「Scaled content abuse」です（https://developers.google.com/search/docs/essentials/spam-policies ）。比較ページを増やすときは、公式料金から計算した差額のような固有の情報がある組み合わせに限ります

## 5. ほかの確認事項

- Amazonアソシエイト: サインアップから180日以内に3件以上の適格販売がないと審査に進めず、却下後の再審査はできません（https://affiliate.amazon.co.jp/help/node/topic/G8TW5AE9XL2VX9VM ）。現在のタグ（kuronekosanta-22）のアカウントが有効かをアソシエイト管理画面で確認してください
- 楽天の支払いは1円から楽天ペイ残高。月3,001円を超える分の受け取りには楽天カードか楽天銀行のID連携が必要です（https://affiliate.rakuten.co.jp/guides/rank/ ）
