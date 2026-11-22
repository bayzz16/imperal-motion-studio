export type DialogueTimingCue = Readonly<{
  /** Start frame on the composition timeline. */
  from: number;
  /** Number of frames occupied by dialogue. */
  durationInFrames: number;
}>;

export type MusicDuckingCurve = 'linear' | 'smoothstep';

export type MusicDuckingSettings = Readonly<{
  /** Music level outside dialogue, from 0 to 1. */
  baseVolume: number;
  /** Reduced music level while dialogue is active, from 0 to baseVolume. */
  duckedVolume: number;
  /** Desired ramp-down length in frames. */
  attackFrames: number;
  /** Ramp-up length after the final dialogue cue, in frames. */
  releaseFrames: number;
  /** Frames before dialogue to begin ducking; defaults to attackFrames. */
  preRollFrames?: number;
  /** Curve used for each ramp. Defaults to linear. */
  curve?: MusicDuckingCurve;
}>;

export type MusicDuckingKeyframes = Readonly<{
  inputRange: readonly number[];
  outputRange: readonly number[];
  curve: MusicDuckingCurve;
}>;

type DuckingRegion = {
  start: number;
  speechStart: number;
  speechEnd: number;
  end: number;
};

const assertNonNegativeFrames = (value: unknown, field: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(field + ' must be a non-negative safe integer.');
  }

  return value as number;
};

const assertVolume = (value: unknown, field: string): number => {
  if (!Number.isFinite(value) || (value as number) < 0 || (value as number) > 1) {
    throw new Error(field + ' must be a finite number between 0 and 1.');
  }

  return value as number;
};

const validateSettings = (settings: MusicDuckingSettings) => {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Music ducking settings must be an object.');
  }

  const baseVolume = assertVolume(settings.baseVolume, 'baseVolume');
  const duckedVolume = assertVolume(settings.duckedVolume, 'duckedVolume');
  if (duckedVolume > baseVolume) {
    throw new Error('duckedVolume must not exceed baseVolume.');
  }

  const attackFrames = assertNonNegativeFrames(settings.attackFrames, 'attackFrames');
  const releaseFrames = assertNonNegativeFrames(settings.releaseFrames, 'releaseFrames');
  const preRollFrames = assertNonNegativeFrames(
    settings.preRollFrames === undefined ? attackFrames : settings.preRollFrames,
    'preRollFrames',
  );
  const curve = settings.curve ?? 'linear';

  if (curve !== 'linear' && curve !== 'smoothstep') {
    throw new Error('curve must be either linear or smoothstep.');
  }

  return {
    baseVolume,
    duckedVolume,
    attackFrames,
    releaseFrames,
    preRollFrames,
    curve,
  };
};

const normalizeRegions = (
  cues: readonly DialogueTimingCue[],
  preRollFrames: number,
  releaseFrames: number,
): DuckingRegion[] => {
  if (!Array.isArray(cues)) {
    throw new Error('Dialogue cues must be an array.');
  }

  const regions = cues.map((cue, index): DuckingRegion => {
    if (!cue || typeof cue !== 'object') {
      throw new Error('Dialogue cue at index ' + index + ' must be an object.');
    }

    const from = assertNonNegativeFrames(cue.from, 'Dialogue cue ' + index + ' from');
    if (!Number.isSafeInteger(cue.durationInFrames) || cue.durationInFrames <= 0) {
      throw new Error(
        'Dialogue cue ' + index + ' durationInFrames must be a positive safe integer.',
      );
    }

    const speechEnd = from + cue.durationInFrames;
    const end = speechEnd + releaseFrames;
    if (!Number.isSafeInteger(speechEnd) || !Number.isSafeInteger(end)) {
      throw new Error('Dialogue cue ' + index + ' exceeds the safe frame range.');
    }

    return {
      start: Math.max(0, from - preRollFrames),
      speechStart: from,
      speechEnd,
      end,
    };
  });

  regions.sort((left, right) => left.start - right.start || left.speechStart - right.speechStart);

  const merged: DuckingRegion[] = [];
  for (const region of regions) {
    const previous = merged[merged.length - 1];
    if (!previous || region.start > previous.end) {
      merged.push({...region});
      continue;
    }

    previous.start = Math.min(previous.start, region.start);
    previous.speechStart = Math.min(previous.speechStart, region.speechStart);
    previous.speechEnd = Math.max(previous.speechEnd, region.speechEnd);
    previous.end = previous.speechEnd + releaseFrames;
  }

  return merged;
};

/**
 * Builds deterministic volume keyframes from manually timed dialogue cues.
 *
 * Overlapping cues and cues that begin during a release ramp are merged, so
 * music does not recover between adjacent lines. The input arrays are not
 * mutated. This is cue-driven automation, not waveform analysis or DSP
 * sidechain compression.
 */
export const createMusicDuckingKeyframes = (
  cues: readonly DialogueTimingCue[],
  settings: MusicDuckingSettings,
): MusicDuckingKeyframes => {
  const normalized = validateSettings(settings);
  const regions = normalizeRegions(
    cues,
    normalized.preRollFrames,
    normalized.releaseFrames,
  );

  if (regions.length === 0) {
    return {
      inputRange: [0, 1],
      outputRange: [normalized.baseVolume, normalized.baseVolume],
      curve: normalized.curve,
    };
  }

  const inputRange: number[] = [];
  const outputRange: number[] = [];

  const addPoint = (frame: number, volume: number) => {
    const lastIndex = inputRange.length - 1;
    if (lastIndex >= 0 && frame < inputRange[lastIndex]) {
      throw new Error('Generated ducking keyframes must be ordered.');
    }

    if (lastIndex >= 0 && frame === inputRange[lastIndex]) {
      outputRange[lastIndex] = volume;
      return;
    }

    inputRange.push(frame);
    outputRange.push(volume);
  };

  for (const region of regions) {
    const effectiveAttack = Math.min(
      normalized.attackFrames,
      region.speechStart - region.start,
    );

    if (inputRange.length === 0 && region.start > 0) {
      addPoint(0, normalized.baseVolume);
    }

    if (effectiveAttack > 0) {
      addPoint(region.start, normalized.baseVolume);
      addPoint(region.speechStart, normalized.duckedVolume);
    } else {
      if (region.start > 0) {
        addPoint(region.start - 1, normalized.baseVolume);
      }
      addPoint(region.start, normalized.duckedVolume);
    }

    if (normalized.releaseFrames > 0) {
      addPoint(region.speechEnd, normalized.duckedVolume);
      addPoint(region.end, normalized.baseVolume);
    } else {
      addPoint(region.speechEnd - 1, normalized.duckedVolume);
      addPoint(region.speechEnd, normalized.baseVolume);
    }
  }

  if (inputRange.length === 1) {
    addPoint(inputRange[0] + 1, outputRange[0]);
  }

  return {
    inputRange,
    outputRange,
    curve: normalized.curve,
  };
};

/** Easing function suitable for Remotion's interpolate() option. */
export const easeMusicDuckingProgress = (
  progress: number,
  curve: MusicDuckingCurve,
): number => {
  const clamped = Math.max(0, Math.min(1, progress));
  if (curve === 'linear') return clamped;
  return clamped * clamped * (3 - 2 * clamped);
};
