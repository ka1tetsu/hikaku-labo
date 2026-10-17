# 通信・お金の比較（/life/ /sim/ /hikari/ /card/ /hoken/）

- データ：`src/services/catalog.js`（確認日 `CHECKED_AT`、各サービスの公式URL・出典）。食い違う情報は `price: null` にして「公式で確認」と表示し、推測で埋めない。
- 順位：`src/services/score.js`。入力条件との適合度のみで計算し、広告の有無・報酬額は使わない。
- 保険：特定の保険商品の比較・推奨はしない（保険業法上の「募集」に当たるおそれ）。無料相談サービスを五十音順で紹介するのみ。

## 収益化（ASP承認後）

承認された計測URL（https、ASPのドメイン）を `VITE_AFF_URL_<ID>` に設定すると、そのサービスのリンクが「PR」表示の広告リンクに切り替わる。未設定・不正な値は公式URLのまま。

| 例 | 環境変数 |
|---|---|
| IIJmio | `VITE_AFF_URL_IIJMIO` |
| 楽天モバイル | `VITE_AFF_URL_RAKUTEN_MOBILE` |
| ドコモ光 | `VITE_AFF_URL_DOCOMO_HIKARI` |
| 楽天カード | `VITE_AFF_URL_RAKUTEN_CARD` |

ID は catalog の `id` を大文字にし、記号を `_` にしたもの。許可するASPのドメイン：A8.net、バリューコマース、もしも、アクセストレード、リンクシェア、felmat、afb、レントラックス、Presco。

## 毎月の更新

1. 各社の公式料金ページで料金・条件を確認し、catalog を更新。
2. `CHECKED_AT` を更新。
3. `npm run test:all` で整合性を確認。
