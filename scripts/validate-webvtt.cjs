'use strict';

const fs = require('node:fs');

const TIMESTAMP = /^(?:(\\d{2,}):)?([0-5]\\d):([0-5]\\d)\\.(\\d{3})$/;

function parseTimestamp(value) {
  const match = TIMESTAMP.exec(value);
  if (!match) return null;
  const hours = match[1] === undefined ? 0 : Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number(match[4]);
  const total = ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
  return Number.isSafeInteger(total) ? total : null;
}

function validateWebVtt(input, options = {}) {
  const errors = [];
  const warnings = [];
  if (typeof input !== 'string') {
    return {valid: false, cueCount: 0, errors: [{code: 'input.type', message: 'WebVTT input must be text.'}], warnings};
  }

  const text = input.replace(/^\\uFEFF/, '').replace(/\\r\\n?/g, '\\n');
  const lines = text.split('\\n');
  if (lines[0] !== 'WEBVTT' && !/^WEBVTT(?:[ \\t].*)?$/.test(lines[0] || '')) {
    errors.push({code: 'header.missing', line: 1, message: 'File must begin with WEBVTT header.'});
  }

  const cues = [];
  const identifiers = new Set();
  let index = 1;
  let previousStart = -1;
  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === '') index++;
    if (index >= lines.length) break;
    const lineNumber = index + 1;
    if (/^(NOTE|STYLE|REGION)(?:[ \\t]|$)/.test(lines[index])) {
      while (index < lines.length && lines[index].trim() !== '') index++;
      continue;
    }

    let identifier = null;
    if (!lines[index].includes('-->')) {
      identifier = lines[index];
      if (!identifier || identifier.includes('-->')) {
        errors.push({code: 'cue.identifier', line: lineNumber, message: 'Invalid cue identifier.'});
      }
      if (identifiers.has(identifier)) {
        errors.push({code: 'cue.identifier.duplicate', line: lineNumber, message: 'Cue identifiers must be unique.'});
      }
      identifiers.add(identifier);
      index++;
      if (index >= lines.length) {
        errors.push({code: 'cue.timing.missing', line: lineNumber, message: 'Cue identifier is not followed by timing.'});
        break;
      }
    }

    const timingLine = lines[index];
    const timingLineNumber = index + 1;
    const timing = /^(\\S+)\\s+-->\\s+(\\S+)(?:[ \\t]+(.*))?$/.exec(timingLine);
    if (!timing) {
      errors.push({code: 'cue.timing.invalid', line: timingLineNumber, message: 'Invalid cue timing line.'});
      while (index < lines.length && lines[index].trim() !== '') index++;
      continue;
    }
    const start = parseTimestamp(timing[1]);
    const end = parseTimestamp(timing[2]);
    if (start === null || end === null) {
      errors.push({code: 'timestamp.invalid', line: timingLineNumber, message: 'Timestamp must use mm:ss.mmm or hh:mm:ss.mmm with valid ranges.'});
    } else {
      if (start < previousStart) errors.push({code: 'cue.order', line: timingLineNumber, message: 'Cue start times must be non-decreasing.'});
      if (end <= start) errors.push({code: 'cue.duration', line: timingLineNumber, message: 'Cue end must be later than cue start.'});
      previousStart = start;
      cues.push({identifier, startMs: start, endMs: end, line: timingLineNumber});
    }
    index++;
    const payload = [];
    while (index < lines.length && lines[index].trim() !== '') {
      if (lines[index].includes('-->')) {
        errors.push({code: 'cue.payload.arrow', line: index + 1, message: 'Cue payload must not contain -->.'});
      }
      payload.push(lines[index]);
      index++;
    }
    if (!payload.some((line) => line.trim() !== '')) {
      errors.push({code: 'cue.payload.empty', line: timingLineNumber, message: 'Cue payload must not be empty.'});
    }
  }

  if (Number.isFinite(options.durationMs) && options.durationMs >= 0) {
    for (const cue of cues) {
      if (cue.endMs > options.durationMs) warnings.push({code: 'cue.outside.duration', line: cue.line, message: 'Cue ends after the supplied media duration.'});
    }
  }

  return {valid: errors.length === 0, cueCount: cues.length, errors, warnings};
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/validate-webvtt.cjs <file.vtt> [duration-ms]');
    process.exitCode = 2;
    return;
  }
  let input;
  try { input = fs.readFileSync(file, 'utf8'); }
  catch (error) {
    console.error('Could not read WebVTT file: ' + error.message);
    process.exitCode = 2;
    return;
  }
  const durationMs = process.argv[3] === undefined ? undefined : Number(process.argv[3]);
  const report = validateWebVtt(input, {durationMs});
  console.log(JSON.stringify(report, null, 2));
  if (!report.valid) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {parseTimestamp, validateWebVtt};
