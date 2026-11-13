import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';

const FPS = 30;
const SCENE_LENGTH = 338;
const scenes = [
  {tag:'SEBUAH AWAL',title:'Semua bermula\ndari satu benih.',sub:'Sebuah ide kecil berani diberi kesempatan untuk tumbuh.',tone:'#142c35',accent:'#8bbd9a',action:'seed'},
  {tag:'MENYUSUN MIMPI',title:'Ide mulai\nmenjadi rencana.',sub:'Mereka menyusun tujuan, membagi tugas, dan menyiapkan langkah pertama.',tone:'#1c3544',accent:'#9dc5d2',action:'plan'},
  {tag:'DELAPAN KEAHLIAN',title:'Delapan orang\nmembawa kekuatan.',sub:'Desain, teknologi, riset, komunikasi, dan banyak kemampuan lain.',tone:'#28294a',accent:'#c1b4ed',action:'team'},
  {tag:'MULAI BERKARYA',title:'Masing-masing\ mulai mengambil peran.',sub:'Pekerjaan kecil disatukan menjadi sesuatu yang lebih besar.',tone:'#1d3c3a',accent:'#a9d4a8',action:'work'},
  {tag:'ADA TANTANGAN',title:'Tidak semua\nberjalan mulus.',sub:'Kesalahan ditemukan. Rencana perlu diperbaiki. Tim tidak menyerah.',tone:'#432e3a',accent:'#e2ad9a',action:'challenge'},
  {tag:'BELAJAR BERSAMA',title:'Mereka mencoba\nsekali lagi.',sub:'Saling membantu, memperbaiki, dan tumbuh dari pengalaman.',tone:'#354333',accent:'#c7d99b',action:'learn'},
  {tag:'HASIL KERJA TIM',title:'Perlahan, usaha\nmenjadi nyata.',sub:'Ide yang dulu kecil kini mulai memberi hasil.',tone:'#233b4b',accent:'#a5d8df',action:'growth'},
  {tag:'SATU IMPIAN',title:'Tumbuh bersama.\nMelangkah lebih jauh.',sub:'TUNAS KECIL — Delapan karyawan, satu impian.',tone:'#183c38',accent:'#c5e1ad',action:'final'},
];

const roles = [
  {name:'Pemimpin',color:'#e8b77f',hair:'#293342'},
  {name:'Desainer',color:'#d88f9c',hair:'#302b40'},
  {name:'Programmer',color:'#80b8c8',hair:'#292e36'},
  {name:'Riset',color:'#a9c58c',hair:'#41342c'},
  {name:'Marketing',color:'#d5a2e0',hair:'#322b38'},
  {name:'Keuangan',color:'#e0c17c',hair:'#3b302c'},
  {name:'Operasional',color:'#8ca9df',hair:'#2c3444'},
  {name:'Kreatif',color:'#d59d75',hair:'#352b32'},
];

const Plant: React.FC<{frame:number}> = ({frame}) => {
  const growth = interpolate(frame,[0,280,900,1700,2450],[0,0.22,0.48,0.78,1],{extrapolateRight:'clamp'});
  const stem = 100 + growth * 260;
  const leaf = interpolate(frame,[170,500],[0,1],{extrapolateRight:'clamp'});
  const crown = interpolate(frame,[1450,2500],[0,1],{extrapolateRight:'clamp'});
  const sway = Math.sin(frame/25)*2.4;
  return <svg viewBox="0 0 520 520" width="100%" height="100%" style={{overflow:'visible'}}>
    <ellipse cx="260" cy="460" rx="190" ry="28" fill="#091b1d" opacity=".35"/>
    <path d="M80 450 Q260 420 440 450 L420 488 Q260 520 100 488Z" fill="#70513b"/>
    <path d="M90 449 Q260 430 430 449" fill="none" stroke="#b18a60" strokeWidth="9" strokeLinecap="round"/>
    <path d="M260 452 Q250 380 260 ${452-stem}" fill="none" stroke="#b9d69a" strokeWidth="17" strokeLinecap="round"/>
    <g opacity={leaf} transform={`translate(260 ${452-stem+105}) rotate(${-18+sway})`}>
      <path d="M0 0 C-105 -105 -190 -48 -130 10 C-85 45 -30 34 0 0Z" fill="#83b77f"/>
      <path d="M-5 0 Q-78 -28 -145 -2" stroke="#d2e6ae" strokeWidth="5" fill="none"/>
    </g>
    <g opacity={leaf} transform={`translate(260 ${452-stem+40}) rotate(${22-sway})`}>
      <path d="M0 0 C80 -110 170 -65 130 -5 C90 42 35 32 0 0Z" fill="#b1d58e"/>
      <path d="M5 0 Q78 -36 145 -24" stroke="#e0edbd" strokeWidth="5" fill="none"/>
    </g>
    <g opacity={crown} transform={`translate(260 ${452-stem-12})`}>
      <path d="M0 20 C-95 -65 -105 -145 -35 -150 C-3 -150 5 -120 0 -95 C35 -185 130 -160 115 -90 C108 -48 48 -18 0 20Z" fill="#83b77f"/>
      <path d="M0 15 Q-10 -65 -32 -127 M0 5 Q54 -72 91 -125" stroke="#d7e9b5" strokeWidth="5" fill="none"/>
    </g>
    <circle cx="260" cy="455" r="13" fill="#e7c58c"/>
  </svg>;
};

