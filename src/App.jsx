import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import CategoryNav from './components/CategoryNav';
import RankingSection from './components/RankingSection';
import ArticleSection from './components/ArticleSection';
import ComparisonTable from './components/ComparisonTable';
import { searchRakutenItems, buildAmazonAffiliateUrl, buildYahooAffiliateUrl } from './api';
import './index.css';

const CATEGORIES = [
  { label: 'スマートフォン', genreId: '101240', emoji: '📱' },
  { label: 'パソコン', genreId: '501293', emoji: '💻' },
  { label: 'カメラ', genreId: '201026', emoji: '📷' },
  { label: 'テレビ', genreId: '213010', emoji: '📺' },
  { label: 'イヤホン', genreId: '216131', emoji: '🎧' },
  { label: '家電', genreId: '100804', emoji: '🏠' },
  { label: 'ゲーム', genreId: '568453', emoji: '🎮' },
  { label: 'ファッション', genreId: '100371', emoji: '👗' },
];

export default function App() {
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [sortMode, setSortMode] = useState('popular');
  const [compareList, setCompareList] = useState([]);

  const MAX_COMPARE = 4;

  const toggleCompare = useCallback((item) => {
    setCompareList(prev => {
      const exists = prev.some(p => p.itemCode === item.itemCode);
      if (exists) return prev.filter(p => p.itemCode !== item.itemCode);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, item];
    });
  }, []);

  // 並び替えを実際に適用する（従来 sortMode は保持されるだけで未使用だった）
  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortMode) {
      case 'price-asc': return list.sort((a, b) => a.itemPrice - b.itemPrice);
      case 'price-desc': return list.sort((a, b) => b.itemPrice - a.itemPrice);
      case 'effective-asc': return list.sort((a, b) => a.effectivePrice - b.effectivePrice);
      case 'review': return list.sort((a, b) =>
        b.reviewAverage - a.reviewAverage || b.reviewCount - a.reviewCount);
      case 'review-count': return list.sort((a, b) => b.reviewCount - a.reviewCount);
      default: return list; // 人気順 = 楽天APIの返却順
    }
  }, [products, sortMode]);

  // 実質価格が最安の商品（同額なら先頭）
  const cheapestCode = useMemo(() => {
    if (products.length === 0) return null;
    return products.reduce((min, p) => (p.effectivePrice < min.effectivePrice ? p : min)).itemCode;
  }, [products]);

  const doSearch = useCallback(async (kw, genre, pg = 1) => {
    if (!kw && !genre) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchRakutenItems(kw, genre, pg);
      setProducts(data.items);
      setTotalPages(Math.min(data.pageCount, 100));
      setPage(pg);
      if (data.items.length > 0 && !data.affiliateActive) {
        console.warn('[hikaku-labo] 楽天APIが affiliateUrl を返していません。affiliateId の設定を確認してください。');
      }
    } catch (e) {
      // モックで取り繕わず、実際の失敗を伝える（偽の商品で比較させないため）
      setError(e.message || '商品データの取得に失敗しました。');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回ロード。?keyword= / ?genreId= が付いていればそれを検索する
  // （フッターのカテゴリリンクからの遷移に対応）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kw = params.get('keyword') || '';
    const genre = params.get('genreId') || '';

    if (kw || genre) {
      setInputValue(kw);
      setQuery(kw);
      const matched = CATEGORIES.find(c => c.genreId === genre);
      if (matched) setActiveCategory(matched);
      doSearch(kw || matched?.label || '', genre, 1);
    } else {
      doSearch('おすすめ 人気', '', 1);
    }
  }, [doSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setQuery(inputValue);
    setActiveCategory(null);
    doSearch(inputValue, '', 1);
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setQuery('');
    setInputValue('');
    doSearch(cat.label, cat.genreId, 1);
  };

  const handlePage = (newPage) => {
    doSearch(query, activeCategory?.genreId || '', newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchTitle = activeCategory
    ? `「${activeCategory.label}」の人気商品・最安値`
    : query
      ? `「${query}」の検索結果`
      : '注目の人気商品';

  return (
    <div className="app-wrapper">
      <Header
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSearch={handleSearch}
      />

      <CategoryNav
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelect={handleCategory}
      />

      <main className="main-content container">
        {/* Affiliate Quick search bar */}
        <div className="affiliate-bar">
          <div className="affiliate-bar-title">
            🔥 今売れている商品の最安値を各モールで一発検索！
          </div>
          <div className="affiliate-bar-links">
            {['スマートフォン', 'ノートPC', '液晶テレビ', 'ドラム式洗濯機'].map(kw => (
              <div key={kw} className="affiliate-kw-group">
                <span className="kw-label">{kw}：</span>
                <a href={`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(kw)}/?v=3`} target="_blank" rel="noopener noreferrer sponsored" className="kw-link rakuten">楽天</a>
                <a href={buildAmazonAffiliateUrl(kw)} target="_blank" rel="noopener noreferrer sponsored" className="kw-link amazon">Amazon</a>
                <a href={buildYahooAffiliateUrl(kw)} target="_blank" rel="noopener noreferrer sponsored" className="kw-link yahoo">Yahoo</a>
              </div>
            ))}
          </div>
        </div>

        <div className="results-header">
          <h2 className="results-title">{searchTitle}</h2>
          {products.length > 0 && (
            <div className="results-controls">
              <select
                value={sortMode}
                onChange={e => setSortMode(e.target.value)}
                className="sort-select"
              >
                <option value="popular">楽天の標準順</option>
                <option value="effective-asc">実質価格が安い順（ポイント還元後）</option>
                <option value="price-asc">価格が安い順</option>
                <option value="price-desc">価格が高い順</option>
                <option value="review">レビュー評価順</option>
                <option value="review-count">レビュー件数順</option>
              </select>
              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                  title="グリッド表示"
                >⊞</button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  title="リスト表示"
                >☰</button>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>商品を検索中...</p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>商品データを取得できませんでした。</strong>
            <p className="error-detail">{error}</p>
            <p className="error-hint">
              原因の切り分けは <a href="/api/diag" target="_blank" rel="noopener noreferrer">/api/diag</a> で確認できます。
              楽天APIのHTTPステータスとエラー本文、アフィリエイト計測の有無が表示されます。
            </p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state">
            <p>🔍 商品が見つかりませんでした。別のキーワードをお試しください。</p>
          </div>
        )}

        {compareList.length > 0 && (
          <ComparisonTable
            items={compareList}
            onRemove={(code) => setCompareList(prev => prev.filter(p => p.itemCode !== code))}
            onClear={() => setCompareList([])}
          />
        )}

        {!loading && products.length > 0 && (
          <>
            <div className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
              {sortedProducts.map((item) => (
                <ProductCard
                  key={item.itemCode}
                  item={item}
                  viewMode={viewMode}
                  isSelected={compareList.some(p => p.itemCode === item.itemCode)}
                  onToggleCompare={toggleCompare}
                  isCheapest={item.itemCode === cheapestCode}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page <= 1}
                  onClick={() => handlePage(page - 1)}
                  className="page-btn"
                >← 前へ</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, page - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePage(p)}
                      className={`page-btn ${page === p ? 'active' : ''}`}
                    >{p}</button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => handlePage(page + 1)}
                  className="page-btn"
                >次へ →</button>
              </div>
            )}
          </>
        )}

        {/* SEO and Volume boosting section */}
        <ArticleSection />

        {/* Ranking sidebar */}
        <RankingSection />
      </main>

      <Footer />
    </div>
  );
}
