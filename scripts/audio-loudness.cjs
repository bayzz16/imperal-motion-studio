'use strict';

const EBU_R128_REFERENCE = Object.freeze({
  integratedLufs: -23,
  maximumTruePeakDbtp: -1,
});

const parseFiniteMetric = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Parse the input measurements emitted by FFmpeg's loudnorm filter.
 * The filter is used against a null output, so these values describe the
 * rendered input and do not modify the delivered MP4.
 */
const parseLoudnormStats = (log) => {
  if (typeof log !== 'string') return null;
  const marker = log.lastIndexOf('"input_i"');
  if (marker < 0) return null;

  const start = log.lastIndexOf('{', marker);
  const end = log.indexOf('}', marker);
  if (start < 0 || end < 0) return null;

  let stats;
  try {
    stats = JSON.parse(log.slice(start, end + 1));
  } catch {
    return null;
  }

  const expectedKeys = ['input_i', 'input_tp', 'input_lra', 'input_thresh'];
  if (!expectedKeys.some((key) => Object.hasOwn(stats, key))) return null;

  return {
    integratedLufs: parseFiniteMetric(stats.input_i),
    truePeakDbtp: parseFiniteMetric(stats.input_tp),
    loudnessRangeLu: parseFiniteMetric(stats.input_lra),
    thresholdLufs: parseFiniteMetric(stats.input_thresh),
  };
};

/**
 * FFmpeg emits EBU R128 input statistics while processing the null output.
 * The chosen output targets are reference values only; no output file is made.
 */
const buildLoudnormMeasurementFilter = () =>
  'loudnorm=I=-23:LRA=7:TP=-1:print_format=json';

const compareWithEbuR128Reference = (metrics) => {
  const integratedLufs = parseFiniteMetric(metrics?.integratedLufs);
  const truePeakDbtp = parseFiniteMetric(metrics?.truePeakDbtp);

  return {
    integratedTargetLufs: EBU_R128_REFERENCE.integratedLufs,
    integratedDeltaLufs: integratedLufs === null
      ? null
      : Number((integratedLufs - EBU_R128_REFERENCE.integratedLufs).toFixed(2)),
    maximumTruePeakDbtp: EBU_R128_REFERENCE.maximumTruePeakDbtp,
    truePeakWithinReference: truePeakDbtp === null
      ? null
      : truePeakDbtp <= EBU_R128_REFERENCE.maximumTruePeakDbtp,
  };
};

module.exports = {
  EBU_R128_REFERENCE,
  parseFiniteMetric,
  parseLoudnormStats,
  buildLoudnormMeasurementFilter,
  compareWithEbuR128Reference,
};
