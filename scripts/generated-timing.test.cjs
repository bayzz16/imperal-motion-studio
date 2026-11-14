const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const generatedDir = path.join(root, 'src', 'generated');

test('all generated timing files are valid TypeScript modules', () => {
  const files = fs.readdirSync(generatedDir).filter((file) => file.endsWith('-timing.ts'));
  assert.ok(files.length > 0, 'Expected at least one generated timing module');

  for (const file of files) {
    const source = fs.readFileSync(path.join(generatedDir, file), 'utf8');
    assert.ok(source.trim().length > 0, file + ' must not be empty');

    const result = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
      },
      reportDiagnostics: true,
    });
    const errors = (result.diagnostics || []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    assert.equal(
      errors.length,
      0,
      file + ' must transpile: ' + errors.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
      ).join('; '),
    );
    assert.match(source, /export\\s+const\\s+/);
  }
});

test('trigonometry timing defaults use real line breaks, not escaped separator text', () => {
  const source = fs.readFileSync(path.join(generatedDir, 'trigonometri-timing.ts'), 'utf8');
  assert.doesNotMatch(source, /\\\\n/);
  assert.match(source, /export const TRIGONOMETRI_DIALOGUE_CUES/);
  assert.match(source, /export const TRIGONOMETRI_DURATION_FRAMES/);
});

test('trigonometry narration generator has valid JavaScript syntax', () => {
  const source = fs.readFileSync(path.join(root, 'scripts', 'generate-trigonometri-voice.cjs'), 'utf8');
  assert.doesNotThrow(() => new vm.Script(source, {filename: 'generate-trigonometri-voice.cjs'}));
});
