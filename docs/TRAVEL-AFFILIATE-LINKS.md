# 比較ラボトラベル：航空券・ホテルのアフィリエイト設定

## 仕組み

- 航空券・ホテルは **API を使わず**、各予約サイトの検索結果ページへのディープリンクを生成します（`src/travel/bookingLinks.js`）。
- 料金・空席・空室は取得・保存・表示しません。比較ラボが表示するのは「同じ条件で各サイトを開くリンク」だけです。
- アフィリエイトIDが設定されたパートナーのリンクだけが「PR」表示・`rel="sponsored"` になります。未設定のパートナーは通常リンクで、報酬は発生しません。
- 並び順は固定（報酬額で並べ替えない）。Google フライト／Google マップは常に非広告リンクです。
- クリックは既存の `/api/track` に `merchant`・`placement`・`sponsored` のみ記録（検索語・URL・個人情報は送らない）。

## パートナーと環境変数（Vercel の Environment Variables → 再デプロイ）

| パートナー | 対象 | 環境変数 | 状態 |
|---|---|---|---|
| 楽天トラベル | 国内宿・海外ホテル・ANA/JALパック・JR+宿・海外航空券 | `VITE_RAKUTEN_AFFILIATE_ID`（既定値あり）、停止は `VITE_RAKUTEN_TRAVEL_DISABLED=true` | 既存の楽天アフィリエイトIDで計測リンク化済み |
| Trip.com | 航空券 | `VITE_TRIPCOM_ALLIANCE_ID` / `VITE_TRIPCOM_SID`（数字） | 提携後に設定 |
| Booking.com | ホテル | `VITE_BOOKING_AID`（数字） | 提携後に設定 |
| スカイスキャナー | 航空券 | `VITE_SKYSCANNER_LINK_PREFIX` | 提携後に設定 |
| エクスペディア | 航空券・ホテル | `VITE_EXPEDIA_LINK_PREFIX` | 提携後に設定 |

`*_LINK_PREFIX` は「末尾に遷移先URL（URLエンコード済み）を連結すると計測される」形式の https URL で、末尾が `=` のものだけ受け付けます。
許可ホスト: `px.a8.net`（`a8ejpredirect=`）、`ck.jp.ap.valuecommerce.com`（`vc_url=`）、`af.moshimo.com`、`h.accesstrade.net`、`click.linksynergy.com`、`tp.media`、`prf.hn`、`*.pxf.io`（Impact の `?u=`）。
不正な値は無視され、通常リンクに戻ります。ディープリンクを許可していないプログラムの素材は使わないでください。

## 本人が確認すること

1. 楽天アフィリエイトで楽天トラベルが成果対象か、サイト登録・規約（リンク形式）を確認する。
2. Trip.com / Booking.com / 各ASP で提携申請し、承認後に発行されたIDだけを設定する。**承認前のIDや推測したIDを設定しない。**
3. 各管理画面でクリック・成果・確定報酬を確認する。サイト側の `outbound` ログは送客の目安で、売上ではありません。
4. 自分でアフィリエイトリンクを繰り返しクリックしない。

## AI旅行コンシェルジュ

`src/travel/concierge.js` はブラウザ内のルールエンジンです。外部 AI API・APIキーは不要で、入力内容はサーバーに送信されません。
運賃・入国条件・空室など、データにない事実は断定せず、公式情報（外務省 海外安全ホームページ等）や予約サイトへ案内します。
予算との相性（◎/○/△）は移動時間と旅費感（1〜5）から出す概算モデルで、金額は表示しません。
