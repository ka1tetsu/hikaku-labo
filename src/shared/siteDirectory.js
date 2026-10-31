// One verified route per publicly managed comparison experience.
export const SITE_SECTIONS = Object.freeze([
  { id: 'travel', href: '/travel/', icon: 'plane', nav: '航空券・ホテル比較', heading: '旅行先・航空券・宿を比較', description: '国内外の旅行先からGoogle フライト・ホテル・掲載予約サイトへ。条件を可能な範囲で引き継ぎ、実際の料金は予約先で確認。', metric: '01 / TRAVEL', action: '旅行の料金を探す' },
  { id: 'products', href: '/', icon: 'layout-grid', nav: '商品価格比較', heading: '商品を比較', description: '楽天市場・Yahoo!ショッピングの取得価格を型番・JANで照合。Amazonや家電量販店は検索先を案内し、送料・ポイントも区別。', metric: '02 / SHOPPING', action: '価格と条件を見る' },
  { id: 'tools', href: '/tools/', icon: 'device-desktop', nav: 'ITサービス診断', heading: 'ITツールを選ぶ', description: 'Web制作・EC・WordPress向けサービスを予算や重視条件から比較。', metric: '02 / SOFTWARE', action: '無料で診断する' },
  { id: 'life', href: '/life/', icon: 'wallet', nav: '通信・お金', heading: 'スマホ・回線・カードを見直す', description: '格安SIM・光回線・クレジットカード・保険を、公式料金と条件で比較。毎月の固定費を見直せます。', metric: '03 / LIFE COSTS', action: '固定費を見直す' },
  { id: 'database', href: '/database', icon: 'chart-bar', nav: '企業データ', heading: '企業・開示データを調べる', description: 'vividatabaseの企業調査、株式スクリーニング、官公需・EDINETの出典付きデータ。公開情報を無料で確認でき、有料API・会員機能は別契約です。', metric: '05 / DATABASE', action: '企業データを調べる' },
]);
export function isActiveSection(id) { return SITE_SECTIONS.some(x => x.id === id); }
