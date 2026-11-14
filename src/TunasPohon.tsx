import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {getEnvironmentAtFrame, getEnvironmentAudioVolume, getPrecipitationVelocity, validateEnvironmentTimeline, type EnvironmentTimeline} from './environment/scene-environment';

const FPS = 30;
const DURATION = 90 * FPS;
const SCENE_FRAMES = 450;

const ENVIRONMENT_TIMELINE: EnvironmentTimeline = {
  durationInFrames: DURATION,
  cues: [
    {id: 'morning-before-rain', startFrame: 0, endFrame: 35,
      state: {weather: 'partly-cloudy', cloudCoverage: 0.28, sunlight: 0.62, windX: 0.08}},
    {id: 'clouds-gather', startFrame: 35, endFrame: 90,
      state: {weather: 'overcast', cloudCoverage: 0.92, sunlight: 0.12, windX: 0.18}},
    {id: 'rain-wets-soil', startFrame: 90, endFrame: 330,
      state: {weather: 'rain', cloudCoverage: 0.96, sunlight: 0.08, windX: 0.32,
        precipitation: {kind: 'rain', gravityPxPerFrame: 17, windDriftPxPerFrame: 3}},
      audioCues: [{id: 'rain-ambience', src: 'audio/rain-bed.wav', startFrame: 90, endFrame: 330,
        volume: 0.34, fadeInFrames: 24, fadeOutFrames: 45}]},
    {id: 'rain-clears', startFrame: 330, endFrame: 450,
      state: {weather: 'partly-cloudy', cloudCoverage: 0.48, sunlight: 0.48, windX: 0.12}},
    {id: 'growing-daylight', startFrame: 450, endFrame: DURATION,
      state: {weather: 'partly-cloudy', cloudCoverage: 0.24, sunlight: 0.78, windX: 0.04}},
  ],
};
validateEnvironmentTimeline(ENVIRONMENT_TIMELINE);