const Person: React.FC<{index:number; frame:number}> = ({index,frame}) => {
  const role=roles[index];
  const bob=Math.sin(frame/12+index)*3;
  const wave=Math.sin(frame/9+index)*9;
  return <g transform={`translate(0 ${bob})`}>
    <ellipse cx="0" cy="111" rx="31" ry="7" fill="#07191c" opacity=".28"/>
    <path d="M-17 77 L-21 105 M17 77 L21 105" stroke="#e8e2d6" strokeWidth="10" strokeLinecap="round"/>
    <path d={`M-29 30 Q-34 15 -22 12 L22 12 Q34 15 29 30 L24 78 Q0 91 -24 78Z`} fill={role.color}/>
    <path d={`M-25 38 Q-45 45 -35 ${53+wave/2} M25 38 Q45 45 35 ${53-wave/2}`} stroke="#e8e2d6" strokeWidth="9" fill="none" strokeLinecap="round"/>
    <circle cx="0" cy="0" r="25" fill="#dcae8c"/>
    <path d="M-25 -2 Q-27 -31 0 -29 Q29 -28 25 0 Q12 -14 -1 -14 Q-14 -14 -25 -2Z" fill={role.hair}/>
    <circle cx="-8" cy="2" r="2.5" fill="#28313a"/><circle cx="8" cy="2" r="2.5" fill="#28313a"/>
    <path d="M-5 13 Q0 17 5 13" stroke="#8f5e53" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </g>;
};

const Team: React.FC<{frame:number; visible:boolean}> = ({frame,visible}) => {
  const opacity=visible?interpolate(frame,[520,650],[0,1],{extrapolateRight:'clamp'}):0;
  return <g opacity={opacity}>
    {roles.map((r,i)=>{
      const x=90+(i%4)*300;
      const y= i<4 ? 1080 : 1400;
      const delay=i*5;
      return <g key={r.name} transform={`translate(${x} ${y})`}>
        <rect x="-105" y="-58" width="210" height="205" rx="25" fill="#f4f1e7" opacity=".1" stroke="#fff" strokeOpacity=".18"/>
        <g transform="translate(0 -15) scale(.82)"><Person index={i} frame={frame+delay}/></g>
        <text x="0" y="123" textAnchor="middle" fill="#f8f4e9" fontSize="21" fontWeight="600">{r.name}</text>
      </g>;
    })}
  </g>;
};

const SceneProp: React.FC<{action:string; frame:number; accent:string}> = ({action,frame,accent}) => {
  const pulse=1+Math.sin(frame/12)*.035;
  if(action==='plan') return <g transform={`translate(540 570) scale(${pulse})`}>
    <rect x="-150" y="-90" width="300" height="185" rx="18" fill="#e9e5d9"/>
    <path d="M-105 -40 H90 M-105 0 H50 M-105 40 H105" stroke="#77918a" strokeWidth="10" strokeLinecap="round"/>
    <circle cx="105" cy="-50" r="28" fill={accent}/><path d="M90 -50 L102 -37 L123 -65" stroke="#fff" strokeWidth="7" fill="none"/>
  </g>;
  if(action==='work') return <g transform="translate(540 590)">
    {[0,1,2].map((n)=><g key={n} transform={`translate(${(n-1)*180} 0)`}>
      <rect x="-70" y="-55" width="140" height="95" rx="12" fill="#d8e4df"/>
      <rect x="-58" y="-42" width="116" height="67" rx="6" fill="#284b56"/>
      <path d="M-30 55 H30 L45 75 H-45Z" fill="#b9c7c0"/>
      <path d="M-35 -15 H35 M-35 0 H10" stroke={accent} strokeWidth="6" strokeLinecap="round"/>
    </g>)}
  </g>;
  if(action==='challenge') return <g transform="translate(540 590)">
    <path d="M-145 50 L-45 -65 L15 5 L75 -55 L150 50Z" fill="#9b6c68" opacity=".9"/>
    <path d="M-90 -85 L-65 -120 L-40 -85" stroke="#f3c1a8" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <circle cx="105" cy="-100" r="22" fill="#f3c1a8"/><path d="M95 -100 H115" stroke="#633e46" strokeWidth="5"/>
  </g>;
  if(action==='learn') return <g transform="translate(540 590)">
    <rect x="-145" y="-75" width="290" height="150" rx="18" fill="#e9e5d9"/>
    <path d="M-95 35 L-35 -20 L10 15 L85 -55" stroke="#729b83" strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M60 -55 H85 V-30" stroke="#729b83" strokeWidth="10" fill="none"/>
  </g>;
  if(action==='growth'||action==='final') return <g transform="translate(540 585)">
    {[0,1,2,3].map((n)=><g key={n} transform={`translate(${(n-1.5)*65} 0)`}>
      <rect x="-20" y={-20-n*25} width="40" height={20+n*25} rx="7" fill={accent} opacity=".9"/>
    </g>)}
    <path d="M-170 75 H170" stroke="#f4f1e7" strokeWidth="5" opacity=".6"/>
  </g>;
  return <g transform="translate(540 600)">
    <circle r="95" fill={accent} opacity=".12"/>
    <circle r="60" fill="none" stroke={accent} strokeWidth="5" opacity=".75"/>
    <path d="M-25 0 L-5 22 L35 -28" stroke={accent} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </g>;
};

