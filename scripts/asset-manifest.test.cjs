'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const test = require('node:test');
const ts = require('typescript');
const sourcePath = path.join(__dirname, '..', 'src', 'assets', 'asset-manifest.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0);
const loaded = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(loaded.exports, require, loaded, sourcePath, path.dirname(sourcePath));
const {hasValidSpdxExpressionSyntax, isSafeRelativeAssetPath, validateAssetManifest} = loaded.exports;
const {validateManifestFiles} = require('./validate-assets.cjs');

const thirdPartyManifest = () => ({
  schemaVersion: 1,
  projectId: 'SampleFilm',
  assets: [{
    id: 'opening-photo', path: 'assets/opening-photo.png', mediaType: 'image',
    source: {kind: 'third-party', title: 'Example photograph', creator: 'Example Creator', url: 'https://example.org/original-photo'},
    rights: {reviewStatus: 'reviewed', licenseExpression: 'CC-BY-4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'Example Creator — Example photograph — CC BY 4.0', modified: true, modificationNotice: 'Cropped and color-adjusted.'},
  }],
});

test('accepts reviewed third-party assets with source, license and attribution', () => {
  const report = validateAssetManifest(thirdPartyManifest(), {expectedProjectId: 'SampleFilm', releaseReady: true});
  assert.equal(report.valid, true);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
});

test('accepts original assets without inventing a third-party license', () => {
  const manifest = {schemaVersion: 1, projectId: 'SampleFilm', assets: [{
    id: 'title-card', path: 'graphics/title.svg', mediaType: 'image',
    source: {kind: 'original', creator: 'IMPERAL Motion Studio'}, rights: {reviewStatus: 'reviewed'},
  }]};
  assert.equal(validateAssetManifest(manifest, {releaseReady: true}).valid, true);
});

test('requires a generating tool and reviewed terms for generated assets', () => {
  const manifest = thirdPartyManifest();
  manifest.assets[0].source = {kind: 'generated'};
  manifest.assets[0].rights.licenseExpression = undefined;
  manifest.assets[0].rights.licenseUrl = undefined;
  const report = validateAssetManifest(manifest);
  assert.ok(report.errors.some((item) => item.code === 'asset.tool-required'));
  manifest.assets[0].source.toolName = 'Example image tool';
  assert.ok(validateAssetManifest(manifest).errors.some((item) => item.code === 'asset.generated-license-required'));
});

test('requires third-party source URL and license metadata', () => {
  const manifest = thirdPartyManifest();
  manifest.assets[0].source.url = '';
  manifest.assets[0].rights.licenseExpression = '';
  manifest.assets[0].rights.licenseUrl = '';
  const codes = validateAssetManifest(manifest).errors.map((item) => item.code);
  assert.ok(codes.includes('asset.source-url'));
  assert.ok(codes.includes('asset.license-required'));
  assert.ok(codes.includes('asset.license-reference-required'));
});

test('rejects duplicate IDs and case-insensitive duplicate paths', () => {
  const manifest = thirdPartyManifest();
  manifest.assets.push({...manifest.assets[0], id: 'second-photo', path: 'ASSETS/OPENING-PHOTO.PNG'});
  const codes = validateAssetManifest(manifest).errors.map((item) => item.code);
  assert.ok(codes.includes('asset.duplicate-path'));
  manifest.assets[1].id = 'opening-photo';
  assert.ok(validateAssetManifest(manifest).errors.some((item) => item.code === 'asset.duplicate-id'));
});

test('rejects malformed project IDs, mismatched projects and unsupported media/origin values', () => {
  const manifest = thirdPartyManifest();
  assert.ok(validateAssetManifest(manifest, {expectedProjectId: 'Other'}).errors.some((item) => item.code === 'manifest.project-mismatch'));
  manifest.projectId = '../Other';
  manifest.assets[0].mediaType = 'binary';
  manifest.assets[0].source.kind = 'remote';
  const codes = validateAssetManifest(manifest).errors.map((item) => item.code);
  assert.ok(codes.includes('manifest.project-id'));
  assert.ok(codes.includes('asset.media-type'));
  assert.ok(codes.includes('asset.origin'));
});

test('rejects absolute, traversal, backslash and non-normalized asset paths', () => {
  for (const value of ['', '../outside.png', 'assets/../outside.png', '/etc/passwd', 'C:/file.png', 'assets\\file.png', 'assets:stream.png', 'assets//file.png', './file.png']) {
    assert.equal(isSafeRelativeAssetPath(value), false, value);
  }
  assert.equal(isSafeRelativeAssetPath('assets/photo 01.png'), true);
});

test('checks SPDX expression syntax including LicenseRef and DocumentRef forms', () => {
  for (const value of ['CC-BY-4.0', 'MIT AND Apache-2.0', 'MIT OR BSD-3-Clause', '(MIT OR BSD-3-Clause) AND Apache-2.0', 'GPL-2.0-only WITH Classpath-exception-2.0', 'LicenseRef-Custom-1', 'DocumentRef-ThirdParty:LicenseRef-Custom-1']) {
    assert.equal(hasValidSpdxExpressionSyntax(value), true, value);
  }
  for (const value of ['', 'CC BY 4.0', 'MIT AND', 'AND MIT', 'MIT OR (BSD-3-Clause', 'MIT And BSD-3-Clause', '(MIT OR BSD-3-Clause) WITH Classpath-exception-2.0', 'LicenseRef-Custom-1+']) {
    assert.equal(hasValidSpdxExpressionSyntax(value), false, value);
  }
});

test('requires a URL or local text for custom LicenseRef terms', () => {
  const manifest = thirdPartyManifest();
  manifest.assets[0].rights.licenseExpression = 'LicenseRef-Custom-Terms';
  manifest.assets[0].rights.licenseUrl = undefined;
  assert.ok(validateAssetManifest(manifest).errors.some((item) => item.code === 'asset.license-reference-required'));
});

test('pending review warns normally and blocks release; blocked always fails', () => {
  const manifest = thirdPartyManifest();
  manifest.assets[0].rights.reviewStatus = 'pending';
  const normal = validateAssetManifest(manifest);
  assert.equal(normal.valid, true);
  assert.ok(normal.warnings.some((item) => item.code === 'asset.review-pending'));
  assert.ok(validateAssetManifest(manifest, {releaseReady: true}).errors.some((item) => item.code === 'asset.review-pending'));
  manifest.assets[0].rights.reviewStatus = 'blocked';
  assert.ok(validateAssetManifest(manifest).errors.some((item) => item.code === 'asset.blocked'));
});

test('warns when a modified asset has no modification notice', () => {
  const manifest = thirdPartyManifest();
  manifest.assets[0].rights.modificationNotice = '';
  assert.ok(validateAssetManifest(manifest).warnings.some((item) => item.code === 'asset.modification-notice-missing'));
});

test('checks asset and custom license files inside the project root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-assets-'));
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'assets', 'opening-photo.png'), 'fixture');
  fs.writeFileSync(path.join(root, 'LICENSE.txt'), 'Custom terms');
  const manifest = thirdPartyManifest();
  manifest.assets[0].rights.licenseExpression = 'LicenseRef-Custom-Terms';
  manifest.assets[0].rights.licenseTextPath = 'LICENSE.txt';
  const report = validateManifestFiles(manifest, root, {releaseReady: true});
  assert.equal(report.valid, true);
  fs.rmSync(root, {recursive: true, force: true});
});

