import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill,Easing,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {SAIFUL_SAGITA_SCENE_STARTS,SAIFUL_SAGITA_DURATION_FRAMES} from './generated/saiful-sagita-timing';
const scenes=[
{tag:'SEBUAH CERITA SEDERHANA',title:'SAIFUL & SAGITA',caption:'Kadang, pertemuan kecil menjadi awal cerita yang berarti.',sky:['#52677f','#e9a879','#26394b']},
{tag:'PERTEMUAN PERTAMA',title:'BUKUMU JATUH',caption:'“Eh, maaf! Itu bukuku.” • “Oh, ini? Nih, punya kamu.”',sky:['#7c9aab','#f1c28f','#526b63']},
{tag:'HARI-HARI YANG MENYENANGKAN',title:'SEMAKIN DEKAT',caption:'“Ngobrol sama kamu bikin hariku lebih menyenangkan.”',sky:['#7397a2','#f4c995','#45645a']},
{tag:'ADA YANG DIKHAWATIRKAN',title:'TAKUT MENJADI ASING',caption:'“Aku takut suatu hari nanti kita jadi asing.”',sky:['#596c83','#e6a77d','#354858']},
{tag:'SEBUAH KEJUJURAN',title:'KAMU BERARTI',caption:'“Kamu jadi seseorang yang sangat berarti buatku.”',sky:['#68748f','#efad83','#39415d']},
{tag:'PERASAAN YANG SAMA',title:'AKU JUGA',caption:'“Sebenarnya aku juga merasakan hal yang sama.”',sky:['#7a6682','#f2ad86','#4c4059']},
{tag:'AKHIR YANG HANGAT',title:'SAMPAI KITA BERTEMU LAGI',caption:'Terima kasih sudah hadir dalam ceritaku.',sky:['#8a6173','#f6b27f','#4b374d']}
];
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const Person:React.FC<{x:number;girl:boolean;frame:number;hug:boolean;name:string}>=({x,girl,frame,hug,name})=>{
 const bob=Math.sin(frame/18+(girl?1:0))*3,skin='#d6a17f',hair=girl?'#342b32':'#302c2b',shirt=girl?'#d88b9b':'#789bb7';
 return <g transform={'translate('+x+' 790) translate(0 '+bob+')'}>
 <ellipse cy="4" rx="72" ry="15" fill="#172a35" opacity=".22"/><path d="M-47 -155 Q0 -178 47 -155 L65 -12 L-65 -12Z" fill={shirt} stroke="#263b48" strokeWidth="5"/>
 <path d="M-34 -12 L-39 0 L-44 105 M34 -12 L39 0 L44 105" stroke="#303747" strokeWidth="24" strokeLinecap="round"/>
 <path d="M-40 -145 Q-78 -118 -65 -88" fill="none" stroke={skin} strokeWidth="19" strokeLinecap="round"/>
 <path d={hug?'M40 -145 Q95 -150 110 -105':'M40 -145 Q65 -120 65 -90'} fill="none" stroke={skin} strokeWidth="19" strokeLinecap="round"/>
 <circle cy="-198" r="48" fill={skin}/>
 {girl?<path d="M-49 -204 Q-54 -264 2 -258 Q55 -255 51 -201 L57 -130 Q40 -140 42 -193 Q4 -166 -43 -194 L-45 -132Z" fill={hair}/>:<path d="M-49 -207 Q-42 -262 8 -254 Q50 -249 48 -210 Q15 -231 -49 -207Z" fill={hair}/>}
 <circle cx="-16" cy="-197" r="4" fill="#2c3038"/><circle cx="16" cy="-197" r="4" fill="#2c3038"/><path d="M-9 -174 Q0 -167 9 -174" stroke="#965b58" strokeWidth="3" fill="none"/>
 <rect x="-48" y="118" width="96" height="27" rx="13" fill="#233947" opacity=".9"/><text x="0" y="137" fontSize="17" textAnchor="middle" fill="#fff" fontWeight="700">{name}</text></g>;
};
const Tree:React.FC<{x:number;y:number;scale:number;wind:number}>=({x,y,scale,wind})=><g transform={'translate('+x+' '+y+') scale('+scale+')'}>
 <path d="M0 0 Q-15 -125 4 -260 Q18 -320 0 -365" stroke="#5b4638" strokeWidth="38" fill="none" strokeLinecap="round"/>
 <path d={'M0 -230 Q'+(-75+wind)+' -290 -120 -330 M0 -270 Q'+(80+wind)+' -320 130 -370'} stroke="#5b4638" strokeWidth="19" fill="none" strokeLinecap="round"/>
 {[[0,-390,120],[-100,-350,95],[105,-385,100],[-5,-300,115]].map(([cx,cy,r],i)=><circle key={i} cx={cx} cy={cy} r={r} fill={i%2?'#527b62':'#668d6a'} stroke="#3e6653" strokeWidth="5"/>)}</g>;
