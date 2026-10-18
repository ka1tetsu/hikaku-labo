import SiteHeader from './SiteHeader.jsx';
import SiteFooter from './SiteFooter.jsx';
import '../services/services.css';


export default function InfoPage({ page }) {
  return <div className="sv-page"><SiteHeader />
    <main id="main-content">
      <section className="sv-hero sv-hero-compact"><div className="sv-wrap"><span className="sv-kicker">VIVLICA / OUR APPROACH</span><h1>{page.title}</h1><p>{page.description}</p></div></section>
      {page.sections.map(([title, text]) => <section key={title} className="sv-wrap sv-guide"><h2>{title}</h2><p>{text}</p></section>)}
      <section className="sv-wrap sv-related"><h2>予算に合う選択肢を探す</h2><div><a href="/life/#savings">スマホ代の年間差額を診断 →</a><a href="/compare/">商品をショップ横断で比較 →</a><a href="/tools/">ITサービスを診断 →</a><a href="/travel/">旅行の予算を立てる →</a></div></section>
    </main><SiteFooter /></div>;
}
