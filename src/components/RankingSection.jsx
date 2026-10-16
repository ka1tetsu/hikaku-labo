import { useState, useEffect } from 'react';
import { searchRakutenItems, buildRakutenAffiliateUrl, buildMallSearchLinks } from '../api';
import { trackOutbound } from '../shared/track';

const RANKING_KEYWORDS = ['スマートフォン', 'ノートパソコン', 'ワイヤレスイヤホン'];

export default function RankingSection() {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState('loading'); // loading | ok | failed
    const [activeKw, setActiveKw] = useState(RANKING_KEYWORDS[0]);

    useEffect(() => {
        let cancelled = false;
        setStatus('loading');
        searchRakutenItems(activeKw, '', 1)
            .then(data => {
                if (cancelled) return;
                setItems(data.items.slice(0, 5));
                setStatus(data.items.length > 0 ? 'ok' : 'failed');
            })
            .catch(() => { if (!cancelled) { setItems([]); setStatus('failed'); } });
        return () => { cancelled = true; };
    }, [activeKw]);

    const track = () => trackOutbound({ section: 'products', target: 'rakuten', placement: 'ranking' });

    return (
        <aside className="ranking-section">
            <h3 className="ranking-title">🏆 人気の商品</h3>
            <div className="ranking-tabs">
                {RANKING_KEYWORDS.map(kw => (
                    <button
                        key={kw}
                        className={`ranking-tab ${activeKw === kw ? 'active' : ''}`}
                        onClick={() => setActiveKw(kw)}
                    >{kw}</button>
                ))}
            </div>
            {status === 'failed' && (
                // 商品データが取れなくても、各モールの検索結果へは案内する（離脱＝成果ゼロを避ける）
                <div className="ranking-fallback">
                    <p>「{activeKw}」の人気商品を各モールで確認できます。</p>
                    {buildMallSearchLinks(activeKw).map(link => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className={link.id}
                            onClick={() => trackOutbound({ section: 'products', target: link.id, placement: 'ranking-fallback' })}
                        >{link.label}で見る ▶</a>
                    ))}
                </div>
            )}
            <ol className="ranking-list">
                {items.map((item, i) => (
                    <li key={item.itemCode} className="ranking-item">
                        <span className={`rank-badge rank-${i + 1}`}>{i + 1}</span>
                        <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" onClick={track}>
                            <img src={item.imageUrl} alt={item.itemName} className="rank-img" loading="lazy" />
                        </a>
                        <div className="rank-info">
                            <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" className="rank-name" onClick={track}>
                                {item.itemName.slice(0, 40)}…
                            </a>
                            <div className="rank-price-row">
                                <span className="rank-price">¥{item.itemPrice.toLocaleString()}</span>
                                {item.pointRate > 1 && <span className="rank-point">P{item.pointRate}倍</span>}
                            </div>
                            <a href={buildRakutenAffiliateUrl(item, item.itemName)} target="_blank" rel="noopener noreferrer sponsored" className="btn-rank-cta" onClick={track}>
                                楽天市場で見る ▶
                            </a>
                        </div>
                    </li>
                ))}
            </ol>
            <p className="ranking-note">楽天市場の検索APIの標準順です（当サイト独自の売上順位ではありません）。</p>
        </aside>
    );
}
