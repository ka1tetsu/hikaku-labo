// Verified provider homepages ONLY. No unapproved partner links, undocumented deep links,
// unauthorized scraping or claims that one service is cheaper than another.
export const TRAVEL_PROVIDERS=Object.freeze([
  {id:'google-flights',name:'Google Flights',type:'flight',url:'https://www.google.com/travel/flights?hl=ja&curr=JPY',capabilities:['柔軟な日程','直行便','手荷物'],affiliate:false},
  {id:'skyscanner',name:'Skyscanner',type:'flight',url:'https://www.skyscanner.jp/',capabilities:['広い航空会社比較','日付変更','ホテル'],affiliate:false},
  {id:'kayak',name:'KAYAK',type:'flight',url:'https://www.kayak.co.jp/',capabilities:['航空券','ホテル','レンタカー'],affiliate:false},
  {id:'trip',name:'Trip.com',type:'flight',url:'https://jp.trip.com/',capabilities:['航空券','ホテル','ツアー'],affiliate:false},
  {id:'momondo',name:'momondo',type:'flight',url:'https://www.momondo.jp/',capabilities:['航空券','日程比較'],affiliate:false},
  {id:'aviasales',name:'Aviasales',type:'flight',url:'https://www.aviasales.com/',capabilities:['航空券','複数航空会社'],affiliate:false},
  {id:'ana',name:'ANA',type:'flight',url:'https://www.ana.co.jp/',capabilities:['航空会社直販','運送条件確認'],affiliate:false},
  {id:'jal',name:'JAL',type:'flight',url:'https://www.jal.co.jp/',capabilities:['航空会社直販','運送条件確認'],affiliate:false},
  {id:'booking',name:'Booking.com',type:'hotel',url:'https://www.booking.com/',capabilities:['世界の宿','取消条件','宿泊レビュー'],affiliate:false},
  {id:'agoda',name:'Agoda',type:'hotel',url:'https://www.agoda.com/',capabilities:['世界の宿','多様なプラン'],affiliate:false},
  {id:'expedia',name:'Expedia',type:'hotel',url:'https://www.expedia.co.jp/',capabilities:['ホテル','航空券＋ホテル'],affiliate:false},
  {id:'hotels',name:'Hotels.com',type:'hotel',url:'https://jp.hotels.com/',capabilities:['宿泊予約','条件比較'],affiliate:false},
  {id:'airbnb',name:'Airbnb',type:'hotel',url:'https://www.airbnb.jp/',capabilities:['民泊','長期滞在'],affiliate:false},
  {id:'rakuten-travel',name:'楽天トラベル',type:'hotel',url:'https://travel.rakuten.co.jp/',capabilities:['国内宿泊','海外宿泊','旅行パック'],affiliate:false},
  {id:'jalan',name:'じゃらん',type:'hotel',url:'https://www.jalan.net/',capabilities:['国内宿泊','温泉'],affiliate:false},
  {id:'yahoo-travel',name:'Yahoo!トラベル',type:'hotel',url:'https://travel.yahoo.co.jp/',capabilities:['国内宿泊','ポイント条件'],affiliate:false},
  {id:'viator',name:'Viator',type:'activity',url:'https://www.viator.com/',capabilities:['現地体験','観光ツアー'],affiliate:false},
  {id:'getyourguide',name:'GetYourGuide',type:'activity',url:'https://www.getyourguide.com/',capabilities:['観光チケット','現地ガイド'],affiliate:false},
  {id:'klook',name:'Klook',type:'activity',url:'https://www.klook.com/ja/',capabilities:['体験','交通パス'],affiliate:false},
  {id:'kkday',name:'KKday',type:'activity',url:'https://www.kkday.com/ja',capabilities:['体験','観光チケット'],affiliate:false},
  {id:'rentalcars',name:'Rentalcars.com',type:'car',url:'https://www.rentalcars.com/',capabilities:['レンタカー'],affiliate:false},
  {id:'discovercars',name:'DiscoverCars',type:'car',url:'https://www.discovercars.com/',capabilities:['レンタカー'],affiliate:false},
  {id:'airalo',name:'Airalo',type:'connectivity',url:'https://www.airalo.com/',capabilities:['旅行用eSIM','海外データ通信'],affiliate:false},
  {id:'holafly',name:'Holafly',type:'connectivity',url:'https://esim.holafly.com/',capabilities:['旅行用eSIM','海外データ通信'],affiliate:false},
]);
// Only put URLs here AFTER operator-specific approval. Do not auto-append a tracking ID.
export const APPROVED_TRAVEL_PARTNER_LINKS=Object.freeze({
  // example: 'exact-unmodified-link-issued-by-the-approved-program',
});
export function providerTarget(provider, { stayLinks = [] } = {}){
  const approved=APPROVED_TRAVEL_PARTNER_LINKS[provider.id];
  if(typeof approved==='string'){
    try{
      const url=new URL(approved);
      if(url.protocol==='https:'&&!url.username&&!url.password)return {url:url.href,sponsored:true};
    }catch{ /* invalid partner URL => official homepage */ }
  }
  const stay = provider.type === 'hotel' && stayLinks.find(item => item.merchant === provider.id);
  if (stay) return { url: stay.href, sponsored: stay.sponsored, note: stay.note };
  return {url:provider.url,sponsored:false};
}
export const TRAVEL_PROVIDER_TYPES=Object.freeze([
  {id:'flight',label:'航空券',emoji:'✈️'},
  {id:'hotel',label:'宿泊',emoji:'🏨'},
  {id:'activity',label:'現地体験',emoji:'🎟️'},
  {id:'car',label:'レンタカー',emoji:'🚗'},
  {id:'connectivity',label:'eSIM・通信',emoji:'📶'},
]);
