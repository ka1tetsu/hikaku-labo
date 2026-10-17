// Travel concierge that runs entirely in the browser: rule-based Japanese language
// understanding + the curated catalog. No LLM / external API, no messages sent to a
// server. It never invents prices, timetables, visa rules or availability — facts it
// cannot know are delegated to official sources and booking sites.
import { DESTINATION_CATALOG, INTERESTS } from './destinations.js';
import { countryByCode } from './countries.js';
import { findSpot, normalizeText, scanTravelText, searchTravel } from './search.js';
import { makeItinerary, rankPlanStyles } from './recommender.js';
import { ORIGINS, addDays, buildFlightLinks, buildPlaceLinks, buildStayLinks, isoDate, tripDates, travelLinkConfig } from './bookingLinks.js';

const KANJI_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function kanjiNumbers(text) {
  return text
    .replace(/([一二三四五六七八九])?十([一二三四五六七八九])?/g, (_, a, b) => String((a ? KANJI_DIGITS[a] : 1) * 10 + (b ? KANJI_DIGITS[b] : 0)))
    .replace(/[一二三四五六七八九](?=\s*(泊|日|人|名|週|万|時間|ヶ月|か月|カ月))/g, ch => String(KANJI_DIGITS[ch]));
}

const SEASONS = [
  [/(ゴールデンウィーク|GW|ＧＷ)/i, [5]], [/(年末年始|お正月|正月)/, [12, 1]], [/シルバーウィーク/, [9]], [/(夏休み|お盆)/, [8]],
  [/春/, [3, 4, 5]], [/夏/, [7, 8]], [/秋/, [9, 10, 11]], [/冬/, [12, 1, 2]],
];
const ORIGIN_WORDS = [
  ['OSA', '大阪|関西|関空|伊丹|京都|神戸'], ['NGO', '名古屋|中部|セントレア'], ['FUK', '福岡|博多'], ['SPK', '札幌|新千歳|北海道'],
  ['OKA', '沖縄|那覇'], ['SDJ', '仙台|宮城'], ['HIJ', '広島'], ['TYO', '東京|羽田|成田|首都圏|関東|横浜'],
];
const INTENTS = {
  flight: /(航空券|飛行機|フライト|直行便|LCC|エアー?チケット)/i,
  hotel: /(ホテル|宿泊先|宿を|宿の|宿は|旅館|泊まる|泊まれる)/,
  plan: /(プラン|モデルコース|日程|行程|旅程|スケジュール|回り方|ルート)/,
  budget: /(予算|費用|いくら|旅費|お金)/,
  season: /(いつ|時期|ベストシーズン|季節|天気|気候)/,
  visa: /(ビザ|入国|パスポート|査証|ESTA|eTA|ETA)/i,
  packing: /(持ち物|荷物|服装|準備)/,
  safety: /(治安|安全|危険)/,
  compare: /(比較|比べ|違い|どっち|どちら)/,
  more: /(他の|ほかの|別の|もっと|違うところ|他に|ほかに)/,
  similar: /(似た|似ている|同じような|みたいな所|みたいなところ)/,
  reset: /(リセット|最初から|やり直|クリア)/,
  thanks: /(ありがとう|サンキュー|助か)/,
  greeting: /^(こんにちは|こんばんは|おはよう|はじめまして|hello|hi)/i,
  help: /(使い方|何ができ|ヘルプ|help)/i,
};

