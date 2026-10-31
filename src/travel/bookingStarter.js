export function validBooking(f,today){
  const place=String(f?.place||'').trim(),start=String(f?.checkin||''),end=String(f?.checkout||'');
  const nights=(Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000;
  const iso=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  if(place.length<2||place.length>80||!iso(start)||!iso(end)||start<today||!Number.isInteger(nights)||nights<1||nights>14||![f.adults,f.rooms].every(n=>Number.isInteger(Number(n)))||+f.adults<1||+f.adults>10||+f.rooms<1||+f.rooms>5)return null;
  return {...f,place,nights,adults:+f.adults,rooms:+f.rooms};
}
