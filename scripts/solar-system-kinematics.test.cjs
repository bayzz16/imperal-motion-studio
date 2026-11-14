'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'src', 'visual', 'solar-system-kinematics.ts');
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
const {getOrbitPosition} = mod.exports;

test('orbit starts on its positive horizontal axis', () => {
  const [x, y, z] = getOrbitPosition(0, 3, 1200);
  assert.equal(x, 3);
  assert.equal(y, 0);
  assert.equal(z, 0);
});

test('orbit is deterministic and loops at its configured frame period', () => {
  assert.deepEqual(getOrbitPosition(175, 2.5, 900), getOrbitPosition(1075, 2.5, 900));
  const [halfTurnX] = getOrbitPosition(450, 2.5, 900);
  assert.ok(Math.abs(halfTurnX + 2.5) < 1e-10);
});

test('orbit input validation rejects invalid physical parameters', () => {
  assert.throws(() => getOrbitPosition(0, 0, 120), /orbitRadius/);
  assert.throws(() => getOrbitPosition(0, 1, 0), /orbitPeriodFrames/);
  assert.throws(() => getOrbitPosition(0, 1, 120, 1.5), /inclination/);
  assert.throws(() => getOrbitPosition(Number.NaN, 1, 120), /frame/);
});
