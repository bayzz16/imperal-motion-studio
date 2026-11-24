'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const test = require('node:test');
const {LEGACY_PROJECT_IDS, runRenderPreflight} = require('./render-preflight.cjs');

const makeWorkspace = (projectId = 'SampleFilm') => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-render-preflight-'));
  const projectsRoot = path.join(temp, 'public', 'projects');
  const projectRoot = path.join(projectsRoot, projectId);
  fs.mkdirSync(path.join(projectRoot, 'assets'), {recursive: true});
  fs.writeFileSync(path.join(projectRoot, 'assets', 'opening.svg'), '<svg/>');
  const manifest = {
    schemaVersion: 1,
    projectId,
    assets: [{
      id: 'opening',
      path: 'assets/opening.svg',
      mediaType: 'image',
      source: {kind: 'original', creator: 'Project team'},
      rights: {reviewStatus: 'reviewed'},
    }],
  };
  const manifestPath = path.join(projectRoot, 'asset-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  return {temp, projectsRoot, projectRoot, manifest, manifestPath, cleanup: () => fs.rmSync(temp, {recursive: true, force: true})};
};

test('legacy projects without a workspace remain renderable during migration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-legacy-'));
  try {
    assert.ok(LEGACY_PROJECT_IDS.has('TunasDewa'));
    assert.equal(runRenderPreflight({projectId: 'TunasDewa', projectsRoot: path.join(root, 'missing')}).status, 'legacy-skip');
    assert.equal(runRenderPreflight({projectId: 'TunasDewa', projectsRoot: root}).status, 'legacy-skip');
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('new projects without a workspace or manifest are blocked', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-new-project-'));
  try {
    const result = runRenderPreflight({projectId: 'NewDocumentary', projectsRoot: root});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'manifest.required'));
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('a workspace that has opted into project assets must contain a manifest', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-incomplete-project-'));
  const projectRoot = path.join(root, 'NewFilm');
  fs.mkdirSync(projectRoot, {recursive: true});
  try {
    const result = runRenderPreflight({projectId: 'NewFilm', projectsRoot: root});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'manifest.missing'));
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('reviewed project assets pass the release preflight', () => {
  const fixture = makeWorkspace();
  try {
    const result = runRenderPreflight({projectId: 'SampleFilm', projectsRoot: fixture.projectsRoot});
    assert.equal(result.status, 'passed');
    assert.deepEqual(result.errors, []);
  } finally {
    fixture.cleanup();
  }
});

test('pending rights review blocks release before the render step', () => {
  const fixture = makeWorkspace();
  try {
    fixture.manifest.assets[0].rights.reviewStatus = 'pending';
    fs.writeFileSync(fixture.manifestPath, JSON.stringify(fixture.manifest));
    const result = runRenderPreflight({projectId: 'SampleFilm', projectsRoot: fixture.projectsRoot});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'asset.review-pending'));
  } finally {
    fixture.cleanup();
  }
});

test('blocked rights status always prevents release', () => {
  const fixture = makeWorkspace();
  try {
    fixture.manifest.assets[0].rights.reviewStatus = 'blocked';
    fs.writeFileSync(fixture.manifestPath, JSON.stringify(fixture.manifest));
    const result = runRenderPreflight({projectId: 'SampleFilm', projectsRoot: fixture.projectsRoot});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'asset.blocked'));
  } finally {
    fixture.cleanup();
  }
});

test('manifest project identity must match the selected project workspace', () => {
  const fixture = makeWorkspace();
  try {
    fixture.manifest.projectId = 'OtherProject';
    fs.writeFileSync(fixture.manifestPath, JSON.stringify(fixture.manifest));
    const result = runRenderPreflight({projectId: 'SampleFilm', projectsRoot: fixture.projectsRoot});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'manifest.project-mismatch'));
  } finally {
    fixture.cleanup();
  }
});

test('missing referenced files prevent release', () => {
  const fixture = makeWorkspace();
  try {
    fixture.manifest.assets[0].path = 'assets/missing.svg';
    fs.writeFileSync(fixture.manifestPath, JSON.stringify(fixture.manifest));
    const result = runRenderPreflight({projectId: 'SampleFilm', projectsRoot: fixture.projectsRoot});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'asset.file'));
  } finally {
    fixture.cleanup();
  }
});

