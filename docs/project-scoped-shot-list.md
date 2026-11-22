# Project-scoped shot-list data model

## Design decision

Add a small pre-production model for describing shots before they become Remotion scene components. The model records editorial order, subject, visible action, framing, camera angle/movement, optional focal-length notes, and frame duration. It delegates frame placement, gaps, overlap, and transition validation to the existing `buildSceneTimeline` helper.

This is a data model and planner, not an AI script parser, storyboard image generator, NLE editor, or render adapter.

## Research checked on 22 November 2026

### OpenTimelineIO

Primary sources:

- [OpenTimelineIO project overview](https://github.com/AcademySoftwareFoundation/OpenTimelineIO) — describes OTIO as an interchange format/API for editorial cut information: the order and length of cuts plus references to external media. It is not a media container.
- [OTIO timeline structure](https://opentimelineio.readthedocs.io/en/v0.15/tutorials/otio-timeline-structure.html) — describes a timeline made from ordered clips and media references, with tracks, gaps, stacks, and transitions for richer layouts.
- [OTIO time ranges](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/docs/tutorials/time-ranges.md) — explains source ranges, parent/clip time coordinates, and timeline placement.
- [OTIO schema API](https://opentimelineio.readthedocs.io/en/latest/api/python/opentimelineio.schema.html) — documents markers as named, timed annotations attached to timeline items.
- [OpenTimelineIO LICENSE.txt](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/LICENSE.txt) — Apache License 2.0.

Findings applied:

1. Editorial order and frame ranges should be explicit data, not inferred from component names.
2. A gap and a transition are different timeline concepts.
3. Rational frame rates preserve rates such as 24000/1001 and 30000/1001 without storing rounded decimal approximations.
4. Timed notes/markers can be associated with an item, while project/sequence metadata should remain separate from media payloads.

The studio adopts these general modeling ideas only. It does not claim OTIO compatibility, serialize .otio files, copy OTIO implementation code, or add an OTIO dependency.

## Why it matters

The current shared timeline describes when scenes occur, but it does not capture the visual intent of a shot. A project-agnostic shot list adds that missing pre-production layer. It can serve as a stable input for future storyboard generation, camera planning, production notes, and eventual adapters without binding the model to TUNAS KECIL or any other sample project.

## API

~~~ts
import {buildShotList} from './shot-list';

const shotList = buildShotList({
  projectId: 'documentary-river',
  sequenceId: 'opening',
  frameRate: {numerator: 24000, denominator: 1001},
  shots: [
    {
      id: 'shot-001',
      sceneId: 'scene-01',
      subject: 'Aerial view of the river valley',
      action: 'The camera slowly reveals the river bend',
      framing: 'extreme-wide',
      cameraAngle: 'high-angle',
      cameraMovement: 'dolly',
      durationInFrames: 144,
      transitionAfterFrames: 12,
    },
    {
      id: 'shot-002',
      sceneId: 'scene-01',
      subject: 'A local boat crossing the river',
      action: 'The boat moves from the near bank toward the far bank',
      framing: 'wide',
      cameraMovement: 'static',
      durationInFrames: 120,
    },
  ],
});

console.log(shotList.totalDurationInFrames);
console.log(shotList.shots[1].fromFrame);
~~~

The result assigns a 1-based shotNumber and calculates fromFrame, endFrameExclusive, transitionInFrames, and transitionOutFrames. Input array order is the editorial order and is preserved. Frame intervals are half-open: [fromFrame, endFrameExclusive).

## Validation and boundaries

- Project and sequence IDs must be non-empty strings.
- A shot list must contain at least one shot.
- Shot IDs must be unique within the list.
- Subject and visible action are required.
- Framing, camera angle, and camera movement must use the exported supported values.
- Durations, gaps, overlaps, and safe cumulative frame ranges are validated by the existing shared scene-timeline planner.
- Frame-rate numerator and denominator must be positive safe integers; the pair is reduced by its greatest common divisor.
- Optional focal length must be a positive finite number. It is descriptive metadata only; it does not set a physical or virtual camera.
- Scene ID and notes are optional and project-local.

The model intentionally does not prescribe one lens, framing, or camera move for a genre. Documentary, education, promotional work, fiction, and social video have different visual needs.

## Acceptance checks

- Sequential shots receive deterministic contiguous frame ranges.
- Gaps and pairwise overlaps match the shared timeline planner.
- Common fractional rates remain exact rational pairs.
- Invalid IDs, descriptions, enums, rates, durations, and transition combinations are rejected.
- Input data is not mutated.
- Two projects may use the same local shot IDs without sharing state.

## Limitations / next steps

- No visual storyboard frames or thumbnails are generated.
- No script-to-shot AI breakdown exists yet.
- No OpenTimelineIO import/export or NLE interchange is implemented.
- No automatic camera animation is inferred from shot metadata.
- Human review is still needed to judge whether the framing, camera movement, and duration fit the story.

The next integration should be a project-owned JSON shot-list file and a review UI; neither is part of this change.