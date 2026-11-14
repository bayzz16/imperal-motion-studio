import {parseSrt, parseVtt} from '@remotion/captions';
import type {Caption} from '@remotion/captions';

export type CaptionFileFormat = 'srt' | 'vtt';

export type CaptionLayoutInput = {
  width: number;
  height: number;
  horizontalSafeArea?: number;
  bottomSafeArea?: number;
  fontSize?: number;
};

export type CaptionLayout = {
  horizontalInset: number;
  bottomInset: number;
  maxWidth: number;
  fontSize: number;
};

/**
 * Validates and stably sorts caption cues by start time.
 * Overlapping cues are intentionally preserved for simultaneous dialogue.
 */
export const validateCaptions = (captions: readonly Caption[]): Caption[] => {
  if (!Array.isArray(captions)) {
    throw new Error('Captions must be an array.');
  }

  return captions
    .map((caption, index) => {
      if (!caption || typeof caption.text !== 'string' || !caption.text.trim()) {
        throw new Error(`Caption at index ${index} must have non-empty text.`);
      }

      if (!Number.isFinite(caption.startMs) || caption.startMs < 0) {
        throw new Error(`Caption at index ${index} must have a non-negative startMs.`);
      }

      if (!Number.isFinite(caption.endMs) || caption.endMs <= caption.startMs) {
        throw new Error(`Caption at index ${index} endMs must be greater than startMs.`);
      }

      if (
        caption.timestampMs !== null &&
        !Number.isFinite(caption.timestampMs)
      ) {
        throw new Error(`Caption at index ${index} has an invalid timestampMs.`);
      }

      if (
        caption.confidence !== null &&
        (!Number.isFinite(caption.confidence) ||
          caption.confidence < 0 ||
          caption.confidence > 1)
      ) {
        throw new Error(`Caption at index ${index} confidence must be between 0 and 1.`);
      }

      if (
        caption.pageBreakAfter !== undefined &&
        typeof caption.pageBreakAfter !== 'boolean'
      ) {
        throw new Error(`Caption at index ${index} pageBreakAfter must be boolean.`);
      }

      return {caption: {...caption}, index};
    })
    .sort((a, b) => a.caption.startMs - b.caption.startMs || a.index - b.index)
    .map(({caption}) => caption);
};

/** Parses SRT or WebVTT text using Remotion's maintained caption parsers. */
export const parseCaptionFile = (
  input: string,
  format: CaptionFileFormat,
): Caption[] => {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error('Caption input must be a non-empty string.');
  }

  if (format !== 'srt' && format !== 'vtt') {
    throw new Error('Caption format must be either srt or vtt.');
  }

  const parsed =
    format === 'srt'
      ? parseSrt({input, strict: true})
      : parseVtt({input});

  if (parsed.captions.length === 0) {
    throw new Error('No valid caption cues were found in the input.');
  }

  return validateCaptions(parsed.captions);
};

/** Resolves proportional caption insets and a readable default font size. */
export const resolveCaptionLayout = ({
  width,
  height,
  horizontalSafeArea = 0.08,
  bottomSafeArea = 0.12,
  fontSize,
}: CaptionLayoutInput): CaptionLayout => {
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error('Caption canvas width must be a positive finite number.');
  }

  if (!Number.isFinite(height) || height <= 0) {
    throw new Error('Caption canvas height must be a positive finite number.');
  }

  if (
    !Number.isFinite(horizontalSafeArea) ||
    horizontalSafeArea < 0 ||
    horizontalSafeArea >= 0.5
  ) {
    throw new Error('horizontalSafeArea must be between 0 and 0.5.');
  }

  if (
    !Number.isFinite(bottomSafeArea) ||
    bottomSafeArea < 0 ||
    bottomSafeArea >= 0.5
  ) {
    throw new Error('bottomSafeArea must be between 0 and 0.5.');
  }

  if (fontSize !== undefined && (!Number.isFinite(fontSize) || fontSize <= 0)) {
    throw new Error('fontSize must be a positive finite number.');
  }

  const horizontalInset = width * horizontalSafeArea;
  return {
    horizontalInset,
    bottomInset: height * bottomSafeArea,
    maxWidth: width - horizontalInset * 2,
    fontSize: fontSize ?? Math.min(width * 0.044, height * 0.05),
  };
};
