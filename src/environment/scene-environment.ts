/**
 * Shared, deterministic environment logic for every IMPERAL video project.
 * Coordinates use screen space: +x is right and +y is down.
 */

export type WeatherKind =
  | 'clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'rain'
  | 'storm'
  | 'snow'
  | 'fog'
  | 'windy';

export type PrecipitationKind = 'rain' | 'snow';

export type PrecipitationConfig = {
  kind: PrecipitationKind;
  /** Downward gravity speed in pixels per frame. Must be positive. */
  gravityPxPerFrame: number;
  /** Horizontal drift speed before wind direction is applied. Must be non-negative. */
  windDriftPxPerFrame: number;
};

export type EnvironmentState = {
  weather: WeatherKind;
  /** Cloud coverage from 0 (none) to 1 (fully covered). */
  cloudCoverage: number;
  /** Direct sunlight intensity from 0 (none) to 1 (strong). */
  sunlight: number;
  /** Horizontal wind direction/strength in screen-space units, -1 to 1. */
  windX: number;
  precipitation?: PrecipitationConfig;
  /** Explicitly permits a bright sunshower or a deliberate stylized exception. */
  intentionalSunshower?: boolean;
};

export type EnvironmentAudioCue = {
  id: string;
  src: string;
  startFrame: number;
  endFrame: number;
  volume: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
};

export type EnvironmentCue = {
  id: string;
  /** Inclusive start frame. */
  startFrame: number;
  /** Exclusive end frame. */
  endFrame: number;
  state: EnvironmentState;
  audioCues?: readonly EnvironmentAudioCue[];
};

export type EnvironmentTimeline = {
  durationInFrames: number;
  cues: readonly EnvironmentCue[];
};

export type PrecipitationVelocity = {
  x: number;
  y: number;
};

const finite = (value: number, label: string): void => {
  if (!Number.isFinite(value)) throw new Error(label + ' must be finite.');
};

const inRange = (value: number, min: number, max: number, label: string): void => {
  finite(value, label);
  if (value < min || value > max) {
    throw new Error(label + ' must be between ' + min + ' and ' + max + '.');
  }
};

const validFrame = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(label + ' must be a non-negative safe integer.');
  }
};

/**
 * Validates the physical plausibility and timing of a complete environment plan.
 * Cues may have gaps, but may not overlap or contradict their own weather state.
 */
