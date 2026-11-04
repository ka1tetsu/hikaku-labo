// 通信・お金のサービス比較データ。
// 料金は 2026-10-17 に公式サイト・公式Q&A・各社発表、または複数の最新記事が一致した値だけを載せる。
// 情報源どうしで食い違う値（例：LINEMOベストプランV、NURO光マンション）は price: null にして
// 「公式で確認」と表示する。推測で埋めないこと。更新時は checkedAt と sourceUrl を必ず更新する。
export const CHECKED_AT = '2026-10-17';
const INF = Number.POSITIVE_INFINITY;

export const SIM_SERVICES = [
  { id: 'ahamo', name: 'ahamo', network: 'docomo', networkLabel: 'ドコモ回線', store: false,
    summary: '30GBと5分かけ放題がセット。手続きはオンライン中心。',
    plans: [{ gb: 30, price: 2970, label: '30GB（5分かけ放題込み）' }, { gb: 110, price: 4950, label: '大盛り 110GB' }],
    calls: '5min', facts: ['5分以内の国内通話無料', 'オンライン専用（店舗サポートは有料）'],
    cautions: ['公式サイトで2026年12月1日の料金改定が告知済み。改定後の料金を確認', '2026年8〜11月は30GB→40GBの増量キャンペーン中'],
    officialUrl: 'https://ahamo.com/', sourceUrl: 'https://ahamo.com/special/lp/001.html' },
  { id: 'povo', name: 'povo2.0', network: 'au', networkLabel: 'au回線', store: false,
    summary: '基本料0円。必要なときにデータや通話を「トッピング」で買う。',
    plans: [{ gb: 3, price: 990, label: '3GB／30日（トッピング）' }, { gb: 20, price: 2700, label: '20GB／30日（トッピング）' }],
    calls: null, facts: ['基本料0円', '5分かけ放題 550円／月、かけ放題 1,650円／月のトッピングあり'],
    cautions: ['180日間有料トッピングの購入がないと利用停止の対象'],
    officialUrl: 'https://povo.jp/', sourceUrl: 'https://povo.jp/spec/' },
  { id: 'linemo', name: 'LINEMO', network: 'softbank', networkLabel: 'ソフトバンク回線', store: false,
    summary: '使った量で料金が決まるベストプラン。LINEのデータ消費がカウントされない。',
    plans: [{ gb: 3, price: 990, label: 'ベストプラン 〜3GB' }, { gb: 10, price: 2090, label: 'ベストプラン 〜10GB' }],
    calls: null, facts: ['LINEギガフリー', '大容量の「ベストプランV」は公式で料金を確認（情報源により記載が異なる）'],
    cautions: ['通話は従量制（22円／30秒）。かけ放題はオプション'],
    officialUrl: 'https://www.linemo.jp/', sourceUrl: 'https://www.linemo.jp/plan/' },
  { id: 'rakuten-mobile', name: '楽天モバイル', network: 'rakuten', networkLabel: '楽天回線', store: true,
    summary: '使った分だけの3段階。20GBを超えるとデータ無制限。',
    plans: [{ gb: 3, price: 1078, label: '〜3GB' }, { gb: 20, price: 2178, label: '〜20GB' }, { gb: INF, price: 3278, label: '20GB超・無制限' }],
    calls: 'app', facts: ['Rakuten Linkアプリで国内通話無料（一部対象外番号あり）', '楽天モバイルショップあり'],
    cautions: ['混雑時などは速度制御の場合あり', '建物内・地方は電波状況を事前に確認'],
    officialUrl: 'https://network.mobile.rakuten.co.jp/', sourceUrl: 'https://network.mobile.rakuten.co.jp/fee/saikyo-plan/' },
  { id: 'iijmio', name: 'IIJmio', network: 'docomo-au', networkLabel: 'ドコモ／au回線', store: false,
    summary: '2GB〜55GBまで細かく選べる老舗の格安SIM。',
    plans: [{ gb: 2, price: 850 }, { gb: 5, price: 950 }, { gb: 10, price: 1400 }, { gb: 15, price: 1600 }, { gb: 25, price: 2000 }, { gb: 35, price: 2400 }, { gb: 45, price: 3300 }, { gb: 55, price: 3900 }],
    calls: null, facts: ['通話は11円／30秒', '契約解除料・MNP転出料なし', '15GBは2026年3月から1,600円に値下げ'],
    cautions: ['通話定額はオプション'],
    officialUrl: 'https://www.iijmio.jp/', sourceUrl: 'https://help.iijmio.jp/answer/602dc1d407f19b0012186e68/' },
  { id: 'mineo', name: 'mineo', network: 'docomo-au-softbank', networkLabel: 'ドコモ／au／ソフトバンク回線', store: true,
    summary: '3社の回線から選べる。余ったデータは翌月に繰り越し。',
    plans: [{ gb: 3, price: 1298 }, { gb: 7, price: 1518 }, { gb: 15, price: 1958 }, { gb: 30, price: 2178 }, { gb: 50, price: 2948 }],
    calls: null, facts: ['音声通話つき（デュアルタイプ）の料金', '余ったデータは翌月繰り越し', '速度を選べる使い放題オプションあり'],
    cautions: ['3日間で10GB以上使うと混雑回避の速度制限あり'],
    officialUrl: 'https://mineo.jp/', sourceUrl: 'https://mineo.jp/price/' },
  { id: 'uq-mobile', name: 'UQモバイル', network: 'au', networkLabel: 'au回線', store: true, homeBundle: ['au'],
    summary: 'auのサブブランド。店舗で相談でき、自宅セット割で安くなる。',
    plans: [{ gb: 5, price: 2948, label: 'トクトクプラン2 〜5GB' }, { gb: 30, price: 4048, label: 'トクトクプラン2 〜30GB' }, { gb: 35, price: 3828, label: 'コミコミプランバリュー 35GB（10分かけ放題込み）' }],
    calls: '10min-some', facts: ['自宅セット割・au PAYカード割などで割引（トクトクプラン2は割引後1,628円〜）', 'コミコミプランバリューは10分かけ放題込み'],
    cautions: ['割引の適用条件を公式で確認'],
    officialUrl: 'https://www.uqwimax.jp/mobile/', sourceUrl: 'https://www.uqwimax.jp/mobile/plan/' },
  { id: 'ymobile', name: 'ワイモバイル', network: 'softbank', networkLabel: 'ソフトバンク回線', store: true, homeBundle: ['softbank'],
    summary: 'ソフトバンクのサブブランド。店舗サポートと光回線セット割が強み。',
    plans: [{ gb: 5, price: 3278, label: 'シンプル3 S（5GB）' }, { gb: 30, price: 4378, label: 'シンプル3 M（30GB）' }, { gb: 35, price: 5478, label: 'シンプル3 L（35GB・10分かけ放題込み）' }],
    calls: '10min-some', facts: ['2026年6月2日から月額220円の値上げ後の料金（割引なし）', 'おうち割光セット（A）1,650円引き・家族割・PayPayカード割あり'],
    cautions: ['割引前の料金。割引後の金額は組み合わせで変わるため公式で確認'],
    officialUrl: 'https://www.ymobile.jp/', sourceUrl: 'https://www.ymobile.jp/sp/price_info_2026/' },
  { id: 'nihontsushin', name: '日本通信SIM', network: 'docomo', networkLabel: 'ドコモ回線', store: false,
    summary: '月290円から。少ない利用量から通話つきの20GB・50GBまで。',
    plans: [{ gb: 1, price: 290, label: '合理的シンプル290（1GB、超過は1GBごとに+220円）' }, { gb: 20, price: 1390, label: '合理的みんなのプラン 20GB' }, { gb: 50, price: 2178, label: '合理的50GBプラン' }],
    calls: '5min-some', facts: ['20GB・50GBプランは5分かけ放題または月70分無料通話つき', 'eSIMは最短20分で利用開始'],
    cautions: ['店舗サポートなし'],
    officialUrl: 'https://www.nihontsushin.com/', sourceUrl: 'https://www.nihontsushin.com/' },
];

