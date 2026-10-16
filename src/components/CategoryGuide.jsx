import { buildMallSearchLinks } from '../api';
import { trackOutbound } from '../shared/track';

// カテゴリ別ランディングページの見出し・選び方ガイド。
// 静的HTMLにも出力されるため、検索エンジンが読めるテキストの本体になる。
export function CategoryHero({ category }) {
  return (
    <section className="category-hero" aria-labelledby="category-hero-title">
      <span className="hl-kicker"><span className="hl-kicker-dot" /> PRICE COMPARISON</span>
      <h1 id="category-hero-title">{category.label}の価格比較・最安値</h1>
      <p>{category.description}</p>
    </section>
  );
}

export default function CategoryGuide({ category }) {
  return (
    <section className="category-guide" aria-labelledby="category-guide-title">
      <h2 id="category-guide-title" className="section-title">{category.label}の選び方：購入前のチェックポイント</h2>
      <div className="about-grid">
        {category.guide.map(point => (
          <div key={point.title} className="about-card">
            <h3>{point.title}</h3>
            <p>{point.body}</p>
          </div>
        ))}
      </div>
      <div className="category-guide-links">
        <span>{category.label}の関連キーワードで探す：</span>
        <ul>
          {category.related.map(kw => (
            <li key={kw}>
              {kw}
              {buildMallSearchLinks(kw).map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`kw-link ${link.id}`}
                  onClick={() => trackOutbound({ section: 'products', target: link.id, placement: 'category-guide' })}
                >{link.id === 'yahoo' ? 'Yahoo' : link.label === '楽天市場' ? '楽天' : link.label}</a>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
