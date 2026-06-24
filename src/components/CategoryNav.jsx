export default function CategoryNav({ categories, activeCategory, onSelect }) {
    return (
        <nav className="category-nav" aria-label="商品カテゴリ">
            <div className="container category-nav-inner">
                {categories.map(cat => (
                    // クローラーがたどれるよう実hrefを持たせ、クリック時はSPA挙動に切り替える
                    <a
                        key={cat.label}
                        href={`/?cat=${cat.genreId}`}
                        className={`cat-btn ${activeCategory?.label === cat.label ? 'active' : ''}`}
                        onClick={(e) => {
                            // 修飾キー付きクリック(別タブで開く等)はブラウザ既定に任せる
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                            e.preventDefault();
                            onSelect(cat);
                        }}
                    >
                        <span className="cat-label">{cat.label}</span>
                    </a>
                ))}
            </div>
        </nav>
    );
}
