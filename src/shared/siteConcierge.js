// Site-wide concierge for 比較ラボ: routes free text to travel, shopping or web-tool
// advice. Pure rule-based logic in the browser — no AI API, nothing sent to a server
// except the ordinary product search the shopping page already uses.
import { conciergeReply, parseTravelRequest } from '../travel/concierge.js';
import { travelLinkConfig } from '../travel/bookingLinks.js';
import { describeProductRequest, parseProductRequest } from './productAdvisor.js';
import { adviseTools, parseToolsRequest } from './toolsAdvisor.js';

const TRAVEL_WORDS = /(旅行|旅|観光|連れてって|お出かけ|出かけ|遊びに行|見に行|息抜き|バカンス|避暑|休暇|癒され|癒やされ|桜が見|雪が見|雪を見|景色|絶景|ホテル|旅館|宿|航空券|飛行機|フライト|ツアー|海外|国内旅行|世界遺産|観光地|行きたい|行くなら|ビザ|リゾート|温泉|ビーチ|モデルコース|泊|日帰り|連休|ゴールデンウィーク|夏休み|年末年始)/;
const FOLLOW_UP = /^(もっと|他の|ほかの|別の|それ|これ|あと|次|じゃあ|では|もう少し|やっぱり|高評価|評価|送料無料|安い順|もっと安く|続き)/;

export const SITE_CHIPS = {
  site: ['週末に行ける温泉旅行', '1万円以下のワイヤレスイヤホン', 'ネットショップを無料で始めたい', '母の日のプレゼント'],
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
    text: [`こんにちは！比較ラボのAIコンシェルジュです。${lead}旅行・お買い物・Webサービス選び、ざっくりした相談でも、具体的な条件でも大丈夫です。`],
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
  const scores = { travel: travelScore, products: product.signals, tools: tools.signals };
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

export function siteReply(input, state = {}, { section = 'site', now = new Date(), config = travelLinkConfig() } = {}) {
  const text = String(input || '').trim().slice(0, 400);
  if (!text) return { message: welcomeMessage(section), state };
  if (/^(リセット|最初から|やり直)/.test(text)) return { message: { ...welcomeMessage(section), text: ['会話をリセットしました。旅行・お買い物・Webサービス選び、なんでも相談してください。'] }, state: {} };
  if (/^(こんにちは|こんばんは|おはよう|はじめまして|hello|hi)\W*$/i.test(text) || /(何ができ|使い方|ヘルプ)/.test(text)) {
    return { message: { ...welcomeMessage(section), text: ['こんにちは！比較ラボのAIコンシェルジュです。次のような相談ができます。'],
      bullets: ['旅行：「12月に3泊で温泉とグルメ」「パリの航空券」→ 旅先提案・モデルコース・航空券/ホテル比較', 'お買い物：「1万円以下のワイヤレスイヤホン」「母の日のプレゼント」→ 楽天市場から条件に合う商品', 'Webサービス：「ネットショップを無料で始めたい」→ 目的と予算に合うサービス比較'] }, state };
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
  return {
    message: { role: 'assistant', domain: 'site', text: ['ご相談の内容をもう少し教えてください。旅行・お買い物・Webサービス選びのどれに近いですか？'], chips: SITE_CHIPS.site },
    state,
  };
}
