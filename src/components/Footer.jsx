import React from 'react';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-inner">
                    <div>
                        <h3>比較ラボ</h3>
                        <p>あらゆる商品の価格・サービスを比較し、あなたにとって最適な選択をサポートします。</p>
                    </div>
                    <div>
                        <h3>カテゴリ</h3>
                        <ul>
                            <li><a href="#shopping-category">ショッピング</a></li>
                            <li><a href="#money-category">マネー・資産運用</a></li>
                            <li><a href="#life-category">生活</a></li>
                            <li><a href="#popular-article">人気記事</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3>その他</h3>
                        <ul>
                            <li><a href="#">プライバシーポリシー</a></li>
                            <li><a href="#">利用規約</a></li>
                            <li><a href="#">お問い合わせ</a></li>
                            <li><a href="#">運営会社</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>当サイトはアフィリエイトプログラムを利用しています。商品・サービスの購入等にあたっては、各サービスの利用規約をご確認ください。</p>
                    <p style={{ marginTop: '10px' }}>© 2026 比較ラボ All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
