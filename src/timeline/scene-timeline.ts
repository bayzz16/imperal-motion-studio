export type SceneTimelineInput = {
  /** Stable, project-local identifier for this scene. */
  id: string;
  /** Scene length in frames; must be a positive integer. */
  durationInFrames: number;
  /** Optional empty space before this scene, measured in frames. */
  gapBeforeFrames?: number;
  /** Optional overlap with the next scene; measured in frames. */
  transitionAfterFrames?: number;
};

export type ScenePlacement = {
  id: string;
  from: number;
  durationInFrames: number;
  /** Exclusive end frame: the scene occupies [from, endFrameExclusive). */
  endFrameExclusive: number;
  /** Frames shared with the previous scene, when a transition is planned. */
  transitionInFrames?: number;
  /** Frames shared with the next scene, when a transition is planned. */
  transitionOutFrames?: number;
};

export type SceneTimeline = {
  scenes: ScenePlacement[];
  totalDurationInFrames: number;
};

type NormalizedScene = {
  id: string;
  durationInFrames: number;
  gapBeforeFrames: number;
  transitionAfterFrames: number;
};

/**
 * Places scenes on a zero-based timeline with optional pairwise overlaps.
 *
 * A transitionAfterFrames value moves the next scene earlier by that many
 * frames. Both scenes keep their full local durations, so the composition
 * becomes shorter by the overlap. Gaps and incoming transitions are mutually
 * exclusive. Adjacent transitions may not overlap inside a middle scene,
 * preventing accidental three-scene overlaps.
 *
 * This is a planning utility, not a visual transition renderer. Consumers can
 * use the returned placements with SceneSequence and animate the exposed
 * transitionInFrames / transitionOutFrames in their own scene components.
 */
export const buildSceneTimeline = (
  scenes: readonly SceneTimelineInput[],
): SceneTimeline => {
  const ids = new Set<string>();

  const normalized: NormalizedScene[] = scenes.map((scene, index) => {
    if (typeof scene.id !== 'string' || scene.id.trim().length === 0) {
      throw new Error(`Scene at index ${index} must have a non-empty id.`);
    }

    if (ids.has(scene.id)) {
      throw new Error(`Duplicate scene id: ${scene.id}`);
    }
    ids.add(scene.id);

    if (
      !Number.isSafeInteger(scene.durationInFrames) ||
      scene.durationInFrames <= 0
    ) {
      throw new Error(
        `Scene "${scene.id}" durationInFrames must be a positive safe integer.`,
      );
    }

    const gapBeforeFrames = scene.gapBeforeFrames ?? 0;
    if (!Number.isSafeInteger(gapBeforeFrames) || gapBeforeFrames < 0) {
      throw new Error(
        `Scene "${scene.id}" gapBeforeFrames must be a non-negative safe integer.`,
      );
    }

    const transitionAfterFrames = scene.transitionAfterFrames ?? 0;
    if (
      !Number.isSafeInteger(transitionAfterFrames) ||
      transitionAfterFrames < 0
    ) {
      throw new Error(
        `Scene "${scene.id}" transitionAfterFrames must be a non-negative safe integer.`,
      );
    }

    if (transitionAfterFrames > scene.durationInFrames) {
      throw new Error(
        `Scene "${scene.id}" transitionAfterFrames cannot exceed its duration.`,
      );
    }

    return {
      id: scene.id,
      durationInFrames: scene.durationInFrames,
      gapBeforeFrames,
      transitionAfterFrames,
    };
  });

  normalized.forEach((scene, index) => {
    const previous = normalized[index - 1];
    const next = normalized[index + 1];
    const transitionInFrames = previous?.transitionAfterFrames ?? 0;

    if (scene.transitionAfterFrames > 0 && !next) {
      throw new Error(
        `Scene "${scene.id}" cannot transition after the final scene.`,
      );
    }

    if (scene.transitionAfterFrames > 0 && next) {
      if (scene.transitionAfterFrames > next.durationInFrames) {
        throw new Error(
          `Scene "${scene.id}" transitionAfterFrames cannot exceed the next scene duration.`,
        );
      }

      if (next.gapBeforeFrames > 0) {
        throw new Error(
          `Scene "${next.id}" cannot have gapBeforeFrames when the previous scene transitions into it.`,
        );
      }
    }

    if (transitionInFrames > 0 && scene.gapBeforeFrames > 0) {
      throw new Error(
        `Scene "${scene.id}" cannot combine an incoming transition with gapBeforeFrames.`,
      );
    }

    if (transitionInFrames + scene.transitionAfterFrames > scene.durationInFrames) {
      throw new Error(
        `Scene "${scene.id}" has adjacent transitions that exceed its duration.`,
      );
    }
  });

  let previousEndFrameExclusive = 0;
  const placements = normalized.map((scene, index): ScenePlacement => {
    const transitionInFrames = normalized[index - 1]?.transitionAfterFrames ?? 0;
    const from =
      previousEndFrameExclusive - transitionInFrames + scene.gapBeforeFrames;
    const endFrameExclusive = from + scene.durationInFrames;

    if (!Number.isSafeInteger(from) || !Number.isSafeInteger(endFrameExclusive)) {
      throw new Error(`Scene "${scene.id}" exceeds the safe timeline range.`);
    }

    previousEndFrameExclusive = endFrameExclusive;

    return {
      id: scene.id,
      from,
      durationInFrames: scene.durationInFrames,
      endFrameExclusive,
      ...(transitionInFrames > 0 ? {transitionInFrames} : {}),
      ...(scene.transitionAfterFrames > 0
        ? {transitionOutFrames: scene.transitionAfterFrames}
        : {}),
    };
  });

  return {
    scenes: placements,
    totalDurationInFrames: previousEndFrameExclusive,
  };
};
