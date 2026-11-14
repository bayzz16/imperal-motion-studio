export type OrbitPosition = [number, number, number];

/**
 * Deterministic elliptical orbit position for frame-accurate Remotion rendering.
 * Inclination controls the visible vertical compression of the orbit.
 */
export const getOrbitPosition = (
  frame: number,
  orbitRadius: number,
  orbitPeriodFrames: number,
  inclination = 0.32,
): OrbitPosition => {
  if (!Number.isFinite(frame)) throw new Error('frame must be finite.');
  if (!Number.isFinite(orbitRadius) || orbitRadius <= 0) {
    throw new Error('orbitRadius must be a positive finite number.');
  }
  if (!Number.isFinite(orbitPeriodFrames) || orbitPeriodFrames <= 0) {
    throw new Error('orbitPeriodFrames must be a positive finite number.');
  }
  if (!Number.isFinite(inclination) || inclination < 0 || inclination > 1) {
    throw new Error('inclination must be between 0 and 1.');
  }

  const phase = (((frame % orbitPeriodFrames) + orbitPeriodFrames) % orbitPeriodFrames) /
    orbitPeriodFrames * Math.PI * 2;

  return [
    Math.cos(phase) * orbitRadius,
    Math.sin(phase) * orbitRadius * inclination,
    Math.sin(phase * 0.5) * 0.12,
  ];
};
