# WebVTT preflight validator

Research checked: 25 November 2026.

## Evidence

- [W3C WebVTT specification](https://www.w3.org/TR/webvtt1/): cue starts are non-decreasing, end timestamps must be later than start, and overlapping cues are allowed for ordinary caption/subtitle tracks.
- [W3C WAI technique H95](https://www.w3.org/WAI/WCAG21/Techniques/html/H95.html): captions should communicate dialogue and meaningful audio information, not dialogue alone.

## Design decision

Add a dependency-free Node CLI preflight for VTT files. It checks header, timestamp grammar/ranges, start ordering, positive cue duration, duplicate identifiers, and non-empty payload. Overlap is allowed. An optional media duration produces warnings when a cue extends past the known duration.

Run:

    npm run captions:validate -- public/projects/ProjectId/captions.vtt
    node scripts/validate-webvtt.cjs captions.vtt 90000

Exit code 0 means structural checks passed; 1 means validation errors; 2 means usage or file-read error.

## Boundaries

This is a structural validator, not a full WebVTT conformance parser. It does not render captions, check actual visual safe areas, measure reading speed, inspect audio, or prove caption accuracy/accessibility. Cue placement settings are retained but not geometrically evaluated. A human still needs to review captions against the final audio and frame composition.

The code is original and uses only Node built-ins; no third-party code or media assets were added.
