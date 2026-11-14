import React from 'react';
import {useCurrentFrame} from 'remotion';
import {getLoopAngle,getOscillation} from '../motion/animation';
export type CelestialBodyKind='earth'|'gas'|'ice'|'rock'|'sun';
export type CelestialBodyProps={id:string;kind:CelestialBodyKind;size?:number;rotationPeriodFrames?:number;rotationDirection?:1|-1;atmosphere?:boolean;rings?:boolean};
const continents=['M-145 -92 C-125 -145 -66 -150 -40 -113 L-56 -78 -28 -52 -49 -12 -89 -22 -104 19 -140 3 -155 -40Z','M-60 26 L-18 40 5 88 -15 145 -47 119 -63 72Z','M28 -130 L82 -148 137 -118 128 -74 91 -62 72 -24 39 -41 12 -84Z','M60 2 L111 -16 143 20 127 73 91 108 55 78 42 37Z'];
const bands=['M-220 -115 Q-80 -145 220 -105','M-220 -62 Q-40 -28 220 -70','M-220 2 Q-35 34 220 -2','M-220 68 Q-50 35 220 85','M-220 125 Q-40 155 220 116'];
export const CelestialBody:React.FC<CelestialBodyProps>=({id,kind,size=420,rotationPeriodFrames=240,rotationDirection=1,atmosphere=true,rings=false})=>{
 const frame=useCurrentFrame();const uid='body-'+id.replace(/[^a-zA-Z0-9_-]/g,'-');const angle=getLoopAngle(frame,rotationPeriodFrames)*rotationDirection;const drift=getLoopAngle(frame,rotationPeriodFrames*.72);const glow=.42+getOscillation(frame,96,.08);
 const base=kind==='earth'?'#1766a8':kind==='gas'?'#c88d52':kind==='ice'?'#64b7c8':kind==='rock'?'#9b7460':'#ff9d28';
 const highlight=kind==='earth'?'#4ca4dc':kind==='sun'?'#fff4a8':kind==='gas'?'#f3d39a':kind==='ice'?'#c2f2f3':'#d2aa8c';
 return <svg width={size} height={size} viewBox="0 0 400 400" role="img" aria-label={kind+' celestial body'} style={{overflow:'visible'}}>
 <defs><clipPath id={uid}><circle cx="200" cy="200" r="150"/></clipPath><radialGradient id={uid+'-surface'} cx="32%" cy="27%" r="78%"><stop offset="0%" stopColor={highlight}/><stop offset="58%" stopColor={base}/><stop offset="100%" stopColor="#071323"/></radialGradient><radialGradient id={uid+'-shade'} cx="28%" cy="24%" r="65%"><stop offset="0%" stopColor="#fff" stopOpacity=".42"/><stop offset="48%" stopColor="#fff" stopOpacity=".08"/><stop offset="100%" stopColor="#020617" stopOpacity=".5"/></radialGradient><filter id={uid+'-blur'}><feGaussianBlur stdDeviation="10"/></filter></defs>
 {rings&&<ellipse cx="200" cy="214" rx="190" ry="58" fill="none" stroke="#d8c49b" strokeWidth="23" opacity=".72" transform="rotate(-17 200 200)"/>}
 {atmosphere&&<circle cx="200" cy="200" r="163" fill="none" stroke={kind==='sun'?'#ffb34f':'#7dd3fc'} strokeWidth="13" opacity={glow} filter={'url(#'+uid+'-blur)'}/>}
 <circle cx="200" cy="200" r="150" fill={'url(#'+uid+'-surface)'}/>
 <g clipPath={'url(#'+uid+')'}><g transform={'rotate('+angle+' 200 200)'}>
 {kind==='earth'&&continents.map((d,i)=><path key={i} d={d} transform="translate(200 200)" fill={i%2?'#6eaa62':'#87b96d'} stroke="#c4df9c" strokeWidth="3"/>)}
 {(kind==='gas'||kind==='ice')&&bands.map((d,i)=><path key={i} d={d} transform="translate(200 200)" fill="none" stroke={kind==='gas'?(i%2?'#8b543d':'#f5d9a6'):(i%2?'#2c849b':'#d5fbff')} strokeWidth={i===2?27:16} opacity=".58"/>)}
 {kind==='rock'&&Array.from({length:17},(_,i)=><ellipse key={i} cx={200+Math.sin(i*12.2)*108} cy={200+Math.cos(i*8.4)*120} rx={5+i%4*3} ry={3+i%3*2} fill="#f1d2ae" opacity=".2"/>)}
 {kind==='sun'&&Array.from({length:28},(_,i)=><path key={i} d={'M'+(200+Math.cos(i*2.4)*30)+' '+(200+Math.sin(i*2.4)*30)+' Q'+(200+Math.cos(i*2.4)*82)+' '+(200+Math.sin(i*2.4)*82)+' '+(200+Math.cos(i*2.4)*145)+' '+(200+Math.sin(i*2.4)*145)} fill="none" stroke="#fff0a1" strokeWidth="3" opacity=".24"/>)}
 {kind==='earth'&&<g transform={'rotate('+drift+' 200 200)'}><path d="M68 135 Q103 108 137 128 T204 130 Q239 116 270 140 M95 255 Q133 226 167 246 T238 250 Q268 238 294 256" fill="none" stroke="#fff" strokeWidth="13" strokeLinecap="round" opacity=".5"/></g>}
 </g><circle cx="200" cy="200" r="150" fill={'url(#'+uid+'-shade)'}/><path d="M80 110 Q125 62 176 75" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".13"/></g>
 {rings&&<ellipse cx="200" cy="214" rx="190" ry="58" fill="none" stroke="#e9d9b4" strokeWidth="16" strokeDasharray="190 520" strokeDashoffset="-95" transform="rotate(-17 200 200)"/>}
 </svg>;
};
