import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneTransitionSeries, type SceneTransitionScene} from '../transitions';
import {buildSceneTimeline} from '../timeline/scene-timeline';

type TransitionCardProps = {
  label: string;
  background: string;
  accent: string;
};

const TransitionCard: React.FC<TransitionCardProps> = ({
  label,
  background,
  accent,
}) => (
  <AbsoluteFill
    style={{
      alignItems: 'center',
      background,
      color: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        alignItems: 'center',
        border: '3px solid rgba(255,255,255,0.72)',
        borderRadius: 18,
        display: 'flex',
        height: 104,
        justifyContent: 'center',
        position: 'relative',
        width: 220,
      }}
    >
      <div
        style={{
          background: accent,
          borderRadius: 999,
          height: 22,
          left: 16,
          position: 'absolute',
          top: 16,
          width: 22,
        }}
      />
      <span
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
    </div>
  </AbsoluteFill>
);

export const TRANSITION_FIXTURE_SCENES: readonly SceneTransitionScene[] = [
  {
    id: 'fixture-fade',
    durationInFrames: 48,
    children: <TransitionCard label="01 / FADE" background="#12304a" accent="#38bdf8" />,
    transitionAfterFrames: 12,
    transitionPreset: 'fade',
    transitionTiming: 'linear',
  },
  {
    id: 'fixture-slide',
    durationInFrames: 48,
    children: <TransitionCard label="02 / SLIDE" background="#42216b" accent="#c4b5fd" />,
    transitionAfterFrames: 12,
    transitionPreset: 'slide',
    transitionDirection: 'from-right',
  },
  {
    id: 'fixture-wipe',
    durationInFrames: 48,
    children: <TransitionCard label="03 / WIPE" background="#075b50" accent="#5eead4" />,
    transitionAfterFrames: 12,
    transitionPreset: 'wipe',
    transitionDirection: 'from-top',
  },
  {
    id: 'fixture-flip',
    durationInFrames: 48,
    children: <TransitionCard label="04 / FLIP" background="#78350f" accent="#fcd34d" />,
    transitionAfterFrames: 12,
    transitionPreset: 'flip',
    transitionDirection: 'from-bottom',
  },
  {
    id: 'fixture-end',
    durationInFrames: 48,
    children: <TransitionCard label="05 / END" background="#243447" accent="#f8fafc" />,
  },
];

export const TRANSITION_FIXTURE_DURATION_IN_FRAMES = buildSceneTimeline(
  TRANSITION_FIXTURE_SCENES.map(({id, durationInFrames, transitionAfterFrames}) => ({
    id,
    durationInFrames,
    transitionAfterFrames,
  })),
).totalDurationInFrames;

export const TransitionFixture: React.FC = () => (
  <AbsoluteFill>
    <SceneTransitionSeries scenes={TRANSITION_FIXTURE_SCENES} name="Transition fixture" />
  </AbsoluteFill>
);
