'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  EBU_R128_REFERENCE,
  parseFiniteMetric,
  parseLoudnormStats,
  buildLoudnormMeasurementFilter,
  compareWithEbuR128Reference,
} = require('./audio-loudness.cjs');

test('parses finite numeric metrics and rejects silence or malformed values', () => {
  assert.equal(parseFiniteMetric('-23.4'), -23.4);
  assert.equal(parseFiniteMetric(0), 0);
  assert.equal(parseFiniteMetric('-inf'), null);
  assert.equal(parseFiniteMetric('not-a-number'), null);
  assert.equal(parseFiniteMetric(undefined), null);
});

test('parses FFmpeg loudnorm input measurements from mixed diagnostic output', () => {
  const log = [
    '[Parsed_volumedetect] mean_volume: -18.5 dB',
    '{',
    '  "input_i" : "-21.05",',
    '  "input_tp" : "-1.24",',
    '  "input_lra" : "4.20",',
    '  "input_thresh" : "-31.05",',
    '  "output_i" : "-23.03"',
    '}',
  ].join('\n');

  assert.deepEqual(parseLoudnormStats(log), {
    integratedLufs: -21.05,
    truePeakDbtp: -1.24,
    loudnessRangeLu: 4.2,
    thresholdLufs: -31.05,
  });
});

test('returns null when FFmpeg did not provide a valid loudnorm block', () => {
  assert.equal(parseLoudnormStats('mean_volume: -18.5 dB'), null);
  assert.equal(parseLoudnormStats('{"input_i": "-21.0"'), null);
  assert.equal(parseLoudnormStats(null), null);
});

test('preserves unavailable measurements instead of turning them into zero', () => {
  const parsed = parseLoudnormStats('{"input_i":"-inf","input_tp":"-inf","input_lra":"0.00","input_thresh":"-70.00"}');
  assert.deepEqual(parsed, {
    integratedLufs: null,
    truePeakDbtp: null,
    loudnessRangeLu: 0,
    thresholdLufs: -70,
  });
});

test('compares measurements with EBU R128 references without enforcing a universal target', () => {
  assert.deepEqual(EBU_R128_REFERENCE, {integratedLufs: -23, maximumTruePeakDbtp: -1});
  assert.deepEqual(compareWithEbuR128Reference({integratedLufs: -21.5, truePeakDbtp: -1.2}), {
    integratedTargetLufs: -23,
    integratedDeltaLufs: 1.5,
    maximumTruePeakDbtp: -1,
    truePeakWithinReference: true,
  });
  assert.deepEqual(compareWithEbuR128Reference({integratedLufs: -23, truePeakDbtp: -0.7}), {
    integratedTargetLufs: -23,
    integratedDeltaLufs: 0,
    maximumTruePeakDbtp: -1,
    truePeakWithinReference: false,
  });
  assert.deepEqual(compareWithEbuR128Reference({integratedLufs: null, truePeakDbtp: null}), {
    integratedTargetLufs: -23,
    integratedDeltaLufs: null,
    maximumTruePeakDbtp: -1,
    truePeakWithinReference: null,
  });
});

test('builds a measurement filter with explicit JSON diagnostics', () => {
  assert.equal(buildLoudnormMeasurementFilter(), 'loudnorm=I=-23:LRA=7:TP=-1:print_format=json');
});
