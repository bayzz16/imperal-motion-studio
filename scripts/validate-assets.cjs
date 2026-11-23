'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourcePath = path.join(__dirname, '..', 'src', 'assets', 'asset-manifest.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  reportDiagnostics: true,
});
if ((compiled.diagnostics ?? []).some((item) => item.category === ts.DiagnosticCategory.Error)) {
  throw new Error('Could not transpile the asset manifest validator.');
}
const loaded = {exports: {}};
new Function('exports', 'require', 'module', '__filename', '__dirname', compiled.outputText)(
  loaded.exports, require, loaded, sourcePath, path.dirname(sourcePath),
);
const {isSafeRelativeAssetPath, validateAssetManifest} = loaded.exports;

const isContained = (root, target) => {
  const relative = path.relative(root, target);
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};
const checkFile = (root, relativePath, label) => {
  if (!isSafeRelativeAssetPath(relativePath)) return label + ' is not a safe project-relative path.';
  const target = path.resolve(root, ...relativePath.split('/'));
  if (!isContained(root, target)) return label + ' escapes the project workspace.';
  if (!fs.existsSync(target)) return label + ' does not exist: ' + relativePath;
  try {
    const realTarget = fs.realpathSync(target);
    if (!isContained(root, realTarget)) return label + ' resolves outside the project workspace: ' + relativePath;
    if (!fs.statSync(realTarget).isFile()) return label + ' is not a regular file: ' + relativePath;
  } catch (error) {
    return label + ' cannot be inspected: ' + error.message;
  }
  return null;
};

const validateManifestFiles = (manifest, projectRoot, options = {}) => {
  const root = fs.realpathSync(projectRoot);
  const report = validateAssetManifest(manifest, options);
  const errors = [...report.errors];
  const warnings = [...report.warnings];
  if (Array.isArray(manifest?.assets)) manifest.assets.forEach((asset, index) => {
    if (!asset || typeof asset !== 'object') return;
    const fileError = checkFile(root, asset.path, 'assets[' + index + '].path');
    if (fileError) errors.push({code: 'asset.file', path: 'assets[' + index + '].path', message: fileError});
    if (asset.rights?.licenseTextPath !== undefined) {
      const licenseError = checkFile(root, asset.rights.licenseTextPath, 'assets[' + index + '].rights.licenseTextPath');
      if (licenseError) errors.push({code: 'asset.license-file', path: 'assets[' + index + '].rights.licenseTextPath', message: licenseError});
    }
  });
  return {valid: errors.length === 0, errors, warnings};
};

const main = () => {
  const args = process.argv.slice(2);
  const releaseReady = args.includes('--release');
  const positional = args.filter((item) => item !== '--release');
  if (positional.length !== 1) throw new Error('Usage: node scripts/validate-assets.cjs <project-root/asset-manifest.json> [--release]');
  const manifestPath = path.resolve(positional[0]);
  if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) throw new Error('Asset manifest not found: ' + manifestPath);
  const root = path.dirname(manifestPath);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const report = validateManifestFiles(manifest, root, {
    expectedProjectId: path.basename(root),
    releaseReady,
  });
  for (const item of report.warnings) console.warn('WARNING ' + item.code + ' ' + item.path + ': ' + item.message);
  for (const item of report.errors) console.error('ERROR ' + item.code + ' ' + item.path + ': ' + item.message);
  if (!report.valid) {
    console.error('Asset validation failed: ' + report.errors.length + ' error(s), ' + report.warnings.length + ' warning(s).');
    process.exitCode = 1;
    return;
  }
  console.log('Asset validation passed: ' + manifest.assets.length + ' asset(s), ' + report.warnings.length + ' warning(s).');
  if (releaseReady) console.log('Metadata release gate passed; this is not legal clearance.');
};

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {checkFile, isContained, validateManifestFiles};
