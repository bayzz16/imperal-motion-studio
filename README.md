# IMPERAL Motion Studio

A reusable, multi-project video production workspace powered by [Remotion](https://www.remotion.dev/). Each video is an independent composition registered in the shared project registry.

## Included projects

- **TunasKecil** — the original 90-second vertical sample about a small team growing through collaboration.
- **TunasDewa** — a 90-second cinematic metaphor about a seed growing into a monumental tree.
- **TunasPohon** — a 90-second botanical animation following a generic broadleaf tree from seed germination to mature tree, with roots, trunk, branches, foliage, weather, and Indonesian neural narration.
- **ImperialSolTeaser** — a 72-second vertical Minecraft-inspired cinematic teaser for Imperial × Slice of Life. It deliberately avoids revealing unreleased server features.

All projects are separate Remotion compositions registered in `src/projects/registry.ts`. Existing projects remain independent.

## Shared studio capabilities

- Remotion Studio for previewing compositions.
- Project registry for independent compositions.
- Reusable sequential scene-timeline planning and a Remotion `SceneSequence` adapter.
- Reusable visual scene transitions (fade, slide, wipe, and flip) with linear or spring timing in `src/transitions/`.
- Automated scene-timeline and transition-plan unit tests.
- Deterministic camera movement and reusable frame-driven motion/orbit mathematics in `src/motion/`.
- Reusable spring response, cubic-bezier easing, range mapping, and damped oscillation primitives in `src/motion/physics.ts`.
- Camera movement regression tests covering all presets, deterministic output, frame clamping, and invalid inputs.
- Motion-physics tests covering spring overshoot, easing endpoints, range mapping, damping, and invalid parameters.
- Adaptive cinematic render profiles that select output scale and render concurrency from available RAM and CPU resources.
- Reusable animated celestial-body visuals (axial rotation, surface shading, atmosphere, clouds, and ring layers) in `src/visual/`, now used by Galaxy Education.
- Shared cinematic finishing layer applied to every registered composition: subtle camera movement, restrained color grade, vignette, and low-opacity film texture.
- Extended MP4 quality checks for audio/video presence, dimensions, frame rate, A/V duration drift, full-stream decoding, possible black/frozen sections, and measured audio volume.
- Motion regression tests plus MP4 validation for video/audio streams, duration, dimensions, frame rate, A/V drift, and full-stream decode diagnostics.
- GitHub Actions rendering to MP4, with downloadable artifacts retained for 14 days.


## Botanical test video references

The new `TunasPohon` composition has a source-backed visual specification in [docs/reference-sheets/tunas-pohon.md](docs/reference-sheets/tunas-pohon.md). It uses authoritative botanical descriptions for germination and tree development, plus visual observations for early seedling form. The animation is a generic broadleaf tree, not a named species.

## Reference-first animation workflow

Every new animation must pass a **reference-first** stage before illustration or motion work begins:

1. **Understand the request** — identify the exact subject/type, setting, action, style, camera view, and required facts. Clarify ambiguity that changes the subject's identity.
2. **Research references** — collect several relevant visual references. Prefer authoritative scientific, educational, museum, or domain-specific sources for factual subjects. Inspect the actual images where available; a search-result title alone is not image inspection.
3. **Study the details** — document silhouette, proportions, structure/anatomy, color variation, materials, texture, part relationships, and realistic movement.
4. **Write a visual specification** — list defining details that must remain recognizable, motion constraints, framing notes, source links, and uncertainties.
5. **Create a keyframe or animatic** — compare it with the references before spending time on full animation.
6. **Animate and review** — preserve subject identity across shots and aspect ratios; inspect representative frames and correct visible mismatches before final rendering.

For example, a requested flower must be identified by type before it is drawn. The system should study its actual petal arrangement, center, stem, leaves, colors, and movement rather than using a generic flower symbol. Reference research informs an original design; it must not copy a protected character, artwork, or unlicensed asset.

**Honesty gate:** if reference browsing or image inspection is unavailable, the production notes must say so. Never invent sources or claim that references were inspected when they were not. A final render should not be marked creatively approved until the reference comparison has been reviewed.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run studio
```

## Adaptive cinematic rendering

GitHub Actions selects a conservative render profile from the runner's available memory and CPU count. The profile adjusts Remotion output scale and concurrency while keeping the composition frame rate unchanged. The renderer still processes the full composition timeline unless a frame range is explicitly requested.

Profiles range from standard (1x) through balanced (1.25x), high (1.5x), and ultra (2x). Scaling increases output dimensions and can improve vector/text rasterization detail; it does not create new source-image detail, and it increases render cost. The workflow also uses H.264 CRF 18 and a high JPEG frame quality setting.

The profile resolver is covered by unit tests in `scripts/render-profile.test.cjs`. Its thresholds are resource heuristics, not a guarantee that every render will fit available memory. The shared cinematic finish is tested in `scripts/cinematic-style.test.cjs`; media metadata and quality-log parsing are tested in `scripts/validate-render.test.cjs`. The full-stream black/freeze scan is advisory because intentional fades and static shots can trigger detections.

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
- **Manual rendering:** open **Actions → Render video → Run workflow**, then enter a registered composition ID and an MP4 filename. Available IDs: `TunasKecil`, `TunasDewa`, `TunasPohon`, `TrigonometriPraktik`, `KyandraRoast`, `GalaxyEducation`, and `ImperialSolTeaser`.

For the botanical growth test, use composition ID `TunasPohon` and filename `tunas-pohon.mp4`. For the new teaser, use composition ID `ImperialSolTeaser` and filename `imperial-sol-teaser.mp4`. The workflow generates the narration that matches the selected composition, renders the MP4, and uploads it as an artifact. After a successful run, download the MP4 from that run's **Artifacts** section.

Before TTS setup, FFmpeg installation, audio generation, narration generation, and MP4 rendering, the workflow runs the project asset release gate. Existing project IDs temporarily allowlisted during migration may render without a manifest while they have no `public/projects/<ProjectId>/` workspace. Once a project workspace is created, it must contain a valid `asset-manifest.json`; new project IDs require a manifest from their first render. Aspect-ratio composition IDs are mapped to their base project automatically; the optional `asset_project_id` input is only an explicit override and must match that base. Pending or blocked rights reviews stop the workflow before media generation. This is a metadata and file-integrity check, not legal clearance. See [render asset release gate](docs/render-asset-release-gate.md).
For tooling-only commits that should not trigger an automatic MP4 render, include `[skip-render]` in the commit message; manual **workflow_dispatch** runs remain available.

## Add another video project

1. Create a new composition component in `src/` or a dedicated project folder.
2. Add its metadata and component to `VIDEO_PROJECTS` in `src/projects/registry.ts`.
3. Give it a unique Remotion composition ID and its own duration, frame rate, and dimensions.
4. Keep project-specific assets in a dedicated folder under `public/`.
5. Run `npm run typecheck`, `npm test`, and `npm run compositions`, then render the new composition.

The shared registry is project-agnostic; each composition remains independently authored.

## Build a sequential scene timeline

`buildSceneTimeline` validates scene IDs and frame durations, then calculates each scene's start and exclusive end frame. `SceneSequence` maps an individual placement to Remotion's `Sequence` component. The planner supports sequential placement, explicit gaps, and pairwise scene overlaps via `transitionAfterFrames`; it exposes transition-in/out frame counts so scene components can drive their own animation. The planner does not choose or render a visual transition. Frame-based spring and easing helpers can drive independent visual layers without coupling the timeline planner to a specific visual style. See [overlap-aware timeline planning](docs/overlap-aware-scene-timeline.md).

## Reusable visual scene transitions

`SceneTransitionSeries` turns scene descriptors into Remotion's `TransitionSeries` sequence. Set `transitionAfterFrames` on a scene to add a transition before the next scene. The default is a two-sided fade; `slide`, `wipe`, and `flip` are also available, with linear or spring timing. See [cinematic transition engine](docs/cinematic-transitions.md) for the API, constraints, and licensing notes.

## Subtitles and captions

The shared caption system uses the Remotion `Caption` data shape and supports importing existing SRT and WebVTT text. It does not generate transcripts automatically.

```tsx
import {parseCaptionFile} from './captions/caption-utils';
import {CaptionTrack} from './captions/CaptionTrack';

const captions = parseCaptionFile(subtitleText, 'vtt'); // or 'srt'

// Inside a Remotion composition:
<CaptionTrack captions={captions} />
```

`CaptionTrack` selects cues from the current Remotion frame, stacks overlapping cues, and keeps text inside configurable canvas-relative safe areas. Defaults reserve 8% horizontally and 12% at the bottom. The background, text color, and font size can be adjusted per project. If subtitle text is fetched asynchronously inside a composition, use Remotion's `useDelayRender()` pattern so rendering waits for the file to load.

## Dialogue voice library

The reusable voice library lives in `src/voice/`. It contains voice-profile metadata and a playback component for prepared recordings. Each composition can use its own generated narration MP3.

## Verification status

Do not describe a new composition as fully verified until its own GitHub Actions run completes TypeScript validation, tests, narration generation, MP4 rendering, and artifact upload. A successful render confirms the automated pipeline; a separate manual visual and audio review is still needed for creative quality assurance.

Do not commit secrets, private API keys, or media you do not have permission to use.
