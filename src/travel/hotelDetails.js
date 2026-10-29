// Only authenticated, licensed provider data is shown on individual property pages.
// "From" prices are provider estimates, NOT date-specific checkout totals.
export const validHotelNo = value => typeof value === 'string' && /^[1-9][0-9]{0,9}$/.test(value);
const text=(value,max=450)=>typeof value==='string'?value.trim().slice(0,max):'';
const money=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
const rating=value=>Number.isFinite(Number(value))&&Number(value)>0&&Number(value)<=5?Number(value):null;
const safeUrl=(value,kind='page')=>{
  if(typeof value!=='string'||!value)return null;
  try{
    const url=new URL(value);
    if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
    const host=url.hostname.toLowerCase();
    if(kind==='image'){
      if(host==='r10s.jp'||host.endsWith('.r10s.jp')||host==='rakuten.co.jp'||host.endsWith('.rakuten.co.jp'))return url.href;
      return null;
    }
    if(host==='travel.rakuten.co.jp'||host.endsWith('.travel.rakuten.co.jp')||host==='hb.afl.rakuten.co.jp')return url.href;
  }catch{ /* reject malformed URLs */ }
  return null;
};
export function normaliseHotelDetails(body,requestedNo){
  if(!validHotelNo(requestedNo)||!Array.isArray(body?.hotels))return null;
  const group=body.hotels.find(row=>Array.isArray(row?.hotel)&&row.hotel.some(p=>String(p.hotelBasicInfo?.hotelNo||'')===requestedNo));
  if(!group)return null;
  const parts=group.hotel;
  const basic=parts.find(p=>String(p.hotelBasicInfo?.hotelNo||'')===requestedNo)?.hotelBasicInfo;
  if(!basic||!text(basic.hotelName,180))return null;
  const detail=parts.find(p=>p.hotelDetailInfo)?.hotelDetailInfo||{};
  const ratings=parts.find(p=>p.hotelRatingInfo)?.hotelRatingInfo||{};
  const policy=parts.find(p=>p.hotelPolicyInfo)?.hotelPolicyInfo||{};
  const facilities=parts.find(p=>p.hotelFacilitiesInfo)?.hotelFacilitiesInfo||{};
  const url=safeUrl(basic.hotelInformationUrl);
  const planUrl=safeUrl(basic.planListUrl)||url;
  const image=safeUrl(basic.hotelImageUrl,'image')||safeUrl(basic.hotelThumbnailUrl,'image');
  const roomImage=safeUrl(basic.roomImageUrl,'image')||safeUrl(basic.roomThumbnailUrl,'image');
  return {
    id:requestedNo,name:text(basic.hotelName,180),
    address:text(basic.address1,150)+text(basic.address2,180),
    introduction:text(basic.hotelSpecial,900),
    access:text(basic.access,600),
    parking:text(basic.parkingInformation,500),
    station:text(basic.nearestStation,90),
    area:text(detail.areaName,100),
    checkin:text(detail.checkinTime,15),checkout:text(detail.checkoutTime,15),
    priceGuideJPY:money(basic.hotelMinCharge),priceKind:'one_room_one_night_from_guide_not_live',
    reviewAverage:rating(basic.reviewAverage),reviewCount:Number.isInteger(Number(basic.reviewCount))?Math.max(0,Number(basic.reviewCount)):0,
    ratingDetails:Object.fromEntries([
      ['location',ratings.locationAverage],['room',ratings.roomAverage],['service',ratings.serviceAverage],
      ['bath',ratings.bathAverage],['breakfast',ratings.breakfastAverage],['dinner',ratings.dinnerAverage],
      ['cleanliness',ratings.cleanlinessAverage],
    ].map(([key,val])=>[key,rating(val)]).filter(([,val])=>val!==null)),
    facilitiesSummary:text(facilities.aboutBath?.bathType||'',200),
    policyNote:text(policy.note,900),
    cancellationNotice:text(policy.cancelPolicy,900),
    image,roomImage,url,planUrl,
    source:'楽天トラベル 施設情報API',provider:'rakuten-travel',
    sponsored:Boolean(url&&new URL(url).hostname==='hb.afl.rakuten.co.jp'),
  };
}
export const hotelPagePath=id=>validHotelNo(String(id))?'/travel/hotels/?id='+encodeURIComponent(String(id)):null;
