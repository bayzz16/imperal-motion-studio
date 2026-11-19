const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'timeline', 'scene-timeline.ts');
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
assert.equal(errors.length, 0, 'Timeline helper should transpile without errors');

const timelineModule = {exports: {}};
const loadTimeline = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText);
loadTimeline(
  timelineModule.exports,
  require,
  timelineModule,
  sourcePath,
  path.dirname(sourcePath),
);
const {buildSceneTimeline} = timelineModule.exports;

test('places scenes sequentially and includes explicit gaps', () => {
  const result = buildSceneTimeline([
    {id: 'opening', durationInFrames: 90},
    {id: 'main', durationInFrames: 180, gapBeforeFrames: 12},
    {id: 'ending', durationInFrames: 30},
  ]);

  assert.deepEqual(result.scenes, [
    {id: 'opening', from: 0, durationInFrames: 90, endFrameExclusive: 90},
    {id: 'main', from: 102, durationInFrames: 180, endFrameExclusive: 282},
    {id: 'ending', from: 282, durationInFrames: 30, endFrameExclusive: 312},
  ]);
  assert.equal(result.totalDurationInFrames, 312);
});

test('returns a zero-length timeline for no scenes', () => {
  assert.deepEqual(buildSceneTimeline([]), {
    scenes: [],
    totalDurationInFrames: 0,
  });
});

test('rejects empty and duplicate scene IDs', () => {
  assert.throws(() => buildSceneTimeline([{id: '  ', durationInFrames: 1}]), /non-empty id/);
  assert.throws(
    () => buildSceneTimeline([
      {id: 'intro', durationInFrames: 1},
      {id: 'intro', durationInFrames: 2},
    ]),
    /Duplicate scene id/,
  );
});

test('rejects invalid durations and gaps', () => {
  for (const durationInFrames of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildSceneTimeline([{id: 'scene', durationInFrames}]),
      /durationInFrames must be a positive safe integer/,
    );
  }

  for (const gapBeforeFrames of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildSceneTimeline([{id: 'scene', durationInFrames: 1, gapBeforeFrames}]),
      /gapBeforeFrames must be a non-negative safe integer/,
    );
  }
});

test('rejects timelines that exceed the safe integer range', () => {
  assert.throws(
    () => buildSceneTimeline([
      {id: 'first', durationInFrames: Number.MAX_SAFE_INTEGER},
      {id: 'second', durationInFrames: 1},
    ]),
    /safe timeline range/,
  );
});

test('places pairwise overlaps and exposes transition handles', () => {
  const result = buildSceneTimeline([
    {id: 'opening', durationInFrames: 90, transitionAfterFrames: 18},
    {id: 'main', durationInFrames: 150, transitionAfterFrames: 12},
    {id: 'ending', durationInFrames: 60},
  ]);

  assert.deepEqual(result.scenes, [
    {
      id: 'opening',
      from: 0,
      durationInFrames: 90,
      endFrameExclusive: 90,
      transitionOutFrames: 18,
    },
    {
      id: 'main',
      from: 72,
      durationInFrames: 150,
      endFrameExclusive: 222,
      transitionInFrames: 18,
      transitionOutFrames: 12,
    },
    {
      id: 'ending',
      from: 210,
      durationInFrames: 60,
      endFrameExclusive: 270,
      transitionInFrames: 12,
    },
  ]);
  assert.equal(result.totalDurationInFrames, 270);
});

test('keeps an explicit gap after a scene without an incoming transition', () => {
  const result = buildSceneTimeline([
    {id: 'first', durationInFrames: 30},
    {id: 'second', durationInFrames: 30, gapBeforeFrames: 5},
  ]);
  assert.equal(result.scenes[1].from, 35);
  assert.equal(result.totalDurationInFrames, 65);
});

test('rejects invalid transition lengths', () => {
  for (const transitionAfterFrames of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildSceneTimeline([
        {id: 'first', durationInFrames: 30, transitionAfterFrames},
        {id: 'second', durationInFrames: 30},
      ]),
      /transitionAfterFrames must be a non-negative safe integer/,
    );
  }
});

test('rejects transitions longer than either adjacent scene', () => {
  assert.throws(
    () => buildSceneTimeline([
      {id: 'first', durationInFrames: 30, transitionAfterFrames: 31},
      {id: 'second', durationInFrames: 40},
    ]),
    /cannot exceed its duration/,
  );
  assert.throws(
    () => buildSceneTimeline([
      {id: 'first', durationInFrames: 40, transitionAfterFrames: 31},
      {id: 'second', durationInFrames: 30},
    ]),
    /cannot exceed the next scene duration/,
  );
});

test('rejects a transition after the final scene', () => {
  assert.throws(
    () => buildSceneTimeline([{id: 'last', durationInFrames: 30, transitionAfterFrames: 1}]),
    /cannot transition after the final scene/,
  );
});

test('rejects a gap before a scene that is already overlapped by its predecessor', () => {
  assert.throws(
    () => buildSceneTimeline([
      {id: 'first', durationInFrames: 30, transitionAfterFrames: 10},
      {id: 'second', durationInFrames: 30, gapBeforeFrames: 2},
    ]),
    /cannot have gapBeforeFrames when the previous scene transitions/,
  );
});

test('rejects adjacent transitions that would create a three-scene overlap', () => {
  assert.throws(
    () => buildSceneTimeline([
      {id: 'first', durationInFrames: 30, transitionAfterFrames: 18},
      {id: 'middle', durationInFrames: 30, transitionAfterFrames: 18},
      {id: 'last', durationInFrames: 30},
    ]),
    /adjacent transitions that exceed its duration/,
  );
});
