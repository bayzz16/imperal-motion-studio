'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PROFILES, countGraphemes, visibleCueText, analyzeReadingSpeed,
} = require('./analyze-subtitle-cps.cjs');

const vtt = (text, start = '00:00.000', end = '00:01.000') =>
  'WEBVTT\\n\\n' + start + ' --> ' + end + '\\n' + text + '\\n';

test('uses conservative adult and children CPS profiles', () => {
  assert.equal(PROFILES.adult, 17);
  assert.equal(PROFILES.children, 13);
  assert.equal(analyzeReadingSpeed(vtt('12345678901234567')).withinLimit, true);
  assert.equal(analyzeReadingSpeed(vtt('123456789012345678')).withinLimit, false);
  assert.equal(analyzeReadingSpeed(vtt('12345678901234'), {profile: 'children'}).withinLimit, false);
});

test('counts grapheme clusters rather than UTF-16 code units', () => {
  assert.equal(countGraphemes('e\\u0301'), 1);
  assert.equal(countGraphemes('👨‍👩‍👧‍👦'), 1);
  assert.equal(countGraphemes('é'), 1);
});

test('strips WebVTT formatting tags and decodes entities before counting', () => {
  assert.equal(visibleCueText('<i>Hello</i> &amp; <b>world</b>'), 'Hello & world');
  const report = analyzeReadingSpeed(vtt('<i>12345678901234567</i>'));
  assert.equal(report.cues[0].visibleCharacters, 17);
  assert.equal(report.cues[0].overLimit, false);
});

test('reports per-cue CPS, duration, and limit status', () => {
  const report = analyzeReadingSpeed(vtt('hello world', '00:00.000', '00:02.000'));
  assert.equal(report.cueCount, 1);
  assert.equal(report.cues[0].visibleCharacters, 11);
  assert.equal(report.cues[0].charactersPerSecond, 5.5);
  assert.equal(report.withinLimit, true);
});

test('supports an explicit CPS override and locale', () => {
  const report = analyzeReadingSpeed(vtt('1234567890'), {maxCps: 5, locale: 'id'});
  assert.equal(report.maxCps, 5);
  assert.equal(report.locale, 'id');
  assert.equal(report.withinLimit, false);
});

test('rejects unknown profiles, invalid thresholds, and structurally invalid VTT', () => {
  assert.throws(() => analyzeReadingSpeed(vtt('Text'), {profile: 'unknown'}), /profile/);
  assert.throws(() => analyzeReadingSpeed(vtt('Text'), {maxCps: 0}), /maxCps/);
  assert.throws(() => analyzeReadingSpeed('not VTT'), /structural validation/);
});
