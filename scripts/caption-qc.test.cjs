'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'captions', 'caption-qc.ts');
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
assert.equal(errors.length, 0, 'Caption QC should transpile without errors');

const captionModule = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(
  captionModule.exports,
  require,
  captionModule,
  sourcePath,
  path.dirname(sourcePath),
);
const {analyzeCaptionReadability, CAPTION_QC_PRESETS} = captionModule.exports;

const cue = (text, startMs = 0, endMs = 2000) => ({text, startMs, endMs});

test('measures CPS, WPM, line count and duration without enforcing an implicit policy', () => {
  const result = analyzeCaptionReadability([cue('Halo dunia!')]);
  assert.equal(result.passed, true);
  assert.equal(result.issues.length, 0);
  assert.equal(result.metrics[0].characterCount, 11);
  assert.equal(result.metrics[0].wordCount, 2);
  assert.equal(result.metrics[0].lineCount, 1);
  assert.equal(result.metrics[0].maxLineCharacters, 11);
  assert.equal(result.metrics[0].charactersPerSecond, 5.5);
  assert.equal(result.metrics[0].wordsPerMinute, 60);
});

test('reports CPS, per-line length and line-count warnings with locations', () => {
  const result = analyzeCaptionReadability(
    [cue('Satu baris yang terlalu panjang\nBaris kedua\nBaris ketiga', 0, 1000)],
    {maxCharactersPerSecond: 10, maxCharactersPerLine: 12, maxLines: 2},
  );
  assert.equal(result.passed, false);
  assert.deepEqual(result.issues.map((issue) => issue.code), [
    'max-cps',
    'max-line-characters',
    'max-lines',
  ]);
  assert.equal(result.issues[1].lineIndex, 1);
  assert.equal(result.issues[2].captionIndex, 0);
});

test('reports word-per-minute warnings for educational profiles', () => {
  const result = analyzeCaptionReadability(
    [cue('Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh', 0, 2000)],
    CAPTION_QC_PRESETS.dcmpEducationalLower,
  );
  assert.equal(result.metrics[0].wordsPerMinute, 300);
  assert.equal(result.issues[0].code, 'max-wpm');
  assert.equal(result.issues[0].limit, 130);
});

test('reports minimum and maximum duration violations', () => {
  const result = analyzeCaptionReadability(
    [cue('Cepat', 0, 500), cue('Terlalu lama', 1000, 9000)],
    {minDurationMs: 800, maxDurationMs: 7000},
  );
  assert.deepEqual(result.issues.map((issue) => issue.code), ['min-duration', 'max-duration']);
});

test('counts Unicode code points and excludes line-break characters from CPS', () => {
  const result = analyzeCaptionReadability([cue('A😀\nB', 0, 1000)]);
  assert.equal(result.metrics[0].characterCount, 3);
  assert.equal(result.metrics[0].maxLineCharacters, 2);
});

test('preserves simultaneous overlapping dialogue cues', () => {
  const result = analyzeCaptionReadability(
    [cue('Pembicara A', 0, 2000), cue('Pembicara B', 1000, 2500)],
    {maxCharactersPerSecond: 20},
  );
  assert.equal(result.metrics.length, 2);
  assert.equal(result.metrics[1].captionIndex, 1);
  assert.equal(result.issues.length, 0);
});

test('rejects malformed cues and invalid or contradictory thresholds', () => {
  assert.throws(() => analyzeCaptionReadability([{text: ' ', startMs: 0, endMs: 1000}]), /non-empty text/);
  assert.throws(() => analyzeCaptionReadability([cue('Invalid', 10, 10)]), /endMs must be greater/);
  assert.throws(() => analyzeCaptionReadability([cue('Valid')], {maxLines: 1.5}), /positive integer/);
  assert.throws(() => analyzeCaptionReadability([cue('Valid')], {maxCharactersPerSecond: 0}), /positive finite number/);
  assert.throws(() => analyzeCaptionReadability([cue('Valid')], {minDurationMs: 3000, maxDurationMs: 2000}), /must not exceed/);
});

test('keeps reference presets explicit and audience-scoped', () => {
  assert.equal(CAPTION_QC_PRESETS.netflixEnglishAdult.maxCharactersPerSecond, 20);
  assert.equal(CAPTION_QC_PRESETS.netflixEnglishChildren.maxCharactersPerSecond, 17);
  assert.equal(CAPTION_QC_PRESETS.dcmpEducationalMiddle.maxWordsPerMinute, 140);
});
