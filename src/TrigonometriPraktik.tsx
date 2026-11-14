import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {TRIGONOMETRI_SCENE_STARTS, TRIGONOMETRI_DURATION_FRAMES} from './generated/trigonometri-timing';

const scenes = [
  {tag:'PRAKTIK TRIGONOMETRI', title:'Mengukur tinggi\ntanpa memanjat.', sub:'Kita akan memperkirakan tinggi tiang bendera dengan sudut elevasi.', color:'#f4c56a'},
  {tag:'OBJEK DAN JARAK', title:'Sebuah tiang\ndi halaman sekolah.', sub:'Pengamat berdiri 8 meter dari pangkal tiang pada permukaan yang datar.', color:'#86c9b7'},
  {tag:'MENGUKUR SUDUT', title:'Arahkan klinometer\nke puncak tiang.', sub:'Sudut elevasi pada contoh ini adalah 35 derajat.', color:'#f0a878'},
  {tag:'MEMBENTUK SEGITIGA', title:'Jarak, tinggi,\ndan garis pandang.', sub:'Ketiganya membentuk segitiga siku-siku untuk perhitungan tangen.', color:'#a9b8ef'},
  {tag:'RUMUS TANGEN', title:'Gunakan perbandingan\nsisi depan dan samping.', sub:'Tangen sudut sama dengan tinggi di atas mata dibagi jarak mendatar.', color:'#8ed4d1'},
  {tag:'SUBSTITUSI ANGKA', title:'Masukkan data\ncontoh pengukuran.', sub:'8 dikali tangen 35 derajat, kemudian ditambah tinggi mata 1,5 meter.', color:'#f1c77d'},
  {tag:'HASIL PERHITUNGAN', title:'Tinggi sekitar\n7,10 meter.', sub:'Nilai ini merupakan hasil simulasi, bukan pengukuran nyata di sekolah.', color:'#a9d6a2'},
  {tag:'KESIMPULAN', title:'Trigonometri membantu\nmengukur dari jauh.', sub:'Dengan jarak dan sudut elevasi, tinggi objek dapat diperkirakan.', color:'#e9c4e5'},
] as const;
const clamp = {extrapolateLeft:'clamp' as const, extrapolateRight:'clamp' as const};

const FlagpoleScene: React.FC<{frame:number; mode:number; accent:string}> = ({frame,mode,accent}) => {
  const rise = interpolate(frame,[0,45],[0,1],clamp);
  const pulse = 1 + Math.sin(frame/12)*0.025;
  return <svg viewBox="0 0 1080 1000" width="100%" height="100%" style={{position:'absolute',inset:0}}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#29465b"/><stop offset="1" stopColor="#9bb6b1"/></linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#657a79"/><stop offset="1" stopColor="#273b45"/></linearGradient>
    </defs>
    <rect width="1080" height="1000" fill="url(#sky)"/>
    <circle cx="850" cy="150" r="72" fill="#f5d79b" opacity=".75"/>
    <path d="M0 490 Q240 420 510 485 T1080 460 V1000 H0Z" fill="#496d60"/>
    <path d="M0 680 L1080 610 V1000 H0Z" fill="url(#road)"/>
    <path d="M0 810 L1080 740" stroke="#d5d5b9" strokeWidth="9" strokeDasharray="65 48" opacity=".55"/>
    <g opacity=".65" fill="#294d46">
      {[80,180,940,1030].map((x,i)=><g key={x} transform={`translate(${x} 485) scale(${.65+(i%2)*.18})`}><path d="M0 0 L-62 -120 L-25 -110 L-74 -190 L0 -165 L74 -190 L25 -110 L62 -120Z"/><rect x="-9" y="0" width="18" height="70" fill="#574b3c"/></g>)}
    </g>
    <g transform={`translate(760 0) scale(${pulse})`}>
      <path d={`M0 650 L0 ${650-460*rise}`} stroke="#e9e5d8" strokeWidth="18" strokeLinecap="round"/>
      <path d={`M0 ${190+460*(1-rise)} L110 ${230+460*(1-rise)} L0 ${270+460*(1-rise)}Z`} fill="#d96b58"/>
      <path d="M-28 650 H28" stroke="#d6c5a4" strokeWidth="18" strokeLinecap="round"/>
    </g>
    <g transform="translate(250 650)">
      <ellipse cy="10" rx="35" ry="9" fill="#14232b" opacity=".45"/>
      <circle cy="-100" r="24" fill="#d9a77f"/>
      <path d="M-24 -125 Q0 -154 24 -125" fill="#263746"/>
      <path d="M-25 -74 L25 -74 L35 0 H-35Z" fill="#d9e5df"/>
      <path d="M-22 0 L-12 58 M22 0 L32 58" stroke="#263746" strokeWidth="15" strokeLinecap="round"/>
    </g>
    {mode >= 1 && <g>
      <path d="M250 585 H760" stroke={accent} strokeWidth="5" strokeDasharray="13 10"/>
      <path d="M250 570 V600 M760 570 V600" stroke={accent} strokeWidth="6"/>
      <rect x="430" y="535" width="150" height="45" rx="12" fill="#132936" opacity=".92"/>
      <text x="505" y="565" fill="#fff" textAnchor="middle" fontSize="27" fontWeight="700">8 meter</text>
    </g>}
    {mode >= 2 && <g>
      <path d="M250 585 L760 190" stroke="#ffdc91" strokeWidth="5" strokeDasharray="12 9"/>
      <path d="M250 585 A95 95 0 0 0 326 526" fill="none" stroke="#ffdc91" strokeWidth="7"/>
      <rect x="300" y="515" width="100" height="48" rx="12" fill="#132936"/>
      <text x="350" y="548" fill="#fff" textAnchor="middle" fontSize="28" fontWeight="700">35°</text>
    </g>}
    {mode >= 3 && <g>
      <path d="M760 190 V585 H250" fill="none" stroke="#e8f0ed" strokeWidth="4" strokeDasharray="8 8"/>
      <path d="M730 585 V555 H760" fill="none" stroke="#fff" strokeWidth="5"/>
      <text x="790" y="400" fill="#fff" fontSize="27" fontWeight="700">h − 1,5 m</text>
    </g>}
    {mode >= 1 && <text x="505" y="900" fill="#fff" opacity=".82" textAnchor="middle" fontSize="25">ILUSTRASI PENGUKURAN • DATA SIMULASI</text>}
  </svg>;
};

