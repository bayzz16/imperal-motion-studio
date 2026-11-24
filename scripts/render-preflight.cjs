'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {validateManifestFiles} = require('./validate-assets.cjs');

// Keep these suffixes aligned with OUTPUT_FORMATS in src/Root.tsx.
const COMPOSITION_FORMAT_SUFFIXES = [
  '-YouTube-16x9',
  '-Vertical-9x16',
  '-Instagram-4x5',
  '-Square-1x1',
];

// These projects predate the per-project manifest migration. Remove an ID
// from this set only after its workspace has a reviewed asset-manifest.json.
const LEGACY_PROJECT_IDS = new Set([
  'TunasKecil',
  'TunasDewa',
  'TunasPohon',
  'TrigonometriPraktik',
  'KyandraRoast',
  'GalaxyEducation',
  'SaifulSagita',
  'ImperialSolTeaser',
]);

const isContained = (root, target) => {
  const relative = path.relative(root, target);
  return relative !== '' && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};

const blocked = (projectId, code, message) => ({
  status: 'blocked',
  projectId,
  errors: [{code, message}],
  warnings: [],
});

const resolveBaseProjectId = (compositionId) => {
  if (typeof compositionId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(compositionId)) {
    return null;
  }
  const suffix = COMPOSITION_FORMAT_SUFFIXES.find((item) => compositionId.endsWith(item));
  const projectId = suffix ? compositionId.slice(0, -suffix.length) : compositionId;
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(projectId) ? projectId : null;
};

const legacyOrRequired = (projectId) => LEGACY_PROJECT_IDS.has(projectId)
  ? {status: 'legacy-skip', projectId, errors: [], warnings: []}
  : blocked(
    projectId,
    'manifest.required',
    'This project is not on the legacy allowlist and has no project workspace. Add public/projects/' + projectId + '/asset-manifest.json.',
  );

const runRenderPreflight = ({
  compositionId,
  assetProjectId,
  projectsRoot = path.join(process.cwd(), 'public', 'projects'),
} = {}) => {
  const projectId = resolveBaseProjectId(compositionId);
  if (!projectId) {
    return blocked(compositionId, 'composition.id', 'Composition ID is invalid or does not resolve to a supported 1–64 character project ID.');
  }
  if (assetProjectId !== undefined && assetProjectId !== '') {
    if (typeof assetProjectId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(assetProjectId)) {
      return blocked(projectId, 'project.id', 'Asset project ID must be a 1–64 character alphanumeric ID with hyphens or underscores.');
    }
    if (assetProjectId !== projectId) {
      return blocked(
        projectId,
        'project.mapping-mismatch',
        'asset_project_id must match the base project resolved from composition_id (' + projectId + ').',
      );
    }
  }

  const rootPath = path.resolve(projectsRoot);
  let rootStat;
  try {
    rootStat = fs.lstatSync(rootPath);
  } catch (error) {
    if (error.code !== 'ENOENT') return blocked(projectId, 'projects-root.inspect', error.message);
    return legacyOrRequired(projectId);
  }
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    return blocked(projectId, 'projects-root.type', 'The projects root must be a real directory, not a file or symlink.');
  }

  let realProjectsRoot;
  try {
    realProjectsRoot = fs.realpathSync(rootPath);
  } catch (error) {
    return blocked(projectId, 'projects-root.realpath', error.message);
  }

  const projectPath = path.join(realProjectsRoot, projectId);
  let projectStat;
  try {
    projectStat = fs.lstatSync(projectPath);
  } catch (error) {
    if (error.code !== 'ENOENT') return blocked(projectId, 'project.inspect', error.message);
    return legacyOrRequired(projectId);
  }
  if (!projectStat.isDirectory() || projectStat.isSymbolicLink()) {
    return blocked(projectId, 'project.type', 'Project workspace must be a real directory, not a file or symlink.');
  }

  let projectRoot;
  try {
    projectRoot = fs.realpathSync(projectPath);
  } catch (error) {
    return blocked(projectId, 'project.realpath', error.message);
  }
  if (!isContained(realProjectsRoot, projectRoot)) {
    return blocked(projectId, 'project.escape', 'Project workspace resolves outside the projects root.');
  }

  const manifestPath = path.join(projectRoot, 'asset-manifest.json');
  let manifestStat;
  try {
    manifestStat = fs.lstatSync(manifestPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return blocked(projectId, 'manifest.missing', 'A project workspace exists but asset-manifest.json is missing.');
    }
    return blocked(projectId, 'manifest.inspect', error.message);
  }
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) {
    return blocked(projectId, 'manifest.type', 'asset-manifest.json must be a regular file, not a symlink.');
  }

  let realManifestPath;
  try {
    realManifestPath = fs.realpathSync(manifestPath);
  } catch (error) {
    return blocked(projectId, 'manifest.realpath', error.message);
  }
  if (!isContained(projectRoot, realManifestPath)) {
    return blocked(projectId, 'manifest.escape', 'Asset manifest resolves outside the project workspace.');
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(realManifestPath, 'utf8'));
  } catch (error) {
    return blocked(projectId, 'manifest.json', 'Could not read asset-manifest.json: ' + error.message);
  }

  const report = validateManifestFiles(manifest, projectRoot, {
    expectedProjectId: projectId,
    releaseReady: true,
  });
  return {
    status: report.valid ? 'passed' : 'blocked',
    projectId,
    errors: report.errors,
    warnings: report.warnings,
  };
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2) {
    throw new Error('Usage: node scripts/render-preflight.cjs <composition-id> [asset-project-id]');
  }
  const result = runRenderPreflight({compositionId: args[0], assetProjectId: args[1]});
  if (result.status === 'legacy-skip') {
    console.log('LEGACY PROJECT: asset manifest not required yet for ' + result.projectId + '; render preflight skipped.');
    return;
  }
  for (const item of result.warnings) console.warn('WARNING ' + item.code + ': ' + item.message);
  for (const item of result.errors) console.error('ERROR ' + item.code + ': ' + item.message);
  if (result.status === 'blocked') {
    console.error('Render blocked by asset release preflight for ' + result.projectId + '.');
    process.exitCode = 1;
    return;
  }
  console.log('Asset release preflight passed for ' + result.projectId + '.');
  console.log('Metadata review is not legal clearance.');
};

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = {COMPOSITION_FORMAT_SUFFIXES, LEGACY_PROJECT_IDS, isContained, resolveBaseProjectId, runRenderPreflight};
