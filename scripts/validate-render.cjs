'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {
  buildLoudnormMeasurementFilter,
  parseLoudnormStats,
  compareWithEbuR128Reference,
} = require('./audio-loudness.cjs');

const parseRational = (value) => {
  if (typeof value !== 'string' || !value.includes('/')) return Number(value);
  const [numerator, denominator] = value.split('/').map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return NaN;
  return numerator / denominator;
};

const validateProbeData = (data, options = {}) => {
  const streams = Array.isArray(data?.streams) ? data.streams : [];
  const video = streams.find((stream) => stream.codec_type === 'video');
  const audio = streams.find((stream) => stream.codec_type === 'audio');
  const duration = Number(data?.format?.duration);
  const maxAvDriftSeconds = options.maxAvDriftSeconds ?? 0.5;

  if (!video) throw new Error('MP4 has no video stream.');
  if (!audio) throw new Error('MP4 has no audio stream.');
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('MP4 duration is invalid.');
  if (!(video.width > 0 && video.height > 0)) throw new Error('Video dimensions are invalid.');

  const fps = parseRational(video.avg_frame_rate || video.r_frame_rate);
  if (!Number.isFinite(fps) || fps <= 0 || fps > 120) {
    throw new Error('Video frame rate is invalid or outside the supported 0–120 FPS range.');
  }

  const videoDuration = Number(video.duration);
  const audioDuration = Number(audio.duration);
  if (Number.isFinite(videoDuration) && Number.isFinite(audioDuration) &&
      Math.abs(videoDuration - audioDuration) > maxAvDriftSeconds) {
    const drift = Math.abs(videoDuration - audioDuration).toFixed(3);
    throw new Error('Audio/video duration drift is too large: ' + drift + ' seconds.');
  }

  return {
    duration,
    width: video.width,
    height: video.height,
    fps,
    videoCodec: video.codec_name || 'unknown',
    audioCodec: audio.codec_name || 'unknown',
    avDriftSeconds: Number.isFinite(videoDuration) && Number.isFinite(audioDuration)
      ? Math.abs(videoDuration - audioDuration)
      : null,
  };
};

const parseQualityDiagnostics = (log) => {
  const blackSegments = [...log.matchAll(/black_start:([\d.]+)\s+black_end:([\d.]+)\s+black_duration:([\d.]+)/g)]
    .map((match) => ({start: Number(match[1]), end: Number(match[2]), duration: Number(match[3])}));
  const freezeStarts = [...log.matchAll(/freeze_start:([\d.]+)/g)].map((match) => Number(match[1]));
  const freezeEnds = [...log.matchAll(/freeze_end:([\d.]+)/g)].map((match) => Number(match[1]));
  const volumeMatch = log.match(/mean_volume:\s*(-?inf|[-\d.]+)\s*dB/i);
  return {
    blackSegments,
    freezeStarts,
    freezeEnds,
    meanVolumeDb: volumeMatch ? volumeMatch[1] : null,
    loudness: parseLoudnormStats(log),
  };
};

const main = () => {
  const file = process.env.OUTPUT_PATH ||
    path.join(process.cwd(), 'out', process.env.OUTPUT_FILENAME || 'tunas-dewa.mp4');
  if (!fs.existsSync(file)) throw new Error('Rendered MP4 not found: ' + file);

  const stat = fs.statSync(file);
  if (!stat.isFile() || stat.size < 20000) {
    throw new Error('Rendered MP4 is empty or unexpectedly small: ' + stat.size + ' bytes');
  }

  const probe = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,duration,avg_frame_rate,r_frame_rate', '-of', 'json', file],
    {encoding: 'utf8'},
  );
  if (probe.error || probe.status !== 0) {
    throw new Error(probe.error?.message || probe.stderr || 'ffprobe failed');
  }

  const summary = validateProbeData(JSON.parse(probe.stdout));
  const diagnostics = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-i', file,
      '-vf', 'blackdetect=d=0.75:pix_th=0.01,freezedetect=n=-50dB:d=2',
      '-af', 'volumedetect,' + buildLoudnormMeasurementFilter(),
      '-f', 'null', '-',
    ],
    {encoding: 'utf8', maxBuffer: 8 * 1024 * 1024},
  );
  if (diagnostics.error || diagnostics.status !== 0) {
    throw new Error(diagnostics.error?.message || diagnostics.stderr || 'Full-stream quality scan failed');
  }

  const quality = parseQualityDiagnostics(diagnostics.stderr || '');
  console.log('MP4 structural validation passed');
  console.log('File: ' + file);
  console.log('Size: ' + (stat.size / 1024 / 1024).toFixed(2) + ' MiB');
  console.log('Duration: ' + summary.duration.toFixed(2) + ' s');
  console.log('Resolution: ' + summary.width + 'x' + summary.height);
  console.log('Frame rate: ' + summary.fps.toFixed(3) + ' FPS');
  console.log('Video codec: ' + summary.videoCodec);
  console.log('Audio codec: ' + summary.audioCodec);
  console.log('Audio/video drift: ' + (summary.avDriftSeconds === null ? 'not reported by ffprobe' : summary.avDriftSeconds.toFixed(3) + ' s'));
  console.log('Full-stream decode scan completed');
  console.log('Detected long black segments: ' + quality.blackSegments.length);
  console.log('Detected freeze starts: ' + quality.freezeStarts.length);
  console.log('Mean audio volume: ' + (quality.meanVolumeDb ?? 'not reported'));

  if (quality.loudness) {
    const measured = quality.loudness;
    const reference = compareWithEbuR128Reference(measured);
    console.log('Integrated loudness: ' + (measured.integratedLufs === null ? 'not measurable (silence or unavailable)' : measured.integratedLufs.toFixed(2) + ' LUFS'));
    console.log('Loudness range: ' + (measured.loudnessRangeLu === null ? 'not reported' : measured.loudnessRangeLu.toFixed(2) + ' LU'));
    console.log('True peak: ' + (measured.truePeakDbtp === null ? 'not measurable (silence or unavailable)' : measured.truePeakDbtp.toFixed(2) + ' dBTP'));
    console.log('EBU R 128 reference: -23 LUFS integrated; -1 dBTP maximum true peak for generic PCM production');
    if (reference.integratedDeltaLufs !== null) {
      console.log('Integrated loudness offset from EBU reference: ' + (reference.integratedDeltaLufs > 0 ? '+' : '') + reference.integratedDeltaLufs.toFixed(2) + ' LU');
    }
    if (reference.truePeakWithinReference === false) {
      console.warn('True peak is above the EBU R 128 generic PCM production reference. Check the intended delivery profile; no automatic normalization was applied.');
    }
  } else {
    console.warn('EBU R 128 loudness metrics were not reported by FFmpeg; check that the installed FFmpeg build supports the loudnorm filter.');
  }

  if (quality.blackSegments.length || quality.freezeStarts.length) {
    console.warn('Quality scan found possible black/frozen sections. Review them; detections can be intentional scene holds or fades.');
  }
  if (quality.meanVolumeDb === '-inf') {
    console.warn('Audio stream is present but its measured mean volume is silent.');
  }
};

if (require.main === module) main();

module.exports = {parseRational, validateProbeData, parseQualityDiagnostics};
