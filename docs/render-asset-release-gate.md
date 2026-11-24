# Render asset release gate

The GitHub Actions render workflow checks project asset metadata and local files before it sets up the TTS environment, installs FFmpeg, generates shared audio, requests narration, or starts an MP4 render.

This is a production-safety gate, not a rights database, legal opinion, or proof that a particular asset is permitted for a specific use.

## Research basis

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) documents ordered workflow steps and optional workflow-dispatch inputs. The gate is placed as an ordinary step before all media-generation and rendering steps.
- [Remotion CLI render](https://www.remotion.dev/docs/cli/render) documents the explicit composition ID and output-location arguments. Remotion's interactive composition picker is not suitable for a non-interactive CI render, so the workflow resolves and validates its composition and asset project IDs before continuing.
- [Remotion render overview](https://www.remotion.dev/docs/render) describes CLI and GitHub Actions rendering options. The repository already uses its own GitHub Actions render workflow, so the gate is integrated into that existing path rather than creating a second renderer.

The sources were checked on 24 November 2026. The Remotion render overview identifies its page as last updated 23 November 2026.

## Project ID selection

The render workflow accepts an optional **asset_project_id** input:

- If omitted, it uses the selected **composition_id**.
- If a composition is an aspect-ratio variant such as **TunasDewa-YouTube-16x9**, provide the base project ID, for example **TunasDewa**.
- The ID must be 1–64 characters and contain only letters, numbers, hyphens, and underscores.

## Backward-compatible migration

The following existing projects are temporarily allowlisted because they predate per-project asset workspaces:

- **TunasKecil**
- **TunasDewa**
- **TunasPohon**
- **TrigonometriPraktik**
- **KyandraRoast**
- **GalaxyEducation**
- **SaifulSagita**
- **ImperialSolTeaser**

For an allowlisted project with no **public/projects/ProjectId/** directory, the gate reports a legacy skip and allows the existing render workflow to continue. Existing assets are not moved, copied, or retroactively assigned rights metadata.

For a non-legacy project ID without a workspace, the gate blocks rendering. If any project workspace directory exists, it must contain a regular **asset-manifest.json**; a missing or symlinked manifest is an error. This prevents an incomplete new workspace from silently bypassing the release check.

After a legacy project is migrated, create and review its project manifest, then remove its ID from **LEGACY_PROJECT_IDS** in **scripts/render-preflight.cjs**. Do not remove an ID before its manifest and referenced files have been checked.

## Validation behavior

For a manifest-managed project, the gate:

1. Validates the project ID and workspace location.
2. Rejects project-workspace symlinks and manifests that are not regular files.
3. Parses the project-local JSON manifest.
4. Checks that the manifest project ID matches the selected workspace.
5. Calls the existing asset validator with **releaseReady: true**.
6. Blocks pending or blocked rights-review entries, missing assets, unsafe paths, and symlinks that resolve outside the project workspace.
7. Returns a non-zero process exit code on failure, so later GitHub Actions steps do not run.

A successful result means the recorded metadata and local files passed the configured checks. It does not establish ownership, verify canonical SPDX identifiers against the live SPDX list, interpret license terms, or replace human rights review.

## Workflow order

The gate runs after dependency installation, static validation, unit tests, and Remotion composition discovery, but before:

- Python setup and neural TTS package installation
- FFmpeg installation for media assembly
- Shared music and sound-effect generation
- Composition-specific neural narration generation
- Remotion MP4 rendering
- MP4 validation and artifact upload

A gate failure therefore stops the render job before media-generation or render steps.

## Acceptance checks

- Legacy allowlisted project without a workspace: pass with an explicit skip.
- New project without a workspace: fail.
- Existing project workspace without a manifest: fail.
- Reviewed manifest with present, contained files: pass.
- Pending or blocked rights review: fail.
- Wrong project ID, malformed JSON, missing file, unsafe path, project symlink, or manifest symlink: fail.
- CI confirms the gate command appears before narration generation and the MP4 render step.
