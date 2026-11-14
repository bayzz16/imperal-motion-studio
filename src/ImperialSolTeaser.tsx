import React from 'react';
import {Audio} from '@remotion/media';
import {IMPERIAL_SOL_SCENE_STARTS, IMPERIAL_SOL_DURATION_FRAMES} from './generated/imperial-sol-timing';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const SCENES = [
  {tag: 'SEBUAH DUNIA BARU', title: 'Ada dunia yang belum\nmengenal namamu.', sub: 'Dan setiap kisah besar selalu dimulai dari satu langkah.', sky: '#111b2c', light: '#e8a66d'},
  {tag: 'TITIK AWAL', title: 'Setiap kisah punya\ntitik awal.', sub: 'Sebuah cakrawala. Sebuah kesempatan. Sebuah cerita yang belum ditulis.', sky: '#26374b', light: '#f1bd7d'},
  {tag: 'DI BALIK CAKRAWALA', title: 'Ada sesuatu yang\nmenunggu ditemukan.', sub: 'Biarkan rasa ingin tahu membawamu lebih jauh.', sky: '#182b38', light: '#9bc7c4'},
  {tag: 'SEBUAH PERJALANAN', title: 'Bukan hanya tentang\ntujuan akhir.', sub: 'Tetapi tentang setiap langkah yang membentuk perjalanan.', sky: '#172b31', light: '#d7b57d'},
  {tag: 'CERITA YANG TUMBUH', title: 'Tentang pertemuan,\nkenangan, dan cerita.', sub: 'Hal-hal kecil yang membuat sebuah dunia terasa berarti.', sky: '#293044', light: '#e6bd91'},
  {tag: 'DUA DUNIA', title: 'Dua dunia.\nSatu cerita.', sub: 'Satu nama yang akan segera kamu kenal.', sky: '#171e31', light: '#c6b6ed'},
  {tag: 'SEGERA TERUNGKAP', title: 'Waktunya semakin\ndekat.', sub: 'Simpan rasa penasaranmu. Kisah ini baru akan dimulai.', sky: '#101827', light: '#f0c98e'},
  {tag: 'IMPERIAL × SLICE OF LIFE', title: 'IMPERIAL', sub: 'SLICE OF LIFE  •  SEGERA HADIR', sky: '#101827', light: '#f2d3a0'},
] as const;

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const Block: React.FC<{x: number; y: number; s: number; color: string; depth?: number}> = ({x, y, s, color, depth = 0.42}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M0 0 l${s} ${-s * depth} l${s} ${s * depth} l${-s} ${s * depth}Z`} fill={color} />
    <path d={`M0 0 l${s} ${s * depth} v${s} l${-s} ${-s * depth}Z`} fill="#000" opacity="0.22" />
    <path d={`M${s} ${s * depth} l${s} ${-s * depth} v${s} l${-s} ${s * depth}Z`} fill="#fff" opacity="0.12" />
  </g>
);

const Cloud: React.FC<{x: number; y: number; scale: number; opacity: number}> = ({x, y, scale, opacity}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
    <ellipse cx="0" cy="18" rx="118" ry="25" fill="#0b1723" opacity="0.3" />
    <path d="M-110 14 Q-135 -16 -94 -34 Q-74 -82 -22 -61 Q10 -111 51 -70 Q103 -78 105 -31 Q150 -10 115 17Z" fill="#d5dce0" />
    <path d="M-92 -4 Q-68 -48 -30 -37 Q5 -85 44 -46 Q82 -58 99 -19 Q52 -2 -92 -4Z" fill="#f4f0e8" opacity="0.48" />
    <path d="M-110 14 Q-30 31 115 17" fill="none" stroke="#fff" strokeWidth="5" opacity="0.15" />
  </g>
);

const Pine: React.FC<{x: number; y: number; scale: number; tint: string}> = ({x, y, scale, tint}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-13 0 L-8 -105 L8 -105 L14 0Z" fill="#493a32" />
    <path d="M0 -210 L-63 -115 L-31 -120 L-75 -60 L-34 -72 L-59 -20 L0 -35 L59 -20 L34 -72 L75 -60 L31 -120 L63 -115Z" fill={tint} />
    <path d="M0 -210 L0 -35 L59 -20 L34 -72 L75 -60 L31 -120 L63 -115Z" fill="#061d1d" opacity="0.2" />
    <path d="M-31 -120 L-5 -132 M-34 -72 L-2 -83" stroke="#b1c6a2" strokeWidth="4" opacity="0.25" />
  </g>
);

const House: React.FC<{x: number; y: number; scale: number; glow: number}> = ({x, y, scale, glow}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-90 -80 L0 -145 L90 -80 V15 H-90Z" fill="#594c48" />
    <path d="M-90 -80 L0 -145 L90 -80 L0 -27Z" fill="#7c6656" />
    <path d="M0 -27 L90 -80 V15 H0Z" fill="#3b3538" />
    <path d="M-28 15 V-65 H24 V15Z" fill="#2b2529" />
    <rect x="-70" y="-75" width="24" height="28" fill="#f4c77d" opacity={glow} />
    <rect x="43" y="-73" width="24" height="28" fill="#f4c77d" opacity={glow} />
    <path d="M-70 -75 H-46 M43 -73 H67" stroke="#fff0c7" strokeWidth="4" opacity={glow} />
  </g>
);

const Traveler: React.FC<{x: number; y: number; scale: number; frame: number}> = ({x, y, scale, frame}) => {
  const bob = Math.sin(frame / 10) * 3;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${scale})`}>
      <ellipse cx="0" cy="8" rx="34" ry="9" fill="#050b12" opacity="0.55" />
      <path d="M-23 -88 L23 -88 L28 -24 L-28 -24Z" fill="#273b50" />
      <path d="M-19 -84 L0 -73 L19 -84 L23 -25 H-23Z" fill="#49627a" />
      <rect x="-23" y="-142" width="46" height="49" rx="3" fill="#b88965" />
      <path d="M-25 -143 L-22 -159 L22 -159 L25 -143Z" fill="#3b302d" />
      <rect x="-17" y="-132" width="8" height="7" fill="#1c2027" />
      <rect x="9" y="-132" width="8" height="7" fill="#1c2027" />
      <path d="M-19 -24 L-4 -24 L-7 5 H-25Z M4 -24 L19 -24 L25 5 H7Z" fill="#252b39" />
      <path d="M-25 5 H-5 M7 5 H27" stroke="#171c28" strokeWidth="8" strokeLinecap="round" />
    </g>
  );
};

