import { useState } from 'react';

export default function Header({ inputValue, setInputValue, onSearch }) {
    return (
        <header className="header">
            <div className="container header-inner">
                <a href="/" className="logo">
                    <span className="logo-kaku">比較</span>
                    <span className="logo-labo">ラボ</span>
                    <span className="logo-tag">価格比較・最安値</span>
                </a>

                <form className="header-search" onSubmit={onSearch}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder="商品名・キーワードで検索..."
                        className="header-search-input"
                    />
                    <button type="submit" className="header-search-btn">
                        🔍 検索
                    </button>
                </form>

                <div className="header-links">
                    <a href="https://www.rakuten.co.jp/" target="_blank" rel="noopener noreferrer" className="header-badge rakuten-badge">楽天</a>
                    <a href="https://www.amazon.co.jp/?tag=kuronekosanta-22" target="_blank" rel="noopener noreferrer" className="header-badge amazon-badge">Amazon</a>
                </div>
            </div>
        </header>
    );
}
