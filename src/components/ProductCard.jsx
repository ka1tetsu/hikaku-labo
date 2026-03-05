import { useState, useMemo } from 'react';
import { buildRakutenAffiliateUrl, buildAmazonAffiliateUrl, buildYahooAffiliateUrl } from '../api';
import { getOptimizedAffiliateRoute } from '../optimizationEngine';

function StarRating({ score }) {
    const stars = Math.round((score || 0) * 2) / 2;
    return (
        <span className="stars" title={`${score}点`}>
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`star ${i <= stars ? 'filled' : i - 0.5 <= stars ? 'half' : ''}`}>★</span>
            ))}
            <span className="star-score">{score ? score.toFixed(1) : '—'}</span>
        </span>
    );
}

export default function ProductCard({ item, viewMode }) {
    const itemName = item.itemName || '商品名不明';
    const basePrice = Number(item.itemPrice) || 0;
    const shopName = item.shopName || '';
    const reviewAverage = item.reviewAverage || 0;
    const reviewCount = item.reviewCount || 0;
    const imageUrl = (item.mediumImageUrls?.[0]?.imageUrl || '').replace('_ex=128x128', '_ex=300x300');
    const keyword = itemName.split(/[ 　]/)[0];
    const amazonUrl = buildAmazonAffiliateUrl(keyword);
    const yahooUrl = buildYahooAffiliateUrl(keyword);
    const rakutenUrl = buildRakutenAffiliateUrl(item);

    const kakakuSpecs = item.kakakuSpecs || [];
    const kakakuRank = item.kakakuRank;
    const kakakuShops = item.kakakuShops;
    const aiSummary = item.aiSummary;
    const tradeInPrice = item.tradeInPrice || 0;
    const insurancePrice = item.insurancePrice || 0;

    // --- State: Attachments (保険・下取り) をユーザーが選んだ場合のインタラクティブな価格計算 ---
    const [useTradeIn, setUseTradeIn] = useState(tradeInPrice > 0);
    const [useInsurance, setUseInsurance] = useState(false);

    const finalPrice = basePrice + (useInsurance ? insurancePrice : 0) - (useTradeIn ? tradeInPrice : 0);

    // --- Dynamic Yield Routing: 最適化エンジンの計算結果をキャッシュ ---
    const optimizeData = useMemo(() => {
        return getOptimizedAffiliateRoute(item, keyword, basePrice);
    }, [item, keyword, basePrice]);

    const { bestUrl, winnerPlatform, expectedReward } = optimizeData;

    return (
        <div className={`product-card${viewMode === 'list' ? ' list-card' : ''}`}>
            <div className="product-image-col">
                {kakakuRank && (
                    <div className="kakaku-rank-badge">
                        🏅 {kakakuRank}位
                    </div>
                )}
                <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="card-image-link">
                    {imageUrl ? (
                        <img src={imageUrl} alt={itemName} className="product-image" loading="lazy" />
                    ) : (
                        <div className="product-image no-image">No Image</div>
                    )}
                </a>
            </div>

            <div className="product-info-col">
                <h3 className="product-title">
                    <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="product-title-link">
                        {itemName}
                    </a>
                </h3>

                {kakakuSpecs.length > 0 && (
                    <div className="kakaku-specs">
                        {kakakuSpecs.map((spec, idx) => (
                            <span key={idx} className="spec-item">{spec}</span>
                        ))}
                    </div>
                )}

                {aiSummary && (
                    <div className="ai-summary-box">
                        <div className="ai-summary-title">✨ AIレビュー3行要約</div>
                        <div className="ai-summary-content">
                            <p className="ai-pro">✅ メリット: {aiSummary.pros.join(' / ')}</p>
                            <p className="ai-con">⚠️ デメリット: {aiSummary.cons.join(' / ')}</p>
                            <p className="ai-target">🎯 こんな人に: {aiSummary.target}</p>
                        </div>
                    </div>
                )}

                <div className="product-meta">
                    <p className="product-shop">
                        <span className="shop-icon">🏬</span> {shopName}
                    </p>
                    {reviewCount > 0 && (
                        <div className="product-review">
                            <StarRating score={reviewAverage} />
                            <span className="review-count">
                                <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored">({reviewCount}件のレビュー)</a>
                            </span>
                        </div>
                    )}
                </div>
                <div className="product-features">
                    <span className="feature-tag">送料無料</span>
                    <span className="feature-tag point">ポイント高還元</span>
                </div>
                <div className="product-detail-tabs">
                    <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="detail-tab">スペック</a>
                    <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="detail-tab">クチコミ <span className="tab-count">({reviewCount})</span></a>
                    <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="detail-tab">価格推移</a>
                </div>
            </div>

            <div className="product-action-col">
                <div className="price-box">
                    <span className="price-label">実質価格(税込):</span>
                    <div className="product-price-row">
                        <span className="product-price">¥{Math.max(0, finalPrice).toLocaleString()}</span>
                    </div>
                    {kakakuShops && <div className="shop-count-label">価格比較：<span className="shops-link">{kakakuShops}店舗</span></div>}
                </div>

                <div className="attachments-list">
                    {tradeInPrice > 0 && (
                        <label className={`attachment-checkbox ${useTradeIn ? 'active' : ''}`}>
                            <input type="checkbox" checked={useTradeIn} onChange={(e) => setUseTradeIn(e.target.checked)} />
                            📦 古い端末を下取りに出す<br />
                            <span className="attachment-price trade-in">最大 ¥{tradeInPrice.toLocaleString()} 還元</span>
                        </label>
                    )}
                    {insurancePrice > 0 && (
                        <label className={`attachment-checkbox ${useInsurance ? 'active' : ''}`}>
                            <input type="checkbox" checked={useInsurance} onChange={(e) => setUseInsurance(e.target.checked)} />
                            🛡️ 3年自動延長保証<br />
                            <span className="attachment-price">+ ¥{Math.floor(insurancePrice).toLocaleString()}</span>
                        </label>
                    )}
                </div>

                <a href={bestUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary-cta dynamic-yield">
                    最安ルートで購入する ▶<br />
                    <span className="dy-tooltip">
                        Dynamic Yield最適化済 (経由ASP: {winnerPlatform === 'rakuten' ? '楽天' : winnerPlatform === 'amazon' ? 'Amazon' : 'Yahoo'})
                    </span>
                </a>

                <div className="sub-actions">
                    <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-amazon-small">
                        Amazonで探す
                    </a>
                    <a href={yahooUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-yahoo-small">
                        Yahoo!で探す
                    </a>
                </div>
            </div>
        </div>
    );
}
