# 比較ラボトラベル：グローバル検索・価格比較・アフィリエイト運用

更新: 2026-10-17

## 検索 UX と事実の境界線

導入済み:
- 国内18都市と海外60前後の都市情報を使った高速な候補検索。未収録の目的地も自由入力し、公式旅行サイトで探せる。
- 「東京からパリに2人で5泊、直行便、20万円以下、キャンセル無料」のような自然文から明示的な条件のみ抽出。**LLM/AI検索ではない**。原文は送信せずブラウザ内で解析。
- 出発日・帰着日・人数・宿泊数・予算・直行便・受託手荷物・朝食・無料キャンセル・座席クラス・ホテル星級をフォームで指定。外部予約サイトへこれらの条件が自動転送されるわけではない。コピーしてユーザーが再設定できる。
- 航空券・ホテル・アクティビティ・レンタカー・eSIMの主要公式サイトをカテゴリーごとにまとめる（見積・料金横断検索ではない）。
- 原文ままの既存Yahoo!トラベル A8広告2点は変更なし。**公式リンクは成果報酬リンクではない**。新規提携済みリンクが発行された後でのみ \`src/travel/providers.js\` の \`APPROVED_TRAVEL_PARTNER_LINKS\` に挿入。

未導入:
- 旅行サイトの横断的なリアルタイム空室・航空券販売価格、最安値保証、実際のレビュー、全世界都市データ、施設営業時間や交通の可否判定。勝手なWebスクレイピングはせず、各社の契約API経由で実現する。
- 料金順表示は「同等な税込総額が複数の正規データプロバイダーから、十分新しい時点で取得できている」場合にのみ使用。厳格な検証ロジック: \`src/travel/quoteEngine.js\`。比較可能なデータがない場合、**価格情報なし**。
- JPY以外を機械的に円換算して並べたり、ホテルの定員、返金条件、部屋・食事が異なる商品を同一「最安値」としない。

## データ接続の優先順

| 優先 | 提携 / データ事業者 | できること | 導入条件 |
| --- | --- | --- | --- |
| 1 | Trip.com Affiliate | 世界の航空券・ホテル・鉄道・ツアーのアフィリエイト | 個別のアカウント登録・承認、リンク取得 |
| 1 | Travelpayouts / Aviasales | 航空券アフィリエイト＋参考価格API | APIトークン・商用利用の確認、提携プログラム参加 |
| 1 | 楽天トラベル | 国内外の宿泊、航空券・パッケージなど | 楽天公式の成果リンク取得、個別対象外条件を確認 |
| 1 | Viator | 海外の観光体験・ツアー | Affiliate Partner登録、素材取得 |
| 1 | Airalo | 海外通信eSIM | Affiliate Partner登録、素材取得 |
| 2 | GetYourGuide / Klook | 体験・チケット | 各社で提携承認と生成済みリンクを取得 |
| 2 | KAYAK Affiliate Network | 航空券・ホテル・車両の検索ウィジェット、連携 | 提携条件に従って許諾を受ける |
| 3 | Skyscanner Affiliate | 航空券・ホテル・車両 | 平均月間5,000以上のユニーク訪問者等の審査基準 |
| 3 | Booking.com Demand API | 宿泊在庫、宿泊料金、車両など | Booking.com Managed Affiliate契約、トークン、X-Affiliate-Id |
| 3 | Agoda Online Affiliates / MSE | ホテル価格比較API | Agoda提携・審査・認証 |
| 3 | Expedia Rapid | 宿泊・交通・ツアーの公式データ | Expediaパートナー承認、認証等 |

提携はユーザー本人の明示的な作業が必要です。ChatGPT/GitHubは他社のアカウントを勝手に開設したり審査承認を取得できません。

公式案内:
- Trip.com: https://www.trip.com/partners/index
- Travelpayouts: https://support.travelpayouts.com/hc/en-us/articles/203956163-Aviasales-Data-API
- 楽天トラベル: https://travel.rakuten.co.jp/distributor/affiliate.html
- Viator: https://partnerresources.viator.com/
- Airalo: https://partners.airalo.com/solutions/affiliates
- KAYAK: https://affiliates.kayak.com/
- Skyscanner: https://www.partners.skyscanner.net/product/affiliates
- Booking.com: https://developers.booking.com/demand/docs/getting-started/prerequisites
- Agoda: https://developer.pps.agoda.com/docs/getting-started
- Expedia: https://developers.expediagroup.com/rapid/setup

## 参考航空券データ（Optional, not real-time）

- \`/api/flight-prices?origin=TYO&destination=LON&departure=2027-04-02&direct=false\` は3文字IATAコードと日付のみ許可する。
- **初期状態はデータ未接続**。ユーザーが Travelpayouts/Aviasales の商用データ使用許可を取得後、Vercelサーバーの環境変数 \`TRAVELPAYOUTS_API_TOKEN\` を設定する。Viteの \`VITE_\` 変数・GitHubソースや公開Issueに絶対に置かない。
- レスポンスは過去48時間などのユーザー検索キャッシュからの参考片道運賃であり、**料金総額・税込・受託手荷物・席数の保証はない**。現在の価格と誤解させないよう参考扱いだけを表示。
- サーバー側だけで外部 API を呼び、IATA形式検証、期限付きキャッシュ、短いタイムアウト、返答データの最小化を行う。
- 提携元のリンクを勝手に成果リンクへ変換しない。ユーザーが管理画面で作成した正式な成果リンクまたはウィジェットを使う。

## UX の参考

- Google Flights: 柔軟な日程・直行便・荷物・Explore / 価格アラート https://www.google.com/travel/flights/
- Skyscanner: Everywhere、フライト・ホテル・レンタカーを1つのUXで検索 https://www.skyscanner.jp/
- KAYAK: 絞り込み、比較、乗継・航空会社の条件 https://www.kayak.co.jp/
- ユーザー掲示板での繰り返しの悩み: 一度の検索で多数のサイトを行き来しなければならない、表示時点と予約時点で運賃が変わる、予約後対応が重要。https://www.reddit.com/r/TravelNoPics/comments/1soqwlo/does_anyone_else_spend_days_comparing_flight/

UXの考え方のみを参考にし、他社のUIソース、レイアウト資産、画像、口コミ、運賃を無断コピーしない。

## コンプライアンス

- **KAYAKなどの予約サイトを許可なくスクレイピングしない**。KAYAK利用規約はスクレイピング、無許可の深いリンク、競合製品構築のための無断利用を禁止している。https://www.kayak.com/terms-of-use
- 自サイト上ではスポンサーと非スポンサーを明確に分ける。スポンサーの表示順位で推薦を操作しない。
- 海外渡航先のビザ、査証、入国、現地危険情報や健康条件は、個人の国籍・旅券・日付次第なので外務省と渡航先の公的機関で検証する。サイトの定番の立ち寄り候補はルート計算された現実の訪問順ではない。
- 読者の検索キーワード、旅程、氏名、IPや旅費はクリックログに記録しない。サーバーのクリックログは匿名のプロバイダー種別のみ。
- API等のコスト・成果報酬・旅程でのコンバージョンは商用アカウントで検証。利益=確定報酬-必要経費。推定成約を売上として表示しない。

## 次の高優先度実装

1. 旅行・宿泊の正式なパートナーAPIに接続し、料金データの出所・更新時刻・販売時点の全費用を同じ画面で示す。
2. 価格変化通知（ユーザー同意・送信先管理・規約遵守・配信コストの検証が前提）。
3. 世界の地名データベース（ライセンスを遵守した地名提供元）と航空会社/空港辞書の正式導入。
4. 航空券の別切り・LCC手荷物・変更条件・セルフ乗継リスクなど、実際の支払総額に効く情報を条件に追加。
5. 主要な都市に一次情報の営業時間/交通/季節性を加え、コピー・投稿可能な旅行計画の内容を強化。
6. 運営者がA8/Trip.com/Travelpayouts等の成果画面と、検索コンソール、実際の運営費を一元集計するレポート。

本実装は初期版の比較・紹介サイトであり、OTAとして予約成立・決済・キャンセル処理を行うものではありません。
