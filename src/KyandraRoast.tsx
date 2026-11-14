import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {KYANDRA_SCENE_STARTS, KYANDRA_DURATION_FRAMES} from './generated/kyandra-timing';

const scenes = [
  {tag:'LAPORAN KHUSUS',title:'KASUS 149 CM',sub:'Sebuah dokumenter yang terlalu serius untuk topik sesantai ini.',accent:'#ffd166'},
  {tag:'HASIL PENGAMATAN',title:'Angka boleh 149…',sub:'Tapi tingkat percaya dirinya? Tidak ditemukan batas atasnya.',accent:'#9ce4d5'},
  {tag:'TEKNOLOGI KAMERA',title:'Fotografer perlu strategi.',sub:'Bukan karena sulit. Cuma setiap orang punya angle terbaik masing-masing.',accent:'#f5a7a7'},
  {tag:'PENELITIAN LAPANGAN',title:'Saat foto bersama…',sub:'Kamera mendadak belajar seni komposisi dan perspektif.',accent:'#b9b5ff'},
  {tag:'FAKTA YANG TAK TERBANTAHKAN',title:'149 cm tinggi badan.',sub:'149% energi. 1000% percaya diri. Hitungannya tidak perlu kalkulator.',accent:'#ffd166'},
  {tag:'PESAN PENELITI',title:'Jangan salah paham.',sub:'Ini bukan kekurangan. Ini edisi ringkas dengan fitur lengkap.',accent:'#9ce4d5'},
  {tag:'PENUTUP',title:'Kyandra, jangan ngambek!',sub:'Kalau ngambek, nanti satu kamera ikut minta maaf.',accent:'#f5a7a7'},
] as const;
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const Person:React.FC<{x:number;y:number;scale:number;accent:string;frame:number}> = ({x,y,scale,accent,frame}) => {
 const bob=Math.sin(frame/9)*4;
 return <g transform={`translate(${x} ${y+bob}) scale(${scale})`}>
  <ellipse cy="5" rx="43" ry="10" fill="#06141d" opacity=".25"/>
  <circle cy="-118" r="32" fill="#dca985"/>
  <path d="M-31 -130 Q-22 -170 12 -154 Q38 -145 30 -118 Q9 -137 -31 -130" fill="#253b4b"/>
  <circle cx="-11" cy="-120" r="3.5" fill="#26333a"/><circle cx="11" cy="-120" r="3.5" fill="#26333a"/>
  <path d="M-10 -103 Q0 -96 10 -103" fill="none" stroke="#754d43" strokeWidth="3" strokeLinecap="round"/>
  <path d="M-35 -79 Q0 -96 35 -79 L45 0 H-45Z" fill={accent}/>
  <path d="M-22 0 L-27 75 M22 0 L27 75" stroke="#273b4b" strokeWidth="19" strokeLinecap="round"/>
  <path d="M-28 75 H-8 M22 75 H42" stroke="#182a36" strokeWidth="12" strokeLinecap="round"/>
 </g>;
};
const Panel:React.FC<{frame:number;scene:number;accent:string}> = ({frame,scene,accent}) => {
 const pop=interpolate(frame,[0,18],[.7,1],{...clamp,easing:Easing.out(Easing.back(1.4))});
 return <svg viewBox="0 0 1080 1000" width="100%" height="100%" style={{position:'absolute',inset:0}}>
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#243f53"/><stop offset="1" stopColor="#142b3a"/></linearGradient></defs>
  <rect width="1080" height="1000" fill="url(#bg)"/>
  <circle cx="840" cy="160" r="115" fill={accent} opacity=".12"/>
  <path d="M0 730 Q260 670 520 730 T1080 700 V1000 H0Z" fill="#345a5d"/>
  <path d="M0 850 Q280 790 560 850 T1080 820" fill="none" stroke="#a8c6ba" strokeWidth="5" opacity=".35"/>
  {scene===0 && <g transform="translate(540 520) scale(1.1)"><rect x="-205" y="-210" width="410" height="410" rx="35" fill="#0b1c29" stroke={accent} strokeWidth="8"/><text y="-70" textAnchor="middle" fill="#fff" fontSize="62" fontWeight="800">149</text><text y="20" textAnchor="middle" fill={accent} fontSize="44" fontWeight="800">CM</text><text y="105" textAnchor="middle" fill="#dce9e7" fontSize="25">ARSIP PENGAMATAN</text></g>}
  {scene===1 && <g><Person x={540} y={710} scale={1.25} accent={accent} frame={frame}/><g transform="translate(540 265)"><rect x="-230" y="-80" width="460" height="125" rx="28" fill="#0b1c29" stroke={accent} strokeWidth="5"/><text y="0" textAnchor="middle" fill="#fff" fontSize="43" fontWeight="800">PERCAYA DIRI: ∞</text></g></g>}
  {scene===2 && <g><Person x={540} y={700} scale={1.15} accent={accent} frame={frame}/><g transform="translate(540 290)"><rect x="-260" y="-95" width="520" height="180" rx="28" fill="#0b1c29" stroke={accent} strokeWidth="5"/><rect x="-190" y="-48" width="380" height="80" rx="18" fill="#233e50"/><circle cx="0" cy="-8" r="26" fill={accent}/><text x="0" y="68" textAnchor="middle" fill="#fff" fontSize="25">ANGLE TERBAIK DITEMUKAN</text></g></g>}
  {scene===3 && <g><Person x={380} y={720} scale={1.1} accent={accent} frame={frame}/><Person x={700} y={720} scale={1.35} accent="#d7e3e0" frame={frame}/><rect x="455" y="370" width="170" height="115" rx="24" fill="#0b1c29" stroke={accent} strokeWidth="5"/><circle cx="540" cy="428" r="34" fill="none" stroke="#fff" strokeWidth="9"/><circle cx="540" cy="428" r="12" fill={accent}/><path d="M540 485 V535" stroke="#fff" strokeWidth="8"/></g>}
  {scene===4 && <g transform={`translate(540 480) scale(${pop})`}><rect x="-290" y="-170" width="580" height="340" rx="35" fill="#0b1c29" stroke={accent} strokeWidth="6"/><text y="-45" textAnchor="middle" fill="#fff" fontSize="72" fontWeight="900">149 cm</text><text y="40" textAnchor="middle" fill={accent} fontSize="48" fontWeight="900">149%</text><text y="105" textAnchor="middle" fill="#dce9e7" fontSize="26">ENERGI • 1000% PERCAYA DIRI</text></g>}
  {scene===5 && <g><Person x={540} y={710} scale={1.2} accent={accent} frame={frame}/><path d="M360 430 Q540 300 720 430" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round"/><text x="540" y="350" textAnchor="middle" fill="#fff" fontSize="44" fontWeight="800">COMPACT EDITION</text></g>}
  {scene===6 && <g><Person x={540} y={710} scale={1.2} accent={accent} frame={frame}/><g transform="translate(540 270)"><path d="M-190 -50 Q-230 -150 -95 -145 Q-20 -230 65 -150 Q210 -155 190 -40 Q240 55 125 85 H-140 Q-240 45 -190 -50Z" fill="#fff" stroke="#0b1c29" strokeWidth="7"/><text y="12" textAnchor="middle" fill="#182c3a" fontSize="38" fontWeight="900">JANGAN NGAMBEK 😄</text></g></g>}
  <text x="540" y="940" textAnchor="middle" fill="#dce9e7" opacity=".75" fontSize="22" letterSpacing="4">DOKUMENTER KOMEDI • KHUSUS TEMAN</text>
 </svg>;
};
export const KyandraRoast:React.FC=()=>{
 const frame=useCurrentFrame();
 const idx=Math.max(0,KYANDRA_SCENE_STARTS.reduce<number>((a,s,i)=>frame>=s?i:a,0));
 const local=frame-KYANDRA_SCENE_STARTS[idx],s=scenes[idx];
 const fade=interpolate(local,[0,18],[0,1],clamp);
 const titleY=interpolate(local,[0,25],[24,0],{...clamp,easing:Easing.out(Easing.cubic)});
 const music=interpolate(frame,[0,45,KYANDRA_DURATION_FRAMES-60,KYANDRA_DURATION_FRAMES],[0,.18,.18,0],clamp);
 return <>
  <Audio src={staticFile('audio/music-bed.wav')} volume={music}/>
  <Audio src={staticFile('audio/kyandra-narration.mp3')} volume={1}/>
  <AbsoluteFill style={{background:'#142b3a',color:'#fff8eb',fontFamily:'Arial,sans-serif',overflow:'hidden'}}>
   <div style={{position:'absolute',top:62,left:55,right:55,display:'flex',justifyContent:'space-between',fontSize:16,letterSpacing:3,color:'#dce9e7'}}><span>MINI DOKUMENTER KOMEDI</span><span>{String(idx+1).padStart(2,'0')} / 07</span></div>
   <div style={{position:'absolute',top:155,left:55,right:55,textAlign:'center',opacity:fade,transform:`translateY(${titleY}px)`}}>
    <div style={{fontSize:17,letterSpacing:5,fontWeight:800,color:s.accent,marginBottom:18}}>{s.tag}</div>
    <div style={{fontSize:idx===0?62:48,lineHeight:1.12,fontWeight:900,whiteSpace:'pre-line'}}>{s.title}</div>
    <div style={{fontSize:23,lineHeight:1.4,color:'rgba(255,248,235,.84)',margin:'18px auto 0',maxWidth:900}}>{s.sub}</div>
   </div>
   <div style={{position:'absolute',top:480,left:0,right:0,height:900}}><Panel frame={frame} scene={idx} accent={s.accent}/></div>
   <div style={{position:'absolute',bottom:55,left:55,right:55}}><div style={{height:5,background:'rgba(255,255,255,.2)',borderRadius:5}}><div style={{height:5,width:`${frame/(KYANDRA_DURATION_FRAMES-1)*100}%`,background:s.accent,borderRadius:5}}/></div><div style={{display:'flex',justifyContent:'space-between',marginTop:12,fontSize:13,letterSpacing:2,color:'#dce9e7'}}><span>KYANDRA • 149 CM</span><span>ROAST TIPIS, NO HARD FEELINGS</span></div></div>
  </AbsoluteFill>
 </>;
};
