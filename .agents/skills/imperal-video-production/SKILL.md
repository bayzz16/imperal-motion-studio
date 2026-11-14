---
name: imperal-video-production
description: Production workflow for multi-project Remotion videos in IMPERAL Motion Studio.
---

# IMPERAL Video Production Skill

Treat this repository as a reusable production engine, not unrelated one-off compositions.

## System-wide standards
- Prefer shared, typed, deterministic components for motion, camera, lighting, scene transitions, typography, audio, and reusable subjects.
- Keep project story, copy, assets, and art direction isolated from shared engine code.
- Make animation frame-driven and deterministic. Avoid wall-clock time and unseeded randomness.
- Validate public component inputs and add regression tests for shared helpers.
- Add heavyweight dependencies only when their rendering benefit is measured.

## Visual standards
- Build depth with layered lighting, atmospheric perspective, highlights, shadows, texture, parallax, and controlled camera movement.
- Use object-specific motion: axial spin, orbital movement, environmental drift, and secondary animation.
- Preserve visual continuity. Avoid static icons when a subject should visibly move.
- Keep labels readable on mobile and maintain safe margins for vertical and horizontal formats.

## Audio standards
- Keep narration, music, ambience, and effects on separate tracks.
- Measure generated narration duration and derive cue positions from actual files.
- Duck music under speech, fade transitions, and avoid clipping.
- Use original or properly licensed assets and record provenance.
- Validate every generated file before rendering.

## Automated quality gates
- Install dependencies with the lockfile when present.
- Run TypeScript validation, unit tests, and Remotion composition discovery.
- Validate IDs, frame rate, dimensions, duration, and referenced asset paths.
- Render the requested composition and inspect the MP4 with FFprobe.
- Extract contact sheets and listen to representative audio sections where possible.
- A successful CI render is not the same as human creative review.

## Architecture
- src/projects: independent compositions and metadata.
- src/motion: reusable frame-driven motion and camera mathematics.
- src/visual: reusable visual subjects and scene primitives.
- src/timeline: timeline planning and sequencing.
- src/voice: voice metadata and prepared dialogue tracks.
- scripts: deterministic asset generation, validation, and QA.
- .github/workflows: CI validation, rendering, and artifact upload.
