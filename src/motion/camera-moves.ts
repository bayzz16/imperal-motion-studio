import {Easing, interpolate} from 'remotion';

export type CameraMovePreset =
  | 'push-in'
  | 'pull-out'
  | 'pan-left'
  | 'pan-right'
  | 'drift';

export type CameraTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

/**
 * Calculates deterministic, frame-based camera movement.
 *
 * Translation values are pixels and can be applied to an oversized image
 * or scene wrapper. Keep the source visual slightly larger than the frame
 * when using pans so empty edges do not become visible.
 */
export const getCameraTransform = ({
  frame,
  durationInFrames,
  preset,
  intensity = 1,
}: {
  frame: number;
  durationInFrames: number;
  preset: CameraMovePreset;
  intensity?: number;
}): CameraTransform => {
  if (!Number.isFinite(frame)) {
    throw new Error('Camera frame must be a finite number.');
  }

  if (!Number.isInteger(durationInFrames) || durationInFrames < 1) {
    throw new Error('Camera durationInFrames must be a positive integer.');
  }

  if (!Number.isFinite(intensity) || intensity < 0 || intensity > 2) {
    throw new Error('Camera intensity must be between 0 and 2.');
  }

  const lastFrame = Math.max(1, durationInFrames - 1);
  const progress = interpolate(frame, [0, lastFrame], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const amount = intensity;
  const panDistance = 36 * amount;
  const zoomDistance = 0.06 * amount;

  switch (preset) {
    case 'push-in':
      return {
        scale: 1 + zoomDistance * progress,
        translateX: 0,
        translateY: 0,
      };
    case 'pull-out':
      return {
        scale: 1 + zoomDistance * (1 - progress),
        translateX: 0,
        translateY: 0,
      };
    case 'pan-left':
      return {
        scale: 1 + zoomDistance * 0.35,
        translateX: panDistance * (1 - 2 * progress),
        translateY: 0,
      };
    case 'pan-right':
      return {
        scale: 1 + zoomDistance * 0.35,
        translateX: panDistance * (2 * progress - 1),
        translateY: 0,
      };
    case 'drift':
      return {
        scale: 1 + zoomDistance * progress,
        translateX: panDistance * (progress - 0.5),
        translateY: panDistance * 0.2 * (0.5 - progress),
      };
    default: {
      const exhaustivePreset: never = preset;
      throw new Error(`Unsupported camera preset: ${exhaustivePreset}`);
    }
  }
};