const FormulaCard: React.FC<{frame:number; mode:number; accent:string}> = ({frame,mode,accent}) => {
  const reveal = (at:number) => interpolate(frame,[at,at+18],[0,1],clamp);
  const items = mode===4 ? ['tan(35°) = (h − 1,5) / 8','h − 1,5 = 8 × tan(35°)','h = 8 × 0,7002 + 1,5'] : ['h = 8 × tan(35°) + 1,5','h = 5,6016 + 1,5','h ≈ 7,10 meter'];
  return <div style={{position:'absolute',left:55,right:55,bottom:125,padding:'30px 28px',borderRadius:26,background:'rgba(9,23,34,.9)',border:'2px solid '+accent,boxShadow:'0 20px 50px rgba(0,0,0,.22)'}}>
    {items.map((item,i)=><div key={item} style={{fontSize:mode===4?25:29,fontWeight:700,color:i===2?'#fff':accent,margin:'14px 0',opacity:reveal(8+i*24),fontFamily:'Arial,sans-serif'}}>{item}</div>)}
  </div>;
};

export const TrigonometriPraktik: React.FC = () => {
  const frame=useCurrentFrame();
  const sceneIndex=Math.max(0,TRIGONOMETRI_SCENE_STARTS.reduce<number>((active,start,index)=>frame>=start?index:active,0));
  const start=TRIGONOMETRI_SCENE_STARTS[sceneIndex];
  const local=frame-start;
  const scene=scenes[sceneIndex];
  const fade=interpolate(local,[0,20],[0,1],clamp);
  const mode=sceneIndex<2?0:sceneIndex===2?2:sceneIndex===3?3:sceneIndex<6?3:3;
  const isFormula=sceneIndex===4||sceneIndex===5;
  const titleY=interpolate(local,[0,35],[24,0],{...clamp,easing:Easing.out(Easing.cubic)});
  const music=interpolate(frame,[0,90,TRIGONOMETRI_DURATION_FRAMES-120,TRIGONOMETRI_DURATION_FRAMES],[0,.13,.13,0],clamp);
  return <>
    <Audio src={staticFile('audio/music-bed.wav')} volume={music}/>
    <Audio src={staticFile('audio/trigonometri-narration.mp3')} volume={1}/>
    <AbsoluteFill style={{background:'#142b3a',color:'#fff8eb',fontFamily:'Arial,sans-serif',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,#193447,#375667 48%,#142630)'}}/>
      <div style={{position:'absolute',top:70,left:60,right:60,display:'flex',justifyContent:'space-between',fontSize:17,letterSpacing:3,color:'#dbe8df'}}>
        <span>MATEMATIKA • KELAS X</span><span>{String(sceneIndex+1).padStart(2,'0')} / 08</span>
      </div>
      <div style={{position:'absolute',top:165,left:55,right:55,textAlign:'center',opacity:fade,transform:`translateY(${titleY}px)`}}>
        <div style={{fontSize:17,letterSpacing:5,fontWeight:700,color:scene.color,marginBottom:20}}>{scene.tag}</div>
        <div style={{fontSize:sceneIndex===7?48:51,lineHeight:1.12,fontWeight:800,whiteSpace:'pre-line'}}>{scene.title}</div>
        <div style={{fontSize:22,lineHeight:1.45,color:'rgba(255,248,235,.82)',margin:'18px auto 0',maxWidth:900}}>{scene.sub}</div>
      </div>
      <div style={{position:'absolute',top:490,left:0,right:0,height:870}}>
        <FlagpoleScene frame={frame} mode={sceneIndex===0?0:sceneIndex===1?1:sceneIndex===2?2:3} accent={scene.color}/>
      </div>
      {isFormula && <FormulaCard frame={local} mode={sceneIndex===4?4:5} accent={scene.color}/>}
      {sceneIndex===6 && <div style={{position:'absolute',bottom:160,left:80,right:80,textAlign:'center',fontSize:62,fontWeight:800,color:scene.color,textShadow:'0 6px 25px #07141d'}}>≈ 7,10 METER</div>}
      <div style={{position:'absolute',bottom:58,left:60,right:60}}>
        <div style={{height:4,background:'rgba(255,255,255,.2)',borderRadius:4}}><div style={{height:4,width:`${frame/(TRIGONOMETRI_DURATION_FRAMES-1)*100}%`,background:scene.color,borderRadius:4}}/></div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:13,fontSize:13,letterSpacing:2,color:'#dbe8df'}}><span>PRAKTIK TRIGONOMETRI</span><span>DATA SIMULASI</span></div>
      </div>
    </AbsoluteFill>
  </>;
};
