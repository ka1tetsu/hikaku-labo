export default function CategoryNav({ categories, activeCategory, onSelect }) {
    return (
        <nav className="category-nav" aria-label="商品カテゴリ">
            <div className="container category-nav-inner">
                {categories.map(cat => (
                    <button
                        key={cat.label}
                        className={`cat-btn ${activeCategory?.label === cat.label ? 'active' : ''}`}
                        type="button"
                        aria-pressed={activeCategory?.label === cat.label}
                        onClick={() => onSelect(cat)}
                    >
                        <span className="cat-label">{cat.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
