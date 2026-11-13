# IMPERAL Motion Studio

A reusable, multi-project video production workspace powered by [Remotion](https://www.remotion.dev/). Each video is an independent composition registered in the shared project registry.

## Included

- Remotion Studio for previewing compositions.
- A 90-second vertical sample composition: **TunasKecil**.
- A project registry at `src/projects/registry.ts` for adding independent compositions.
- Reusable sequential scene-timeline planning and a Remotion `SceneSequence` adapter.
- Automated unit tests for scene-timeline placement and input validation.
- A deterministic camera-movement utility in `src/motion/camera-moves.ts`.
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

The timeline tests run with Node's built-in test runner and do not require an additional test framework.

## Render locally

```bash
npm run render:tunas
```

The MP4 is written to `out/tunas-kecil.mp4`.

## Render on GitHub

The **Render video** workflow supports both:

- **Automatic validation/rendering:** pushes to `main` that change files under `.github/workflows/`, `src/`, `scripts/`, `public/`, or `package.json`.
- **Manual rendering:** open **Actions → Render video → Run workflow**, then enter a registered composition ID and an MP4 filename.

The workflow runs TypeScript validation, unit tests, input validation, audio generation, MP4 rendering, and artifact upload. After a successful run, download the MP4 from that run's **Artifacts** section.

## Add another video project

1. Create a new composition component in `src/` or a dedicated project folder.
2. Add its metadata and component to `VIDEO_PROJECTS` in `src/projects/registry.ts`.
3. Give it a unique Remotion composition ID and its own duration, frame rate, and dimensions.
4. Keep project-specific assets in a dedicated folder under `public/`.
5. Run `npm run typecheck`, `npm test`, and `npm run compositions`, then render the new composition.

The shared registry is project-agnostic; **TunasKecil is only the current sample project**.

## Build a sequential scene timeline

`buildSceneTimeline` validates scene IDs and frame durations, then calculates each scene's start and exclusive end frame. `SceneSequence` maps an individual placement to Remotion's `Sequence` component:

```tsx
import {buildSceneTimeline} from './timeline/scene-timeline';
import {SceneSequence} from './timeline/SceneSequence';

const timeline = buildSceneTimeline([
  {id: 'opening', durationInFrames: 90},
  {id: 'main', durationInFrames: 180, gapBeforeFrames: 12},
]);

export const ExampleScenes = () => (
  <>
    {timeline.scenes.map((placement) => (
      <SceneSequence key={placement.id} placement={placement}>
        <div>{placement.id}</div>
      </SceneSequence>
    ))}
  </>
);
```

Each scene's child frame clock starts at zero. The planner handles sequential placement and gaps; it does not yet implement overlapping layers or transitions. Put simultaneous visual layers inside a scene or on separate timeline tracks.

## Dialogue voice library

The voice library lives in `src/voice/`:

- `male-lead` (Arka) and `female-lead` (Nara) are the default lead voice profiles.
- Six supporting profiles are available for larger casts.
- `VoiceTrack` places prepared dialogue recordings on the Remotion timeline.

Voice profiles are creative metadata, not generated audio. No text-to-speech provider is currently configured. Add recordings you own or are licensed to use under `public/voices/<profile-id>/`, then reference them in a composition with `VoiceTrack`. See [public/voices/README.md](public/voices/README.md) for the folder convention.

Example cue:

```tsx
const dialogue = [
  {
    speaker: 'male-lead',
    audioFile: 'voices/male-lead/scene-01.wav',
    from: 120,
    volume: 0.9,
  },
];

// Inside the composition:
// <VoiceTrack cues={dialogue} />
```

## Verification status

The last confirmed end-to-end render was GitHub Actions run 18 for commit `4541fcf`, which completed TypeScript validation, audio generation, MP4 rendering, and artifact upload. A separate manual visual/audio review of that MP4 has not been recorded. Newer commits must pass their own workflow before being described as fully verified.

Do not commit secrets, private API keys, or media you do not have permission to use.
