const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const timelinePath = path.join(root, 'src', 'timeline', 'scene-timeline.ts');
const shotListPath = path.join(root, 'src', 'storyboard', 'shot-list.ts');

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
  assert.equal(errors.length, 0, path.basename(filePath) + ' should transpile without errors');

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
const {buildShotList, COMMON_SHOT_FRAME_RATES} = loadTypeScriptModule(shotListPath, {
  '../timeline/scene-timeline': timelineModule,
});

const makeShot = (overrides = {}) => ({
  id: 'shot-01',
  sceneId: 'scene-01',
  subject: 'A presenter beside a display',
  action: 'Turns toward the display and points to the title',
  framing: 'medium',
  durationInFrames: 48,
  ...overrides,
});

const makeList = (shots, overrides = {}) => ({
  projectId: 'project-alpha',
  sequenceId: 'sequence-main',
  frameRate: COMMON_SHOT_FRAME_RATES.fps24,
  shots,
  ...overrides,
});

test('builds a project-scoped shot list with defaults and frame placements', () => {
  const result = buildShotList(
    makeList([
      makeShot(),
      makeShot({
        id: 'shot-02',
        sceneId: 'scene-02',
        subject: 'A close view of the display',
        action: 'The chart animates into view',
        framing: 'close-up',
      }),
    ]),
  );

  assert.equal(result.projectId, 'project-alpha');
  assert.equal(result.sequenceId, 'sequence-main');
  assert.deepEqual(result.frameRate, {numerator: 24, denominator: 1});
  assert.equal(result.totalDurationInFrames, 96);
  assert.deepEqual(
    result.shots.map(({shotNumber, fromFrame, endFrameExclusive}) => ({
      shotNumber,
      fromFrame,
      endFrameExclusive,
    })),
    [
      {shotNumber: 1, fromFrame: 0, endFrameExclusive: 48},
      {shotNumber: 2, fromFrame: 48, endFrameExclusive: 96},
    ],
  );
  assert.equal(result.shots[0].cameraAngle, 'eye-level');
  assert.equal(result.shots[0].cameraMovement, 'static');
});

test('normalizes rational frame rates without decimal approximation', () => {
  const result = buildShotList(
    makeList([makeShot()], {
      frameRate: {numerator: 48000, denominator: 2002},
    }),
  );

  assert.deepEqual(result.frameRate, {numerator: 24000, denominator: 1001});
  assert.deepEqual(COMMON_SHOT_FRAME_RATES.fps2997, {
    numerator: 30000,
    denominator: 1001,
  });
});

test('preserves editorial array order and does not mutate the input', () => {
  const shots = [
    makeShot({id: 'shot-b'}),
    makeShot({id: 'shot-a'}),
  ];
  const before = structuredClone(shots);
  const result = buildShotList(makeList(shots));

  assert.deepEqual(result.shots.map((shot) => shot.id), ['shot-b', 'shot-a']);
  assert.deepEqual(shots, before);
});

test('places explicit overlaps through the shared scene timeline planner', () => {
  const result = buildShotList(
    makeList([
      makeShot({id: 'first', durationInFrames: 90, transitionAfterFrames: 18}),
      makeShot({id: 'second', durationInFrames: 150, transitionAfterFrames: 12}),
      makeShot({id: 'third', durationInFrames: 60}),
    ]),
  );

  assert.deepEqual(
    result.shots.map((shot) => ({
      id: shot.id,
      fromFrame: shot.fromFrame,
      endFrameExclusive: shot.endFrameExclusive,
      transitionInFrames: shot.transitionInFrames,
      transitionOutFrames: shot.transitionOutFrames,
    })),
    [
      {
        id: 'first',
        fromFrame: 0,
        endFrameExclusive: 90,
        transitionInFrames: undefined,
        transitionOutFrames: 18,
      },
      {
        id: 'second',
        fromFrame: 72,
        endFrameExclusive: 222,
        transitionInFrames: 18,
        transitionOutFrames: 12,
      },
      {
        id: 'third',
        fromFrame: 210,
        endFrameExclusive: 270,
        transitionInFrames: 12,
        transitionOutFrames: undefined,
      },
    ],
  );
  assert.equal(result.totalDurationInFrames, 270);
});

test('places gaps without changing shot durations', () => {
  const result = buildShotList(
    makeList([
      makeShot({id: 'first', durationInFrames: 24}),
      makeShot({id: 'second', durationInFrames: 24, gapBeforeFrames: 6}),
    ]),
  );

  assert.equal(result.shots[1].fromFrame, 30);
  assert.equal(result.shots[1].durationInFrames, 24);
  assert.equal(result.totalDurationInFrames, 54);
});

test('keeps project and sequence identifiers independent across lists', () => {
  const first = buildShotList(makeList([makeShot()]));
  const second = buildShotList(
    makeList([makeShot()], {
      projectId: 'project-beta',
      sequenceId: 'sequence-teaser',
    }),
  );

  assert.equal(first.shots[0].id, second.shots[0].id);
  assert.notEqual(first.projectId, second.projectId);
  assert.notEqual(first.sequenceId, second.sequenceId);
});

