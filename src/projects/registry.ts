import type React from 'react';
import {ImperialSolTeaser} from '../ImperialSolTeaser';
import {TunasDewa} from '../TunasDewa';
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
 * Add each composition here; project-specific visuals and assets stay isolated.
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
  {
    id: 'TunasDewa',
    component: TunasDewa,
    durationInFrames: 2700,
    fps: 30,
    width: 1080,
    height: 1920,
  },
  {
    id: 'ImperialSolTeaser',
    component: ImperialSolTeaser,
    durationInFrames: 2160,
    fps: 30,
    width: 1080,
    height: 1920,
  },
];
