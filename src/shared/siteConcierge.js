// Site-wide concierge for Vivlica: routes free text to travel, shopping or web-tool
// advice. Pure rule-based logic in the browser — no AI API, nothing sent to a server
// except the ordinary product search the shopping page already uses.
import { conciergeReply, parseTravelRequest } from '../travel/concierge.js';
import { travelLinkConfig } from '../travel/bookingLinks.js';
import { describeProductRequest, parseProductRequest } from './productAdvisor.js';
import { adviseTools, parseToolsRequest } from './toolsAdvisor.js';

const TRAVEL_WORDS = /(旅行|旅|観光|連れてって|お出かけ|出かけ|遊びに行|見に行|息抜き|バカンス|避暑|休暇|癒され|癒やされ|桜が見|雪が見|雪を見|景色|絶景|ホテル|旅館|宿|航空券|飛行機|フライト|ツアー|海外|国内旅行|世界遺産|観光地|行きたい|行くなら|ビザ|リゾート|温泉|ビーチ|モデルコース|泊|日帰り|連休|ゴールデンウィーク|夏休み|年末年始)/;
const FOLLOW_UP = /^(もっと|他の|ほかの|別の|それ|これ|あと|次|じゃあ|では|もう少し|やっぱり|高評価|評価|送料無料|安い順|もっと安く|続き)/;

export const SITE_CHIPS = {
  site: ['週末に行ける温泉旅行', '1万円以下のワイヤレスイヤホン', 'ネットショップを無料で始めたい', '母の日のプレゼント', 'スマホ代を安くしたい'],
  travel: ['12月に3泊、温泉とグルメ。予算1人10万円', '大阪発で近場の海外ビーチ', 'ヨーロッパで美術館巡り、1週間', '週末に行ける温泉旅行'],
  products: ['1万円以下のワイヤレスイヤホン', '母の日のプレゼント 3000円くらい', '在宅ワークを快適にしたい', '一人暮らしの家電をそろえたい'],
  tools: ['ネットショップを無料で始めたい', '初心者でもおしゃれなホームページを作りたい', 'ブログで副業を始めたい', 'Shopifyってどう？'],
};

export function welcomeMessage(section = 'site') {
  const lead = {
    travel: '旅の行き先探しから、モデルコース・航空券・ホテルまで相談できます。',
    products: '欲しいもの・予算・用途を書けば、楽天市場の商品から条件に合うものを探します。',
    tools: 'Webサイト・ネットショップ・ブログを始めたい方に、目的と予算に合うサービスを提案します。',
    site: '',
  }[section] || '';
  return {
    role: 'assistant', domain: 'site',
    text: [`Vivlicaの条件検索アシスタントです。${lead}旅行・商品・ITツールを掲載データとルールから探します。最新の価格や条件は販売元で確認してください。`],
    chips: [...new Set([...(SITE_CHIPS[section] || []).slice(0, 3), ...SITE_CHIPS.site])].slice(0, 5),
  };
}

export function routeQuery(text, { section = 'site', previous = null } = {}) {
  const travel = parseTravelRequest(text);
  const { slots, intents } = travel;
  let travelScore = 0;
  if (slots.destinations || slots.countries || slots.regions || slots.area) travelScore += 3;
  if (TRAVEL_WORDS.test(text)) travelScore += 4;
  if (slots.months || slots.nights !== undefined || slots.origin) travelScore += 2;
  if (slots.keywords) travelScore += 2; // a wish only places offer: オーロラ, ワイナリー…
  if (slots.interests) travelScore += 1;
  if (intents.some(i => ['flight', 'hotel', 'plan', 'visa', 'season'].includes(i))) travelScore += 3;
  const product = parseProductRequest(text);
  const tools = parseToolsRequest(text);
  const life = parseLifeRequest(text);
  const scores = { travel: travelScore, products: product.signals, tools: tools.signals, life: life.signals };
  // Shopping for travel goods ("旅行グッズ") is shopping, not trip planning.
  if (product.need && /グッズ|用品/.test(text)) scores.products += 4;
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best[1] >= 3 && !(FOLLOW_UP.test(text) && previous && scores[previous] >= best[1] - 1)) return { domain: best[0], scores };
  if (previous) return { domain: previous, scores };
  if (['travel', 'products', 'tools'].includes(section) && best[1] > 0) return { domain: best[0], scores };
  if (['travel', 'products', 'tools'].includes(section)) return { domain: section, scores };
  return { domain: best[1] > 0 ? best[0] : 'site', scores };
}

