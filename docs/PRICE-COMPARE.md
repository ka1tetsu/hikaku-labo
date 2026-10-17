# 全ショップ価格比較（/compare/）

## できること

- **実際の価格で比較**：楽天市場（既存の楽天API）と Yahoo!ショッピング（公式 itemSearch v3）から、その時点の販売価格・ポイント・送料条件を取得し、**実質価格（価格 − 付与ポイント）** の安い順に並べます（`api/compare.js`）。
- **同じ商品の判定**：型番（例 `WH-1000XM5`、`NA-LX129CL-W`）または JAN コードが一致する出品を「同じ商品」としてまとめます。一致しないものは「近い商品」として分けて表示します（`src/shared/priceCompare.js`）。
- **ほかのショップ**：API のないショップ（Amazon、au PAY マーケット、Qoo10、ヨドバシ.com、ビックカメラ.com、メルカリ、ラクマ、Yahoo!フリマ、条件付きで Apple Store・iHerb）は、同じキーワードの検索結果へ直接リンクします（`src/shared/merchants.js`）。**価格の自動収集（スクレイピング）はしません**（各サイトの規約違反・ブロックの対象になるため）。
- 入口：各商品カードの「全ショップで価格比較」、トップの比較バー、AIコンシェルジュの商品提案。

## 収益化の状態

| ショップ | 方式 | 状態 |
|---|---|---|
| 楽天市場 | 楽天アフィリエイト（既存ID） | 計測リンク化済み |
| Amazon | アソシエイトタグ（既存） | 計測リンク化済み |
| Yahoo!ショッピング | バリューコマース（既存 sid/pid） | 計測リンク化済み（API結果の商品URLも同じIDで計測） |
| au PAY / Qoo10 / ビックカメラ ほか | 各ASPのディープリンク | 提携承認後に `VITE_AFF_<ID>` を設定すると PR リンクに切替 |
| ヨドバシ.com・メルカリ等 | アフィリエイト制度なし／限定的 | 通常リンク（比較の利便性のため掲載） |

`VITE_AFF_<ID>` には「末尾に遷移先URLをエンコードして連結すると計測される」https の接頭辞（末尾 `=`）を設定します。許可するホストは A8.net・バリューコマース・もしも・アクセストレード・リンクシェア・Impact 等に限定しています（`safeLinkPrefix`）。

| 環境変数 | 内容 |
|---|---|
| `YAHOO_SHOPPING_CLIENT_ID` | **サーバー側**。Yahoo!デベロッパーネットワークで無料発行する Client ID。未設定の間は Yahoo!の価格自動比較は無効（リンクのみ） |
| `YAHOO_VC_SID` / `YAHOO_VC_PID` | 任意。バリューコマースの sid/pid（未設定時は既存値） |
| `VITE_AFF_AU_PAY` `VITE_AFF_QOO10` `VITE_AFF_BICCAMERA` `VITE_AFF_YODOBASHI` `VITE_AFF_APPLE` `VITE_AFF_IHERB` `VITE_AFF_MERCARI` `VITE_AFF_RAKUMA` `VITE_AFF_PAYPAY_FLEAMARKET` | 任意。各ショップのASPディープリンク接頭辞 |

## ショップを増やすには

`src/shared/merchants.js` の `MERCHANTS` に、**実際に開いて確認した検索URL** と `env` 名を1行追加し、`src/shared/outboundSchema.js` の `STORE_MERCHANTS` にIDを足します。価格を自動比較したいショップは、公式APIがある場合のみ `api/compare.js` に取得処理を追加してください。

## 注意

- 価格・在庫・ポイントは取得時点の値です。比較結果は送料を含みません（送料別の出品は表示で明示）。
- 並び順は実質価格のみで決め、報酬額は使いません。
- 承認前のアフィリエイトIDや推測したIDを設定しないでください。
