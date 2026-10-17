// One verified route per publicly managed comparison experience.
export const SITE_SECTIONS = Object.freeze([
  { id: 'products', href: '/', icon: 'layout-grid', nav: '商品価格比較', heading: '商品を比較', description: '楽天市場の商品情報と、他モールへの確認リンクで購入条件を整理。', metric: '01 / SHOPPING', action: '価格と条件を見る' },
  { id: 'tools', href: '/tools/', icon: 'device-desktop', nav: 'ITサービス診断', heading: 'ITツールを選ぶ', description: 'Web制作・EC・WordPress向けサービスを予算や重視条件から比較。', metric: '02 / SOFTWARE', action: '無料で診断する' },
  { id: 'travel', href: '/travel/', icon: 'plane', nav: '比較ラボトラベル', heading: '旅行先を比べてプランを探す', description: '国内18都市を比較。目的地と好みに合わせたモデルコースや旅行予算を無料で提案。', metric: '03 / TRAVEL', action: 'おすすめの旅を探す' },
]);
export function isActiveSection(id) { return SITE_SECTIONS.some(x => x.id === id); }
