# IMPERAL Motion Studio

A reusable, multi-project video production workspace powered by [Remotion](https://www.remotion.dev/). Each video is an independent composition registered in the shared project registry.

## Included projects

- **TunasKecil** — the original 90-second vertical sample about a small team growing through collaboration.
- **TunasDewa** — a 90-second cinematic story about a seed growing into a monumental tree, with Indonesian neural narration, music, and sound effects.
- **ImperialSolTeaser** — a 72-second vertical Minecraft-inspired cinematic teaser for Imperial × Slice of Life. It deliberately avoids revealing unreleased server features.

All projects are separate Remotion compositions registered in `src/projects/registry.ts`.

## Shared studio capabilities

- Remotion Studio for previewing compositions.
- Independent project compositions and assets.
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

Output: `out/imperial-sol-teaser.mp4`. This composition is 1080×1920, 30 FPS, 72 seconds. The neural narration requires internet access and uses the online Microsoft Edge speech service through the community `edge-tts` client. If speech generation fails, the command stops rather than substituting a different voice.

## Render Tunas Dewa with natural narration

The narration uses the online Microsoft Edge neural speech service through the open-source `edge-tts` Python package. It uses the Indonesian male voice `id-ID-ArdiNeural` by default. Internet access is required when generating the voice; the resulting MP3 is then bundled into the rendered MP4.

```bash
python -m venv .venv-tts
.venv-tts/bin/python -m pip install edge-tts==7.3.1
node scripts/generate-audio.cjs
node scripts/generate-tunas-dewa-voice.cjs
npx remotion render src/index.tsx TunasDewa out/tunas-dewa.mp4
```

**Important:** neural TTS uses an online service via an unofficial community client, not a locally installed human voice recording. Service availability or behavior may change.

## Render on GitHub

The **Render video** workflow supports manual rendering from **Actions → Render video → Run workflow**. Enter a registered composition ID and an MP4 filename.

Available IDs: `TunasKecil`, `TunasDewa`, and `ImperialSolTeaser`. For the new teaser, use composition ID `ImperialSolTeaser` and filename `imperial-sol-teaser.mp4`.

The workflow installs dependencies, runs TypeScript validation and unit tests, generates music/SFX and the matching Indonesian neural narration, renders MP4, and uploads the artifact. After a successful run, download the MP4 from that run's **Artifacts** section.

## Verification status

Do not describe a new composition as fully verified until its own GitHub Actions run completes TypeScript validation, tests, narration generation, MP4 rendering, and artifact upload. A successful render confirms the automated pipeline; a separate manual visual and audio review is still needed for creative quality assurance.

Do not commit secrets, private API keys, or media you do not have permission to use.
