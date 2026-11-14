import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {TRIGONOMETRI_DIALOGUE_CUES, TRIGONOMETRI_DURATION_FRAMES} from './generated/trigonometri-timing';

type Speaker = 'Filza' | 'Falyn' | 'Taysa' | 'Rahma' | 'Miko' | 'Bayu';
type Scene = 'opening' | 'tools' | 'build' | 'measure' | 'geometry' | 'formula' | 'result' | 'closing';\ntype DialogueCue = {speaker: Speaker; scene: Scene; text: string; file: string; startFrame: number; durationFrames: number};
const cast: {name: Speaker; role: string; color: string; female: boolean}[] = [
  {name:'Filza',role:'ceria dan ekspresif',color:'#f2a7bc',female:true},
  {name:'Falyn',role:'tenang dan jelas',color:'#d5b7f4',female:true},
  {name:'Taysa',role:'aktif dan antusias',color:'#f2c36e',female:true},
  {name:'Rahma',role:'lembut dan teliti',color:'#9ccbb9',female:true},
  {name:'Miko',role:'santai dan humoris',color:'#8bbbe0',female:false},
  {name:'Bayu',role:'tegas dan percaya diri',color:'#e49a72',female:false},
];
const clamp = {extrapolateLeft:'clamp' as const, extrapolateRight:'clamp' as const};
const scenes: Record<Scene,{label:string;title:string;description:string;view:string}> = {
  opening:{label:'PEMBUKAAN',title:'Belajar trigonometri\ndi halaman sekolah',description:'Enam anggota kelompok memulai praktik pengukuran tinggi tiang bendera.',view:'wide'},
  tools:{label:'ALAT DAN BAHAN',title:'Siapkan alat\npengukuran sederhana',description:'Meteran, busur derajat, sedotan, benang, pemberat, dan kalkulator.',view:'tools'},
  build:{label:'MEMBUAT KLINOMETER',title:'Merakit alat pengukur sudut',description:'Sedotan menjadi pembidik, benang dan pemberat menunjukkan garis vertikal.',view:'close'},
  measure:{label:'PENGUKURAN',title:'Bidik puncak tiang\ndari posisi pengamat',description:'Jarak mendatar 8 meter • sudut elevasi 35° • tinggi mata 1,5 meter.',view:'pov'},
  geometry:{label:'MODEL SEGITIGA',title:'Ubah pengukuran\nmenjadi segitiga siku-siku',description:'Sudut elevasi diukur dari garis horizontal setinggi mata pengamat.',view:'diagram'},
  formula:{label:'PERHITUNGAN',title:'Gunakan perbandingan tangen',description:'tan θ = sisi depan ÷ sisi samping.',view:'formula'},
  result:{label:'HASIL SIMULASI',title:'Tinggi tiang sekitar\n7,10 meter',description:'Hasil contoh perhitungan, bukan pengukuran nyata di sekolah.',view:'result'},
  closing:{label:'PENUTUP',title:'Trigonometri ada\ndi sekitar kita',description:'Kelompok belajar mengukur, menghitung, dan bekerja sama.',view:'wide'},
};
const sceneOrder: Scene[] = ['opening','tools','build','measure','geometry','formula','result','closing'];

