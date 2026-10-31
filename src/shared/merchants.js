// Stores the compare page links to. Each entry is an ordinary search URL; it becomes
// an affiliate (PR) link only when a real tracking ID / ASP deep-link prefix exists.
// To add a store: add a row with a verified search URL. To monetize it: get approved
// by the store's ASP and set VITE_AFF_<ID> (see docs/PRICE-COMPARE.md).
import { AMAZON_TAG, RAKUTEN_AFFILIATE_ID } from '../api.js';
import { safeLinkPrefix } from '../travel/bookingLinks.js';

const YAHOO_VC = { sid: '3506307', pid: '888496181' };
const enc = encodeURIComponent;

export const MERCHANTS = Object.freeze([
  { id: 'rakuten', name: '楽天市場', kind: 'mall', priced: true, search: q => `https://search.rakuten.co.jp/search/mall/${enc(q)}/`, built: 'rakuten' },
  { id: 'amazon', name: 'Amazon', kind: 'mall', search: q => `https://www.amazon.co.jp/s?k=${enc(q)}`, built: 'amazon' },
  { id: 'yahoo-shopping', name: 'Yahoo!ショッピング', kind: 'mall', priced: true, search: q => `https://shopping.yahoo.co.jp/search?p=${enc(q)}`, built: 'yahoo' },
  { id: 'au-pay', name: 'au PAY マーケット', kind: 'mall', search: q => `https://wowma.jp/itemlist?keyword=${enc(q)}`, env: 'VITE_AFF_AU_PAY' },
  { id: 'qoo10', name: 'Qoo10', kind: 'mall', search: q => `https://www.qoo10.jp/s/?keyword=${enc(q)}`, env: 'VITE_AFF_QOO10' },
  { id: 'yodobashi', name: 'ヨドバシ.com', kind: 'electronics', search: q => `https://www.yodobashi.com/?word=${enc(q)}`, env: 'VITE_AFF_YODOBASHI' },
  { id: 'biccamera', name: 'ビックカメラ.com', kind: 'electronics', search: q => `https://www.biccamera.com/bc/category/?q=${enc(q)}`, env: 'VITE_AFF_BICCAMERA' },

  // These retailers do not expose a general public product-price API. Use
  // Google site-scoped discovery, not unlicensed scraping or fabricated rates.
  { id: 'edion', name: 'エディオンネットショップ', kind: 'electronics', search: q => 'https://www.google.com/search?hl=ja&q='+enc('site:edion.com '+q), viaGoogle: true },
  { id: 'joshin', name: 'Joshin webショップ', kind: 'electronics', search: q => 'https://www.google.com/search?hl=ja&q='+enc('site:joshinweb.jp '+q), viaGoogle: true },
  { id: 'nojima', name: 'ノジマオンライン', kind: 'electronics', search: q => 'https://www.google.com/search?hl=ja&q='+enc('site:online.nojima.co.jp '+q), viaGoogle: true },
  { id: 'sofmap', name: 'ソフマップ', kind: 'electronics', search: q => 'https://www.google.com/search?hl=ja&q='+enc('site:sofmap.com '+q), viaGoogle: true },
  { id: 'kojima', name: 'コジマネット', kind: 'electronics', search: q => 'https://www.google.com/search?hl=ja&q='+enc('site:kojima.net '+q), viaGoogle: true },
  { id: 'tsukumo', name: 'ツクモ', kind: 'electronics', search: q => 'https://www.google.com/search?hl=ja&q='+enc('site:shop.tsukumo.co.jp '+q), viaGoogle: true },
  { id: 'apple', name: 'Apple Store', kind: 'brand', match: /(apple|iphone|ipad|airpods|macbook|imac|apple ?watch|アップル)/i, search: q => `https://www.apple.com/jp/search/${enc(q)}`, env: 'VITE_AFF_APPLE' },
  { id: 'iherb', name: 'iHerb', kind: 'health', match: /(サプリ|プロテイン|ビタミン|オーガニック|supplement|vitamin|protein)/i, search: q => `https://jp.iherb.com/search?kw=${enc(q)}`, env: 'VITE_AFF_IHERB' },
  { id: 'mercari', name: 'メルカリ（中古）', kind: 'used', search: q => `https://jp.mercari.com/search?keyword=${enc(q)}`, env: 'VITE_AFF_MERCARI' },
  { id: 'rakuma', name: '楽天ラクマ（中古）', kind: 'used', search: q => `https://fril.jp/s?query=${enc(q)}`, env: 'VITE_AFF_RAKUMA' },
  { id: 'paypay-fleamarket', name: 'Yahoo!フリマ（中古）', kind: 'used', search: q => `https://paypayfleamarket.yahoo.co.jp/search/${enc(q)}`, env: 'VITE_AFF_PAYPAY_FLEAMARKET' },
]);

export const MERCHANT_KINDS = Object.freeze({ mall: '総合モール', electronics: '家電量販店', brand: 'メーカー直販', health: '健康・サプリ', used: '中古・フリマ' });
export const MERCHANT_IDS = Object.freeze(MERCHANTS.map(m => m.id));

export function storeLink(merchant, query, env = {}) {
  const url = merchant.search(query);
  if (merchant.built === 'amazon') return { url: `${url}&tag=${AMAZON_TAG}`, sponsored: true };
  if (merchant.built === 'rakuten') {
    const id = env.VITE_RAKUTEN_AFFILIATE_ID || RAKUTEN_AFFILIATE_ID;
    return id ? { url: `https://hb.afl.rakuten.co.jp/hgc/${id}/?pc=${enc(url)}&m=${enc(url)}`, sponsored: true } : { url, sponsored: false };
  }
  if (merchant.built === 'yahoo') return { url: `https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=${YAHOO_VC.sid}&pid=${YAHOO_VC.pid}&vc_url=${enc(url)}`, sponsored: true };
  const prefix = merchant.env ? safeLinkPrefix(env[merchant.env]) : null;
  return prefix ? { url: prefix + enc(url), sponsored: true } : { url, sponsored: false };
}

// Every relevant store for a product query, malls first; brand / niche stores only when they fit.
export function storeLinks(query, { env = {}, reference = '' } = {}) {
  const text = `${query} ${reference}`;
  return MERCHANTS.filter(m => !m.match || m.match.test(text)).map(m => ({ ...m, ...storeLink(m, query, env) }));
}
