'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'src', 'visual', 'cinematic-style.ts');
const source = fs.readFileSync(file, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error).length, 0);

const mod = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(
  mod.exports, require, mod, file, path.dirname(file),
);
const {getCinematicFrameStyle} = mod.exports;

test('cinematic camera treatment is deterministic and keeps a subtle grade', () => {
  for (const projectId of ['GalaxyEducation', 'TunasDewa', 'ImperialSolTeaser']) {
    const first = getCinematicFrameStyle(45, 300, projectId);
    const second = getCinematicFrameStyle(45, 300, projectId);
    assert.deepEqual(first, second);
    assert.match(first.transform, /scale\(1\./);
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
