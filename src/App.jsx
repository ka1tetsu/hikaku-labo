import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import './index.css';

const products = [
  {
    id: 1,
    category: 'ショッピング',
    title: 'Apple AirPods Pro (第2世代) ワイヤレスイヤホン',
    price: '39,800',
    originalPrice: '39,800',
    image: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&q=80&w=400',
    affiliateUrl: 'https://www.amazon.co.jp/s?k=AirPods+Pro'
  },
  {
    id: 2,
    category: '生活',
    title: 'ダイソン V12 Detect Slim 掃除機',
    price: '64,500',
    originalPrice: '70,000',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=400',
    affiliateUrl: 'https://www.amazon.co.jp/s?k=ダイソン+掃除機'
  },
  {
    id: 3,
    category: 'マネー・資産運用',
    title: 'おすすめクレジットカード比較ガイド 2026年版',
    price: '無料',
    originalPrice: null,
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=400',
    affiliateUrl: 'https://www.hikaku.com/'
  },
  {
    id: 4,
    category: 'ショッピング',
    title: 'ネスカフェ ゴールドブレンド バリスタ',
    price: '5,980',
    originalPrice: '7,500',
    image: 'https://images.unsplash.com/photo-1517487881594-2787f0146903?auto=format&fit=crop&q=80&w=400',
    affiliateUrl: 'https://www.amazon.co.jp/s?k=ネスカフェ+バリスタ'
  }
];

function App() {
  return (
    <div className="app-wrapper">
      <Header />
      
      <main>
        <section className="hero">
          <div className="container">
            <h1>あらゆる商品の価格・サービスの<br />総合比較サイト</h1>
            <p>あなたの欲しい「最安値」と「最適」を見つけよう</p>
            
            <div className="search-bar">
              <input type="text" placeholder="商品名、カテゴリ、ブランドで検索..." />
              <button>検索する</button>
            </div>
          </div>
        </section>

        <section id="shopping-category" className="section container">
          <div className="section-header">
            <h2 className="section-title">注目の比較・おすすめ商品</h2>
          </div>
          <div className="product-grid">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
        
        <section id="money-category" className="section container" style={{backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '40px'}}>
           <div className="section-header">
            <h2 className="section-title">マネー・資産運用</h2>
          </div>
          <p style={{marginBottom: '20px'}}>クレジットカード、カードローン、証券会社、保険などの比較情報はこちら。</p>
          <div className="product-grid">
             <ProductCard product={{
                category: 'マネー',
                title: '初心者向けネット証券口座おすすめランキング',
                price: '開設無料',
                image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=400',
                affiliateUrl: '#'
             }} />
             <ProductCard product={{
                category: 'マネー',
                title: 'ポイントが貯まるクレジットカード徹底比較',
                price: '年会費無料',
                image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=400',
                affiliateUrl: '#'
             }} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