export const TunasKecil: React.FC = () => {
  const frame=useCurrentFrame();
  const sceneIndex=Math.min(scenes.length-1,Math.floor(frame/SCENE_LENGTH));
  const localFrame=frame-sceneIndex*SCENE_LENGTH;
  const scene=scenes[sceneIndex];
  const fade=interpolate(localFrame,[0,18,310,338],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const titleY=interpolate(localFrame,[0,30],[35,0],{extrapolateRight:'clamp'});
  const musicVolume=interpolate(frame,[0,60,2580,2700],[0,0.22,0.22,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const teamVisible=sceneIndex>=2;
  return <>
    <Audio src={staticFile('audio/music-bed.wav')} volume={musicVolume}/>
    <Audio src={staticFile('audio/soft-chime.wav')} from={0} volume={0.28}/>
    <Audio src={staticFile('audio/seedling.wav')} from={72} volume={0.28}/>
    <Audio src={staticFile('audio/whoosh.wav')} from={320} volume={0.2}/>
    <Audio src={staticFile('audio/soft-chime.wav')} from={675} volume={0.22}/>
    <Audio src={staticFile('audio/whoosh.wav')} from={996} volume={0.2}/>
    <Audio src={staticFile('audio/soft-impact.wav')} from={1352} volume={0.25}/>
    <Audio src={staticFile('audio/whoosh.wav')} from={1672} volume={0.2}/>
    <Audio src={staticFile('audio/seedling.wav')} from={1740} volume={0.2}/>
    <Audio src={staticFile('audio/soft-chime.wav')} from={2028} volume={0.23}/>
    <Audio src={staticFile('audio/whoosh.wav')} from={2348} volume={0.18}/>
    <Audio src={staticFile('audio/soft-chime.wav')} from={2610} volume={0.28}/>
    <AbsoluteFill style={{background:`linear-gradient(155deg,${scene.tone},#0b2028)`,color:'#f8f4e9',fontFamily:'Arial,sans-serif',overflow:'hidden'}}>
      <AbsoluteFill style={{opacity:.13,backgroundImage:'radial-gradient(circle at 15% 20%,#fff 0 2px,transparent 3px),radial-gradient(circle at 80% 32%,#fff 0 1px,transparent 2px)',backgroundSize:'90px 90px,130px 130px'}}/>
      <div style={{position:'absolute',top:75,left:70,right:70,display:'flex',justifyContent:'space-between',fontSize:19,letterSpacing:5,opacity:.7}}>
        <span>IMPERAL • TUNAS KECIL</span><span>{String(sceneIndex+1).padStart(2,'0')} / 08</span>
      </div>
      <div style={{position:'absolute',top:175,left:70,right:70,opacity:fade,transform:`translateY(${titleY}px)`}}>
        <div style={{fontSize:18,letterSpacing:6,fontWeight:700,color:scene.accent,marginBottom:22}}>{scene.tag}</div>
        <div style={{fontSize:sceneIndex===7?65:62,lineHeight:1.08,fontWeight:800,whiteSpace:'pre-line',letterSpacing:-1.5}}>{scene.title}</div>
        <div style={{fontSize:25,lineHeight:1.4,color:'rgba(255,255,255,.78)',marginTop:20,maxWidth:900}}>{scene.sub}</div>
      </div>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position:'absolute',inset:0}}>
        <g opacity=".85"><path d="M0 950 Q250 870 540 940 T1080 920 V1920 H0Z" fill="#0d292a" opacity=".5"/></g>
        <g transform="translate(280 480) scale(.92)"><Plant frame={frame}/></g>
        <SceneProp action={scene.action} frame={frame} accent={scene.accent}/>
        <Team frame={frame} visible={teamVisible}/>
      </svg>
      <div style={{position:'absolute',bottom:75,left:70,right:70}}>
        <div style={{height:4,background:'rgba(255,255,255,.18)',borderRadius:8}}>
          <div style={{height:4,width:`${(frame/2699)*100}%`,background:scene.accent,borderRadius:8}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:15,fontSize:15,letterSpacing:3,opacity:.65}}>
          <span>GROW TOGETHER</span><span>90 SEC</span>
        </div>
      </div>
    </AbsoluteFill>
  </>;
};
