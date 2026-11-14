import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {VIDEO_PROJECTS} from './projects/registry';
import {CinematicFrame} from './visual/CinematicFrame';

type OutputFormat = {
  id: string;
  width: number;
  height: number;
};

const OUTPUT_FORMATS: OutputFormat[] = [
  {id: 'YouTube-16x9', width: 1920, height: 1080},
  {id: 'Vertical-9x16', width: 1080, height: 1920},
  {id: 'Instagram-4x5', width: 1080, height: 1350},
  {id: 'Square-1x1', width: 1080, height: 1080},
];

const createCinematicComponent = (
  Component: React.ComponentType,
  projectId: string,
  durationInFrames: number,
  baseWidth: number,
  baseHeight: number,
  format?: OutputFormat,
): React.FC => {
  const Wrapped: React.FC = () => {
    const cinematic = (
      <CinematicFrame projectId={projectId} durationInFrames={durationInFrames}>
        <Component />
      </CinematicFrame>
    );

    if (!format) {
      return cinematic;
    }

    // Preserve the complete authored layout when converting aspect ratios.
    // This avoids cropping titles, diagrams, captions, and other key content.
    const scale = Math.min(format.width / baseWidth, format.height / baseHeight);

    return (
      <AbsoluteFill style={{backgroundColor: '#05070d', overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            width: baseWidth,
            height: baseHeight,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {cinematic}
        </div>
      </AbsoluteFill>
    );
  };

  Wrapped.displayName = 'Cinematic' + projectId + (format ? format.id : '');
  return Wrapped;
};

const REGISTERED_PROJECTS = VIDEO_PROJECTS.flatMap((project) => {
  const original = {
    ...project,
    component: createCinematicComponent(
      project.component,
      project.id,
      project.durationInFrames,
      project.width,
      project.height,
    ),
  };

  const formatted = OUTPUT_FORMATS
    .filter((format) => format.width * project.height !== format.height * project.width)
    .map((format) => ({
      ...project,
      id: `${project.id}-${format.id}`,
      width: format.width,
      height: format.height,
      component: createCinematicComponent(
        project.component,
        project.id,
        project.durationInFrames,
        project.width,
        project.height,
        format,
      ),
    }));

  return [original, ...formatted];
});

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
