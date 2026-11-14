'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const loadTypeScriptModule = (file, customRequire = require) => {
  const source = fs.readFileSync(file, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, file + ' should transpile without errors');
  const mod = {exports: {}};
  new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(
    mod.exports, customRequire, mod, file, path.dirname(file),
  );
  return mod.exports;
};

const cameraPath = path.join(__dirname, '..', 'src', 'motion', 'camera-moves.ts');
const cameraModule = loadTypeScriptModule(cameraPath);
const cinematicPath = path.join(__dirname, '..', 'src', 'visual', 'cinematic-style.ts');
const cinematicModule = loadTypeScriptModule(
  cinematicPath,
  (specifier) => specifier === '../motion/camera-moves' ? cameraModule : require(specifier),
);
const {getCinematicFrameStyle} = cinematicModule;

test('cinematic camera treatment is deterministic and keeps a subtle grade', () => {
  for (const projectId of ['GalaxyEducation', 'TunasDewa', 'ImperialSolTeaser']) {
    const first = getCinematicFrameStyle(45, 300, projectId);
    const second = getCinematicFrameStyle(45, 300, projectId);
    assert.deepEqual(first, second);
    assert.ok(first.transform.includes('scale('));
    assert.match(first.filter, /saturate/);
  }
});

test('cinematic movement is clamped to the first and last frame', () => {
  assert.deepEqual(
    getCinematicFrameStyle(-10, 300, 'GalaxyEducation'),
    getCinematicFrameStyle(0, 300, 'GalaxyEducation'),
  );
  assert.deepEqual(
    getCinematicFrameStyle(500, 300, 'TunasDewa'),
    getCinematicFrameStyle(299, 300, 'TunasDewa'),
  );
});

test('invalid duration and project identifiers are rejected', () => {
  assert.throws(() => getCinematicFrameStyle(0, 0, 'TunasDewa'), /positive integer/);
  assert.throws(() => getCinematicFrameStyle(0, 30, '  '), /non-empty/);
});
