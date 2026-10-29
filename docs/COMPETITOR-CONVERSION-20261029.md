# 比較サービスUX調査 → Vivlica実装対応（2026-10-29）

対象: 価格.comを含む比較型サービス、トラベルコ、mybest。各社の実売上やCVRは閲覧できないため、「売れている」ことを定量的に証明した比較ではない。サイトに公開されているユーザー体験と独立した研究に基づく。

## 公開一次資料と観測できる特徴

| 参照元 | 公開された仕組み | 今回の移植対象 |
|---|---|---|
| トラベルコ（https://www.tour.ne.jp/j_hotel/list/） | 同条件の合計料金・食事・返金可否・更新時刻・予約先リンクを分けて提示 | 宿泊条件を入力後、API結果待ちなしで予約サイト検索に進める。価格未取得は明示 |
| mybest ポリシー（https://my-best.com/content_policy） | 選び方・選定手法・ランキングの種類を開示 | 手入力の比較とAPI由来を分離し、価格差の計算式・未確認項目を明示 |
| Baymard Institute（https://baymard.com/research-articles/current-state-product-list-and-filtering） | 絞り込み・ソート・適用条件の把握が重要 | 手入力の候補を現金支払額標準でソート、ポイントは明示的な代替 |
| Google Search Central（https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews） | 原創的な比較・用途別の理由、複数購入先が有用 | 既存の複数ショップ検索リンクと計算機を接続する独自の付加価値 |

## 実装したこと

1. /compare/ に、自分が3ショップの購入画面で確認した同じ商品（型番・容量・新品中古）の価格と送料・即時割引・後日ポイントを比較する無料ツールを追加。
2. 「送料未入力を0円扱いしない」「現金支払額とポイント考慮後の参考額を混ぜない」「2つ以上・同商品確認まで比較結果を断定しない」「最安は手入力候補限定」を厳守。
3. /travel/ の楽天検索APIの不調時でも地名・日付・人数を入力すれば、条件を渡せる既存予約検索先へ進めるよう改善。連携できない条件は各サイトで再確認。
4. レポートの操作回数は既存の匿名スキーマ（product_manual_ready、outboundのmanual-research/manual-result）だけで記録。利用者が入力した価格、商品名、行先、日付、個人情報は送信しない。
5. 無断の広告HTML書き換え・レビュー捏造・実売上の推計なし。参考サイトのブランド／視覚表現はコピーせず独自コードで実装。

## KPIと検証順

- 商品: compareページ閲覧 → 手入力比較完了回数（product_manual_ready） → 各ショップ検索（manual-research） → 手入力後の送客（manual-result）。同一人が複数回操作しうるため人ベースのCVRではない。
- 旅行: /travel/ 閲覧 → 日程を入力して直接検索リンクのクリック（stay-quick） → ASPの確定報酬。
- GSCから流入ページ・クエリ別クリックを入手し、運用側で週次比較する。
- A8/Rakuten/その他ASPの確定成果は本人の実レポートでのみ照合する。収益増加と検索順位の向上は未確認。
- 未解決: 商品検索/比較の403・楽天接続拒否・旅行APIの実稼働、Vercelログ403、提携先承認。この新UIはAPIの拒否自体を修正しない。

## 検証
npm test (test:all), npm run lint, npm run build, npm run verify:build, browser-design QA and impeccable gate。公開はCI成功後に行う。
