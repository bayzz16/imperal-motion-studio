import {buildSceneTimeline} from '../timeline/scene-timeline';

export const SHOT_FRAMINGS = [
  'extreme-wide',
  'wide',
  'medium-wide',
  'medium',
  'medium-close-up',
  'close-up',
  'extreme-close-up',
  'insert',
  'over-the-shoulder',
  'point-of-view',
] as const;

export const CAMERA_ANGLES = [
  'eye-level',
  'high-angle',
  'low-angle',
  'overhead',
  'dutch-angle',
] as const;

export const CAMERA_MOVEMENTS = [
  'static',
  'pan',
  'tilt',
  'dolly',
  'truck',
  'pedestal',
  'zoom',
  'orbit',
  'handheld',
] as const;

export type ShotFraming = (typeof SHOT_FRAMINGS)[number];
export type CameraAngle = (typeof CAMERA_ANGLES)[number];
export type CameraMovement = (typeof CAMERA_MOVEMENTS)[number];

export type ShotListFrameRate = Readonly<{
  numerator: number;
  denominator: number;
}>;

export const COMMON_SHOT_FRAME_RATES = {
  fps23976: {numerator: 24000, denominator: 1001},
  fps24: {numerator: 24, denominator: 1},
  fps25: {numerator: 25, denominator: 1},
  fps2997: {numerator: 30000, denominator: 1001},
  fps30: {numerator: 30, denominator: 1},
  fps5994: {numerator: 60000, denominator: 1001},
  fps60: {numerator: 60, denominator: 1},
} as const satisfies Record<string, ShotListFrameRate>;

export type ShotListShotInput = Readonly<{
  /** Stable identifier scoped to this project sequence. */
  id: string;
  /** Optional script scene identifier; it is not required for every format. */
  sceneId?: string;
  /** Who or what the camera is primarily showing. */
  subject: string;
  /** The visible action or change within the shot. */
  action: string;
  framing: ShotFraming;
  cameraAngle?: CameraAngle;
  cameraMovement?: CameraMovement;
  /** Optional focal length metadata; it does not configure a physical camera. */
  lensMm?: number;
  durationInFrames: number;
  gapBeforeFrames?: number;
  transitionAfterFrames?: number;
  /** Optional production or continuity note. */
  notes?: string;
}>;

export type PlannedShot = {
  id: string;
  shotNumber: number;
  sceneId?: string;
  subject: string;
  action: string;
  framing: ShotFraming;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  lensMm?: number;
  durationInFrames: number;
  gapBeforeFrames?: number;
  transitionAfterFrames?: number;
  notes?: string;
  fromFrame: number;
  endFrameExclusive: number;
  transitionInFrames?: number;
  transitionOutFrames?: number;
};

export type ShotListInput = Readonly<{
  /** Project-local namespace; shot lists are not registered globally. */
  projectId: string;
  /** Sequence identifier within the project. */
  sequenceId: string;
  /** Rational frame rate avoids storing 23.976/29.97 as rounded decimals. */
  frameRate: ShotListFrameRate;
  /** Array order is the editorial shot order. */
  shots: readonly ShotListShotInput[];
}>;

export type ShotList = {
  projectId: string;
  sequenceId: string;
  frameRate: ShotListFrameRate;
  shots: PlannedShot[];
  totalDurationInFrames: number;
};