export function parseTravelRequest(input, { now = new Date() } = {}) {
  const raw = String(input || '');
  const text = kanjiNumbers(raw.normalize('NFKC'));
  const slots = {};
  const intents = Object.keys(INTENTS).filter(key => INTENTS[key].test(text));

  // Departure city: "大阪発", "福岡から" — removed before destination scanning.
  let scanText = text;
  for (const [code, words] of ORIGIN_WORDS) {
    const m = text.match(new RegExp(`(${words})(空港)?\\s*(発|から|出発)`));
    if (m) { slots.origin = code; scanText = scanText.replace(m[0], ' '); break; }
  }

  const month = text.match(/(\d{1,2})\s*月(?!\s*\d+\s*日間)/);
  if (month && !/\d+\s*(ヶ|か|カ|ケ)月/.test(month[0]) && Number(month[1]) >= 1 && Number(month[1]) <= 12) slots.months = [Number(month[1])];
  else if (/来月/.test(text)) slots.months = [((now.getMonth() + 1) % 12) + 1];
  else if (/今月/.test(text)) slots.months = [now.getMonth() + 1];
  else for (const [re, months] of SEASONS) if (re.test(text)) { slots.months = months; break; }

  const nights = text.match(/(\d+)\s*泊/);
  const days = text.match(/(\d+)\s*日間/);
  const weeks = text.match(/(\d+)\s*週間/);
  if (nights) slots.nights = Number(nights[1]);
  else if (/日帰り/.test(text)) slots.nights = 0;
  else if (weeks) slots.nights = Number(weeks[1]) * 7 - 1;
  else if (days) slots.nights = Math.max(0, Number(days[1]) - 1);
  else if (/(週末|土日)/.test(text)) slots.nights = 1;
  else if (/連休/.test(text)) slots.nights = 2;
  if (slots.nights !== undefined) slots.nights = Math.min(14, slots.nights);

  const people = text.match(/(\d+)\s*(人|名)(?!\s*(あたり|当たり|\d))/);
  if (people) slots.travelers = Math.min(20, Math.max(1, Number(people[1])));
  else if (/(一人旅|ひとり旅|ソロ|1人旅)/.test(text)) slots.travelers = 1;
  else if (/(カップル|夫婦|二人旅|ふたり旅|ふたりで|2人旅|恋人|彼女と|彼氏と|新婚)/.test(text)) slots.travelers = 2;

  const man = text.match(/(\d+(?:\.\d+)?)\s*万/);
  const yen = text.match(/(\d{4,7})\s*円/);
  const amount = man ? Math.round(Number(man[1]) * 10000) : yen ? Number(yen[1]) : 0;
  if (amount >= 5000) {
    const perPerson = /(1人|一人|ひとり)\s*(あたり|当たり)/.test(text);
    const total = !perPerson && /(合計|全員|総額|みんなで|\d+\s*人で|ふたりで|家族で|二人で)/.test(text);
    slots.budget = { amount, scope: total ? 'total' : 'person' };
  }
  if (/(安く|安い|格安|節約|コスパ|お手頃|低予算|リーズナブル|激安)/.test(text)) slots.price = 'cheap';
  if (/(贅沢|高級|ラグジュアリー|ご褒美|ハネムーン|新婚旅行|記念日)/.test(text)) slots.price = 'luxury';

  const hours = text.match(/(\d+)\s*時間以内/);
  if (hours) slots.maxHours = Number(hours[1]);
  else if (/(近場|近い|近く|短時間|気軽|サクッと)/.test(text)) slots.maxHours = 6;

  if (/(のんびり|ゆったり|ゆっくり)/.test(text)) slots.pace = 'relaxed';
  else if (/(アクティブ|たくさん回|詰め込|効率よく|弾丸)/.test(text)) slots.pace = 'active';

  const scan = scanTravelText(scanText);
  if (scan.destinations.length) slots.destinations = scan.destinations;
  if (scan.countries.length) slots.countries = scan.countries.filter(c => c !== 'JP' || !scan.destinations.length);
  if (scan.countries.includes('JP') && !scan.destinations.length) { slots.area = 'domestic'; slots.countries = slots.countries.filter(c => c !== 'JP'); }
  if (scan.regions.length) slots.regions = scan.regions;
  if (scan.area) slots.area = scan.area;
  if (scan.interests.length) slots.interests = scan.interests;
  // Concrete wishes (オーロラ, ワイナリー, ペンギン…) rank places whose spots mention them.
  const places = new Set(scan.matched.filter(k => !scan.themeWords.includes(k)));
  const words = [...new Set([...scan.themeWords.filter(k => Array.from(k).length >= 2),
    ...(scanText.match(/[\u30a1-\u30ff]{3,}/g) || []).map(w => normalizeText(w, { foldKana: false })).filter(w => !places.has(w))])];
  const keywords = words.filter(word => DESTINATION_CATALOG.some(d => findSpot(d, word)));
  if (keywords.length) slots.keywords = keywords.slice(0, 5);
  if (/(家族|子連れ|子供|子ども|こども|キッズ)/.test(text)) slots.interests = [...new Set([...(slots.interests || []), 'family'])];
  for (const key of ['countries', 'regions']) if (slots[key] && !slots[key].length) delete slots[key];

  // Still nothing about where? Try the search engine (handles typos / landmarks).
  if (!slots.destinations && !slots.countries && !slots.regions && !slots.area) {
    const hit = searchTravel(scanText).destinations.find(x => x.score >= 63);
    if (hit) slots.destinations = [hit.destination.id];
  }
  return { slots, intents };
}

