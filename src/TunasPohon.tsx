import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';

const FPS = 30;
const DURATION = 90 * FPS;
const SCENE_FRAMES = 450;

const scenes = [
  {tag: 'AWAL KEHIDUPAN', title: 'Semuanya bermula\ndari sebuah biji.', subtitle: 'Kecil, tenang, dan menyimpan kemungkinan.'},
  {tag: 'PERKECAMBAHAN', title: 'Akar tumbuh ke bawah.\nTunas mencari cahaya.', subtitle: 'Air mengaktifkan embrio di dalam biji.'},
  {tag: 'KECambahAN', title: 'Dua daun pertama\nmenyambut matahari.', subtitle: 'Daun sejati mulai berkembang dan membuat makanan melalui fotosintesis.'},
  {tag: 'POHON MUDA', title: 'Batang menguat.\nAkar menyebar.', subtitle: 'Sedikit demi sedikit, tanaman membangun bentuk pohonnya.'},
  {tag: 'BERTUMBUH', title: 'Cabang terbuka.\nRimbun mulai terbentuk.', subtitle: 'Tahun demi tahun, batang menebal dan tajuk semakin luas.'},
  {tag: 'POHON DEWASA', title: 'Dari tunas kecil,\nmenjadi pohon dewasa.', subtitle: 'Kini ia tumbuh kokoh, memberi naungan dan menjadi bagian dari kehidupan.'},
];

const leaf = 'M0 0 C-19 -11 -22 -38 0 -54 C22 -38 19 -11 0 0Z';

const Leaf: React.FC<{x: number; y: number; scale?: number; rotate?: number; color?: string}> = ({
  x, y, scale = 1, rotate = 0, color = '#4f8b4c',
}) => (
  <path d={leaf} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
    fill={color} stroke="#28543a" strokeWidth="2" />
);

