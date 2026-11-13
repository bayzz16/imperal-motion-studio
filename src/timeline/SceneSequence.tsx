import React from 'react';
import {Sequence} from 'remotion';
import type {ScenePlacement} from './scene-timeline';

export type SceneSequenceProps = {
  placement: ScenePlacement;
  children: React.ReactNode;
};

/**
 * Renders one planned scene at its absolute position on a Remotion timeline.
 * The child receives a local frame clock starting at zero.
 */
export const SceneSequence: React.FC<SceneSequenceProps> = ({
  placement,
  children,
}) => {
  return (
    <Sequence
      name={placement.id}
      from={placement.from}
      durationInFrames={placement.durationInFrames}
    >
      {children}
    </Sequence>
  );
};
