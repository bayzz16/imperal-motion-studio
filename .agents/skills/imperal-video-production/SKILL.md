---
name: imperal-video-production
description: Production workflow for multi-project Remotion videos in IMPERAL Motion Studio, including original procedural audio, narration, mixing, rendering, and quality checks.
---

# IMPERAL Video Production Skill

Use this workflow whenever creating or improving a video in this repository.

## Production principles
- Build reusable compositions and reusable audio helpers; do not hard-code a one-off timeline when a data-driven scene list is practical.
- Keep visual storytelling, music, sound effects, and narration as separate layers.
- Use original procedural audio or properly licensed assets. Record the source/license for any imported asset.
- Never claim that narration exists unless an actual voice recording or generated speech asset is present.
- Mix for clarity: narration must remain intelligible above music and effects; avoid clipping and abrupt endings.
- Respect the composition's exact duration, frame rate, and aspect ratio.

## Audio pipeline
1. Generate or import audio assets into `public/audio/`.
2. For procedural assets, use `scripts/generate-audio.cjs`; keep it deterministic and dependency-light.
3. Use `Audio` from `@remotion/media` and `staticFile()` for local assets.
4. Place sound effects with explicit frame offsets and conservative volume levels.
5. Add music fades at the beginning and end; use scene-aware cues rather than repeating one loud effect.
6. Add narration only when a real narration file is supplied. Keep it on its own track and lower music/effects beneath speech.

## Before declaring a render complete
- Run `npm install`.
- Run `node scripts/generate-audio.cjs` and confirm all expected WAV files exist and have non-zero size.
- Run TypeScript/build or Remotion composition validation.
- Render the target composition.
- Inspect the MP4 artifact and verify it contains an audio stream; do not infer this from a successful frame render alone.
- Listen to the beginning, scene transitions, middle, and ending for clipping, silence, timing errors, and balance.
- Report exactly which checks passed and which were not performed.

## Reusable project structure
- `src/`: compositions and scene components.
- `scripts/`: deterministic asset generation and validation scripts.
- `public/audio/`: generated/imported sound assets (generated during CI; do not commit generated binaries unless needed).
- `.agents/skills/imperal-video-production/SKILL.md`: this workflow guide.


## Reusable voice cast
- Keep voice identity separate from each video's dialogue script.
- Use `src/voice/voice-cast.ts` for the two default lead profiles and optional supporting profiles.
- Use `VoiceTrack` to place prepared speech files on the timeline.
- Keep one dialogue line per audio file where practical; store files under `public/voices/<profile-id>/`.
- Voice profiles are not synthesized speech. Do not claim dialogue is present until real audio files are added, rendered, and heard in the exported MP4.
- If a TTS provider is added later, document the provider, voice ID, usage rights, required secret names, and generation/retry behavior. Never commit API keys.
