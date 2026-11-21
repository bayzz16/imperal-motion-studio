# Synthetic transition render fixture

## Purpose

This fixture isolates the reusable transition adapter from all production projects. It contains five synthetic color-card scenes and exercises fade, slide, wipe, and flip without TTS, network media, project assets, or the production project registry.

The fixture is registered through a separate entry point (src/transition-test.tsx) and is deliberately not imported by src/index.tsx. Run `npm run compositions:transition-test` to validate that isolated entry point without rendering media.

## Timeline

- Five scenes × 48 frames = 240 scene frames.
- Four transitions × 12 frames = 48 overlapping frames.
- Final composition: 240 − 48 = **192 frames**.
- Frame rate: 24 FPS.
- Output: 320 × 180 pixels, silent.
- Expected duration: 8 seconds.

| Transition | Start frame | Midpoint sample | First frame after |
|---|---:|---:|---:|
| Fade | 36 | 42 | 48 |
| Slide | 72 | 78 | 84 |
| Wipe | 108 | 114 | 120 |
| Flip | 144 | 150 | 156 |

The transition occupies the half-open frame interval [start, start + 12). The “first frame after” sample is therefore the first frame after the overlap has ended.

## Render commands

Only render after confirming that the project is eligible to use Remotion under the applicable license. The repository does not store a license key and this fixture does not configure a paid service.

Full silent MP4:

    npx remotion render src/transition-test.tsx TransitionFixture out/transition-fixture.mp4 --codec=h264 --muted --concurrency=2

Sample the boundary and midpoint frames as a PNG image sequence:

    npx remotion render src/transition-test.tsx TransitionFixture out/transition-fixture-frames --frames=35,42,48,71,78,84,107,114,120,143,150,156 --sequence --image-format=png --concurrency=2

The CLI frame selection option supports comma-separated still-frame samples in Remotion 4.0.502 and later.

## Acceptance checks

1. ffprobe reports 320 × 180, 24 FPS, 192 frames, and 8 seconds (allowing container time-base rounding).
2. The 12 sampled frames exist and decode.
3. Frames 35, 71, 107, and 143 show the outgoing scene before each transition.
4. Frames 42, 78, 114, and 150 show a non-terminal transition state.
5. Frames 48, 84, 120, and 156 show the incoming scene after each transition.
6. No missing frames, browser errors, or unexpected black frames are present.

## Verification boundary

The adapter integration tests use mocked Remotion transition primitives to verify that the adapter passes the intended presentation, direction, timing, and duration to the API. They do not prove the package's actual pixel output.

The normal pull-request quality workflow runs adapter-level integration tests and discovers this isolated composition, but does not render media. A real render and human visual review are intentionally separate from the normal pull-request quality workflow. Remotion's current pricing distinguishes free individual/small-company use from its Automators offering for automated video products. Do not start an automated render until the project's actual license eligibility is clear; no render was executed as part of the static test suite.

## Primary references

- Remotion TransitionSeries: https://www.remotion.dev/docs/transitions/transitionseries
- Remotion render CLI: https://www.remotion.dev/docs/cli/render
- Remotion frame selection: https://www.remotion.dev/docs/options/frames
- Remotion license and pricing: https://www.remotion.dev/docs/license/pricing
- Remotion license-key option: https://www.remotion.dev/docs/options/license-key
