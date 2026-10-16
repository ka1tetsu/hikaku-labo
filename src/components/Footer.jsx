import { PRODUCT_CATEGORIES, categoryPath } from '../shared/productCategories.js';
import { SITE_SECTIONS } from '../shared/siteDirectory.js';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <h3>比較ラボとは</h3>
                        <p>楽天市場の商品データをもとに価格・ポイント還元・レビューを比較し、Amazon・Yahoo!ショッピングの検索結果もあわせて確認できる比較サイトです。</p>
                    </div>
                    <div>
                        <h3>カテゴリ</h3>
                        <ul>
                            {PRODUCT_CATEGORIES.map(category => (
                                <li key={category.slug}>
                                    <a href={categoryPath(category)}>{category.label}の価格比較</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3>比較ツール</h3>
                        <ul>
                            {SITE_SECTIONS.map(section => (
                                <li key={section.id}><a href={section.href}>{section.nav}</a></li>
                            ))}
                        </ul>
                        <h3>サポート</h3>
                        <ul>
                            <li><a href="#disclosure">アフィリエイト開示</a></li>
                            <li><a href="#privacy">プライバシーポリシー</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-policy" id="disclosure">
                    <h4>アフィリエイト開示</h4>
                    <p>
                        当サイトは楽天アフィリエイト、Amazonアソシエイト・プログラム、
                        バリューコマース（Yahoo!ショッピング）に参加しています。
                        掲載中の商品リンクを経由して購入された場合、当サイトは各プログラムから手数料を受け取ります。
                        購入者の負担する金額が変わることはありません。
                        購入ボタンの遷移先は楽天市場を優先しています。
                    </p>
                    <p>
                        Amazonアソシエイトとして、当サイトは適格販売により収入を得ています。
                    </p>
                </div>

                <div className="footer-policy" id="privacy">
                    <h4>プライバシーポリシー</h4>
                    <p>
                        当サイトは商品検索のため楽天ウェブサービスを利用しており、検索キーワードが楽天株式会社に送信されます。
                        各アフィリエイトプログラムのリンクを経由した際は、各社の定めるCookieが設定される場合があります。
                        当サイト自身は氏名・住所・メールアドレス等の個人情報を収集していません。
                        外部サイトへのリンクがクリックされた際は、改善のため「どのページのどの枠から、どの送客先へ」の情報のみを集計します（検索語や個人を特定する情報は含みません）。
                    </p>
                </div>

                <div className="footer-affiliate-note">
                    ※ 商品の価格・在庫・ポイント倍率は楽天市場APIの取得時点の情報です。最新の内容は各商品ページでご確認ください。
                </div>
                <div className="footer-copy">© 2026 比較ラボ All Rights Reserved.</div>
            </div>
        </footer>
    );
}
