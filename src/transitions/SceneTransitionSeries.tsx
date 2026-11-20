import React from 'react';
import {
  linearTiming,
  springTiming,
  TransitionSeries,
  type TransitionPresentation,
  type TransitionTiming,
} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {flip} from '@remotion/transitions/flip';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {
  buildSceneTransitionPlan,
  type SceneTransitionPlanItem,
  type SceneTransitionScene,
} from './scene-transition-plan';

export type SceneTransitionSeriesProps = {
  scenes: readonly SceneTransitionScene[];
  name?: string;
};

const getPresentation = (
  transition: Extract<SceneTransitionPlanItem, {type: 'transition'}>,
): TransitionPresentation<any> => {
  switch (transition.preset) {
    case 'fade':
      return fade({shouldFadeOutExitingScene: true});
    case 'slide':
      return slide({direction: transition.direction});
    case 'wipe':
      return wipe({direction: transition.direction});
    case 'flip':
      return flip({direction: transition.direction});
  }
};

const getTiming = (
  transition: Extract<SceneTransitionPlanItem, {type: 'transition'}>,
): TransitionTiming => {
  if (transition.timing === 'spring') {
    return springTiming({
      config: {damping: 200},
      durationInFrames: transition.durationInFrames,
      durationRestThreshold: 0.001,
    });
  }

  return linearTiming({durationInFrames: transition.durationInFrames});
};

/**
 * Renders reusable scene-to-scene transitions. Scene durations and overlap
 * constraints are validated by buildSceneTimeline through the plan builder.
 */
export const SceneTransitionSeries: React.FC<SceneTransitionSeriesProps> = ({
  scenes,
  name = 'Scene transitions',
}) => {
  const plan = buildSceneTransitionPlan(scenes);

  return (
    <TransitionSeries name={name}>
      {plan.map((item) => {
        if (item.type === 'scene') {
          return (
            <TransitionSeries.Sequence
              key={item.id}
              name={item.id}
              durationInFrames={item.durationInFrames}
            >
              {item.children}
            </TransitionSeries.Sequence>
          );
        }

        return (
          <TransitionSeries.Transition
            key={item.id}
            timing={getTiming(item)}
            presentation={getPresentation(item)}
          />
        );
      })}
    </TransitionSeries>
  );
};
