# Yahoo!トラベル A8.net 導入・収益化チェック

## 実装済み

- /travel/ 宿泊・交通・食事・その他の旅行予算シミュレーター（価格APIは利用しない）
- 完全な原文広告HTMLを src/travel/a8TravelAds.js に2件保存
  - 素材ID 035 (234×60), ユーザー提供時EPC 36.13
  - 素材ID 034 (300×250), ユーザー提供時EPC 3.30
- 素材・成果計測の画像ピクセルはコピーされたHTMLから変更しない
- 利用者にPR表記を表示
- 本番で自動的に広告を出すことは**まだありません**。未承認の他サイト掲載を防ぐためデフォルト無効

## 掲載許可の確認後、有効化する

**A8.netメディア会員本人が確認すること：**

1. A8.net「登録情報」→「サイト情報の登録・修正」で **https://hikaku-labo.vercel.app/** を主サイトまたは副サイトとして登録する。
2. Yahoo!トラベルのプログラム詳細を開き、当該掲載先が許可されていること、提携が有効であること、広告の利用条件に問題がないことを確認する。
3. 必要な場合「プログラム管理」→「広告掲載URL管理」で **https://hikaku-labo.vercel.app/travel/** を報告する。
4. Vercel hikaku-labo プロジェクトの Production 環境で次の2つをセットして再デプロイする。
   - VITE_A8_TRAVEL_SITE_REGISTERED=true
   - VITE_A8_TRAVEL_PROGRAM_ALLOWED=true
5. /travel/ に「PR・広告」とバナーが出現することを確認し、クリック先が発行元のA8.netコードであることを確認する。
6. A8.netレポート画面にて、クリック・成果・承認・確定報酬をチェックする。

片方でも未設定なら通常の公式サイトリンクになり、紹介料の発生は期待できません。
VITE_ はViteの**ビルド時公開設定**であり秘密情報には使用しないでください。

**掲載先URLの事前登録について A8.net公式：**
https://support.a8.net/a8/as/faq/2004/08/post_41.html

**アピールサイトと広告主の掲載制限について：**
https://support.a8.net/a8/as/faq/2008/12/post_127.html

**広告URL報告手順：**
https://support.a8.net/a8/as/faq/manual/ad_url_manage.php

**通常広告用について：**
https://support.a8.net/a8/as/faq/2026/post_2971.html

## 売上とアクセスの区別

広告コードを保存しただけでは成約は発生しません。配信・クリックの確認と、A8.net管理画面での承認済み成果は別です。
公開サイトへの正常なHTTP応答があっても報酬があるとは判断しません。
node --test tests/travel.test.mjs で計算機と広告表示ゲートをテストします。

## 原文コード

各広告の原文HTMLは src/travel/a8TravelAds.js に保存しています。A8.net広告素材のHTMLは生成元の仕様を守るため、改変しません。