// 光回線：月額は 2026-10 時点の公式・比較記事で一致した「標準プラン」の目安。キャッシュバック等の実質額は扱わない。
export const HIKARI_SERVICES = [
  { id: 'docomo-hikari', name: 'ドコモ光', bundle: ['docomo'], areas: 'all', house: 5720, mansion: 4400,
    summary: 'ドコモのスマホとのセット割。プロバイダを選べる。', facts: ['ドコモのスマホとセット割', '全国（フレッツ光エリア）で利用可'],
    cautions: ['プロバイダにより月額・特典が異なる'], officialUrl: 'https://www.docomo.ne.jp/hikari/' },
  { id: 'softbank-hikari', name: 'ソフトバンク光', bundle: ['softbank'], areas: 'all', house: 5720, mansion: 4180,
    summary: 'ソフトバンク・ワイモバイルの「おうち割 光セット」対象。', facts: ['ソフトバンク／ワイモバイルとセット割', '全国（フレッツ光エリア）で利用可'],
    cautions: ['2026年12月利用分から月額改定の告知あり（戸建て6,050円／マンション4,510円）'], officialUrl: 'https://www.softbank.jp/internet/sbhikari/' },
  { id: 'au-hikari', name: 'auひかり', bundle: ['au'], areas: ['hokkaido', 'tohoku', 'kanto', 'hokuriku', 'chugoku', 'shikoku', 'kyushu'], house: 5610, mansion: null,
    summary: '独自回線。au・UQモバイルとのセット割。', facts: ['au／UQモバイルとセット割', 'マンションは建物の設備で料金が変わるため公式で確認'],
    cautions: ['戸建ては東海・関西・沖縄では提供されていない地域が多い（公式で住所を確認）'], officialUrl: 'https://www.au.com/internet/' },
  { id: 'nuro-hikari', name: 'NURO光', bundle: ['softbank'], areas: ['hokkaido', 'tohoku', 'kanto', 'tokai', 'kansai', 'chugoku', 'kyushu'], house: 5720, mansion: null,
    summary: '独自回線で高速通信が特徴。ソフトバンクのセット割対象。', facts: ['ソフトバンクとセット割', 'マンションは専用設備のある建物のみ（料金は公式で確認）'],
    cautions: ['提供エリアが限られる（東北は宮城など一部）', '開通工事に時間がかかる場合あり'], officialUrl: 'https://www.nuro.jp/hikari/' },
  { id: 'rakuten-hikari', name: '楽天ひかり', bundle: ['rakuten'], areas: 'all', house: 5280, mansion: 4180,
    summary: '楽天モバイルとの組み合わせで楽天ポイントが貯まりやすい。', facts: ['楽天モバイルとの組み合わせ特典', '全国（フレッツ光エリア）で利用可'],
    cautions: ['特典の条件は公式で確認'], officialUrl: 'https://network.mobile.rakuten.co.jp/hikari/' },
  { id: 'eo-hikari', name: 'eo光', bundle: ['au'], areas: ['kansai'], house: null, mansion: null,
    summary: '関西エリアの独自回線。au・UQモバイルのセット割対象。', facts: ['関西エリア限定', 'au／UQモバイルとセット割'],
    cautions: ['料金はプラン・建物で異なるため公式で確認'], officialUrl: 'https://eonet.jp/' },
  { id: 'commufa-hikari', name: 'コミュファ光', bundle: ['au'], areas: ['tokai'], house: null, mansion: null,
    summary: '東海エリアの独自回線。au・UQモバイルのセット割対象。', facts: ['東海エリア限定', 'au／UQモバイルとセット割'],
    cautions: ['料金はプラン・建物で異なるため公式で確認'], officialUrl: 'https://www.commufa.jp/' },
  // K3（2026-11-04追加）フレッツ系のプロバイダ型回線。数値は各社の公式サイト・公式規約で
  // 2026-11-04 に確認したもの（各エントリの checkedAt / sourceUrl に保持）。
  // GMOとくとくBB光は公式ページごと（特典ページ・通常料金ページ・FAQ）に月額が異なり単一の
  // 金額に定まらないため、So-net光は S／M／L の3プランで月額が分かれるため、いずれも
  // house / mansion を null にして「公式で確認」運用とし、個別ページも作らない（K1の除外ルール）。
  { id: 'biglobe-hikari', name: 'BIGLOBE光', bundle: ['au'], areas: 'all', house: 5478, mansion: 4378,
    summary: 'KDDI系の光コラボ。1ギガは3年プランで、au・UQモバイルのセット割対象。',
    facts: ['au／UQモバイルとセット割（BIGLOBE光電話の申込が条件）', '全国（フレッツ光エリア）で利用可'],
    cautions: ['月額は1ギガ・3年プランの金額。2年プラン・10ギガは料金が異なる'],
    officialUrl: 'https://join.biglobe.ne.jp/ftth/hikari/', sourceUrl: 'https://join.biglobe.ne.jp/ftth/hikari/', checkedAt: '2026-11-04' },
  { id: 'nifty-hikari', name: '@nifty光', bundle: ['au'], areas: 'all', house: 5720, mansion: 4378,
    summary: 'ニフティの光コラボ。auスマートバリュー・UQ mobile自宅セット割の対象。',
    facts: ['au／UQモバイルとセット割（@nifty光電話の申込が条件）', '全国（フレッツ光エリア）で利用可'],
    cautions: ['月額は1ギガの通常料金（22カ月目以降）。開始から21カ月目までは割引料金が適用される'],
    officialUrl: 'https://setsuzoku.nifty.com/niftyhikari/', sourceUrl: 'https://setsuzoku.nifty.com/niftyhikari/', checkedAt: '2026-11-04' },
  { id: 'sonet-hikari', name: 'So-net光', bundle: [], areas: 'all', house: null, mansion: null,
    summary: 'ソニー系の光コラボ。S／M／Lの3プランから選ぶ。',
    facts: ['S／M／Lの3プラン制（戸建て月4,500円／5,995円／7,095円、マンション月3,400円／4,895円／5,995円）', '全国（フレッツ光エリア）で利用可'],
    cautions: ['プランで月額が異なるため、目安は公式で確認'],
    officialUrl: 'https://www.so-net.ne.jp/access/hikari/', sourceUrl: 'https://www.so-net.ne.jp/signup/kiyaku/collaboration_rule01.html', checkedAt: '2026-11-04' },
  { id: 'gmo-hikari', name: 'GMOとくとくBB光', bundle: [], areas: 'all', house: null, mansion: null,
    summary: 'GMOとくとくBBの光コラボ。スマホとのセット割はなく、契約期間の縛りがない。',
    facts: ['スマホとのセット割は提供されていない（公式FAQ）', '契約期間の縛り・解約違約金なし', '全国（フレッツ光エリア）で利用可'],
    cautions: ['月額は申込窓口により異なるため、目安は公式で確認'],
    officialUrl: 'https://gmobb.jp/lp/gmohikari/', sourceUrl: 'https://gmobb.jp/lp/gmohikari_change/support/faq/', checkedAt: '2026-11-04' },
];