test('project workspace symlinks are rejected', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-project-symlink-'));
  const projectsRoot = path.join(parent, 'projects');
  const outside = path.join(parent, 'outside');
  fs.mkdirSync(projectsRoot);
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(projectsRoot, 'SampleFilm'), 'dir');
  try {
    const result = runRenderPreflight({projectId: 'SampleFilm', projectsRoot});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'project.type'));
  } finally {
    fs.rmSync(parent, {recursive: true, force: true});
  }
});

test('manifest symlinks are rejected', () => {
  const fixture = makeWorkspace();
  const outside = path.join(fixture.temp, 'outside-manifest.json');
  fs.writeFileSync(outside, JSON.stringify(fixture.manifest));
  fs.rmSync(fixture.manifestPath);
  fs.symlinkSync(outside, fixture.manifestPath);
  try {
    const result = runRenderPreflight({projectId: 'SampleFilm', projectsRoot: fixture.projectsRoot});
    assert.equal(result.status, 'blocked');
    assert.ok(result.errors.some((item) => item.code === 'manifest.type'));
  } finally {
    fixture.cleanup();
  }
});

test('invalid project IDs are rejected before filesystem access', () => {
  const result = runRenderPreflight({projectId: '../TunasDewa', projectsRoot: '/does/not/matter'});
  assert.equal(result.status, 'blocked');
  assert.ok(result.errors.some((item) => item.code === 'project.id'));
});

test('CLI exits successfully for an allowlisted legacy project', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'imperal-preflight-cli-'));
  try {
    const cli = path.join(__dirname, 'render-preflight.cjs');
    const result = spawnSync(process.execPath, [cli, 'TunasDewa'], {cwd: temp, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /LEGACY PROJECT/);
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
});


test('CLI exits non-zero for a pending project manifest', () => {
  const fixture = makeWorkspace();
  try {
    fixture.manifest.assets[0].rights.reviewStatus = 'pending';
    fs.writeFileSync(fixture.manifestPath, JSON.stringify(fixture.manifest));
    const cli = path.join(__dirname, 'render-preflight.cjs');
    const result = spawnSync(process.execPath, [cli, 'SampleFilm'], {cwd: fixture.temp, encoding: 'utf8'});
    assert.equal(result.status, 1);
    assert.match(result.stderr, /asset.review-pending/);
  } finally {
    fixture.cleanup();
  }
});

test('render workflow runs the asset gate before dependency setup, media generation and MP4 rendering', () => {
  const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'render-video.yml');
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  const preflight = workflow.indexOf('node scripts/render-preflight.cjs "$ASSET_PROJECT_ID"');
  const python = workflow.indexOf('      - name: Set up Python for neural narration');
  const ttsInstall = workflow.indexOf('      - name: Install neural Indonesian TTS');
  const ffmpeg = workflow.indexOf('      - name: Install FFmpeg for narration assembly and duration measurement');
  const audio = workflow.indexOf('      - name: Generate original music and sound effects');
  const narration = workflow.indexOf('      - name: Generate composition-specific Indonesian neural narration');
  const render = workflow.indexOf('      - name: Render MP4');
  assert.ok(preflight >= 0, 'preflight command is missing');
  assert.ok(python > preflight, 'preflight must precede Python setup');
  assert.ok(ttsInstall > python, 'Python setup must precede TTS installation');
  assert.ok(ffmpeg > ttsInstall, 'preflight must precede FFmpeg installation');
  assert.ok(audio > ffmpeg, 'FFmpeg installation must precede audio generation');
  assert.ok(narration > audio, 'audio generation must precede narration generation');
  assert.ok(render > narration, 'narration generation must precede MP4 rendering');
  assert.match(workflow, /asset_project_id:[\s\S]*?required: false/);
  assert.match(workflow, /ASSET_PROJECT_ID="\$COMPOSITION_ID"/);
});
