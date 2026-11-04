/* Colour derivation: four picks become a full, readable token set (WCAG-checked).
   Owns: colour math and the theme list. Refuses: touching the DOM. */
export function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
const clampv=(v,a,b)=>Math.min(b,Math.max(a,v));
const rgb2hex=r=>'#'+r.map(v=>clampv(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');
export function lum(c){const a=hex2rgb(c).map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
  return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];}
export function contrast(a,b){const L1=lum(a),L2=lum(b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);}
export function mix(a,b,t){const A=hex2rgb(a),B=hex2rgb(b);return rgb2hex([0,1,2].map(i=>A[i]+(B[i]-A[i])*t));}
export function ensure(fg,bg,target){
  if(contrast(fg,bg)>=target) return fg;
  let best=fg,bestC=contrast(fg,bg);
  for(const dest of ['#ffffff','#000000']){
    for(let t=0.05;t<=1.0001;t+=0.05){
      const c=mix(fg,dest,t),cc=contrast(c,bg);
      if(cc>bestC){bestC=cc;best=c;}
      if(cc>=target) return c;
    }
  }
  return best;
}
export const rgbaOf=(hex,a)=>{const [r,g,b]=hex2rgb(hex);return 'rgba('+r+','+g+','+b+','+a+')';};
export function deriveTheme(bg,accent,warn,ok){
  const ink=bg, L=lum(ink);
  const step=0.09+0.45*Math.max(0,(L-0.25)/0.75);
  let panel=mix(ink,'#ffffff',step);
  let tp=contrast('#ffffff',panel)>=contrast('#000000',panel)?'#ffffff':'#000000';
  const away=tp==='#000000'?'#ffffff':'#000000';
  for(let i=0;i<14&&contrast(tp,panel)<9;i++) panel=mix(panel,away,0.08);
  const night=mix(ink,panel,0.55), btn=mix(ink,panel,0.85);
  const rule=mix(panel,tp,0.15), rule2=mix(panel,tp,0.27), btnHi=mix(btn,tp,0.09);
  const text=ensure(mix(tp,ink,0.08),panel,8);
  const muted=ensure(mix(tp,ink,0.34),panel,4.5);
  const dim=ensure(mix(tp,ink,0.48),panel,3.2);
  const A=ensure(ensure(accent,ink,4.0),panel,4.0);
  const W=ensure(ensure(warn,ink,4.0),panel,4.0);
  const K=ensure(ensure(ok,ink,3.4),panel,3.4);
  const sel=mix(ink,A,0.15), accText=ensure(A,sel,4.5);
  return {'--bg':ink,'--glow-1':mix(ink,A,0.16),'--glow-2':mix(ink,W,0.12),
    '--surface':panel,'--surface-sunk':night,'--line':rule,'--line-strong':rule2,
    '--control':btn,'--control-pressed':btnHi,'--selected':sel,
    '--now':A,'--next':W,'--done':K,
    '--now-wash':rgbaOf(A,0.15),'--next-wash':rgbaOf(W,0.15),
    '--now-line':rgbaOf(A,0.55),'--now-text':accText,
    '--text':text,'--text-2':muted,'--text-3':dim,'--label':dim,'--statusbar':ink};
}

export const THEMES=[
  {id:'midnight',name:'Midnight',chips:['#04101F','#5FE3C8','#FFC94A','#48D597']},
  {id:'amethyst',name:'Amethyst',chips:['#140A26','#5FE3C8','#FF9A4D','#A98BFF']},
  {id:'grove',   name:'Grove',   chips:['#05170F','#FF9F45','#FFD84A','#7EE8AE']},
  {id:'blossom', name:'Blossom', chips:['#FDF0F5','#7A45D6','#1E93DB','#2E9C86']},
  {id:'custom',  name:'Custom',  chips:['#1A1033','#5FE3C8','#FFC94A','#48D597']}
];
