'use strict';

const fs = require('node:fs');
const {parseTimestamp, validateWebVtt} = require('./validate-webvtt.cjs');

const PROFILES = Object.freeze({
  adult: 17,
  children: 13,
});

function countGraphemes(text, locale = 'und') {
  if (typeof Intl.Segmenter !== 'function') {
    throw new Error('Intl.Segmenter is required (use Node.js 22 or newer).');
  }
  const segmenter = new Intl.Segmenter(locale, {granularity: 'grapheme'});
  let count = 0;
  for (const _ of segmenter.segment(text)) count++;
  return count;
}

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, value) => {
    const lower = value.toLowerCase();
    const named = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0'};
    if (Object.hasOwn(named, lower)) return named[lower];
    const codePoint = lower.startsWith('#x')
      ? Number.parseInt(lower.slice(2), 16)
      : Number.parseInt(lower.slice(1), 10);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)) return entity;
    return String.fromCodePoint(codePoint);
  });
}

function visibleCueText(payload) {
  return decodeEntities(payload
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, ''));
}

function extractCues(input) {
  const validation = validateWebVtt(input);
  if (!validation.valid) {
    const error = new Error('WebVTT structural validation failed.');
    error.validation = validation;
    throw error;
  }

  const normalized = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const blocks = normalized.split(/\n{2,}/);
  const cues = [];
  for (const block of blocks.slice(1)) {
    const lines = block.split('\n');
    if (!lines.length || /^(NOTE|STYLE|REGION)(?:[ \t]|$)/.test(lines[0])) continue;
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) continue;
    const timing = /^(\S+)\s+-->\s+(\S+)(?:[ \t]+.*)?$/.exec(lines[timingIndex]);
    if (!timing) continue;
    const startMs = parseTimestamp(timing[1]);
    const endMs = parseTimestamp(timing[2]);
    if (startMs === null || endMs === null || endMs <= startMs) continue;
    const payload = lines.slice(timingIndex + 1).join('\n');
    cues.push({startMs, endMs, text: visibleCueText(payload), line: timingIndex + 1});
  }
  return cues;
}

function analyzeReadingSpeed(input, options = {}) {
  const profile = options.profile || 'adult';
  if (!Object.hasOwn(PROFILES, profile)) {
    throw new RangeError('profile must be "adult" or "children".');
  }
  const maxCps = options.maxCps === undefined ? PROFILES[profile] : Number(options.maxCps);
  if (!Number.isFinite(maxCps) || maxCps <= 0 || maxCps > 100) {
    throw new RangeError('maxCps must be a number greater than 0 and at most 100.');
  }
  const locale = options.locale || 'und';
  const cues = extractCues(input).map((cue, index) => {
    const durationSeconds = (cue.endMs - cue.startMs) / 1000;
    const graphemes = countGraphemes(cue.text, locale);
    const cps = graphemes / durationSeconds;
    return {
      cue: index + 1,
      startMs: cue.startMs,
      endMs: cue.endMs,
      durationSeconds: Number(durationSeconds.toFixed(3)),
      visibleCharacters: graphemes,
      charactersPerSecond: Number(cps.toFixed(2)),
      maxCps,
      overLimit: cps > maxCps,
    };
  });
  return {
    profile,
    locale,
    maxCps,
    cueCount: cues.length,
    withinLimit: cues.every((cue) => !cue.overLimit),
    cues,
  };
}

function main(argv = process.argv.slice(2)) {
  let file = null;
  let profile = 'adult';
  let maxCps;
  let locale = 'und';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/analyze-subtitle-cps.cjs <file.vtt> [--profile adult|children] [--max-cps N] [--locale BCP-47]');
      return;
    }
    if (arg === '--profile' || arg === '--max-cps' || arg === '--locale') {
      if (i + 1 >= argv.length) throw new Error('Missing value for ' + arg);
      const value = argv[++i];
      if (arg === '--profile') profile = value;
      else if (arg === '--max-cps') maxCps = Number(value);
      else locale = value;
      continue;
    }
    if (arg.startsWith('-')) throw new Error('Unknown option: ' + arg);
    if (file !== null) throw new Error('Only one subtitle file may be supplied.');
    file = arg;
  }
  if (!file) throw new Error('Input WebVTT file is required.');
  const input = fs.readFileSync(file, 'utf8');
  const report = analyzeReadingSpeed(input, {profile, maxCps, locale});
  console.log(JSON.stringify(report, null, 2));
  if (!report.withinLimit) process.exitCode = 1;
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error('Subtitle reading-speed preflight failed: ' + error.message);
    if (error.validation) console.error(JSON.stringify(error.validation, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  PROFILES, countGraphemes, decodeEntities, visibleCueText,
  extractCues, analyzeReadingSpeed,
};