const Landscape: React.FC<{frame: number; sceneIndex: number; light: string}> = ({frame, sceneIndex, light}) => {
  const drift = (frame * 0.18) % 360;
  const glow = sceneIndex > 3 ? 0.95 : 0.55;
  return (
    <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={light} stopOpacity="0.05" />
          <stop offset="62%" stopColor={light} stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0a151c" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="sun">
          <stop offset="0%" stopColor={light} stopOpacity="0.82" />
          <stop offset="45%" stopColor={light} stopOpacity="0.2" />
          <stop offset="100%" stopColor={light} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#345347" />
          <stop offset="100%" stopColor="#101e25" />
        </linearGradient>
        <filter id="softGlow"><feGaussianBlur stdDeviation="28" /></filter>
      </defs>
      <rect x="0" y="0" width="1080" height="1920" fill={SCENES[sceneIndex].sky} />
      <rect x="0" y="0" width="1080" height="1920" fill="url(#horizon)" opacity="0.16" />
      <circle cx={760 - sceneIndex * 26} cy="690" r="330" fill="url(#sun)" opacity={glow} />
      <circle cx={760 - sceneIndex * 26} cy="690" r="84" fill={light} opacity="0.62" filter="url(#softGlow)" />
      <g opacity="0.74">
        <Cloud x={180 - drift} y={520} scale={1.05} opacity={0.42} />
        <Cloud x={860 - drift * 0.55} y={420} scale={0.78} opacity={0.3} />
        <Cloud x={590 + drift * 0.32} y={760} scale={0.56} opacity={0.22} />
      </g>

      {sceneIndex === 0 && (
        <g>
          <path d="M0 1040 L180 790 L330 960 L505 720 L720 985 L890 790 L1080 980 V1920 H0Z" fill="#263c4b" opacity="0.7" />
          <path d="M0 1280 Q180 1140 360 1250 T720 1210 T1080 1240 V1920 H0Z" fill="#203b35" />
          <path d="M0 1510 Q250 1380 500 1480 T1080 1450 V1920 H0Z" fill="url(#ground)" />
          {Array.from({length: 13}, (_, i) => <Pine key={i} x={i * 100 - 30} y={1470} scale={0.42 + (i % 3) * 0.12} tint={i % 2 ? '#24483d' : '#315c4a'} />)}
          <Pine x={75} y={1640} scale={1.1} tint="#315c4a" />
          <Pine x={980} y={1650} scale={1.2} tint="#294c43" />
          <House x={300} y={1500} scale={0.72} glow={glow} />
          <House x={770} y={1475} scale={0.52} glow={glow} />
          <Traveler x={540} y={1580} scale={1.18} frame={frame} />
        </g>
      )}

      {sceneIndex === 1 && (
        <g>
          <path d="M0 1120 L170 900 L310 1050 L470 790 L650 1040 L820 850 L1080 1090 V1920 H0Z" fill="#34495c" opacity="0.56" />
          <path d="M-80 1370 Q210 1230 420 1320 L530 1450 L330 1530 L-80 1490Z" fill="#52746e" />
          <path d="M530 1450 L680 1280 Q870 1200 1160 1370 L1160 1510 L770 1550Z" fill="#3d6a68" />
          <path d="M80 1450 L280 1500 L220 1630 L25 1570Z M700 1400 L930 1460 L880 1600 L660 1530Z" fill="#152b36" />
          <path d="M350 1430 Q530 1300 710 1420 L820 1510 L300 1510Z" fill="#b6a17b" />
          <path d="M300 1510 L820 1510 L760 1580 L350 1580Z" fill="#4a514e" />
          <path d="M420 1450 L540 1310 L660 1450" fill="none" stroke="#e5d0a7" strokeWidth="18" opacity="0.8" />
          <g fill="#9bd8d4" opacity="0.8">
            <path d="M185 1300 L230 1170 L275 1300Z" />
            <path d="M850 1190 L900 1030 L950 1190Z" />
            <path d="M720 1290 L755 1180 L790 1290Z" />
          </g>
          <g fill="#d8e9e3" opacity="0.42">
            <path d="M0 1700 Q250 1630 500 1700 T1080 1670 V1920 H0Z" />
            <path d="M0 1780 Q250 1710 500 1780 T1080 1750" fill="none" stroke="#b7ded7" strokeWidth="8" />
          </g>
          <Traveler x={730} y={1435} scale={0.94} frame={frame} />
        </g>
      )}

      {sceneIndex === 2 && (
        <g>
          <path d="M0 1360 L0 950 L160 770 L250 1020 L370 690 L500 1000 L650 720 L790 1010 L930 760 L1080 990 V1920 H0Z" fill="#263c4b" />
          <path d="M0 1440 L120 1130 L250 1240 L380 930 L540 1270 L690 980 L840 1270 L970 1080 L1080 1240 V1920 H0Z" fill="#405361" opacity="0.82" />
          <path d="M0 1530 Q240 1410 520 1510 T1080 1490 V1920 H0Z" fill="#182d36" />
          <g fill="#6b7475" stroke="#a5a9a1" strokeWidth="8">
            <path d="M270 1560 V1040 H355 V1560Z" />
            <path d="M725 1560 V1040 H810 V1560Z" />
            <path d="M235 1060 L310 950 L390 1060Z" />
            <path d="M690 1060 L765 950 L845 1060Z" />
            <path d="M310 970 Q540 690 770 970" fill="none" strokeWidth="42" />
          </g>
          <path d="M350 1500 Q540 1410 730 1500" fill="none" stroke="#d5c29c" strokeWidth="18" opacity="0.55" />
          <g fill="#d9c7a3" opacity="0.6">
            <path d="M140 1500 L185 1320 L230 1500Z" />
            <path d="M870 1500 L915 1290 L960 1500Z" />
          </g>
          <Traveler x={540} y={1510} scale={1.02} frame={frame} />
        </g>
      )}

      {sceneIndex === 3 && (
        <g>
          <path d="M0 1050 L230 900 L360 1080 L360 1920 H0Z" fill="#293c45" />
          <path d="M1080 1020 L850 850 L730 1100 L730 1920 H1080Z" fill="#354b51" />
          <path d="M0 1550 L280 1390 L410 1530 L410 1920 H0Z" fill="#3d514b" />
          <path d="M1080 1510 L820 1370 L690 1520 L690 1920 H1080Z" fill="#405b51" />
          <path d="M300 1410 L780 1410 L670 1530 L410 1530Z" fill="#a48c6b" />
          <path d="M410 1530 L670 1530 L735 1600 L350 1600Z" fill="#51463e" />
          {Array.from({length: 9}, (_, i) => <path key={i} d={'M' + (390 + i * 35) + ' 1510 v72'} stroke="#d7c09b" strokeWidth="8" opacity="0.55" />)}
          <path d="M0 1690 Q260 1580 500 1690 T1080 1660 V1920 H0Z" fill="#173b48" />
          <path d={'M0 ' + (1740 + Math.sin(frame / 18) * 12) + ' Q270 1660 540 1750 T1080 1710'} fill="none" stroke="#80c2c4" strokeWidth="14" opacity="0.52" />
          <path d="M130 1300 Q180 1450 140 1660 M950 1250 Q900 1440 940 1660" stroke="#a9c5b9" strokeWidth="18" fill="none" opacity="0.25" />
          <Traveler x={540} y={1480} scale={1.08} frame={frame} />
        </g>
      )}

      {sceneIndex === 4 && (
        <g>
          <path d="M0 1270 Q270 1160 540 1280 T1080 1240 V1920 H0Z" fill="#253c46" />
          <path d="M0 1450 Q260 1380 540 1450 T1080 1420 V1920 H0Z" fill="#1e4a55" />
          <path d="M0 1510 Q250 1460 500 1520 T1080 1480" fill="none" stroke="#8fc2bd" strokeWidth="10" opacity="0.5" />
          <path d="M0 1650 Q250 1580 500 1650 T1080 1620" fill="none" stroke="#b5d7cb" strokeWidth="5" opacity="0.28" />
          <g opacity="0.85">
            <House x={250} y={1430} scale={0.78} glow={1} />
            <House x={820} y={1395} scale={0.62} glow={0.9} />
          </g>
          <path d="M400 1570 L680 1570 L760 1620 L330 1620Z" fill="#7d6048" />
          <path d="M430 1620 V1740 M650 1620 V1740" stroke="#604c3d" strokeWidth="16" />
          <path d="M0 1270 Q150 1100 300 1300" stroke="#1f473b" strokeWidth="34" fill="none" />
          <path d="M170 1300 Q150 1110 240 1010 M170 1190 Q70 1110 55 1000 M180 1160 Q300 1090 330 980" stroke="#315d4c" strokeWidth="30" fill="none" />
          <Traveler x={540} y={1540} scale={1.02} frame={frame} />
        </g>
      )}

      {sceneIndex === 5 && (
        <g>
          <path d="M0 1120 L240 900 L410 1120 V1920 H0Z" fill="#233e42" />
          <path d="M1080 1110 L850 850 L680 1120 V1920 H1080Z" fill="#4a4050" />
          <path d="M0 1450 Q250 1300 520 1450 V1920 H0Z" fill="#244d43" />
          <path d="M1080 1430 Q820 1280 560 1450 V1920 H1080Z" fill="#51465a" />
          <g fill="#315d4c">
            <path d="M90 1460 L145 1210 L200 1460Z M210 1480 L270 1190 L330 1480Z M360 1490 L405 1290 L450 1490Z" />
          </g>
          <g fill="#9a87bd" opacity="0.8">
            <path d="M700 1450 L760 1120 L820 1450Z M840 1450 L900 1040 L960 1450Z" />
            <path d="M720 1450 L760 1260 L800 1450Z M860 1450 L900 1180 L940 1450Z" fill="#d5c8ef" opacity="0.6" />
          </g>
          <g transform={'translate(540 1250) scale(' + (1 + Math.sin(frame / 70) * 0.025) + ')'}>
            <ellipse cx="0" cy="0" rx="250" ry="360" fill={light} opacity="0.2" filter="url(#softGlow)" />
            <path d="M-150 190 V-125 Q-150 -300 0 -300 Q150 -300 150 -125 V190" fill="none" stroke={light} strokeWidth="22" />
            <path d="M-118 190 V-120 Q-118 -260 0 -260 Q118 -260 118 -120 V190" fill="none" stroke="#fff4db" strokeWidth="4" opacity="0.7" />
            <path d="M-118 190 Q0 120 118 190" fill="none" stroke={light} strokeWidth="9" />
          </g>
          <Traveler x={540} y={1660} scale={0.88} frame={frame} />
        </g>
      )}

      {sceneIndex === 6 && (
        <g>
          <path d="M0 1180 L150 970 L270 1150 L400 850 L560 1130 L700 860 L860 1120 L1010 920 L1080 1050 V1920 H0Z" fill="#26384a" />
          <path d="M120 1470 V1080 L250 930 L380 1080 V1470Z M700 1470 V1080 L830 930 L960 1080 V1470Z" fill="#4b4b5c" stroke="#9b8b86" strokeWidth="10" />
          <path d="M90 1090 L250 850 L410 1090Z M670 1090 L830 850 L990 1090Z" fill="#5b5966" />
          <path d="M400 1480 V1170 Q540 1000 680 1170 V1480Z" fill="#111a29" stroke="#d7b98e" strokeWidth="18" />
          <path d="M440 1480 V1200 Q540 1080 640 1200 V1480" fill="none" stroke={light} strokeWidth="8" opacity="0.9" />
          <path d="M0 1540 L1080 1540 L900 1670 L180 1670Z" fill="#655a59" />
          {Array.from({length: 7}, (_, i) => <path key={i} d={'M' + (180 + i * 120) + ' 1670 l-35 250 h70 l-35 -250'} fill="#8a7771" opacity="0.7" />)}
          <g fill="#d5b78e">
            <path d="M210 1080 L270 930 L330 1080Z M750 1080 L810 930 L870 1080Z" />
            <path d="M250 980 V830 M810 980 V830" stroke="#d5b78e" strokeWidth="12" />
          </g>
          <Traveler x={540} y={1540} scale={0.92} frame={frame} />
        </g>
      )}

      {sceneIndex === 7 && (
        <g>
          <path d="M0 1220 L150 1040 L280 1220 L400 940 L540 1150 L680 930 L820 1200 L970 1020 L1080 1160 V1920 H0Z" fill="#202f42" />
          <path d="M120 1510 V1170 L260 1000 L400 1170 V1510Z M680 1510 V1170 L820 1000 L960 1170 V1510Z" fill="#394456" />
          <path d="M80 1190 L260 900 L440 1190Z M640 1190 L820 900 L1000 1190Z" fill="#4d5262" />
          <path d="M350 1510 V1260 Q540 1030 730 1260 V1510Z" fill="#111a29" stroke={light} strokeWidth="18" opacity="0.95" />
          <path d="M0 1610 Q540 1470 1080 1610 V1920 H0Z" fill="#111d2a" />
          <path d="M540 1500 L0 1800 M540 1500 L1080 1800" stroke={light} strokeWidth="7" opacity="0.16" />
          <g fill="#d9c6a5" opacity="0.75">
            <path d="M180 1620 L300 1620 L360 1920 H120Z" />
            <path d="M780 1620 L900 1620 L960 1920 H720Z" />
          </g>
        </g>
      )}

      <g opacity="0.45">
        {Array.from({length: 24}, (_, i) => {
          const x = (i * 137 + 60) % 1080;
          const y = 380 + ((i * 193) % 870);
          const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frame / 18 + i));
          return <circle key={i} cx={x} cy={y} r={1.5 + (i % 3)} fill="#fff4d7" opacity={twinkle} />;
        })}
      </g>
    </svg>
  );
};

