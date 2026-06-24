import { useState, useRef, useEffect, useMemo } from 'react';
import { POPULAR_KEYWORDS, getRecentSearches, clearRecentSearches } from '../searchUtils';

export default function Header({ inputValue, setInputValue, onSearch }) {
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [recent, setRecent] = useState([]);
    const boxRef = useRef(null);

    // マウント時 / ドロップダウンを開くたびに履歴を読み込む
    useEffect(() => {
        if (open) setRecent(getRecentSearches());
    }, [open]);

    // 外側クリックで閉じる
    useEffect(() => {
        const onClickOutside = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                setOpen(false);
                setActiveIdx(-1);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    // 入力に応じてサジェストを構築
    const suggestions = useMemo(() => {
        const q = inputValue.trim().toLowerCase();
        if (!q) {
            // 未入力時：履歴 → 人気キーワード
            const recentItems = recent.map(k => ({ type: 'recent', value: k }));
            const popularItems = POPULAR_KEYWORDS
                .filter(k => !recent.includes(k))
                .slice(0, 8)
                .map(k => ({ type: 'popular', value: k }));
            return [...recentItems, ...popularItems];
        }
        // 入力時：履歴・人気から部分一致でフィルタ（重複排除）
        const pool = [...recent, ...POPULAR_KEYWORDS];
        const seen = new Set();
        return pool
            .filter(k => {
                const lk = k.toLowerCase();
                if (lk === q || seen.has(lk) || !lk.includes(q)) return false;
                seen.add(lk);
                return true;
            })
            .slice(0, 8)
            .map(k => ({ type: recent.includes(k) ? 'recent' : 'popular', value: k }));
    }, [inputValue, recent]);

    const selectKeyword = (kw) => {
        setInputValue(kw);
        setOpen(false);
        setActiveIdx(-1);
        onSearch(kw);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (activeIdx >= 0 && suggestions[activeIdx]) {
            selectKeyword(suggestions[activeIdx].value);
        } else {
            setOpen(false);
            onSearch(e);
        }
    };

    const handleKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === 'Escape') {
            setOpen(false);
            setActiveIdx(-1);
        }
    };

    const handleClearRecent = () => {
        clearRecentSearches();
        setRecent([]);
    };

    return (
        <header className="header">
            <div className="container header-inner">
                <a href="/" className="logo">
                    <span className="logo-kaku">比較</span>
                    <span className="logo-labo">ラボ</span>
                    <span className="logo-tag">価格比較・最安値</span>
                </a>

                <div className="header-search-wrap" ref={boxRef}>
                    <form className="header-search" onSubmit={handleSubmit} role="search">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => { setInputValue(e.target.value); setOpen(true); setActiveIdx(-1); }}
                            onFocus={() => setOpen(true)}
                            onKeyDown={handleKeyDown}
                            placeholder="商品名・キーワードで検索..."
                            className="header-search-input"
                            aria-label="商品検索"
                            autoComplete="off"
                        />
                        <button type="submit" className="header-search-btn">
                            🔍 検索
                        </button>
                    </form>

                    {open && suggestions.length > 0 && (
                        <div className="search-suggestions" role="listbox">
                            {!inputValue.trim() && recent.length > 0 && (
                                <div className="suggest-head">
                                    <span>最近の検索</span>
                                    <button type="button" className="suggest-clear" onClick={handleClearRecent}>
                                        履歴を消去
                                    </button>
                                </div>
                            )}
                            {!inputValue.trim() && recent.length === 0 && (
                                <div className="suggest-head"><span>人気のキーワード</span></div>
                            )}
                            {suggestions.map((s, idx) => (
                                <button
                                    type="button"
                                    key={`${s.type}-${s.value}`}
                                    role="option"
                                    aria-selected={idx === activeIdx}
                                    className={`suggest-item ${idx === activeIdx ? 'active' : ''}`}
                                    onMouseEnter={() => setActiveIdx(idx)}
                                    onClick={() => selectKeyword(s.value)}
                                >
                                    <span className="suggest-icon">{s.type === 'recent' ? '🕘' : '🔥'}</span>
                                    <span className="suggest-text">{s.value}</span>
                                    {s.type === 'popular' && <span className="suggest-tag">人気</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="header-links">
                    <a href="https://www.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" className="header-badge rakuten-badge">楽天</a>
                    <a href="https://www.amazon.co.jp/?tag=kuronekosanta-22" target="_blank" rel="noopener noreferrer" className="header-badge amazon-badge">Amazon</a>
                </div>
            </div>
        </header>
    );
}