const LOCATION_KEYS = ['destinations', 'countries', 'regions', 'area'];
export function mergeSlots(previous = {}, next = {}) {
  const merged = { ...previous };
  if (LOCATION_KEYS.some(key => next[key])) for (const key of LOCATION_KEYS) delete merged[key];
  for (const [key, value] of Object.entries(next)) {
    merged[key] = key === 'interests' ? [...new Set([...(previous.interests || []), ...value])] : value;
  }
  return merged;
}

// --- Rough fit model -------------------------------------------------------------
// Used only to ORDER suggestions and print a coarse fit label. It never prints yen
// amounts, because real fares and room rates change daily.
const TRANSPORT_BAND = hours => (hours <= 1.5 ? 20000 : hours <= 3 ? 28000 : hours <= 4.5 ? 50000 : hours <= 6.5 ? 70000 : hours <= 8 ? 90000 : hours <= 11 ? 120000 : hours <= 15 ? 170000 : 220000);
const DAILY_BAND = [0, 9000, 13000, 18000, 25000, 35000];
export function budgetFit(destination, slots) {
  if (!slots.budget) return null;
  const nights = slots.nights ?? (destination.area === 'overseas' ? 3 : 2);
  const perPersonBudget = slots.budget.scope === 'total' ? slots.budget.amount / (slots.travelers || 2) : slots.budget.amount;
  const estimate = (destination.hours ? TRANSPORT_BAND(destination.hours) : 0) + (nights + 1) * DAILY_BAND[destination.costLevel];
  const ratio = estimate / Math.max(1, perPersonBudget);
  if (ratio <= 0.9) return { level: 'good', label: '◎ 予算内に収まりやすい' };
  if (ratio <= 1.15) return { level: 'ok', label: '○ 時期や宿の選び方で予算内も' };
  return { level: 'tight', label: '△ 予算オーバーの可能性' };
}

const monthLabel = months => months.map(m => m + '月').join('・');
const interestLabel = id => INTERESTS.find(i => i.id === id)?.label || id;

export function recommendTrips(slots = {}, { catalog = DESTINATION_CATALOG, exclude = [], limit = 3 } = {}) {
  const pool = catalog.filter(d => !exclude.includes(d.id)
    && (!slots.area || d.area === slots.area)
    && (!(slots.countries?.length || slots.regions?.length) || slots.countries?.includes(d.country) || slots.regions?.includes(d.region))
    && (!slots.maxHours || d.area === 'domestic' || d.hours <= slots.maxHours));
  // A concrete wish narrows the pool to places that actually offer it, when any do.
  const wishes = slots.keywords || [];
  const offering = wishes.length ? pool.filter(d => wishes.some(k => findSpot(d, k))) : [];
  const scored = (offering.length ? offering : pool).map(d => {
    let score = 0;
    const reasons = [];
    const spots = wishes.map(k => findSpot(d, k)).filter(Boolean);
    score += spots.length * 14;
    const spot = spots.find(text => text !== d.tagline);
    if (spot) reasons.push('「' + spot + '」');
    const hits = (slots.interests || []).filter(i => d.interests.includes(i));
    score += hits.length * 12;
    if (hits.length) reasons.push('テーマ一致：' + hits.map(interestLabel).join('・'));
    if (slots.months?.length) {
      const good = slots.months.some(m => d.bestMonths.includes(m));
      score += good ? 10 : -6;
      if (good) reasons.push(monthLabel(slots.months.filter(m => d.bestMonths.includes(m))) + 'は過ごしやすい時期の目安');
    }
    const fit = budgetFit(d, slots);
    if (fit) score += { good: 10, ok: 2, tight: -15 }[fit.level];
    if (slots.price === 'cheap') score += (3 - d.costLevel) * 4;
    if (slots.price === 'luxury') score += (d.costLevel - 3) * 4;
    if (slots.nights !== undefined && slots.nights <= 2 && d.hours > 8) { score -= 14; reasons.push('短い日程には移動が長め'); }
    else if (slots.nights !== undefined && slots.nights <= 3 && d.hours <= 5 && d.area === 'overseas') { score += 5; reasons.push('短い日程でも行きやすい距離'); }
    if (slots.maxHours && d.area === 'overseas') reasons.push(d.access);
    return { destination: d, score, reasons, fit };
  }).sort((a, b) => b.score - a.score || a.destination.hours - b.destination.hours || a.destination.name.localeCompare(b.destination.name, 'ja'));
  // Keep the shortlist varied: at most two picks from the same country.
  const picked = [];
  for (const item of scored) {
    if (picked.filter(p => p.destination.country === item.destination.country).length >= 2) continue;
    picked.push(item);
    if (picked.length >= limit) break;
  }
  return picked;
}

