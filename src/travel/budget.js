// A planning calculator: it is NOT real-time hotel inventory, quotes, or final pricing.
export const DESTINATIONS = [
  { id: 'hokkaido', name: '北海道', hint: '移動費・レンタカー代も確認' },
  { id: 'tohoku', name: '東北', hint: '温泉街への交通を確認' },
  { id: 'kanto', name: '関東', hint: 'イベント日の混雑に注意' },
  { id: 'chubu', name: '中部', hint: '山間部は交通手段を確認' },
  { id: 'kansai', name: '関西', hint: '都市・観光地で宿泊条件が異なる' },
  { id: 'chugoku-shikoku', name: '中国・四国', hint: '周遊なら移動日程に余裕を' },
  { id: 'kyushu', name: '九州', hint: '温泉や複数都市の組み合わせも' },
  { id: 'okinawa', name: '沖縄', hint: '航空券・現地交通費の確認を' },
];

export function calculateTravelBudget({
  nights = 2, rooms = 1, travelers = 2,
  perRoomNight = 15000, travelPerPerson = 10000,
  foodPerPersonDay = 3500, otherPerPerson = 3000,
} = {}) {
  const integer = (v, min, max) => Number.isFinite(Number(v))
    ? Math.max(min, Math.min(max, Math.floor(Number(v)))) : min;
  const n = integer(nights, 0, 30);
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
