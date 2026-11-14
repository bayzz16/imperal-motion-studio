const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const narration = [
  'Sebelum menjadi pohon yang rindang, semuanya bermula dari sebuah biji kecil.',
  'Ketika kondisi lingkungan mendukung, biji menyerap air. Embrio di dalamnya mulai aktif. Akar pertama keluar lebih dahulu, tumbuh ke bawah untuk menambatkan tanaman dan menyerap air.',
  'Setelah itu, tunas bergerak ke atas menembus tanah, mencari cahaya matahari. Daun pertama terbuka. Ketika daun sejati berkembang, tanaman mulai membuat makanannya sendiri melalui fotosintesis.',
  'Hari demi hari, akar bercabang dan menjelajah tanah. Batang yang semula lunak perlahan menguat. Daun bertambah, lalu cabang-cabang muda mulai terbentuk.',
  'Saat menjadi pohon muda, batang semakin tebal dan tajuknya melebar. Hujan, panas, dan angin menjadi bagian dari perjalanan panjangnya. Pertumbuhan tidak selalu cepat, dan setiap jenis pohon memiliki waktunya sendiri.',
  'Bertahun-tahun kemudian, dengan kondisi yang mendukung, pohon itu mencapai kedewasaan. Akarnya menopang tubuhnya, batangnya berdiri kokoh, dan cabangnya membentuk naungan.',
  'Dari sebuah biji yang nyaris tak terlihat, kini tumbuh pohon dewasa. Ia memberi tempat hidup bagi makhluk lain dan menjadi bagian penting dari lingkungan.',
  'Begitulah perjalanan sebuah pohon: dimulai dari kecil, tumbuh sedikit demi sedikit, dan terus memberi kehidupan.',
].join('\n\n');

const outputDirectory = path.join(process.cwd(), 'public', 'audio');
const outputPath = path.join(outputDirectory, 'tunas-pohon-narration.mp3');
const tempPath = path.join(outputDirectory, '.tunas-pohon-narration.txt');
const voice = process.env.TTS_VOICE || 'id-ID-ArdiNeural';
const rate = process.env.TTS_RATE || '-4%';
const pitch = process.env.TTS_PITCH || '-2Hz';

fs.mkdirSync(outputDirectory, {recursive: true});
fs.writeFileSync(tempPath, narration, 'utf8');

const executable = process.env.EDGE_TTS_BIN || path.join(
  process.cwd(), '.venv-tts',
  process.platform === 'win32' ? 'Scripts/edge-tts.exe' : 'bin/edge-tts',
);
const result = spawnSync(executable, [
  '--voice', voice, `--rate=${rate}`, `--pitch=${pitch}`,
  '--volume=+0%', '--file', tempPath, '--write-media', outputPath, '--no-progress',
], {encoding: 'utf8'});

try { fs.unlinkSync(tempPath); } catch {}
if (result.error || result.status !== 0) {
  const detail = result.error?.message || result.stderr || result.stdout || 'unknown error';
  throw new Error(`Neural narration generation failed using ${voice}: ${detail}`);
}
if (!fs.existsSync(outputPath)) throw new Error('Narration did not create the expected MP3 file.');
const audio = fs.readFileSync(outputPath);
const validHeader = audio.length >= 10 && (
  audio.toString('ascii', 0, 3) === 'ID3' ||
  (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0)
);
if (audio.length < 10000 || !validHeader) {
  fs.unlinkSync(outputPath);
  throw new Error('Narration output is not a valid MP3 stream or is unexpectedly small.');
}
console.log(`Generated Indonesian neural narration: voice=${voice}, size=${audio.length} bytes`);
