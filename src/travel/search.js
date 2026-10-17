// Deterministic, offline travel search: kana/romaji/English aliases, typo tolerance,
// country / region / theme understanding. No external API and no query logging.
import { DESTINATION_CATALOG, INTERESTS } from './destinations.js';
import { COUNTRY_INDEX } from './countries.js';

const SEPARATORS = /[\s・･／/、,，.。!?！？()（）「」『』[\]【】\-‐－ー〜~'’"＆&+]/g;
const KATAKANA = /[ァ-ヶ]/g;

export function normalizeText(value = '', { foldKana = true } = {}) {
  const text = String(value).normalize('NFKC').toLocaleLowerCase('ja-JP');
  return (foldKana ? text.replace(KATAKANA, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)) : text)
    .replace(/ゔぁ/g, 'ば').replace(/ゔぃ/g, 'び').replace(/ゔぇ/g, 'べ').replace(/ゔぉ/g, 'ぼ').replace(/ゔ/g, 'ぶ')
    // Strip Latin accents (Cancún → cancun) while keeping Japanese voiced marks intact.
    .normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
    .replace(SEPARATORS, '').trim();
}
const isAscii = s => /^[a-z0-9]+$/.test(s);

// Optimal string alignment distance (Levenshtein + adjacent transposition).
export function editDistance(a, b) {
  const x = Array.from(a), y = Array.from(b);
  if (Math.abs(x.length - y.length) > 2) return 3;
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[x.length][y.length];
}

export const THEME_KEYWORDS = Object.freeze({
  beach: ['ビーチ', '海', '海辺', 'リゾート', '南国', '島', '離島', 'シュノーケリング', 'ダイビング', 'サンゴ', '珊瑚', 'マリン', '水上ヴィラ', 'beach', 'resort'],
  relax: ['温泉', '癒し', '癒やし', '癒され', '癒やされ', 'リフレッシュ', '息抜き', 'スパ', 'のんびり', 'ゆっくり', 'サウナ', 'リラックス', '静か', 'spa', 'onsen'],
  food: ['グルメ', '食べ歩き', '食', '屋台', '料理', '美食', 'ワイン', 'カフェ', 'スイーツ', 'ラーメン', '海鮮', '夜市', 'food', 'gourmet'],
  history: ['歴史', '世界遺産', '遺跡', '寺', '寺院', '神社', '城', '文化', '古都', '宮殿', 'history'],
  nature: ['自然', '絶景', '景色', '山', 'ハイキング', 'トレッキング', 'オーロラ', '国立公園', '滝', '湖', '氷河', '紅葉', '花', '桜', '花見', '雪', '雪景色', '星空', 'nature', 'hiking'],
  city: ['街歩き', '都会', '都市', '夜景', '散策', '街', 'city'],
  shopping: ['買い物', 'ショッピング', 'ブランド', 'アウトレット', 'お土産', 'shopping'],
  art: ['美術館', 'アート', '建築', '博物館', 'ミュージアム', '芸術', '絵画', 'art', 'museum'],
  family: ['家族', '子供', '子ども', 'こども', '子連れ', 'キッズ', 'テーマパーク', '動物園', '水族館', 'family', 'kids'],
});

