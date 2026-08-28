import { useMemo } from 'react';
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

// 表示するのは各ECサイトから取得した実データ(価格・レビュー・店舗名)のみ。
// 根拠のない順位・在庫・還元額などは、優良誤認およびASP規約違反になるため表示しない。
export default function ProductCard({ item, viewMode, position }) {
    const itemName = item.itemName || '商品名不明';
    const price = Number(item.itemPrice) || 0;
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

    const optimizeData = useMemo(
        () => getOptimizedAffiliateRoute(item, keyword, price),
        [item, keyword, price]
    );
    const { bestUrl, winnerPlatform, isDeepLink } = optimizeData;
    const storeLabel = winnerPlatform === 'rakuten' ? '楽天市場' : winnerPlatform === 'amazon' ? 'Amazon' : 'Yahoo!ショッピング';

    // 実際のレビューデータのみを根拠にした信頼バッジ
    const trustBadges = [];
    if (reviewAverage >= 4.3 && reviewCount >= 10) trustBadges.push({ cls: 'rating', text: '⭐ 高評価' });
    if (reviewCount >= 100) trustBadges.push({ cls: 'reviews', text: `🗣 レビュー${reviewCount}件` });

    const handleAffClick = (platform) =>
        trackAffiliateClick({ platform, itemName, price, position });

    return (
        <div className={`product-card${viewMode === 'list' ? ' list-card' : ''}`}>
            <div className="product-image-col">
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

                <div className="product-meta">
                    {shopName && (
                        <p className="product-shop">
                            <span className="shop-icon">🏬</span> {shopName}
                        </p>
                    )}
                    {reviewCount > 0 && (
                        <div className="product-review">
                            <StarRating score={reviewAverage} />
                            <span className="review-count">
                                <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={() => handleAffClick('rakuten')}>({reviewCount}件のレビュー)</a>
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="product-action-col">
                <div className="price-box">
                    <span className="price-label">価格(税込):</span>
                    <div className="product-price-row">
                        <span className="product-price">¥{price.toLocaleString()}</span>
                    </div>
                </div>

                <a href={bestUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary-cta dynamic-yield" onClick={() => handleAffClick(winnerPlatform)}>
                    {storeLabel}で購入する ▶<br />
                    <span className="dy-tooltip">
                        {isDeepLink ? 'この商品のページへ直接移動します' : `${storeLabel}で商品を探す`}
                    </span>
                </a>

                <div className="sub-actions">
                    <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-amazon-small" onClick={() => handleAffClick('amazon')}>
                        Amazonで探す
                    </a>
                    <a href={yahooUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-yahoo-small" onClick={() => handleAffClick('yahoo')}>
                        Yahoo!で探す
                    </a>
                </div>

                <p className="price-note">※価格・在庫は変動します。最新情報はリンク先でご確認ください。</p>
            </div>
        </div>
    );
}
