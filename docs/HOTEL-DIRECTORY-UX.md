# Vivlica Travel 宿泊施設ディレクトリ・UI/UX

更新 2026-10-29

## 採用したUX原則

Booking.comの詳細絞り込み（口コミ、宿タイプ、料金、設備、キャンセル条件）、楽天トラベルの料金/評価順・地図・食事/温泉絞り込み、じゃらん等で一般的な施設カードと予約導線を調査。ただし既存サービスの画像・コード・CSS・文章をコピーせず、体験の考え方を独自実装。

- 初期表示を楽天が返した初泊価格の安い順にする
- 施設写真・名称・初泊参考額・口コミ・朝食の有無・詳細リンクを同じカードに表示
- エリア・チェックイン/アウト・人数、取得後の料金上限・口コミ・朝食・名前/プラン文字列のフィルタ
- カード/一覧表切替、同画面で最大3件の施設を比較
- 検索1〜100ページを楽天APIに問い合わせ、1ページ最大30施設を閲覧。これより多くの全登録ホテルを取得したことを意味しない
- 施設IDから写真・アクセス・設備・口コミ評価・キャンセル情報の共通詳細ページを表示
- A8 Yahoo!トラベルの原文広告（バナー234/300）を他のホテル検索画面・施設詳細にも表示（登録済みと運営者が申告した正規ドメインのみ）
- 予約サイトの紹介料ではなく、実額・口コミとユーザーが選んだ条件だけを表示順位に使う

## 根拠として参照した公式資料

- https://travel.faq.rakuten.net/detail/000041315
- https://travel.rakuten.co.jp/howto/domestic.html
- https://developers.booking.com/demand/docs/accommodations/filter-sorting
- https://developers.booking.com/demand/docs/accommodations/search-for-available-properties
- https://webservice.rakuten.co.jp/documentation/hotel-detail-search
- https://www.a8.net/compliance/prohibited-matter.php
- https://support.a8.net/a8/as/faq/2004/08/post_41.html

## 宿泊施設ページの限界と拡張

現在のURLは /travel/hotels/?id=12345 のような楽天施設番号です。共通テンプレートなので**実在のホテルだけを都度公式APIで照会**します。RAKUTEN_ACCESS_KEY が本番のサーバー環境変数にない場合、情報は読み込めません。ブラウザからAPI秘密鍵は読めません。

重要：数万〜数百万のホテルの名前・写真・住所・レビュー等を無断収集/コピーして静的ページにすることはしません。世界中の施設を網羅するには、楽天だけでなくBooking.comやExpedia等の正式なパートナー契約、施設ID統合、データ保持や画像再掲載の権利、更新頻度に沿う運用が必要です。現時点の施設詳細ページはデータをクライアントから読み込むため、重複・空のページがGoogleに大量にインデックスされないよう **noindex** にしています。正規の施設データをSSR/SSGでき、個別ページを検索エンジンに出してよい権利が確認できれば、ページ単位でURLとsitemapを生成します。

楽天のHotelDetailSearchでは施設番号、施設名・所在地・画像・口コミ・設備などの取得が可能。表示されるhotelMinChargeは公式API上『1室1泊の税・サービス料込み最安値の目安』で、チェックインを指定した予約最終額ではありません。検索一覧のfirstNightTotalも『初泊だけの料金』で、全泊料金ではありません。

## 運用上の条件

- `RAKUTEN_ACCESS_KEY` を Vercel Production のサーバー環境に登録。公開VITE_環境変数やGitHubに保存しない。
- ユーザー申告の媒体登録に基づき、`travelAffiliateEnabled({})` は正規サイト `https://vivlica.com` で true。明示的な旧媒体ドメインの環境変数が残っているとブロックされるので確認。
- Yahoo!トラベル広告コードを原文から変更せず利用。商品リンクや目的ホテルを特定する深いリンクには改造しない。
- 施設別の最新料金比較を自動化するには予約サイト複数社の同日・同人数・同室条件の正規APIアクセスが必要。取得できないデータは『最安値』と呼ばない。