function productsReply(text, previous) {
  const quoted = text.match(/「([^」]{1,40})」/);
  const parsed = parseProductRequest(quoted ? quoted[1] : text);
  if (quoted) { parsed.keyword = quoted[1].trim(); parsed.need = null; }
  const modifiers = parseProductRequest(text);
  const followUp = !parsed.keyword && !parsed.need && previous?.keyword;
  const request = followUp ? { ...previous, page: 1 } : { ...parsed, page: 1 };
  if (quoted && previous && !parsed.maxPrice && !parsed.minPrice) { request.maxPrice = previous.maxPrice; request.minPrice = previous.minPrice; }
  if (followUp) {
    if (modifiers.maxPrice || modifiers.minPrice) { request.maxPrice = modifiers.maxPrice; request.minPrice = modifiers.minPrice; }
    if (/(もっと安|安く|安い)/.test(text)) { request.sort = '+itemPrice'; if (request.maxPrice) request.maxPrice = Math.round(request.maxPrice * 0.7); }
    if (/(高評価|評価|レビュー)/.test(text)) request.sort = '-reviewAverage';
    if (/送料無料/.test(text)) request.freeShipping = true;
    if (/(他の|ほかの|別の|次)/.test(text)) request.page = (previous.page || 1) + 1;
  }
  if (!request.keyword) {
    return {
      message: { role: 'assistant', domain: 'products', text: ['どんなものをお探しですか？「1万円以下のワイヤレスイヤホン」のような具体的な条件でも、「母の日のプレゼント」「在宅ワークを快適にしたい」のようなざっくりした相談でもOKです。'],
        chips: SITE_CHIPS.products },
      state: previous,
    };
  }
  const lines = [];
  if (request.need && !followUp && !quoted) lines.push(`「${request.need.label}」ですね。定番の候補から、まず「${request.keyword}」を楽天市場で探しました。ほかの候補も下のボタンから探せます。`);
  else lines.push(`「${request.keyword}」を楽天市場で探しました。`);
  lines.push('価格・在庫・ポイントは取得時点の情報です。購入前に販売ページで最新の条件を確認してください。');
  const chips = request.need
    ? request.need.keywords.filter(k => k !== request.keyword).map(k => `「${k}」を探して`)
    : ['もっと安く', '評価が高い順', '送料無料だけ', '他の商品も見たい'];
  return {
    message: { role: 'assistant', domain: 'products', text: lines, summary: describeProductRequest(request),
      productQuery: { keyword: request.keyword, minPrice: request.minPrice || 0, maxPrice: request.maxPrice || 0, sort: request.sort, freeShipping: request.freeShipping, page: request.page }, chips },
    state: request,
  };
}

const BUDGET_LABEL = { free: '無料で始めたい', starter: '月2,000円まで', standard: '月5,000円まで', flexible: '機能を優先' };
const PRIORITY_LABEL = { easy: '使いやすさ', cost: '価格', design: 'デザイン', scale: '拡張性' };

