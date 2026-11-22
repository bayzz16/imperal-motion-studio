const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'audio', 'music-ducking.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  reportDiagnostics: true,
});
const errors = (compiled.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);
assert.equal(errors.length, 0, 'Music ducking module should transpile without errors');

const loaded = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(
  loaded.exports,
  require,
  loaded,
  sourcePath,
  path.dirname(sourcePath),
);

const {createMusicDuckingKeyframes, easeMusicDuckingProgress} = loaded.exports;

const sample = (frame, keyframes) => {
  const {inputRange, outputRange, curve} = keyframes;
  if (frame <= inputRange[0]) return outputRange[0];
  if (frame >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];

  let index = 0;
  while (frame >= inputRange[index + 1]) index += 1;
  const start = inputRange[index];
  const end = inputRange[index + 1];
  const progress = (frame - start) / (end - start);
  const eased = easeMusicDuckingProgress(progress, curve);
  return outputRange[index] + (outputRange[index + 1] - outputRange[index]) * eased;
};

const settings = (overrides = {}) => ({
  baseVolume: 0.24,
  duckedVolume: 0.08,
  attackFrames: 6,
  releaseFrames: 9,
  preRollFrames: 6,
  curve: 'linear',
  ...overrides,
});

test('keeps the base music volume when there are no dialogue cues', () => {
  const keyframes = createMusicDuckingKeyframes([], settings());
  assert.deepEqual(keyframes.inputRange, [0, 1]);
  assert.deepEqual(keyframes.outputRange, [0.24, 0.24]);
  assert.equal(sample(0, keyframes), 0.24);
  assert.equal(sample(100, keyframes), 0.24);
});

test('ramps down before dialogue, holds under speech, and releases afterward', () => {
  const keyframes = createMusicDuckingKeyframes(
    [{from: 30, durationInFrames: 60}],
    settings(),
  );

  assert.deepEqual(keyframes.inputRange, [0, 24, 30, 90, 99]);
  assert.deepEqual(keyframes.outputRange, [0.24, 0.24, 0.08, 0.08, 0.24]);
  assert.equal(sample(0, keyframes), 0.24);
  assert.equal(sample(27, keyframes), 0.16);
  assert.equal(sample(30, keyframes), 0.08);
  assert.equal(sample(60, keyframes), 0.08);
  assert.equal(sample(99, keyframes), 0.24);
});

test('merges overlapping dialogue cues without music recovery between them', () => {
  const keyframes = createMusicDuckingKeyframes(
    [
      {from: 30, durationInFrames: 30},
      {from: 64, durationInFrames: 20},
    ],
    settings(),
  );

  assert.deepEqual(keyframes.inputRange, [0, 24, 30, 84, 93]);
  assert.equal(sample(61, keyframes), 0.08);
  assert.equal(sample(84, keyframes), 0.08);
});

test('merges a new cue that begins during the previous cue release ramp', () => {
  const keyframes = createMusicDuckingKeyframes(
    [
      {from: 30, durationInFrames: 30},
      {from: 66, durationInFrames: 20},
    ],
    settings(),
  );

  assert.deepEqual(keyframes.inputRange, [0, 24, 30, 86, 95]);
  assert.equal(sample(65, keyframes), 0.08);
  assert.equal(sample(86, keyframes), 0.08);
});

test('allows separate cues to return to base volume between dialogue passages', () => {
  const keyframes = createMusicDuckingKeyframes(
    [
      {from: 30, durationInFrames: 30},
      {from: 90, durationInFrames: 20},
    ],
    settings(),
  );

  assert.equal(sample(75, keyframes), 0.24);
  assert.equal(sample(90, keyframes), 0.08);
  assert.equal(sample(100, keyframes), 0.08);
});

test('shortens attack to the available pre-roll at the start of a composition', () => {
  const keyframes = createMusicDuckingKeyframes(
    [{from: 3, durationInFrames: 12}],
    settings(),
  );

  assert.deepEqual(keyframes.inputRange, [0, 3, 15, 24]);
  assert.equal(sample(1, keyframes), 0.24 + (0.08 - 0.24) / 3);
  assert.equal(sample(3, keyframes), 0.08);
});

test('supports immediate ducking and immediate recovery when ramp lengths are zero', () => {
  const keyframes = createMusicDuckingKeyframes(
    [{from: 10, durationInFrames: 5}],
    settings({attackFrames: 0, preRollFrames: 0, releaseFrames: 0}),
  );

  assert.deepEqual(keyframes.inputRange, [0, 9, 10, 14, 15]);
  assert.deepEqual(keyframes.outputRange, [0.24, 0.24, 0.08, 0.08, 0.24]);
  assert.equal(sample(9, keyframes), 0.24);
  assert.equal(sample(10, keyframes), 0.08);
  assert.equal(sample(14, keyframes), 0.08);
  assert.equal(sample(15, keyframes), 0.24);
});

test('supports a smoothstep attack curve', () => {
  const keyframes = createMusicDuckingKeyframes(
    [{from: 8, durationInFrames: 12}],
    settings({attackFrames: 4, preRollFrames: 4, curve: 'smoothstep'}),
  );

  assert.equal(sample(5, keyframes), 0.24 + (0.08 - 0.24) * 0.15625);
  assert.equal(easeMusicDuckingProgress(0, 'smoothstep'), 0);
  assert.equal(easeMusicDuckingProgress(0.5, 'smoothstep'), 0.5);
  assert.equal(easeMusicDuckingProgress(1, 'smoothstep'), 1);
});

test('does not mutate the supplied dialogue cue array', () => {
  const cues = [
    {from: 90, durationInFrames: 20},
    {from: 30, durationInFrames: 10},
  ];
  const before = structuredClone(cues);
  createMusicDuckingKeyframes(cues, settings());
  assert.deepEqual(cues, before);
});

test('rejects malformed cue arrays, cue timing, and unsafe cumulative frames', () => {
  assert.throws(() => createMusicDuckingKeyframes(null, settings()), /array/);
  assert.throws(
    () => createMusicDuckingKeyframes([{from: -1, durationInFrames: 2}], settings()),
    /from must be a non-negative safe integer/,
  );
  assert.throws(
    () => createMusicDuckingKeyframes([{from: 0, durationInFrames: 0}], settings()),
    /durationInFrames must be a positive safe integer/,
  );
  assert.throws(
    () => createMusicDuckingKeyframes(
      [{from: Number.MAX_SAFE_INTEGER, durationInFrames: 1}],
      settings(),
    ),
    /safe frame range/,
  );
});

test('rejects invalid volume and ramp settings', () => {
  assert.throws(
    () => createMusicDuckingKeyframes([], settings({baseVolume: 1.1})),
    /between 0 and 1/,
  );
  assert.throws(
    () => createMusicDuckingKeyframes([], settings({duckedVolume: 0.3})),
    /must not exceed/,
  );
  assert.throws(
    () => createMusicDuckingKeyframes([], settings({attackFrames: -1})),
    /non-negative safe integer/,
  );
  assert.throws(
    () => createMusicDuckingKeyframes([], settings({preRollFrames: 1.5})),
    /non-negative safe integer/,
  );
  assert.throws(
    () => createMusicDuckingKeyframes([], settings({curve: 'bezier'})),
    /either linear or smoothstep/,
  );
});
