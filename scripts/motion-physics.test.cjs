const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'src', 'motion', 'physics.ts');
const source = fs.readFileSync(file, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
const mod = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(mod.exports, require, mod, file, path.dirname(file));
const {lerp, mapRange, getSpringProgress, getCubicBezierProgress, getDampedOscillation} = mod.exports;

test('linear interpolation and range mapping are predictable', () => {
  assert.equal(lerp(10, 20, 0.25), 12.5);
  assert.equal(mapRange(5, 0, 10, 0, 100), 50);
  assert.equal(mapRange(15, 0, 10, 0, 1, true), 1);
  assert.throws(() => mapRange(1, 2, 2, 0, 1), /non-zero length/);
});

test('spring starts at zero, ends at one, and can overshoot', () => {
  const values = Array.from({length: 61}, (_, frame) => getSpringProgress(frame, 61));
  assert.equal(values[0], 0);
  assert.equal(values.at(-1), 1);
  assert.ok(values.some(value => value > 1));
});

test('bezier easing has exact endpoints and monotonic x inversion', () => {
  assert.ok(Math.abs(getCubicBezierProgress(0, 0.42, 0, 1, 1) - 0) < 1e-6);
  assert.ok(Math.abs(getCubicBezierProgress(1, 0.42, 0, 1, 1) - 1) < 1e-6);
  const values = Array.from({length: 21}, (_, i) => getCubicBezierProgress(i / 20, 0.42, 0, 0.58, 1));
  for (let i = 1; i < values.length; i++) assert.ok(values[i] >= values[i - 1]);
});

test('damped oscillation respects amplitude and fades over time', () => {
  const early = getDampedOscillation(20, 60, 4, 0.8);
  const late = getDampedOscillation(200, 60, 4, 0.8);
  assert.ok(Math.abs(early) <= 4);
  assert.ok(Math.abs(late) <= 4);
  assert.ok(Math.abs(late) < Math.abs(early));
});

test('invalid motion parameters fail loudly', () => {
  assert.throws(() => getSpringProgress(0, 1), /at least 2/);
  assert.throws(() => getSpringProgress(0, 60, 1), /less than 1/);
  assert.throws(() => getCubicBezierProgress(0.5, -1, 0, 1, 1), /control points/);
  assert.throws(() => getDampedOscillation(0, 0, 1), /greater than zero/);
});