function toolsReply(text, previous) {
  const parsed = parseToolsRequest(text);
  // Budget and priority carry over only while the user stays on the same kind of site.
  const sameCategory = !parsed.category || parsed.category === previous?.category;
  const request = {
    category: parsed.category || previous?.category || null,
    budget: parsed.budget || (sameCategory ? previous?.budget : null) || null,
    priority: parsed.priority || (sameCategory ? previous?.priority : null) || null,
    service: parsed.service || null, goal: parsed.goal,
  };
  const advice = adviseTools(request);
  if (advice.needsCategory) {
    return {
      message: { role: 'assistant', domain: 'tools', text: ['何を作りたいかで、合うサービスが変わります。近いものを選んでください。'],
        chips: ['Webサイトを作りたい', 'ネットショップを開きたい', 'ブログ・WordPressを始めたい'] },
      state: request,
    };
  }
  const lines = [];
  if (request.goal) lines.push(`${request.goal}から始めるのがおすすめです。`);
  lines.push(`「${advice.categoryTitle}」を、予算「${BUDGET_LABEL[advice.budget]}」・重視点「${PRIORITY_LABEL[advice.priority]}」で比べました。`);
  if (request.service) {
    const rank = advice.services.findIndex(s => s.id === request.service.id);
    lines.push(`${request.service.name}：${request.service.summary}（料金の目安：${request.service.price.label}）。注意点：${request.service.cautions.join('、')}。${rank >= 0 ? `この条件では${rank + 1}位です。` : ''}`);
  }
  lines.push('料金は公式サイトで確認した時点の目安です。契約前に最新の料金・手数料を確認してください。');
  const chips = [
    ...(advice.budget !== 'free' ? ['無料で始めたい'] : ['月5,000円まで出せる']),
    ...['デザイン重視で', '拡張性を重視'].filter(c => !c.includes(PRIORITY_LABEL[advice.priority])),
    ...['Webサイトを作りたい', 'ネットショップを開きたい', 'ブログ・WordPressを始めたい'].filter(c => !c.includes({ website: 'Webサイト', shop: 'ネットショップ', wordpress: 'WordPress' }[advice.category])).slice(0, 1),
  ];
  return {
    message: { role: 'assistant', domain: 'tools', text: lines,
      summary: [advice.categoryTitle, BUDGET_LABEL[advice.budget], PRIORITY_LABEL[advice.priority] + '重視'],
      toolCards: advice.services.map(s => ({ id: s.id, name: s.name, subtitle: s.subtitle, price: s.price.label, reasons: s.reasons, score: s.score })),
      selectorUrl: advice.selectorUrl, chips },
    state: { category: advice.category, budget: advice.budget, priority: advice.priority },
  };
}

// --- Life （通信・お金）: fixed-cost reviews route to the same selectors the
// /sim/ /hikari/ /card/ pages use, with the same condition enums, so a chat
// answer and the selector always agree. Insurance has no selector: its page
// is an editorial "sort out what you need first" guide.
const LIFE_CATEGORY_RULES = [
  ['hikari', /(光回線|プロバイダ|ネット代|回線代|ネット回線|自宅のネット|インターネット回線|auひかり|ドコモ光|NURO光|ソフトバンク光|楽天ひかり)/],
  ['sim', /(格安SIM|スマホ代|携帯代|スマホ料金|携帯料金|通信費|データ量|ギガ|スマホの乗り換え|乗り換えたい|に乗り換え|へ乗り換え)/],
  ['card', /(クレジットカード|カードの見直し|カードを見直し)/],
  ['hoken', /(保険の見直し|保険を見直し|保険料|医療保険|生命保険|保険の相談)/],
];
const LIFE_WORDS = /(固定費|家計の見直し|毎月の支払いを減ら|月々の支払いを減ら)/;
const AREA_RULES = [
  ['hokkaido', /北海道/], ['tohoku', /東北/], ['kanto', /関東|東京|神奈川|千葉|埼玉|群馬|栃木|茨城/],
  ['hokuriku', /北陸|甲信越|新潟|富山|石川|福井|長野|山梨/], ['tokai', /東海|愛知|静岡|岐阜|三重/],
  ['kansai', /関西|大阪|京都|兵庫|奈良|滋賀|和歌山/], ['chugoku', /中国地方|鳥取|島根|岡山|広島|山口/],
  ['shikoku', /四国|徳島|香川|愛媛|高知/], ['kyushu', /九州|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島/], ['okinawa', /沖縄/],
];

