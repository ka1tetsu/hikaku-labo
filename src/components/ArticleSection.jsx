export default function ArticleSection() {
    const articles = [
        {
            title: "【2024年最新】絶対に失敗しないスマートフォンおすすめ徹底比較！iPhone vs Android",
            category: "スマートフォン",
            image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=200&fit=crop",
            date: "2024.03.05",
            views: "1.2M",
            desc: "最新のiPhone 15から高コスパAndroidまで、カメラ性能・バッテリー・価格を徹底比較。あなたにぴったりの1台が必ず見つかります。"
        },
        {
            title: "【コスパ最強】プロが選ぶ！仕事もゲームも快適なノートパソコン・ランキング",
            category: "パソコン",
            image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=200&fit=crop",
            date: "2024.03.01",
            views: "850K",
            desc: "リモートワークや動画編集、PCゲームまで。用途別の推奨スペックと、今最も「買い」なモデルを価格順にリストアップ！"
        },
        {
            title: "ノイズキャンセリング搭載ワイヤレスイヤホン全40機種・実機レビュー",
            category: "イヤホン",
            image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop",
            date: "2024.02.28",
            views: "640K",
            desc: "AirPods Pro、Sony、Boseから高コスパAnkerまで。実際に電車内やカフェで使って分かった「本当のノイズキャンセル力」を評価。"
        }
    ];

    return (
        <div className="article-section">
            <h2 className="section-title">
                <span className="section-icon">📖</span> 専門家による「徹底比較」記事・購買ガイド解説
                <span className="seo-subtitle">（月間1000万PV突破！賢いお買い物をサポートします）</span>
            </h2>
            <div className="article-grid">
                {articles.map((article, idx) => (
                    <a href="#article" className="article-card" key={idx}>
                        <div className="article-img-wrapper">
                            <span className="article-category">{article.category}</span>
                            <img src={article.image} alt={article.title} className="article-img" loading="lazy" />
                        </div>
                        <div className="article-content">
                            <div className="article-meta">
                                <span className="article-date">{article.date}</span>
                                <span className="article-views">👁️ {article.views} PV</span>
                            </div>
                            <h3 className="article-title">{article.title}</h3>
                            <p className="article-desc">{article.desc}</p>
                            <span className="article-readmore">記事を読む ▶</span>
                        </div>
                    </a>
                ))}
            </div>

            <div className="seo-text-block">
                <h3>比較ラボが「価格.com」を超える圧倒的な情報量を提供する理由</h3>
                <p>
                    当サイトでは、Amazon、楽天市場、Yahoo!ショッピングをはじめ、全国の主要な家電量販店や専門ショップの<strong>リアルタイム在庫・価格データ数百万件</strong>を常時モニタリングしています。<br />
                    さらに、独自のAI価格推移予測エンジンと、専門家による独自レビューを組み合わせることで、「今買うべきか」「どこが一番お得か」をかつてない精度で導き出します。
                </p>
            </div>
        </div>
    );
}
