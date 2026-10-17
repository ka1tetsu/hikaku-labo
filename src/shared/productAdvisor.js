// Rule-based shopping request understanding (no AI API). Turns vague wishes
// ("母の日のプレゼント", "在宅ワークを快適に") and concrete requests
// ("1万円以下のノイズキャンセリングイヤホン") into Rakuten search conditions.
// It never invents products or prices: items are fetched live from /api/search.

const KANJI = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
const toNumber = text => String(text).normalize('NFKC').replace(/[一二三四五六七八九](?=\s*(千|万))/g, ch => KANJI[ch]);

// Common product nouns. Longest match wins, so put specific words before generic ones.
export const PRODUCT_NOUNS = [
  'ノイズキャンセリングイヤホン', 'ワイヤレスイヤホン', 'イヤホン', 'ヘッドホン', 'ヘッドセット', 'スピーカー',
  'スマートフォン', 'スマホ', 'iPhone', 'タブレット', 'iPad', 'ノートパソコン', 'ノートPC', 'パソコン', 'PC', 'モニター', 'ディスプレイ',
  'キーボード', 'マウス', 'ウェブカメラ', 'プリンター', 'ルーター', 'モバイルバッテリー', '充電器', 'スマートウォッチ', 'カメラ', 'ミラーレス', 'レンズ',
  'テレビ', 'プロジェクター', 'ゲーム機', 'Switch', 'PS5', 'コントローラー',
  'ロボット掃除機', 'コードレス掃除機', '掃除機', 'ドラム式洗濯機', '洗濯機', '冷蔵庫', '電子レンジ', 'オーブンレンジ', 'トースター', '炊飯器',
  '電気圧力鍋', 'ホットプレート', '電気ケトル', 'コーヒーメーカー', 'ミキサー', 'フードプロセッサー', '食洗機', '空気清浄機', '加湿器', '除湿機',
  'エアコン', 'サーキュレーター', '扇風機', 'ヒーター', '電気毛布', 'こたつ', 'ドライヤー', 'ヘアアイロン', '電動歯ブラシ', 'シェーバー', '美顔器', '体重計', '体組成計',
  'マットレス', '枕', '布団', 'オフィスチェア', 'デスク', 'ソファ', 'ベッド', '照明', 'カーテン', '収納',
  'スーツケース', 'リュック', 'バッグ', '財布', '腕時計', 'スニーカー', 'ランニングシューズ', 'ジャケット', 'コート', '傘',
  'ベビーカー', 'チャイルドシート', 'おもちゃ', '知育玩具', 'ぬいぐるみ', '絵本',
  'ヨガマット', 'ダンベル', 'プロテイン', 'テント', '寝袋', 'キャンプ用品', '自転車',
  'コーヒー', '紅茶', 'お菓子', 'スイーツ', 'チョコレート', 'ビール', 'ワイン', '日本酒', 'お米', '水', 'ふるさと納税',
  'お米', '米', '牛肉', 'カニ', 'うなぎ', 'ルンバ', 'ダイソン', 'AirPods', 'ケース', 'フィルム', '時計',
  '化粧水', '日焼け止め', 'シャンプー', '香水', 'ハンドクリーム', 'タオル', '花', 'フラワー', 'カタログギフト',
];

// "ルンバみたいなやつ" → the generic category instead of the brand.
const LIKE = { 'ルンバ': 'ロボット掃除機', 'ダイソン': 'コードレス掃除機', 'AirPods': 'ワイヤレスイヤホン', 'iPad': 'タブレット', 'Switch': 'ゲーム機' };
const toKatakana = text => text.replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));