// Scene changes are driven by measured speech-segment timing from the narration build.
export const ImperialSolTeaser: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneIndex = Math.max(0, IMPERIAL_SOL_SCENE_STARTS.reduce<number>((active, start, index) => frame >= start ? index : active, 0));
  const sceneStart = IMPERIAL_SOL_SCENE_STARTS[sceneIndex];
  const nextSceneStart = IMPERIAL_SOL_SCENE_STARTS[sceneIndex + 1] ?? IMPERIAL_SOL_DURATION_FRAMES;
  const local = frame - sceneStart;
  const scene = SCENES[sceneIndex];
  const fade = interpolate(local, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const transitionProgress = sceneIndex === 0 ? 1 : interpolate(local, [0, 30], [0, 1], clamp);
  const titleIn = interpolate(local, [18, 58], [36, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const camera = interpolate(frame, [0, IMPERIAL_SOL_DURATION_FRAMES], [1.035, 1.19], clamp);
  const reveal = interpolate(local, [0, 42], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const music = interpolate(frame, [0, 90, IMPERIAL_SOL_DURATION_FRAMES - 150, IMPERIAL_SOL_DURATION_FRAMES], [0, 0.18, 0.2, 0], clamp);

  return (
    <>
      <Audio src={staticFile('audio/music-bed.wav')} volume={music} />
      <Audio src={staticFile('audio/whoosh.wav')} from={IMPERIAL_SOL_SCENE_STARTS[1]} volume={0.1} />
      <Audio src={staticFile('audio/soft-chime.wav')} from={IMPERIAL_SOL_SCENE_STARTS[3]} volume={0.08} />
      <Audio src={staticFile('audio/soft-impact.wav')} from={IMPERIAL_SOL_SCENE_STARTS[6]} volume={0.1} />
      <Audio src={staticFile('audio/whoosh.wav')} from={IMPERIAL_SOL_SCENE_STARTS[7]} volume={0.12} />
      <Audio src={staticFile('audio/imperial-sol-narration.mp3')} volume={1} />
      <AbsoluteFill style={{backgroundColor: '#101b2b', color: '#fff8ed', overflow: 'hidden', fontFamily: 'Georgia, serif'}}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #101b2b 0%, #263849 54%, #0b171e 100%)'}} />
        <div style={{position: 'absolute', inset: 0, transform: `scale(${camera}) translate3d(${interpolate(frame, [0, IMPERIAL_SOL_DURATION_FRAMES], [0, -110], clamp)}px, ${Math.sin(frame / 100) * 10}px, 0)`, transformOrigin: '50% 58%'}}>
          {sceneIndex > 0 && (
            <div style={{position: 'absolute', inset: 0, opacity: 1 - transitionProgress}}>
              <Landscape frame={frame} sceneIndex={sceneIndex - 1} light={SCENES[sceneIndex - 1].light} />
            </div>
          )}
          <div style={{position: 'absolute', inset: 0, opacity: transitionProgress}}>
            <Landscape frame={frame} sceneIndex={sceneIndex} light={scene.light} />
          </div>
        </div>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,12,22,.48) 0%, transparent 34%, transparent 60%, rgba(3,10,16,.68) 100%)'}} />
        <div style={{position: 'absolute', top: 88, left: 72, right: 72, display: 'flex', justifyContent: 'space-between', fontFamily: 'Arial, sans-serif', fontSize: 17, letterSpacing: 5, color: 'rgba(255,248,237,.7)'}}>
          <span>AN IMPERIAL WORLD</span>
          <span>{String(sceneIndex + 1).padStart(2, '0')} / 08</span>
        </div>
        {sceneIndex !== 7 && (
          <div style={{position: 'absolute', top: 390, left: 76, right: 76, opacity: fade, transform: `translateY(${titleIn}px)`, textAlign: 'center'}}>
            <div style={{fontFamily: 'Arial, sans-serif', fontSize: 18, letterSpacing: 7, fontWeight: 700, color: scene.light, marginBottom: 30}}>{scene.tag}</div>
            <div style={{fontSize: 67, lineHeight: 1.12, fontWeight: 700, whiteSpace: 'pre-line', textShadow: '0 8px 38px rgba(0,0,0,.5)'}}>{scene.title}</div>
            <div style={{fontFamily: 'Arial, sans-serif', fontSize: 23, lineHeight: 1.55, color: 'rgba(255,248,237,.78)', margin: '28px auto 0', maxWidth: 820}}>{scene.sub}</div>
          </div>
        )}
        {sceneIndex === 7 && (
          <div style={{position: 'absolute', top: 510, left: 50, right: 50, textAlign: 'center', opacity: reveal, transform: `translateY(${(1 - reveal) * 32}px)`}}>
            <div style={{fontFamily: 'Arial, sans-serif', fontSize: 20, letterSpacing: 8, color: scene.light, marginBottom: 28}}>A NEW STORY BEGINS</div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 88, lineHeight: 1.04, fontWeight: 700, letterSpacing: 3, textShadow: `0 0 38px ${scene.light}55`}}>IMPERIAL</div>
            <div style={{fontFamily: 'Arial, sans-serif', fontSize: 25, letterSpacing: 8, marginTop: 22, color: '#f3e7d4'}}>× SLICE OF LIFE</div>
            <div style={{fontFamily: 'Arial, sans-serif', fontSize: 20, letterSpacing: 6, marginTop: 72, color: scene.light}}>SEGERA HADIR</div>
          </div>
        )}
        <div style={{position: 'absolute', bottom: 82, left: 74, right: 74, opacity: 0.72}}>
          <div style={{height: 2, background: 'rgba(255,255,255,.2)'}}>
            <div style={{height: 2, width: `${(frame / Math.max(1, IMPERIAL_SOL_DURATION_FRAMES - 1)) * 100}%`, background: scene.light}} />
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 15, fontFamily: 'Arial, sans-serif', fontSize: 13, letterSpacing: 4}}>
            <span>THE STORY IS WAITING</span>
            <span>IMPERIAL × SOL</span>
          </div>
        </div>
      </AbsoluteFill>
    </>
  );
};
