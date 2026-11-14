const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'environment', 'scene-environment.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
const mod = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(mod.exports, require, mod, sourcePath, path.dirname(sourcePath));
const {
  validateEnvironmentTimeline,
  getEnvironmentAtFrame,
  getPrecipitationVelocity,
  getEnvironmentAudioVolume,
} = mod.exports;

const sunny = {
  weather: 'clear', cloudCoverage: 0.05, sunlight: 0.95, windX: 0,
};
const rainy = {
  weather: 'rain', cloudCoverage: 0.9, sunlight: 0.18, windX: 0.35,
  precipitation: {kind: 'rain', gravityPxPerFrame: 16, windDriftPxPerFrame: 2.5},
};
const plan = {
  durationInFrames: 300,
  cues: [
    {id: 'sunny-opening', startFrame: 0, endFrame: 90, state: sunny},
    {id: 'rain-arrives', startFrame: 90, endFrame: 300, state: rainy,
      audioCues: [{id: 'rain-bed', src: 'audio/rain.wav', startFrame: 105, endFrame: 285, volume: 0.45, fadeInFrames: 20, fadeOutFrames: 30}]},
  ],
};

test('accepts a coherent sunny-to-rain environment timeline', () => {
  assert.equal(validateEnvironmentTimeline(plan), true);
});

test('selects the active environment state using half-open frame ranges', () => {
  assert.equal(getEnvironmentAtFrame(plan, 89).id, 'sunny-opening');
  assert.equal(getEnvironmentAtFrame(plan, 90).id, 'rain-arrives');
  assert.equal(getEnvironmentAtFrame(plan, 300), undefined);
});

test('precipitation always has a downward gravity component while wind drifts sideways', () => {
  assert.deepEqual(getPrecipitationVelocity(rainy), {x: 0.875, y: 16});
  assert.ok(getPrecipitationVelocity(rainy).y > 0);
});

test('ambience fades in and out and is silent outside its cue', () => {
  const cue = plan.cues[1].audioCues[0];
  assert.equal(getEnvironmentAudioVolume(cue, 104), 0);
  assert.ok(getEnvironmentAudioVolume(cue, 115) > 0);
  assert.equal(getEnvironmentAudioVolume(cue, 285), 0);
  assert.equal(getEnvironmentAudioVolume(cue, 150), 0.45);
});

test('rejects rain without dark cloud cover or rain particle physics', () => {
  assert.throws(() => validateEnvironmentTimeline({
    durationInFrames: 100,
    cues: [{id: 'bad-rain', startFrame: 0, endFrame: 100,
      state: {weather: 'rain', cloudCoverage: 0.1, sunlight: 0.95, windX: 0,
        precipitation: {kind: 'rain', gravityPxPerFrame: 4, windDriftPxPerFrame: 1}}}],
  }), /needs established cloud coverage/);
  assert.throws(() => validateEnvironmentTimeline({
    durationInFrames: 100,
    cues: [{id: 'upward-rain', startFrame: 0, endFrame: 100,
      state: {weather: 'rain', cloudCoverage: 0.9, sunlight: 0.1, windX: 0,
        precipitation: {kind: 'rain', gravityPxPerFrame: -4, windDriftPxPerFrame: 1}}}],
  }), /move downward under gravity/);
});

test('rejects overlapping cues, invalid audio ranges, and contradictory sunlight', () => {
  assert.throws(() => validateEnvironmentTimeline({
    durationInFrames: 100,
    cues: [
      {id: 'a', startFrame: 0, endFrame: 70, state: sunny},
      {id: 'b', startFrame: 60, endFrame: 100, state: sunny},
    ],
  }), /overlaps/);
  assert.throws(() => validateEnvironmentTimeline({
    durationInFrames: 100,
    cues: [{id: 'storm', startFrame: 0, endFrame: 100,
      state: {...rainy, sunlight: 0.95}}],
  }), /strong direct sunlight conflicts/);
  assert.throws(() => validateEnvironmentTimeline({
    durationInFrames: 100,
    cues: [{id: 'rain', startFrame: 0, endFrame: 100, state: rainy,
      audioCues: [{id: 'rain-audio', src: 'audio/rain.wav', startFrame: 80, endFrame: 110, volume: 0.5}]}],
  }), /must fit inside/);
});

test('permits an explicitly marked sunshower exception', () => {
  assert.equal(validateEnvironmentTimeline({
    durationInFrames: 60,
    cues: [{id: 'sunshower', startFrame: 0, endFrame: 60,
      state: {...rainy, cloudCoverage: 0.25, sunlight: 0.9, intentionalSunshower: true}}],
  }), true);
});
