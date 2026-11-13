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
    /exceeds the safe timeline range/,
  );
});
