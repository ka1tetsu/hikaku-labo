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
                            <li><a href="#">スマートフォン</a></li>
                            <li><a href="#">パソコン・タブレット</a></li>
                            <li><a href="#">テレビ・映像機器</a></li>
                            <li><a href="#">カメラ</a></li>
                            <li><a href="#">イヤホン・ヘッドホン</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3>サポート</h3>
                        <ul>
                            <li><a href="#">プライバシーポリシー</a></li>
                            <li><a href="#">利用規約</a></li>
                            <li><a href="#">アフィリエイト開示</a></li>
                            <li><a href="#">お問い合わせ</a></li>
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
