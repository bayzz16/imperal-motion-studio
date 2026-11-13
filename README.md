# IMPERAL Motion Studio

A reusable, multi-project video production workspace powered by [Remotion](https://www.remotion.dev/). Each video is an independent composition registered in the shared project registry.

## Included projects

- **TunasKecil** — the original 90-second vertical sample about a small team growing through collaboration.
- **TunasDewa** — an 90-second cinematic sequel about a seed growing into a monumental tree, with eight skills, setbacks, recovery, transformation, Indonesian narration, music, and sound effects.

Both projects are separate Remotion compositions registered in `src/projects/registry.ts`. TunasKecil remains intact.

## Shared studio capabilities

- Remotion Studio for previewing compositions.
- Project registry for independent compositions.
- Reusable sequential scene-timeline planning and a Remotion `SceneSequence` adapter.
- Automated scene-timeline unit tests.
- Deterministic camera-movement utility in `src/motion/camera-moves.ts`.
- GitHub Actions rendering to MP4, with downloadable artifacts retained for 14 days.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run studio
```

## Validate changes

```bash
npm run typecheck
npm test
npm run compositions
```

## Render Tunas Kecil

```bash
npm run render:tunas
```

Output: `out/tunas-kecil.mp4`.

## Render Tunas Dewa with narration

Install eSpeak NG first, and make sure the `espeak-ng` command is available in your terminal. The renderer uses its Indonesian voice to synthesize the narration WAV locally.

```bash
npm run render:tunas-dewa
```

Output: `out/tunas-dewa.mp4`.

**Voice quality note:** the included Indonesian narration is generated with eSpeak NG, an offline speech synthesizer. It is a real spoken audio track, but it has a noticeably synthetic/computer-generated timbre rather than a natural studio voice. The narration WAV can be replaced with a recording or a separately licensed TTS voice without changing the video composition.

## Render on GitHub

The **Render video** workflow supports both:

- **Automatic rendering:** pushes to `main` that change files under `.github/workflows/`, `src/`, `scripts/`, `public/`, or `package.json`. The default render is now **TunasDewa**.
- **Manual rendering:** open **Actions → Render video → Run workflow**, then enter a registered composition ID and an MP4 filename. Available IDs: `TunasKecil` and `TunasDewa`.

The workflow installs eSpeak NG, runs TypeScript validation and unit tests, generates music/SFX and Indonesian narration, renders MP4, and uploads the artifact. After a successful run, download the MP4 from that run's **Artifacts** section.

## Add another video project

1. Create a new composition component in `src/` or a dedicated project folder.
2. Add its metadata and component to `VIDEO_PROJECTS` in `src/projects/registry.ts`.
3. Give it a unique Remotion composition ID and its own duration, frame rate, and dimensions.
4. Keep project-specific assets in a dedicated folder under `public/`.
5. Run `npm run typecheck`, `npm test`, and `npm run compositions`, then render the new composition.

The shared registry is project-agnostic; neither TunasKecil nor TunasDewa is hard-coded into the studio core.

## Build a sequential scene timeline

`buildSceneTimeline` validates scene IDs and frame durations, then calculates each scene's start and exclusive end frame. `SceneSequence` maps an individual placement to Remotion's `Sequence` component. The planner handles sequential placement and gaps; it does not yet implement overlapping layers or transitions.

## Dialogue voice library

The reusable voice library lives in `src/voice/`. It contains voice-profile metadata and a playback component for prepared recordings. The Tunas Dewa composition uses a separate generated narration WAV so that its narration can be replaced independently.

## Verification status

Do not describe a new composition as fully verified until its own GitHub Actions run completes TypeScript validation, tests, narration generation, MP4 rendering, and artifact upload. A successful render confirms the automated pipeline; a separate manual visual and audio review is still needed for creative quality assurance.

Do not commit secrets, private API keys, or media you do not have permission to use.
