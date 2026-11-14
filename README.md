# IMPERAL Motion Studio

A reusable, multi-project video production workspace powered by [Remotion](https://www.remotion.dev/). Each video is an independent composition registered in the shared project registry.

## Included projects

- **TunasKecil** — the original 90-second vertical sample about a small team growing through collaboration.
- **TunasDewa** — a 90-second cinematic story about a seed growing into a monumental tree, with eight skills, setbacks, recovery, transformation, natural Indonesian neural narration, music, and sound effects.
- **ImperialSolTeaser** — a 72-second vertical Minecraft-inspired cinematic teaser for Imperial × Slice of Life. It deliberately avoids revealing unreleased server features.

All projects are separate Remotion compositions registered in `src/projects/registry.ts`. Existing projects remain independent.

## Shared studio capabilities

- Remotion Studio for previewing compositions.
- Project registry for independent compositions.
- Reusable sequential scene-timeline planning and a Remotion `SceneSequence` adapter.
- Automated scene-timeline unit tests.
- Deterministic camera movement and reusable frame-driven motion/orbit mathematics in `src/motion/`.
- Reusable spring response, cubic-bezier easing, range mapping, and damped oscillation primitives in `src/motion/physics.ts`.
- Camera movement regression tests covering all presets, deterministic output, frame clamping, and invalid inputs.
- Motion-physics tests covering spring overshoot, easing endpoints, range mapping, damping, and invalid parameters.
- Adaptive cinematic render profiles that select output scale and render concurrency from available RAM and CPU resources.
- Reusable animated celestial-body visuals (axial rotation, surface shading, atmosphere, clouds, and ring layers) in `src/visual/`.
- Motion regression tests plus MP4 validation for video/audio streams, duration, and dimensions.
- GitHub Actions rendering to MP4, with downloadable artifacts retained for 14 days.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run studio
```

## Adaptive cinematic rendering

GitHub Actions selects a conservative render profile from the runner's available memory and CPU count. The profile adjusts Remotion output scale and concurrency while keeping the composition frame rate unchanged. The renderer still processes the full composition timeline unless a frame range is explicitly requested.

Profiles range from standard (1x) through balanced (1.25x), high (1.5x), and ultra (2x). Scaling increases output dimensions and can improve vector/text rasterization detail; it does not create new source-image detail, and it increases render cost. The workflow also uses H.264 CRF 18 and a high JPEG frame quality setting.

The profile resolver is covered by unit tests in `scripts/render-profile.test.cjs`. Its thresholds are resource heuristics, not a guarantee that every render will fit available memory.

## Validate changes

```bash
npm run typecheck
npm test
npm run compositions
npm run validate:render
```

## Render Tunas Kecil

```bash
npm run render:tunas
```

Output: `out/tunas-kecil.mp4`.

## Render Imperial × Slice of Life teaser

Install the neural Indonesian voice dependency:

```bash
python -m venv .venv-tts
.venv-tts/bin/python -m pip install edge-tts==7.3.1
```

Then generate the shared music/SFX and teaser narration, and render:

```bash
node scripts/generate-audio.cjs
node scripts/generate-imperial-sol-voice.cjs
npx remotion render src/index.tsx ImperialSolTeaser out/imperial-sol-teaser.mp4
```

Output: `out/imperial-sol-teaser.mp4`. The composition is 1080×1920 at 30 FPS. The build measures each generated narration segment and derives scene start frames and total composition duration from the actual audio. The neural narration requires internet access and uses the online Microsoft Edge speech service through the community `edge-tts` client. If speech generation fails, the command stops rather than substituting a different voice.

## Render Tunas Dewa with natural narration

The narration uses the online Microsoft Edge neural speech service through the open-source `edge-tts` Python package. It uses the Indonesian male voice `id-ID-ArdiNeural` by default. Internet access is required when generating the voice; the resulting MP3 is then bundled into the rendered MP4.

Create a Python virtual environment and install the TTS dependency:

```bash
python -m venv .venv-tts
# macOS / Linux
.venv-tts/bin/python -m pip install edge-tts==7.3.1
# Windows PowerShell
.venv-tts\\Scripts\\python -m pip install edge-tts==7.3.1
```

Then render:

```bash
npm run render:tunas-dewa
```

Output: `out/tunas-dewa.mp4`. The narration voice, speaking rate, and pitch can be changed with `TTS_VOICE`, `TTS_RATE`, and `TTS_PITCH`.

**Important:** neural TTS uses an online service via an unofficial community client, not a locally installed human voice recording. Service availability or behavior may change. If synthesis fails, the build stops rather than silently reverting to the robotic eSpeak voice.

## Render on GitHub

The **Render video** workflow supports both:

- **Automatic rendering:** pushes to `main` that change files under `.github/workflows/`, `src/`, `scripts/`, `public/`, or `package.json`. The default render is **TunasDewa**.
- **Manual rendering:** open **Actions → Render video → Run workflow**, then enter a registered composition ID and an MP4 filename. Available IDs: `TunasKecil`, `TunasDewa`, and `ImperialSolTeaser`.

For the new teaser, use composition ID `ImperialSolTeaser` and filename `imperial-sol-teaser.mp4`. The workflow generates the narration that matches the selected composition, renders the MP4, and uploads it as an artifact. After a successful run, download the MP4 from that run's **Artifacts** section.

## Add another video project

1. Create a new composition component in `src/` or a dedicated project folder.
2. Add its metadata and component to `VIDEO_PROJECTS` in `src/projects/registry.ts`.
3. Give it a unique Remotion composition ID and its own duration, frame rate, and dimensions.
4. Keep project-specific assets in a dedicated folder under `public/`.
5. Run `npm run typecheck`, `npm test`, and `npm run compositions`, then render the new composition.

The shared registry is project-agnostic; each composition remains independently authored.

## Build a sequential scene timeline

`buildSceneTimeline` validates scene IDs and frame durations, then calculates each scene's start and exclusive end frame. `SceneSequence` maps an individual placement to Remotion's `Sequence` component. The planner handles sequential placement and gaps; it does not yet implement overlapping layers or transitions. Frame-based spring and easing helpers can drive independent visual layers without coupling the timeline planner to a specific visual style.

## Dialogue voice library

The reusable voice library lives in `src/voice/`. It contains voice-profile metadata and a playback component for prepared recordings. Each composition can use its own generated narration MP3.

## Verification status

Do not describe a new composition as fully verified until its own GitHub Actions run completes TypeScript validation, tests, narration generation, MP4 rendering, and artifact upload. A successful render confirms the automated pipeline; a separate manual visual and audio review is still needed for creative quality assurance.

Do not commit secrets, private API keys, or media you do not have permission to use.