const nonEmpty = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string.`);
  }

  return value.trim();
};

const optionalText = (value: unknown, field: string): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string when provided.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const assertChoice = <T extends string>(
  value: unknown,
  choices: readonly T[],
  field: string,
): T => {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new Error(`${field} must be one of: ${choices.join(', ')}.`);
  }

  return value as T;
};

const greatestCommonDivisor = (left: number, right: number): number => {
  let a = left;
  let b = right;

  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
};

const normalizeFrameRate = (value: ShotListFrameRate): ShotListFrameRate => {
  if (!value || typeof value !== 'object') {
    throw new Error('frameRate must contain a positive numerator and denominator.');
  }

  const {numerator, denominator} = value;
  if (
    !Number.isSafeInteger(numerator) ||
    numerator <= 0 ||
    !Number.isSafeInteger(denominator) ||
    denominator <= 0
  ) {
    throw new Error('frameRate numerator and denominator must be positive safe integers.');
  }

  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
};

/**
 * Validates a project-local shot list and places its shots on the shared
 * frame timeline. The input array order is preserved and never mutated.
 */
export const buildShotList = (input: ShotListInput): ShotList => {
  if (!input || typeof input !== 'object') {
    throw new Error('Shot list input must be an object.');
  }

  const projectId = nonEmpty(input.projectId, 'projectId');
  const sequenceId = nonEmpty(input.sequenceId, 'sequenceId');
  const frameRate = normalizeFrameRate(input.frameRate);

  if (!Array.isArray(input.shots) || input.shots.length === 0) {
    throw new Error('shots must be a non-empty array.');
  }

  const normalizedShots = input.shots.map((shot, index) => {
    if (!shot || typeof shot !== 'object') {
      throw new Error(`Shot at index ${index} must be an object.`);
    }

    const id = nonEmpty(shot.id, `Shot at index ${index} id`);
    const sceneId = optionalText(shot.sceneId, `Shot "${id}" sceneId`);
    const subject = nonEmpty(shot.subject, `Shot "${id}" subject`);
    const action = nonEmpty(shot.action, `Shot "${id}" action`);
    const framing = assertChoice(shot.framing, SHOT_FRAMINGS, `Shot "${id}" framing`);
    const cameraAngle =
      shot.cameraAngle === undefined
        ? 'eye-level'
        : assertChoice(shot.cameraAngle, CAMERA_ANGLES, `Shot "${id}" cameraAngle`);
    const cameraMovement =
      shot.cameraMovement === undefined
        ? 'static'
        : assertChoice(
            shot.cameraMovement,
            CAMERA_MOVEMENTS,
            `Shot "${id}" cameraMovement`,
          );

    if (
      shot.lensMm !== undefined &&
      (!Number.isFinite(shot.lensMm) || shot.lensMm <= 0)
    ) {
      throw new Error(`Shot "${id}" lensMm must be a positive finite number.`);
    }

    const notes = optionalText(shot.notes, `Shot "${id}" notes`);

    return {
      id,
      ...(sceneId ? {sceneId} : {}),
      subject,
      action,
      framing,
      cameraAngle,
      cameraMovement,
      ...(shot.lensMm !== undefined ? {lensMm: shot.lensMm} : {}),
      durationInFrames: shot.durationInFrames,
      ...(shot.gapBeforeFrames !== undefined
        ? {gapBeforeFrames: shot.gapBeforeFrames}
        : {}),
      ...(shot.transitionAfterFrames !== undefined
        ? {transitionAfterFrames: shot.transitionAfterFrames}
        : {}),
      ...(notes ? {notes} : {}),
    };
  });

  const timeline = buildSceneTimeline(
    normalizedShots.map((shot) => ({
      id: shot.id,
      durationInFrames: shot.durationInFrames,
      ...(shot.gapBeforeFrames !== undefined
        ? {gapBeforeFrames: shot.gapBeforeFrames}
        : {}),
      ...(shot.transitionAfterFrames !== undefined
        ? {transitionAfterFrames: shot.transitionAfterFrames}
        : {}),
    })),
  );

  return {
    projectId,
    sequenceId,
    frameRate,
    shots: normalizedShots.map((shot, index) => {
      const placement = timeline.scenes[index];
      return {
        ...shot,
        shotNumber: index + 1,
        fromFrame: placement.from,
        endFrameExclusive: placement.endFrameExclusive,
        ...(placement.transitionInFrames !== undefined
          ? {transitionInFrames: placement.transitionInFrames}
          : {}),
        ...(placement.transitionOutFrames !== undefined
          ? {transitionOutFrames: placement.transitionOutFrames}
          : {}),
      };
    }),
    totalDurationInFrames: timeline.totalDurationInFrames,
  };
};