export const SaifulSagita:React.FC=()=>{
 const frame=useCurrentFrame(),idx=Math.min(6,Math.max(0,SAIFUL_SAGITA_SCENE_STARTS.reduce<number>((a,s,i)=>frame>=s?i:a,0))),local=frame-SAIFUL_SAGITA_SCENE_STARTS[idx],scene=scenes[idx];
 const fade=interpolate(local,[0,24],[0,1],{...clamp,easing:Easing.out(Easing.quad)}),rise=interpolate(local,[0,30],[32,0],{...clamp,easing:Easing.out(Easing.cubic)});
 const sunset=idx/6,hug=idx===6?interpolate(local,[0,70],[0,1],{...clamp,easing:Easing.out(Easing.cubic)}):0;
 const saifulX=interpolate(idx,[0,1,2,3,4,5,6],[770,790,770,780,800,800,920],clamp),sagitaX=interpolate(idx,[0,1,2,3,4,5,6],[1150,1120,1130,1110,1100,1090,1000],clamp);
 const music=interpolate(frame,[0,60,SAIFUL_SAGITA_DURATION_FRAMES-90,SAIFUL_SAGITA_DURATION_FRAMES],[0,.16,.17,0],clamp);
 const stars=Array.from({length:55},(_,i)=>({x:(i*173+53)%1920,y:(i*97+29)%570,r:i%7===0?2.5:1.3}));
 return <><Audio src={staticFile('audio/music-bed.wav')} volume={music}/><Audio src={staticFile('audio/saiful-sagita-narration.mp3')} volume={1}/><Audio src={staticFile('audio/soft-chime.wav')} from={SAIFUL_SAGITA_SCENE_STARTS[5]} volume={.08}/>
 <AbsoluteFill style={{background:'#182638',fontFamily:'Georgia,serif',color:'#fff7ed',overflow:'hidden'}}>
 <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{position:'absolute',inset:0}}>
 <defs><linearGradient id="romance-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={scene.sky[0]}/><stop offset="55%" stopColor={scene.sky[1]}/><stop offset="100%" stopColor={scene.sky[2]}/></linearGradient><radialGradient id="romance-sun"><stop stopColor="#fff1c5"/><stop offset="1" stopColor="#f3ad79" stopOpacity="0"/></radialGradient></defs>
 <rect width="1920" height="1080" fill="url(#romance-sky)"/><circle cx="1500" cy={270+sunset*150} r="250" fill="url(#romance-sun)" opacity=".95"/><circle cx="1500" cy={270+sunset*150} r="92" fill="#ffe0ad" opacity=".8"/>
 {stars.map((s,i)=><circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={idx>=5?0.65:0.16}/>)}
 <path d="M0 660 Q280 585 540 655 T1050 640 T1500 655 T1920 620 V1080 H0Z" fill="#334e4b"/><path d="M0 790 Q330 710 700 800 T1320 775 T1920 740 V1080 H0Z" fill="#263f3d"/><path d="M0 900 Q450 830 900 900 T1920 870 V1080 H0Z" fill="#1d3334"/>
 <Tree x={250} y={790} scale={1.12} wind={Math.sin(frame/50)*8}/><Tree x={1760} y={800} scale={.8} wind={Math.sin(frame/55)*6}/>
 <path d="M300 810 Q960 765 1630 815" stroke="#d6b58b" strokeWidth="5" opacity=".24" fill="none"/>
 <g opacity={idx>=2?0.72:0.25}><path d="M760 735 H1160" stroke="#d9b78e" strokeWidth="18" strokeLinecap="round"/><path d="M790 735 V850 M1130 735 V850" stroke="#6d5546" strokeWidth="16"/></g>
 <g transform={'translate(0 '+(-hug*6)+')'}><Person x={saifulX} girl={false} frame={frame} hug={idx===6} name="SAIFUL"/><Person x={sagitaX} girl={true} frame={frame} hug={idx===6} name="SAGITA"/>
 {idx===1&&<g transform="translate(1030 725) rotate(-12)"><rect x="-35" y="-48" width="70" height="94" rx="5" fill="#f3e5c7" stroke="#795d4b" strokeWidth="5"/><path d="M-20 -20 H20 M-20 -5 H18 M-20 10 H12" stroke="#b9a58b" strokeWidth="4"/></g>}
 {idx===6&&<g opacity={hug}><path d={'M'+(saifulX+45)+' 645 Q960 530 '+(sagitaX-45)+' 645'} stroke="#d6a17f" strokeWidth="28" fill="none" strokeLinecap="round"/><path d={'M'+(sagitaX-45)+' 660 Q960 760 '+(saifulX+45)+' 660'} stroke="#d6a17f" strokeWidth="25" fill="none" strokeLinecap="round"/></g>}</g>
 </svg>
 <div style={{position:'absolute',top:42,left:70,right:70,display:'flex',justifyContent:'space-between',fontFamily:'Arial,sans-serif',fontSize:17,letterSpacing:4,color:'#fff4e8',opacity:.8}}><span>SEBUAH FILM PENDEK</span><span>{String(idx+1).padStart(2,'0')} / 07</span></div>
 <div style={{position:'absolute',top:125,left:120,right:120,textAlign:'center',opacity:fade,transform:'translateY('+rise+'px)'}}>
 <div style={{fontFamily:'Arial,sans-serif',fontSize:21,letterSpacing:7,fontWeight:800,color:'#ffe1b8',marginBottom:20}}>{scene.tag}</div><div style={{fontSize:idx===0?78:64,lineHeight:1.12,fontWeight:700,textShadow:'0 5px 25px rgba(25,22,35,.24)',whiteSpace:'pre-line'}}>{scene.title}</div><div style={{fontFamily:'Arial,sans-serif',fontSize:25,lineHeight:1.45,margin:'24px auto 0',maxWidth:1420,color:'#fff7ed',textShadow:'0 2px 12px rgba(0,0,0,.35)'}}>{scene.caption}</div></div>
 {idx===6&&<div style={{position:'absolute',top:500,left:0,right:0,textAlign:'center',fontFamily:'Arial,sans-serif',fontSize:24,letterSpacing:5,color:'#fff0d8',opacity:interpolate(local,[80,125],[0,1],clamp)}}>MEREKA BERPELUKAN • SEBUAH AWAL YANG HANGAT</div>}
 <div style={{position:'absolute',bottom:35,left:70,right:70,fontFamily:'Arial,sans-serif'}}><div style={{height:5,borderRadius:8,background:'#ffffff35'}}><div style={{height:5,width:frame/(SAIFUL_SAGITA_DURATION_FRAMES-1)*100+'%',borderRadius:8,background:'#ffe0b5'}}/></div><div style={{display:'flex',justifyContent:'space-between',marginTop:12,fontSize:14,letterSpacing:3,color:'#f7e7d7'}}><span>SAIFUL & SAGITA</span><span>SAMPAI KITA BERTEMU LAGI</span></div></div>
 </AbsoluteFill></>;
};
