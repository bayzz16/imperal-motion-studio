# Video color metadata QC

The render validator now reads the first video stream's FFprobe color fields and reports metadata completeness, broad color-family classification, and obvious primaries/matrix-family conflicts. This is a read-only diagnostic: it does not re-tag, transform, tone-map, or re-encode the MP4.

## Profiles

- **metadata-only** (default): reports missing/unknown color primaries, transfer characteristics, matrix coefficients, and range; flags known BT.709/BT.601/BT.2020 family conflicts without assuming a delivery target.
- **youtube-sdr**: advisory comparison against YouTube's published BT.709 SDR recommendation. It also warns when the stream is tagged full-range. This profile does not certify a file or change it.

Choose a profile when running the validator:

~~~bash
COLOR_QC_PROFILE=metadata-only node scripts/validate-render.cjs
COLOR_QC_PROFILE=youtube-sdr node scripts/validate-render.cjs
~~~

The default is deliberately non-prescriptive because the studio produces many kinds of content, including material that may intentionally be HDR, BT.601, wide-gamut SDR, or intended for a different delivery platform.

## Research and design decision

Research checked on 17 November 2026:

1. [FFmpeg ffprobe documentation](https://ffmpeg.org/ffprobe-all.html) documents stream inspection and the color-related value vocabulary used by FFmpeg. The validator asks FFprobe for color_range, color_space, color_transfer, color_primaries, pix_fmt, and bits_per_raw_sample.
2. [ITU-R BT.709-6 (June 2015)](https://www.itu.int/dms_pubrec/itu-r/rec/bt/r-rec-bt.709-6-201506-i%21%21pdf-e.pdf) defines HDTV production/exchange parameters. It is a technical reference, not a universal mandate for every video project.
3. [YouTube recommended upload encoding settings](https://support.google.com/youtube/answer/1722171) recommends BT.709 for SDR uploads and documents its handling of unspecified/mixed tags and full-range input. This is a platform-specific delivery recommendation, not a rule for cinema masters or HDR exports.

The practical problem is that a structurally valid MP4 can still carry missing or internally conflicting color tags. Players and platforms use these tags to interpret the signal, so surfacing them before delivery can prevent avoidable interpretation differences. The tool only checks declared metadata; it cannot prove that tags describe the actual pixel values or that the grade looks correct on a calibrated display.

## Interpretation and limitations

- sdr-bt709, sdr-bt601, hdr-pq-bt2020, hdr-hlg-bt2020, wide-gamut-sdr, other, and incomplete are broad metadata classifications, not visual quality scores.
- A warning is advisory and does not fail the render. Missing metadata may be intentional or supplied by the container/player; review the production intent before changing anything.
- Never fix a mismatch by changing tags alone. A true conversion requires known source characteristics and pixel-value conversion; HDR-to-SDR additionally requires an intentional tone-mapping decision.
- The youtube-sdr profile is only a metadata checklist against YouTube's SDR recommendation. It does not assess codec, bitrate, HDR mastering metadata, chroma, image appearance, or platform acceptance.
- FFprobe reports metadata, not the truth of the encoded image. A human review on an appropriate display remains necessary.

No media assets or copied implementation code were added. The analyzer is original project code, uses the existing Node.js runtime, and adds no dependencies. External standards and documentation are linked for reference rather than reproduced.