// First reasonable departure date inside the requested month (or ~1 month ahead).
export function departureFor(slots, now = new Date()) {
  if (!slots.months?.length) return tripDates({ nights: slots.nights ?? 2, today: now });
  const month = slots.months[0];
  const year = now.getFullYear() + (month < now.getMonth() + 1 || (month === now.getMonth() + 1 && now.getDate() > 10) ? 1 : 0);
  const depart = isoDate(new Date(year, month - 1, 10));
  return { depart, ret: addDays(depart, Math.max(1, slots.nights ?? 2)) };
}

function describeSlots(slots) {
  const out = [];
  if (slots.destinations?.length) out.push('行き先: ' + slots.destinations.map(id => DESTINATION_CATALOG.find(d => d.id === id)?.name).filter(Boolean).join('・'));
  if (slots.countries?.length) out.push('国: ' + slots.countries.map(c => countryByCode(c)?.name || c).join('・'));
  if (slots.regions?.length) out.push('エリア: ' + slots.regions.join('・'));
  if (slots.area) out.push(slots.area === 'domestic' ? '国内' : '海外');
  if (slots.months?.length) out.push(monthLabel(slots.months));
  if (slots.nights !== undefined) out.push(slots.nights === 0 ? '日帰り' : `${slots.nights}泊${slots.nights + 1}日`);
  if (slots.travelers) out.push(slots.travelers + '名');
  if (slots.budget) out.push((slots.budget.scope === 'total' ? '総予算 ' : '1人 ') + (slots.budget.amount / 10000).toLocaleString('ja-JP') + '万円');
  if (slots.interests?.length) out.push(slots.interests.map(interestLabel).join('・'));
  if (slots.price) out.push(slots.price === 'cheap' ? '費用重視' : 'ちょっと贅沢');
  if (slots.maxHours) out.push(`移動${slots.maxHours}時間以内`);
  if (slots.origin) out.push((ORIGINS.find(o => o.code === slots.origin)?.label || slots.origin) + '発');
  return out;
}

const pick = (list, seed) => list[Math.abs([...seed].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7)) % list.length];
const card = item => ({
  id: item.destination.id, name: item.destination.name, emoji: item.destination.emoji, region: item.destination.region,
  tagline: item.destination.tagline, access: item.destination.access,
  reasons: item.reasons.length ? item.reasons.slice(0, 3) : [item.destination.tagline],
  fit: item.fit?.label || null, best: monthLabel(item.destination.bestMonths),
});

function bookingFor(destination, slots, config, now) {
  const dates = departureFor(slots, now);
  const adults = slots.travelers || 2;
  return {
    flights: buildFlightLinks({ originCode: slots.origin || 'TYO', destination, depart: dates.depart, ret: dates.ret, adults, config }),
    stays: buildStayLinks({ destination, checkin: dates.depart, checkout: dates.ret, adults, rooms: Math.ceil(adults / 2), config }),
    dates,
  };
}

const HELP_CHIPS = ['12月に3泊、温泉とグルメ。予算1人10万円', '大阪発で近場の海外ビーチ', '家族4人で夏休みに沖縄', 'ヨーロッパで美術館巡り、1週間'];

export const CONCIERGE_WELCOME = Object.freeze({
  role: 'assistant',
  text: [
    `こんにちは！比較ラボトラベルの旅行コンシェルジュです。行きたい時期・日数・人数・予算・やりたいことを、ふだんの言葉で書いてください。国内外${DESTINATION_CATALOG.length}都市から候補を選び、モデルコースや航空券・ホテルの探し方まで案内します。`,
  ],
  chips: HELP_CHIPS,
});

