import { useEffect, useState } from 'react';
import SiteHeader from '../shared/SiteHeader.jsx';
import SiteFooter from '../shared/SiteFooter.jsx';
import YahooTravelAd from './YahooTravelAd.jsx';
import { validHotelNo } from './hotelDetails.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import { searchResponse } from '../shared/searchRequest.js';
import './hotel-detail.css';

const yen=n=>n.toLocaleString('ja-JP')+'円';
const idFromUrl=()=>typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('id')||'';
const ratings=[['location','立地'],['room','客室'],['service','接客'],['bath','お風呂'],['breakfast','朝食'],['dinner','夕食'],['cleanliness','清潔さ']];

export default function HotelDetailPage(){
  const [id]=useState(idFromUrl);
  const [result,setResult]=useState({loading:false,hotel:null,error:''});
  useEffect(()=>{
    if(!validHotelNo(id)){setResult({loading:false,hotel:null,error:id?'施設番号が正しくありません。':'検索結果からホテル・旅館を選んでください。'});return;}
    const abort=new AbortController();
    setResult({loading:true,hotel:null,error:''});
    (async()=>{
      try{
        const response=await searchResponse('/api/hotel?id='+encodeURIComponent(id),{signal:abort.signal,timeoutMs:12000});
        const body=await response.json();
        if(!response.ok||body.status!=='ok'||!body.hotel)throw new Error(body.status||'unavailable');
        setResult({loading:false,hotel:body.hotel,error:''});
      }catch(error){
        if(abort.signal.aborted)return;
        const msg=error.message==='not_connected'?'宿泊施設情報APIが未接続です。楽天トラベルの公式ページで確認してください。':error.message==='not_found'?'この施設番号のホテル・旅館は確認できませんでした。':'施設情報を取得できませんでした。時間を置いてお試しください。';
        setResult({loading:false,hotel:null,error:msg});
      }
    })();
    return()=>abort.abort();
  },[id]);
  const hotel=result.hotel;
  useEffect(()=>{document.title=hotel?hotel.name+'｜写真・設備・口コミ・予約先比較｜Vivlica Travel':'ホテル・旅館の施設情報｜Vivlica Travel';},[hotel]);
  const visit=(placement)=>recordOutboundClick({section:'travel',merchant:'rakuten-travel',placement,sponsored:hotel?.sponsored||false});
  const photo=(src,alt)=>src?<img src={src} alt={alt} loading="lazy"/>:<div className="ht-image-empty">🏨 <small>画像が提供されていません</small></div>;
  return <div className="ht-page"><SiteHeader active="travel"/><main id="main-content" className="ht-layout">
    <div className="ht-wrap">
      <nav className="ht-breadcrumb" aria-label="現在位置"><a href="/">Vivlica</a><span>/</span><a href="/travel/">旅行比較</a><span>/</span><a href="/travel/#stay-search">ホテル・旅館検索</a><span>/</span><span>施設情報</span></nav>
      <div className="ht-topbar"><span>HOTEL & RYOKAN DIRECTORY</span><a href="/travel/#stay-search">← 宿泊検索に戻る</a></div>
      {result.loading&&<div className="ht-loading" role="status"><h1>楽天トラベルの施設情報を確認しています…</h1><p>施設番号から公式APIで情報を取得します。</p></div>}
      {result.error&&<div className="ht-missing" role="alert"><h1>施設情報を表示できませんでした</h1><p>{result.error}</p><p>確認できないホテル・旅館の名前や口コミを推測して補いません。</p><a href="/travel/#stay-search">別の宿を探す →</a></div>}
      {hotel&&<>
        <header className="ht-headline"><div><span className="ht-kicker">国内宿泊施設 / 楽天トラベルの提供データ</span><h1>{hotel.name}</h1>
          <p>{hotel.address||'所在地未取得'}</p><div className="ht-chips">{hotel.reviewAverage!==null&&<span className="ht-rating">★ {hotel.reviewAverage.toFixed(2)} <small>（{hotel.reviewCount}件）</small></span>}
          {hotel.area&&<span>📍 {hotel.area}</span>}{hotel.station&&<span>🚉 {hotel.station}</span>}</div></div>
          {hotel.priceGuideJPY!==null&&<div className="ht-guide-price"><small>楽天の1室1泊〜の参考額</small><strong>{yen(hotel.priceGuideJPY)}</strong><span>指定日の空室・最終総額ではありません</span></div>}</header>
        <div className="ht-gallery">{photo(hotel.image,hotel.name+'の施設写真（楽天トラベル提供）')}
          <div>{photo(hotel.roomImage,hotel.name+'の客室写真（楽天トラベル提供）')}<small>画像・施設情報提供：楽天トラベル。時期・プランによって内容は異なります。</small></div></div>
        <div className="ht-columns"><article className="ht-content">
          <section><h2>施設の特徴</h2><p>{hotel.introduction||'施設の紹介文は未取得です。公式サイトで詳細をご確認ください。'}</p></section>
          <section><h2>アクセス・立地</h2><dl>
            <div><dt>住所</dt><dd>{hotel.address||'未取得'}</dd></div>
            <div><dt>最寄り駅</dt><dd>{hotel.station||'未取得'}</dd></div>
            <div><dt>交通アクセス</dt><dd>{hotel.access||'未取得'}</dd></div>
            <div><dt>駐車場</dt><dd>{hotel.parking||'未取得'}</dd></div>
          </dl>{hotel.address&&<a className="ht-secondary-link" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(hotel.name+' '+hotel.address)} target="_blank" rel="noopener noreferrer">Google マップで場所を確認 ↗</a>}</section>
          <section><h2>滞在・施設情報</h2><div className="ht-facts"><div><small>チェックイン</small><strong>{hotel.checkin||'要確認'}</strong></div><div><small>チェックアウト</small><strong>{hotel.checkout||'要確認'}</strong></div></div>
            {hotel.facilitiesSummary&&<p>{hotel.facilitiesSummary}</p>}<p className="ht-note">温泉、Wi-Fi、禁煙室などのサービスは部屋・プランによって異なります。予約サイトで再確認してください。</p></section>
          <section><h2>楽天トラベルでの口コミ評価</h2>
            {hotel.reviewAverage!==null?<><div className="ht-review-score">★ {hotel.reviewAverage.toFixed(2)} <small>口コミ {hotel.reviewCount}件</small></div>
              <div className="ht-rating-grid">{ratings.filter(([k])=>hotel.ratingDetails[k]!=null).map(([key,label])=><div key={key}><span>{label}</span><strong>{hotel.ratingDetails[key].toFixed(2)}/5</strong><div className="ht-rating-track"><i style={{width:(hotel.ratingDetails[key]/5*100)+'%'}}/></div></div>)}</div></>:<p>口コミ評価を取得できませんでした。</p>}
            <p className="ht-note">楽天トラベルの評価です。他予約サイトとの合算ではありません。</p></section>
          {(hotel.policyNote||hotel.cancellationNotice)&&<section><h2>予約・キャンセルの注意事項</h2>
            {hotel.policyNote&&<p>{hotel.policyNote}</p>}{hotel.cancellationNotice&&<p>{hotel.cancellationNotice}</p>}
            <p className="ht-note">キャンセル条件は選んだ宿泊プランで異なる場合があります。</p></section>}
          <section><h2>Yahoo!トラベルと楽天で料金を比較</h2>
            <p>同じ日付・人数・食事・取消条件で宿泊先を比較してください。料金を自動で横断取得できない場合は、各社で確認した税込総額を比較ツールへ入力できます。</p>
            <div className="ht-actions">{hotel.planUrl&&<a className="ht-cta" href={hotel.planUrl} target="_blank"
                rel={hotel.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'} onClick={()=>visit('hotel-detail')}>楽天トラベルで最新のプランを見る ↗{hotel.sponsored?'（PR）':''}</a>}
                <a className="ht-secondary-link" href="/travel/#travel-total-cost">予約サイトの支払総額を比較する →</a></div>
            <YahooTravelAd variant="banner300" placement="hotel-detail-yahoo"/>
          </section>
        </article><aside className="ht-sidebar"><div><span className="ht-kicker">COMPARE WITH CONFIDENCE</span><h2>予約前に総額を確認</h2>
          <p>宿代・食事・税・返金規定を確認して、納得して予約先を選びましょう。</p>
          {hotel.planUrl&&<a className="ht-cta" href={hotel.planUrl} target="_blank" rel={hotel.sponsored?'sponsored noopener noreferrer':'noopener noreferrer'}
            onClick={()=>visit('hotel-detail-sidebar')}>楽天トラベルで確認 ↗</a>}
          <a className="ht-secondary-link" href="/travel/#travel-total-cost">他社の料金と比較する →</a>
          <small>当サイト内では予約・決済できません。空室と最終価格は予約先をご確認ください。</small>
        </div></aside></div>
      </>}
      <div className="ht-search-more"><h2>ほかの旅館・ホテルを探す</h2><p>都道府県・温泉地・駅名・宿名で検索できます。</p><a className="ht-cta" href="/travel/#stay-search">宿泊施設を検索する →</a></div>
      <p className="ht-note">実在する楽天トラベル掲載施設を公式APIで確認して表示しています。世界中すべての宿泊施設を網羅するものではなく、掲載件数・評価・料金は変動します。PR表示の広告経由で当サイトが紹介報酬を受け取る場合があります。</p>
    </div>
  </main><SiteFooter/></div>;
}
