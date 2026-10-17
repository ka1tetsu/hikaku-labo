// Rule-based understanding of "which web tool should I use?" requests (no AI API).
// Ranking itself reuses the published, source-backed scoring in src/tools/score.js.
import { CATEGORIES, SERVICES } from '../tools/catalog.js';
import { rankServices } from '../tools/score.js';

const CATEGORY_RULES = [
  ['shop', /(ネットショップ|ネットショッピングを始|EC|通販サイト|オンラインショップ|物販|ハンドメイド|作品を売|商品を売|販売サイト|ショップを開|ショップを作|BASE|Shopify|ショッピファイ)/i],
  ['wordpress', /(WordPress|ワードプレス|ワープレ|ブログ|メディア運営|アフィリエイトサイト|レンタルサーバー|サーバー|エックスサーバー|XServer|Kinsta|キンスタ)/i],
  ['website', /((お店|会社|店舗|教室|サロン|事務所|病院|クリニック)の?(サイト|HP|ページ)|サイトを?(作|ほし|欲し)|ホームページ|HP|ウェブサイト|Webサイト|webサイト|サイトを作|サイト制作|サイト作成|ポートフォリオ|LP|ランディングページ|会社案内|店舗サイト|ノーコード|Wix|Studio|スタジオ)/i],
];
// Vague goals → most likely category (explained to the user, never silently forced).
const GOALS = [
  ['shop', /(副業で物販|自分のブランド|グッズ販売|作ったものを売)/, 'ものを売るならネットショップ'],
  ['wordpress', /(副業|ブログで稼|発信したい|記事を書|情報発信|SEOで集客)/, '記事で発信・集客するならWordPress'],
  ['website', /(起業|開業|独立|フリーランス|お店の集客|店の集客|会社のサイト|名刺代わり|作品を見せ)/, 'まずは事業の顔になるWebサイト'],
];
const TOOL_WORDS = /(ツール|サービス|作り方|始め方|開設|立ち上げ|ドメイン|集客|月額|無料で作)/;

export function parseToolsRequest(input) {
  const text = String(input || '').normalize('NFKC');
  const request = { category: null, budget: null, priority: null, goal: null, service: null, signals: 0 };
  for (const [id, re] of CATEGORY_RULES) if (re.test(text)) { request.category = id; request.signals += 5; break; }
  if (!request.category) {
    const goal = GOALS.find(([, re]) => re.test(text));
    if (goal) { request.category = goal[0]; request.goal = goal[2]; request.signals += 3; }
  }
  request.service = SERVICES.find(s => new RegExp(s.name.replace(/\s+/g, '\\s*'), 'i').test(text)) || null;
  if (request.service) request.signals += 4;
  if (TOOL_WORDS.test(text)) request.signals += 1;

  const yen = text.match(/月(?:額)?\s*(\d{3,6})\s*円/) || text.match(/(\d{3,6})\s*円\s*(?:以下|以内|まで)?\s*(?:\/|で)?\s*月/);
  if (/(無料|(?<!\d)0円|タダ|お金をかけ(ない|たくない))/.test(text)) request.budget = 'free';
  else if (yen) request.budget = Number(yen[1]) <= 2000 ? 'starter' : Number(yen[1]) <= 5000 ? 'standard' : 'flexible';
  else if (/(予算は気にしない|本格的|機能重視|機能を優先)/.test(text)) request.budget = 'flexible';

  if (/(簡単|初心者|はじめて|初めて|ノーコード|知識がない|苦手)/.test(text)) request.priority = 'easy';
  else if (/(安く|安い|費用|コスト|節約|手数料)/.test(text)) request.priority = 'cost';
  else if (/(デザイン|おしゃれ|オシャレ|かっこいい|きれい)/.test(text)) request.priority = 'design';
  else if (/(拡張|本格|大規模|海外|売上を伸ば|スケール|成長)/.test(text)) request.priority = 'scale';
  if (request.budget || request.priority) request.signals += 1;
  return request;
}

export function adviseTools(request) {
  const category = request.category || request.service?.category || null;
  if (!category) return { needsCategory: true, categories: CATEGORIES };
  const budget = request.budget || 'standard';
  const priority = request.priority || 'easy';
  const ranking = rankServices({ category, budget, priority });
  const params = new URLSearchParams({ category, budget, priority });
  return {
    needsCategory: false, category, budget, priority,
    categoryTitle: CATEGORIES.find(c => c.id === category)?.title || category,
    services: ranking.slice(0, 3),
    selectorUrl: '/tools/?' + params.toString() + '#selector',
  };
}
