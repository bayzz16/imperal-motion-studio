export type CaptionQcCue = {
  text: string;
  startMs: number;
  endMs: number;
};

export type CaptionQcOptions = {
  maxCharactersPerSecond?: number;
  maxWordsPerMinute?: number;
  maxCharactersPerLine?: number;
  maxLines?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
};

export type CaptionQcIssueCode =
  | 'max-cps'
  | 'max-wpm'
  | 'max-line-characters'
  | 'max-lines'
  | 'min-duration'
  | 'max-duration';

export type CaptionQcIssue = {
  code: CaptionQcIssueCode;
  severity: 'warning';
  captionIndex: number;
  lineIndex?: number;
  measured: number;
  limit: number;
  message: string;
};

export type CaptionQcMetric = {
  captionIndex: number;
  durationMs: number;
  characterCount: number;
  wordCount: number;
  charactersPerSecond: number;
  wordsPerMinute: number;
  lineCount: number;
  maxLineCharacters: number;
};

export type CaptionQcResult = {
  passed: boolean;
  metrics: CaptionQcMetric[];
  issues: CaptionQcIssue[];
};

/**
 * Named reference profiles. They are optional editorial presets, not universal
 * rules: choose one only when its language, audience, and delivery context fit.
 */
export const CAPTION_QC_PRESETS = {
  netflixEnglishAdult: {
    maxCharactersPerSecond: 20,
    maxCharactersPerLine: 42,
    maxLines: 2,
    minDurationMs: (5 / 6) * 1000,
    maxDurationMs: 7000,
  },
  netflixEnglishChildren: {
    maxCharactersPerSecond: 17,
    maxCharactersPerLine: 42,
    maxLines: 2,
    minDurationMs: (5 / 6) * 1000,
    maxDurationMs: 7000,
  },
  dcmpEducationalLower: {maxWordsPerMinute: 130},
  dcmpEducationalMiddle: {maxWordsPerMinute: 140},
  dcmpEducationalUpper: {maxWordsPerMinute: 160},
} as const satisfies Record<string, CaptionQcOptions>;

export type CaptionQcPresetName = keyof typeof CAPTION_QC_PRESETS;

const validateOptions = (options: CaptionQcOptions): void => {
  for (const key of [
    'maxCharactersPerSecond',
    'maxWordsPerMinute',
    'maxCharactersPerLine',
    'maxLines',
    'minDurationMs',
    'maxDurationMs',
  ] as const) {
    const value = options[key];
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(key + ' must be a positive finite number.');
    }
    if (key === 'maxLines' && !Number.isInteger(value)) {
      throw new Error('maxLines must be a positive integer.');
    }
  }

  if (
    options.minDurationMs !== undefined &&
    options.maxDurationMs !== undefined &&
    options.minDurationMs > options.maxDurationMs
  ) {
    throw new Error('minDurationMs must not exceed maxDurationMs.');
  }
};

const countCharacters = (value: string): number =>
  Array.from(value.replace(/\r\n|\r|\n/g, '')).length;

const countWords = (value: string): number =>
  value.trim().split(/\s+/u).filter(Boolean).length;

/**
 * Measures caption readability and emits warnings for only the limits supplied
 * by the caller. It deliberately preserves overlapping cues for simultaneous
 * dialogue and never edits or paraphrases the source captions.
 */
