import { recordOutboundClick } from '../shared/outboundClient.js';
import { useMemo } from 'react';
import { buildAmazonAffiliateUrl, buildYahooAffiliateUrl } from '../api';
import { getOptimizedAffiliateRoute } from '../optimizationEngine';
import { deriveProductQuery } from '../shared/priceCompare.js';

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

export default function ProductCard({ item, viewMode, isSelected, onToggleCompare, isCheapest, isPointSorted = false }) {
    // 広告文を除き、型番とブランドを他モールへ引き継ぐ。
    const keyword = deriveProductQuery(item.itemName) || item.itemName;
    const amazonUrl = buildAmazonAffiliateUrl(keyword);
    const yahooUrl = buildYahooAffiliateUrl(keyword);

    // Never redirect a real Yahoo offer to a Rakuten or Amazon search result.
    const { bestUrl, winnerPlatform, rakutenTracked } = useMemo(
        () => item.sourceStore && /^https:\/\//.test(item.itemUrl || '')
          ? { bestUrl: item.itemUrl, winnerPlatform: item.sourceStore, rakutenTracked: item.sourceStore === 'rakuten' }
          : getOptimizedAffiliateRoute(item, keyword),
        [item, keyword]
    );
    const primarySponsored = item.sourceStore ? Boolean(item.sponsored) : true;
    const primaryRel = primarySponsored ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
    const platformLabel = winnerPlatform === 'rakuten' ? '楽天市場'
        : winnerPlatform === 'amazon' ? 'Amazon' : 'Yahoo!ショッピング';

    const recordMerchant = (placement, merchant = winnerPlatform, sponsored = primarySponsored) => recordOutboundClick({ section: 'products', merchant: merchant === 'yahoo' ? 'yahoo-shopping' : merchant, placement, sponsored });

    return (
        <div className={`product-card${viewMode === 'list' ? ' list-card' : ''}${isSelected ? ' selected' : ''}`}>
            <div className="product-image-col">
                {isCheapest && item.sameProduct && (
                    // 楽天APIは送料額を返さないため、送料別の商品が実質最安になった場合は
                    // 「送料を含まない比較」であることをバッジ自体に明示する
                    <div className={`cheapest-badge ${item.isFreeShipping ? '' : 'with-caveat'}`}>
                        {isPointSorted ? '表示候補の参考額が最小' : item.isFreeShipping ? '型番照合候補の商品価格が最小' : '型番照合候補の商品価格が最小・送料要確認'}
                    </div>
                )}
                <a href={bestUrl} target="_blank" rel={primaryRel} className="card-image-link" onClick={() => recordMerchant('product-image')}>
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.itemName} className="product-image" loading="lazy" />
                    ) : (
                        <div className="product-image no-image">No Image</div>
                    )}
                </a>
            </div>

            <div className="product-info-col">
                <h3 className="product-title">
                    <a href={bestUrl} target="_blank" rel={primaryRel} className="product-title-link" onClick={() => recordMerchant('product-title')}>
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
                        {item.isFreeShipping ? '送料無料' : item.shippingStatus === 'conditional' ? '条件付き送料無料（条件要確認）' : item.postageFlag === 1 ? '送料別' : '送料情報未取得'}
                    </span>
                    {item.pointBack > 0 && <span className="feature-tag point">{item.pointKind === 'paypay-limited' ? '期間限定PayPayポイント' : '取得元表示のポイント'} {item.pointBack.toLocaleString('ja-JP')}pt</span>}
                    {!item.sourceStore && item.pointRate > 1 && (
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
                    <span className="price-label">商品価格（取得元の表示）:</span>
                    <div className="product-price-row">
                        <span className="product-price">¥{item.itemPrice.toLocaleString()}</span>
                    </div>
                    {item.pointBack > 0 && <div className="effective-price">
                        ポイント考慮後の参考額 <strong>¥{item.effectivePrice.toLocaleString()}</strong>
                        <span className="effective-note">（支払総額ではありません。ポイント{item.pointBack.toLocaleString()}pt・送料や利用条件は別）</span>
                    </div>}
                    {item.sourceStore && <p className="product-offer-source">{item.storeName}の出品・{item.sameProduct?'型番／JAN照合候補（色・容量は未保証）':'商品名が類似・同一商品か未確認'}</p>}
                </div>

                <label className={`compare-check ${isSelected ? 'active' : ''}`}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleCompare(item)}
                    />
                    比較に追加
                </label>

                <a href={bestUrl} target="_blank" rel={primaryRel} className="btn-primary-cta rakuten-first" onClick={() => recordMerchant('product-primary')}>
                    {platformLabel}で価格・在庫を確認 ▶ {primarySponsored && <span className="product-pr-tag">PR</span>}<br />
                    <span className="dy-tooltip">
                        {item.sourceStore ? 'この出品の商品ページで送料・在庫・仕様を確認' : rakutenTracked ? '楽天市場の商品ページへ' : '別ショップの検索結果で条件を確認'}
                    </span>
                </a>

                <a className="btn-compare-all" href={`/compare/?q=${encodeURIComponent(deriveProductQuery(item.itemName))}&ref=${encodeURIComponent(item.itemName.slice(0, 160))}`}>
                    主要ショップで価格比較 →
                </a>

                <div className="sub-actions">
                    <a href={amazonUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-amazon-small" onClick={() => recordMerchant('product-secondary', 'amazon')}>
                        Amazonで探す <small className="product-pr-tag">PR</small>
                    </a>
                    <a href={yahooUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn-yahoo-small" onClick={() => recordMerchant('product-secondary', 'yahoo-shopping')}>
                        Yahoo!で探す <small className="product-pr-tag">PR</small>
                    </a>
                </div>
            </div>
        </div>
    );
}
