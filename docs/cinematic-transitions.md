# Cinematic scene transition engine

## Decision

Add a small, project-agnostic adapter around Remotion's `TransitionSeries`. The existing `buildSceneTimeline` remains the source of truth for pairwise overlap validation; this adapter turns each scene descriptor into a real visual transition sequence.

## Research findings

Primary sources checked on 20 November 2026:

- Remotion `TransitionSeries` API: https://www.remotion.dev/docs/transitions/transitionseries
  - Sequences and transitions are direct children of the series.
  - A transition renders both adjacent scenes at once and shortens total duration by its frame count.
  - A transition cannot be longer than either adjacent sequence, and two transitions cannot be adjacent.
- Remotion transition overview: https://www.remotion.dev/docs/transitions
  - The package provides timing functions and reusable presentations.
- Presentation documentation:
  - Fade: https://www.remotion.dev/docs/transitions/presentations/fade
  - Slide: https://www.remotion.dev/docs/transitions/presentations/slide
  - Wipe: https://www.remotion.dev/docs/transitions/presentations/wipe
  - Flip: https://www.remotion.dev/docs/transitions/presentations/flip
- Timing documentation:
  - Linear timing: https://www.remotion.dev/docs/transitions/timings/lineartiming
  - Spring timing: https://www.remotion.dev/docs/transitions/timings/springtiming
  - Remotion recommends a low spring rest threshold (0.001) to reduce a visible cutoff at the end of a transition.
- Exact package source for the repository's current Remotion version:
  https://github.com/remotion-dev/remotion/tree/v4.0.543/packages/transitions
  The `@remotion/transitions@4.0.543` package exists and matches the installed Remotion packages.

## Why it matters

The overlap-aware planner added frame placement but intentionally did not draw a transition. This adapter closes that gap with actual scene-to-scene visuals while keeping the scene content and transition style independent from any sample project. Hard cuts remain the default when no transition duration is supplied.

## API

```tsx
import {AbsoluteFill} from 'remotion';
import {SceneTransitionSeries} from './transitions';

const scenes = [
  {
    id: 'opening',
    durationInFrames: 90,
    children: <AbsoluteFill style={{backgroundColor: '#101827'}} />,
    transitionAfterFrames: 18,
    transitionPreset: 'fade',
  },
  {
    id: 'main',
    durationInFrames: 150,
    children: <AbsoluteFill style={{backgroundColor: '#24415c'}} />,
    transitionAfterFrames: 12,
    transitionPreset: 'wipe',
    transitionDirection: 'from-left',
    transitionTiming: 'linear',
  },
  {
    id: 'ending',
    durationInFrames: 60,
    children: <AbsoluteFill style={{backgroundColor: '#101827'}} />,
  },
];

<SceneTransitionSeries scenes={scenes} name="Example sequence" />;
```

Supported presentations:

- `fade`: two-sided opacity fade (both outgoing and incoming scenes change opacity).
- `slide`: entering scene pushes the exiting scene away.
- `wipe`: entering scene covers the exiting scene.
- `flip`: exiting scene flips to reveal the next scene.

Supported timings:

- `linear`: fixed-duration linear progress.
- `spring`: fixed-duration spring progress with damping 200 and rest threshold 0.001.

Slide, wipe, and flip accept `from-left`, `from-right`, `from-top`, or `from-bottom`. The default direction is `from-left`.

All durations are integer frames. If `transitionAfterFrames` is omitted, the scenes meet at a hard cut. The shared timeline planner rejects invalid IDs, unsafe durations, a transition after the last scene, overlaps longer than either scene, and adjacent transitions that would create a three-scene overlap.

## Limitations and risks

- This is a scene-transition adapter, not a visual editor or a full multi-track timeline.
- It currently supports pairwise transitions only; gaps, overlays, audio whooshes, and arbitrary transition plug-ins are not part of this adapter.
- Only the CSS-based fade, slide, wipe, and flip presentations are exposed. HTML-in-canvas effects such as dissolve and blur-slide are intentionally excluded because their browser requirements differ and some require an experimental Chrome flag.
- The transition engine does not normalize scene colors, match exposure, or guarantee that a transition is aesthetically suitable for every edit. Review the rendered frames.
- The package is pinned to the exact installed Remotion version (4.0.543); keep all `remotion` and `@remotion/*` packages aligned.
- Remotion is source-available under its own proprietary Remotion License, not an OSI open-source license. Its current licensing guidance says individuals and organizations of up to three people qualify for the Free License; other company/team configurations may require a Company License. This code change does not obtain or pay for a license. Confirm eligibility for the actual studio entity before commercial use:
  https://www.remotion.dev/docs/license/faq
  https://www.remotion.dev/pricing

## Verification plan

- Unit tests validate ordered sequence/transition planning, defaults, presets, timing, direction, and overlap rejection.
- Repository CI must pass typecheck, all unit tests, and Remotion composition discovery.
- A short synthetic render and human frame-by-frame review are still required before calling visual output approved. No production video or TTS is part of this feature.
