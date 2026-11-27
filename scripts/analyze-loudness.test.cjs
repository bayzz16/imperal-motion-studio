'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseLoudnormJson, validateTargets, buildFilter, parseArgs, finiteNumber,
} = require('./analyze-loudness.cjs');

const report = `[Parsed_loudnorm_0 @ 0x1] {
  "input_i" : "-18.40",
  "input_tp" : "-1.20",
  "input_lra" : "5.10",
  "input_thresh" : "-28.40",
  "output_i" : "-23.00",
  "output_tp" : "-2.00",
  "target_offset" : "-4.60"
}
FFmpeg finished`;

test('extracts FFmpeg input loudness metrics from diagnostic text', () => {
  assert.deepEqual(parseLoudnormJson(report), {
    input_i: -18.4, input_lra: 5.1, input_tp: -1.2, input_thresh: -28.4, target_offset: -4.6,
  });
});

test('uses the last loudnorm report when stderr contains more than one', () => {
  const second = report.replace('"input_i" : "-18.40"', '"input_i" : "-21.00"');
  assert.equal(parseLoudnormJson(report + second).input_i, -21);
});

test('handles non-finite measurement strings without fabricating values', () => {
  const silent = report.replace('"input_i" : "-18.40"', '"input_i" : "-inf"');
  assert.equal(parseLoudnormJson(silent).input_i, null);
});

test('rejects missing or unusable loudnorm report', () => {
  assert.throws(() => parseLoudnormJson('no measurement'), /not found/);
  assert.throws(() => parseLoudnormJson(report.replace('"input_i" : "-18.40"', '"input_i" : "-inf"').replace('"input_tp" : "-1.20"', '"input_tp" : "-inf"')), /usable/);
});

test('validates targets and constructs numeric-only FFmpeg filter', () => {
  assert.equal(buildFilter({targetI: -16, targetLra: 11, targetTp: -1}), 'loudnorm=I=-16:LRA=11:TP=-1:print_format=json');
  assert.throws(() => validateTargets({targetI: -120, targetLra: 7, targetTp: -2}), RangeError);
  assert.throws(() => validateTargets({targetI: -23, targetLra: 0, targetTp: -2}), RangeError);
  assert.throws(() => validateTargets({targetI: -23, targetLra: 7, targetTp: 1}), RangeError);
});

test('parses input and explicit target options', () => {
  assert.deepEqual(parseArgs(['film.mp4', '--target-i', '-16', '--target-lra', '9', '--target-tp', '-1']), {
    file: 'film.mp4', targets: {targetI: -16, targetLra: 9, targetTp: -1},
  });
  assert.equal(parseArgs(['--help']).help, true);
  assert.throws(() => parseArgs([]), /required/);
  assert.throws(() => parseArgs(['film.mp4', '--unknown']), /Unknown option/);
  assert.throws(() => parseArgs(['film.mp4', '--target-i', 'bad']), /numeric/);
});

test('finiteNumber preserves null for invalid values', () => {
  assert.equal(finiteNumber('-inf'), null);
  assert.equal(finiteNumber(''), null);
  assert.equal(finiteNumber('3.25'), 3.25);
});