test('rejects missing assets and symlinks that resolve outside the project root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-assets-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-outside-'));
  const missing = validateManifestFiles(thirdPartyManifest(), root);
  assert.ok(missing.errors.some((item) => item.code === 'asset.file'));
  fs.writeFileSync(path.join(outside, 'outside.png'), 'fixture');
  fs.symlinkSync(path.join(outside, 'outside.png'), path.join(root, 'linked.png'));
  const manifest = thirdPartyManifest();
  manifest.assets[0].path = 'linked.png';
  const linked = validateManifestFiles(manifest, root);
  assert.ok(linked.errors.some((item) => item.code === 'asset.file' && item.message.includes('outside')));
  fs.rmSync(root, {recursive: true, force: true});
  fs.rmSync(outside, {recursive: true, force: true});
});

test('CLI passes reviewed files and blocks pending rights in release mode', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-project-'));
  const root = path.join(parent, 'SampleFilm');
  fs.mkdirSync(path.join(root, 'assets'), {recursive: true});
  fs.writeFileSync(path.join(root, 'assets', 'opening-photo.png'), 'fixture');
  const manifestPath = path.join(root, 'asset-manifest.json');
  const manifest = thirdPartyManifest();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const cli = path.join(__dirname, 'validate-assets.cjs');
  const pass = spawnSync(process.execPath, [cli, manifestPath, '--release'], {encoding: 'utf8'});
  assert.equal(pass.status, 0, pass.stderr);
  manifest.assets[0].rights.reviewStatus = 'pending';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const fail = spawnSync(process.execPath, [cli, manifestPath, '--release'], {encoding: 'utf8'});
  assert.equal(fail.status, 1);
  assert.match(fail.stderr, /rights review is pending/i);
  fs.rmSync(parent, {recursive: true, force: true});
});
