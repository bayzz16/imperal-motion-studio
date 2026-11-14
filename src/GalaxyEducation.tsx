import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {GALAXY_SCENE_STARTS, GALAXY_DURATION_FRAMES} from './generated/galaxy-timing';
import {CelestialBody} from './visual/CelestialBody';

const scenes = [
 {tag:'PERJALANAN DIMULAI',title:'KITA TINGGAL DI MANA?',sub:'Sebuah perjalanan dari rumah kita… menuju galaksi tempat Tata Surya berada.',accent:'#7dd3fc'},
 {tag:'PUSAT TATA SURYA',title:'INI ADALAH MATAHARI',sub:'Matahari adalah bintang yang menjadi pusat Tata Surya. Cahayanya menopang kehidupan di Bumi.',accent:'#fbbf24'},
 {tag:'DELAPAN PLANET',title:'KENALI PARA TETANGGA',sub:'Urutannya dari Matahari: Merkurius, Venus, Bumi, Mars, Jupiter, Saturnus, Uranus, Neptunus.',accent:'#93c5fd'},
 {tag:'PLANET BATUAN',title:'EMPAT PLANET TERDALAM',sub:'Merkurius, Venus, Bumi, dan Mars memiliki permukaan padat. Mereka disebut planet kebumian.',accent:'#fb923c'},
 {tag:'PLANET RAKSASA',title:'EMPAT PLANET TERLUAR',sub:'Jupiter dan Saturnus adalah raksasa gas. Uranus dan Neptunus dikenal sebagai raksasa es.',accent:'#c4b5fd'},
 {tag:'PENJAGA ORBIT',title:'GRAVITASI MENJAGA TARIAN',sub:'Gravitasi Matahari membantu menjaga planet-planet tetap berada pada orbitnya.',accent:'#86efac'},
 {tag:'SKALA YANG LEBIH BESAR',title:'TATA SURYA BUKAN GALAKSI',sub:'Tata Surya hanyalah satu bagian kecil dari Galaksi Bima Sakti yang berisi sangat banyak bintang.',accent:'#f0abfc'},
 {tag:'RUMAH KOSMIK KITA',title:'KITA ADA DI BIMA SAKTI',sub:'Bima Sakti berbentuk galaksi spiral berbatang. Matahari berada di salah satu wilayah lengannya.',accent:'#67e8f9'},
] as const;
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const planetColors=['#a8a29e','#d6a56e','#4da6e8','#c76f4c','#d9a66f','#e8d7a6','#79c8cf','#4167b8'];
const planetNames=['Merkurius','Venus','Bumi','Mars','Jupiter','Saturnus','Uranus','Neptunus'];
const Planet:React.FC<{x:number;y:number;r:number;color:string;ring?:boolean}> = ({x,y,r,color,ring})=><g transform={`translate(${x} ${y})`}>
 {ring&&<ellipse rx={r*1.75} ry={r*.48} fill="none" stroke="#e8d7a6" strokeWidth={Math.max(4,r*.16)} transform="rotate(-18)"/>}
 <circle r={r} fill={color}/><path d={`M${-r*.75} ${-r*.2} Q0 ${-r*.7} ${r*.8} ${-r*.15} Q0 ${r*.5} ${-r*.75} ${r*.45}Z`} fill="#fff" opacity=".16"/>
 </g>;
const Galaxy:React.FC<{x:number;y:number;scale:number}> = ({x,y,scale})=><g transform={`translate(${x} ${y}) scale(${scale})`}>
 <ellipse rx="310" ry="105" fill="#7c3aed" opacity=".16" transform="rotate(-18)"/>
 {[0,1,2,3].map(i=><path key={i} d="M-20 0 C-190 -190 90 -230 250 -80 C390 50 90 170 -150 90 C-270 40 -220 -90 -90 -105" fill="none" stroke={i%2?'#93c5fd':'#d8b4fe'} strokeWidth={i===0?20:10} opacity={.3-i*.045} transform={`rotate(${i*90})`}/> )}
 <ellipse rx="72" ry="22" fill="#fff1b8" opacity=".9"/><circle r="12" fill="#fff"/>
 <circle cx="120" cy="-55" r="9" fill="#fbbf24"/><circle cx="120" cy="-55" r="20" fill="none" stroke="#fbbf24" opacity=".35"/>
 </g>;