// keyword → regions and/or countries. Regions match DESTINATION_CATALOG region labels.
export const PLACE_GROUPS = Object.freeze({
  'アジア': { regions: ['東アジア', '東南アジア', '南アジア'] }, 'asia': { regions: ['東アジア', '東南アジア', '南アジア'] },
  '東アジア': { regions: ['東アジア'] }, '東南アジア': { regions: ['東南アジア'] }, '南アジア': { regions: ['南アジア'] },
  '中東': { regions: ['中東'] }, 'ヨーロッパ': { regions: ['ヨーロッパ'] }, '欧州': { regions: ['ヨーロッパ'] }, 'europe': { regions: ['ヨーロッパ'] },
  '北欧': { countries: ['FI', 'DK', 'IS', 'SE', 'NO'] }, '南欧': { countries: ['IT', 'ES', 'PT', 'GR', 'HR', 'MT'] },
  '東欧': { countries: ['CZ', 'HU', 'PL', 'SK', 'RO', 'BG', 'HR'] }, '西欧': { countries: ['FR', 'GB', 'NL', 'BE', 'DE', 'CH', 'AT', 'IE'] },
  '北米': { regions: ['北米'] }, '北アメリカ': { regions: ['北米'] }, '中南米': { regions: ['中南米'] }, '南米': { regions: ['中南米'] },
  '中米': { regions: ['中南米'] }, '南アメリカ': { regions: ['中南米'] }, 'カリブ': { regions: ['中南米'] },
  'オセアニア': { regions: ['オセアニア'] }, '南太平洋': { regions: ['オセアニア', 'ハワイ・グアム'] }, 'アフリカ': { regions: ['アフリカ'] },
  'ハワイ・グアム': { regions: ['ハワイ・グアム'] }, 'ミクロネシア': { regions: ['ハワイ・グアム'] },
  '関東': { regions: ['関東'] }, '首都圏': { regions: ['関東'] }, '関西': { regions: ['関西'] }, '近畿': { regions: ['関西'] },
  '北海道': { regions: ['北海道'] }, '東北': { regions: ['東北'] }, '北陸': { regions: ['北陸・甲信越'] }, '甲信越': { regions: ['北陸・甲信越'] },
  '東海': { regions: ['東海'] }, '中部': { regions: ['北陸・甲信越', '東海'] }, '中国地方': { regions: ['中国・四国'] }, '四国': { regions: ['中国・四国'] },
  '九州': { regions: ['九州'] }, '沖縄': { regions: ['沖縄'] },
});
export const AREA_KEYWORDS = Object.freeze({ '国内': 'domestic', '国内旅行': 'domestic', '海外': 'overseas', '海外旅行': 'overseas', 'abroad': 'overseas', 'overseas': 'overseas' });

const aliasCache = new WeakMap();
function destinationKeys(d) {
  if (!aliasCache.has(d)) aliasCache.set(d, [...new Set([d.id, d.name, d.nameEn, ...(d.aliases || [])].filter(Boolean).map(normalizeText))].filter(Boolean));
  return aliasCache.get(d);
}
// Landmarks and descriptions are searchable too (エッフェル塔 → パリ, ワイナリー → …).
const spotCache = new WeakMap();
function spotEntries(d) {
  if (!spotCache.has(d)) {
    const spots = [...new Set(Object.values(d.routes || {}).flat())];
    spotCache.set(d, [d.tagline, ...spots].filter(Boolean).map(text => ({ text, key: normalizeText(text) })));
  }
  return spotCache.get(d);
}
export function findSpot(d, query) {
  const q = normalizeText(query);
  if (Array.from(q).length < 2) return null;
  return spotEntries(d).find(entry => entry.key.includes(q))?.text || null;
}
const COUNTRY_KEYS = new Map(COUNTRY_INDEX.map(c => [c.code, [...new Set(c.aliases.map(normalizeText))].filter(Boolean)]));

function aliasScore(q, keys) {
  let best = { score: 0, how: '' };
  const take = (score, how) => { if (score > best.score) best = { score, how }; };
  const qLen = Array.from(q).length;
  for (const key of keys) {
    const kLen = Array.from(key).length;
    if (key === q) { take(100, 'exact'); continue; }
    // Two-letter Latin aliases (la, ny, kl…) only count as exact matches.
    if (isAscii(key) && kLen <= 2) continue;
    if (key.startsWith(q)) take(70 + Math.round(20 * qLen / kLen), 'prefix');
    else if (qLen >= (isAscii(q) ? 3 : 2) && key.includes(q)) take(55 + Math.round(10 * qLen / kLen), 'partial');
    else if (!isAscii(key) && kLen >= 2 && q.includes(key)) take(48, 'contains');
    else if (qLen >= 3) {
      const limit = qLen >= 7 ? 2 : 1;
      const dist = editDistance(q, key);
      if (dist <= limit) take(42 - dist * 4, 'fuzzy');
      else if (qLen >= 4 && kLen > qLen && editDistance(q, key.slice(0, qLen)) <= 1) take(34, 'fuzzy');
    }
  }
  return best;
}