const scenes = [
  {tag: 'AWAL KEHIDUPAN', title: 'Semuanya bermula\ndari sebuah biji.', subtitle: 'Hujan membasahi tanah; air meresap menuju biji.'},
  {tag: 'PERKECAMBAHAN', title: 'Akar tumbuh ke bawah.\nTunas mencari cahaya.', subtitle: 'Biji menyerap kelembapan, lalu akar pertama muncul.'},
  {tag: 'KECAMBAHAN', title: 'Dua daun pertama\nmenyambut matahari.', subtitle: 'Daun sejati mulai berkembang dan membuat makanan melalui fotosintesis.'},
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
  const shootProgress = interpolate(g, [0.08, 0.28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const height = 10 + shootProgress * (90 + g * 400);
  const trunkWidth = 4 + g * 42;
  const trunkOpacity = interpolate(g, [0.06, 0.16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crownScale = interpolate(g, [0.18, 1], [0.18, 0.84], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sway = Math.sin(frame / 48) * (0.5 + g * 1.5);
  const branchOpacity = interpolate(g, [0.24, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crownOpacity = interpolate(g, [0.3, 0.62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g transform="translate(540 1280)">
      <Roots growth={g}/>
      <g opacity={trunkOpacity}>
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
  // Weather is driven by the shared, validated environment timeline.
  const environmentCue = getEnvironmentAtFrame(ENVIRONMENT_TIMELINE, frame);
  const environment = environmentCue?.state;
  const rain = environment?.precipitation?.kind === 'rain'
    ? interpolate(frame, [90, 110, 310, 330], [0, 0.9, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;
  const precipitationVelocity = environment?.precipitation
    ? getPrecipitationVelocity(environment)
    : {x: 0, y: 0};
  const cloudCoverage = environment?.cloudCoverage ?? 0.25;
  const sunlight = environment?.sunlight ?? 0.7;
  const cloudDarkness = interpolate(cloudCoverage, [0.25, 0.95], [0.08, 0.72], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const soilMoisture = interpolate(frame, [80, 230, 430, 700], [0, 0.92, 0.78, 0.38], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sunGlow = sunlight * interpolate(progress, [0.05, 0.8], [0.25, 0.78], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const musicVolume = interpolate(frame, [0, 80, 2300, 2699], [0.045, 0.07, 0.075, 0.05], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <>
      <Audio src={staticFile('audio/music-bed.wav')} volume={musicVolume}/>
      <Audio src={staticFile('audio/rain-bed.wav')} from={90} durationInFrames={240} volume={(audioFrame) => {
        const cue = ENVIRONMENT_TIMELINE.cues[2].audioCues![0];
        return getEnvironmentAudioVolume(cue, audioFrame + 90);
      }}/>
      <Audio src={staticFile('audio/soft-chime.wav')} from={0} volume={0.1}/>
      <Audio src={staticFile('audio/seedling.wav')} from={360} volume={0.13}/>
      <Audio src={staticFile('audio/soft-chime.wav')} from={2200} volume={0.14}/>
      <Audio src={staticFile('audio/tunas-pohon-narration.mp3')} volume={1}/>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#b9d8e4 0%,#e2e8d4 42%,#c5d3a7 100%)', color: '#21352a', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 76% 28%, rgba(255,237,177,${sunGlow}) 0%, transparent 34%), linear-gradient(180deg, rgba(24,35,49,${cloudDarkness}) 0%, rgba(24,35,49,${cloudDarkness * 0.52}) 48%, transparent 78%)`}}/>
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
          <g opacity={interpolate(cloudCoverage, [0.15, 0.9], [0.32, 0.98], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
            transform={`translate(${-((frame * (0.32 + (environment?.windX ?? 0) * 0.8)) % 420)} 0)`}>
            <path d="M-80 430 C70 360 170 385 255 430 C320 350 455 355 510 420 C590 340 720 360 790 415 C875 355 1010 370 1150 430 L1150 535 L-80 535Z"
              fill={cloudCoverage > 0.65 ? '#53616b' : '#fff'} opacity="0.72"/>
            <path d="M-80 510 C70 455 170 470 255 510 C320 435 455 440 510 500 C590 425 720 445 790 495 C875 435 1010 450 1150 510 L1150 555 L-80 555Z"
              fill={cloudCoverage > 0.65 ? '#394957' : '#fff'} opacity="0.58"/>
          </g>
          <circle cx="840" cy="600" r="155" fill="#fff0b9" opacity={sunGlow * (1 - cloudCoverage * 0.82)}/>
          <path d="M0 1280 Q250 1250 520 1280 T1080 1265 V1920 H0Z" fill="url(#soil)"/>
          <path d="M0 1270 Q250 1240 520 1270 T1080 1255 L1080 1310 Q760 1330 540 1310 Q250 1335 0 1310Z" fill="url(#grass)"/>
          <g opacity="0.32" fill="#d5b18a">
            {Array.from({length: 44}, (_, i) => <circle key={i} cx={(i * 83) % 1080} cy={1350 + ((i * 47) % 520)} r={2 + (i % 4)} />)}
          </g>
          <g opacity={interpolate(progress, [0.01, 0.13], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            <ellipse cx="540" cy="1288" rx="23" ry="15" fill="#9b6941" stroke="#68452f" strokeWidth="4"/>
            <path d="M529 1286 Q540 1276 552 1287" fill="none" stroke="#d3a36b" strokeWidth="3" strokeLinecap="round"/>
          </g>
          <g opacity={soilMoisture * 0.55}>
            <ellipse cx="540" cy="1300" rx="180" ry="92" fill="#4c9fc0" opacity="0.3"/>
            <path d="M360 1278 Q420 1318 470 1295 T575 1300 T720 1280" fill="none" stroke="#76c5df" strokeWidth="7" strokeLinecap="round" strokeDasharray="13 16" strokeDashoffset={-frame * 1.2}/>
            <path d="M425 1360 Q465 1325 500 1310 Q520 1300 540 1298 M655 1360 Q620 1320 580 1310 Q560 1302 540 1298" fill="none" stroke="#70b8d1" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 13" strokeDashoffset={frame * 0.9}/>
            <circle cx={500 + Math.sin(frame / 13) * 13} cy={1302 + Math.cos(frame / 17) * 8} r="5" fill="#a8e5f3"/>
            <circle cx={580 + Math.cos(frame / 15) * 11} cy={1312 + Math.sin(frame / 19) * 7} r="4" fill="#a8e5f3"/>
          </g>
          <GrowingTree growth={progress} frame={frame}/>
          <g opacity={rain} stroke="#e2f2f6" strokeWidth="4" strokeLinecap="round">
            {Array.from({length: 58}, (_, i) => {
              const baseX = (i * 97 + frame * precipitationVelocity.x) % 1160;
              const x = baseX < 0 ? baseX + 1160 : baseX;
              const y = 520 + ((i * 53 + frame * precipitationVelocity.y) % 720);
              return <path key={i} d={`M${x} ${y} l${precipitationVelocity.x * 2.4} ${precipitationVelocity.y * 4.6}`} opacity={0.35 + (i % 5) * 0.1}/>;
            })}
          </g>
          <g opacity={rain * 0.65} fill="none" stroke="#9bd7e7" strokeWidth="3">
            {Array.from({length: 9}, (_, i) => {
              const x = 95 + i * 112;
              const phase = (frame * 2.4 + i * 31) % 90;
              return <path key={i} d={`M${x - phase * 0.16} 1278 q12 -8 24 0`} opacity={Math.max(0, 1 - phase / 90)}/>;
            })}
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