// Attribute words → Rakuten keyword terms.
const ATTRIBUTES = [
  [/(ノイキャン|ノイズキャンセ)/, 'ノイズキャンセリング'], [/(音質|高音質|音がいい)/, '高音質'], [/(軽い|軽量)/, '軽量'], [/(静か|静音)/, '静音'],
  [/(防水|雨の日)/, '防水'], [/(コンパクト|小さい|小型)/, 'コンパクト'], [/(大容量|たくさん入る)/, '大容量'], [/(ワイヤレス|コードレス|無線)/, 'ワイヤレス'],
  [/(一人暮らし|ひとり暮らし)/, '一人暮らし'], [/(大型|大きい)/, '大型'], [/(子供用|キッズ|子ども用)/, 'キッズ'], [/(メンズ|男性用)/, 'メンズ'], [/(レディース|女性用)/, 'レディース'],
];

// Vague needs → several concrete starting points (shown as chips, first one searched).
export const NEEDS = [
  { re: /(母の日|お母さん|母親|ママ).*(プレゼント|ギフト|贈)|(プレゼント|ギフト).*(母|ママ)/, label: '母の日・お母さんへのギフト', keywords: ['母の日 ギフト', 'ハンドクリーム ギフト', 'フラワー ギフト', 'スイーツ ギフト'] },
  { re: /(父の日|お父さん|父親|パパ).*(プレゼント|ギフト|贈)|(プレゼント|ギフト).*(父|パパ)/, label: '父の日・お父さんへのギフト', keywords: ['父の日 ギフト', 'ビール ギフト', '名入れ グラス', 'ネクタイ'] },
  { re: /(彼女|妻|奥さん|女性|女友達).*(プレゼント|ギフト|誕生日)|(プレゼント|ギフト).*(彼女|女性)/, label: '女性へのプレゼント', keywords: ['女性 プレゼント', 'コスメ ギフト', 'アクセサリー', 'ハンドクリーム ギフト'] },
  { re: /(彼氏|夫|旦那|男性|男友達).*(プレゼント|ギフト|誕生日)|(プレゼント|ギフト).*(彼氏|男性)/, label: '男性へのプレゼント', keywords: ['男性 プレゼント', '財布 メンズ', '腕時計 メンズ', 'ビール ギフト'] },
  { re: /(子供|子ども|こども|孫|キッズ).*(プレゼント|ギフト|誕生日|クリスマス)/, label: '子どもへのプレゼント', keywords: ['知育玩具', 'おもちゃ 人気', '絵本 セット', 'ぬいぐるみ'] },
  { re: /(出産祝い|ベビー|赤ちゃん)/, label: '出産祝い・ベビー用品', keywords: ['出産祝い', 'ベビー ギフト', 'ベビーカー', 'おむつケーキ'] },
  { re: /(結婚祝い|新築祝い|引っ越し祝い)/, label: 'お祝いギフト', keywords: ['結婚祝い ペア', 'カタログギフト', 'ペアグラス', 'タオル ギフト'] },
  { re: /(お返し|内祝い|香典返し)/, label: 'お返し・内祝い', keywords: ['内祝い', 'カタログギフト', 'お菓子 詰め合わせ', 'タオル ギフト'] },
  { re: /(クリスマス).*(プレゼント|ギフト)/, label: 'クリスマスギフト', keywords: ['クリスマス プレゼント', 'クリスマス お菓子', 'イルミネーション', 'ぬいぐるみ'] },
  { re: /^(父の日)/, label: '父の日のギフト', keywords: ['父の日 ギフト', 'ビール ギフト', '名入れ グラス', 'ネクタイ'] },
  { re: /^(母の日)/, label: '母の日のギフト', keywords: ['母の日 ギフト', 'ハンドクリーム ギフト', 'フラワー ギフト', 'スイーツ ギフト'] },
  { re: /(プレゼント|ギフト|贈り物|手土産)/, label: 'プレゼント・ギフト', keywords: ['ギフト 人気', 'スイーツ ギフト', 'カタログギフト', 'タオル ギフト'] },
  { re: /(一人暮らし|ひとり暮らし|新生活)/, label: '一人暮らし・新生活', keywords: ['冷蔵庫 一人暮らし', '電子レンジ 一人暮らし', '洗濯機 一人暮らし', '炊飯器 3合'] },
  { re: /(在宅ワーク|在宅勤務|テレワーク|リモートワーク|作業環境|デスク環境)/, label: '在宅ワークを快適に', keywords: ['モニター 27インチ', 'オフィスチェア', 'ウェブカメラ', 'ノイズキャンセリング イヤホン'] },
  { re: /(引っ越し|引越し|新居)/, label: '引っ越し・新居の準備', keywords: ['カーテン', '収納ボックス', '照明 LED', '洗濯機'] },
  { re: /(肩こり|肩が凝|首が痛|首こり)/, label: '肩こり・首のケア', keywords: ['マッサージ器 肩', '枕 肩こり', 'ネックピロー', 'ホットアイマスク'] },
  { re: /(腰痛|腰が痛)/, label: '腰痛対策', keywords: ['クッション 腰', 'オフィスチェア', 'マットレス 腰痛', 'コルセット 腰'] },
  { re: /(起きられない|起きれない|寝坊|目覚まし)/, label: '朝すっきり起きたい', keywords: ['光目覚まし時計', '目覚まし時計 大音量', 'スマートライト', '遮光カーテン'] },
  { re: /(乾燥(する|して)|部屋が乾燥|喉が乾燥|加湿)/, label: '部屋の乾燥対策', keywords: ['加湿器', '加湿空気清浄機', '保湿クリーム', '濡れマスク'] },
  { re: /(花粉|ハウスダスト|空気が悪)/, label: '花粉・空気の対策', keywords: ['空気清浄機', '花粉 マスク', '布団クリーナー', '加湿空気清浄機'] },
  { re: /(充電がすぐ|充電が切れ|バッテリーが持たな|電池が持たな)/, label: 'スマホの充電対策', keywords: ['モバイルバッテリー', '急速充電器', 'ワイヤレス充電器', '充電ケーブル'] },
  { re: /(目が疲れ|眼精疲労|目の疲れ)/, label: '目の疲れ対策', keywords: ['ホットアイマスク', 'ブルーライトカット メガネ', 'モニターライト', '目元マッサージャー'] },
  { re: /(眠れない|寝れない|睡眠|快眠|寝つき)/, label: '睡眠の質を上げたい', keywords: ['枕', 'マットレス', 'アイマスク', '遮光カーテン'] },
  { re: /(時短|料理が面倒|料理を楽|料理が楽|家事を楽|家事が楽|自炊)/, label: '家事・料理の時短', keywords: ['電気圧力鍋', '食洗機', 'ロボット掃除機', 'フードプロセッサー'] },
  { re: /(掃除|部屋をきれい|ホコリ)/, label: '掃除を楽にしたい', keywords: ['ロボット掃除機', 'コードレス掃除機', '空気清浄機', 'ハンディクリーナー'] },
  { re: /(暑い|暑さ|夏を快適|熱中症)/, label: '暑さ対策', keywords: ['サーキュレーター', 'ハンディファン', '冷感 敷きパッド', '日傘'] },
  { re: /(寒い|寒さ|冬を快適|冷え性)/, label: '寒さ対策', keywords: ['電気毛布', 'セラミックヒーター', '加湿器', '着る毛布'] },
  { re: /(運動|ダイエット|筋トレ|健康)/, label: '運動・健康', keywords: ['体組成計', 'ヨガマット', 'ダンベル', 'スマートウォッチ'] },
  { re: /(旅行グッズ|旅行用品|旅行に便利|旅行で使える|旅の持ち物)/, label: '旅行グッズ', keywords: ['スーツケース', 'モバイルバッテリー', '変換プラグ', 'トラベルポーチ'] },
  { re: /(キャンプ|アウトドア)/, label: 'キャンプ・アウトドア', keywords: ['テント', '寝袋', 'ランタン', 'キャンプ チェア'] },
  { re: /(防災|災害|非常時)/, label: '防災グッズ', keywords: ['防災セット', 'ポータブル電源', '保存水', 'モバイルバッテリー'] },
  { re: /(肌|スキンケア|乾燥肌)/, label: 'スキンケア', keywords: ['化粧水', '保湿クリーム', '日焼け止め', '美顔器'] },
  { re: /(ゲーム|ゲーマー)/, label: 'ゲーム環境', keywords: ['ゲーミングヘッドセット', 'ゲーミングマウス', 'ゲーミングモニター', 'コントローラー'] },
];

