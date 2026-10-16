import { categoryPath } from '../shared/productCategories.js';

// 検索エンジンが辿れるよう <a href> で出力し、クリック時は画面遷移せずに切り替える
export default function CategoryNav({ categories, activeCategory, onSelect }) {
    return (
        <nav className="category-nav" aria-label="商品カテゴリ">
            <div className="container category-nav-inner">
                {categories.map(cat => {
                    const active = activeCategory?.slug === cat.slug;
                    return (
                        <a
                            key={cat.slug}
                            href={categoryPath(cat)}
                            className={`cat-btn ${active ? 'active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                            onClick={(event) => {
                                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;
                                event.preventDefault();
                                onSelect(cat);
                            }}
                        >
                            <span className="cat-label">{cat.label}</span>
                        </a>
                    );
                })}
            </div>
        </nav>
    );
}
