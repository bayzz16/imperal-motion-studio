'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {parseRational, validateProbeData, parseQualityDiagnostics, runDiagnostics} = require('./validate-render.cjs');

const validProbe = () => ({
  format: {duration: '10.000'},
  streams: [
    {codec_type: 'video', codec_name: 'h264', width: 1080, height: 1920, duration: '10.000', avg_frame_rate: '30/1'},
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

test('parses black, freeze, audio-volume and loudness diagnostics', () => {
  const parsed = parseQualityDiagnostics(
    '[blackdetect] black_start:1.000 black_end:2.000 black_duration:1.000\n' +
    '[freezedetect] freeze_start:4.000\n[freezedetect] freeze_end:6.100\n' +
    '[Parsed_volumedetect] mean_volume: -18.5 dB\n' +
    '{"input_i":"-20.0","input_tp":"-1.4","input_lra":"3.2","input_thresh":"-30.0"}',
  );
  assert.equal(parsed.blackSegments.length, 1);
  assert.equal(parsed.blackSegments[0].duration, 1);
  assert.deepEqual(parsed.freezeStarts, [4]);
  assert.deepEqual(parsed.freezeEnds, [6.1]);
  assert.equal(parsed.meanVolumeDb, '-18.5');
  assert.deepEqual(parsed.loudness, {
    integratedLufs: -20,
    truePeakDbtp: -1.4,
    loudnessRangeLu: 3.2,
    thresholdLufs: -30,
  });
});


test('keeps the existing decode scan when FFmpeg lacks loudnorm support', () => {
  const calls = [];
  const spawn = (_command, args) => {
    calls.push(args);
    if (calls.length === 1) return {status: 1, stderr: 'No such filter: loudnorm'};
    return {status: 0, stderr: 'mean_volume: -18.5 dB'};
  };

  const result = runDiagnostics('fixture.mp4', spawn);
  assert.equal(calls.length, 2);
  assert.equal(calls[0][calls[0].indexOf('-af') + 1].includes('loudnorm'), true);
  assert.equal(calls[1][calls[1].indexOf('-af') + 1], 'volumedetect');
  assert.equal(result.loudnessAvailable, false);
  assert.equal(result.loudnessFallback, true);
  assert.equal(result.result.status, 0);
});

test('does not hide a failed fallback full-stream scan', () => {
  let callCount = 0;
  const spawn = () => {
    callCount += 1;
    return {status: 1, stderr: callCount === 1 ? 'loudnorm failed' : 'decode failed'};
  };

  const result = runDiagnostics('fixture.mp4', spawn);
  assert.equal(callCount, 2);
  assert.equal(result.loudnessFallback, false);
  assert.equal(result.result.status, 1);
  assert.equal(result.primaryError, 'loudnorm failed');
});
