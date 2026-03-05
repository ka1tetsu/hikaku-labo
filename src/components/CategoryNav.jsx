export default function CategoryNav({ categories, activeCategory, onSelect }) {
    return (
        <nav className="category-nav">
            <div className="container category-nav-inner">
                {categories.map(cat => (
                    <button
                        key={cat.label}
                        className={`cat-btn ${activeCategory?.label === cat.label ? 'active' : ''}`}
                        onClick={() => onSelect(cat)}
                    >
                        <span className="cat-emoji">{cat.emoji}</span>
                        <span className="cat-label">{cat.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
