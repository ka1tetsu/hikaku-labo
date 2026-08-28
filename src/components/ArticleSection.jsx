// 購買ガイド一覧。
// 表示する内容は実際に存在する静的ガイドページ(/guide/*)に対応させる。
// 事実に基づかない実績値（PV数など）は表示しない。
const GUIDES = [
    {
        title: "スマートフォンの選び方｜価格帯別に見る失敗しない選定ポイント",
        category: "スマートフォン",
        href: "/guide/smartphone/",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=200&fit=crop",
        desc: "カメラ・バッテリー・画面サイズなど、価格帯ごとに何が変わるのかを整理。予算から逆算して選ぶ手順を解説します。"
    },
    {
        title: "ノートパソコンの選び方｜用途別に必要なスペックを整理",
        category: "パソコン",
        href: "/guide/pc/",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=200&fit=crop",
        desc: "事務作業・動画編集・ゲームなど用途別に、CPU/メモリ/ストレージの目安をまとめました。過不足のない1台を選ぶために。"
    },
    {
        title: "ワイヤレスイヤホンの選び方｜ノイズキャンセリングと装着感の基礎知識",
        category: "イヤホン",
        href: "/guide/earphone/",
        image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=200&fit=crop",
        desc: "ノイズキャンセリングの仕組み、コーデック、装着方式の違いなど、購入前に押さえておきたい基本を解説します。"
    }
];

export default function ArticleSection() {
    return (
        <div className="article-section">
            <h2 className="section-title">
                <span className="section-icon">📖</span> 購買ガイド・選び方の解説
                <span className="seo-subtitle">（はじめての方でも失敗しない選び方をまとめています）</span>
            </h2>
            <div className="article-grid">
                {GUIDES.map((article, idx) => (
                    <a href={article.href} className="article-card" key={idx}>
                        <div className="article-img-wrapper">
                            <span className="article-category">{article.category}</span>
                            <img src={article.image} alt={article.title} className="article-img" loading="lazy" />
                        </div>
                        <div className="article-content">
                            <h3 className="article-title">{article.title}</h3>
                            <p className="article-desc">{article.desc}</p>
                            <span className="article-readmore">ガイドを読む ▶</span>
                        </div>
                    </a>
                ))}
            </div>

            <div className="seo-text-block">
                <h3>比較ラボについて</h3>
                <p>
                    比較ラボは、楽天市場・Amazon・Yahoo!ショッピングの商品情報を横断して検索・比較できるサービスです。
                    価格・レビュー評価・レビュー件数といった各ECサイトの公開情報をもとに、条件を絞り込みながら候補を並べて比較できます。<br />
                    掲載している価格やレビューは各ECサイトから取得した時点の情報です。最新の価格・在庫状況は必ずリンク先の各販売店でご確認ください。
                </p>
            </div>
        </div>
    );
}
