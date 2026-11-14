import React, {useMemo} from 'react';
import type {Caption} from '@remotion/captions';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {resolveCaptionLayout, validateCaptions} from './caption-utils';

export type CaptionTrackProps = {
  captions: readonly Caption[];
  horizontalSafeArea?: number;
  bottomSafeArea?: number;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string | null;
  fontWeight?: number;
};

/**
 * Burns time-aligned captions into a Remotion composition.
 * Cue intervals are half-open: startMs is visible, endMs is not.
 */
export const CaptionTrack: React.FC<CaptionTrackProps> = ({
  captions,
  horizontalSafeArea = 0.08,
  bottomSafeArea = 0.12,
  fontSize,
  textColor = '#ffffff',
  backgroundColor = 'rgba(0, 0, 0, 0.68)',
  fontWeight = 700,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const orderedCaptions = useMemo(
    () => validateCaptions(captions),
    [captions],
  );
  const layout = useMemo(
    () =>
      resolveCaptionLayout({
        width,
        height,
        horizontalSafeArea,
        bottomSafeArea,
        fontSize,
      }),
    [width, height, horizontalSafeArea, bottomSafeArea, fontSize],
  );

  const currentTimeMs = (frame / fps) * 1000;
  const activeCaptions = orderedCaptions.filter(
    (caption) =>
      currentTimeMs >= caption.startMs && currentTimeMs < caption.endMs,
  );

  if (activeCaptions.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingLeft: layout.horizontalInset,
        paddingRight: layout.horizontalInset,
        paddingBottom: layout.bottomInset,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: layout.maxWidth,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: layout.fontSize * 0.12,
        }}
      >
        {activeCaptions.map((caption, index) => (
          <div
            key={`${caption.startMs}-${caption.endMs}-${index}`}
            style={{
              color: textColor,
              backgroundColor: backgroundColor ?? 'transparent',
              fontSize: layout.fontSize,
              fontWeight,
              lineHeight: 1.2,
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              padding: `${layout.fontSize * 0.14}px ${layout.fontSize * 0.28}px`,
              borderRadius: layout.fontSize * 0.16,
              textShadow: '0 2px 6px rgba(0, 0, 0, 0.72)',
            }}
          >
            {caption.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
