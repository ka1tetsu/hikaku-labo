// Human-verified hotel names and official access pages for the Tokyo itinerary.
// These editorial examples are NOT a live room inventory, guest rating or price feed.
// All stays are optional bases for the *full trip*; do not imply moving hotels daily.
export const TOKYO_STAY_AREAS=Object.freeze({
  asakusa:Object.freeze({
    label:'浅草・上野エリア',why:'浅草寺・上野方面を観光する日の宿泊拠点候補',
    hotels:Object.freeze([
      {id:'richmond-asakusa-premier',name:'リッチモンドホテルプレミア浅草',
        location:'台東区浅草2-6-7／浅草寺の近く',access:'つくばエクスプレス浅草駅から徒歩約3分',
        url:'https://richmondhotel.jp/asakusa-international/access/',source:'ホテル公式アクセス情報'},
      {id:'asakusa-tobu',name:'浅草東武ホテル',
        location:'台東区浅草1-1-15／浅草駅周辺',access:'浅草駅周辺の宿泊候補',
        url:'https://www.tobuhotel.co.jp/asakusa/access/',source:'ホテル公式アクセス情報'},
    ])
  }),
  marunouchi:Object.freeze({
    label:'東京駅・丸の内エリア',why:'東京駅周辺の散策や新幹線移動に便利な宿泊拠点候補',
    hotels:Object.freeze([
      {id:'metropolitan-marunouchi',name:'ホテルメトロポリタン丸の内',
        location:'千代田区丸の内1-7-12／東京駅日本橋口直結',access:'JR東京駅日本橋口直結',
        url:'https://marunouchi.metropolitan.jp/access/',source:'ホテル公式アクセス情報'},
      {id:'tokyo-station-hotel',name:'東京ステーションホテル',
        location:'千代田区丸の内1-9-1／東京駅丸の内駅舎内',access:'JR東京駅丸の内南口直結',
        url:'https://www.tokyostationhotel.jp/',source:'ホテル・駅施設の公式情報'},
    ])
  }),
  shinjuku:Object.freeze({
    label:'新宿・新宿御苑エリア',why:'新宿御苑や新宿エリアの観光に便利な宿泊拠点候補',
    hotels:Object.freeze([
      {id:'toyoko-shinjuku-gyoen',name:'東横INN新宿御苑前駅3番出口',
        location:'新宿区新宿1-17-8／新宿御苑前駅周辺',access:'新宿御苑前駅3番出口から徒歩約1分',
        url:'https://www.toyoko-inn.com/search/detail/00281/',source:'ホテル公式アクセス情報'},
      {id:'gracery-shinjuku',name:'ホテルグレイスリー新宿',
        location:'新宿区歌舞伎町1-19-1／新宿駅東口方面',access:'JR新宿駅東口から徒歩約5分',
        url:'https://gracery.com/shinjuku/access/',source:'ホテル公式アクセス情報'},
    ])
  })
});

const areas=[
  {id:'asakusa',match:/浅草|浅草寺|上野|スカイツリー|雷門|押上|隅田川|谷中/},
  {id:'marunouchi',match:/東京駅|丸の内|日本橋|銀座|皇居|秋葉原/},
  {id:'shinjuku',match:/新宿|渋谷|表参道|原宿|明治神宮|代々木/},
];
export function itineraryStayArea(destination,day) {
  if(destination?.id!=='tokyo'||!Array.isArray(day?.stops))return null;
  for(const stop of day.stops){
    const found=areas.find(x=>x.match.test(String(stop)));
    if(found)return {id:found.id,...TOKYO_STAY_AREAS[found.id]};
  }
  return null;
}
export function itineraryHotelNights(nights,day) {
  return Number.isInteger(Number(nights))&&Number(nights)>0 &&
    Number.isInteger(day?.day)&&day.day<=Number(nights);
}
