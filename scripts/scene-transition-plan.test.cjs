const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const timelinePath = path.join(root, 'src', 'timeline', 'scene-timeline.ts');
const planPath = path.join(root, 'src', 'transitions', 'scene-transition-plan.ts');

const loadTypeScriptModule = (filePath, overrides = {}) => {
  const source = fs.readFileSync(filePath, 'utf8');
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
  assert.equal(errors.length, 0, `${path.basename(filePath)} should transpile without errors`);

  const loaded = {exports: {}};
  const localRequire = (specifier) => {
    if (Object.prototype.hasOwnProperty.call(overrides, specifier)) {
      return overrides[specifier];
    }

    return require(specifier);
  };
  const execute = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    compiled.outputText,
  );
  execute(loaded.exports, localRequire, loaded, filePath, path.dirname(filePath));
  return loaded.exports;
};

const timelineModule = loadTypeScriptModule(timelinePath);
const {buildSceneTransitionPlan} = loadTypeScriptModule(planPath, {
  '../timeline/scene-timeline': timelineModule,
});

test('creates ordered scene and transition items with a two-sided fade by default', () => {
  const opening = {title: 'Opening'};
  const main = {title: 'Main'};
  const plan = buildSceneTransitionPlan([
    {id: 'opening', durationInFrames: 90, children: opening, transitionAfterFrames: 18},
    {id: 'main', durationInFrames: 150, children: main},
  ]);

  assert.deepEqual(
    plan.map((item) => item.type),
    ['scene', 'transition', 'scene'],
  );
  assert.deepEqual(plan[0], {
    type: 'scene',
    id: 'opening',
    durationInFrames: 90,
    children: opening,
  });
  assert.deepEqual(plan[1], {
    type: 'transition',
    id: 'transition-opening-to-main',
    afterSceneId: 'opening',
    durationInFrames: 18,
    preset: 'fade',
    timing: 'linear',
    direction: 'from-left',
  });
  assert.equal(plan[2].children, main);
});

test('supports slide, wipe, and flip directions with spring timing', () => {
  for (const preset of ['slide', 'wipe', 'flip']) {
    const plan = buildSceneTransitionPlan([
      {
        id: 'first',
        durationInFrames: 60,
        children: null,
        transitionAfterFrames: 12,
        transitionPreset: preset,
        transitionTiming: 'spring',
        transitionDirection: 'from-bottom',
      },
      {id: 'second', durationInFrames: 60, children: null},
    ]);

    assert.equal(plan[1].preset, preset);
    assert.equal(plan[1].timing, 'spring');
    assert.equal(plan[1].direction, 'from-bottom');
  }
});

test('keeps a hard cut when no transition is requested', () => {
  const plan = buildSceneTransitionPlan([
    {id: 'first', durationInFrames: 24, children: null},
    {id: 'second', durationInFrames: 24, children: null},
  ]);

  assert.deepEqual(
    plan.map((item) => item.type),
    ['scene', 'scene'],
  );
});

test('rejects an empty scene list', () => {
  assert.throws(() => buildSceneTransitionPlan([]), /At least one scene is required/);
});

test('rejects a transition after the final scene', () => {
  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {id: 'last', durationInFrames: 30, children: null, transitionAfterFrames: 5},
      ]),
    /cannot transition after the final scene/,
  );
});

test('rejects transitions longer than either adjacent scene', () => {
  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {id: 'first', durationInFrames: 30, children: null, transitionAfterFrames: 31},
        {id: 'second', durationInFrames: 40, children: null},
      ]),
    /cannot exceed its duration/,
  );
  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {id: 'first', durationInFrames: 40, children: null, transitionAfterFrames: 31},
        {id: 'second', durationInFrames: 30, children: null},
      ]),
    /cannot exceed the next scene duration/,
  );
});

test('rejects adjacent transitions that would overlap three scenes', () => {
  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {id: 'first', durationInFrames: 30, children: null, transitionAfterFrames: 18},
        {id: 'middle', durationInFrames: 30, children: null, transitionAfterFrames: 18},
        {id: 'last', durationInFrames: 30, children: null},
      ]),
    /adjacent transitions that exceed its duration/,
  );
});

test('rejects unsupported presets, timings, and directions', () => {
  const base = {
    id: 'first',
    durationInFrames: 30,
    children: null,
    transitionAfterFrames: 5,
  };
  const second = {id: 'second', durationInFrames: 30, children: null};

  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {...base, transitionPreset: 'dissolve'},
        second,
      ]),
    /unsupported transition preset/,
  );
  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {...base, transitionTiming: 'bounce'},
        second,
      ]),
    /unsupported transition timing/,
  );
  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {...base, transitionDirection: 'diagonal'},
        second,
      ]),
    /unsupported transition direction/,
  );
});

test('rejects transition settings without a transition duration', () => {
  assert.throws(
    () =>
      buildSceneTransitionPlan([
        {id: 'first', durationInFrames: 30, children: null, transitionPreset: 'wipe'},
        {id: 'second', durationInFrames: 30, children: null},
      ]),
    /transition settings but no transitionAfterFrames/,
  );
});

test('preserves stable identifiers and total frame math through the shared planner', () => {
  const plan = buildSceneTransitionPlan([
    {id: 'intro', durationInFrames: 75, children: null, transitionAfterFrames: 15},
    {id: 'body', durationInFrames: 120, children: null, transitionAfterFrames: 10},
    {id: 'outro', durationInFrames: 45, children: null},
  ]);

  const totalSceneFrames = plan
    .filter((item) => item.type === 'scene')
    .reduce((total, item) => total + item.durationInFrames, 0);
  const totalTransitionFrames = plan
    .filter((item) => item.type === 'transition')
    .reduce((total, item) => total + item.durationInFrames, 0);

  assert.equal(totalSceneFrames - totalTransitionFrames, 215);
});
