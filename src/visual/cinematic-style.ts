import {getCameraTransform} from '../motion/camera-moves';

export type CinematicFrameStyle = {
  transform: string;
  filter: string;
};

/**
 * Returns a subtle, deterministic camera treatment for a complete composition.
 * The low intensity keeps all frame edges safely inside the viewport.
 */
export const getCinematicFrameStyle = (
  frame: number,
  durationInFrames: number,
  projectId: string,
): CinematicFrameStyle => {
  if (!projectId.trim()) {
    throw new Error('projectId must be a non-empty string.');
  }

  const preset = projectId === 'GalaxyEducation' ? 'drift' : 'push-in';
  const camera = getCameraTransform({
    frame,
    durationInFrames,
    preset,
    intensity: 0.45,
  });

  return {
    transform: `translate3d(${camera.translateX.toFixed(3)}px, ${camera.translateY.toFixed(3)}px, 0) scale(${camera.scale.toFixed(5)})`,
    filter: 'saturate(1.07) contrast(1.035) brightness(1.015)',
  };
};
