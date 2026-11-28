# Subtitle reading-speed preflight

Research checked: 28 November 2026.

## Evidence

- [Netflix Indonesian Timed Text Style Guide](https://partnerhelp.netflixstudios.com/hc/en-us/articles/216009727-Indonesian-Timed-Text-Style-Guide): the guide specifies 17 characters per second for adult programmes and 13 CPS for children's programmes in its reading-speed section; it also notes higher limits may be allowed in certain cases. Treat these as conservative project profiles, not a universal law or platform acceptance guarantee.
- [Unicode Standard Annex #29, Unicode 18.0 / Revision 49](https://www.unicode.org/reports/tr29/), dated 1 September 2026: extended grapheme clusters approximate user-perceived characters. UTF-16 code units or code points alone can overcount combining sequences and joined emoji.
- [W3C WebVTT](https://www.w3.org/TR/webvtt1/): cue timing and payload structure are defined by WebVTT; this tool reuses the studio's structural validator before measuring.

## Decision

Add a dependency-free CLI that reports visible-text grapheme count and CPS per cue. It removes WebVTT inline formatting tags, decodes common/numeric character references, excludes line-break separators from the count, and calculates CPS as grapheme clusters divided by cue duration in seconds.

Default profiles:
- adult: 17 CPS
- children: 13 CPS

Use `--max-cps` to override the threshold for a specific delivery spec. Use `--locale` to select the Intl.Segmenter locale. Node.js 22 or newer is required for Intl.Segmenter.

## Usage

    npm run captions:cps -- captions.vtt
    node scripts/analyze-subtitle-cps.cjs captions.vtt --profile children
    node scripts/analyze-subtitle-cps.cjs captions.vtt --max-cps 15 --locale id

The tool writes a JSON report to stdout. Exit code 1 indicates structural validation failure or at least one cue over the selected CPS limit. It does not modify the subtitle file.

## Limits

CPS is a useful preflight signal, not a complete readability or accessibility score. Grapheme clusters are an approximation of perceived characters and can be less suitable for some writing systems; locale-aware segmentation helps but does not model reading comprehension. The analyzer does not check line breaks, line length, shot changes, semantic segmentation, subtitle synchronization against audio, or visual safe areas. Review the final captions against picture and sound.

No third-party code or media was added. The implementation uses Node built-ins and the existing WebVTT validator.