const Roots: React.FC<{growth: number}> = ({growth}) => {
  const opacity = interpolate(growth, [0.02, 0.22], [0.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rootWidth = 2 + growth * 7;
  return (
    <g opacity={opacity} fill="none" stroke="#b88b60" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M0 0 C-10 55 -40 95 -100 ${115 + growth * 100} C-145 ${135 + growth * 105} -180 ${145 + growth * 115} -220 ${155 + growth * 125}`} strokeWidth={rootWidth}/>
      <path d={`M0 0 C12 55 48 100 110 ${125 + growth * 95} C155 ${145 + growth * 105} 190 ${150 + growth * 120} 235 ${165 + growth * 130}`} strokeWidth={rootWidth}/>
      <path d={`M-45 90 C-65 130 -70 160 -95 ${190 + growth * 90} M-112 145 C-130 175 -150 188 -172 ${205 + growth * 70} M65 105 C78 145 92 170 118 ${205 + growth * 75} M130 150 C155 178 168 190 194 ${218 + growth * 65}`} strokeWidth={Math.max(2, rootWidth * 0.62)}/>
      <path d={`M-100 ${125 + growth * 100} C-115 ${150 + growth * 100} -122 ${170 + growth * 100} -145 ${185 + growth * 100} M110 ${135 + growth * 95} C125 ${160 + growth * 95} 140 ${175 + growth * 95} 165 ${190 + growth * 95}`} strokeWidth={2.4}/>
    </g>
  );
};

const GrowingTree: React.FC<{growth: number; frame: number}> = ({growth, frame}) => {
  const g = Math.max(0.015, Math.min(1, growth));
  const height = 85 + g * 600;
  const trunkWidth = 4 + g * 42;
  const crownScale = interpolate(g, [0.18, 1], [0.18, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sway = Math.sin(frame / 48) * (0.5 + g * 1.5);
  const branchOpacity = interpolate(g, [0.24, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crownOpacity = interpolate(g, [0.3, 0.62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g transform="translate(540 1280)">
      <Roots growth={g}/>
      <path d={`M-${trunkWidth * 0.55} 0 C-${trunkWidth * 0.9} -${height * 0.28} -${trunkWidth * 0.35} -${height * 0.68} -${trunkWidth * 0.18} -${height} Q0 -${height + 26 * g} ${trunkWidth * 0.2} -${height} C${trunkWidth * 0.32} -${height * 0.62} ${trunkWidth * 0.82} -${height * 0.25} ${trunkWidth * 0.58} 0Z`}
        fill="#81583d" stroke="#4c382d" strokeWidth="4"/>
      <path d={`M0 -${height * 0.12} Q-${height * 0.04} -${height * 0.45} -${height * 0.34} -${height * 0.67} M0 -${height * 0.22} Q${height * 0.04} -${height * 0.5} ${height * 0.34} -${height * 0.72} M-2 -${height * 0.55} Q-${height * 0.12} -${height * 0.7} -${height * 0.2} -${height * 0.83} M5 -${height * 0.62} Q${height * 0.14} -${height * 0.77} ${height * 0.23} -${height * 0.88}`}
        fill="none" stroke="#765039" strokeWidth={Math.max(2, trunkWidth * 0.34)} strokeLinecap="round" opacity={branchOpacity}/>
      <g transform={`translate(0 -${height}) rotate(${sway}) scale(${crownScale})`} opacity={crownOpacity}>
        <path d="M-250 10 C-310 -45 -270 -145 -190 -150 C-210 -240 -115 -300 -40 -250 C5 -335 120 -300 130 -220 C225 -255 300 -170 255 -90 C330 -25 270 70 190 60 C140 145 45 130 0 80 C-75 145 -180 105 -180 35 C-220 48 -245 35 -250 10Z"
          fill="#376f47" stroke="#244f39" strokeWidth="13" strokeLinejoin="round"/>
        <path d="M-220 -55 C-190 -150 -95 -205 -25 -145 C35 -240 140 -205 155 -125 C240 -150 270 -65 220 -10 C245 55 150 95 90 48 C25 110 -60 70 -75 15 C-145 75 -225 25 -220 -55Z"
          fill="#4f8b50" opacity="0.94"/>
        <path d="M-185 -105 C-145 -190 -70 -180 -28 -132 M-35 -195 C20 -245 80 -218 100 -168 M115 -166 C185 -190 230 -130 210 -78 M-200 -10 C-160 38 -105 38 -72 5 M-65 22 C-20 70 38 67 70 30 M92 38 C140 65 190 42 205 10"
          fill="none" stroke="#8fba69" strokeWidth="30" strokeLinecap="round" opacity="0.55"/>
        <g>
          <Leaf x={-175} y={-115} scale={1.1} rotate={-55} color="#78a95d"/>
          <Leaf x={-110} y={-205} scale={1.0} rotate={-24} color="#91bd6d"/>
          <Leaf x={-35} y={-180} scale={1.15} rotate={22} color="#78a95d"/>
          <Leaf x={45} y={-225} scale={1.05} rotate={-10} color="#a0c878"/>
          <Leaf x={120} y={-180} scale={1.12} rotate={35} color="#6f9f54"/>
          <Leaf x={195} y={-110} scale={1.0} rotate={48} color="#8bb969"/>
          <Leaf x={-215} y={-20} scale={0.9} rotate={-60} color="#699d52"/>
          <Leaf x={-130} y={45} scale={1.05} rotate={-42} color="#8dbb69"/>
          <Leaf x={-30} y={48} scale={1.0} rotate={-18} color="#6f9f54"/>
          <Leaf x={75} y={48} scale={1.05} rotate={18} color="#9ac575"/>
          <Leaf x={165} y={35} scale={0.95} rotate={45} color="#6f9f54"/>
        </g>
      </g>
    </g>
  );
};

export const TunasPohon: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 180, 420, 720, 1080, 1500, 1980, 2699], [0.01, 0.06, 0.16, 0.29, 0.46, 0.65, 0.86, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sceneIndex = Math.min(5, Math.floor(frame / SCENE_FRAMES));
  const localFrame = frame - sceneIndex * SCENE_FRAMES;
  const scene = scenes[sceneIndex];
  const sceneOpacity = interpolate(localFrame, [0, 20, SCENE_FRAMES - 22, SCENE_FRAMES], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rain = sceneIndex === 3 ? interpolate(localFrame, [0, 35, 330, 449], [0, 0.8, 0.8, 0], {extrapolateRight: 'clamp'}) : 0;
  const sunGlow = interpolate(progress, [0.05, 0.8], [0.1, 0.65], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const musicVolume = interpolate(frame, [0, 80, 2300, 2699], [0.045, 0.07, 0.075, 0.05], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <>
      <Audio src={staticFile('audio/music-bed.wav')} volume={musicVolume}/>
      <Audio src={staticFile('audio/soft-chime.wav')} from={0} volume={0.1}/>
      <Audio src={staticFile('audio/seedling.wav')} from={360} volume={0.13}/>
      <Audio src={staticFile('audio/rain.wav')} from={1250} volume={rain * 0.18}/>
      <Audio src={staticFile('audio/soft-chime.wav')} from={2200} volume={0.14}/>
      <Audio src={staticFile('audio/tunas-pohon-narration.mp3')} volume={1}/>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#b9d8e4 0%,#e2e8d4 42%,#c5d3a7 100%)', color: '#21352a', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 76% 28%, rgba(255,237,177,${sunGlow}) 0%, transparent 34%)`}}/>
        <div style={{position: 'absolute', top: 70, left: 65, right: 65, display: 'flex', justifyContent: 'space-between', fontSize: 16, letterSpacing: 3, color: '#385448', fontWeight: 700}}>
          <span>IMPERAL MOTION STUDIO</span><span>{String(sceneIndex + 1).padStart(2, '0')} / 06</span>
        </div>
        <div style={{position: 'absolute', top: 185, left: 72, right: 72, zIndex: 5, opacity: sceneOpacity, transform: `translateY(${interpolate(localFrame, [0, 24], [18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`}}>
          <div style={{fontSize: 18, fontWeight: 800, letterSpacing: 4, color: '#537c50', marginBottom: 22}}>{scene.tag}</div>
          <div style={{fontSize: 57, lineHeight: 1.12, fontWeight: 900, letterSpacing: -1.8, whiteSpace: 'pre-line', color: '#203b2d'}}>{scene.title}</div>
          <div style={{fontSize: 23, lineHeight: 1.45, marginTop: 22, maxWidth: 850, color: '#435c4a'}}>{scene.subtitle}</div>
        </div>
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#926b4c"/><stop offset="100%" stopColor="#503c31"/></linearGradient>
            <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#83a96b"/><stop offset="100%" stopColor="#476c49"/></linearGradient>
          </defs>
          <g opacity="0.55">
            <path d="M-80 430 C70 360 170 385 255 430 C320 350 455 355 510 420 C590 340 720 360 790 415 C875 355 1010 370 1150 430" fill="#fff" opacity="0.62"/>
            <path d="M-80 510 C70 455 170 470 255 510 C320 435 455 440 510 500 C590 425 720 445 790 495 C875 435 1010 450 1150 510" fill="#fff" opacity="0.45"/>
          </g>
          <circle cx="840" cy="600" r="155" fill="#fff0b9" opacity={0.22 + sunGlow * 0.28}/>
          <path d="M0 1280 Q250 1250 520 1280 T1080 1265 V1920 H0Z" fill="url(#soil)"/>
          <path d="M0 1270 Q250 1240 520 1270 T1080 1255 L1080 1310 Q760 1330 540 1310 Q250 1335 0 1310Z" fill="url(#grass)"/>
          <g opacity="0.32" fill="#d5b18a">
            {Array.from({length: 44}, (_, i) => <circle key={i} cx={(i * 83) % 1080} cy={1350 + ((i * 47) % 520)} r={2 + (i % 4)} />)}
          </g>
          <GrowingTree growth={progress} frame={frame}/>
          <g opacity={rain} stroke="#e9f2f1" strokeWidth="4" strokeLinecap="round">
            {Array.from({length: 34}, (_, i) => <path key={i} d={`M${(i * 97) % 1080} ${550 + ((i * 53) % 580)} l-32 78`} opacity="0.55"/>)}
          </g>
          <g opacity={interpolate(progress, [0.18, 0.45], [0, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} stroke="#d5e5a8" strokeWidth="5" strokeLinecap="round">
            <path d="M120 1270 l-10 -40 M155 1270 l8 -54 M930 1265 l-4 -42 M975 1265 l14 -52"/>
          </g>
        </svg>
        <div style={{position: 'absolute', bottom: 76, left: 72, right: 72}}>
          <div style={{height: 5, borderRadius: 8, background: 'rgba(38,64,47,.18)'}}><div style={{height: 5, width: `${(frame / 2699) * 100}%`, borderRadius: 8, background: '#557c4e'}}/></div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 15, fontSize: 14, letterSpacing: 3, color: '#385448', fontWeight: 700}}><span>DARI BIJI MENJADI POHON</span><span>90 DETIK</span></div>
        </div>
      </AbsoluteFill>
    </>
  );
};
