'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const DEFAULTS = Object.freeze({targetI: -23, targetLra: 7, targetTp: -2});
const RANGES = Object.freeze({
  targetI: [-70, -5],
  targetLra: [1, 50],
  targetTp: [-9, 0],
});

function finiteNumber(value) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return null;
  return Number(value);
}

function parseLoudnormJson(stderr) {
  if (typeof stderr !== 'string') throw new TypeError('FFmpeg stderr must be text.');
  const blocks = [...stderr.matchAll(/\{[^{}]*"input_i"[^{}]*\}/g)];
  if (blocks.length === 0) throw new Error('FFmpeg loudnorm JSON measurements were not found.');
  let raw;
  try {
    raw = JSON.parse(blocks[blocks.length - 1][0]);
  } catch (error) {
    throw new Error('Could not parse FFmpeg loudnorm JSON: ' + error.message);
  }
  const keys = ['input_i', 'input_lra', 'input_tp', 'input_thresh', 'target_offset'];
  const measurements = {};
  for (const key of keys) measurements[key] = finiteNumber(raw[key]);
  if (measurements.input_i === null && measurements.input_tp === null) {
    throw new Error('FFmpeg loudnorm JSON did not contain usable loudness measurements.');
  }
  return measurements;
}

function validateTargets(targets) {
  for (const key of Object.keys(RANGES)) {
    const value = finiteNumber(targets[key]);
    const [min, max] = RANGES[key];
    if (value === null || value < min || value > max) {
      throw new RangeError(key + ' must be a number between ' + min + ' and ' + max + '.');
    }
  }
  return {targetI: Number(targets.targetI), targetLra: Number(targets.targetLra), targetTp: Number(targets.targetTp)};
}

function buildFilter(targets) {
  const checked = validateTargets(targets);
  return 'loudnorm=I=' + checked.targetI + ':LRA=' + checked.targetLra +
    ':TP=' + checked.targetTp + ':print_format=json';
}

function parseArgs(argv) {
  const targets = {...DEFAULTS};
  let file = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') return {help: true};
    const option = {'--target-i': 'targetI', '--target-lra': 'targetLra', '--target-tp': 'targetTp'}[arg];
    if (option) {
      if (i + 1 >= argv.length) throw new Error('Missing value for ' + arg);
      targets[option] = finiteNumber(argv[++i]);
      if (targets[option] === null) throw new Error('Value for ' + arg + ' must be numeric.');
      continue;
    }
    if (arg.startsWith('-')) throw new Error('Unknown option: ' + arg);
    if (file !== null) throw new Error('Only one input media file may be supplied.');
    file = arg;
  }
  if (!file) throw new Error('Input media file is required.');
  return {file, targets: validateTargets(targets)};
}

function analyzeFile(file, targets = DEFAULTS, options = {}) {
  const absolute = path.resolve(file);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    throw new Error('Input media file does not exist or is not a file: ' + absolute);
  }
  const checked = validateTargets(targets);
  const filter = buildFilter(checked);
  const result = spawnSync(options.ffmpegPath || 'ffmpeg', [
    '-hide_banner', '-nostats', '-i', absolute, '-vn',
    '-af', filter, '-f', 'null', '-',
  ], {encoding: 'utf8', maxBuffer: 8 * 1024 * 1024});
  if (result.error) throw new Error('Could not run FFmpeg: ' + result.error.message);
  if (result.status !== 0) {
    throw new Error((result.stderr || 'FFmpeg loudness analysis failed.').trim());
  }
  const measurements = parseLoudnormJson(result.stderr || '');
  return {
    file: absolute,
    mode: 'analysis-only',
    target: {integratedLufs: checked.targetI, loudnessRangeLufs: checked.targetLra, maxTruePeakDbtp: checked.targetTp},
    measurements: {
      integratedLufs: measurements.input_i,
      loudnessRangeLufs: measurements.input_lra,
      maxTruePeakDbtp: measurements.input_tp,
      thresholdLufs: measurements.input_thresh,
      targetOffsetDb: measurements.target_offset,
    },
    comparison: {
      integratedLoudnessDeltaLu: measurements.input_i === null ? null : Number((checked.targetI - measurements.input_i).toFixed(2)),
      truePeakOverTargetDb: measurements.input_tp === null ? null : Number((measurements.input_tp - checked.targetTp).toFixed(2)),
    },
    note: 'No output media was written. Targets are comparison references, not a platform delivery certification.',
  };
}

function main(argv = process.argv.slice(2)) {
  try {
    const parsed = parseArgs(argv);
    if (parsed.help) {
      console.log('Usage: node scripts/analyze-loudness.cjs <media-file> [--target-i -23] [--target-lra 7] [--target-tp -2]');
      console.log('Analysis only; requires FFmpeg with the loudnorm filter. Does not write or normalize media.');
      return;
    }
    console.log(JSON.stringify(analyzeFile(parsed.file, parsed.targets), null, 2));
  } catch (error) {
    console.error('Audio loudness preflight failed: ' + error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = {DEFAULTS, RANGES, finiteNumber, parseLoudnormJson, validateTargets, buildFilter, parseArgs, analyzeFile};
