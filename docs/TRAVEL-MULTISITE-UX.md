# Vivlica Travel — 予約サイトを横断して比較するUI
更新：2026-10-30

## 利用者の操作

1. /travel/ の「予約サイトをまとめて比較」から、宿泊・航空券・現地体験・レンタカー・eSIMのカテゴリを選びます。
2. 出発地・目的地・出発/宿泊日・帰着日・人数・部屋数を設定し、各社への条件の引き継ぎを確認します。
3. 機能やサイト名で絞り込み、条件を引き継げるサイトを先に表示。必要に応じて一覧とカードを切り替えます。
4. 最大4社を選んで「検索に引き継ぐ項目」「扱う商材」「料金未取得」という根拠を横並びで比較します。
5. 実際の販売価格は各予約サイトの予約確認画面で照合し、/travel/#travel-total-cost で確認した税・追加料金込みの支払額を比較します。

このUIは、Booking.comの条件フィルター、Skyscannerの複数予約先を選ぶ設計、Google FlightsのBest / Cheapestの比較方法を参考に、独自のUIで実装しています。各社の著作物・デザイン・HTML・写真をコピーするものではありません。

## 正規の検索先

従来の24社に、Trip.comホテル、一休.com、Relux、JTB国内ホテル、Expedia航空券を追加して全29検索先。航空券・宿泊・体験・レンタカー・eSIMのカテゴリごとに分類します。個別のリンクの所在地、商品特性、対応する検索条件の引継ぎが異なります。

参照した公式資料：

- Booking.com Demand API フィルタと並べ替え：https://developers.booking.com/demand/docs/accommodations/filter-sorting
- Google Flights：https://support.google.com/travel/answer/2475306
- Skyscanner：https://www.skyscanner.net/about-us/why-skyscanner
- 一休.com：https://www.ikyu.com/
- Relux：https://rlx.jp/
- JTB：https://www.jtb.co.jp/kokunai-hotel/

## 実装で保証しないこと

- **29の旅行サイトの実販売価格を同時取得しているわけではありません。** 料金APIのライセンス/認証がない予約サイトには「未取得」と表示します。
- 予約サイトURLへのリンクには、公式トップページにしか移動できないものが存在します。予約サイト側で目的地や日程を再入力してください。
- Booking.comとExpediaの一部宿泊検索、Trip.com / Skyscanner / Expedia / Google Flightsの一部航空券検索などは、検証済み条件に限り日付・人数・目的地を引き継ぎます。ログイン状態・現地通貨・手荷物等を含めた最終条件は各社で再確認してください。
- Google FlightsやSkyscannerを含め、ここで紹介したサイトの上位ランキングはサービス品質・ユーザー評判・価格の評価ではなく、検索条件を引き継げるかどうかの優先順です。
- 成果報酬を取得できるのは、運営者が正式に承認された広告リンクと、元の広告素材が有効な場合だけ。収益や最安値を創作しません。
- Yahoo!トラベルのA8広告素材は元HTMLのまま使い、料金取得機能に転用しません。

## 実際のリアルタイム価格比較を行うには

Booking.com Demand API、Expedia Rapid等のパートナー承認と利用契約が必要です。日付・人数・部屋タイプ・食事・取消規定・現地税を正規化した同条件の金額だけを比較してください。アクセス許可・APIキー・課金条件がないままサイトをスクレイピングしません。

## 運用チェック

- `npm run test:all` で29の実在する検索先、URL、条件引継ぎ、広告表示、総額比較との接続、欠損価格の表示を検査。
- `npm run audit:design` でImpeccableの静的パターンを確認。
- Vercelのデプロイ状況と vivlica.com の実画面は別途確認。GitHub mainへの反映だけでは公開済みと断言しません。
