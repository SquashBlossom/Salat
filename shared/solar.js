/* Solar math: Julian date, sun position, prayer times, sun altitude, Qibla.
   Owns: pure astronomy. Refuses: DOM, storage, network.
   Shared by the app and the server, so alerts match the screen exactly. */
const D=Math.PI/180;
const sin=a=>Math.sin(a*D), cos=a=>Math.cos(a*D), tan=a=>Math.tan(a*D);
const asin=x=>Math.asin(x)/D, acos=x=>Math.acos(x)/D;
const atan2d=(y,x)=>Math.atan2(y,x)/D, acot=x=>Math.atan(1/x)/D;
const fixAngle=a=>((a%360)+360)%360, fixHour=a=>((a%24)+24)%24;

function julian(y,m,d){
  if(m<=2){y-=1;m+=12;}
  const A=Math.floor(y/100), B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5;
}
function sunPos(jd){
  const T=jd-2451545.0;
  const g=fixAngle(357.529+0.98560028*T);
  const q=fixAngle(280.459+0.98564736*T);
  const L=fixAngle(q+1.915*sin(g)+0.020*sin(2*g));
  const e=23.439-0.00000036*T;
  const RA=fixAngle(atan2d(cos(e)*sin(L),cos(L)))/15;
  return {decl:asin(sin(e)*sin(L)), eqt:q/15-fixHour(RA)};
}
function computeTimes(y,m,d,lat,lng,tz,o){
  const jD=julian(y,m,d)-lng/(15*24);
  const midDay=t=>fixHour(12-sunPos(jD+t).eqt);
  const angleTime=(ang,t,dir)=>{
    const {decl}=sunPos(jD+t);
    const x=(-sin(ang)-sin(decl)*sin(lat))/(cos(decl)*cos(lat));
    if(x>1||x<-1) return NaN;
    return midDay(t)+dir*(acos(x)/15);
  };
  const asrT=(f,t)=>{
    const {decl}=sunPos(jD+t);
    const alt=acot(f+tan(Math.abs(lat-decl)));
    const x=(sin(alt)-sin(decl)*sin(lat))/(cos(decl)*cos(lat));
    if(x>1||x<-1) return NaN;
    return midDay(t)+acos(x)/15;
  };
  let t={fajr:5/24,sunrise:6/24,dhuhr:12/24,asr:13/24,maghrib:18/24,isha:18/24};
  for(let i=0;i<3;i++){
    const sunset=angleTime(0.833,t.maghrib,1);
    t={
      fajr:angleTime(o.fajrAngle,t.fajr,-1)/24,
      sunrise:angleTime(0.833,t.sunrise,-1)/24,
      dhuhr:midDay(t.dhuhr)/24,
      asr:asrT(o.asrFactor,t.asr)/24,
      maghrib:sunset/24,
      isha:(o.ishaAngle!=null?angleTime(o.ishaAngle,t.isha,1):sunset+o.ishaMinutes/60)/24
    };
  }
  const out={}; for(const k in t) out[k]=t[k]*24;

  /* --- high latitude rule: without this, Fajr and Isha simply do not exist
         in summer above roughly 48 degrees, and the rows come back blank --- */
  let adjusted=false;
  if(o.hiLat!=='none' && isFinite(out.sunrise) && isFinite(out.maghrib)){
    const night=fixHour(out.sunrise-out.maghrib);
    const portion=a=> o.hiLat==='middle' ? 1/2 : o.hiLat==='seventh' ? 1/7 : a/60;
    const fLimit=portion(o.fajrAngle)*night;
    if(!isFinite(out.fajr) || fixHour(out.sunrise-out.fajr)>fLimit){ out.fajr=out.sunrise-fLimit; adjusted=true; }
    const iAngle=o.ishaAngle!=null?o.ishaAngle:18;
    const iLimit=portion(iAngle)*night;
    if(!isFinite(out.isha) || fixHour(out.isha-out.maghrib)>iLimit){ out.isha=out.maghrib+iLimit; adjusted=true; }
  }
  const shift=tz-lng/15;
  for(const k in out) out[k]+=shift;
  out.dhuhr+=1/60;
  out.__adjusted=adjusted;
  out.__polar=!isFinite(out.sunrise)||!isFinite(out.maghrib);
  return out;
}
function sunAltitude(y,m,d,hour,lat,lng,tz){
  const jD=julian(y,m,d)-lng/(15*24)+(hour-tz+lng/15)/24;
  const {decl,eqt}=sunPos(jD);
  const noon=fixHour(12-eqt)+tz-lng/15;
  return asin(sin(decl)*sin(lat)+cos(decl)*cos(lat)*cos(15*(hour-noon)));
}
function tzOffset(date,zone){
  try{
    const dtf=new Intl.DateTimeFormat('en-US',{timeZone:zone,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const p={}; for(const {type,value} of dtf.formatToParts(date)) p[type]=value;
    return (Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-date.getTime())/3600000;
  }catch(e){ return -date.getTimezoneOffset()/60; }
}
function qiblaBearing(lat,lng){
  const kLat=21.4225,kLng=39.8262,dL=kLng-lng;
  return fixAngle(atan2d(sin(dL), cos(lat)*tan(kLat)-sin(lat)*cos(dL)));
}


export { D, fixAngle, fixHour, julian, sunPos, computeTimes, sunAltitude, tzOffset, qiblaBearing };
