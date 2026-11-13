import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

const scenes = [
  {title: 'Semua hal besar\nberawal dari kecil.', sub: 'Sebuah ide. Sebuah keberanian untuk memulai.', tag: 'AWAL PERJALANAN', a: '#102b36', b: '#28665c'},
  {title: 'Satu langkah\nmenjadi harapan.', sub: 'Tim kecil mulai menyusun arah dan tujuan.', tag: 'MENEMUKAN ARAH', a: '#142d3e', b: '#315f76'},
  {title: 'Delapan orang.\nDelapan keahlian.', sub: 'Ide, desain, teknologi, komunikasi, dan strategi.', tag: 'KEKUATAN TIM', a: '#25234a', b: '#55518b'},
  {title: 'Berbeda peran,\nsatu tujuan.', sub: 'Setiap kontribusi membuat fondasi semakin kuat.', tag: 'BEKERJA BERSAMA', a: '#183b3b', b: '#3b796b'},
  {title: 'Tidak selalu mudah.', sub: 'Ada tantangan, revisi, dan hal baru untuk dipelajari.', tag: 'MENGHADAPI TANTANGAN', a: '#3b2936', b: '#81536a'},
  {title: 'Mereka terus\ntumbuh bersama.', sub: 'Saling membantu mengubah masalah menjadi kemajuan.', tag: 'BERTUMBUH', a: '#263b31', b: '#6c8b58'},
  {title: 'Dari tim kecil,\nlahir karya besar.', sub: 'Karena masa depan dibangun bersama.', tag: 'SATU IMPIAN', a: '#172d45', b: '#427b91'},
  {title: 'TUNAS KECIL', sub: 'Delapan karyawan. Satu impian. Perjalanan baru dimulai.', tag: 'IMPERAL MOTION STUDIO', a: '#102b36', b: '#477c70'}
];

const Seed: React.FC<{frame: number}> = ({frame}) => {
  const rise = interpolate(frame, [0, 45], [90, 0], {extrapolateRight: 'clamp'});
  const sway = Math.sin(frame / 18) * 5;
  return (
    <div style={{position: 'absolute', bottom: 190, left: '50%', transform: `translateX(-50%) translateY(${rise}px)`, width: 250, height: 330}}>
      <div style={{position: 'absolute', bottom: 0, left: 120, width: 12, height: 190, borderRadius: 20, background: '#c5d8a5'}} />
      <div style={{position: 'absolute', bottom: 145, left: 38, width: 165, height: 115, borderRadius: '100% 0 100% 0', background: '#b6d68b', transform: `rotate(${-25 + sway}deg)`}} />
      <div style={{position: 'absolute', bottom: 210, left: 118, width: 125, height: 85, borderRadius: '0 100% 0 100%', background: '#d4e6a6', transform: `rotate(${15 - sway}deg)`}} />
      <div style={{position: 'absolute', bottom: -12, left: 20, width: 215, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.2)', filter: 'blur(12px)'}} />
    </div>
  );
};

export const TunasKecil: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneIndex = Math.min(scenes.length - 1, Math.floor(frame / 338));
  const localFrame = frame - sceneIndex * 338;
  const scene = scenes[sceneIndex];
  const fade = interpolate(localFrame, [0, 20, 310, 338], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const titleY = interpolate(localFrame, [0, 34], [55, 0], {extrapolateRight: 'clamp'});
  const showSeed = sceneIndex === 0 || sceneIndex === 5 || sceneIndex === 7;

  return (
    <AbsoluteFill style={{background: `linear-gradient(155deg, ${scene.a}, ${scene.b})`, color: '#f7f5ed', fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
      <AbsoluteFill style={{opacity: .14, backgroundImage: 'radial-gradient(circle at 15% 20%, #fff 0 2px, transparent 3px), radial-gradient(circle at 80% 32%, #fff 0 1px, transparent 2px)', backgroundSize: '90px 90px, 130px 130px'}} />
      <div style={{position: 'absolute', top: 105, left: 76, right: 76, display: 'flex', justifyContent: 'space-between', fontSize: 22, letterSpacing: 5, opacity: .7}}>
        <span>IMPERAL</span><span>01 / 08</span>
      </div>
      <div style={{position: 'absolute', top: 350, left: 78, right: 78, opacity: fade, transform: `translateY(${titleY}px)`}}>
        <div style={{fontSize: 19, letterSpacing: 7, fontWeight: 700, color: '#d6e7b2', marginBottom: 35}}>{scene.tag}</div>
        <div style={{fontSize: sceneIndex === 7 ? 88 : 76, lineHeight: 1.08, fontWeight: 800, whiteSpace: 'pre-line', letterSpacing: -2}}>{scene.title}</div>
        <div style={{fontSize: 29, lineHeight: 1.45, color: 'rgba(255,255,255,.78)', marginTop: 35, maxWidth: 820}}>{scene.sub}</div>
      </div>
      {showSeed && <Seed frame={localFrame} />}
      <div style={{position: 'absolute', left: 78, right: 78, bottom: 95}}>
        <div style={{height: 3, background: 'rgba(255,255,255,.2)', borderRadius: 5}}>
          <div style={{height: 3, width: `${(frame / 2699) * 100}%`, background: '#d6e7b2', borderRadius: 5}} />
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 17, letterSpacing: 3, opacity: .65}}>
          <span>GROW TOGETHER</span><span>90 SEC</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
