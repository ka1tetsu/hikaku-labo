# 商品を探して購入するまでの障害点監査（2026-10-31）

## 購入動線と修正
| 段階 | 発見した障害・誤認リスク | 今回の対処 | 残る制約 |
|---|---|---|---|
| 入口 | 商品の検索結果へ自動スクロール、旅行CTAが見えにくい | PR #50 で修正済 | 流入別CTRは実測が必要 |
| 探索 | 広い語で関連商品やアクセサリーが混ざる | Yahoo公式おすすめ順／型番検索は価格順 | 独自の実機テストや推薦ではない |
| 照合 | 似た商品名が同じ物に見える | 型番・JAN照合候補と類似商品を分離 | カラー・容量・保証・新品/中古は購入先で確認 |
| 価格 | 楽天403、Amazonの公式API認証未接続 | Yahooの実価格を活かし、Amazonは検索先へ。Amazon・楽天・Yahoo三社の比較入口を同時表示 | Amazon価格は自動取得していない。楽天403未解消 |
| 口コミ | 星5.0を1件だけで最上位にする、商品評価と販売店評価の混同 | Yahoo商品APIのreview.rate/count/url、seller.review.rate/countを別枠で表示。15件相当の事前平均3.8を用いた信頼度補正で口コミ順位を決定。Yahooレビューは公式URLで原文へ | Amazonの星やレビュー本文を無許諾で収集・転載しない。他店の集計値とは単純合算しない |
| 送料 | 条件付き送料無料・送料未取得を無料と誤認 | 送料区分・取得元表示・ポイントを分離 | 最終支払総額は各店で確認 |
| Amazon | Amazonの価格が未接続なのに全社比較したように見える | 3ショップ表示で「価格・星評価は未取得」を明示。Amazonで商品を開く→本人確認価格を端末内の比較フォームに入力 | Amazon公式Creators APIの承認/資格/秘密鍵が必要 |
| 最終判断 | 口コミ出典が読めず、広告料で恣意的に推奨 | Yahooレビュー原文へのsource link、口コミ件数加味順位、PR表示、広告料非依存の価格選択 | ASP発生成果・確定報酬は別途確認 |
| 公開 | Vercel Hobbyのdeployment日次枠と商用利用制約 | PR #51でプレビュー制限と安全な復旧設定 | 必要な商用ホスティング/プランと追加API資格は運営者判断 |

## 合法的なレビューの利用
- Yahoo!公式 [商品検索v3](https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html) の `hits[].review.rate` / `hits[].review.count` / `hits[].review.url` を利用する。原文そのものを複製・保存せず、ブラウザで直接元ページを開ける。 `seller.review` は**ショップ評価**であり商品評価ではない。URLは公式Yahooドメイン+HTTPSを検証する。
- 楽天の商品検索APIが復旧したときは公式の `reviewAverage` / `reviewCount` を表示。レビュー原文や存在不明のページURLは捏造しない。
- Amazonアソシエイト規約はAPI外でのAmazon口コミ・星評価の転載を制限。**Creators API**は正式承認済みのAssociatesが所定の条件で利用できる。無断スクレイピング・第三者口コミ複製はしない。
- データの星評価は投稿者の偏り、レビュー施策、サクラ投稿などの問題があり、値だけで品質を保証しない。相互に評価母集団が違うため横断平均しない。

## Amazonの公式データ取得への道筋
- [Creators APIの概要](https://affiliate.amazon.co.jp/creatorsapi/docs/en-us/introduction) と [参加・資格](https://affiliate.amazon.co.jp/creatorsapi/docs/en-us/onboarding/register-for-creators-api) を確認する。
- 商品検索・ASINなどを取得する場合は正式利用契約とアクセス資格が必要で、未承認アカウントや他人のキーでは接続しない。
- [Amazonアソシエイト規約](https://affiliate.amazon.co.jp/help/operating/policies) ではAmazon商品価格の比較表示に特別なルール（新品最低価格・提供される中古最低価格など）がある。API取得後も表示要件・日時・キャッシュ・データ利用目的を事前確認する。仕様と許諾を確認するまでは**Amazonの自動価格行や★行を生成しない**。
- 今日の実装でAmazonは公式検索URL（アフィリエイトリンクである場合はPR明示）と、**ユーザーが任意に確認した価格を端末内で一時的に比較**する機能を提供。Amazonのウェブサイトから自動転記しない。

## 計測すべき実績と次の手当
1. `product_search` → `product_results_ready` → `product_offer_selected` → Amazon検索またはショップ購入先のアウトバウンド送客率。
2. `three-way-amazon`、`three-way-price`、`product-primary` のクリック差分を、実際のASP確定成果と照合。クリックは売上ではない。
3. 楽天403をアプリ管理・APIキー資格・登録サイトで復旧。Yahooの個人用Affiliate IDの所有と提携を確認し、個人の広告料に正しく帰属するか検証。
4. Amazon Creators APIの承認が取れた場合、商用利用許諾の範囲で**Amazonのみの価格取得・有効性表示**を試験実装。掲載条件を法務/規約で確認後に横断比較に加える。
5. 検索結果を用いた口コミ引用で権利侵害をしない。自社レビューを今後募集する場合、景品表示法・ステルスマーケティング告示、偽レビュー検知、投稿者への掲載許諾・個人情報取扱いも別途設計。