// クレジットカード：年会費と「基本」還元率のみ比較（上限値の「最大◯%」は条件つきなので注記扱い）。
// details は申込条件等の詳細表示用。2026-11-04 に各社の公式ページ（dカードは公式のカード一覧ページ）で
// 確認できた事実だけを載せる。公式で確認できなかった項目は行自体を持たせない（推測で埋めない）。
export const CARD_SERVICES = [
  { id: 'rakuten-card', name: '楽天カード', ecosystem: 'rakuten', fee: '永年無料', rate: 1.0,
    summary: '楽天市場・楽天モバイルなど楽天経済圏の基本カード。', facts: ['基本還元率1.0%（楽天ポイント）', '楽天市場ではSPUで還元率アップ'],
    cautions: ['楽天市場の上乗せ還元は条件つき'],
    details: [['申込条件', '満18歳以上の方（申込には本人名義の楽天IDが必要）'], ['年会費', '永年無料'], ['基本還元率', '1.0%（100円につき1ポイント）'], ['国際ブランド', 'Visa／Mastercard／JCB／American Express から選択'], ['ポイント', '楽天ポイント（1ポイント＝1円相当として利用可）']],
    officialUrl: 'https://www.rakuten-card.co.jp/' },
  { id: 'smbc-nl', name: '三井住友カード（NL）', ecosystem: 'vpoint', fee: '永年無料', rate: 0.5, conveni: true,
    summary: '対象のコンビニ・飲食店でスマホのタッチ決済を使う人向け。', facts: ['通常は0.5%（200円につき1ポイント）', '対象のコンビニ・飲食店でスマホのタッチ決済・モバイルオーダーなら最大7%'],
    cautions: ['カード現物のタッチ決済・iD・差し込みは7%の対象外'],
    details: [['申込条件', '満18歳以上の方（高校生は除く）'], ['年会費', '永年無料（家族カードも永年無料）'], ['基本還元率', '0.5%（200円につき1ポイント）'], ['国際ブランド', 'Visa／Mastercard'], ['保険', '海外旅行傷害保険 最高2,000万円（利用付帯）']],
    officialUrl: 'https://www.smbc-card.com/nyukai/card/numberless.jsp' },
  { id: 'jcb-w', name: 'JCB CARD W', ecosystem: 'jcb', fee: '永年無料', rate: 1.0, maxAge: 39,
    summary: '39歳以下が申込可能。基本還元率1.0%で優待店でさらにアップ。', facts: ['申込は18〜39歳（40歳以降も年会費無料で継続可）', '基本還元率1.0%、優待店でポイントアップ'],
    cautions: ['還元率は交換先により異なる'],
    details: [['申込条件', '18〜39歳（40歳以降も年会費無料で継続可）'], ['年会費', '永年無料'], ['基本還元率', '1.0%（優待店でポイントアップ）']],
    officialUrl: 'https://www.jcb.co.jp/ordercard/kojin_card/os_card_w.html' },
  { id: 'paypay-card', name: 'PayPayカード', ecosystem: 'paypay', fee: '永年無料', rate: 1.0,
    summary: 'PayPayやYahoo!ショッピングをよく使う人向け。', facts: ['基本還元率1.0%', '公共料金・税金は0.5%'],
    cautions: ['交通系ICへのチャージはポイント対象外', 'ポイントアップ条件は改定があるため公式で確認'],
    details: [['申込条件', '満18歳以上（高校生を除く）。申込にはYahoo! JAPAN IDとスマートフォンが必要'], ['年会費', '永年無料'], ['基本還元率', '1.0%'], ['国際ブランド', 'Visa／Mastercard／JCB（初回申込はVisaのみ）']],
    officialUrl: 'https://www.paypay-card.co.jp/' },
  { id: 'd-card', name: 'dカード', ecosystem: 'docomo', fee: '永年無料', rate: 1.0,
    summary: 'dポイントを貯める人、ドコモユーザー向け。', facts: ['基本還元率1.0%（dポイント）'],
    cautions: ['電気・ガス・水道料金は2026年2月から原則0.5%', '2026年12月以降に還元率・進呈条件・年会費の見直し予定が公式で告知されている'],
    details: [['申込条件', '満18歳以上（高校生を除く）。個人名義で、本人名義の口座を支払口座に設定'], ['年会費', '永年無料'], ['基本還元率', '1.0%（100円につき1ポイント）'], ['国際ブランド', 'Visa／Mastercard'], ['ドコモ料金の還元', '対象のドコモ利用料金は1,000円（税抜）ごとに1%還元']],
    officialUrl: 'https://dcard.docomo.ne.jp/' },
  { id: 'aupay-card', name: 'au PAYカード', ecosystem: 'au', fee: '永年無料', rate: 1.0,
    summary: 'au・UQモバイル利用者、Pontaポイントを貯める人向け。', facts: ['2024年6月から全員年会費永年無料', '公共料金も1.0%'],
    cautions: ['ポイント加算条件は公式で確認'],
    details: [['年会費', '永年無料（2024年6月から全員）'], ['基本還元率', '1.0%（公共料金も1.0%）'], ['ポイント', 'Pontaポイント']],
    officialUrl: 'https://www.kddi-fs.com/' },
  { id: 'recruit-card', name: 'リクルートカード', ecosystem: 'recruit', fee: '永年無料', rate: 1.2,
    summary: '基本還元率1.2%。特定の経済圏にこだわらない人向け。', facts: ['基本還元率1.2%', '電気・ガス・水道もポイント加算対象'],
    cautions: ['電子マネーチャージは対象・上限に条件あり'],
    details: [['年会費', '永年無料'], ['基本還元率', '1.2%（10,000円の利用で120ポイント）'], ['ポイント', 'リクルートポイント（1ポイント＝1円分）。Pontaポイント・dポイントへ交換可']],
    officialUrl: 'https://recruit-card.jp/' },
  // dカード GOLD U は dカード（通常版）とは別商品。年会費がかかるため fee は金額を明記し、年齢条件は maxAge で扱う。
  // 数値は 2026-11-04 に dカード公式のカード一覧ページで確認したもの（sourceUrl）。
  { id: 'd-card-gold-u', name: 'dカード GOLD U', ecosystem: 'docomo', fee: '3,300円（税込）', rate: 1.0, maxAge: 29,
    summary: '29歳以下限定のゴールドカード。dカード（通常版）とは別商品で、ドコモの利用料金の還元がある。',
    facts: ['ドコモのケータイ／ドコモ光の利用料金は1,000円（税抜）ごとに5%還元', '年会費は条件を満たすと翌年の請求時に前年分が減算され、実質無料になる', 'ケータイ補償は購入から3年以内・最大10万円'],
    cautions: ['満30歳以降のカード有効期限満了時に、審査のうえ年会費11,000円（税込）のdカード GOLDに切りかわる', '2026年12月以降に還元率・進呈条件・年会費の見直し予定が公式で告知されている'],
    details: [['申込条件', '入会申込み日時点で満18歳以上29歳以下（高校生を除く）。個人名義で、本人名義の口座を支払口座に設定'], ['年会費', '3,300円（税込）。満22歳以下、年間30万円以上の利用、対象ドコモプランの契約＋支払い設定（初年度のみ）のいずれかで、翌年の年会費請求時に前年分が減算され実質無料'], ['基本還元率', '1.0%（100円につき1ポイント）'], ['ドコモ料金の還元', '対象のケータイ／ドコモ光の利用料金1,000円（税抜）ごとに5%（ドコモ mini・irumo・ahamo・ahamo光、端末代金・手数料等は対象外）'], ['国際ブランド', 'Visa／Mastercard'], ['家族カード', '年会費1,100円（税込）／枚'], ['ケータイ補償', '購入から3年以内・最大10万円']],
    officialUrl: 'https://dcard.docomo.ne.jp/', sourceUrl: 'https://dcard.docomo.ne.jp/st/dcard_lineup/index.html' },
];

