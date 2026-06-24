// 絞り込みフィルタUI：価格帯・最低評価・最低レビュー数
// 比較サイトの核となる「欲しい商品に速く到達する」体験を提供し、成約率を高める。

const RATING_OPTIONS = [
    { value: 0, label: '指定なし' },
    { value: 3.5, label: '★3.5以上' },
    { value: 4.0, label: '★4.0以上' },
    { value: 4.5, label: '★4.5以上' },
];

const REVIEW_OPTIONS = [
    { value: 0, label: '指定なし' },
    { value: 10, label: '10件以上' },
    { value: 50, label: '50件以上' },
    { value: 100, label: '100件以上' },
];

export default function FilterBar({ filters, setFilters, resultCount, totalCount, onReset }) {
    const update = (patch) => setFilters(prev => ({ ...prev, ...patch }));
    const isActive =
        filters.priceMin !== '' ||
        filters.priceMax !== '' ||
        filters.minRating > 0 ||
        filters.minReviews > 0;

    return (
        <div className="filter-bar">
            <div className="filter-bar-head">
                <span className="filter-bar-title">🔎 絞り込み</span>
                <span className="filter-result-count">
                    {totalCount}件中 <strong>{resultCount}</strong>件を表示
                </span>
                {isActive && (
                    <button type="button" className="filter-reset" onClick={onReset}>
                        条件をクリア
                    </button>
                )}
            </div>

            <div className="filter-controls">
                <div className="filter-group">
                    <label className="filter-label">価格帯</label>
                    <div className="filter-price-range">
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="下限"
                            value={filters.priceMin}
                            onChange={e => update({ priceMin: e.target.value })}
                            className="filter-price-input"
                            aria-label="価格の下限"
                        />
                        <span className="filter-price-sep">〜</span>
                        <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="上限"
                            value={filters.priceMax}
                            onChange={e => update({ priceMax: e.target.value })}
                            className="filter-price-input"
                            aria-label="価格の上限"
                        />
                        <span className="filter-price-unit">円</span>
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label" htmlFor="filter-rating">評価</label>
                    <select
                        id="filter-rating"
                        className="filter-select"
                        value={filters.minRating}
                        onChange={e => update({ minRating: Number(e.target.value) })}
                    >
                        {RATING_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label" htmlFor="filter-reviews">レビュー数</label>
                    <select
                        id="filter-reviews"
                        className="filter-select"
                        value={filters.minReviews}
                        onChange={e => update({ minReviews: Number(e.target.value) })}
                    >
                        {REVIEW_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