export function conciergeReply(input, state = {}, { now = new Date(), config = travelLinkConfig(), catalog = DESTINATION_CATALOG } = {}) {
  const text = String(input || '').trim().slice(0, 400);
  const prev = { slots: state.slots || {}, shown: state.shown || [], focusId: state.focusId || null };
  const { slots: parsed, intents } = parseTravelRequest(text, { now });
  const has = key => intents.includes(key);

  if (has('reset')) return { message: { ...CONCIERGE_WELCOME, text: ['条件をリセットしました。新しい旅の希望を教えてください。'] }, state: { slots: {}, shown: [], focusId: null } };
  if (!text) return { message: CONCIERGE_WELCOME, state: prev };

  // A message carrying several conditions is a brand-new request; shorter ones refine.
  const fresh = Object.keys(parsed).filter(key => key !== 'origin' && key !== 'keywords').length >= 3;
  const slots = fresh ? { ...parsed } : mergeSlots(prev.slots, parsed);
  const understood = Object.keys(parsed).length > 0;
  if (has('thanks') && !understood) {
    return { message: { role: 'assistant', text: ['どういたしまして！ほかにも行き先の比較や、航空券・ホテルの探し方など気軽に聞いてください。良い旅を🌏'], chips: ['別の候補も見たい', '条件をリセット'] }, state: prev };
  }
  if ((has('greeting') || has('help')) && !understood) {
    return { message: { role: 'assistant', text: ['たとえば「12月に3泊で温泉とグルメ、予算は1人10万円」「大阪発で近場の海外ビーチ」のように書くと、条件に合う旅先を提案します。行き先が決まっていれば「バンコクのモデルコース」「パリの航空券」「ソウルのホテル」もどうぞ。'], chips: HELP_CHIPS }, state: prev };
  }

  const mentioned = (parsed.destinations || []).map(id => catalog.find(d => d.id === id)).filter(Boolean);
  if (has('compare') && mentioned.length >= 2) {
    const rows = mentioned.slice(0, 3).map(d => `${d.emoji} ${d.name}：${d.access}／おすすめ時期 ${monthLabel(d.bestMonths)}／旅費感 ${'¥'.repeat(d.costLevel)}／${d.interests.slice(0, 3).map(interestLabel).join('・')}`);
    return {
      message: { role: 'assistant', text: ['条件を並べて比べてみました（移動時間・旅費感は編集部の目安です）。'], bullets: rows,
        cards: mentioned.slice(0, 3).map(d => card({ destination: d, reasons: [d.tagline], fit: budgetFit(d, slots) })),
        chips: mentioned.slice(0, 2).map(d => d.name + 'のモデルコース'), summary: describeSlots(slots) },
      state: { slots, shown: prev.shown, focusId: null },
    };
  }

  // "Somewhere like this": reuse the focused destination's themes and area.
  const previous = catalog.find(d => d.id === prev.focusId) || null;
  if (has('similar') && (mentioned[0] || previous)) {
    const base = mentioned[0] || previous;
    const like = { ...slots, interests: base.interests.slice(0, 3), area: base.area };
    for (const key of ['destinations', 'countries', 'regions']) delete like[key];
    const recs = recommendTrips(like, { catalog, exclude: [base.id, ...prev.shown] });
    return {
      message: { role: 'assistant', text: [`${base.emoji} ${base.name}と同じく「${base.interests.slice(0, 3).map(interestLabel).join('・')}」を楽しめる旅先です。`],
        cards: recs.map(item => card(item)), summary: describeSlots(like), chips: recs.slice(0, 2).map(r => r.destination.name + 'のモデルコース') },
      state: { slots: like, shown: [...new Set([...prev.shown, ...recs.map(r => r.destination.id)])], focusId: null },
    };
  }

  // Focus a single destination when named now, or keep the current one for follow-ups
  // (dates, budget, people…) unless the user moves to a new place or other themes.
  const changesPlace = LOCATION_KEYS.some(k => parsed[k]) || has('more');
  const offTheme = parsed.interests && previous && !parsed.interests.some(i => previous.interests.includes(i));
  const focus = mentioned[0] || (previous && !changesPlace && !offTheme ? previous : null);
  if (focus) {
    const nextState = { slots, shown: prev.shown, focusId: focus.id };
    const nights = slots.nights ?? (focus.area === 'overseas' ? 3 : 2);
    const summary = describeSlots(slots);
    const fit = budgetFit(focus, slots);
    const chips = [`${focus.name}の航空券`, `${focus.name}のホテル`, `${focus.name}のベストシーズン`, '似た旅先を提案して'];
    if (has('flight') || has('hotel')) {
      const booking = bookingFor(focus, slots, config, now);
      const flightsOnly = has('flight') && !has('hotel');
      const staysOnly = has('hotel') && !has('flight');
      const lines = [`${focus.emoji} ${focus.name}への${flightsOnly ? '航空券' : staysOnly ? '宿泊先' : '航空券と宿'}を、${booking.dates.depart}〜${booking.dates.ret}・${slots.travelers || 2}名の条件で検索できるリンクを用意しました。日付や人数は各サイトで変更できます。`];
      if (!focus.flight && !staysOnly) lines.push(`${focus.name}は空港がない地域です（${focus.access}）。鉄道やバスでのアクセスがおすすめです。`);
      lines.push('表示される運賃・空室・キャンセル条件は各予約サイトで必ず確認してください。');
      return { message: { role: 'assistant', text: lines, links: { flights: staysOnly ? [] : booking.flights, stays: flightsOnly ? [] : booking.stays }, chips, summary, focusId: focus.id }, state: nextState };
    }
    if (has('season')) {
      return { message: { role: 'assistant', text: [`${focus.emoji} ${focus.name}の過ごしやすい時期の目安は ${monthLabel(focus.bestMonths)} です。`, `注意点：${focus.note}`, '気候は年によって変わるため、出発前に現地の天気予報も確認してください。'], chips, summary, focusId: focus.id }, state: nextState };
    }
    if (has('visa') || has('safety')) {
      return { message: { role: 'assistant', text: [
        focus.area === 'domestic' ? `${focus.name}は国内旅行なのでパスポートは不要です。注意点：${focus.note}` : `${focus.name}への入国条件（ビザ・電子渡航認証・パスポート残存期間など）や治安は変わることがあるため、ここでは断定しません。`,
        focus.area === 'domestic' ? '' : `メモ：${focus.note}`,
        focus.area === 'domestic' ? '' : '外務省 海外安全ホームページ（https://www.anzen.mofa.go.jp/）と渡航先の大使館の公式情報を確認し、「たびレジ」への登録もおすすめします。',
      ].filter(Boolean), chips, summary, focusId: focus.id }, state: nextState };
    }
    if (has('packing')) {
      const items = ['身分証・予約確認書（スクリーンショットも）', '常備薬・モバイルバッテリー'];
      if (focus.area === 'overseas') items.unshift('パスポート（残存期間を確認）', '海外旅行保険の加入・補償内容の確認', '電源プラグ形状・電圧の確認', 'クレジットカード（2枚以上あると安心）');
      if (focus.interests.includes('beach')) items.push('日焼け止め・ラッシュガード・サンダル');
      if (focus.interests.includes('nature')) items.push('歩きやすい靴・雨具・重ね着できる服');
      if (focus.routes.classic.some(s => /寺|モスク|教会|寺院|宮殿/.test(s))) items.push('寺院や宗教施設向けに肩・膝が隠れる服');
      return { message: { role: 'assistant', text: [`${focus.emoji} ${focus.name}旅行の持ち物チェックリストです。`], bullets: items, chips, summary, focusId: focus.id }, state: nextState };
    }
    if (has('budget') && !slots.budget) {
      return { message: { role: 'assistant', text: [`${focus.name}の費用は、宿のランクや時期で大きく変わります。予算の目安を教えてもらえれば（例：「1人15万円」）、この旅先が収まりやすいか判定します。`, 'ページ下の予算シミュレーターでも、宿泊費・交通費・食費を入力して合計を計算できます。'], chips: ['1人10万円', '1人20万円', `${focus.name}の航空券`], summary, focusId: focus.id, action: { type: 'planner', id: focus.id } }, state: nextState };
    }
    // Default: model itinerary.
    const style = rankPlanStyles(focus, { interests: slots.interests || [], pace: slots.pace || 'standard' })[0];
    const days = makeItinerary(focus, style.id, nights, slots.pace || 'standard');
    const intro = pick([`${focus.emoji} ${focus.name}、いいですね！`, `${focus.emoji} ${focus.name}の旅を組んでみました。`, `${focus.emoji} ${focus.name}なら、こんな過ごし方はいかがでしょう。`], text);
    const lines = [`${intro}「${style.label}」スタイルで${nights === 0 ? '日帰り' : `${nights}泊${nights + 1}日`}のモデルコースです。`, `アクセス：${focus.access}／おすすめ時期：${monthLabel(focus.bestMonths)}`];
    if (fit) lines.push(`予算との相性：${fit.label}（編集部の概算モデルによる目安で、実際の料金ではありません）`);
    if (slots.months?.length && !slots.months.some(m => focus.bestMonths.includes(m))) lines.push(`${monthLabel(slots.months)}はベストシーズンの目安から外れます。${focus.note}`);
    return { message: { role: 'assistant', text: lines, itinerary: { destinationId: focus.id, style: style.label, styleId: style.id, nights, pace: slots.pace || 'standard', days }, chips, summary, focusId: focus.id, action: { type: 'show', id: focus.id, styleId: style.id, nights, pace: slots.pace || 'standard' } }, state: nextState };
  }

  if (!understood && !has('more')) {
    // Looks like a place name we have no curated guide for: still searchable worldwide.
    if (text.length <= 24 && !/[?？。、]/.test(text) && /[\u30a0-\u30ff\u4e00-\u9fffA-Za-z]{2,}/.test(text)) {
      return { message: { role: 'assistant', text: [`「${text}」は編集部のモデルコースにまだ掲載していない場所です。情報を作り話で補うことはせず、宿・航空券・地図を各サイトで直接検索できるリンクを用意しました。`],
        links: { flights: [], stays: buildPlaceLinks(text, { config, nights: slots.nights ?? 2, adults: slots.travelers || 2 }) }, chips: HELP_CHIPS.slice(0, 2) }, state: prev };
    }
    return { message: { role: 'assistant', text: ['ごめんなさい、条件をうまく読み取れませんでした。行き先・時期・日数・予算・やりたいこと（例：ビーチ、温泉、世界遺産、美術館、グルメ）を含めて書いてみてください。'], chips: HELP_CHIPS }, state: prev };
  }

  const exclude = has('more') ? prev.shown : [];
  let wish = { ...slots };
  delete wish.destinations;
  let recs = recommendTrips(wish, { catalog, exclude });
  const relaxed = [];
  // A concrete wish (オーロラ, ワイナリー…) outranks an earlier area choice.
  const keywordHit = list => list.some(r => (wish.keywords || []).some(k => findSpot(r.destination, k)));
  if (wish.keywords?.length && !keywordHit(recs)) {
    const wide = { ...wish };
    for (const key of LOCATION_KEYS) delete wide[key];
    const alternative = recommendTrips(wide, { catalog, exclude });
    if (keywordHit(alternative)) { recs = alternative; wish = wide; relaxed.push('エリア'); }
  }
  for (const key of ['months', 'budget', 'maxHours', 'interests']) {
    if (recs.length) break;
    if (wish[key] === undefined) continue;
    const loose = { ...wish };
    delete loose[key];
    recs = recommendTrips(loose, { catalog, exclude });
    relaxed.push({ months: '時期', budget: '予算', maxHours: '移動時間', interests: 'テーマ' }[key]);
  }
  if (!recs.length) {
    return { message: { role: 'assistant', text: ['この条件で提案できる旅先が見つかりませんでした。エリアや条件を少し広げてみてください。'], chips: ['条件をリセット', ...HELP_CHIPS.slice(0, 2)], summary: describeSlots(slots) }, state: { slots, shown: prev.shown, focusId: null } };
  }
  const top = recs[0].destination;
  const lead = has('more')
    ? 'ほかの候補を探してみました。'
    : pick(['ご希望に合いそうな旅先を選びました。', '条件から、相性の良い旅先をピックアップしました。', 'こんな旅先はいかがでしょう？'], text);
  const lines = [lead];
  if (relaxed.length) lines.push(`※ ぴったりの候補がなかったため「${relaxed.join('・')}」の条件をゆるめています。`);
  if (wish.budget) lines.push('予算との相性は、移動距離と現地の物価感から出した概算モデルの目安です（実際の運賃・宿泊料金ではありません）。');
  return {
    message: { role: 'assistant', text: lines, cards: recs.map(item => card(item)), summary: describeSlots(wish),
      chips: [`${top.name}のモデルコース`, `${top.name}の航空券`, '他の候補も見たい', slots.price === 'cheap' ? 'もう少し贅沢に' : 'もっと安く'] },
    state: { slots, shown: [...new Set([...prev.shown, ...recs.map(r => r.destination.id)])], focusId: null },
  };
}

export { normalizeText };
