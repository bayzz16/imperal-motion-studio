import type {ReactNode} from 'react';
import {buildSceneTimeline} from '../timeline/scene-timeline';

export type SceneTransitionPreset = 'fade' | 'slide' | 'wipe' | 'flip';
export type SceneTransitionTimingPreset = 'linear' | 'spring';
export type SceneTransitionDirection =
  | 'from-left'
  | 'from-right'
  | 'from-top'
  | 'from-bottom';

export type SceneTransitionScene = {
  id: string;
  durationInFrames: number;
  children: ReactNode;
  /** Overlap with the next scene, measured in frames. */
  transitionAfterFrames?: number;
  /** Defaults to a two-sided fade when a transition is requested. */
  transitionPreset?: SceneTransitionPreset;
  /** Defaults to linear timing. */
  transitionTiming?: SceneTransitionTimingPreset;
  /** Direction for slide, wipe, and flip. Defaults to from-left. */
  transitionDirection?: SceneTransitionDirection;
};

export type SceneTransitionPlanItem =
  | {
      type: 'scene';
      id: string;
      durationInFrames: number;
      children: ReactNode;
    }
  | {
      type: 'transition';
      id: string;
      afterSceneId: string;
      durationInFrames: number;
      preset: SceneTransitionPreset;
      timing: SceneTransitionTimingPreset;
      direction: SceneTransitionDirection;
    };

const PRESETS: readonly SceneTransitionPreset[] = [
  'fade',
  'slide',
  'wipe',
  'flip',
];
const TIMINGS: readonly SceneTransitionTimingPreset[] = ['linear', 'spring'];
const DIRECTIONS: readonly SceneTransitionDirection[] = [
  'from-left',
  'from-right',
  'from-top',
  'from-bottom',
];

/**
 * Converts project-agnostic scene descriptors into ordered sequence/transition
 * instructions. The shared timeline planner remains the source of truth for
 * duration and overlap validation.
 */
export const buildSceneTransitionPlan = (
  scenes: readonly SceneTransitionScene[],
): SceneTransitionPlanItem[] => {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error('At least one scene is required.');
  }

  buildSceneTimeline(
    scenes.map(({id, durationInFrames, transitionAfterFrames}) => ({
      id,
      durationInFrames,
      transitionAfterFrames,
    })),
  );

  const plan: SceneTransitionPlanItem[] = [];

  scenes.forEach((scene, index) => {
    plan.push({
      type: 'scene',
      id: scene.id,
      durationInFrames: scene.durationInFrames,
      children: scene.children,
    });

    const durationInFrames = scene.transitionAfterFrames ?? 0;
    if (durationInFrames === 0) {
      if (
        scene.transitionPreset !== undefined ||
        scene.transitionTiming !== undefined ||
        scene.transitionDirection !== undefined
      ) {
        throw new Error(
          `Scene "${scene.id}" has transition settings but no transitionAfterFrames.`,
        );
      }

      return;
    }

    const preset = scene.transitionPreset ?? 'fade';
    const timing = scene.transitionTiming ?? 'linear';
    const direction = scene.transitionDirection ?? 'from-left';

    if (!PRESETS.includes(preset)) {
      throw new Error(`Scene "${scene.id}" has an unsupported transition preset.`);
    }

    if (!TIMINGS.includes(timing)) {
      throw new Error(`Scene "${scene.id}" has an unsupported transition timing.`);
    }

    if (!DIRECTIONS.includes(direction)) {
      throw new Error(`Scene "${scene.id}" has an unsupported transition direction.`);
    }

    plan.push({
      type: 'transition',
      id: `transition-${scene.id}-to-${scenes[index + 1].id}`,
      afterSceneId: scene.id,
      durationInFrames,
      preset,
      timing,
      direction,
    });
  });

  return plan;
};
