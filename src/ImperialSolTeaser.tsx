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
      <circle cx={760 - sceneIndex * 26} cy="690" r="330" fill="url(#sun)" opacity={glow} />
      <circle cx={760 - sceneIndex * 26} cy="690" r="84" fill={light} opacity="0.62" filter="url(#softGlow)" />
      <path d="M0 1010 L180 790 L330 960 L505 720 L720 985 L890 790 L1080 980 V1920 H0Z" fill="#263c4b" opacity="0.66" />
      <path d="M0 1130 L170 925 L310 1090 L510 870 L690 1100 L870 920 L1080 1090 V1920 H0Z" fill="#1d3540" />
      <path d="M0 1280 Q180 1140 360 1250 T720 1210 T1080 1240 V1920 H0Z" fill="url(#horizon)" />
      <g opacity="0.74">
        <Cloud x={180 - drift} y={520} scale={1.05} opacity={0.42} />
        <Cloud x={860 - drift * 0.55} y={420} scale={0.78} opacity={0.3} />
        <Cloud x={590 + drift * 0.32} y={760} scale={0.56} opacity={0.22} />
      </g>
      <path d="M0 1370 Q270 1240 520 1360 T1080 1320 V1920 H0Z" fill="#203b35" />
      <path d="M0 1510 Q250 1380 500 1480 T1080 1450 V1920 H0Z" fill="url(#ground)" />
      <g opacity="0.95">
        {Array.from({length: 13}, (_, i) => (
          <Pine key={i} x={i * 100 - 30} y={sceneIndex % 2 ? 1420 : 1470} scale={0.42 + (i % 3) * 0.12} tint={i % 2 ? '#24483d' : '#315c4a'} />
        ))}
        <Pine x={75} y={1640} scale={1.1} tint="#315c4a" />
        <Pine x={980} y={1650} scale={1.2} tint="#294c43" />
      </g>
      <g opacity={sceneIndex >= 3 ? 0.95 : 0.5}>
        <House x={300} y={1500} scale={0.72} glow={glow} />
        <House x={770} y={1475} scale={0.52} glow={glow} />
      </g>
      {sceneIndex >= 2 && (
        <g transform={`translate(540 1120) scale(${0.9 + Math.sin(frame / 90) * 0.025})`}>
          <ellipse cx="0" cy="0" rx="210" ry="330" fill={light} opacity="0.1" filter="url(#softGlow)" />
          <path d="M-115 170 V-120 Q-115 -260 0 -260 Q115 -260 115 -120 V170" fill="none" stroke={light} strokeWidth="16" opacity="0.74" />
          <path d="M-91 170 V-116 Q-91 -230 0 -230 Q91 -230 91 -116 V170" fill="none" stroke="#fff1d1" strokeWidth="3" opacity="0.52" />
          <path d="M-92 170 Q0 110 92 170" fill="none" stroke={light} strokeWidth="6" opacity="0.45" />
        </g>
      )}
      <g opacity={sceneIndex >= 4 ? 0.94 : 0.72}>
        <Traveler x={540} y={1580} scale={1.18} frame={frame} />
      </g>
      <g opacity="0.45">
        {Array.from({length: 24}, (_, i) => {
          const x = (i * 137 + 60) % 1080;
          const y = 380 + ((i * 193) % 870);
          const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frame / 18 + i));
          return <circle key={i} cx={x} cy={y} r={1.5 + (i % 3)} fill="#fff4d7" opacity={twinkle} />;
        })}
      </g>
      <g opacity="0.65">
        <Block x={120} y={1760} s={72} color="#446454" />
        <Block x={850} y={1800} s={90} color="#345545" />
        <Block x={920} y={1700} s={54} color="#4a705a" />
        <Block x={40} y={1680} s={50} color="#395b4c" />
      </g>
    </svg>
  );
};

export const ImperialSolTeaser: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneIndex = Math.max(0, IMPERIAL_SOL_SCENE_STARTS.reduce((active, start, index) => frame >= start ? index : active, 0));
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
      <Audio src={staticFile('audio/whoosh.wav')} from={240} volume={0.12} />
      <Audio src={staticFile('audio/soft-chime.wav')} from={790} volume={0.1} />
      <Audio src={staticFile('audio/soft-impact.wav')} from={1320} volume={0.14} />
      <Audio src={staticFile('audio/whoosh.wav')} from={1740} volume={0.16} />
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
