'use strict';

const COLOR_PROFILES = Object.freeze({
  'metadata-only': Object.freeze({description: 'Report metadata completeness and internal consistency without assuming a delivery target.'}),
  'youtube-sdr': Object.freeze({description: 'Compare against YouTube recommended BT.709 SDR upload metadata.'}),
});
const MISSING_VALUES = new Set(['', 'unknown', 'unspecified', 'reserved', 'n/a', 'na', 'none', 'null']);
const BT601_VALUES = new Set(['smpte170m', 'bt470bg', 'bt601-6-525', 'bt601-6-625']);
const BT2020_MATRIX_VALUES = new Set(['bt2020nc', 'bt2020c', 'bt2020_ncl', 'bt2020_cl', 'ictcp']);
const SDR_TRANSFER_VALUES = new Set(['bt709', 'smpte170m', 'bt470m', 'bt470bg', 'gamma22', 'gamma28', 'smpte240m', 'iec61966-2-1', 'iec61966-2-4', 'bt2020-10', 'bt2020-12']);

const normalizeValue = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value).trim().toLowerCase();
  return MISSING_VALUES.has(normalized) ? null : normalized;
};
const normalizeRange = (value) => {
  const normalized = normalizeValue(value);
  if (['tv', 'mpeg', 'limited'].includes(normalized)) return 'tv';
  if (['pc', 'jpeg', 'full'].includes(normalized)) return 'pc';
  return normalized;
};
const getPrimariesFamily = (value) => {
  if (value === 'bt709') return 'bt709';
  if (BT601_VALUES.has(value)) return 'bt601';
  if (value === 'bt2020') return 'bt2020';
  if (['smpte431', 'smpte432'].includes(value)) return 'p3';
  return null;
};
const getMatrixFamily = (value) => {
  if (value === 'bt709') return 'bt709';
  if (BT601_VALUES.has(value)) return 'bt601';
  if (BT2020_MATRIX_VALUES.has(value)) return 'bt2020';
  return null;
};

const analyzeColorMetadata = (stream, profileName = 'metadata-only') => {
  if (!stream || typeof stream !== 'object' || Array.isArray(stream)) {
    throw new TypeError('A video stream metadata object is required.');
  }
  if (!COLOR_PROFILES[profileName]) throw new RangeError('Unsupported color QC profile: ' + profileName);

  const rawBits = Number(stream.bits_per_raw_sample);
  const metadata = {
    pixelFormat: normalizeValue(stream.pix_fmt),
    colorRange: normalizeRange(stream.color_range),
    colorPrimaries: normalizeValue(stream.color_primaries),
    colorTransfer: normalizeValue(stream.color_transfer ?? stream.color_trc),
    colorMatrix: normalizeValue(stream.color_space ?? stream.colorspace),
    bitsPerRawSample: Number.isFinite(rawBits) && rawBits > 0 ? rawBits : null,
  };
  const warnings = [];
  const required = [
    ['colorPrimaries', 'color primaries'],
    ['colorTransfer', 'transfer characteristics'],
    ['colorMatrix', 'matrix coefficients'],
    ['colorRange', 'color range'],
  ];
  for (const [key, label] of required) {
    if (!metadata[key]) warnings.push('Missing or unspecified ' + label + ' metadata.');
  }

  const primariesFamily = getPrimariesFamily(metadata.colorPrimaries);
  const matrixFamily = getMatrixFamily(metadata.colorMatrix);
  if (primariesFamily && matrixFamily && primariesFamily !== matrixFamily) {
    warnings.push('Color primaries and matrix coefficients indicate different families (' +
      primariesFamily + ' vs ' + matrixFamily + '). Review the source tags before delivery.');
  }

  let classification = 'other';
  const {colorPrimaries, colorTransfer, colorMatrix} = metadata;
  if (!colorPrimaries || !colorTransfer || !colorMatrix) {
    classification = 'incomplete';
  } else if (colorTransfer === 'smpte2084') {
    classification = colorPrimaries === 'bt2020' ? 'hdr-pq-bt2020' : 'hdr-pq';
  } else if (colorTransfer === 'arib-std-b67') {
    classification = colorPrimaries === 'bt2020' ? 'hdr-hlg-bt2020' : 'hdr-hlg';
  } else if (colorPrimaries === 'bt709' && colorTransfer === 'bt709' && colorMatrix === 'bt709') {
    classification = 'sdr-bt709';
  } else if (primariesFamily === 'bt601' && matrixFamily === 'bt601') {
    classification = 'sdr-bt601';
  } else if (['bt2020', 'p3'].includes(primariesFamily) && SDR_TRANSFER_VALUES.has(colorTransfer)) {
    classification = 'wide-gamut-sdr';
  }

  if (profileName === 'youtube-sdr') {
    if (classification !== 'sdr-bt709') {
      warnings.push('The selected YouTube SDR profile expects BT.709 primaries, transfer, and matrix; detected ' + classification + '. Confirm the intended SDR/HDR delivery and convert pixels only when the source characteristics are known.');
    }
    if (metadata.colorRange === 'pc') {
      warnings.push('Full-range video detected. YouTube documents conversion of full range to limited range; review the delivery pipeline rather than changing tags alone.');
    }
  }
  return {profile: profileName, classification, status: warnings.length ? 'review' : 'ok', metadata, warnings};
};

module.exports = {COLOR_PROFILES, analyzeColorMetadata};