const Student: React.FC<{x:number;y:number;person:typeof cast[number];active:boolean;index:number}> = ({x,y,person,active,index}) => {
  const bob = Math.sin(index*1.7)*3;
  return <g transform={`translate(${x} ${y+bob})`}>
    {active && <ellipse cx="0" cy="-84" rx="42" ry="66" fill={person.color} opacity=".19"/>}
    <ellipse cy="0" rx="25" ry="7" fill="#172c36" opacity=".25"/>
    <path d="M-19 -50 Q0 -59 19 -50 L25 -5 L-25 -5Z" fill={person.color} stroke="#223744" strokeWidth="3"/>
    <path d="M-13 -5 L-17 0 L-17 35 M13 -5 L17 0 L17 35" stroke="#263b48" strokeWidth="10" strokeLinecap="round"/>
    <path d="M-18 -44 L-35 -19 M18 -44 L34 -24" stroke="#d9a889" strokeWidth="9" strokeLinecap="round"/>
    <circle cy="-72" r="20" fill="#d9a889"/>
    {person.female
      ? <path d="M-20 -74 Q-23 -101 0 -99 Q24 -100 21 -72 L23 -42 Q13 -48 17 -67 Q0 -57 -18 -68 L-18 -43Z" fill={['#302b35','#4a3030','#302b35','#503b34'][index%4]}/>
      : <path d="M-20 -75 Q-17 -99 4 -96 Q22 -93 20 -74 Q5 -86 -20 -75Z" fill={index===4?'#292d34':'#40352e'}/>}
    <circle cx="-7" cy="-72" r="2" fill="#26323b"/><circle cx="7" cy="-72" r="2" fill="#26323b"/>
    <path d="M-5 -61 Q0 -57 5 -61" stroke="#844e45" strokeWidth="2" fill="none"/>
    <rect x="-29" y="42" width="58" height="22" rx="11" fill="#142b38" opacity=".95"/>
    <text x="0" y="57" fontSize="13" fontWeight="700" fill="white" textAnchor="middle">{person.name}</text>
  </g>;
};

const SchoolScene: React.FC<{frame:number;view:string;active:Speaker|null}> = ({frame,view,active}) => {
  const zoom = interpolate(frame%180,[0,90,180],[1,1.035,1],{...clamp,easing:Easing.inOut(Easing.quad)});
  const names: Speaker[] = ['Filza','Falyn','Taysa','Rahma','Miko','Bayu'];
  const positions = [250,390,530,670,810,950];
  return <svg viewBox="0 0 1200 650" width="100%" height="100%" style={{position:'absolute',inset:0}}>
    <defs>
      <linearGradient id="skyTrig" x2="0" y2="1"><stop stopColor="#91c4d5"/><stop offset="1" stopColor="#e8dfbd"/></linearGradient>
      <linearGradient id="grassTrig" x2="0" y2="1"><stop stopColor="#7fa77b"/><stop offset="1" stopColor="#416c5b"/></linearGradient>
    </defs>
    <g transform={`translate(600 325) scale(${zoom}) translate(-600 -325)`}>
      <rect width="1200" height="650" fill="url(#skyTrig)"/>
      <circle cx="1020" cy="95" r="45" fill="#fff0c1" opacity=".9"/>
      <path d="M0 320 Q180 260 370 315 T760 300 T1200 310 V650 H0Z" fill="#86a99a"/>
      <rect y="370" width="1200" height="280" fill="url(#grassTrig)"/>
      <path d="M0 445 Q600 410 1200 445" stroke="#d7d0a8" strokeWidth="5" opacity=".55"/>
      <g fill="#e6e4d6"><rect x="40" y="205" width="210" height="145"/><path d="M25 210 L145 130 L265 210Z" fill="#b36d59"/><rect x="75" y="250" width="42" height="55" fill="#78a9b7"/><rect x="165" y="250" width="42" height="55" fill="#78a9b7"/></g>
      <g fill="#38634e"><circle cx="340" cy="295" r="58"/><rect x="333" y="290" width="14" height="85" fill="#745b42"/></g>
      <path d="M0 515 Q600 485 1200 520" stroke="#b9c49c" strokeWidth="3" fill="none" opacity=".45"/>
      <g>
        <path d="M1080 550 V219" stroke="#e8e7dd" strokeWidth="13" strokeLinecap="round"/>
        <path d="M1080 221 L1160 241 L1080 263Z" fill="#d95d55"/>
        <path d="M1058 550 H1102" stroke="#e7d8b5" strokeWidth="14" strokeLinecap="round"/>
      </g>
      {view!=='pov' && <g>{names.map((n,i)=><Student key={n} x={positions[i]} y={520} person={cast[i]} active={active===n} index={i}/>)}</g>}
      {view==='tools' && <g transform="translate(600 395)"><rect x="-130" y="-42" width="260" height="82" rx="15" fill="#fff8e8" stroke="#294653" strokeWidth="4"/><text x="0" y="-8" textAnchor="middle" fontSize="22" fontWeight="700" fill="#263f4a">METERAN • BUSUR</text><text x="0" y="22" textAnchor="middle" fontSize="19" fill="#263f4a">SEDOTAN • BENANG</text></g>}
      {view==='close' && <g transform="translate(650 365)"><path d="M-110 0 H110" stroke="#263d4a" strokeWidth="12" strokeLinecap="round"/><path d="M0 -5 V90" stroke="#263d4a" strokeWidth="3"/><path d="M0 90 L-10 75 H10Z" fill="#d95d55"/><path d="M-110 0 A110 110 0 0 1 0 -110" stroke="#f4c56a" strokeWidth="5" fill="none"/><text x="20" y="-48" fontSize="24" fill="#203946" fontWeight="700">KLINOMETER</text></g>}
      {view==='pov' && <g>
        <path d="M707 480 L1080 219" stroke="#f8d67d" strokeWidth="6" strokeDasharray="16 12"/>
        <path d="M707 480 H1080" stroke="#fff8e8" strokeWidth="3" strokeDasharray="12 10" opacity=".8"/>
        <path d="M707 480 A95 95 0 0 0 780 432" stroke="#f8d67d" strokeWidth="6" fill="none"/>
        <rect x="780" y="410" width="105" height="48" rx="12" fill="#183544"/><text x="832" y="442" textAnchor="middle" fontSize="27" fill="white" fontWeight="700">35°</text>
        <rect x="560" y="490" width="180" height="45" rx="12" fill="#183544"/><text x="650" y="520" textAnchor="middle" fontSize="25" fill="white" fontWeight="700">8 meter</text>
        <g transform="translate(707 480)"><circle cy="-22" r="18" fill="#d9a889"/><path d="M-22 0 Q0 -12 22 0 L30 90 H-30Z" fill="#8bbbe0"/><path d="M-15 88 L-20 125 M15 88 L20 125" stroke="#263b48" strokeWidth="12"/></g>
      </g>}
    </g>
  </svg>;
};

