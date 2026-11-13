import type React from 'react';
import {TunasKecil} from '../TunasKecil';

export type VideoProjectDefinition = {
  id: string;
  component: React.ComponentType;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};

/**
 * Central registry for independently authored video projects.
 *
 * Add new projects here instead of placing project-specific imports and
 * composition settings directly in the shared Remotion root.
 */
export const VIDEO_PROJECTS: VideoProjectDefinition[] = [
  {
    id: 'TunasKecil',
    component: TunasKecil,
    durationInFrames: 2700,
    fps: 30,
    width: 1080,
    height: 1920,
  },
];
