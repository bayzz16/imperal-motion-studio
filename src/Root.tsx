import React from 'react';
import {Composition} from 'remotion';
import {VIDEO_PROJECTS} from './projects/registry';

export const Root: React.FC = () => {
  return (
    <>
      {VIDEO_PROJECTS.map((project) => (
        <Composition
          key={project.id}
          id={project.id}
          component={project.component}
          durationInFrames={project.durationInFrames}
          fps={project.fps}
          width={project.width}
          height={project.height}
        />
      ))}
    </>
  );
};
