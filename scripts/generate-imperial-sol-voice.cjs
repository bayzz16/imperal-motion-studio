const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const lines = [
  'Di balik setiap cakrawala, selalu ada dunia yang belum kita kenal.',
  'Dunia yang menyimpan ruang untuk memulai, bertemu, dan menciptakan cerita.',
  'Tak semua kisah harus diungkap sejak awal. Ada rahasia yang menunggu waktunya.',
  'Ada perjalanan yang belum dimulai. Dan ada nama yang sebentar lagi akan kamu kenal.',
  'Imperial.',
  'Bersama Slice of Life.',
  'Dua dunia, satu cerita.',
  'Inilah Imperial dan Slice of Life. Segera hadir.',
];
const outputDirectory = path.join(process.cwd(), 'public', 'audio');
const outputPath = path.join(outputDirectory, 'imperial-sol-narration.mp3');
const voice = process.env.TTS_VOICE || 'id-ID-ArdiNeural';
const rate = process.env.TTS_RATE || '-4%';
const pitch = process.env.TTS_PITCH || '-2Hz';
const executable = process.env.EDGE_TTS_BIN || path.join(process.cwd(), '.venv-tts', process.platform === 'win32' ? 'Scripts/edge-tts.exe' : 'bin/edge-tts');
const run = (command, args) => {
  const result = spawnSync(command, args, {encoding: 'utf8'});
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || result.stdout || command + ' failed');
  return result.stdout.trim();
};
fs.mkdirSync(outputDirectory, {recursive: true});
const segmentPaths = [];
const segmentDurations = [];
for (let i = 0; i < lines.length; i++) {
  const segmentPath = path.join(outputDirectory, 'imperial-sol-line-' + String(i + 1).padStart(2, '0') + '.mp3');
  run(executable, ['--voice', voice, '--rate=' + rate, '--pitch=' + pitch, '--volume=+0%', '--text', lines[i], '--write-media', segmentPath, '--no-progress']);
  const bytes = fs.statSync(segmentPath).size;
  if (bytes < 3000) throw new Error('Narration segment ' + (i + 1) + ' is unexpectedly small (' + bytes + ' bytes).');
  const duration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', segmentPath]));
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Could not measure narration segment ' + (i + 1));
  segmentPaths.push(segmentPath);
  segmentDurations.push(duration);
}
const silencePath = path.join(outputDirectory, 'imperial-sol-pause.mp3');
run('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=24000:cl=mono', '-t', '0.45', '-ar', '24000', '-ac', '1', '-b:a', '48k', silencePath]);
const concatList = path.join(outputDirectory, 'imperial-sol-concat.txt');
const orderedPaths = [];
for (let i = 0; i < segmentPaths.length; i++) {
  orderedPaths.push(segmentPaths[i]);
  if (i < segmentPaths.length - 1) orderedPaths.push(silencePath);
}
fs.writeFileSync(concatList, orderedPaths.map(p => "file '" + p.replace(/'/g, "'\\''") + "'").join('\n') + '\n');
run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-ar', '24000', '-ac', '1', '-b:a', '48k', outputPath]);
const totalDuration = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', outputPath]));
if (!Number.isFinite(totalDuration) || totalDuration < 15 || fs.statSync(outputPath).size < 10000) {
  throw new Error('Final narration failed duration/size validation.');
}
const fps = 30;
const leadInFrames = 18;
const gapFrames = Math.round(0.45 * fps);
let cursor = leadInFrames;
const starts = segmentDurations.map((duration, index) => {
  const start = cursor;
  cursor += Math.ceil(duration * fps);
  if (index < segmentDurations.length - 1) cursor += gapFrames;
  return start;
});
const durationFrames = Math.ceil(totalDuration * fps) + 180;
const timingPath = path.join(process.cwd(), 'src', 'generated', 'imperial-sol-timing.ts');
fs.mkdirSync(path.dirname(timingPath), {recursive: true});
fs.writeFileSync(timingPath, '// Generated from measured neural narration segments.\nexport const IMPERIAL_SOL_SCENE_STARTS = ' + JSON.stringify(starts) + ' as const;\nexport const IMPERIAL_SOL_DURATION_FRAMES = ' + durationFrames + ';\n');
for (const p of [...segmentPaths, silencePath]) fs.unlinkSync(p);
fs.unlinkSync(concatList);
console.log('Narration verified: ' + totalDuration.toFixed(2) + 's across ' + lines.length + ' independently generated segments.');
console.log('Scene starts (frames): ' + starts.join(', '));
console.log('Composition duration: ' + (durationFrames / fps).toFixed(2) + 's');
