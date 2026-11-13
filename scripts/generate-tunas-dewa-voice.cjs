const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
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
const outputPath = path.join(outputDirectory, 'tunas-dewa-narration.wav');
const tempPath = path.join(os.tmpdir(), 'tunas-dewa-narration.txt');

fs.mkdirSync(outputDirectory, {recursive: true});
fs.writeFileSync(tempPath, narration, 'utf8');

const result = spawnSync(
  'espeak-ng',
  ['-v', 'id', '-s', '132', '-p', '30', '-a', '180', '-f', tempPath, '-w', outputPath],
  {encoding: 'utf8'},
);

try {
  fs.unlinkSync(tempPath);
} catch {
  // The temporary script is not needed after synthesis.
}

if (result.error) {
  throw new Error('eSpeak NG is required to generate Indonesian narration. Install espeak-ng first.');
}

if (result.status !== 0) {
  throw new Error(`Narration synthesis failed: ${result.stderr || result.stdout || 'unknown error'}`);
}

const wav = fs.readFileSync(outputPath);
if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
  throw new Error('Narration output is not a valid WAV file.');
}

const byteRate = wav.readUInt32LE(28);
const dataBytes = wav.readUInt32LE(40);
const durationSeconds = dataBytes / byteRate;

if (!Number.isFinite(durationSeconds) || durationSeconds < 10 || durationSeconds > 89.5) {
  fs.unlinkSync(outputPath);
  throw new Error(`Narration duration must be between 10 and 89.5 seconds; received ${durationSeconds.toFixed(2)} seconds. Adjust the speech rate or script.`);
}

console.log(`Generated Indonesian Tunas Dewa narration: ${durationSeconds.toFixed(2)} seconds`);