// Longest-keyword-first scan of free text (used by the search box and the concierge).
// Katakana is NOT folded here: "タイ" (Thailand) must not fire inside "見たい".
// Hiragana spellings of 3+ characters are added separately (そうる, ばんこく…).
let lexicon = null;
function buildLexicon(catalog) {
  const entries = [];
  const seen = new Set();
  const add = (raw, kind, value, priority) => {
    const exact = normalizeText(raw, { foldKana: false });
    const folded = normalizeText(raw);
    for (const key of folded !== exact && Array.from(folded).length >= 3 ? [exact, folded] : [exact]) {
      if (!key || Array.from(key).length < (isAscii(key) ? 3 : 1) || seen.has(kind + key + value)) continue;
      seen.add(kind + key + value);
      entries.push({ key, kind, value, priority, ascii: isAscii(key) });
    }
  };
  for (const [word, area] of Object.entries(AREA_KEYWORDS)) add(word, 'area', area, 5);
  for (const [word, group] of Object.entries(PLACE_GROUPS)) add(word, 'group', group, 4);
  for (const c of COUNTRY_INDEX) for (const a of c.aliases) add(a, 'country', c.code, 3);
  for (const d of catalog) for (const a of [d.id, d.name, d.nameEn, ...(d.aliases || [])]) if (a && Array.from(normalizeText(a)).length >= 2) add(a, 'destination', d.id, 2);
  for (const [interest, words] of Object.entries(THEME_KEYWORDS)) for (const word of words) add(word, 'theme', interest, 1);
  entries.sort((a, b) => b.key.length - a.key.length || b.priority - a.priority);
  return entries;
}

export function scanTravelText(text, catalog = DESTINATION_CATALOG) {
  if (!lexicon || lexicon.catalog !== catalog) lexicon = { catalog, entries: buildLexicon(catalog) };
  const result = { destinations: [], countries: [], regions: [], interests: [], area: null, matched: [], themeWords: [] };
  const push = (list, value) => { if (!list.includes(value)) list.push(value); };
  const apply = entry => {
    result.matched.push(entry.key);
    if (entry.kind === 'area') result.area = entry.value;
    else if (entry.kind === 'group') {
      for (const r of entry.value.regions || []) push(result.regions, r);
      for (const c of entry.value.countries || []) push(result.countries, c);
    } else if (entry.kind === 'country') push(result.countries, entry.value);
    else if (entry.kind === 'destination') push(result.destinations, entry.value);
    else { push(result.interests, entry.value); push(result.themeWords, entry.key); }
  };
  const norm = normalizeText(text, { foldKana: false });
  const used = Array(norm.length).fill(false);
  let i = 0;
  const entries = lexicon.entries;
  while (i < entries.length) {
    // Same-length keys that are identical (e.g. シンガポール as city and country) share one span.
    let j = i;
    while (j < entries.length && entries[j].key === entries[i].key) j++;
    const group = entries.slice(i, j);
    if (!group[0].ascii) {
      const key = group[0].key;
      let at = norm.indexOf(key);
      while (at !== -1) {
        if (!used.slice(at, at + key.length).some(Boolean)) {
          used.fill(true, at, at + key.length);
          group.forEach(apply);
          break;
        }
        at = norm.indexOf(key, at + 1);
      }
    }
    i = j;
  }
  // Latin keywords must match whole words (so "rome" never fires inside "romeo").
  const words = String(text).normalize('NFKC').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) || [];
  const grams = new Set();
  for (let a = 0; a < words.length; a++) for (let n = 1; n <= 3 && a + n <= words.length; n++) grams.add(words.slice(a, a + n).join(''));
  for (const entry of entries) if (entry.ascii && grams.has(entry.key)) apply(entry);
  return result;
}

const hasFilters = f => f.destinations.length || f.countries.length || f.regions.length || f.interests.length || f.area;

export function filterByScan(filters, catalog = DESTINATION_CATALOG) {
  if (filters.destinations.length) return filters.destinations.map(id => catalog.find(d => d.id === id)).filter(Boolean);
  return catalog.filter(d =>
    (!filters.area || d.area === filters.area) &&
    (!(filters.countries.length || filters.regions.length) || filters.countries.includes(d.country) || filters.regions.includes(d.region)) &&
    (!filters.interests.length || filters.interests.some(i => d.interests.includes(i))))
    .sort((a, b) => filters.interests.filter(i => b.interests.includes(i)).length - filters.interests.filter(i => a.interests.includes(i)).length);
}

