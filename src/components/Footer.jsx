export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <h3>比較ラボとは</h3>
                        <p>楽天市場・Amazonをはじめとする各ECサイトの価格を比較し、最安値・最適商品をご提案するサービスです。</p>
                    </div>
                    <div>
                        <h3>カテゴリ</h3>
                        <ul>
                            <li><a href="/?cat=101240">スマートフォン</a></li>
                            <li><a href="/?cat=501293">パソコン・タブレット</a></li>
                            <li><a href="/?cat=213010">テレビ・映像機器</a></li>
                            <li><a href="/?cat=201026">カメラ</a></li>
                            <li><a href="/?cat=216131">イヤホン・ヘッドホン</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3>購買ガイド</h3>
                        <ul>
                            <li><a href="/guide/">選び方ガイド一覧</a></li>
                            <li><a href="/guide/smartphone/">スマートフォンの選び方</a></li>
                            <li><a href="/guide/pc/">パソコンの選び方</a></li>
                            <li><a href="/guide/earphone/">イヤホンの選び方</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3>サポート</h3>
                        <ul>
                            <li><a href="/about/">運営者情報</a></li>
                            <li><a href="/privacy/">プライバシーポリシー</a></li>
                            <li><a href="/terms/">利用規約</a></li>
                            <li><a href="/disclosure/">アフィリエイト開示</a></li>
                            <li><a href="/contact/">お問い合わせ</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-affiliate-note">
                    ※ 当サイトは楽天アフィリエイト・Amazonアソシエイトプログラムに参加しています。商品リンクより購入された際に当サイトが収益を得る場合があります。
                </div>
                <div className="footer-copy">© 2026 比較ラボ All Rights Reserved.</div>
            </div>
        </footer>
    );
}
