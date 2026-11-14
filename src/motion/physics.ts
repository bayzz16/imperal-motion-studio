/**
 * Deterministic, frame-based motion primitives shared by Remotion compositions.
 * All functions are pure: the same inputs always produce the same output.
 */

const assertFinite = (value: number, name: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite.`);
  }
};

export const lerp = (from: number, to: number, progress: number): number => {
  assertFinite(from, 'from');
  assertFinite(to, 'to');
  assertFinite(progress, 'progress');
  return from + (to - from) * progress;
};

export const mapRange = (
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number,
  clamp = false,
): number => {
  [value, inputStart, inputEnd, outputStart, outputEnd].forEach((v, i) =>
    assertFinite(v, ['value', 'inputStart', 'inputEnd', 'outputStart', 'outputEnd'][i]),
  );
  if (inputEnd === inputStart) {
    throw new Error('Input range must have a non-zero length.');
  }
  const raw = (value - inputStart) / (inputEnd - inputStart);
  const progress = clamp ? Math.max(0, Math.min(1, raw)) : raw;
  return lerp(outputStart, outputEnd, progress);
};

/**
 * A normalized under-damped spring response.
 * dampingRatio must stay between 0 and 1; values below 1 preserve a natural
 * overshoot, while the final frame is normalized to exactly 1.
 */
export const getSpringProgress = (
  frame: number,
  durationInFrames: number,
  dampingRatio = 0.72,
  oscillations = 1.35,
): number => {
  assertFinite(frame, 'frame');
  assertFinite(dampingRatio, 'dampingRatio');
  assertFinite(oscillations, 'oscillations');
  if (!Number.isInteger(durationInFrames) || durationInFrames < 2) {
    throw new Error('durationInFrames must be an integer of at least 2.');
  }
  if (dampingRatio <= 0 || dampingRatio >= 1) {
    throw new Error('dampingRatio must be greater than 0 and less than 1.');
  }
  if (oscillations <= 0) {
    throw new Error('oscillations must be greater than zero.');
  }

  const t = Math.max(0, Math.min(1, frame / (durationInFrames - 1)));
  const naturalFrequency = oscillations * Math.PI * 2;
  const dampedFrequency = naturalFrequency * Math.sqrt(1 - dampingRatio ** 2);
  const response = (time: number): number => {
    const envelope = Math.exp(-dampingRatio * naturalFrequency * time);
    return 1 - envelope * (
      Math.cos(dampedFrequency * time) +
      (dampingRatio / Math.sqrt(1 - dampingRatio ** 2)) *
        Math.sin(dampedFrequency * time)
    );
  };
  const finalResponse = response(1);
  if (Math.abs(finalResponse) < 1e-8) {
    throw new Error('Spring parameters produced an unstable normalization.');
  }
  return response(t) / finalResponse;
};

/** Cubic-bezier easing with x-axis inversion solved by bounded bisection. */
export const getCubicBezierProgress = (
  progress: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  [progress, x1, y1, x2, y2].forEach((v, i) =>
    assertFinite(v, ['progress', 'x1', 'y1', 'x2', 'y2'][i]),
  );
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new Error('Bezier x control points must be between 0 and 1.');
  }
  const x = Math.max(0, Math.min(1, progress));
  const curve = (t: number, a: number, b: number): number => {
    const inverse = 1 - t;
    return 3 * inverse * inverse * t * a + 3 * inverse * t * t * b + t * t * t;
  };
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (curve(mid, x1, x2) < x) low = mid;
    else high = mid;
  }
  return curve((low + high) / 2, y1, y2);
};

/** Smooth periodic bobbing; amplitude is a strict maximum displacement. */
export const getDampedOscillation = (
  frame: number,
  periodFrames: number,
  amplitude: number,
  dampingPerCycle = 0,
  phase = 0,
): number => {
  [frame, amplitude, dampingPerCycle, phase].forEach((v, i) =>
    assertFinite(v, ['frame', 'amplitude', 'dampingPerCycle', 'phase'][i]),
  );
  if (!Number.isFinite(periodFrames) || periodFrames <= 0) {
    throw new Error('periodFrames must be greater than zero.');
  }
  if (dampingPerCycle < 0) {
    throw new Error('dampingPerCycle cannot be negative.');
  }
  const cycles = frame / periodFrames;
  const envelope = Math.exp(-dampingPerCycle * Math.max(0, cycles));
  return Math.sin(cycles * Math.PI * 2 + phase) * amplitude * envelope;
};