const STOP = /^(おすすめ|オススメ|人気|安い|安く|いい|良い|よい|欲しい|ほしい|買いたい|買う|探して|探す|教えて|ください|したい|たい|もの|物|やつ|商品|何か|なにか|どれ|何|なに|最安|最安値|格安|コスパ|高評価|評価|レビュー|口コミ|予算|以下|以内|まで|くらい|程度|前後|円|万円|送料無料|ポイント|比較|ランキング|売れ筋|最新|ある|あれば|です|ます|今|ちょっと|ほど|探し|向け|用|に|を|が|は|で|と|の|も)$/;

function contentWords(text) {
  return text
    .replace(/(\d+(?:\.\d+)?)\s*(万|千)?\s*(円\s*(以下|以内|まで|未満|くらい|前後|程度|以上)?|(以下|以内|まで|未満|くらい|前後|程度|以上))/g, ' ')
    .split(/[\s、。,.!?！？]|の|が|を|で|に|と|は|も|って|から|みたいな|みたい|やつ/)
    .map(w => w.trim()).filter(w => w.length >= 2 && !STOP.test(w) && !/^(たい|ほしい|欲しい|したい|ください)/.test(w) && !/(たい|てる|ている|です|ます)$/.test(w))
    .map(w => w.replace(/(が|を)?(欲しい|ほしい|買いたい|探してる|探している|ある\?)$/, ''));
}

