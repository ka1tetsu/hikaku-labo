import { useState, useEffect } from 'react';
import { searchRakutenItems, buildRakutenAffiliateUrl } from '../api';

const RANKING_KEYWORDS = ['スマートフォン', 'ノートパソコン', 'イヤホン'];

export default function RankingSection() {
    const [items, setItems] = useState([]);
    const [activeKw, setActiveKw] = useState(RANKING_KEYWORDS[0]);

    useEffect(() => {
        let cancelled = false;
        searchRakutenItems(activeKw, '', 1)
            .then(data => { if (!cancelled) setItems(data.items.slice(0, 5)); })
            .catch(() => { if (!cancelled) setItems([]); });
        return () => { cancelled = true; };
    }, [activeKw]);

    return (
        <aside className="ranking-section">
            <h3 className="ranking-title">🏆 人気ランキング</h3>
            <div className="ranking-tabs">
                {RANKING_KEYWORDS.map(kw => (
                    <button
                        key={kw}
                        className={`ranking-tab ${activeKw === kw ? 'active' : ''}`}
                        onClick={() => setActiveKw(kw)}
                    >{kw}</button>
                ))}
            </div>
            {items.length === 0 && (
                <p className="ranking-empty">商品を取得できませんでした。</p>
            )}
            <ol className="ranking-list">
                {items.map((item, i) => (
                    <li key={item.itemCode} className="ranking-item">
                        <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                        <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored">
                            <img src={item.imageUrl} alt={item.itemName} className="rank-img" loading="lazy" />
                        </a>
                        <div className="rank-info">
                            <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" className="rank-name">
                                {item.itemName.slice(0, 40)}…
                            </a>
                            <div className="rank-price-row">
                                <span className="rank-price">¥{item.itemPrice.toLocaleString()}</span>
                                {item.pointRate > 1 && <span className="rank-point">P{item.pointRate}倍</span>}
                            </div>
                            <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" className="btn-rank-cta">
                                楽天市場で見る ▶
                            </a>
                        </div>
                    </li>
                ))}
            </ol>
        </aside>
    );
}