// 保険：商品の比較・推奨は保険募集に当たるおそれがあるため行わない。無料相談サービスの紹介のみ（順位なし・五十音順）。
// consultMethods / storeNetwork / feature / fee は、2026-11-04 に各社の公式サイトで確認した事実だけを載せる。
// 公式で確認できなかった項目はフィールド自体を持たせない（推測で埋めない）。数値の時点・条件の注記は公式表記に合わせ、確認先は sourceUrl に残す。
// ほけんの窓口の総店舗数は、時点の異なる数値しか公式に確認できなかったため定性表記のままにしている（オンライン相談は企業サイトのプレスリリースと公式店舗ページで確認）。
export const HOKEN_SERVICES = [
  { id: 'hoken-clinic', name: '保険クリニック', summary: '複数の保険会社の商品を扱う無料相談サービス。', consultMethods: '店舗・オンライン', storeNetwork: '全国309店舗', feature: '取扱保険会社は約50社（店舗により異なる）', fee: '無料', officialUrl: 'https://www.hoken-clinic.com/', sourceUrl: 'https://www.hoken-clinic.com/' },
  { id: 'hokennomadoguchi', name: 'ほけんの窓口', summary: '全国に店舗がある無料保険相談サービス。', consultMethods: '店舗・オンライン', storeNetwork: '全国に店舗がある', feature: '取扱保険会社は40社以上、300商品以上', fee: '無料', officialUrl: 'https://www.hokennomadoguchi.com/', sourceUrl: 'https://www.hokennomadoguchi.com/' },
  { id: 'hoken-minaoshi-lab', name: '保険見直しラボ', summary: '訪問・オンラインで相談できる無料保険相談サービス。', consultMethods: '訪問・オンライン', storeNetwork: '全国に約60拠点（2025年4月時点）', feature: '取扱保険会社は42社（2026年9月時点）', fee: '無料', officialUrl: 'https://www.hoken-minaoshi-lab.jp/', sourceUrl: 'https://www.hoken-minaoshi-lab.jp/' },
];

export const SERVICE_IDS = Object.freeze([...SIM_SERVICES, ...HIKARI_SERVICES, ...CARD_SERVICES, ...HOKEN_SERVICES].map(s => s.id));
