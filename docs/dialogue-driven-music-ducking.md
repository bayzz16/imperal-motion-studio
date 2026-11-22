# Dialogue-driven music ducking

## Design decision

Add a reusable, frame-accurate music-volume envelope driven by manually timed dialogue cues. The helper produces deterministic keyframes and a Remotion component applies them to a music bed. It is independent of any sample composition.

## Research checked on 22 November 2026

Primary Remotion documentation:

- [Audio component](https://www.remotion.dev/docs/media/audio) — `@remotion/media` Audio is the recommended component for embedding audio; it supports volume values from 0 to 1 and frame-based volume control.
- [Volume and muting](https://www.remotion.dev/docs/audio/volume) — documents changing volume over time with `useCurrentFrame()` and `interpolate()`. The current guidance prefers a numeric volume derived from the current frame over the older volume callback. It also notes that inline interpolation enables Remotion Studio volume-curve interaction.
- [Video and Audio](https://www.remotion.dev/docs/video-and-audio) — demonstrates independent audio tracks and background music.

## Finding and relevance

Dialogue often needs a clearer foreground than a continuous music bed. Remotion already supports frame-based audio volume, so the studio can apply a predictable ducking envelope without adding a DSP dependency or an external audio service.

The implementation uses known dialogue start frames and durations. It does not inspect waveforms, detect speech, perform true sidechain compression, normalize loudness, or replace final audio review.

## API

`createMusicDuckingKeyframes(cues, settings)` returns ordered input/output frame arrays for Remotion's `interpolate()`.

`DuckedMusicTrack` applies those keyframes to an audio file under `public/`:

```tsx
import {DuckedMusicTrack} from './audio/DuckedMusicTrack';

const dialogueCues = [
  {from: 0, durationInFrames: 210},
  {from: 240, durationInFrames: 180},
];

const musicSettings = {
  baseVolume: 0.24,
  duckedVolume: 0.08,
  attackFrames: 12,
  preRollFrames: 12,
  releaseFrames: 18,
  curve: 'smoothstep' as const,
};

<DuckedMusicTrack
  src="audio/music-bed.wav"
  dialogueCues={dialogueCues}
  settings={musicSettings}
  loop
/>
```

The values above are example starting points only, not a broadcast loudness standard. Choose frame counts using the composition FPS and listen to the actual mix.

## Behavior and constraints

- Cue positions and durations use the composition's zero-based frame clock.
- The music starts at `baseVolume`, ramps toward `duckedVolume` before dialogue, stays reduced while dialogue is active, and recovers over `releaseFrames`.
- A new cue that overlaps an existing cue or its release window is merged to avoid music pumping between lines.
- All volume values are constrained to 0–1, and `duckedVolume` cannot exceed `baseVolume`.
- Linear and smoothstep curves are supported.
- No cues means the music remains at its base volume.
- The music file path is relative to `public/`.

## Limitations

- Dialogue timing must be supplied by the project; there is no automatic speech recognition or waveform analysis.
- This is amplitude automation by volume keyframes, not a compressor or signal-driven sidechain.
- The helper does not measure LUFS/true peak or decide whether the mix is perceptually balanced. Use the separate audio QC workflow and listen to the final render.
- Keep music, dialogue, and sound effects on separate tracks so the mix can be adjusted independently.
- Remotion Studio may not expose dynamically generated keyframe arrays as individually editable keyframes; the component prioritizes deterministic rendering and keeps the `interpolate()` call in the Audio volume prop.

## Verification

The focused unit tests cover no-dialogue behavior, attack/hold/release, overlapping cues, cues during release, separated dialogue passages, early composition boundaries, zero-length ramps, smoothstep, immutability, and invalid inputs. Full TypeScript, unit-test, and composition-discovery checks must pass in the pull-request workflow.

No sample project, audio asset, TTS provider, paid service, or production render workflow is changed.