const GeometryPanel: React.FC<{view:string}> = ({view}) => {
  if (!['diagram','formula','result'].includes(view)) return null;
  return <div style={{position:'absolute',right:75,top:300,width:690,height:460,padding:28,borderRadius:24,background:'rgba(14,35,48,.94)',border:'2px solid rgba(255,255,255,.25)',boxShadow:'0 24px 60px rgba(0,0,0,.25)'}}>
    <div style={{fontSize:20,letterSpacing:3,color:'#f2c36e',fontWeight:800,marginBottom:12}}>MODEL MATEMATIKA</div>
    <svg viewBox="0 0 620 300" width="100%" height="270">
      <path d="M65 235 H400 V0" stroke="#f7f3e8" strokeWidth="4" fill="none"/>
      <path d="M65 235 L400 0" stroke="#f2c36e" strokeWidth="5" fill="none"/>
      <path d="M65 235 A75 75 0 0 0 130 201" stroke="#f2c36e" strokeWidth="4" fill="none"/>
      <path d="M370 235 V205 H400" stroke="#f7f3e8" strokeWidth="3" fill="none"/>
      <text x="92" y="205" fill="#f2c36e" fontSize="23" fontWeight="700">35°</text>
      <text x="230" y="270" fill="#fff" fontSize="23" textAnchor="middle">8 m</text>
      <text x="415" y="115" fill="#fff" fontSize="22">h − 1,5 m</text>
      <text x="310" y="95" fill="#f2c36e" fontSize="20" textAnchor="middle">garis pandang</text>
    </svg>
    <div style={{display:'flex',justifyContent:'space-between',fontSize:18,color:'#dce8e7'}}><span>Jarak mendatar: 8 m</span><span>Tinggi mata: 1,5 m</span></div>
    {view!=='diagram' && <div style={{marginTop:18,fontSize:25,lineHeight:1.6,color:'#fff',fontWeight:700}}>tan 35° = (h − 1,5) / 8<br/>h = 8 × 0,7002 + 1,5<br/><span style={{color:'#f2c36e'}}>h ≈ 7,10 meter</span></div>}
  </div>;
};

