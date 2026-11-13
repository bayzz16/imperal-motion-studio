import React from 'react';
import {Audio} from '@remotion/media';
import {staticFile} from 'remotion';
import {VOICE_CAST, type VoiceId} from './voice-cast';

export type DialogueCue = {
  speaker: VoiceId;
  /** Path relative to public/, for example voices/male-lead/scene-01.wav */
  audioFile: string;
  /** Timeline position in frames. */
  from: number;
  /** Optional playback volume from 0 to 1. Defaults to 1. */
  volume?: number;
};

type VoiceTrackProps = {
  cues: DialogueCue[];
};

/**
 * Plays prepared dialogue recordings on the Remotion timeline.
 * The referenced audio files must exist under public/ before rendering.
 */
export const VoiceTrack: React.FC<VoiceTrackProps> = ({cues}) => (
  <>
    {cues.map((cue, index) => {
      if (!VOICE_CAST[cue.speaker]) {
        throw new Error(`Unknown voice profile: ${cue.speaker}`);
      }
      if (!cue.audioFile.trim()) {
        throw new Error(`Dialogue cue ${index} has no audioFile.`);
      }
      return (
        <Audio
          key={`${cue.speaker}-${cue.from}-${index}`}
          src={staticFile(cue.audioFile)}
          from={cue.from}
          volume={cue.volume ?? 1}
        />
      );
    })}
  </>
);
