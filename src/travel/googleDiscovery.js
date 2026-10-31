// Google is an external discovery tool, not a licensed hotel rate API.
// Search terms travel in a URL; Google/booking sites decide how to interpret them.
export function googleWebSearch(query) {
  return 'https://www.google.com/search?hl=ja&q=' + encodeURIComponent(String(query || '').slice(0, 180));
}
export function googleTravelDiscovery({place='',depart='',checkout='',adults=2,type='stays'}={}) {
  const name=String(place).trim().slice(0,80);
  if (!name) return [];
  const dateText=[depart,checkout].filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)).join(' ');
  const party=Number.isInteger(Number(adults))&&Number(adults)>=1&&Number(adults)<=10?String(adults)+'名':'';
  if(type==='flights')return [
    {label:'Googleで航空券を幅広く検索',href:googleWebSearch([name,'航空券',dateText,party,'料金'].filter(Boolean).join(' ')),note:'Web検索のキーワードに条件を含めるのみ。出発地・日付は検索先で再確認'},
  ];
  const search=[name,'ホテル 宿泊',dateText,party,'料金 キャンセル'].filter(Boolean).join(' ');
  return [
    {label:'Googleで宿泊予約サイトを横断検索',href:googleWebSearch(search),note:'Google検索の公開ページを探す。すべての宿や料金を取得するわけではありません'},
    {label:'Google ホテルで価格を比較',href:'https://www.google.com/travel/hotels?hl=ja',note:'Google ホテル内で行き先・宿泊日・人数を入力してください'},
    {label:'Booking.comの検索結果をGoogleで探す',href:googleWebSearch('site:booking.com '+search),note:'Googleのsite:検索。検索結果の料金・空室は予約サイトで再確認'},
    {label:'Agodaの検索結果をGoogleで探す',href:googleWebSearch('site:agoda.com '+search),note:'Googleのsite:検索。公式宿泊先で条件を再確認'},
  ];
}
