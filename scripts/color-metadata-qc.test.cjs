'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {analyzeColorMetadata} = require('./color-metadata-qc.cjs');

const bt709 = (overrides = {}) => ({
  pix_fmt: 'yuv420p',
  bits_per_raw_sample: '8',
  color_range: 'tv',
  color_primaries: 'bt709',
  color_transfer: 'bt709',
  color_space: 'bt709',
  ...overrides,
});

test('accepts complete and internally consistent BT.709 SDR metadata', () => {
  const result = analyzeColorMetadata(bt709());
  assert.equal(result.classification, 'sdr-bt709');
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.warnings, []);
  assert.equal(result.metadata.bitsPerRawSample, 8);
});

test('reports missing metadata as advisory review', () => {
  const result = analyzeColorMetadata({pix_fmt: 'yuv420p', color_range: 'unknown'});
  assert.equal(result.classification, 'incomplete');
  assert.equal(result.status, 'review');
  assert.equal(result.warnings.length, 4);
});

test('classifies BT.2020 PQ as HDR without changing metadata', () => {
  const result = analyzeColorMetadata(bt709({
    color_primaries: 'bt2020', color_transfer: 'smpte2084', color_space: 'bt2020nc', bits_per_raw_sample: '10',
  }));
  assert.equal(result.classification, 'hdr-pq-bt2020');
  assert.equal(result.status, 'ok');
  assert.equal(result.metadata.colorTransfer, 'smpte2084');
});

test('classifies BT.2020 HLG as HDR', () => {
  const result = analyzeColorMetadata(bt709({
    color_primaries: 'bt2020', color_transfer: 'arib-std-b67', color_space: 'bt2020nc',
  }));
  assert.equal(result.classification, 'hdr-hlg-bt2020');
});

test('does not label a linear BT.2020 signal as SDR', () => {
  const result = analyzeColorMetadata(bt709({
    color_primaries: 'bt2020', color_transfer: 'linear', color_space: 'bt2020nc',
  }));
  assert.equal(result.classification, 'other');
});

test('recognizes a consistent BT.601 family without forcing BT.709', () => {
  const result = analyzeColorMetadata(bt709({
    color_primaries: 'smpte170m', color_transfer: 'smpte170m', color_space: 'smpte170m',
  }));
  assert.equal(result.classification, 'sdr-bt601');
  assert.equal(result.status, 'ok');
});

test('flags conflicting primaries and matrix families', () => {
  const result = analyzeColorMetadata(bt709({color_space: 'smpte170m'}));
  assert.equal(result.status, 'review');
  assert.ok(result.warnings.some((warning) => warning.includes('different families')));
});

test('YouTube SDR profile flags full-range BT.709 as advisory', () => {
  const result = analyzeColorMetadata(bt709({color_range: 'pc'}), 'youtube-sdr');
  assert.equal(result.classification, 'sdr-bt709');
  assert.equal(result.profile, 'youtube-sdr');
  assert.ok(result.warnings.some((warning) => warning.includes('Full-range')));
});

test('YouTube SDR profile warns on HDR without changing its metadata', () => {
  const hdr = bt709({color_primaries: 'bt2020', color_transfer: 'smpte2084', color_space: 'bt2020nc'});
  const before = {...hdr};
  const result = analyzeColorMetadata(hdr, 'youtube-sdr');
  assert.equal(result.classification, 'hdr-pq-bt2020');
  assert.ok(result.warnings.some((warning) => warning.includes('expects BT.709')));
  assert.deepEqual(hdr, before);
});

test('normalizes FFprobe unknown markers and supports color_trc alias', () => {
  const result = analyzeColorMetadata({
    color_range: 'limited', color_primaries: 'unknown', color_trc: 'bt709', color_space: 'bt709',
  });
  assert.equal(result.metadata.colorRange, 'tv');
  assert.equal(result.metadata.colorPrimaries, null);
  assert.equal(result.metadata.colorTransfer, 'bt709');
  assert.equal(result.classification, 'incomplete');
});

test('rejects unsupported profiles and invalid stream arguments', () => {
  assert.throws(() => analyzeColorMetadata(null), /video stream metadata object/);
  assert.throws(() => analyzeColorMetadata(bt709(), 'cinema-master'), /Unsupported color QC profile/);
});
