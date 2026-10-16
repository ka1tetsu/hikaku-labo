// 編集者が一次情報を確認したサービスだけを掲載します。
// 価格は「指定条件での最低月額目安」と「確認できない」を明確に区別します。
// 更新時は根拠URLと checkedAt を同時に変更してください。
export const LAST_REVIEWED = '2026-10-16';

export const CATEGORIES = [
  { id: 'website', title: 'Webサイトを作る', detail: '会社案内・ポートフォリオ・店舗サイト' },
  { id: 'shop', title: 'ネットショップを開く', detail: '商品販売・受注・ECの運用' },
  { id: 'wordpress', title: 'WordPressを運営', detail: 'ブログ・メディア・企業サイト' },
];

export const SERVICES = [
  {
    id: 'studio', name: 'Studio', category: 'website', mark: 'S', accent: '#191919',
    subtitle: '日本語で使えるノーコードデザイン',
    summary: 'デザインの自由度を重視したサイト制作に。Freeプランから試せる。',
    strengths: ['デザイン重視', 'ノーコード', '無料プラン'], cautions: ['独自ドメインなどは有料プラン'],
    traits: ['design', 'easy', 'free'],
    price: { monthlyMin: 0, label: '無料プランあり', detail: 'Free: 月額0円。独自ドメイン等は有料。' },
    sourceUrl: 'https://studio.design/ja/pricing/', officialUrl: 'https://studio.design/ja/pricing/',
  },
  {
    id: 'wix', name: 'Wix', category: 'website', mark: 'W', accent: '#2430bd',
    subtitle: 'テンプレートから簡単にサイト作成',
    summary: '初めてのサイト公開に。無料で制作できるが、独自ドメインなどはアップグレードが必要。',
    strengths: ['初心者向け', 'テンプレート', '無料で制作開始'], cautions: ['独自ドメイン・広告削除は有料'],
    traits: ['easy', 'free'],
    price: { monthlyMin: 0, label: '無料で制作開始', detail: '独自ドメイン等の料金は公式の現行プランを確認。' },
    sourceUrl: 'https://support.wix.com/ja/article/getting-started-with-wix', officialUrl: 'https://www.wix.com/ja',
  },
  {
    id: 'base', name: 'BASE', category: 'shop', mark: 'B', accent: '#1d1d1d',
    subtitle: '月額0円から日本向けECを始める',
    summary: '固定費を抑えたい小規模ショップに。売れた際には決済・サービス利用料が発生する。',
    strengths: ['月額0円プラン', '国内ショップ向け', '小さく開始'], cautions: ['販売時に各種手数料', '売上増加時はプラン比較が必要'],
    traits: ['easy', 'cost', 'free'],
    price: { monthlyMin: 0, label: '月額0円〜', detail: 'スタンダード：月額0円。決済手数料等は別途。' },
    sourceUrl: 'https://thebase.com/price', officialUrl: 'https://thebase.com/price',
  },
  {
    id: 'shopify', name: 'Shopify', category: 'shop', mark: 'S', accent: '#47792e',
    subtitle: '成長を見据えた本格的なEC基盤',
    summary: '販売チャネルや拡張性を重視するショップに。月額料金以外に決済等の費用がかかる。',
    strengths: ['豊富なEC機能', '販売チャネル', '拡張性'], cautions: ['月額プラン料金', '決済・アプリ等の追加費用'],
    traits: ['scale', 'business', 'design'],
    price: { monthlyMin: 3650, label: '月額3,650円〜', detail: 'Basicの年払い換算の掲載額。月払い・決済・アプリ費用は別。' },
    sourceUrl: 'https://www.shopify.com/jp/about', officialUrl: 'https://www.shopify.com/jp/pricing',
  },
  {
    id: 'xserver-wp', name: 'XServer WP', category: 'wordpress', mark: 'X', accent: '#153a70',
    subtitle: 'WordPress専用プレミアムサーバー',
    summary: '国内でWordPressを管理する法人向け。契約期間によって月額換算額が変わる。',
    strengths: ['WordPress専用', '複数サイト管理', '国内事業者'], cautions: ['長期契約は一括払い', 'サイトの制作・運営は別途必要'],
    traits: ['business', 'scale', 'wp'],
    price: { monthlyMin: 2574, label: '月額換算2,574円〜', detail: '36か月契約のベーシック、税込。期間分を一括前払い。' },
    sourceUrl: 'https://wp.xserver.ne.jp/price/', officialUrl: 'https://wp.xserver.ne.jp/price/',
  },
  {
    id: 'kinsta', name: 'Kinsta', category: 'wordpress', mark: 'K', accent: '#4833ab',
    subtitle: '管理・運用を重視したWordPressホスティング',
    summary: 'WordPressを継続運用する事業者に。日本円・契約条件などの最新料金は公式ページで確認。',
    strengths: ['マネージド運用', 'WordPress特化', '運用機能'], cautions: ['料金は契約プランと通貨を要確認'],
    traits: ['business', 'scale', 'wp'],
    price: { monthlyMin: null, label: '公式料金を確認', detail: '日本円の固定月額として一律の料金を表示していません。' },
    sourceUrl: 'https://kinsta.com/jp/pricing/', officialUrl: 'https://kinsta.com/jp/pricing/',
  },
];

export function getServices(category) {
  return SERVICES.filter(service => service.category === category);
}
