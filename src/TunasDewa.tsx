import React from 'react';
import {Audio} from '@remotion/media';
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const FPS = 30;
const DURATION = 90 * FPS;
const SCENE_LENGTH = DURATION / 8;

const scenes = [
  {
    tag: 'SEBUAH AWAL',
    title: 'Semua yang besar\nbermula dari kecil.',
    subtitle: 'Sebuah benih. Sebuah harapan. Sebuah perjalanan yang belum diketahui ujungnya.',
    accent: '#b8d99b',
    sky: '#102a32',
    phase: 0,
  },
  {
    tag: 'LANGKAH PERTAMA',
    title: 'Keberanian membuatnya\nmulai bertumbuh.',
    subtitle: 'Ide sederhana berubah menjadi rencana, lalu menjadi langkah nyata.',
    accent: '#b9dfc2',
    sky: '#163b42',
    phase: 1,
  },
  {
    tag: 'DELAPAN KEAHLIAN',
    title: 'Berbeda kemampuan.\nSatu tujuan.',
    subtitle: 'Delapan kekuatan saling melengkapi, menyatukan gagasan menjadi karya.',
    accent: '#c6c1f2',
    sky: '#282b4a',
    phase: 2,
  },
  {
    tag: 'UJIAN PERJALANAN',
    title: 'Pertumbuhan tidak\nselalu mudah.',
    subtitle: 'Angin, hujan, dan kegagalan menguji seberapa kuat akar yang dibangun.',
    accent: '#e7b7a5',
    sky: '#382c3c',
    phase: 3,
  },
  {
    tag: 'BELAJAR DAN BANGKIT',
    title: 'Akar yang kuat\ntidak mudah menyerah.',
    subtitle: 'Mereka belajar, memperbaiki, dan mencoba lagi dengan cara yang lebih baik.',
    accent: '#c5e4a7',
    sky: '#263b36',
    phase: 4,
  },
  {
    tag: 'MENUJU KEBESARAN',
    title: 'Dari usaha kecil\nlahir kekuatan besar.',
    subtitle: 'Sedikit demi sedikit, tunas itu tumbuh melampaui batas awalnya.',
    accent: '#e4d59d',
    sky: '#263b4a',
    phase: 5,
  },
  {
    tag: 'TRANSFORMASI',
    title: 'Kini, ia tumbuh\nmenjadi sesuatu yang agung.',
    subtitle: 'Perjalanan panjang mengubah tunas kecil menjadi pohon yang menjulang.',
    accent: '#f0d58e',
    sky: '#342d4b',
    phase: 6,
  },
  {
    tag: 'SATU IMPIAN, SATU MASA DEPAN',
    title: 'Dari Tunas Kecil...\nmenuju TUNAS DEWA.',
    subtitle: 'Bertumbuh bersama. Melampaui batas. Menciptakan masa depan.',
    accent: '#ffe6a6',
    sky: '#172d35',
    phase: 7,
  },
];

const leafPoints = [
  [-255, -610, 1.05], [-175, -700, 0.9], [-75, -755, 1.0],
  [45, -770, 1.05], [160, -720, 0.95], [250, -630, 1.0],
  [-330, -535, 0.85], [-220, -545, 0.9], [-105, -590, 0.9],
  [15, -615, 0.95], [130, -570, 0.9], [255, -525, 0.9],
  [-285, -430, 0.9], [-165, -445, 0.95], [-35, -475, 0.9],
  [95, -455, 0.95], [215, -430, 0.9], [330, -440, 0.82],
  [-185, -330, 0.8], [-55, -350, 0.85], [80, -345, 0.85],
  [205, -320, 0.8], [0, -850, 0.82],
] as const;