export const TrigonometriPraktik: React.FC = () => {
  const frame=useCurrentFrame();
  const cues=TRIGONOMETRI_DIALOGUE_CUES as readonly DialogueCue[];
  const activeIndex=cues.reduce((found,cue,index)=>frame>=cue.startFrame?index:found,-1);
  const active=activeIndex>=0?cues[activeIndex]:null;
  const scene=active?.scene ?? 'opening';
  const info=scenes[scene as Scene];
  const speaker=active ? cast.find((c)=>c.name===active.speaker) : undefined;
  const sceneIndex=sceneOrder.indexOf(scene as Scene);
  const progress=interpolate(frame,[0,TRIGONOMETRI_DURATION_FRAMES],[0,100],clamp);
  const titleOpacity=1;
  const music=interpolate(frame,[0,75,TRIGONOMETRI_DURATION_FRAMES-90,TRIGONOMETRI_DURATION_FRAMES],[0,.1,.1,0],clamp);
  return <>
    <Audio src={staticFile('audio/music-bed.wav')} volume={music}/>
    {cues.map((cue)=><Sequence key={cue.file} from={cue.startFrame}><Audio src={staticFile(cue.file)} volume={1}/></Sequence>)}
    <AbsoluteFill style={{background:'#142b3a',color:'#fff8eb',fontFamily:'Arial,sans-serif',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#17384b,#34596a 55%,#172f3a)'}}/>
      <div style={{position:'absolute',top:35,left:70,right:70,display:'flex',justifyContent:'space-between',fontSize:17,letterSpacing:3,color:'#e3eee8',zIndex:5}}>
        <span>MATEMATIKA • KELAS X</span><span>KELOMPOK 6 ANGGOTA</span>
      </div>
      <div style={{position:'absolute',top:95,left:65,width:info.view==='diagram'||info.view==='formula'||info.view==='result'?850:1780,zIndex:3,opacity:titleOpacity}}>
        <div style={{fontSize:19,letterSpacing:5,fontWeight:800,color:'#f2c36e',marginBottom:12}}>{info.label} • {String(sceneIndex+1).padStart(2,'0')}/08</div>
        <div style={{fontSize:48,lineHeight:1.12,fontWeight:900,whiteSpace:'pre-line',textShadow:'0 4px 18px rgba(0,0,0,.2)'}}>{info.title}</div>
        <div style={{fontSize:23,lineHeight:1.4,color:'rgba(255,248,235,.88)',marginTop:13,maxWidth:850}}>{info.description}</div>
      </div>
      <div style={{position:'absolute',left:0,right:0,bottom:0,height:590,overflow:'hidden'}}>
        <SchoolScene frame={frame} view={info.view} active={active?.speaker ?? null}/>
      </div>
      <GeometryPanel view={info.view}/>
      {active && speaker && <div style={{position:'absolute',left:70,right:70,bottom:55,zIndex:6,padding:'20px 28px',borderRadius:20,background:'rgba(9,24,34,.94)',border:'2px solid '+speaker.color,boxShadow:'0 14px 35px rgba(0,0,0,.24)'}}>
        <div style={{display:'flex',alignItems:'center',gap:15,marginBottom:8}}>
          <div style={{width:15,height:15,borderRadius:20,background:speaker.color}}/>
          <span style={{fontSize:21,fontWeight:900,color:speaker.color}}>{speaker.name}</span>
          <span style={{fontSize:15,color:'#c9d7d8'}}>• {speaker.role}</span>
        </div>
        <div style={{fontSize:24,lineHeight:1.35,fontWeight:600}}>{active.text}</div>
      </div>}
      <div style={{position:'absolute',left:70,right:70,top:75,height:4,background:'rgba(255,255,255,.18)',zIndex:6,borderRadius:5}}>
        <div style={{height:4,width:progress+'%',background:'#f2c36e',borderRadius:5}}/>
      </div>
    </AbsoluteFill>
  </>;
};
