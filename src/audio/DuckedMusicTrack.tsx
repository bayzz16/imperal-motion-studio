import React, {useMemo} from 'react';
import {Audio} from '@remotion/media';
import {interpolate, staticFile, useCurrentFrame} from 'remotion';
import {
  createMusicDuckingKeyframes,
  easeMusicDuckingProgress,
  type DialogueTimingCue,
  type MusicDuckingSettings,
} from './music-ducking';

export type DuckedMusicTrackProps = {
  /** Path relative to public/, for example audio/music-bed.wav. */
  src: string;
  /** Manually aligned dialogue ranges on the same composition frame clock. */
  dialogueCues: readonly DialogueTimingCue[];
  settings: MusicDuckingSettings;
  loop?: boolean;
};

/**
 * Plays a music bed with a deterministic, cue-driven volume envelope.
 * Keep dialogueCues and settings stable (declared outside the component when
 * practical) so the keyframe plan can be memoized between frame renders.
 */
export const DuckedMusicTrack: React.FC<DuckedMusicTrackProps> = ({
  src,
  dialogueCues,
  settings,
  loop = false,
}) => {
  if (typeof src !== 'string' || src.trim().length === 0) {
    throw new Error('Ducked music track src must be a non-empty public/ path.');
  }

  const frame = useCurrentFrame();
  const keyframes = useMemo(
    () => createMusicDuckingKeyframes(dialogueCues, settings),
    [dialogueCues, settings],
  );

  const volume = interpolate(frame, keyframes.inputRange, keyframes.outputRange, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (progress) => easeMusicDuckingProgress(progress, keyframes.curve),
  });

  return <Audio src={staticFile(src)} volume={volume} loop={loop} />;
};
