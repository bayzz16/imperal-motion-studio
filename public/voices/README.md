# Voice assets

This folder is reserved for dialogue recordings used by Remotion videos.

## Available voice profiles

| Profile ID | Character name | Voice direction |
| --- | --- | --- |
| `male-lead` | Arka | Warm, clear adult male lead |
| `female-lead` | Nara | Warm, expressive adult female lead |
| `male-calm` | Bima | Calm, thoughtful adult male |
| `male-young` | Raka | Bright, conversational adult male |
| `male-deep` | Damar | Deep, steady adult male |
| `female-warm` | Alya | Soft, reassuring adult female |
| `female-bright` | Kirana | Lively, friendly adult female |
| `female-mature` | Maya | Grounded, mature adult female |

The first two profiles are the default male/female pair. The other six are optional supporting-character presets.

## Asset naming

Put recordings in the matching profile folder, for example:

```text
public/voices/
  male-lead/scene-01.wav
  female-lead/scene-02.wav
  male-calm/scene-03.wav
```

Use WAV or MP3 files that Remotion can decode. Keep each spoken line as a separate file when precise timing and editing are important.

## Important status

The repository currently contains voice profiles and a playback component, **not generated speech recordings**. No TTS provider or API key is configured. Add recordings you own or have permission to use before referencing them in a rendered composition.

Dialogue playback is wired with `VoiceTrack` from `src/voice/VoiceTrack.tsx`. Each cue selects a speaker, audio file, timeline frame, and optional volume.
