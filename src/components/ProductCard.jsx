import { useState, useMemo } from 'react';
import { buildRakutenAffiliateUrl, buildAmazonAffiliateUrl, buildYahooAffiliateUrl, buildSearchKeyword } from '../api';
import { getOptimizedAffiliateRoute } from '../optimizationEngine';
import { trackAffiliateClick } from '../analytics';

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

export default function ProductCard({ item, viewMode, position }) {
    const itemName = item.itemName || '商品名不明';
    const basePrice = Number(item.itemPrice) || 0;
    const shopName = item.shopName || '';
    const reviewAverage = item.reviewAverage || 0;
    const reviewCount = item.reviewCount || 0;
    const imageUrl = (item.mediumImageUrls?.[0]?.imageUrl || '').replace('_ex=128x128', '_ex=300x300');
    // ブランド名だけ(例:「Apple」)で検索させると汎用一覧に飛んで成約しないため、
    // 商品名から意味のある検索キーワードを組み立てる
    const keyword = buildSearchKeyword(itemName);
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

    const { bestUrl, winnerPlatform, isDeepLink } = optimizeData;
    const storeLabel = winnerPlatform === 'rakuten' ? '楽天市場' : winnerPlatform === 'amazon' ? 'Amazon' : 'Yahoo!ショッピング';

    // --- コンバージョン後押し用の派生データ ---
    // ポイント還元相当額（おおよそ1%）を可視化して「実質おトク感」を訴求
    const pointsBack = Math.floor(Math.max(0, finalPrice) * 0.01);

    // 価格推移にもとづく「買い時」シグナル（kakakuTrendUp: 価格が上昇傾向か）
    const buyTiming = item.kakakuTrendUp === false
        ? { cls: 'good', icon: '📉', text: '値下がり傾向・買い時です' }
        : item.kakakuTrendUp === true
            ? { cls: 'warn', icon: '📈', text: '価格上昇傾向・早めの購入が安心' }
            : null;

    // 信頼バッジ（社会的証明）。実データ（レビュー・ランキング）に基づくもののみ表示
    const trustBadges = [];
    if (kakakuRank && kakakuRank <= 3) trustBadges.push({ cls: 'rank', text: `🏆 ランキング${kakakuRank}位` });
    if (reviewAverage >= 4.3 && reviewCount >= 10) trustBadges.push({ cls: 'rating', text: '⭐ 高評価' });
    if (reviewCount >= 100) trustBadges.push({ cls: 'reviews', text: `🗣 レビュー${reviewCount}件` });

    // アフィリエイトクリック計測（成果計測・改善の基盤）
    const handleAffClick = (platform) =>
        trackAffiliateClick({ platform, itemName, price: finalPrice, position });

    return (
        <div className={`product-card${viewMode === 'list' ? ' list-card' : ''}`}>
            <div className="product-image-col">
                {kakakuRank && (
                    <div className="kakaku-rank-badge">
                        🏅 {kakakuRank}位
                    </div>
                )}
                <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="card-image-link" onClick={() => handleAffClick('rakuten')}>
                    {imageUrl ? (
                        <img src={imageUrl} alt={itemName} className="product-image" loading="lazy" />
                    ) : (
                        <div className="product-image no-image">No Image</div>
                    )}
                </a>
            </div>

            <div className="product-info-col">
                {trustBadges.length > 0 && (
                    <div className="trust-badges">
                        {trustBadges.map((b, idx) => (
                            <span key={idx} className={`trust-badge ${b.cls}`}>{b.text}</span>
                        ))}
                    </div>
                )}

                <h3 className="product-title">
                    <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="product-title-link" onClick={() => handleAffClick('rakuten')}>
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
                    {pointsBack > 0 && (
                        <div className="points-back">＋約 <strong>{pointsBack.toLocaleString()}</strong> ポイント還元</div>
                    )}
                    {kakakuShops && <div className="shop-count-label">価格比較：<span className="shops-link">{kakakuShops}店舗</span></div>}
                </div>

                {buyTiming && (
                    <div className={`buy-timing ${buyTiming.cls}`}>
                        <span className="buy-timing-icon">{buyTiming.icon}</span> {buyTiming.text}
                    </div>
                )}

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

                <a href={bestUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary-cta dynamic-yield" onClick={() => handleAffClick(winnerPlatform)}>
                    {storeLabel}で購入する ▶<br />
                    <span className="dy-tooltip">
                        {isDeepLink ? 'この商品のページへ直接移動します' : `${storeLabel}で商品を探す`}
                    </span>
                </a>
                <div className="cta-benefits">
                    <span>✓ 全国送料無料</span>
                    <span>✓ 最短当日発送</span>
                    <span>✓ {kakakuShops || '複数'}店舗の最安を自動比較</span>
                </div>

                <div className="sub-actions">
                    <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-amazon-small" onClick={() => handleAffClick('amazon')}>
                        Amazonで探す
                    </a>
                    <a href={yahooUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-yahoo-small" onClick={() => handleAffClick('yahoo')}>
                        Yahoo!で探す
                    </a>
                </div>
            </div>
        </div>
    );
}
