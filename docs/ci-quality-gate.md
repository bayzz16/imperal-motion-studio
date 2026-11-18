# Pull-request quality gate

## Decision

Add a lightweight GitHub Actions workflow that checks code changes before they are merged, without invoking narration providers or rendering MP4 files.

## Research and evidence

- GitHub Actions pull_request event documentation: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
  - The event runs for pull-request activity such as opened, synchronize, and reopened.
  - For an open, mergeable pull request, the default checkout ref is the synthetic merge ref, so the checks validate the proposed merge result against the target branch.
  - This workflow uses pull_request, not pull_request_target, because it needs to execute the proposed code and does not need write access.
- GitHub Actions workflow syntax and token permissions: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
  - Explicit permissions restrict the workflow token to contents: read.
- npm ci documentation: https://docs.npmjs.com/cli/npm-ci/
  - npm ci requires a committed package-lock.json or npm shrinkwrap file and fails when the lock does not match package.json.
- actions/setup-node documentation: https://github.com/actions/setup-node
  - npm caching is keyed from a lockfile; no lockfile is currently present in this repository.

## Why this fits IMPERAL Motion Studio

The existing render-video workflow runs syntax checks, typecheck, unit tests, composition discovery, TTS generation, and a full MP4 render on pushes to main or manual dispatch. It does not run on pull requests. Meanwhile, PRs #3–#6 contain changes that have not all received full-repository validation. A separate quality workflow gives contributors fast feedback before a merge and avoids spending time on TTS and video rendering for every code review.

## Scope

The workflow runs on relevant pull requests targeting main and on relevant pushes to main. It performs:

1. CommonJS syntax checks for scripts/**/*.cjs.
2. npm run typecheck.
3. npm test.
4. npm run compositions.

It does not install Python/TTS packages, invoke any speech provider, install FFmpeg, render videos, upload artifacts, or publish/deploy anything.

## Reproducibility limitation

package.json exists, but package-lock.json is not tracked. Therefore this first version uses npm install and does not enable setup-node's npm cache. This is a temporary compromise: transitive dependency resolution is not fully frozen. A lockfile should be generated and reviewed in an environment with npm registry access, then the workflow can switch to npm ci and lockfile-keyed caching. The current execution environment could not reach registry.npmjs.org because DNS resolution failed, so no lockfile was fabricated.

## Acceptance checks

- Workflow YAML parses and contains the expected pull_request and push triggers.
- Token permissions are read-only.
- No TTS, render, artifact-upload, deployment, or secret-dependent steps exist.
- The workflow runs the repository's existing typecheck, unit-test, and composition-discovery scripts.
- GitHub Actions must report a successful run on the new pull request before this workflow change is considered fully verified.

## Limitations

A passing quality workflow is not a creative approval and does not prove that a finished video looks or sounds good. Full MP4 rendering and human visual/audio review remain separate gates.
