import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import SectionDirectory from './shared/SectionDirectory.jsx';
import './shared/home-refresh.css';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import CategoryNav from './components/CategoryNav';
import RankingSection from './components/RankingSection';
import ArticleSection from './components/ArticleSection';
import ComparisonTable from './components/ComparisonTable';
import MallSearchFallback from './components/MallSearchFallback';
import CategoryGuide, { CategoryHero } from './components/CategoryGuide';
import { searchRakutenItems, buildMallSearchLinks } from './api';
import { trackOutbound } from './shared/track';
import {
  PRODUCT_CATEGORIES,
  categoryPageTitle,
  categoryPath,
  resolveInitialView,
} from './shared/productCategories.js';
import './index.css';

const DEFAULT_KEYWORD = 'おすすめ 人気';
const HOME_TITLE = '比較ラボ - あらゆる商品・サービスの総合比較サイト';
const MALL_BAR_KEYWORDS = ['ワイヤレスイヤホン', 'ノートパソコン', '4Kテレビ', 'ドラム式洗濯機'];

function currentLocation() {
  if (typeof window === 'undefined') return { pathname: '/', search: '' };
  return { pathname: window.location.pathname, search: window.location.search };
}

export default function App({ initialPath, initialSearch = '' }) {
  const [initialView] = useState(() => {
    const loc = initialPath ? { pathname: initialPath, search: initialSearch } : currentLocation();
    return resolveInitialView(loc.pathname, loc.search);
  });
  const [query, setQuery] = useState(initialView.keyword);
  const [inputValue, setInputValue] = useState(initialView.keyword);
  const [products, setProducts] = useState([]);
  // 初回は必ず検索するので loading から始める（静的HTMLに「見つかりません」を出さないため）
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(initialView.category);
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
      // モックで取り繕わず、実際の失敗を伝える（偽の商品で比較させないため）。
      // 技術的な詳細は訪問者ではなく開発者向けにコンソールへ出す。
      console.error('[hikaku-labo] 商品データの取得に失敗しました。/api/diag で原因を確認してください。', e);
      setError(e.message || '商品データの取得に失敗しました。');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const runView = useCallback((view) => {
    setActiveCategory(view.category);
    setQuery(view.keyword);
    setInputValue(view.keyword);
    setCompareList([]);
    if (view.category) doSearch(view.category.keyword, view.category.genreId, 1);
    else doSearch(view.keyword || DEFAULT_KEYWORD, '', 1);
  }, [doSearch]);

  // 初回ロード（URL由来の状態で検索）と、ブラウザの戻る/進む
  useEffect(() => {
    runView(initialView);
    const onPop = () => {
      const loc = currentLocation();
      runView(resolveInitialView(loc.pathname, loc.search));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [initialView, runView]);

  // タイトルを表示内容に合わせる（共有・ブックマーク・ブラウザ履歴で分かりやすくする）
  useEffect(() => {
    if (activeCategory) document.title = categoryPageTitle(activeCategory);
    else if (query) document.title = `「${query}」の価格比較・最安値｜比較ラボ`;
    else document.title = HOME_TITLE;
  }, [activeCategory, query]);

  const navigate = (url) => {
    if (window.location.pathname + window.location.search !== url) window.history.pushState(null, '', url);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const kw = inputValue.trim();
    if (!kw) return;
    navigate(`/?keyword=${encodeURIComponent(kw)}`);
    runView({ category: null, keyword: kw });
  };

  const handleCategory = (cat) => {
    navigate(categoryPath(cat));
    runView({ category: cat, keyword: '' });
  };

  const handlePage = (newPage) => {
    if (activeCategory) doSearch(activeCategory.keyword, activeCategory.genreId, newPage);
    else doSearch(query || DEFAULT_KEYWORD, '', newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const searchTitle = activeCategory
    ? `「${activeCategory.label}」の人気商品・最安値`
    : query
      ? `「${query}」の検索結果`
      : '注目の人気商品';

  const fallbackKeyword = activeCategory ? activeCategory.keyword : (query || DEFAULT_KEYWORD);
  const mallBarKeywords = activeCategory ? activeCategory.related : MALL_BAR_KEYWORDS;

  return (
    <div className="app-wrapper">
      <Header
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSearch={handleSearch}
      />

      <CategoryNav
        categories={PRODUCT_CATEGORIES}
        activeCategory={activeCategory}
        onSelect={handleCategory}
      />

      <main id="main-content" className="main-content container">
        {activeCategory ? <CategoryHero category={activeCategory} /> : <SectionDirectory />}

        {/* 主要モールの検索結果への計測付きリンク */}
        <div className="affiliate-bar">
          <div className="affiliate-bar-title">
            主要モールの検索結果を比較・確認
          </div>
          <div className="affiliate-bar-links">
            {mallBarKeywords.map(kw => (
              <div key={kw} className="affiliate-kw-group">
                <span className="kw-label">{kw}：</span>
                {buildMallSearchLinks(kw).map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className={`kw-link ${link.id}`}
                    onClick={() => trackOutbound({ section: 'products', target: link.id, placement: 'mall-bar' })}
                  >{link.id === 'rakuten' ? '楽天' : link.id === 'yahoo' ? 'Yahoo' : link.label}</a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="results-header" id="results">
          <div className="hl-results-heading"><span className="hl-kicker"><span className="hl-kicker-dot"/> PRODUCT RESEARCH</span><h2 className="results-title">{searchTitle}</h2><p className="hl-results-caption">商品情報は楽天市場の取得時点のものです。最新の価格や送料、ポイント条件は販売ページでご確認ください。</p></div>
          {products.length > 0 && (
            <div className="results-controls">
              <select
                aria-label="検索結果の並び順"
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
                  aria-label="グリッド表示"
                  aria-pressed={viewMode === 'grid'}
                >⊞</button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  title="リスト表示"
                  aria-label="リスト表示"
                  aria-pressed={viewMode === 'list'}
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

        {!loading && error && (
          <MallSearchFallback keyword={fallbackKeyword} related={mallBarKeywords} />
        )}

        {!loading && !error && products.length === 0 && (
          <>
            <div className="empty-state">
              <p>🔍 当サイトの検索では商品が見つかりませんでした。各モールでも探せます。</p>
            </div>
            <MallSearchFallback keyword={fallbackKeyword} related={mallBarKeywords} placement="empty" />
          </>
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

        {activeCategory && <CategoryGuide category={activeCategory} />}

        <ArticleSection />

        <RankingSection />

        {activeCategory && <SectionDirectory headingLevel="h2" />}
      </main>

      <Footer />
    </div>
  );
}