export function searchTravel(query, { catalog = DESTINATION_CATALOG } = {}) {
  const q = normalizeText(query);
  const empty = { query, destinations: [], countries: [], themes: [], groups: [], filters: null, mode: 'empty' };
  if (!q) return empty;

  let countries = COUNTRY_INDEX.map(c => ({ country: c, ...aliasScore(q, COUNTRY_KEYS.get(c.code)) }))
    .filter(x => x.score >= 55).sort((a, b) => b.score - a.score);
  const scored = new Map();
  const keep = (destination, score, how, spot = null) => {
    const prev = scored.get(destination.id);
    if (!prev || prev.score < score) scored.set(destination.id, { destination, score, how, spot });
  };
  for (const d of catalog) {
    const hit = aliasScore(q, destinationKeys(d));
    if (hit.score >= 34) keep(d, hit.score, hit.how);
    const country = countries.find(x => x.score >= 70 && x.country.code === d.country);
    if (country) keep(d, 60 + Math.round(country.score * 0.35), 'country');
    const spot = findSpot(d, query);
    if (spot) keep(d, 63, 'spot', spot);
  }

  const themes = INTERESTS.filter(t => [t.label, ...(THEME_KEYWORDS[t.id] || [])].some(w => {
    const k = normalizeText(w);
    return k === q || (Array.from(q).length >= 2 && k.startsWith(q));
  })).map(t => ({ ...t, count: catalog.filter(d => d.interests.includes(t.id)).length }));
  const groupFilter = group => ({ destinations: [], countries: group.countries || [], regions: group.regions || [], interests: [], area: group.area || null });
  const groups = Object.entries({ ...PLACE_GROUPS, ...Object.fromEntries(Object.entries(AREA_KEYWORDS).map(([k, v]) => [k, { area: v }])) })
    .filter(([word]) => { const k = normalizeText(word); return k === q || (Array.from(q).length >= 2 && k.startsWith(q)); })
    .map(([word, group]) => ({ word, ...group, count: filterByScan(groupFilter(group), catalog).length }))
    .filter(g => g.count > 0);

  let filters = null;
  const best = Math.max(0, ...[...scored.values()].map(x => x.score));
  if (best < 60) {
    const scan = scanTravelText(query, catalog);
    if (hasFilters(scan)) {
      filters = scan;
      for (const d of filterByScan(scan, catalog)) {
        // Rank by how many of the typed keywords appear in the destination's own description.
        const textHits = scan.matched.filter(k => spotEntries(d).some(e => e.key.includes(k))).length;
        keep(d, scan.destinations.includes(d.id) ? 88 : 56 + Math.min(textHits, 3) * 3, 'filter');
      }
    }
  }
  for (const t of themes) for (const d of catalog) if (d.interests.includes(t.id)) keep(d, 50, 'theme');
  for (const g of groups) for (const d of filterByScan(groupFilter(g), catalog)) keep(d, 70, 'group');

  // An exact name match should not be buried under loose partial / typo matches.
  const exact = [...scored.values()].some(x => x.score === 100) || countries.some(x => x.score === 100);
  const floor = exact ? 64 : 0;
  countries = countries.filter(x => x.score >= floor).slice(0, 4);
  const destinations = [...scored.values()].filter(x => x.score >= floor)
    .sort((a, b) => b.score - a.score || (a.destination.area === b.destination.area ? 0 : a.destination.area === 'domestic' ? -1 : 1)
      || a.destination.name.localeCompare(b.destination.name, 'ja'));
  const mode = destinations.length || countries.length ? (filters ? 'filtered' : 'direct') : 'none';
  return { query, destinations, countries, themes, groups, filters, mode };
}

// Short label explaining why a result matched, shown next to suggestions.
export function describeMatch(hit) {
  if (!hit) return '';
  if (hit.how === 'spot' && hit.spot) return '「' + hit.spot + '」';
  return { fuzzy: 'もしかして', country: '国名で一致', filter: '条件に一致', theme: 'テーマに一致', group: 'エリアに一致' }[hit.how] || '';
}
