'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'captions', 'caption-utils.ts');
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
assert.equal(errors.length, 0, 'Caption utilities should transpile without errors');

const captionModule = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(
  captionModule.exports,
  require,
  captionModule,
  sourcePath,
  path.dirname(sourcePath),
);
const {parseCaptionFile, validateCaptions, resolveCaptionLayout} = captionModule.exports;

test('parses strict SRT cues into the shared caption shape', () => {
  const parsed = parseCaptionFile(
    '1\n00:00:00,000 --> 00:00:01,500\nHalo dunia!\n\n2\n00:00:02,000 --> 00:00:03,000\nSelamat datang.',
    'srt',
  );

  assert.equal(parsed.length, 2);
  assert.deepEqual(
    parsed.map(({text, startMs, endMs}) => ({text, startMs, endMs})),
    [
      {text: 'Halo dunia!', startMs: 0, endMs: 1500},
      {text: 'Selamat datang.', startMs: 2000, endMs: 3000},
    ],
  );
});

test('parses WebVTT identifiers, settings and multi-line cue text', () => {
  const parsed = parseCaptionFile(
    'WEBVTT\n\nintro\n00:00:01.000 --> 00:00:03.000 align:start position:10%\nBaris pertama\nBaris kedua',
    'vtt',
  );

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].text, 'Baris pertama\nBaris kedua');
  assert.equal(parsed[0].startMs, 1000);
  assert.equal(parsed[0].endMs, 3000);
});

test('strict SRT parsing rejects malformed timing data', () => {
  assert.throws(
    () => parseCaptionFile('1\n00:00:03,000 --> 00:00:01,000\nTerbalik', 'srt'),
  );
});

test('validates cue text, timing, confidence and timestamp values', () => {
  const valid = {
    text: 'Caption',
    startMs: 0,
    endMs: 1000,
    timestampMs: 500,
    confidence: 0.9,
  };

  assert.equal(validateCaptions([valid]).length, 1);
  assert.throws(() => validateCaptions([{...valid, text: '  '}]), /non-empty text/);
  assert.throws(() => validateCaptions([{...valid, startMs: -1}]), /non-negative startMs/);
  assert.throws(() => validateCaptions([{...valid, endMs: 0}]), /endMs must be greater/);
  assert.throws(() => validateCaptions([{...valid, confidence: 1.1}]), /confidence must be between/);
  assert.throws(() => validateCaptions([{...valid, timestampMs: Number.NaN}]), /invalid timestampMs/);
});

test('stably sorts captions while preserving overlapping cues', () => {
  const later = {text: 'Later', startMs: 1000, endMs: 2000, timestampMs: 1500, confidence: null};
  const first = {text: 'First', startMs: 0, endMs: 1200, timestampMs: 600, confidence: null};
  const overlap = {text: 'Overlap', startMs: 1000, endMs: 1800, timestampMs: 1400, confidence: null};
  const sorted = validateCaptions([later, first, overlap]);

  assert.deepEqual(sorted.map((cue) => cue.text), ['First', 'Later', 'Overlap']);
  assert.equal(sorted[1].endMs, 2000);
  assert.equal(sorted[2].startMs, 1000);
});

test('resolves proportional safe areas for vertical and landscape canvases', () => {
  const vertical = resolveCaptionLayout({width: 1080, height: 1920});
  assert.equal(vertical.horizontalInset, 86.4);
  assert.equal(vertical.bottomInset, 230.4);
  assert.equal(vertical.maxWidth, 907.2);
  assert.equal(vertical.fontSize, 47.52);

  const landscape = resolveCaptionLayout({width: 1920, height: 1080, fontSize: 48});
  assert.equal(landscape.maxWidth, 1612.8);
  assert.equal(landscape.fontSize, 48);
});

test('rejects invalid canvas dimensions, safe areas and font sizes', () => {
  assert.throws(() => resolveCaptionLayout({width: 0, height: 1080}), /width must be/);
  assert.throws(() => resolveCaptionLayout({width: 1920, height: Number.NaN}), /height must be/);
  assert.throws(() => resolveCaptionLayout({width: 1920, height: 1080, horizontalSafeArea: 0.5}), /horizontalSafeArea/);
  assert.throws(() => resolveCaptionLayout({width: 1920, height: 1080, bottomSafeArea: -0.1}), /bottomSafeArea/);
  assert.throws(() => resolveCaptionLayout({width: 1920, height: 1080, fontSize: 0}), /fontSize/);
});
