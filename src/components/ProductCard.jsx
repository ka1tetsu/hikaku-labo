import { useMemo } from 'react';
import { buildAmazonAffiliateUrl, buildYahooAffiliateUrl } from '../api';
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

export default function ProductCard({ item, viewMode, isSelected, onToggleCompare, isCheapest }) {
    // 半角・全角スペース区切りの先頭語を他モール検索のキーワードにする
    const keyword = item.itemName.split(/[ \u3000]/)[0];
    const amazonUrl = buildAmazonAffiliateUrl(keyword);
    const yahooUrl = buildYahooAffiliateUrl(keyword);

    // --- 楽天ファーストのルーティング結果をキャッシュ ---
    const { bestUrl, winnerPlatform, rakutenTracked } = useMemo(
        () => getOptimizedAffiliateRoute(item, keyword, item.itemPrice),
        [item, keyword]
    );
    const platformLabel = winnerPlatform === 'rakuten' ? '楽天市場'
        : winnerPlatform === 'amazon' ? 'Amazon' : 'Yahoo!ショッピング';

    return (
        <div className={`product-card${viewMode === 'list' ? ' list-card' : ''}${isSelected ? ' selected' : ''}`}>
            <div className="product-image-col">
                {isCheapest && (
                    // 楽天APIは送料額を返さないため、送料別の商品が実質最安になった場合は
                    // 「送料を含まない比較」であることをバッジ自体に明示する
                    <div className={`cheapest-badge ${item.isFreeShipping ? '' : 'with-caveat'}`}>
                        {item.isFreeShipping ? '実質最安' : '実質最安（送料別）'}
                    </div>
                )}
                <a href={bestUrl} target="_blank" rel="noopener noreferrer sponsored" className="card-image-link">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.itemName} className="product-image" loading="lazy" />
                    ) : (
                        <div className="product-image no-image">No Image</div>
                    )}
                </a>
            </div>

            <div className="product-info-col">
                <h3 className="product-title">
                    <a href={bestUrl} target="_blank" rel="noopener noreferrer sponsored" className="product-title-link">
                        {item.itemName}
                    </a>
                </h3>

                <div className="product-meta">
                    <p className="product-shop">
                        <span className="shop-icon">🏬</span> {item.shopName}
                    </p>
                    {item.reviewCount > 0 ? (
                        <div className="product-review">
                            <StarRating score={item.reviewAverage} />
                            <span className="review-count">({item.reviewCount.toLocaleString()}件のレビュー)</span>
                        </div>
                    ) : (
                        <div className="product-review no-review">レビューなし</div>
                    )}
                </div>

                <div className="product-features">
                    <span className={`feature-tag ${item.isFreeShipping ? '' : 'muted'}`}>
                        {item.isFreeShipping ? '送料無料' : '送料別'}
                    </span>
                    {item.pointRate > 1 && (
                        <span className="feature-tag point">ポイント{item.pointRate}倍</span>
                    )}
                    {item.asurakuFlag === 1 && <span className="feature-tag">あす楽</span>}
                </div>

                {item.itemCaption && (
                    <p className="product-caption">{item.itemCaption.slice(0, 110)}…</p>
                )}
            </div>

            <div className="product-action-col">
                <div className="price-box">
                    <span className="price-label">商品価格(税込):</span>
                    <div className="product-price-row">
                        <span className="product-price">¥{item.itemPrice.toLocaleString()}</span>
                    </div>
                    <div className="effective-price">
                        実質 <strong>¥{item.effectivePrice.toLocaleString()}</strong>
                        <span className="effective-note">
                            （ポイント {item.pointBack.toLocaleString()}円相当を差引{item.isFreeShipping ? '' : '／送料別'}）
                        </span>
                    </div>
                </div>

                <label className={`compare-check ${isSelected ? 'active' : ''}`}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleCompare(item)}
                    />
                    比較に追加
                </label>

                <a href={bestUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-primary-cta rakuten-first">
                    {platformLabel}で購入する ▶<br />
                    <span className="dy-tooltip">
                        {rakutenTracked ? '楽天市場の商品ページへ' : `楽天の在庫が確認できないため${platformLabel}へ`}
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
