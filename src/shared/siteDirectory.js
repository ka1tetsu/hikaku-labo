// One verified route per publicly managed comparison experience.
export const SITE_SECTIONS = Object.freeze([
  { id: 'products', href: '/', icon: 'layout-grid', nav: '商品価格比較', heading: '商品を比較', description: '楽天市場・Yahoo!ショッピングの実売価格を同じ商品で比較。Amazonや家電量販店も一括で確認。', metric: '01 / SHOPPING', action: '価格と条件を見る' },
  { id: 'tools', href: '/tools/', icon: 'device-desktop', nav: 'ITサービス診断', heading: 'ITツールを選ぶ', description: 'Web制作・EC・WordPress向けサービスを予算や重視条件から比較。', metric: '02 / SOFTWARE', action: '無料で診断する' },
  { id: 'life', href: '/life/', icon: 'wallet', nav: '通信・お金', heading: 'スマホ・回線・カードを見直す', description: '格安SIM・光回線・クレジットカード・保険を、公式料金と条件で比較。毎月の固定費を見直せます。', metric: '03 / LIFE COSTS', action: '固定費を見直す' },
  { id: 'travel', href: '/travel/', icon: 'plane', nav: '比較ラボトラベル', heading: '旅行先を比べてプランを探す', description: '国内外81都市・約200の国と地域から検索。航空券・ホテル・体験の予約サイト比較と、AIコンシェルジュのモデルコース・予算提案が無料。', metric: '04 / TRAVEL', action: 'おすすめの旅を探す' },
]);
export function isActiveSection(id) { return SITE_SECTIONS.some(x => x.id === id); }
