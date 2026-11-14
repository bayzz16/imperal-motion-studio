import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {getCinematicFrameStyle} from './cinematic-style';

type CinematicFrameProps = {
  projectId: string;
  durationInFrames: number;
  children: React.ReactNode;
};

/**
 * Shared cinematic finishing layer: restrained camera movement, gentle grade,
 * edge vignette, and low-opacity film texture. It does not alter frame timing.
 */
export const CinematicFrame: React.FC<CinematicFrameProps> = ({
  projectId,
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const frameStyle = getCinematicFrameStyle(frame, durationInFrames, projectId);

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#05070d'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: 'center center',
          transform: frameStyle.transform,
          filter: frameStyle.filter,
          willChange: 'transform',
        }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(ellipse at 50% 46%, transparent 43%, rgba(0,0,0,0.26) 100%), linear-gradient(180deg, rgba(255,220,170,0.055), transparent 24%, transparent 78%, rgba(0,0,0,0.16))',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.075,
          mixBlendMode: 'soft-light',
          backgroundImage:
            'repeating-radial-gradient(circle at 20% 30%, rgba(255,255,255,0.55) 0 0.45px, transparent 0.6px 3px)',
          backgroundSize: '5px 5px',
        }}
      />
    </AbsoluteFill>
  );
};