export const analyzeCaptionReadability = (
  captions: readonly CaptionQcCue[],
  options: CaptionQcOptions = {},
): CaptionQcResult => {
  const input: unknown = captions;
  if (!Array.isArray(input)) {
    throw new Error('Captions must be an array.');
  }
  const cueList = input as readonly CaptionQcCue[];
  validateOptions(options);

  const metrics: CaptionQcMetric[] = [];
  const issues: CaptionQcIssue[] = [];

  cueList.forEach((caption, captionIndex) => {
    if (!caption || typeof caption.text !== 'string' || !caption.text.trim()) {
      throw new Error('Caption at index ' + captionIndex + ' must have non-empty text.');
    }
    if (!Number.isFinite(caption.startMs) || caption.startMs < 0) {
      throw new Error('Caption at index ' + captionIndex + ' must have a non-negative startMs.');
    }
    if (!Number.isFinite(caption.endMs) || caption.endMs <= caption.startMs) {
      throw new Error('Caption at index ' + captionIndex + ' endMs must be greater than startMs.');
    }

    const durationMs = caption.endMs - caption.startMs;
    const lines: string[] = caption.text.split(/\r\n|\r|\n/);
    const characterCount = countCharacters(caption.text);
    const wordCount = countWords(caption.text);
    const maxLineCharacters = Math.max(...lines.map((line) => Array.from(line.trim()).length));
    const metric: CaptionQcMetric = {
      captionIndex,
      durationMs,
      characterCount,
      wordCount,
      charactersPerSecond: characterCount / (durationMs / 1000),
      wordsPerMinute: (wordCount * 60000) / durationMs,
      lineCount: lines.length,
      maxLineCharacters,
    };
    metrics.push(metric);

    const addIssue = (
      code: CaptionQcIssueCode,
      measured: number,
      limit: number,
      message: string,
      lineIndex?: number,
    ) => {
      issues.push({
        code,
        severity: 'warning',
        captionIndex,
        ...(lineIndex === undefined ? {} : {lineIndex}),
        measured,
        limit,
        message,
      });
    };

    const maxCps = options.maxCharactersPerSecond;
    if (maxCps !== undefined && metric.charactersPerSecond > maxCps) {
      addIssue(
        'max-cps',
        metric.charactersPerSecond,
        maxCps,
        'Caption ' + (captionIndex + 1) + ' reads at ' +
          metric.charactersPerSecond.toFixed(1) + ' CPS; configured maximum is ' + maxCps + '.',
      );
    }

    const maxWpm = options.maxWordsPerMinute;
    if (maxWpm !== undefined && metric.wordsPerMinute > maxWpm) {
      addIssue(
        'max-wpm',
        metric.wordsPerMinute,
        maxWpm,
        'Caption ' + (captionIndex + 1) + ' reads at ' +
          metric.wordsPerMinute.toFixed(1) + ' WPM; configured maximum is ' + maxWpm + '.',
      );
    }

    const maxCharsPerLine = options.maxCharactersPerLine;
    if (maxCharsPerLine !== undefined) {
      lines.forEach((line, lineIndex) => {
        const lineCharacters = Array.from(line.trim()).length;
        if (lineCharacters > maxCharsPerLine) {
          addIssue(
            'max-line-characters',
            lineCharacters,
            maxCharsPerLine,
            'Caption ' + (captionIndex + 1) + ', line ' + (lineIndex + 1) +
              ' has ' + lineCharacters + ' characters; configured maximum is ' + maxCharsPerLine + '.',
            lineIndex + 1,
          );
        }
      });
    }

    const maxLines = options.maxLines;
    if (maxLines !== undefined && metric.lineCount > maxLines) {
      addIssue(
        'max-lines',
        metric.lineCount,
        maxLines,
        'Caption ' + (captionIndex + 1) + ' has ' + metric.lineCount +
          ' lines; configured maximum is ' + maxLines + '.',
      );
    }

    const minDurationMs = options.minDurationMs;
    if (minDurationMs !== undefined && durationMs < minDurationMs) {
      addIssue(
        'min-duration',
        durationMs,
        minDurationMs,
        'Caption ' + (captionIndex + 1) + ' stays on screen for ' +
          durationMs.toFixed(0) + ' ms; configured minimum is ' + minDurationMs.toFixed(0) + ' ms.',
      );
    }

    const maxDurationMs = options.maxDurationMs;
    if (maxDurationMs !== undefined && durationMs > maxDurationMs) {
      addIssue(
        'max-duration',
        durationMs,
        maxDurationMs,
        'Caption ' + (captionIndex + 1) + ' stays on screen for ' +
          durationMs.toFixed(0) + ' ms; configured maximum is ' + maxDurationMs.toFixed(0) + ' ms.',
      );
    }
  });

  return {passed: issues.length === 0, metrics, issues};
};