export function parseLifeRequest(input) {
  const text = String(input || '').normalize('NFKC');
  const request = { category: null, signals: 0, sim: {}, hikari: {}, card: {} };
  for (const [id, re] of LIFE_CATEGORY_RULES) if (re.test(text)) { request.category = id; request.signals += 5; break; }
  if (!request.category && LIFE_WORDS.test(text)) request.signals += 3;
  let heard = false;
  const gb = text.match(/(\d{1,3})\s*GB/i);
  if (gb) { const n = Number(gb[1]); request.sim.usage = n <= 3 ? '3' : n <= 10 ? '10' : n <= 30 ? '30' : 'unlimited'; heard = true; }
  else if (/(無制限|大容量)/.test(text)) { request.sim.usage = 'unlimited'; heard = true; }
  else if (/動画をよく|動画もよく/.test(text)) { request.sim.usage = '30'; heard = true; }
  else if (/あまり使わない|少しだけ/.test(text)) { request.sim.usage = '3'; heard = true; }
  if (/(長電話|かけ放題|通話が多い)/.test(text)) { request.sim.calls = 'unlimited'; heard = true; }
  else if (/(短い通話|5分通話)/.test(text)) { request.sim.calls = '5min'; heard = true; }
  if (/(店舗|店頭)/.test(text)) { request.sim.support = 'store'; heard = true; }
  else if (/オンライン/.test(text)) { request.sim.support = 'online'; heard = true; }
  if (/(マンション|アパート|集合住宅)/.test(text)) { request.hikari.housing = 'mansion'; heard = true; }
  else if (/(戸建て|一戸建て)/.test(text)) { request.hikari.housing = 'house'; heard = true; }
  if (/(ドコモ|ahamo)/i.test(text)) { request.hikari.carrier = 'docomo'; heard = true; }
  else if (/(au|UQモバイル|UQ)/i.test(text)) { request.hikari.carrier = 'au'; request.sim.carrier = 'au'; heard = true; }
  else if (/(ソフトバンク|ワイモバイル)/.test(text)) { request.hikari.carrier = 'softbank'; request.sim.carrier = 'softbank'; heard = true; }
  else if (/(楽天モバイル|楽天)/.test(text)) { request.hikari.carrier = 'rakuten'; heard = true; }
  const area = AREA_RULES.find(([, re]) => re.test(text));
  if (area) { request.hikari.area = area[0]; heard = true; }
  if (/楽天/.test(text)) { request.card.ecosystem = 'rakuten'; heard = true; }
  else if (/(PayPay|ペイペイ|Yahoo)/i.test(text)) { request.card.ecosystem = 'paypay'; heard = true; }
  else if (/(ドコモ|dポイント)/.test(text)) { request.card.ecosystem = 'docomo'; heard = true; }
  else if (/(au|Ponta|ポンタ)/i.test(text)) { request.card.ecosystem = 'au'; heard = true; }
  else if (/(コンビニ|Vポイント)/.test(text)) { request.card.ecosystem = 'vpoint'; heard = true; }
  if (/(40歳以上|40代|50代|60代|70代)/.test(text)) { request.card.age = 'o40'; heard = true; }
  else if (/(39歳以下|10代|20代|30代)/.test(text)) { request.card.age = 'u39'; heard = true; }
  if (/還元率/.test(text)) { request.card.priority = 'rate'; heard = true; }
  else if (/(コンビニ|飲食店)/.test(text)) { request.card.priority = 'conveni'; heard = true; }
  else if (/(どこでも同じ|シンプル)/.test(text)) { request.card.priority = 'simple'; heard = true; }
  // A data-volume mention is specific to the SIM selector even without the word SIM.
  if (!request.category && request.sim.usage) request.category = 'sim';
  if (heard) request.signals += 1;
  return request;
}