export function parseProductRequest(input) {
  const raw = String(input || '').trim();
  const text = toNumber(raw);
  const request = { keyword: '', minPrice: 0, maxPrice: 0, sort: 'standard', freeShipping: false, need: null, signals: 0 };

  // Price: "1万円以下", "3000円くらい", "5千円〜1万円", "予算2万".
  const unit = (n, u) => Math.round(Number(n) * (u === '万' ? 10000 : u === '千' ? 1000 : 1));
  const range = text.match(/(\d+(?:\.\d+)?)\s*(万|千)?円?\s*(?:〜|~|から)\s*(\d+(?:\.\d+)?)\s*(万|千)?円/);
  const single = text.match(/(\d+(?:\.\d+)?)\s*(万|千)?\s*円?\s*(以下|以内|まで|未満|くらい|前後|程度|以上)/) || text.match(/予算\s*(?:は)?\s*(\d+(?:\.\d+)?)\s*(万|千)?/);
  if (range) { request.minPrice = unit(range[1], range[2]); request.maxPrice = unit(range[3], range[4]); }
  else if (single) {
    const amount = unit(single[1], single[2]);
    if (amount >= 100) {
      if (/(くらい|前後|程度)/.test(single[3] || '')) { request.minPrice = Math.round(amount * 0.7); request.maxPrice = Math.round(amount * 1.3); }
      else if (single[3] === '以上') request.minPrice = amount;
      else request.maxPrice = amount;
    }
  }
  if (request.maxPrice || request.minPrice) request.signals += 2;

  if (/(安い|安く|最安|格安|コスパ|節約|お手頃)/.test(text)) request.sort = '+itemPrice';
  if (/(高評価|評価が高|レビューが(いい|良)|口コミ|評判)/.test(text)) request.sort = '-reviewAverage';
  if (/(人気|売れ筋|定番|みんな)/.test(text) && request.sort === 'standard') request.sort = '-reviewCount';
  if (/送料無料/.test(text)) request.freeShipping = true;
  if (/(買|欲しい|ほしい|購入|商品|最安|円以下|円まで|レビュー|通販|楽天|Amazon|アマゾン)/i.test(text)) request.signals += 2;

  request.need = NEEDS.find(n => n.re.test(text)) || null;
  if (request.need) request.signals += 4;

  // Product noun (longest first) + attributes.
  const nouns = [...PRODUCT_NOUNS].sort((a, b) => b.length - a.length);
  const lower = text.toLowerCase();
  // Hiragana input ("いやほん") matches katakana product names too.
  let noun = nouns.find(n => lower.includes(n.toLowerCase())) || nouns.find(n => /[ァ-ヶ]/.test(n) && toKatakana(lower).includes(n));
  if (noun && LIKE[noun] && /(みたいな|のような|っぽい|似た)/.test(text)) noun = LIKE[noun];
  if (noun) request.signals += 4;
  const attributes = ATTRIBUTES.filter(([re]) => re.test(text)).map(([, word]) => word).filter(word => !noun || !noun.includes(word));
  if (noun) {
    // Keep one extra content word such as a brand or ingredient ("ダイソン ドライヤー", "ふるさと納税 牛肉").
    const words = contentWords(text);
    const spec = words.find(w => /^\d+(\.\d+)?(kg|g|ml|l|cm|mm|インチ|型|個|本|枚|合|人用|畳)$/i.test(w));
    const extra = words.find(w => !toKatakana(w).includes(noun) && !noun.includes(w) && !attributes.includes(w) && !ATTRIBUTES.some(([re]) => re.test(w)) && !/^\d/.test(w));
    request.keyword = [...attributes.slice(0, 2), ...(extra && !/(みたい|ような|やつ)/.test(text) ? [extra] : []), noun, ...(spec ? [spec] : [])].join(' ');
  }
  else if (!request.need) {
    // Fall back to the remaining content words ("北海道 カニ", "抹茶 スイーツ").
    const words = contentWords(text);
    request.keyword = [...attributes.slice(0, 1), ...words.slice(0, 3)].filter(Boolean).join(' ').trim();
  }
  // "スマホの充電がすぐ切れる": the device is context, the need names the product.
  const contextOnly = ['スマホ', 'スマートフォン', 'PC', 'パソコン', 'iPhone'].includes(noun) && request.need && !/ギフト|プレゼント/.test(request.need.label);
  if (request.need && (!noun || contextOnly)) request.keyword = request.need.keywords[0];
  return request;
}

