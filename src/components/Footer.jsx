const FOOTER_CATEGORIES = [
    { label: 'スマートフォン', genreId: '101240' },
    { label: 'パソコン', genreId: '501293' },
    { label: 'テレビ', genreId: '213010' },
    { label: 'カメラ', genreId: '201026' },
    { label: 'イヤホン', genreId: '216131' },
];

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div>
                        <h3>比較ラボとは</h3>
                        <p>楽天市場の商品情報をもとに価格やポイントを整理し、ほかのサービスも比較するための情報を提供しています。販売先の最新条件をご確認ください。</p>
                    </div>
                    <div>
                        <h3>カテゴリ</h3>
                        <ul>
                            {FOOTER_CATEGORIES.map(({ label, genreId }) => (
                                <li key={genreId}>
                                    <a href={`?genreId=${genreId}&keyword=${encodeURIComponent(label)}`}>{label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
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
                        当サイトではサイトの改善と広告リンクの利用状況の把握のため、個人を識別しない範囲で、閲覧したページの種類・流入元の種類（検索・SNSなど）・遷移先サービス・クリック位置・時刻を記録し、日ごとの合計値として集計しています。訪問者数は、日ごとに変わる値で暗号化した情報から推計しており、IPアドレスやブラウザ情報そのものは保存していません。独自の識別用Cookieは使用していません。
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