const LIFE_TITLE = { sim: '格安SIM・スマホ料金', hikari: '光回線', card: 'クレジットカード', hoken: '保険の見直し' };
const USAGE_LABEL = { '3': '〜3GB', '10': '〜10GB', '30': '〜30GB', unlimited: '無制限・大容量' };
const CALLS_LABEL = { few: '通話はほとんどしない', '5min': '短い通話が多い', unlimited: '長電話もする' };
const SUPPORT_LABEL = { online: 'オンラインでOK', store: '店舗で相談したい' };
const HOUSING_LABEL = { house: '戸建て', mansion: 'マンション・アパート' };
const HIKARI_CARRIER_LABEL = { docomo: 'ドコモ・ahamo', au: 'au・UQモバイル', softbank: 'ソフトバンク・ワイモバイル', rakuten: '楽天モバイル', none: 'その他・格安SIM' };
const AREA_LABEL = { hokkaido: '北海道', tohoku: '東北', kanto: '関東', hokuriku: '北陸・甲信越', tokai: '東海', kansai: '関西', chugoku: '中国', shikoku: '四国', kyushu: '九州', okinawa: '沖縄' };
const ECOSYSTEM_LABEL = { none: '特になし', rakuten: '楽天', paypay: 'PayPay・Yahoo!', docomo: 'ドコモ・dポイント', au: 'au・Ponta', vpoint: 'コンビニ・Vポイント' };
const AGE_LABEL = { u39: '39歳以下', o40: '40歳以上' };
const CARD_PRIORITY_LABEL = { rate: '還元率', conveni: 'コンビニ・飲食店', simple: 'どこでも同じ還元' };

function lifeReply(text, previous) {
  const parsed = parseLifeRequest(text);
  const state = {
    category: parsed.category || previous?.category || null,
    sim: { ...previous?.sim, ...parsed.sim },
    hikari: { ...previous?.hikari, ...parsed.hikari },
    card: { ...previous?.card, ...parsed.card },
  };
  if (!state.category) {
    return {
      message: { role: 'assistant', domain: 'life', text: ['通信・お金の見直しですね。何を見直すかで、比べる条件が変わります。近いものを選んでください。'],
        chips: ['スマホ代を安くしたい', '光回線を安くしたい', 'クレジットカードを見直したい', '保険を見直したい'] },
      state,
    };
  }
  const category = state.category;
  const summary = [LIFE_TITLE[category]];
  let selectorUrl; let lines; let chips;
  if (category === 'sim') {
    const sim = state.sim;
    const params = new URLSearchParams({ usage: sim.usage || '10', support: sim.support || 'online', calls: sim.calls || 'few' });
    if (sim.carrier) params.set('carrier', sim.carrier);
    selectorUrl = '/sim/?' + params + '#selector';
    if (sim.usage) summary.push(USAGE_LABEL[sim.usage]);
    if (sim.calls) summary.push(CALLS_LABEL[sim.calls]);
    if (sim.support) summary.push(SUPPORT_LABEL[sim.support]);
    lines = ['スマホ代の見直しですね。データ量・通話・サポートの条件で、主要9社の公式料金から月額の安いプランを順に並べられます。',
      '料金は税込・割引前の基本料金です（通話料・オプション・端末代は含みません）。申込前に各社の公式サイトで最新の条件を確認してください。'];
    chips = [...(sim.usage !== '3' ? ['〜3GBで十分'] : []), ...(sim.usage !== '30' ? ['〜30GB使いたい'] : []),
      ...(sim.support !== 'store' ? ['店舗で相談したい'] : []), '光回線も見直したい'];
  } else if (category === 'hikari') {
    const hikari = state.hikari;
    const params = new URLSearchParams({ housing: hikari.housing || 'house', carrier: hikari.carrier || 'docomo', area: hikari.area || 'kanto' });
    selectorUrl = '/hikari/?' + params + '#selector';
    if (hikari.housing) summary.push(HOUSING_LABEL[hikari.housing]);
    if (hikari.carrier) summary.push('スマホは' + HIKARI_CARRIER_LABEL[hikari.carrier]);
    if (hikari.area) summary.push(AREA_LABEL[hikari.area]);
    lines = ['光回線の見直しですね。住まい・地域・使っているスマホとのセット割から、提供エリアに合う回線を並べられます。',
      '月額は標準プランの目安（税込）です。キャッシュバック・工事費・契約期間で実質負担は大きく変わるため、申込前に公式の条件を確認してください。'];
    chips = [...(hikari.housing !== 'mansion' ? ['マンションに住んでいる'] : ['戸建てに住んでいる']),
      ...(hikari.carrier !== 'docomo' ? ['スマホはドコモ'] : []), ...(hikari.carrier !== 'au' ? ['スマホはau'] : []), 'スマホ代も見直したい'];
  } else if (category === 'card') {
    const card = state.card;
    const params = new URLSearchParams({ ecosystem: card.ecosystem || 'none', age: card.age || 'u39', priority: card.priority || 'rate' });
    selectorUrl = '/card/?' + params + '#selector';
    if (card.ecosystem) summary.push(ECOSYSTEM_LABEL[card.ecosystem]);
    if (card.age) summary.push(AGE_LABEL[card.age]);
    if (card.priority) summary.push(CARD_PRIORITY_LABEL[card.priority] + '重視');
    lines = ['クレジットカードの見直しですね。年会費無料の主要カードを、基本還元率とよく使うサービス・年齢条件で比べられます。',
      '還元率は通常利用時の基本値です。キャンペーンや「最大◯%」の上乗せは条件つきのため、各社公式で確認してください。'];
    chips = [...(card.ecosystem !== 'rakuten' ? ['よく使うのは楽天'] : []), ...(card.priority !== 'rate' ? ['還元率で選びたい'] : []),
      ...(card.ecosystem !== 'vpoint' ? ['コンビニでよく使う'] : []), 'スマホ代も見直したい'];
  } else {
    selectorUrl = '/hoken/';
    lines = ['保険の見直しですね。保険はランキングで選ぶのではなく、必要な保障を整理してから比べるのが先です。整理の手順と、無料保険相談の使い方をまとめています。'];
    chips = ['スマホ代を安くしたい', '光回線を安くしたい', 'クレジットカードを見直したい'];
  }
  return {
    message: { role: 'assistant', domain: 'life', text: lines, summary, selectorUrl, chips },
    state,
  };
}

