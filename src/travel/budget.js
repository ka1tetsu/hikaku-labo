// A planning calculator: it is NOT real-time hotel inventory, quotes, or final pricing.
// prefectures の slug は楽天トラベルの都道府県ページ https://travel.rakuten.co.jp/yado/<slug>/ に対応
// （全47件が HTTP 200 で存在することを 2026-10-16 に確認）。
const P = (slug, name) => ({ slug, name });
export const DESTINATIONS = [
  { id: 'hokkaido', name: '北海道', hint: '移動費・レンタカー代も確認', prefectures: [P('hokkaido', '北海道')] },
  { id: 'tohoku', name: '東北', hint: '温泉街への交通を確認', prefectures: [P('aomori', '青森'), P('iwate', '岩手'), P('miyagi', '宮城'), P('akita', '秋田'), P('yamagata', '山形'), P('fukushima', '福島')] },
  { id: 'kanto', name: '関東', hint: 'イベント日の混雑に注意', prefectures: [P('tokyo', '東京'), P('kanagawa', '神奈川'), P('chiba', '千葉'), P('saitama', '埼玉'), P('ibaraki', '茨城'), P('tochigi', '栃木'), P('gunma', '群馬')] },
  { id: 'chubu', name: '中部', hint: '山間部は交通手段を確認', prefectures: [P('shizuoka', '静岡'), P('nagano', '長野'), P('ishikawa', '石川'), P('aichi', '愛知'), P('niigata', '新潟'), P('yamanashi', '山梨'), P('gifu', '岐阜'), P('toyama', '富山'), P('fukui', '福井')] },
  { id: 'kansai', name: '関西', hint: '都市・観光地で宿泊条件が異なる', prefectures: [P('kyoto', '京都'), P('osaka', '大阪'), P('hyogo', '兵庫'), P('nara', '奈良'), P('wakayama', '和歌山'), P('mie', '三重'), P('shiga', '滋賀')] },
  { id: 'chugoku-shikoku', name: '中国・四国', hint: '周遊なら移動日程に余裕を', prefectures: [P('hiroshima', '広島'), P('okayama', '岡山'), P('yamaguchi', '山口'), P('shimane', '島根'), P('tottori', '鳥取'), P('kagawa', '香川'), P('ehime', '愛媛'), P('tokushima', '徳島'), P('kochi', '高知')] },
  { id: 'kyushu', name: '九州', hint: '温泉や複数都市の組み合わせも', prefectures: [P('fukuoka', '福岡'), P('oita', '大分'), P('kumamoto', '熊本'), P('kagoshima', '鹿児島'), P('nagasaki', '長崎'), P('miyazaki', '宮崎'), P('saga', '佐賀')] },
  { id: 'okinawa', name: '沖縄', hint: '航空券・現地交通費の確認を', prefectures: [P('okinawa', '沖縄')] },
];

export function rakutenTravelAreaUrl(slug) {
  if (!/^[a-z]+$/.test(String(slug))) return 'https://travel.rakuten.co.jp/';
  return `https://travel.rakuten.co.jp/yado/${slug}/`;
}

export function calculateTravelBudget({
  nights = 2, rooms = 1, travelers = 2,
  perRoomNight = 15000, travelPerPerson = 10000,
  foodPerPersonDay = 3500, otherPerPerson = 3000,
} = {}) {
  const integer = (v, min, max) => Number.isFinite(Number(v))
    ? Math.max(min, Math.min(max, Math.floor(Number(v)))) : min;
  const n = integer(nights, 1, 30);
  const r = integer(rooms, 1, 10);
  const p = integer(travelers, 1, 30);
  const rate = integer(perRoomNight, 0, 1_000_000);
  const transportRate = integer(travelPerPerson, 0, 1_000_000);
  const foodRate = integer(foodPerPersonDay, 0, 100_000);
  const otherRate = integer(otherPerPerson, 0, 1_000_000);
  const lodging = n * r * rate;
  const transport = p * transportRate;
  const meals = p * (n + 1) * foodRate;
  const other = p * otherRate;
  const total = lodging + transport + meals + other;
  return { nights: n, rooms: r, travelers: p, lodging, transport, meals, other, total, perPerson: Math.ceil(total / p) };
}
