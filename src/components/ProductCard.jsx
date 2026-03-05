import { buildRakutenAffiliateUrl, buildAmazonAffiliateUrl, AMAZON_TAG } from '../api';

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
    const rakutenUrl = buildRakutenAffiliateUrl(item);
    const itemName = item.itemName || '商品名不明';
    const price = Number(item.itemPrice) || 0;
    const shopName = item.shopName || '';
    const reviewAverage = item.reviewAverage || 0;
    const reviewCount = item.reviewCount || 0;
    const imageUrl = (item.mediumImageUrls?.[0]?.imageUrl || '').replace('_ex=128x128', '_ex=300x300');
    const amazonUrl = buildAmazonAffiliateUrl(itemName.split(/[ 　]/)[0]);

    return (
        <div className={`product-card${viewMode === 'list' ? ' list-card' : ''}`}>
            <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="card-image-link">
                {imageUrl ? (
                    <img src={imageUrl} alt={itemName} className="product-image" loading="lazy" />
                ) : (
                    <div className="product-image no-image">No Image</div>
                )}
            </a>
            <div className="product-content">
                <a href={rakutenUrl} target="_blank" rel="noopener noreferrer sponsored" className="product-title-link">
                    <h3 className="product-title">{itemName.length > 60 ? itemName.slice(0, 60) + '…' : itemName}</h3>
                </a>
                <div className="product-meta">
                    {reviewCount > 0 && (
                        <div className="product-review">
                            <StarRating score={reviewAverage} />
                            <span className="review-count">({reviewCount}件)</span>
                        </div>
                    )}
                    <p className="product-shop">🏪 {shopName}</p>
                </div>
                <div className="product-price-row">
                    <span className="product-price">¥{price.toLocaleString()}</span>
                    <span className="price-tax">（税込）</span>
                </div>
                <div className="product-actions">
                    <a
                        href={rakutenUrl}
                        className="btn-rakuten"
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                    >
                        楽天で購入 →
                    </a>
                    <a
                        href={amazonUrl}
                        className="btn-amazon"
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                    >
                        Amazonで見る
                    </a>
                </div>
            </div>
        </div>
    );
}
