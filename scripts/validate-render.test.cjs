'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {parseRational, validateProbeData, parseQualityDiagnostics} = require('./validate-render.cjs');

const validProbe = () => ({
  format: {duration: '10.000'},
  streams: [
    {codec_type: 'video', codec_name: 'h264', width: 1080, height: 1920, duration: '10.000', avg_frame_rate: '30/1', pix_fmt: 'yuv420p', bits_per_raw_sample: '8', color_range: 'tv', color_primaries: 'bt709', color_transfer: 'bt709', color_space: 'bt709'},
    {codec_type: 'audio', codec_name: 'aac', duration: '9.980'},
  ],
});

test('parses frame-rate rationals safely', () => {
  assert.equal(parseRational('30000/1001'), 30000 / 1001);
  assert.equal(parseRational('30'), 30);
  assert.ok(Number.isNaN(parseRational('30/0')));
});

test('validates video, audio, dimensions, duration and frame rate', () => {
  const result = validateProbeData(validProbe());
  assert.equal(result.width, 1080);
  assert.equal(result.height, 1920);
  assert.equal(result.fps, 30);
  assert.ok(Math.abs(result.avDriftSeconds - 0.02) < 1e-9);
  assert.equal(result.color.classification, 'sdr-bt709');
  assert.equal(result.color.status, 'ok');
});

test('allows explicit color delivery profiles without changing the source metadata', () => {
  const data = validProbe();
  data.streams[0].color_range = 'pc';
  const result = validateProbeData(data, {colorProfile: 'youtube-sdr'});
  assert.equal(result.color.profile, 'youtube-sdr');
  assert.ok(result.color.warnings.some((warning) => warning.includes('Full-range')));
  assert.equal(data.streams[0].color_range, 'pc');
});

test('rejects missing streams, invalid frame rates and excessive A/V drift', () => {
  assert.throws(() => validateProbeData({format: {duration: '10'}, streams: []}), /no video stream/);
  const noAudio = validProbe();
  noAudio.streams = noAudio.streams.filter((stream) => stream.codec_type !== 'audio');
  assert.throws(() => validateProbeData(noAudio), /no audio stream/);
  const badFps = validProbe();
  badFps.streams[0].avg_frame_rate = '0/0';
  assert.throws(() => validateProbeData(badFps), /frame rate is invalid/);
  const drift = validProbe();
  drift.streams[1].duration = '8.0';
  assert.throws(() => validateProbeData(drift), /duration drift/);
});

test('parses black, freeze and audio-volume diagnostics', () => {
  const parsed = parseQualityDiagnostics(
    '[blackdetect] black_start:1.000 black_end:2.000 black_duration:1.000\n' +
    '[freezedetect] freeze_start:4.000\n[freezedetect] freeze_end:6.100\n' +
    '[Parsed_volumedetect] mean_volume: -18.5 dB',
  );
  assert.equal(parsed.blackSegments.length, 1);
  assert.equal(parsed.blackSegments[0].duration, 1);
  assert.deepEqual(parsed.freezeStarts, [4]);
  assert.deepEqual(parsed.freezeEnds, [6.1]);
  assert.equal(parsed.meanVolumeDb, '-18.5');
});
