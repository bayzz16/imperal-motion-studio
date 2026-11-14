const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const narration = [
  'Setiap sesuatu yang besar, selalu memiliki awal yang kecil.',
  'Dahulu, ia hanyalah sebuah benih. Sebuah harapan yang belum tahu seberapa jauh ia akan tumbuh.',
  'Dengan keberanian untuk mencoba, benih itu mulai bertumbuh. Ide sederhana berubah menjadi rencana, lalu menjadi langkah nyata.',
  'Namun, impian tidak tumbuh hanya dengan satu kekuatan. Delapan keahlian yang berbeda hadir, saling melengkapi, dan bergerak menuju satu tujuan.',
  'Perjalanan itu tidak selalu mudah. Angin, hujan, kesalahan, dan kegagalan datang menguji kekuatan akarnya.',
  'Tetapi mereka tidak berhenti. Mereka belajar, memperbaiki, saling membantu, dan mencoba kembali dengan cara yang lebih baik.',
  'Sedikit demi sedikit, akar menjadi kuat. Batang menjulang. Cabang-cabang terbuka menyambut cahaya.',
  'Apa yang dahulu tampak kecil, kini tumbuh melampaui batas yang pernah dibayangkan.',
  'Inilah hasil dari keberanian, kerja sama, dan tekad untuk terus berkembang.',
  'Dari Tunas Kecil... kini tumbuh menjadi TUNAS DEWA.',
  'Bertumbuh bersama. Melampaui batas. Menciptakan masa depan.',
].join('\n\n');

const outputDirectory = path.join(process.cwd(), 'public', 'audio');
const outputPath = path.join(outputDirectory, 'tunas-dewa-narration.mp3');
const tempPath = path.join(outputDirectory, '.tunas-dewa-narration.txt');
const voice = process.env.TTS_VOICE || 'id-ID-ArdiNeural';
const rate = process.env.TTS_RATE || '-4%';
const pitch = process.env.TTS_PITCH || '-2Hz';

fs.mkdirSync(outputDirectory, {recursive: true});
fs.writeFileSync(tempPath, narration, 'utf8');

const executable = process.env.EDGE_TTS_BIN || path.join(
  process.cwd(),
  '.venv-tts',
  process.platform === 'win32' ? 'Scripts/edge-tts.exe' : 'bin/edge-tts',
);
const args = [
  '--voice', voice,
  `--rate=${rate}`,
  `--pitch=${pitch}`,
  '--volume=+0%',
  '--file', tempPath,
  '--write-media', outputPath,
  '--no-progress',
];

const result = spawnSync(executable, args, {encoding: 'utf8'});

try {
  fs.unlinkSync(tempPath);
} catch {
  // The temporary narration text is no longer needed.
}

if (result.error || result.status !== 0) {
  const detail = result.error?.message || result.stderr || result.stdout || 'unknown error';
  throw new Error(
    `Neural narration generation failed using ${voice}: ${detail}. Install edge-tts in .venv-tts and ensure the build has internet access.`,
  );
}

if (!fs.existsSync(outputPath)) {
  throw new Error('Neural narration did not create the expected MP3 file.');
}

const audio = fs.readFileSync(outputPath);
const hasId3Header = audio.length >= 10 && audio.toString('ascii', 0, 3) === 'ID3';
const hasMpegFrameHeader = audio.length >= 2 && audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;

if (audio.length < 10_000 || (!hasId3Header && !hasMpegFrameHeader)) {
  fs.unlinkSync(outputPath);
  throw new Error('Narration output is not a valid MP3 stream or is unexpectedly small.');
}

console.log(
  `Generated Indonesian neural narration: voice=${voice}, rate=${rate}, pitch=${pitch}, size=${audio.length} bytes`,
);