test('supports optional scene, lens, direction, movement, and notes metadata', () => {
  const result = buildShotList(
    makeList([
      makeShot({
        sceneId: undefined,
        cameraAngle: 'low-angle',
        cameraMovement: 'dolly',
        lensMm: 35,
        notes: 'Keep the horizon level.',
      }),
    ]),
  );

  assert.equal(result.shots[0].sceneId, undefined);
  assert.equal(result.shots[0].cameraAngle, 'low-angle');
  assert.equal(result.shots[0].cameraMovement, 'dolly');
  assert.equal(result.shots[0].lensMm, 35);
  assert.equal(result.shots[0].notes, 'Keep the horizon level.');
});

test('rejects missing project and sequence identifiers', () => {
  assert.throws(
    () => buildShotList(makeList([makeShot()], {projectId: '  '})),
    /projectId must be a non-empty string/,
  );
  assert.throws(
    () => buildShotList(makeList([makeShot()], {sequenceId: ''})),
    /sequenceId must be a non-empty string/,
  );
});

test('rejects a missing or empty shot array', () => {
  assert.throws(
    () => buildShotList(makeList([])),
    /shots must be a non-empty array/,
  );
  assert.throws(
    () => buildShotList(makeList(undefined)),
    /shots must be a non-empty array/,
  );
});

test('rejects non-object shot list input', () => {
  assert.throws(() => buildShotList(null), /input must be an object/);
});

test('rejects empty or duplicate shot IDs', () => {
  assert.throws(
    () => buildShotList(makeList([makeShot({id: '  '})])),
    /id must be a non-empty string/,
  );
  assert.throws(
    () => buildShotList(makeList([makeShot(), makeShot()])),
    /Duplicate scene id: shot-01/,
  );
});

test('rejects missing subject, action, and invalid optional scene ID', () => {
  assert.throws(
    () => buildShotList(makeList([makeShot({subject: ' '})])),
    /subject must be a non-empty string/,
  );
  assert.throws(
    () => buildShotList(makeList([makeShot({action: ''})])),
    /action must be a non-empty string/,
  );
  assert.throws(
    () => buildShotList(makeList([makeShot({sceneId: '  '})])),
    /sceneId must be a non-empty string/,
  );
});

test('rejects unsupported framing, camera angle, and camera movement', () => {
  assert.throws(
    () => buildShotList(makeList([makeShot({framing: 'cinematic'})])),
    /framing must be one of:/,
  );
  assert.throws(
    () => buildShotList(makeList([makeShot({cameraAngle: 'sideways'})])),
    /cameraAngle must be one of:/,
  );
  assert.throws(
    () => buildShotList(makeList([makeShot({cameraMovement: 'drone'})])),
    /cameraMovement must be one of:/,
  );
});

test('rejects invalid rational frame rates', () => {
  for (const frameRate of [
    {numerator: 0, denominator: 1},
    {numerator: 24, denominator: 0},
    {numerator: -24, denominator: 1},
    {numerator: 24, denominator: -1},
    {numerator: 23.976, denominator: 1},
    {numerator: Number.NaN, denominator: 1},
    {numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1},
  ]) {
    assert.throws(
      () => buildShotList(makeList([makeShot()], {frameRate})),
      /frameRate numerator and denominator must be positive safe integers/,
    );
  }
});

test('rejects invalid focal lengths and notes types', () => {
  for (const lensMm of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildShotList(makeList([makeShot({lensMm})])),
      /lensMm must be a positive finite number/,
    );
  }
  assert.throws(
    () => buildShotList(makeList([makeShot({notes: 12})])),
    /notes must be a string when provided/,
  );
});

test('delegates duration, gap, and transition constraints to the shared planner', () => {
  assert.throws(
    () => buildShotList(makeList([makeShot({durationInFrames: 0})])),
    /durationInFrames must be a positive safe integer/,
  );
  assert.throws(
    () => buildShotList(makeList([makeShot({gapBeforeFrames: -1})])),
    /gapBeforeFrames must be a non-negative safe integer/,
  );
  assert.throws(
    () => buildShotList(
      makeList([makeShot({transitionAfterFrames: 10})]),
    ),
    /cannot transition after the final scene/,
  );
  assert.throws(
    () => buildShotList(
      makeList([
        makeShot({id: 'first', durationInFrames: 24, transitionAfterFrames: 25}),
        makeShot({id: 'second', durationInFrames: 24}),
      ]),
    ),
    /cannot exceed its duration/,
  );
});

test('rejects adjacent transitions that would overlap three shots', () => {
  assert.throws(
    () => buildShotList(
      makeList([
        makeShot({id: 'first', durationInFrames: 30, transitionAfterFrames: 18}),
        makeShot({id: 'middle', durationInFrames: 30, transitionAfterFrames: 18}),
        makeShot({id: 'last', durationInFrames: 30}),
      ]),
    ),
    /adjacent transitions that exceed its duration/,
  );
});

test('rejects unsafe cumulative frame ranges', () => {
  assert.throws(
    () => buildShotList(
      makeList([
        makeShot({id: 'first', durationInFrames: Number.MAX_SAFE_INTEGER}),
        makeShot({id: 'second', durationInFrames: 1}),
      ]),
    ),
    /safe timeline range/,
  );
});
