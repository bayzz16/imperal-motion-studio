const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const file = path.join(__dirname, '..', 'src', 'motion', 'camera-moves.ts');
const source = fs.readFileSync(file, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
const mod = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(mod.exports, require, mod, file, path.dirname(file));
const {getCameraTransform} = mod.exports;

test('camera presets are deterministic and remain inside documented intensity limits', () => {
  for (const preset of ['push-in', 'pull-out', 'pan-left', 'pan-right', 'drift']) {
    const first = getCameraTransform({frame: 30, durationInFrames: 90, preset});
    const second = getCameraTransform({frame: 30, durationInFrames: 90, preset});
    assert.deepEqual(first, second);
    assert.ok(Number.isFinite(first.scale) && first.scale >= 1);
    assert.ok(Number.isFinite(first.translateX));
    assert.ok(Number.isFinite(first.translateY));
  }
});

test('camera moves clamp at both ends of the scene', () => {
  const start = getCameraTransform({frame: -10, durationInFrames: 90, preset: 'push-in'});
  const first = getCameraTransform({frame: 0, durationInFrames: 90, preset: 'push-in'});
  const end = getCameraTransform({frame: 120, durationInFrames: 90, preset: 'push-in'});
  const last = getCameraTransform({frame: 89, durationInFrames: 90, preset: 'push-in'});
  assert.deepEqual(start, first);
  assert.deepEqual(end, last);
});

test('invalid camera timing and intensity are rejected', () => {
  assert.throws(() => getCameraTransform({frame: 0, durationInFrames: 0, preset: 'drift'}), /positive integer/);
  assert.throws(() => getCameraTransform({frame: NaN, durationInFrames: 30, preset: 'drift'}), /finite/);
  assert.throws(() => getCameraTransform({frame: 0, durationInFrames: 30, preset: 'drift', intensity: 3}), /between 0 and 2/);
});
