// このサイトが実際にやっていることだけを書くセクション。
// 以前あった「月間1000万PV突破」「数百万件を常時モニタリング」「独自のAI価格推移予測エンジン」
// 「専門家による独自レビュー」は、いずれも実体がなく景表法上の優良誤認にあたるため削除した。
export default function ArticleSection() {
    return (
        <div className="article-section">
            <h2 className="section-title">
                <span className="section-icon">📖</span> 当サイトの価格比較について
            </h2>

            <div className="about-grid">
                <div className="about-card">
                    <h3>データの出どころ</h3>
                    <p>
                        掲載している商品名・価格・ポイント倍率・送料区分・レビュー評価は、
                        すべて<strong>楽天市場の商品検索APIから取得した実データ</strong>です。
                        表示時点の値であり、当サイトが独自に価格を推定・予測することはありません。
                    </p>
                </div>

                <div className="about-card">
                    <h3>実質価格の計算方法</h3>
                    <p>
                        <code>実質価格 = 商品価格 − ポイント還元相当額</code><br />
                        ポイント還元相当額は楽天APIが返すポイント倍率から算出しています。
                        キャンペーンやSPUによる加算は反映されません。
                    </p>
                </div>

                <div className="about-card">
                    <h3>送料の扱い</h3>
                    <p>
                        楽天APIは送料の<strong>金額</strong>を返さないため、実質価格に送料は含めていません。
                        「送料別」の商品はその分だけ安く表示されるので、
                        バッジと注記でその旨を明示しています。
                    </p>
                </div>

                <div className="about-card">
                    <h3>収益について</h3>
                    <p>
                        当サイトは楽天アフィリエイト・Amazonアソシエイト・バリューコマースに参加しており、
                        商品リンク経由で購入された場合に手数料を受け取ります。
                        購入ボタンの遷移先は<strong>楽天市場を優先</strong>しています。
                        表示している価格・ポイント・レビューの数値自体は、
                        楽天APIの取得値をそのまま出しており加工していません。
                    </p>
                </div>
            </div>
        </div>
    );
}
