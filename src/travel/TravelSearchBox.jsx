import { useId, useMemo, useState } from 'react';
import { DESTINATION_CATALOG } from './destinations.js';
import { COUNTRY_INDEX, countryByCode, flagOf } from './countries.js';
import { describeMatch, searchTravel } from './search.js';
import { openConcierge } from '../shared/conciergeActions.js';

const RECENT_KEY = 'hikaku-travel-recent';
const POPULAR = ['kyoto', 'sapporo', 'naha', 'seoul', 'taipei', 'bangkok', 'honolulu', 'paris'];
const getCity = id => DESTINATION_CATALOG.find(d => d.id === id);

function readRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(id => getCity(id)).slice(0, 5); } catch { return []; }
}
function saveRecent(id) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter(x => x !== id)].slice(0, 5))); } catch { /* storage unavailable */ }
}

function describeFilters(filters) {
  const parts = [
    ...filters.countries.map(code => countryByCode(code)?.name || code),
    ...filters.regions,
    ...(filters.area ? [filters.area === 'domestic' ? '国内' : '海外'] : []),
  ];
  return parts.join('・');
}

// World destination combobox: kana / romaji / typo tolerant, countries, themes, landmarks.
export default function TravelSearchBox({ onDestination, onScope, onExternal }) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState(readRecent);

  const options = useMemo(() => {
    const q = query.trim();
    if (!q) {
      const ids = [...new Set([...recent, ...POPULAR])].slice(0, 8);
      return ids.map(id => ({ type: 'destination', d: getCity(id), hint: recent.includes(id) ? '最近の検索' : '人気' }));
    }
    const result = searchTravel(q);
    const out = result.destinations.slice(0, 6).map(hit => ({ type: 'destination', d: hit.destination, hint: describeMatch(hit) }));
    for (const hit of result.countries.slice(0, 3)) {
      const count = DESTINATION_CATALOG.filter(d => d.country === hit.country.code).length;
      out.push({ type: 'scope', key: 'c' + hit.country.code, emoji: flagOf(hit.country.code) || '🌐', label: hit.country.name,
        hint: count ? `${count}都市を見る` : '予約サイトで探す', scope: count ? { label: hit.country.name, countries: [hit.country.code] } : null, external: count ? null : hit.country.name });
    }
    if (result.filters && !result.filters.destinations.length) {
      const f = result.filters;
      const where = describeFilters(f);
      const what = f.interests.length ? '条件に合う' : '';
      out.push({ type: 'scope', key: 'f', emoji: '🧭', label: `「${q}」${what}旅先を一覧で見る`, hint: where || '条件で絞り込み',
        scope: { label: q, countries: f.countries, regions: f.regions, area: f.area, interests: f.interests } });
    }
    for (const g of result.groups.slice(0, 2)) out.push({ type: 'scope', key: 'g' + g.word, emoji: '🗺️', label: g.word, hint: `${g.count}都市`, scope: { label: g.word, regions: g.regions || [], countries: g.countries || [], area: g.area || null } });
    for (const t of result.themes.slice(0, 2)) out.push({ type: 'scope', key: 't' + t.id, emoji: t.emoji, label: t.label, hint: `テーマ・${t.count}都市`, scope: { label: t.label, interests: [t.id] } });
    // Phrases and wishes ("癒されたい", "子連れで近場") are better answered as a conversation.
    const ask = { type: 'ask', key: 'a', emoji: '✳', label: `「${q}」をAIコンシェルジュに相談`, hint: '曖昧な希望もOK', ask: q };
    if (/[ぁ-ん]{2,}/.test(q) || q.length >= 8 || result.mode !== 'direct') out.splice(Math.min(out.length, result.destinations.length ? 3 : 0), 0, ask);
    else out.push(ask);
    out.push({ type: 'external', key: 'x', emoji: '🔎', label: `「${q}」を予約サイト・地図で検索`, hint: '掲載外の場所も世界中どこでも', external: q });
    return out;
  }, [query, recent]);

  function choose(option) {
    if (!option) return;
    if (option.type === 'destination') { saveRecent(option.d.id); setRecent(readRecent()); onDestination(option.d); }
    else if (option.scope) onScope(option.scope);
    else if (option.ask) openConcierge(option.ask);
    else if (option.external) onExternal(option.external);
    setQuery('');
    setOpen(false);
    setActive(0);
  }
  function onKeyDown(e) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(i => (i + 1) % options.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive(i => (i - 1 + options.length) % options.length); }
    else if (e.key === 'Escape') setOpen(false);
  }
  function onSubmit(e) {
    e.preventDefault();
    if (!query.trim()) { setOpen(true); return; }
    choose(options[active] || options[0]);
  }
  const optionId = index => `${listId}-opt-${index}`;
  const showList = open && options.length > 0;

  return <form className="tvx-search tvw-search" role="search" onSubmit={onSubmit}>
    <label htmlFor={listId + '-input'}>どこに行きたいですか？ <small>都市・国・名所・やりたいこと、なんでもOK</small></label>
    <div className="tvx-search-control">
      <span aria-hidden="true">⌕</span>
      <input id={listId + '-input'} type="search" value={query} autoComplete="off" enterKeyHint="search"
        role="combobox" aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={showList ? optionId(active) : undefined}
        placeholder="例：バリ島、タイのビーチ、エッフェル塔、温泉…"
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={onKeyDown} />
      <button type="submit">検索 <span aria-hidden="true">→</span></button>
    </div>
    {showList && <ul className="tvw-options" id={listId} role="listbox" aria-label="検索候補">
      {!query.trim() && <li className="tvw-options-heading" role="presentation">{recent.length ? '最近の検索・人気の旅先' : '人気の旅先'}</li>}
      {options.map((option, index) => <li key={option.type === 'destination' ? option.d.id : option.key} id={optionId(index)} role="option" aria-selected={index === active}
        className={'tvw-option tvw-option-' + option.type + (index === active ? ' active' : '')}
        onMouseDown={e => e.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(option)}>
        {option.type === 'destination'
          ? <><span className="tvw-option-emoji" aria-hidden="true">{option.d.emoji}</span>
            <span className="tvw-option-body"><strong>{option.d.name}</strong><small>{flagOf(option.d.country)} {option.d.area === 'domestic' ? '国内・' + option.d.region : (countryByCode(option.d.country)?.name || option.d.region)}</small></span>
            {option.hint && <span className="tvw-option-hint">{option.hint}</span>}</>
          : <><span className="tvw-option-emoji" aria-hidden="true">{option.emoji}</span>
            <span className="tvw-option-body"><strong>{option.label}</strong></span>
            <span className="tvw-option-hint">{option.hint}</span></>}
      </li>)}
    </ul>}
    <p className="tvw-search-foot">{DESTINATION_CATALOG.length}都市のモデルコース＋{COUNTRY_INDEX.length}の国と地域。掲載外の場所も予約サイト・地図で検索できます。</p>
  </form>;
}
