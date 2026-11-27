# Audio loudness preflight

Research checked: 26 November 2026.

## Evidence and decision

- [EBU R 128 v5.0](https://tech.ebu.ch/publications/r128), published 21 November 2023, recommends programme loudness of -23 LUFS and use of Loudness Range and Maximum True Peak descriptors for broadcast-oriented workflows.
- [EBU Tech 3341](https://tech.ebu.ch/publications/tech3341), current publication page dated 21 November 2023, defines EBU Mode measurement including integrated loudness, loudness range, and maximum true peak.
- [FFmpeg filters documentation: loudnorm](https://ffmpeg.org/ffmpeg-filters.html), consulted 26 November 2026, documents EBU R128 normalization, JSON measurement output, and single-/double-pass operation.

Decision: provide a measurement-only CLI using FFmpeg's loudnorm filter. Report input integrated loudness, LRA, true peak, and threshold. The default comparison targets (-23 LUFS, 7 LU LRA, -2 dBTP) are an EBU-style starting reference, not a universal platform requirement; override them for the intended delivery specification.

## Usage

    npm run audio:loudness -- out/final.mp4
    node scripts/analyze-loudness.cjs out/final.mp4 --target-i -16 --target-lra 9 --target-tp -1

Requires an FFmpeg build with the loudnorm filter. The tool reads the input and writes a JSON report to stdout. It does not normalize, replace, or create media files.

## Limits

This is an automated measurement preflight, not a full EBU meter certification or a subjective mix review. It does not inspect dialogue intelligibility, music balance, clipping artifacts outside the reported measurements, or platform-specific loudness policy. Integrated loudness is programme-dependent; choose targets for the actual destination. Silence or malformed media may yield unavailable measurements or FFmpeg errors. No third-party package or sample media is included; FFmpeg remains an external system dependency under its own license/build configuration.
