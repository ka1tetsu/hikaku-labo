// 検索性向上のための共通ユーティリティ
// - 人気キーワード（サジェスト元）
// - 検索履歴（localStorage 永続化）

export const POPULAR_KEYWORDS = [
    'iPhone 16 Pro',
    'Pixel 9',
    'Galaxy S24',
    'MacBook Air M3',
    'ゲーミングノート',
    '4K 有機ELテレビ',
    'ワイヤレスイヤホン ノイズキャンセリング',
    'ドラム式洗濯機',
    'ロボット掃除機',
    'ミラーレス一眼',
    'Nintendo Switch',
    '空気清浄機',
    'スマートウォッチ',
    'ポータブル電源',
];

const RECENT_KEY = 'hikaku_recent_searches';
const RECENT_MAX = 8;

export function getRecentSearches() {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch {
        return [];
    }
}

export function addRecentSearch(keyword) {
    const kw = (keyword || '').trim();
    if (!kw) return getRecentSearches();
    try {
        const list = getRecentSearches().filter(k => k !== kw);
        list.unshift(kw);
        const trimmed = list.slice(0, RECENT_MAX);
        localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
        return trimmed;
    } catch {
        return getRecentSearches();
    }
}

export function clearRecentSearches() {
    try {
        localStorage.removeItem(RECENT_KEY);
    } catch {
        /* ignore */
    }
    return [];
}
