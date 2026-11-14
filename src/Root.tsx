import React from 'react';
import {Composition} from 'remotion';
import {VIDEO_PROJECTS} from './projects/registry';
import {CinematicFrame} from './visual/CinematicFrame';

const createCinematicComponent = (Component: React.ComponentType, projectId: string, durationInFrames: number): React.FC => {
  const Wrapped: React.FC = () => (
    <CinematicFrame projectId={projectId} durationInFrames={durationInFrames}>
      <Component />
    </CinematicFrame>
  );
  Wrapped.displayName = 'Cinematic' + projectId;
  return Wrapped;
};

const REGISTERED_PROJECTS = VIDEO_PROJECTS.map((project) => ({
  ...project,
  component: createCinematicComponent(project.component, project.id, project.durationInFrames),
}));

export const Root: React.FC = () => {
  return (
    <>
      {REGISTERED_PROJECTS.map((project) => (
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
