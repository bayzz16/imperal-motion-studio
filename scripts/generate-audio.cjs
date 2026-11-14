const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(process.cwd(), 'public', 'audio');
const RATE = 22050;
fs.mkdirSync(OUT, {recursive: true});

function writeWav(name, seconds, sampleAt) {
  const count = Math.floor(RATE * seconds);
  const dataBytes = count * 2;
  const out = Buffer.alloc(44 + dataBytes);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + dataBytes, 4);
  out.write('WAVE', 8);
  out.write('fmt ', 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(RATE, 24);
  out.writeUInt32LE(RATE * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < count; i++) {
    const value = Math.max(-1, Math.min(1, sampleAt(i / RATE, i)));
    out.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name), out);
  console.log('Generated', name, seconds + 's');
}

const chords = [
  [110.00, 164.81, 220.00, 261.63],
  [87.31, 130.81, 174.61, 220.00],
  [98.00, 146.83, 196.00, 246.94],
  [73.42, 110.00, 146.83, 185.00],
];

writeWav('music-bed.wav', 90, (t) => {
  const chord = chords[Math.floor(t / 7.5) % chords.length];
  const local = t % 7.5;
  let pad = 0;
  chord.forEach((hz, i) => {
    pad += Math.sin(2 * Math.PI * hz * t + i * 0.17) * (i === 0 ? 0.9 : 0.52);
    pad += Math.sin(2 * Math.PI * hz * 2 * t + i) * 0.12;
  });
  const arpIndex = Math.floor(t / 0.5) % 4;
  const arpHz = chord[arpIndex];
  const arpPhase = (t % 0.5) / 0.5;
  const arp = Math.sin(2 * Math.PI * arpHz * t) * Math.exp(-arpPhase * 5);
  const pulse = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.12 * t);
  const fadeIn = Math.min(1, t / 2);
  const fadeOut = Math.min(1, (90 - t) / 4);
  return (pad * 0.018 + arp * 0.035 + Math.sin(2 * Math.PI * chord[0] * 0.5 * t) * 0.018 * pulse) * fadeIn * fadeOut;
});

let seed = 92831;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

writeWav('whoosh.wav', 1.35, (t) => {
  const p = t / 1.35;
  const envelope = Math.pow(Math.sin(Math.PI * p), 1.8);
  const sweep = Math.sin(2 * Math.PI * (180 + 900 * p) * t);
  return (sweep * 0.12 + (random() * 2 - 1) * 0.13) * envelope;
});

writeWav('soft-chime.wav', 2.4, (t) => {
  const notes = [659.25, 830.61, 987.77];
  return notes.reduce((sum, hz, i) => {
    const start = i * 0.12;
    const age = t - start;
    if (age < 0) return sum;
    return sum + Math.sin(2 * Math.PI * hz * age) * Math.exp(-age * (2.1 + i * 0.25)) * 0.11;
  }, 0);
});

writeWav('seedling.wav', 1.8, (t) => {
  const p = t / 1.8;
  const bell = Math.sin(2 * Math.PI * (520 + 500 * p) * t) * Math.exp(-t * 3.1);
  const shimmer = Math.sin(2 * Math.PI * 1320 * t) * Math.exp(-t * 4.5);
  return bell * 0.13 + shimmer * 0.035;
});


writeWav('rain-bed.wav', 8, (t) => {
  const fadeIn = Math.min(1, t / 0.7);
  const fadeOut = Math.min(1, (8 - t) / 1.1);
  const steady = 0.72 + 0.08 * Math.sin(2 * Math.PI * 0.23 * t);
  const noise = (random() * 2 - 1);
  const fineDrops = Math.sin(2 * Math.PI * (2100 + random() * 1700) * t) * 0.08;
  const lowWash = Math.sin(2 * Math.PI * 115 * t) * 0.035;
  const dropPulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 3.7 * t + 0.3)), 18);
  return (noise * 0.12 + fineDrops + lowWash + dropPulse * (random() * 0.22)) * steady * fadeIn * fadeOut;
});

writeWav('soft-impact.wav', 1.1, (t) => {
  const low = Math.sin(2 * Math.PI * (85 - 38 * (t / 1.1)) * t) * Math.exp(-t * 4);
  const transient = (random() * 2 - 1) * Math.exp(-t * 28);
  return low * 0.18 + transient * 0.035;
});
