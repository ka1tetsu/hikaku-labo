# 確定利益を基準に改善先を決める

## 本番確認（2026-11-01 日本時間）

`node scripts/audit-live.mjs --origin https://vivlica.com` で確認。

- トップ・旅行・IT・SIM・光回線・カードとサイトマップは200。
- トップの初期HTMLに成果リンク12件、旅行に8件。ASP側の有効性・売上は未検証。
- IT・SIM・光回線・カードの初期HTMLに成果リンクは0件。条件変更後の掲載まで否定するものではない。
- `/api/search` は403。`/api/compare` は200でYahooがok・楽天がerror、出品30件を取得。サイト全体が価格取得不能という過去の説明は現在には当てはまらない。
- Vercelの最新productionは `5d7c8ac3ff4bb54420f5f56db5a7a1f577904032` でREADY。ログ取得は403で失敗。アクセスゼロ・売上ゼロの証拠ではない。

## 今回の修正

商品検索・価格結果表示・比較候補選択・目標価格保存の4イベントをレポートが無視する不具合を修正。検索後に結果がない場合と、結果はあるが外部ショップ操作がない場合を区別して確認事項を出す。匿名の操作数であり、人単位の離脱率ではない。

`report:revenue` の `--finance` に任意の `merchants` 内訳を追加できる。確定報酬と直接費用が入力された案件のみ、共通費を引く前の差額を集計する。サイト全体の利益は従来どおり確定報酬総額−運営費総額で計算し、費用を二重に引かない。報酬額で利用者向けの比較順位は変更しない。

## 実行方法

Vercelから取得した同期間のログを `logs.local` に、ASPの精算と実費を `finance.local` に保存する。実データはコミットしない。顧客・注文の明細は不要。

以下は入力形式を示す**架空の数値**。本サイトの実績ではない。日本時間10月1日〜11月1日未満を集計する例。

```json
{
  "from": "2026-10-01T00:00:00+09:00",
  "to": "2026-11-01T00:00:00+09:00",
  "confirmedCommission": 5000,
  "operatingCosts": 3000,
  "merchants": [
    { "merchant": "rakuten", "confirmedCommission": 4000, "directCosts": 1000, "aspClicks": 200, "confirmedOrders": 4 },
    { "merchant": "amazon", "confirmedCommission": 0, "directCosts": 1000, "aspClicks": 0 }
  ]
}
```

```sh
npm run report:revenue -- logs.local --from 2026-10-01T00:00:00+09:00 --to 2026-11-01T00:00:00+09:00 --finance finance.local
```

`directCosts` はサイトの `operatingCosts` に含まれる案件別実費。未配賦の費用は `sharedOrUnallocatedCosts` に残る。未分類の報酬は `unallocatedCommission` に残る。分からない案件は省略し、0を代入しない。`aspClicks` と `confirmedOrders` は省略可能。ASP別ではなく紹介先IDで1行に集計し、二重入力を避ける。内訳が総額を超えた入力は拒否する。

精算月とクリック発生月はずれるため `periodCommissionPerAspClick` は期間内の単純比率であり、成約率・クリック起点のEPC・広告入札上限ではない。広告費を増やす判断にそのまま使わない。

## 次の改善順

1. 楽天の登録サイト・拒否理由を管理画面で確認。稼働中のYahoo比較と各ショップ検索導線は使える。
2. IT・通信などは承認済み素材の接続を確認。既存の `VITE_AFFILIATE_LINKS`、A8原文素材の仕組みを使う。公開IDや通常リンクだけから承認・報酬を推測しない。
3. 同期間のログ、Search Consoleの流入、ASPの確定報酬、実費を揃える。ログ取得403はアクセス権の問題として解消し、空データとして分析しない。
4. `nextActions` の結果取得・購入導線・案件費用の順で、実際に観測された問題を修正する。提携候補の優先度は通常リンクへの実際の送客数から判断する。

この修正は収益判断の欠損を埋めるもの。確定報酬・費用が未接続の間、増益額や最も儲かる案件は判定できない。
