// One verified route per publicly managed comparison experience.
export const SITE_SECTIONS = Object.freeze([
  { id: 'products', href: '/', icon: 'layout-grid', nav: '商品価格比較', heading: '商品を比較', description: '楽天市場の商品情報と、他モールへの確認リンクで購入条件を整理。', metric: '01 / SHOPPING', action: '価格と条件を見る' },
  { id: 'tools', href: '/tools/', icon: 'device-desktop', nav: 'ITサービス診断', heading: 'ITツールを選ぶ', description: 'Web制作・EC・WordPress向けサービスを予算や重視条件から比較。', metric: '02 / SOFTWARE', action: '無料で診断する' },
  { id: 'travel', href: '/travel/', icon: 'plane', nav: '比較ラボトラベル', heading: '国内・海外の旅行を比較', description: '国内・海外の行き先、航空券・宿泊予約サイトを比較。自然文で細かい条件も入力できます。', metric: '03 / TRAVEL', action: 'おすすめの旅を探す' },
]);
export function isActiveSection(id) { return SITE_SECTIONS.some(x => x.id === id); }
