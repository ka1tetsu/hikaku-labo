import { useState, useEffect } from 'react';
import { searchRakutenItems, buildRakutenAffiliateUrl } from '../api';

const RANKING_KEYWORDS = ['スマートフォン', 'ノートパソコン', 'イヤホン'];

export default function RankingSection() {
    const [items, setItems] = useState([]);
    const [activeKw, setActiveKw] = useState(RANKING_KEYWORDS[0]);

    useEffect(() => {
        searchRakutenItems(activeKw, '', 1)
            .then(data => setItems((data.Items || []).slice(0, 5).map(({ Item }) => Item)))
            .catch(() => { });
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
            <ol className="ranking-list">
                {items.map((item, i) => (
                    <li key={i} className="ranking-item">
                        <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                        <a href={buildRakutenAffiliateUrl(item)} target="_blank" rel="noopener noreferrer sponsored">
                            <img
                                src={(item.mediumImageUrls?.[0]?.imageUrl || '').replace('_ex=128x128', '_ex=64x64')}
                                alt={item.itemName}
                                className="rank-img"
                            />
                        </a>
                        <div className="rank-info">
                            <a href={buildRakutenAffiliateUrl(item)} target="_blank" rel="noopener noreferrer sponsored" className="rank-name">
                                {(item.itemName || '').slice(0, 40)}…
                            </a>
                            <div className="rank-price-row">
                                <span className="rank-price">¥{Number(item.itemPrice).toLocaleString()}</span>
                            </div>
                            <a href={buildRakutenAffiliateUrl(item)} target="_blank" rel="noopener noreferrer sponsored" className="btn-rank-cta">
                                最安値を調べる ▶
                            </a>
                        </div>
                    </li>
                ))}
            </ol>
        </aside>
    );
}
