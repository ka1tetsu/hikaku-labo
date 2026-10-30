import { globalProviderTarget } from './searchLinkAdapter.js';

export function prepareProviderRows(providers, criteria = {}) {
  return providers.map(provider => {
    const target = globalProviderTarget(provider, criteria);
    return { provider, target, hasSearchHandoff: target.carriesSearch === true,
      transferredFields: target.transferredFields || [], priceJPY: null, priceStatus: 'not_fetched' };
  });
}
export function filterProviderRows(rows, { phrase = '', onlySearchReady = false, sort = 'handoff' } = {}) {
  const normalized = String(phrase).normalize('NFKC').toLocaleLowerCase('ja').trim();
  const filtered = rows.filter(row => {
    if (onlySearchReady && !row.hasSearchHandoff) return false;
    return !normalized || [row.provider.name, ...row.provider.capabilities].join(' ').normalize('NFKC').toLocaleLowerCase('ja').includes(normalized);
  });
  return filtered.sort((a, b) => {
    if (sort === 'name') return a.provider.name.localeCompare(b.provider.name, 'ja');
    return Number(b.hasSearchHandoff) - Number(a.hasSearchHandoff) ||
      a.provider.name.localeCompare(b.provider.name, 'ja');
  });
}
export function providerComparisonRows() {
  return [
    { label:'対応するサービス', get:row=>row.provider.capabilities.join(' / ') },
    { label:'検索条件の引継ぎ', get:row=>row.hasSearchHandoff ? row.transferredFields.join('・') || '一部のみ' : '予約先で再入力' },
    { label:'現在の料金', get:()=> '未取得：予約サイトで確認' },
    { label:'予約・決済', get:()=> '予約サイト側で手続き' },
  ];
}