const Panel:React.FC<{scene:number;frame:number;accent:string}> = ({scene,frame,accent})=>{
 const pop=interpolate(frame,[0,20],[.85,1],{...clamp,easing:Easing.out(Easing.back(1.2))});
 return <svg viewBox="0 0 1080 1040" width="100%" height="100%" style={{position:'absolute',inset:0}}>
 <defs><radialGradient id="space"><stop stopColor="#172b50"/><stop offset="1" stopColor="#050b1d"/></radialGradient><radialGradient id="sun"><stop stopColor="#fff7ad"/><stop offset=".55" stopColor="#ffbf38"/><stop offset="1" stopColor="#f97316"/></radialGradient></defs>
 <rect width="1080" height="1040" fill="url(#space)"/>
 {Array.from({length:85},(_,i)=><circle key={i} cx={(i*137+43)%1080} cy={(i*251+71)%1040} r={i%7===0?3:1.5} fill="#fff" opacity={.35+(i%5)*.12}/>)}
 {scene===0&&<g transform="translate(540 500) scale(1.1)"><circle r="185" fill="#4f46e5" opacity=".16"/><circle r="120" fill="#2f6fb2"/><path d="M-70 -55 Q-15 -110 55 -70 Q110 -5 35 35 Q-30 75 -80 20Z" fill="#3e9b68"/><path d="M-120 100 Q0 180 135 80" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round"/><text y="245" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="800">BUMI • RUMAH KITA</text></g>}
 {scene===1&&<g transform="translate(540 500)"><text y="270" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="800">BINTANG PUSAT TATA SURYA</text><text y="315" textAnchor="middle" fill={accent} fontSize="22">CAHAYA & ENERGI BAGI PLANET</text></g>}{scene===2&&<g transform="translate(540 470) scale(1.05)"><circle r="43" fill="url(#sun)"/>{planetNames.map((n,i)=>{const x=-370+i*105;return <g key={n}><Planet x={x} y={0} r={[10,15,17,13,32,27,23,22][i]} color={planetColors[i]} ring={i===5}/><text x={x} y="90" textAnchor="middle" fill="#fff" fontSize="18">{n}</text></g>})}<text y="200" textAnchor="middle" fill="#cbd5e1" fontSize="21">ILUSTRASI • UKURAN & JARAK TIDAK SEBENARNYA</text></g>}
 {scene===3&&<g transform="translate(540 460)">{[0,1,2,3].map((i)=><g key={i} transform={`translate(${(i-1.5)*235} 0)`}><circle r={[62,79,85,69][i]} fill={planetColors[i]}/><path d={`M-50 -10 Q0 -60 55 -5 Q0 35 -50 20Z`} fill="#fff" opacity=".15"/><text y="135" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700">{planetNames[i]}</text></g>)}<text y="230" textAnchor="middle" fill={accent} fontSize="25">PERMUKAAN PADAT</text></g>}
 {scene===4&&<g transform="translate(540 460)">{[0,1,2,3].map((i)=><g key={i} transform={`translate(${(i-1.5)*235} 0)`}><Planet x={0} y={0} r={[92,77,65,59][i]} color={planetColors[i+4]} ring={i===1}/><text y="135" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700">{planetNames[i+4]}</text></g>)}<text y="230" textAnchor="middle" fill={accent} fontSize="25">GAS & ES • BUKAN PERMUKAAN PADAT SEPERTI BUMI</text></g>}
 {scene===5&&<g transform="translate(540 500)"><circle r="105" fill="url(#sun)"/>{[160,245,330].map((r,i)=><ellipse key={r} rx={r} ry={r*.55} fill="none" stroke="#93c5fd" strokeWidth="3" opacity=".65" transform={`rotate(-18)`}/>)}<circle cx="160" cy="-45" r="16" fill="#4da6e8"/><circle cx="-245" cy="55" r="13" fill="#c76f4c"/><path d="M-80 -170 Q-10 -220 80 -170" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round"/><text y="270" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="800">ORBIT = JALUR GERAK PLANET</text></g>}
 {scene===6&&<g transform={`translate(540 500) scale(${pop})`}><Galaxy x={0} y={0} scale={1}/><rect x="-260" y="220" width="520" height="70" rx="22" fill="#111827" stroke={accent} strokeWidth="3"/><text y="265" textAnchor="middle" fill="#fff" fontSize="25" fontWeight="800">SATU GALAKSI • BANYAK BINTANG</text></g>}
 {scene===7&&<g transform="translate(540 485)"><Galaxy x={0} y={0} scale={1.1}/><path d="M120 -55 L260 -155" stroke="#fbbf24" strokeWidth="5" strokeDasharray="10 10"/><circle cx="120" cy="-55" r="19" fill="none" stroke="#fbbf24" strokeWidth="4"/><rect x="205" y="-230" width="260" height="75" rx="18" fill="#172554" stroke="#fbbf24" strokeWidth="3"/><text x="335" y="-182" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">LOKASI MATAHARI</text><text y="260" textAnchor="middle" fill="#fff" fontSize="26">KITA ADALAH BAGIAN DARI ALAM SEMESTA</text></g>}
 <text x="540" y="990" textAnchor="middle" fill="#cbd5e1" opacity=".7" fontSize="18" letterSpacing="4">BELAJAR ASTRONOMI • TATA SURYA & GALAKSI</text>
 </svg>;
};
export const GalaxyEducation:React.FC=()=>{
 const frame=useCurrentFrame();
 const idx=Math.min(GALAXY_SCENE_STARTS.length-1,Math.max(0,GALAXY_SCENE_STARTS.reduce<number>((a,s,i)=>frame>=s?i:a,0)));
 const local=frame-GALAXY_SCENE_STARTS[idx],s=scenes[idx];
 const fade=interpolate(local,[0,18],[0,1],clamp);
 const y=interpolate(local,[0,25],[24,0],{...clamp,easing:Easing.out(Easing.cubic)});
 const music=interpolate(frame,[0,45,GALAXY_DURATION_FRAMES-60,GALAXY_DURATION_FRAMES],[0,.16,.16,0],clamp);
 return <><Audio src={staticFile('audio/music-bed.wav')} volume={music}/><Audio src={staticFile('audio/galaxy-narration.mp3')} volume={1}/>
 <AbsoluteFill style={{background:'#050b1d',color:'#f8fafc',fontFamily:'Arial,sans-serif',overflow:'hidden'}}>
 <div style={{position:'absolute',top:58,left:52,right:52,display:'flex',justifyContent:'space-between',fontSize:16,letterSpacing:3,color:'#cbd5e1'}}><span>JELAJAHI ALAM SEMESTA</span><span>{String(idx+1).padStart(2,'0')} / 08</span></div>
 <div style={{position:'absolute',top:145,left:50,right:50,textAlign:'center',opacity:fade,transform:`translateY(${y}px)`}}><div style={{fontSize:17,letterSpacing:5,fontWeight:800,color:s.accent,marginBottom:18}}>{s.tag}</div><div style={{fontSize:idx===0?59:48,lineHeight:1.12,fontWeight:900}}>{s.title}</div><div style={{fontSize:23,lineHeight:1.4,color:'rgba(248,250,252,.82)',margin:'18px auto 0',maxWidth:930}}>{s.sub}</div></div>
 <div style={{position:'absolute',top:490,left:0,right:0,height:930}}><Panel scene={idx} frame={local} accent={s.accent}/></div>{idx===1&&<div style={{position:'absolute',top:760,left:0,right:0,display:'flex',justifyContent:'center',pointerEvents:'none'}}><CelestialBody id="galaxy-education-sun" kind="sun" size={350} rotationPeriodFrames={900} atmosphere /></div>}
 <div style={{position:'absolute',bottom:52,left:52,right:52}}><div style={{height:5,background:'rgba(255,255,255,.2)',borderRadius:5}}><div style={{height:5,width:`${frame/(GALAXY_DURATION_FRAMES-1)*100}%`,background:s.accent,borderRadius:5}}/></div><div style={{display:'flex',justifyContent:'space-between',marginTop:12,fontSize:13,letterSpacing:2,color:'#cbd5e1'}}><span>TATA SURYA KITA</span><span>ILUSTRASI TIDAK BERSKALA</span></div></div>
 </AbsoluteFill></>;
};
