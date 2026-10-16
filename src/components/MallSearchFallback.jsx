import { buildMallSearchLinks } from '../api';
import { trackOutbound } from '../shared/track';

// 楽天APIから商品データを取れないときに出す代替導線。
// 以前はエラー文と /api/diag へのリンクだけを表示しており、訪問者はそのまま離脱していた
// （＝その訪問からの成果はゼロ）。各モールの検索結果へ計測付きリンクで案内する。
export default function MallSearchFallback({ keyword, related = [], placement = 'fallback' }) {
  const main = String(keyword || '').trim() || 'おすすめ 人気';
  const suggestions = related.filter(kw => kw && kw !== main).slice(0, 4);

  return (
    <section className="mall-fallback" aria-labelledby="mall-fallback-title">
      <h2 id="mall-fallback-title" className="mall-fallback-title">
        「{main}」を各ショッピングモールで比較する
      </h2>
      <p className="mall-fallback-lead">
        ただいま当サイトで商品データを表示できません。下のボタンから、各モールの検索結果で
        価格・ポイント・送料を直接確認できます。
      </p>
      <div className="mall-fallback-buttons">
        {buildMallSearchLinks(main).map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`mall-fallback-btn ${link.id}`}
            onClick={() => trackOutbound({ section: 'products', target: link.id, placement })}
          >
            {link.label}で「{main}」を見る ▶
          </a>
        ))}
      </div>
      {suggestions.length > 0 && (
        <div className="mall-fallback-related">
          <span>よく比較されるキーワード：</span>
          {suggestions.map(kw => (
            <a
              key={kw}
              href={buildMallSearchLinks(kw)[0].url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackOutbound({ section: 'products', target: 'rakuten', placement })}
            >{kw}</a>
          ))}
        </div>
      )}
      <p className="mall-fallback-note">※ リンク先は広告（アフィリエイトリンク）を含みます。</p>
    </section>
  );
}
