import { buildAmazonAffiliateUrl, buildRakutenSearchAffiliateUrl, buildYahooAffiliateUrl } from '../api.js';
import { recordOutboundClick } from '../shared/outboundClient.js';

export default function ProductSearchLinks({ keyword }) {
  if (!keyword.trim()) return null;
  const links = [
    ['rakuten', '楽天市場', buildRakutenSearchAffiliateUrl(keyword)],
    ['amazon', 'Amazon', buildAmazonAffiliateUrl(keyword)],
    ['yahoo-shopping', 'Yahoo!ショッピング', buildYahooAffiliateUrl(keyword)],
  ];
  return <section className="hl-shop-search" aria-label="入力した商品のショップ検索">
    <strong>「{keyword}」を各ショップで確認</strong>
    <p>商品データの取得を待たずに検索できます。価格・送料・在庫は各ショップで確認してください。</p>
    <div>{links.map(([merchant, label, href]) => <a key={merchant} href={href} target="_blank" rel="sponsored noopener noreferrer"
      onClick={() => recordOutboundClick({ section: 'products', merchant, placement: 'search-direct', sponsored: true })}>{label} ↗ <small>PR</small></a>)}</div>
  </section>;
}
