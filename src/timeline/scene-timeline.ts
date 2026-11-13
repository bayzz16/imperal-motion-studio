export type SceneTimelineInput = {
  /** Stable, project-local identifier for this scene. */
  id: string;
  /** Scene length in frames; must be a positive integer. */
  durationInFrames: number;
  /** Optional empty space before this scene, measured in frames. */
  gapBeforeFrames?: number;
};

export type ScenePlacement = {
  id: string;
  from: number;
  durationInFrames: number;
  /** Exclusive end frame: the scene occupies [from, endFrameExclusive). */
  endFrameExclusive: number;
};

export type SceneTimeline = {
  scenes: ScenePlacement[];
  totalDurationInFrames: number;
};

/**
 * Places scenes sequentially on a zero-based timeline.
 *
 * This is a planning utility, not a renderer: consumers can map the returned
 * placements to Remotion Sequence/Series components or use them in an editor.
 * Overlapping layers are intentionally outside this helper's scope.
 */
export const buildSceneTimeline = (
  scenes: readonly SceneTimelineInput[],
): SceneTimeline => {
  const ids = new Set<string>();
  let cursor = 0;

  const placements = scenes.map((scene, index): ScenePlacement => {
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

    const gap = scene.gapBeforeFrames ?? 0;
    if (!Number.isSafeInteger(gap) || gap < 0) {
      throw new Error(
        `Scene "${scene.id}" gapBeforeFrames must be a non-negative safe integer.`,
      );
    }

    const from = cursor + gap;
    const endFrameExclusive = from + scene.durationInFrames;

    if (!Number.isSafeInteger(endFrameExclusive)) {
      throw new Error(`Scene "${scene.id}" exceeds the safe timeline range.`);
    }

    cursor = endFrameExclusive;

    return {
      id: scene.id,
      from,
      durationInFrames: scene.durationInFrames,
      endFrameExclusive,
    };
  });

  return {
    scenes: placements,
    totalDurationInFrames: cursor,
  };
};
