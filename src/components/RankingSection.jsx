import { useState, useEffect } from 'react';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { searchRakutenItems, buildRakutenAffiliateUrl, buildRakutenSearchAffiliateUrl } from '../api';

const RANKING_KEYWORDS = ['スマートフォン', 'ノートパソコン', 'イヤホン'];

export default function RankingSection() {
    const [items, setItems] = useState([]);
    const [activeKw, setActiveKw] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeKw) return undefined;
        const controller = new AbortController();
        setLoading(true);
        setItems([]);
        searchRakutenItems(activeKw, '', 1, { signal: controller.signal })
            .then(data => { if (!controller.signal.aborted) setItems(data.items.slice(0, 5)); })
            .catch(() => { if (!controller.signal.aborted) setItems([]); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [activeKw]);

    const track = () => recordOutboundClick({ section: 'products', merchant: 'rakuten', placement: 'category-picks', sponsored: true });

    return (
        <aside className="ranking-section">
            <h3 className="ranking-title">カテゴリ別の商品候補</h3>
            <div className="ranking-tabs">
                {RANKING_KEYWORDS.map(kw => (
                    <button
                        key={kw}
                        className={`ranking-tab ${activeKw === kw ? 'active' : ''}`}
                        aria-pressed={activeKw === kw}
                        onClick={() => setActiveKw(kw)}
                    >{kw}</button>
                ))}
            </div>
            {!activeKw && <p className="ranking-empty">調べたいカテゴリを選ぶと、楽天市場の商品候補を読み込みます。</p>}
            {loading && <p className="ranking-empty" role="status">商品候補を読み込んでいます…</p>}
            {activeKw && !loading && items.length === 0 && <p className="ranking-empty">商品候補を取得できませんでした。<a href={buildRakutenSearchAffiliateUrl(activeKw)} target="_blank" rel="sponsored noopener noreferrer" onClick={track}>楽天市場で探す ↗（PR）</a></p>}
            <ol className="ranking-list">
                {items.map((item, i) => (
                    <li key={item.itemCode} className="ranking-item">
                        <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                        <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" onClick={track}>
                            <img src={item.imageUrl} alt={item.itemName} className="rank-img" loading="lazy" />
                        </a>
                        <div className="rank-info">
                            <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" onClick={track} className="rank-name">
                                {item.itemName.slice(0, 40)}…
                            </a>
                            <div className="rank-price-row">
                                <span className="rank-price">¥{item.itemPrice.toLocaleString()}</span>
                                {item.pointRate > 1 && <span className="rank-point">P{item.pointRate}倍</span>}
                            </div>
                            <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" onClick={track} className="btn-rank-cta">
                                楽天市場で見る ▶
                            </a>
                        </div>
                    </li>
                ))}
            </ol>
        </aside>
    );
}