export const validateEnvironmentTimeline = (timeline: EnvironmentTimeline): true => {
  validFrame(timeline.durationInFrames, 'durationInFrames');
  if (timeline.durationInFrames <= 0) {
    throw new Error('durationInFrames must be greater than zero.');
  }

  const cueIds = new Set<string>();
  let previousEnd = 0;

  timeline.cues.forEach((cue, index) => {
    if (!cue.id || !cue.id.trim()) throw new Error('Environment cue at index ' + index + ' needs an id.');
    if (cueIds.has(cue.id)) throw new Error('Duplicate environment cue id: ' + cue.id);
    cueIds.add(cue.id);

    validFrame(cue.startFrame, cue.id + '.startFrame');
    validFrame(cue.endFrame, cue.id + '.endFrame');
    if (cue.endFrame <= cue.startFrame) throw new Error(cue.id + ' must have a positive frame range.');
    if (cue.endFrame > timeline.durationInFrames) throw new Error(cue.id + ' exceeds composition duration.');
    if (index > 0 && cue.startFrame < previousEnd) {
      throw new Error(cue.id + ' overlaps the previous environment cue.');
    }
    previousEnd = cue.endFrame;

    const state = cue.state;
    inRange(state.cloudCoverage, 0, 1, cue.id + '.cloudCoverage');
    inRange(state.sunlight, 0, 1, cue.id + '.sunlight');
    inRange(state.windX, -1, 1, cue.id + '.windX');

    if (state.weather === 'clear' && state.cloudCoverage > 0.35 && !state.intentionalSunshower) {
      throw new Error(cue.id + ': clear weather conflicts with heavy cloud coverage.');
    }
    if ((state.weather === 'rain' || state.weather === 'storm') &&
        state.cloudCoverage < 0.45 && !state.intentionalSunshower) {
      throw new Error(cue.id + ': rain/storm needs established cloud coverage.');
    }
    if (state.sunlight > 0.8 && state.cloudCoverage > 0.75 && !state.intentionalSunshower) {
      throw new Error(cue.id + ': strong direct sunlight conflicts with dense cloud cover.');
    }

    if (state.weather === 'rain' || state.weather === 'storm') {
      if (!state.precipitation || state.precipitation.kind !== 'rain') {
        throw new Error(cue.id + ': rain/storm weather requires rain precipitation settings.');
      }
    }
    if (state.weather === 'snow' &&
        (!state.precipitation || state.precipitation.kind !== 'snow')) {
      throw new Error(cue.id + ': snow weather requires snow precipitation settings.');
    }
    if (state.precipitation) {
      finite(state.precipitation.gravityPxPerFrame, cue.id + '.precipitation.gravityPxPerFrame');
      if (state.precipitation.gravityPxPerFrame <= 0) {
        throw new Error(cue.id + ': precipitation must move downward under gravity.');
      }
      inRange(state.precipitation.windDriftPxPerFrame, 0, 1000, cue.id + '.precipitation.windDriftPxPerFrame');
    }

    const audioIds = new Set<string>();
    (cue.audioCues ?? []).forEach((audio) => {
      if (!audio.id || !audio.id.trim()) throw new Error(cue.id + ' has an audio cue without an id.');
      if (audioIds.has(audio.id)) throw new Error(cue.id + ' has duplicate audio cue id: ' + audio.id);
      audioIds.add(audio.id);
      if (!audio.src || !audio.src.trim()) throw new Error(audio.id + ' needs an audio source.');
      validFrame(audio.startFrame, audio.id + '.startFrame');
      validFrame(audio.endFrame, audio.id + '.endFrame');
      if (audio.startFrame < cue.startFrame || audio.endFrame > cue.endFrame ||
          audio.endFrame <= audio.startFrame) {
        throw new Error(audio.id + ' must fit inside its environment cue.');
      }
      inRange(audio.volume, 0, 1, audio.id + '.volume');
      const fadeIn = audio.fadeInFrames ?? 0;
      const fadeOut = audio.fadeOutFrames ?? 0;
      validFrame(fadeIn, audio.id + '.fadeInFrames');
      validFrame(fadeOut, audio.id + '.fadeOutFrames');
      if (fadeIn + fadeOut > audio.endFrame - audio.startFrame) {
        throw new Error(audio.id + ' fade durations exceed its audio cue duration.');
      }
    });
  });

  return true;
};

/** Finds the environment state active at an absolute composition frame. */
export const getEnvironmentAtFrame = (
  timeline: EnvironmentTimeline,
  frame: number,
): EnvironmentCue | undefined => {
  finite(frame, 'frame');
  return timeline.cues.find((cue) => frame >= cue.startFrame && frame < cue.endFrame);
};

/**
 * Returns particle velocity in screen coordinates. Gravity always contributes
 * positive y (downward); wind only contributes horizontal drift.
 */
export const getPrecipitationVelocity = (
  state: EnvironmentState,
): PrecipitationVelocity => {
  if (!state.precipitation) throw new Error('This environment state has no precipitation.');
  if (state.precipitation.gravityPxPerFrame <= 0) {
    throw new Error('Precipitation gravity must point downward.');
  }
  return {
    x: state.windX * state.precipitation.windDriftPxPerFrame,
    y: state.precipitation.gravityPxPerFrame,
  };
};

/** Deterministic ambience/effect envelope for a cue at an absolute frame. */
export const getEnvironmentAudioVolume = (
  cue: EnvironmentAudioCue,
  frame: number,
): number => {
  finite(frame, 'frame');
  if (frame < cue.startFrame || frame >= cue.endFrame) return 0;
  const fadeIn = cue.fadeInFrames ?? 0;
  const fadeOut = cue.fadeOutFrames ?? 0;
  const fadeInGain = fadeIn === 0 ? 1 : Math.min(1, (frame - cue.startFrame) / fadeIn);
  const fadeOutGain = fadeOut === 0 ? 1 : Math.min(1, (cue.endFrame - frame) / fadeOut);
  return cue.volume * Math.max(0, Math.min(fadeInGain, fadeOutGain));
};
