# IMPERAL Motion Studio

A multi-project video production workspace powered by [Remotion](https://www.remotion.dev/). Each video is a separate composition, so this repository can grow beyond the first sample project.

## Included

- Remotion Studio for previewing compositions.
- A 90-second vertical sample composition: **TunasKecil**.
- Manual GitHub Actions workflow to render a composition to MP4.
- MP4 delivery as a downloadable Actions artifact (kept for 14 days).

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run studio
```

## Render locally

```bash
npm run render:tunas
```

The MP4 is written to `out/tunas-kecil.mp4`.

## Render on GitHub

1. Open the **Actions** tab.
2. Select **Render video**.
3. Click **Run workflow**.
4. Enter a composition ID (the sample is `TunasKecil`) and an MP4 filename.
5. Wait for the workflow to finish successfully.
6. Download the MP4 from the run's **Artifacts** section.

The workflow is manual; it does not render on every push.

## Add another video

1. Create a new composition component under `src/` or a subfolder such as `src/projects/`.
2. Register it in `src/Root.tsx` with a unique composition ID.
3. Run it locally or enter that ID in the GitHub Actions workflow.

Keep each project's assets in a dedicated folder under `public/`. Do not commit secrets, private API keys, or licensed media without permission.

## Verification status

The repository scaffold is committed, but the first GitHub Actions render still needs to be run. A successful workflow and a downloadable MP4 artifact are the proof that rendering works end-to-end.


## Reusable dialogue voices

The voice library lives in `src/voice/`:

- `male-lead` (Arka) and `female-lead` (Nara) are the default lead voices.
- Six supporting profiles are available for videos with larger casts.
- `VoiceTrack` places prepared dialogue recordings on the Remotion timeline.

Voice profiles are creative directions, not audio files. The repository does not currently include generated speech or a configured text-to-speech provider. Add recordings you own or are licensed to use under `public/voices/<profile-id>/`, then reference them in a composition with `VoiceTrack`. See [public/voices/README.md](public/voices/README.md) for the folder convention.

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