export function describeProductRequest(request) {
  const out = [];
  if (request.need) out.push(request.need.label);
  if (request.keyword) out.push('検索: ' + request.keyword);
  const yen = n => n.toLocaleString('ja-JP') + '円';
  if (request.minPrice && request.maxPrice) out.push(`${yen(request.minPrice)}〜${yen(request.maxPrice)}`);
  else if (request.maxPrice) out.push(yen(request.maxPrice) + '以下');
  else if (request.minPrice) out.push(yen(request.minPrice) + '以上');
  const sort = { '+itemPrice': '安い順', '-reviewAverage': '評価が高い順', '-reviewCount': 'レビュー件数順' }[request.sort];
  if (sort) out.push(sort);
  if (request.freeShipping) out.push('送料無料');
  return out;
}

// Client-side guard: Rakuten already filters, but never show items outside the stated range.
export function pickProducts(items, request, limit = 3) {
  let list = items.filter(item => item.itemPrice > 0
    && (!request.maxPrice || item.itemPrice <= request.maxPrice)
    && (!request.minPrice || item.itemPrice >= request.minPrice)
    && (!request.freeShipping || item.isFreeShipping));
  if (request.sort === '-reviewAverage') list = list.filter(item => item.reviewCount >= 5).sort((a, b) => b.reviewAverage - a.reviewAverage || b.reviewCount - a.reviewCount);
  if (request.sort === '+itemPrice') list = [...list].sort((a, b) => a.effectivePrice - b.effectivePrice);
  return list.slice(0, limit);
}
