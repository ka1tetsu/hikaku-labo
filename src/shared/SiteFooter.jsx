import './site-footer.css';

export default function SiteFooter() {
  return <nav className="vl-footer-links" aria-label="Vivlicaについて">
    <a href="/about/">Vivlicaについて</a>
    <a href="/editorial-policy/">比較・広告の方針</a>
    <a href="/privacy/">プライバシー</a>
    <a href="/life/#savings">固定費の診断</a>
  </nav>;
}
