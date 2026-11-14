const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const narration = [
  'Di balik setiap cakrawala, selalu ada dunia yang belum kita kenal.',
  'Dunia yang menyimpan ruang untuk memulai, bertemu, dan menciptakan cerita.',
  'Tak semua kisah harus diungkap sejak awal. Ada rahasia yang menunggu waktunya.',
  'Ada perjalanan yang belum dimulai. Dan ada nama yang sebentar lagi akan kamu kenal.',
  'Imperial.',
  'Bersama Slice of Life.',
  'Dua dunia, satu cerita.',
  'Inilah Imperial dan Slice of Life. Segera hadir.',
].join('\n\n');

const outputDirectory = path.join(process.cwd(), 'public', 'audio');
const outputPath = path.join(outputDirectory, 'imperial-sol-narration.mp3');
const tempPath = path.join(outputDirectory, '.imperial-sol-narration.txt');
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
  // Best-effort cleanup of temporary narration text.
}

if (result.error || result.status !== 0) {
  const detail = result.error?.message || result.stderr || result.stdout || 'unknown error';
  throw new Error(`Imperial × Slice of Life neural narration failed using ${voice}: ${detail}`);
}

if (!fs.existsSync(outputPath)) {
  throw new Error('Neural narration did not create the expected MP3 file.');
}

const audio = fs.readFileSync(outputPath);
const hasId3 = audio.length >= 10 && audio.toString('ascii', 0, 3) === 'ID3';
const hasMpegFrame = audio.length >= 2 && audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;
if (audio.length < 10_000 || (!hasId3 && !hasMpegFrame)) {
  fs.unlinkSync(outputPath);
  throw new Error('Narration output is not a valid MP3 stream or is unexpectedly small.');
}

console.log(`Generated teaser narration: voice=${voice}, rate=${rate}, pitch=${pitch}, size=${audio.length} bytes`);
