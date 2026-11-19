# Overlap-aware scene timeline

## Decision

Extend the existing project-agnostic `buildSceneTimeline` planner with pairwise scene overlaps. Keep the current sequential and gap behavior unchanged when `transitionAfterFrames` is omitted.

## Research

- Remotion `<TransitionSeries>` documentation: https://www.remotion.dev/docs/transitions/transitionseries
  - A transition renders both adjacent scenes at the same time and shortens the total composition duration by the overlap length.
  - Remotion documents that a transition cannot be longer than either adjacent sequence, and two transitions cannot be adjacent.
  - The documentation page was last updated November 18, 2026.
- Remotion `<Sequence>` documentation: https://www.remotion.dev/docs/sequence
  - A sequence is positioned with `from` and `durationInFrames`; nested components receive a local frame clock shifted by `from`.
  - Sequences are the base primitive for placing content on a timeline.

## Why this matters

The current planner only places scenes sequentially, even though Remotion can render overlapping sequences. Overlap planning enables shorter edits and supports crossfades, slides, wipes, and other scene-to-scene motion without hard-coding a visual style or tying the shared timeline model to one project.

## API

Add `transitionAfterFrames` to a scene input. The next scene starts earlier by that number of frames. Both scenes retain their full local durations, and the total composition length is reduced by the overlap.

The resulting placement exposes:

- `transitionOutFrames`: overlap at the end of the current scene.
- `transitionInFrames`: overlap at the start of the next scene.

Example:

```ts
const timeline = buildSceneTimeline([
  {id: 'opening', durationInFrames: 90, transitionAfterFrames: 18},
  {id: 'main', durationInFrames: 150},
]);

// opening: [0, 90)
// main:    [72, 222)
// total:   222 frames (90 + 150 - 18)
```

The existing `SceneSequence` adapter can render the placements because each placement already contains an absolute `from` and a duration. Scene components can use their placement's transition-in/out values to drive their own visual animation.

## Guardrails

- A transition must be a non-negative safe integer.
- A transition cannot exceed either adjacent scene's duration.
- The final scene cannot declare an outgoing transition.
- A scene cannot have a gap before it and an incoming transition at the same time.
- Incoming and outgoing transitions on a middle scene cannot sum to more than that scene's duration; this prevents an unintended three-scene overlap.
- Existing sequential placement and gap behavior remain unchanged when transitions are omitted.
- The planner calculates timing only. It does not create a fade, slide, wipe, or other visual effect.

## Dependency and licensing

No package or asset is added. In particular, this change does not add `@remotion/transitions`; the current repository does not depend on it and has no tracked npm lockfile. The implementation is original timeline-planning code based on the documented timing behavior, not copied Remotion source.

## Verification

- Targeted Node test file: 12 tests covering legacy placement, gaps, pairwise overlaps, transition handles, invalid lengths, final-scene rules, triple-overlap prevention, and safe-integer overflow.
- Strict TypeScript check for the timeline module.
- Full repository CI and composition discovery must pass on the pull request before merge.
- No MP4 render or human visual review is included in this change.

## Limitations

This is a pairwise overlap planner, not a full multi-track editor or a visual transition renderer. Overlay effects that do not change scene timing are outside this API.
