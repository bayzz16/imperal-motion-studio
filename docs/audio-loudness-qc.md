# Audio loudness quality check

## Purpose

The render validator now measures three programme-level audio descriptors from the final MP4:

- Integrated loudness (LUFS)
- Loudness range (LRA, LU)
- Maximum true peak (dBTP)

This supplements the existing mean sample-volume diagnostic. Sample peak/mean volume alone cannot describe perceived programme loudness or inter-sample peaks.

## Research basis

Research checked on 16 November 2026:

- [EBU R 128, version 5.0 (November 2023)](https://tech.ebu.ch/publications/r128) recommends an average programme loudness of -23 LUFS and the use of Loudness Range and Maximum True Peak descriptors.
- [EBU Tech 3343-2023](https://tech.ebu.ch/files/live/sites/tech/files/shared/tech/tech3343v4_0.pdf), November 2023, explains why programme loudness should be considered over the whole programme, states the -23 LUFS target and -1 dBTP production ceiling for generic linear PCM, and stresses that loudness variation remains an artistic tool.
- [ITU-R BS.1770-5](https://www.itu.int/rec/R-REC-BS.1770-5-202311-I), approved 22 November 2023 and in force, specifies algorithms for programme loudness and true-peak measurement.
- [FFmpeg filters documentation: loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm) documents EBU R128 measurement/normalization, JSON stats, and true-peak-aware processing.

## Design decision

Use FFmpeg's loudnorm filter with print_format=json while sending the filtered stream to the null muxer. Parse the filter's input_* measurements only. This makes the render QA scan read-only with respect to the MP4: it does not create a normalized output file or alter the delivered audio.

The EBU R 128 values are shown as a named reference, not a universal target for every project. Social videos, music videos, cinematic work, education, and platform-specific delivery may require different loudness choices. The validator therefore reports the measurements and warns when true peak exceeds the generic PCM production reference; it does not fail a render solely because integrated loudness differs from -23 LUFS.

## Current behavior

scripts/validate-render.cjs reports:

- Integrated loudness in LUFS
- Loudness range in LU
- True peak in dBTP
- Offset from the -23 LUFS EBU reference
- A non-blocking warning when true peak is above -1 dBTP

The existing structural checks and full-stream decode scan remain in place. No automatic gain, compression, limiter, or normalization is applied to the final MP4.

## Limitations

- Results depend on the FFmpeg build and its loudnorm implementation. The validator checks whether JSON metrics were emitted but does not claim formal meter certification against the EBU test set.
- Very short or silent content may produce unavailable integrated loudness/true-peak metrics. Missing values are represented as unavailable, not zero.
- A true-peak warning is a review prompt, not proof of audible clipping.
- The EBU R 128 reference is intended for broadcast-oriented programme production, not every web platform. Select the delivery specification before treating any number as a pass/fail requirement.
- Automated measurement does not replace listening on suitable playback devices or checking dialogue/music balance by ear.

## Acceptance checks

- Parse valid FFmpeg JSON metrics.
- Preserve missing/non-finite values as unavailable.
- Compare values to EBU references without forcing a universal target.
- Run the existing MP4 validation flow against a generated test MP4 and confirm the new metrics are reported.
