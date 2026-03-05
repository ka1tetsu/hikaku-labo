import React, { useState } from 'react';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="container header-inner">
                <a href="/" className="logo">
                    比較<span>ラボ</span>
                </a>
                <nav className="main-nav">
                    <ul>
                        <li><a href="#shopping-category">ショッピング</a></li>
                        <li><a href="#money-category">マネー・資産運用</a></li>
                        <li><a href="#life-category">生活</a></li>
                        <li><a href="#popular-article">人気記事</a></li>
                    </ul>
                </nav>
                <button
                    className="menu-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="メニューを開く"
                >
                    ☰
                </button>
            </div>
            {menuOpen && (
                <div className="mobile-menu">
                    <ul>
                        <li><a href="#shopping-category" onClick={() => setMenuOpen(false)}>ショッピング</a></li>
                        <li><a href="#money-category" onClick={() => setMenuOpen(false)}>マネー・資産運用</a></li>
                        <li><a href="#life-category" onClick={() => setMenuOpen(false)}>生活</a></li>
                        <li><a href="#popular-article" onClick={() => setMenuOpen(false)}>人気記事</a></li>
                    </ul>
                </div>
            )}
        </header>
    );
}
