import SiteFooter from './shared/SiteFooter.jsx';
import { recordOutboundClick } from './shared/outboundClient.js';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import SavingsPlanner from './services/SavingsPlanner.jsx';
import SectionDirectory from './shared/SectionDirectory.jsx';
import SiteConcierge from './shared/SiteConcierge.jsx';
import { describeProductRequest, parseProductRequest } from './shared/productAdvisor.js';
import { openConcierge } from './shared/conciergeActions.js';
import './shared/home-refresh.css';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import ProductSearchLinks from './components/ProductSearchLinks.jsx';
import CategoryNav from './components/CategoryNav';
import RankingSection from './components/RankingSection';
import ArticleSection from './components/ArticleSection';
import ComparisonTable from './components/ComparisonTable';
import { buildAmazonAffiliateUrl, buildYahooAffiliateUrl, buildRakutenSearchAffiliateUrl } from './api';
import { searchCatalogItems } from './shared/catalogSearch.js';
import { isSpecificProductQuery } from './shared/productSearchIntent.js';
import { confidenceAdjustedRating } from './shared/reviewEvidence.js';
import { CATALOG_FILTER_DEFAULTS, catalogFilterCount, filterCatalogResults } from './shared/catalogFilters.js';
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
  const [providerSources, setProviderSources] = useState({});
  const [verifiedOnly,setVerifiedOnly]=useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [sortMode, setSortMode] = useState('popular');
  const [catalogFilters, setCatalogFilters] = useState({ ...CATALOG_FILTER_DEFAULTS });
  const [compareList, setCompareList] = useState([]);
  // Natural-language search ("母の日のプレゼント 3000円くらい") → keyword + filters.
  const [smart, setSmart] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchController = useRef(null);
  useEffect(() => () => searchController.current?.abort(), []);

  const MAX_COMPARE = 4;

  const toggleCompare = useCallback((item) => {
    setCompareList(prev => {
      const exists = prev.some(p => p.itemCode === item.itemCode);
      if (exists) return prev.filter(p => p.itemCode !== item.itemCode);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, item];
    });
  }, []);

  const visibleProducts = useMemo(() => filterCatalogResults(products, catalogFilters), [products, catalogFilters]);
  const filterCount = catalogFilterCount(catalogFilters);
  // Sort only the currently visible offers; source relevance is retained for broad queries.
  const sortedProducts = useMemo(() => {
    const list = [...visibleProducts];
    switch (sortMode) {
      case 'price-asc': return list.sort((a, b) => a.itemPrice - b.itemPrice);
      case 'price-desc': return list.sort((a, b) => b.itemPrice - a.itemPrice);
      case 'effective-asc': return list.sort((a, b) => a.effectivePrice - b.effectivePrice);
      case 'review': return list.sort((a, b) =>
        confidenceAdjustedRating(b.reviewAverage,b.reviewCount)-confidenceAdjustedRating(a.reviewAverage,a.reviewCount)
        || b.reviewCount-a.reviewCount || a.itemPrice-b.itemPrice);
      case 'review-count': return list.sort((a, b) => b.reviewCount - a.reviewCount);
      default: return list; // Yahoo! API's official recommendation/search relevance order
    }
  }, [visibleProducts, sortMode]);

  // 実質価格が最安の商品（同額なら先頭）
  const cheapestCode = useMemo(() => {
    if (!isSpecificProductQuery(query)) return null;
    // Only a verified match can be advertised as a price comparison for one model.
    const eligible = visibleProducts.filter(item => item.sameProduct);
    if (!eligible.length) return null;
    return eligible.reduce((min,p) =>
      (sortMode==='effective-asc'?p.effectivePrice:p.itemPrice) <
      (sortMode==='effective-asc'?min.effectivePrice:min.itemPrice) ? p : min).itemCode;
  }, [visibleProducts,query,sortMode]);

  const doSearch = useCallback(async (kw, genre, pg = 1, options = {}) => {
    if (!kw && !genre) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setHasSearched(true);
    setLoading(true);
    setError(null);
    if (options.scroll === true) document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const data = await searchCatalogItems(kw, genre, pg, { ...options, signal: controller.signal });
      if (controller.signal.aborted) return;
      setProducts(data.items);
      setProviderSources(data.sources);
      setVerifiedOnly(data.verifiedOnly);
      setTotalPages(Math.min(data.pageCount, 100));
      setPage(pg);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e.message || '商品データの取得に失敗しました。');
      setProducts([]);
      setProviderSources({});
    } finally {
      if (searchController.current === controller && !controller.signal.aborted) setLoading(false);
    }
  }, []);

  // 初回ロード。?keyword= / ?genreId= が付いていればそれを検索する
  // （フッターのカテゴリリンクからの遷移に対応）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kw = params.get('keyword') || '';
    const genre = params.get('genreId') || '';

    if (kw || genre) {
      setSortMode(isSpecificProductQuery(kw)?'price-asc':'popular');
      setInputValue(kw);
      setQuery(kw);
      const matched = CATEGORIES.find(c => c.genreId === genre);
      if (matched) setActiveCategory(matched);
      doSearch(kw || matched?.label || '', genre, 1);
    } else {
      // Load a clearly identified popular category, not fabricated recommendations.
      setQuery('ワイヤレスイヤホン');
      doSearch('ワイヤレスイヤホン', '', 1);
    }
  }, [doSearch]);

  // The concierge's "比較ページで一覧を見る" runs the search on this page.
  useEffect(() => {
    const onAction = (event) => {
      if (event.detail?.type !== 'products' || !event.detail.keyword) return;
      event.preventDefault();
      const kw = event.detail.keyword;
      setInputValue(kw);
      setQuery(kw);
      setActiveCategory(null);
      setSmart(null);
      setSortMode(isSpecificProductQuery(kw)?'price-asc':'popular');
      setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS });
      doSearch(kw, '', 1, { scroll: true });
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('hikaku:concierge-action', onAction);
    return () => window.removeEventListener('hikaku:concierge-action', onAction);
  }, [doSearch]);

  // Plain product names search as typed; wishes, budgets and preferences are interpreted.
  const runSmartSearch = (text) => {
    const request = parseProductRequest(text);
    const interpreted = request.keyword && (request.need || request.maxPrice || request.minPrice || request.freeShipping || request.sort !== 'standard');
    setActiveCategory(null);
    if (!interpreted) {
      setSmart(null);
      setQuery(text);
      setSortMode(isSpecificProductQuery(text)?'price-asc':'popular');
      setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS });
      setCompareList([]);
      doSearch(text, '', 1, { scroll: true });
      return;
    }
    const options = { minPrice: request.minPrice, maxPrice: request.maxPrice, sort: request.sort, freeShipping: request.freeShipping };
    setSmart({ original: text, keyword: request.keyword, options, summary: describeProductRequest(request), alternatives: request.need ? request.need.keywords.filter(k => k !== request.keyword) : [] });
    if (request.sort === '+itemPrice') setSortMode('price-asc');
    else if (isSpecificProductQuery(request.keyword)) setSortMode('price-asc');
    else if (request.sort !== '-reviewAverage') setSortMode('popular');
    if (request.sort === '-reviewAverage') setSortMode('review');
    setQuery(request.keyword);
    setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS });
    setCompareList([]);
    doSearch(request.keyword, '', 1, { ...options, scroll: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    runSmartSearch(inputValue.trim());
  };

  const searchAlternative = (keyword) => {
    setSmart(current => current && { ...current, keyword, alternatives: [current.keyword, ...current.alternatives.filter(k => k !== keyword)] });
    setQuery(keyword);
    setSortMode(isSpecificProductQuery(keyword)?'price-asc':'popular');
    setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS });
    setCompareList([]);
    doSearch(keyword, '', 1, { ...(smart?.options || {}), scroll: true });
  };

  const handleCategory = (cat) => {
    setSmart(null);
    setActiveCategory(cat);
    setSortMode('popular');
    setQuery('');
    setInputValue('');
    setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS });
    setCompareList([]);
    doSearch(cat.label, cat.genreId, 1, { scroll: true });
  };

  const handlePage = (newPage) => {
    doSearch(query || activeCategory?.label || '', activeCategory?.genreId || '', newPage, { ...(smart?.options || {}), scroll: true });
  };

  const searchTitle = activeCategory
    ? `「${activeCategory.label}」の掲載商品・価格一覧`
    : query
      ? `「${query}」の検索結果`
      : 'おすすめ商品を探す';

  return (
    <div className="app-wrapper">
      <Header
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSearch={handleSearch}
      />

      <section className="hl-travel-priority" aria-label="旅行比較へのクイックアクセス">
        <div><span>FLIGHTS &amp; STAYS</span><strong>航空券とホテルを、旅行先・日付・人数から比較</strong>
          <p>Google フライト・楽天トラベル・Booking.comほか、掲載予約サイトへの検索条件を引き継ぎます。価格は各予約先で確認。</p></div>
        <a href="/travel/?destination=naha#booking">那覇の航空券・ホテルを探す →</a>
        <a href="/travel/#global-travel-compare">すべての掲載予約サイトを比較 →</a>
      </section>
      <CategoryNav
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelect={handleCategory}
      />

      <main id="main-content" className="main-content container">
        <SectionDirectory />

        {/* Affiliate Quick search bar */}
        <div className="affiliate-bar">
          <div className="affiliate-bar-title">
            主要モールの検索結果を比較・確認
            <a className="affiliate-compare-link" href="/compare/">型番で全ショップの価格を比較 →</a>
          </div>
          <div className="affiliate-bar-links">
            {['スマートフォン', 'ノートPC', '液晶テレビ', 'ドラム式洗濯機'].map(kw => (
              <div key={kw} className="affiliate-kw-group">
                <span className="kw-label">{kw}：</span>
                <a href={buildRakutenSearchAffiliateUrl(kw)} target="_blank" rel="noopener noreferrer sponsored" className="kw-link rakuten" onClick={() => recordOutboundClick({ section: 'products', merchant: 'rakuten', placement: 'quick-search', sponsored: true })}>楽天</a>
                <a href={buildAmazonAffiliateUrl(kw)} target="_blank" rel="noopener noreferrer sponsored" className="kw-link amazon" onClick={() => recordOutboundClick({ section: 'products', merchant: 'amazon', placement: 'quick-search', sponsored: true })}>Amazon</a>
                <a href={buildYahooAffiliateUrl(kw)} target="_blank" rel="noopener noreferrer sponsored" className="kw-link yahoo" onClick={() => recordOutboundClick({ section: 'products', merchant: 'yahoo-shopping', placement: 'quick-search', sponsored: true })}>Yahoo</a>
              </div>
            ))}
          </div>
        </div>

        <div className="results-header" id="results">
          <div className="hl-results-heading"><span className="hl-kicker"><span className="hl-kicker-dot"/> PRODUCT RESEARCH</span><h2 className="results-title">{searchTitle}</h2><p className="hl-results-caption">楽天市場・Yahoo!ショッピングの取得できた公式API出品を表示します。送料・在庫・ポイント条件はショップで再確認してください。</p>
            {hasSearched && !loading && <p className="hl-provider-status" role="status">取得状況：Yahoo!ショッピング {providerSources.yahoo==='ok'?'取得できました':providerSources.yahoo==='error'?'取得できませんでした':'未接続'} ／ 楽天市場 {providerSources.rakuten==='ok'?'取得できました':providerSources.rakuten==='error'?'取得できませんでした':providerSources.rakuten==='skipped'?'おすすめ検索では対象外':'未接続'}。表示していないモールの価格は含みません。</p>}
            {hasSearched && !loading && verifiedOnly && <p className="hl-match-status">型番・JAN一致を確認できた出品を優先。色・容量・セット内容は購入先で確認してください。</p>}</div>
          {products.length > 0 && (
            <div className="results-controls">
              <select
                aria-label="検索結果の並び順"
                value={sortMode}
                onChange={e => setSortMode(e.target.value)}
                className="sort-select"
              >
                <option value="popular">おすすめ順（取得元の関連度）</option>
                <option value="effective-asc">ポイント考慮後の参考額順</option>
                <option value="price-asc">価格が安い順</option>
                <option value="price-desc">価格が高い順</option>
                <option value="review">口コミの評価順（投稿件数を考慮）</option>
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

        {hasSearched && <ProductSearchLinks keyword={query || activeCategory?.label || ''} />}

        {!loading && products.length > 0 && <section className="hl-catalog-filter-panel" aria-label="商品結果の絞り込み">
          <div className="hl-catalog-filter-heading">
            <strong>候補を自分の条件で絞る</strong>
            <span role="status">{visibleProducts.length}件を表示 / このページで取得した{products.length}件</span>
          </div>
          <div className="hl-catalog-filters">
            <label>販売サイト<select value={catalogFilters.store} onChange={e=>setCatalogFilters(v=>({...v,store:e.target.value}))}>
              <option value="all">取得した全サイト</option><option value="yahoo">Yahoo!ショッピング</option><option value="rakuten">楽天市場</option>
            </select></label>
            <label>予算（商品価格）<select value={catalogFilters.maxPrice} onChange={e=>setCatalogFilters(v=>({...v,maxPrice:Number(e.target.value)}))}>
              <option value="0">指定なし</option><option value="5000">5,000円以下</option><option value="10000">10,000円以下</option>
              <option value="30000">30,000円以下</option><option value="50000">50,000円以下</option><option value="100000">100,000円以下</option>
            </select></label>
            <label>レビュー評価<select value={catalogFilters.minReview} onChange={e=>setCatalogFilters(v=>({...v,minReview:Number(e.target.value)}))}>
              <option value="0">指定なし</option><option value="4">4.0以上（レビューあり）</option><option value="4.5">4.5以上（レビューあり）</option>
            </select></label>
            <label className="hl-shipping-checkbox"><input type="checkbox" checked={catalogFilters.freeShippingOnly} onChange={e=>setCatalogFilters(v=>({...v,freeShippingOnly:e.target.checked}))}/>送料無料の表示がある出品のみ</label>
            {filterCount>0 && <button type="button" className="hl-reset-filters" onClick={()=>setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS })}>絞り込みを解除</button>}
          </div>
          <p>このページで取得できた候補だけを絞り込みます。送料込み総額ではなく、出品元の商品価格です。</p>
          {visibleProducts.length===0 && <div className="hl-filter-empty" role="status">この条件に一致する候補はありません。予算や送料条件を変更してください。<button type="button" onClick={()=>setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS })}>すべて表示</button></div>}
        </section>}

        {smart && (
          <div className="hl-smart-search" role="status">
            <p><strong>「{smart.original}」</strong>を、<strong>{smart.keyword}</strong>{smart.summary.filter(item => !item.startsWith('検索:') && item !== smart.keyword).length > 0 && <>（{smart.summary.filter(item => !item.startsWith('検索:')).join('・')}）</>}で検索しました。</p>
            {smart.alternatives.length > 0 && <div className="hl-smart-chips"><span>ほかの候補：</span>{smart.alternatives.map(k => <button type="button" key={k} onClick={() => searchAlternative(k)}>{k}</button>)}</div>}
            <button type="button" className="hl-smart-ask" onClick={() => openConcierge(smart.original)}>✳ 入力条件から別の候補を探す</button>
          </div>
        )}

        {!hasSearched && <div className="hl-search-intro"><h3>買いたい商品が決まっていますか？</h3><p>上の検索窓に商品名や型番を入力してください。価格取得に対応していないショップも、検索結果へのリンクから確認できます。</p><a className="vl-primary" href="/compare/">ショップを横断して価格を比較 →</a></div>}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>商品を検索中...</p>
          </div>
        )}

        {error && (
          <div className="error-box">
            <strong>今回、公式APIの商品情報を取得できませんでした。</strong>
            <p>楽天が停止していてもYahoo!の出品を表示できるように修正しました。両方取得できない場合は下のGoogle検索またはショップの検索結果で探せます。</p>
            <a href={'https://www.google.com/search?q='+encodeURIComponent((query||activeCategory?.label||'商品')+' 価格 比較')} target="_blank" rel="noopener noreferrer">Googleでショップを横断検索 ↗</a>
            <a href={'/compare/?q='+encodeURIComponent(query||activeCategory?.label||'')} >商品価格比較ページで探す →</a>
            <button type="button" className="page-btn" onClick={() => doSearch(query || activeCategory?.label || 'おすすめ 人気', activeCategory?.genreId || '', page, smart?.options || {})}>もう一度読み込む</button>
          </div>
        )}

        {!loading && !error && hasSearched && products.length === 0 && (
          <div className="empty-state">
            <p>{Object.values(providerSources).some(s=>s==='ok')?'今回の条件では該当商品を取得できませんでした。型番やキーワードを変更するか各ショップで検索してください。':'今回、取得元のAPIから出品を取得できませんでした。Google検索・Yahoo!・楽天のリンクから直接確認できます。'}</p>
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
                  isPointSorted={sortMode === 'effective-asc'}
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

        {/* Fixed-cost savings belong after the visitor's primary product-price task. */}
        <SavingsPlanner />
      </main>

      <Footer />
    <SiteFooter />
      <SiteConcierge section="products" />
    </div>
  );
}
