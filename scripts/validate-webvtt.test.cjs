'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {parseTimestamp, validateWebVtt} = require('./validate-webvtt.cjs');

const valid = 'WEBVTT\n\n00:00.000 --> 00:02.000\nHello\n\n00:02.000 --> 00:04.250\nWorld\n';

test('parses valid minute and hour timestamps', () => {
  assert.equal(parseTimestamp('01:02.003'), 62003);
  assert.equal(parseTimestamp('01:02:03.004'), 3723004);
  assert.equal(parseTimestamp('00:60.000'), null);
});

test('accepts BOM and CRLF and valid cues', () => {
  assert.equal(validateWebVtt('\uFEFF' + valid.replace(/\n/g, '\r\n')).valid, true);
});

test('rejects missing header and malformed timestamps', () => {
  assert.equal(validateWebVtt('00:00.000 --> 00:01.000\nText').errors[0].code, 'header.missing');
  assert.ok(validateWebVtt('WEBVTT\n\n00:60.000 --> 00:61.000\nText').errors.some(e => e.code === 'timestamp.invalid'));
});

test('requires end after start and ordered cue starts', () => {
  assert.ok(validateWebVtt('WEBVTT\n\n00:02.000 --> 00:02.000\nA\n\n00:01.000 --> 00:03.000\nB').errors.some(e => e.code === 'cue.duration'));
  assert.ok(validateWebVtt('WEBVTT\n\n00:02.000 --> 00:03.000\nA\n\n00:01.000 --> 00:04.000\nB').errors.some(e => e.code === 'cue.order'));
});

test('allows overlaps but rejects duplicate identifiers and empty payload', () => {
  const overlap = 'WEBVTT\n\nA\n00:00.000 --> 00:03.000\nFirst\n\nB\n00:01.000 --> 00:04.000\nSecond';
  assert.equal(validateWebVtt(overlap).valid, true);
  assert.equal(validateWebVtt('WEBVTT\\n\\n00:00.000 --> 00:01.000\\nFirst\\n\\n00:01.000 --> 00:02.000\\nSecond').valid, true);
  const duplicate = 'WEBVTT\n\nA\n00:00.000 --> 00:01.000\nOne\n\nA\n00:01.000 --> 00:02.000\nTwo';
  assert.ok(validateWebVtt(duplicate).errors.some(e => e.code === 'cue.identifier.duplicate'));
  assert.ok(validateWebVtt('WEBVTT\n\n00:00.000 --> 00:01.000\n').errors.some(e => e.code === 'cue.payload.empty'));
});

test('skips NOTE blocks and warns when cues exceed known media duration', () => {
  const input = 'WEBVTT\n\nNOTE generated for editorial review\nNo cue here\n\n00:00.000 --> 00:02.000\nCaption';
  const report = validateWebVtt(input, {durationMs: 1000});
  assert.equal(report.cueCount, 1);
  assert.equal(report.valid, true);
  assert.equal(report.warnings[0].code, 'cue.outside.duration');
});

test('rejects non-text input safely', () => {
  assert.equal(validateWebVtt(null).errors[0].code, 'input.type');
});