const Tree: React.FC<{growth: number; frame: number; accent: string}> = ({
  growth,
  frame,
  accent,
}) => {
  const reveal = Math.max(0, Math.min(1, growth));
  const sway = Math.sin(frame / 38) * 1.8;
  const canopyOpacity = interpolate(reveal, [0.28, 0.72], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <g transform={`translate(540 1450)`}>
      <ellipse cx="0" cy="15" rx={180 + reveal * 250} ry="42" fill="#071c1d" opacity="0.48" />
      <g opacity={0.28 + reveal * 0.72}>
        <path d="M0 0 C-90 42 -145 62 -235 68 M0 0 C95 42 155 60 240 65 M0 0 C-35 50 -65 78 -105 110 M0 0 C40 52 75 82 115 112" fill="none" stroke="#b4c98d" strokeWidth={5 + reveal * 9} strokeLinecap="round" />
      </g>
      <g transform={`translate(0 0) scale(1 ${Math.max(0.035, reveal)})`}>
        <path d="M-42 0 C-25 -155 -45 -305 -12 -465 C-4 -520 8 -570 0 -650 C35 -550 50 -505 43 -425 C35 -270 68 -135 42 0Z" fill="#76513d" stroke="#c49a67" strokeWidth="5" />
        <path d="M-8 -80 C-115 -190 -180 -265 -260 -380 M20 -120 C125 -235 190 -305 285 -405 M-5 -320 C-95 -400 -130 -470 -170 -545 M24 -355 C105 -430 145 -495 185 -560" fill="none" stroke="#8e6849" strokeWidth="24" strokeLinecap="round" />
        <path d="M-5 -75 C-105 -185 -165 -260 -245 -365 M24 -125 C130 -235 195 -305 275 -390" fill="none" stroke="#c49a67" strokeWidth="5" opacity="0.7" />
        <g opacity={canopyOpacity} transform={`rotate(${sway})`}>
          {leafPoints.map(([x, y, scale], index) => (
            <g key={index} transform={`translate(${x} ${y}) scale(${scale})`}>
              <circle r={72} fill={index % 3 === 0 ? '#4e8a63' : index % 3 === 1 ? '#78a96f' : '#9ac17b'} />
              <circle cx="-18" cy="-20" r="28" fill="#d4e7a0" opacity="0.22" />
            </g>
          ))}
          <circle cx="0" cy="-630" r="340" fill="none" stroke={accent} strokeWidth="3" opacity="0.14" />
        </g>
      </g>
      <g opacity={reveal}>
        <path d="M-260 5 Q-145 -20 -45 5 M260 5 Q145 -20 45 5" stroke="#b4c98d" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
};

const Seed: React.FC<{growth: number}> = ({growth}) => {
  const sprout = interpolate(growth, [0, 0.25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <g transform="translate(540 1420)">
      <ellipse cx="0" cy="20" rx="130" ry="25" fill="#071c1d" opacity="0.5" />
      <path d="M-100 0 Q0 -40 100 0 L75 55 Q0 82 -75 55Z" fill="#76513d" />
      <ellipse cx="0" cy="0" rx="100" ry="24" fill="#b18a60" />
      <ellipse cx="0" cy="-12" rx="18" ry="27" fill="#d9b77b" transform="rotate(28)" />
      <path d={`M0 -24 Q-8 -${70 + sprout * 185} 0 -${105 + sprout * 310}`} fill="none" stroke="#a8d28e" strokeWidth="12" strokeLinecap="round" />
      <path d={`M0 -${105 + sprout * 250} Q-${90 * sprout} -${165 + sprout * 240} -${125 * sprout} -${145 + sprout * 240} Q-${75 * sprout} -${95 + sprout * 240} 0 -${105 + sprout * 250}`} fill="#7fb77b" />
      <path d={`M0 -${135 + sprout * 220} Q${85 * sprout} -${205 + sprout * 210} ${120 * sprout} -${180 + sprout * 210} Q${75 * sprout} -${125 + sprout * 210} 0 -${135 + sprout * 220}`} fill="#b1d58e" />
    </g>
  );
};

const SkillOrbs: React.FC<{opacity: number; frame: number}> = ({opacity, frame}) => {
  const labels = ['IDE', 'DESAIN', 'TEKNOLOGI', 'RISET', 'KREATIF', 'KOMUNIKASI', 'STRATEGI', 'KOLABORASI'];
  return (
    <g opacity={opacity}>
      {labels.map((label, index) => {
        const angle = (Math.PI * 2 * index) / labels.length + frame / 300;
        const x = 540 + Math.cos(angle) * 350;
        const y = 980 + Math.sin(angle) * 190;
        return (
          <g key={label} transform={`translate(${x} ${y})`}>
            <circle r="48" fill="#c6c1f2" opacity="0.12" stroke="#d9d2ff" strokeWidth="3" />
            <circle r="7" fill="#fff0c2" />
            <text y="78" textAnchor="middle" fill="#f6f0dc" fontSize="18" fontWeight="700" letterSpacing="1">{label}</text>
          </g>
        );
      })}
    </g>
  );
};

export const TunasDewa: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneIndex = Math.min(7, Math.floor(frame / SCENE_LENGTH));
  const localFrame = frame - sceneIndex * SCENE_LENGTH;
  const scene = scenes[sceneIndex];
  const growth = interpolate(frame, [0, 300, 720, 1350, 1900, 2350, 2699], [0.015, 0.12, 0.2, 0.38, 0.58, 0.86, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const sceneOpacity = interpolate(localFrame, [0, 16, SCENE_LENGTH - 18, SCENE_LENGTH], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(localFrame, [0, 24], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stormOpacity = sceneIndex === 3
    ? interpolate(localFrame, [0, 35, 260, 337], [0, 0.72, 0.72, 0], {extrapolateRight: 'clamp'})
    : 0;
  const orbOpacity = sceneIndex === 2
    ? interpolate(localFrame, [0, 25, 300, 337], [0, 1, 1, 0], {extrapolateRight: 'clamp'})
    : 0;
  const musicVolume = interpolate(frame, [0, 60, 1900, 2200, 2699], [0.055, 0.07, 0.085, 0.1, 0.065], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const narrationVolume = 1;

  return (
    <>
      <Audio src={staticFile('audio/music-bed.wav')} volume={musicVolume} />
      <Audio src={staticFile('audio/soft-chime.wav')} from={0} volume={0.14} />
      <Audio src={staticFile('audio/seedling.wav')} from={280} volume={0.15} />
      <Audio src={staticFile('audio/whoosh.wav')} from={660} volume={0.13} />
      <Audio src={staticFile('audio/soft-impact.wav')} from={1010} volume={0.14} />
      <Audio src={staticFile('audio/whoosh.wav')} from={1350} volume={0.15} />
      <Audio src={staticFile('audio/seedling.wav')} from={1810} volume={0.16} />
      <Audio src={staticFile('audio/soft-chime.wav')} from={2250} volume={0.16} />
      <Audio src={staticFile('audio/whoosh.wav')} from={2490} volume={0.16} />
      <Audio src={staticFile('audio/tunas-dewa-narration.mp3')} volume={narrationVolume} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 54%, ${scene.sky} 0%, #08171f 76%)`,
          color: '#f8f4e9',
          fontFamily: 'Arial, sans-serif',
          overflow: 'hidden',
        }}
      >
        <AbsoluteFill style={{opacity: 0.16, backgroundImage: 'radial-gradient(circle at 15% 20%,#fff 0 2px,transparent 3px),radial-gradient(circle at 80% 32%,#fff 0 1px,transparent 2px)', backgroundSize: '90px 90px,130px 130px'}} />
        <div style={{position: 'absolute', top: 72, left: 68, right: 68, display: 'flex', justifyContent: 'space-between', fontSize: 17, letterSpacing: 4, opacity: 0.72}}>
          <span>IMPERAL MOTION STUDIO</span>
          <span>{String(sceneIndex + 1).padStart(2, '0')} / 08</span>
        </div>
        <div style={{position: 'absolute', top: 190, left: 76, right: 76, opacity: sceneOpacity, transform: `translateY(${titleY}px)`, zIndex: 4}}>
          <div style={{fontSize: 18, letterSpacing: 5, fontWeight: 700, color: scene.accent, marginBottom: 24}}>{scene.tag}</div>
          <div style={{fontSize: sceneIndex === 7 ? 62 : 58, lineHeight: 1.1, fontWeight: 800, whiteSpace: 'pre-line', letterSpacing: -1.4}}>{scene.title}</div>
          <div style={{fontSize: 24, lineHeight: 1.45, color: 'rgba(255,255,255,.78)', marginTop: 24, maxWidth: 900}}>{scene.subtitle}</div>
        </div>
        <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#254c3b" />
              <stop offset="100%" stopColor="#0b201f" />
            </linearGradient>
            <radialGradient id="aura">
              <stop offset="0%" stopColor="#f7d99a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f7d99a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="540" cy="1330" rx={220 + growth * 360} ry={180 + growth * 260} fill="url(#aura)" opacity={sceneIndex >= 5 ? 0.8 : 0.16} />
          <path d="M0 1450 Q260 1370 540 1440 T1080 1415 V1920 H0Z" fill="url(#ground)" />
          <g opacity={stormOpacity}>
            {Array.from({length: 24}, (_, index) => (
              <path key={index} d={`M${index * 52 - 30} 900 l-55 160`} stroke="#c5d7e3" strokeWidth="4" opacity="0.4" />
            ))}
          </g>
          <Seed growth={growth} />
          <Tree growth={growth} frame={frame} accent={scene.accent} />
          <SkillOrbs opacity={orbOpacity} frame={frame} />
          {sceneIndex >= 6 && (
            <g opacity={interpolate(frame, [2100, 2450], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
              <circle cx="540" cy="805" r="420" fill="none" stroke="#f5d99d" strokeWidth="3" opacity="0.2" />
              <circle cx="540" cy="805" r="470" fill="none" stroke="#f5d99d" strokeWidth="2" opacity="0.12" />
            </g>
          )}
        </svg>
        {sceneIndex === 7 && (
          <div style={{position: 'absolute', top: 1140, left: 0, right: 0, textAlign: 'center', fontSize: 72, fontWeight: 900, letterSpacing: 8, color: '#ffe6a6', textShadow: '0 0 35px rgba(255,214,130,.55)', opacity: interpolate(localFrame, [40, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
            TUNAS DEWA
          </div>
        )}
        <div style={{position: 'absolute', bottom: 76, left: 72, right: 72}}>
          <div style={{height: 4, background: 'rgba(255,255,255,.18)', borderRadius: 8}}>
            <div style={{height: 4, width: `${(frame / (DURATION - 1)) * 100}%`, background: scene.accent, borderRadius: 8}} />
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 14, letterSpacing: 3, opacity: 0.64}}>
            <span>GROW TOGETHER</span>
            <span>90 SEC</span>
          </div>
        </div>
      </AbsoluteFill>
    </>
  );
};
