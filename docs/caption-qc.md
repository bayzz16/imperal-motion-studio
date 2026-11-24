# Caption readability quality checks

The file src/captions/caption-qc.ts adds a reusable, non-destructive readability analyzer alongside the existing SRT/WebVTT parser and CaptionTrack renderer.

## Why this exists

The existing caption utilities validate cue text and timestamps, sort cues, parse SRT/WebVTT, and resolve proportional safe areas. They do not measure reading speed, per-line length, line count, or display duration. This module fills that gap without changing caption text or rejecting intentional overlapping dialogue.

## Research-backed reference profiles

These are named references, not universal rules. Choose a profile only when its delivery context is appropriate:

- **Netflix English (USA), adult:** up to 20 characters per second (CPS), 42 characters per line, two lines maximum, and 5/6 second to 7 seconds per event. [English (USA) Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide) · [General Requirements](https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements)
- **Netflix English (USA), children's programming:** up to 17 CPS; the same named profile retains the general duration and line limits above. See the English guide and its General Requirements.
- **DCMP educational media:** maximum presentation rates of 130 WPM for lower-level, 140 WPM for middle-level, and 160 WPM for upper-level educational media. These are educational-media recommendations from a US program, not an Indonesian-language standard. [DCMP Captioning Key — Presentation Rate](https://dcmp.org/learn/601-captioning-key---presentation-rate)
- **WebVTT timing model:** cue start times are ordered, end times must follow start times, and overlapping cues are allowed. The analyzer therefore preserves overlaps rather than treating them as automatic errors. [W3C WebVTT specification](https://w3c.github.io/webvtt/)

## Use

    import {
      analyzeCaptionReadability,
      CAPTION_QC_PRESETS,
    } from './caption-qc';

    const report = analyzeCaptionReadability(
      captions,
      CAPTION_QC_PRESETS.dcmpEducationalMiddle,
    );

    if (!report.passed) {
      for (const issue of report.issues) {
        console.warn(issue.message);
      }
    }

Pass a custom CaptionQcOptions object to combine only the limits relevant to a project's audience and delivery platform. With no options, the analyzer reports measurements but does not silently apply a house style.

## What is measured

- CPS: Unicode code points excluding line-break characters, including spaces, divided by display duration.
- WPM: whitespace-separated words divided by display duration. This is intended for space-delimited writing systems; it is not a suitable tokenizer for languages such as Chinese or Japanese.
- Maximum characters on any individual line and total line count.
- Cue display duration.

All threshold breaches are warnings in the report; passed means no configured threshold was breached, not that the captions are editorially approved. Character counting uses Unicode code points rather than grapheme clusters, so some combined emoji or accented sequences may count as more than one. Human review is still required for transcript accuracy, natural line breaks, speech synchronization, placement over important visuals, and language-specific readability.
