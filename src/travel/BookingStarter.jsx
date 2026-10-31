import { useMemo, useState } from 'react';
import { addDays, buildStayLinks } from './bookingLinks.js';
import { japanToday } from './staySearch.js';
import { LINK_CONFIG } from './linkConfig.js';
import { recordOutboundClick } from '../shared/outboundClient.js';
import YahooTravelAd from './YahooTravelAd.jsx';
import './booking-starter.css';

const initial=()=>({place:'',scope:'domestic',checkin:addDays(japanToday(),7),checkout:addDays(japanToday(),9),adults:'2',rooms:'1'});
export function validBooking(f,today=japanToday()){
  const place=String(f?.place||'').trim(),start=String(f?.checkin||''),end=String(f?.checkout||'');
  const iso=s=>/^\\d{4}-\\d{2}-\\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  const nights=(Date.parse(end)-Date.parse(start))/86400000,people=+f?.adults,rooms=+f?.rooms;
  if(place.length<2||place.length>80||!['domestic','overseas'].includes(f?.scope)||!iso(start)||!iso(end)||start<today||!Number.isInteger(nights)||nights<1||nights>14||!Number.isInteger(people)||people<1||people>10||!Number.isInteger(rooms)||rooms<1||rooms>5)return null;
  return {...f,place,nights,adults:people,rooms};
}
export default function BookingStarter(){
  const [form,setForm]=useState(initial),[submitted,setSubmitted]=useState(null),[error,setError]=useState('');
  const change=(key,val)=>{setForm(f=>({...f,[key]:val,...(key==='checkin'&&val?{checkout:addDays(val,2)}:{})}));setSubmitted(null);setError('');};
  const links=useMemo(()=>submitted?buildStayLinks({destination:{name:submitted.place,area:submitted.scope},checkin:submitted.checkin,checkout:submitted.checkout,nights:submitted.nights,adults:submitted.adults,rooms:submitted.rooms,config:LINK_CONFIG}):[],[submitted]);
  const submit=e=>{e.preventDefault();const result=validBooking(form);if(!result){setError('宿泊場所・日付・人数を確認してください。');return;}setSubmitted(result);setError('');};