export function siteReply(input, state = {}, { section = 'site', now = new Date(), config = travelLinkConfig() } = {}) {
  const text = String(input || '').trim().slice(0, 400);
  if (!text) return { message: welcomeMessage(section), state };
  if (/^(リセット|最初から|やり直)/.test(text)) return { message: { ...welcomeMessage(section), text: ['会話をリセットしました。旅行・お買い物・Webサービス選び、なんでも相談してください。'] }, state: {} };
  if (/^(こんにちは|こんばんは|おはよう|はじめまして|hello|hi)\W*$/i.test(text) || /(何ができ|使い方|ヘルプ)/.test(text)) {
    return { message: { ...welcomeMessage(section), text: ['Vivlicaの条件検索アシスタントです。入力条件に合う掲載候補を探します。'],
      bullets: ['旅行：「12月に3泊で温泉とグルメ」「パリの航空券」→ 旅先提案・モデルコース・航空券/ホテル比較', 'お買い物：「1万円以下のワイヤレスイヤホン」「母の日のプレゼント」→ 楽天市場から条件に合う商品', 'Webサービス：「ネットショップを無料で始めたい」→ 目的と予算に合うサービス比較', '固定費の見直し：「スマホ代を安くしたい」「光回線を安くしたい」→ 条件に合う料金・プランの比較'] }, state };
  }
  if (/^(ありがとう|サンキュー|助か)/.test(text)) return { message: { role: 'assistant', domain: 'site', text: ['どういたしまして！ほかにも気になることがあれば気軽にどうぞ。'], chips: SITE_CHIPS[section] || SITE_CHIPS.site }, state };

  const { domain } = routeQuery(text, { section, previous: state.domain || null });
  if (domain === 'travel') {
    const { message, state: travel } = conciergeReply(text, state.travel || {}, { now, config });
    return { message: { ...message, domain: 'travel' }, state: { ...state, domain, travel } };
  }
  if (domain === 'products') {
    const { message, state: products } = productsReply(text, state.products || null);
    return { message, state: { ...state, domain, products } };
  }
  if (domain === 'tools') {
    const { message, state: tools } = toolsReply(text, state.tools || null);
    return { message, state: { ...state, domain, tools } };
  }
  if (domain === 'life') {
    const { message, state: life } = lifeReply(text, state.life || null);
    return { message, state: { ...state, domain, life } };
  }
  return {
    message: { role: 'assistant', domain: 'site', text: ['ご相談の内容をもう少し教えてください。旅行・お買い物・Webサービス選び・固定費の見直しのどれに近いですか？'], chips: SITE_CHIPS.site },
    state,
  };
}
