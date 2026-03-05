import React from 'react';

export default function ProductCard({ product }) {
    return (
        <div className="product-card">
            <img
                className="product-image"
                src={product.image}
                alt={product.title}
                loading="lazy"
                onError={(e) => {
                    e.target.src = 'https://placehold.co/400x200?text=No+Image';
                }}
            />
            <div className="product-content">
                <p className="product-category">{product.category}</p>
                <h3 className="product-title">{product.title}</h3>
                <div className="product-price">
                    {product.price === '開設無料' || product.price === '年会費無料' || product.price === '無料'
                        ? <span style={{ color: '#16a34a' }}>{product.price}</span>
                        : <>¥{product.price}<small> (税込)</small></>
                    }
                </div>
                <a
                    href={product.affiliateUrl}
                    className="btn-buy"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {product.price === '開設無料' || product.price === '年会費無料' || product.price === '無料'
                        ? '詳細を見る → '
                        : '最安値で購入する →'}
                </a>
            </div>
        </div>
    );
}
