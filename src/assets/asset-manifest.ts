export type AssetOrigin = 'original' | 'third-party' | 'generated';
export type AssetMediaType = 'image' | 'audio' | 'video' | 'font' | 'model' | 'document' | 'other';
export type RightsReviewStatus = 'reviewed' | 'pending' | 'blocked';

export type AssetManifest = {
  schemaVersion: 1;
  projectId: string;
  assets: Array<{
    id: string;
    path: string;
    mediaType: AssetMediaType;
    source: {
      kind: AssetOrigin;
      title?: string;
      creator?: string;
      url?: string;
      toolName?: string;
      toolVersion?: string;
    };
    rights: {
      reviewStatus: RightsReviewStatus;
      licenseExpression?: string;
      licenseUrl?: string;
      licenseTextPath?: string;
      attribution?: string;
      copyrightNotice?: string;
      modified?: boolean;
      modificationNotice?: string;
      reviewNote?: string;
    };
  }>;
};

export type AssetManifestIssue = {code: string; path: string; message: string};
export type AssetManifestValidation = {
  valid: boolean;
  errors: AssetManifestIssue[];
  warnings: AssetManifestIssue[];
};
export type AssetManifestValidationOptions = {expectedProjectId?: string; releaseReady?: boolean};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isHttpsUrl = (value: unknown): value is string => {
  if (!isText(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0;
  } catch {
    return false;
  }
};

/** Normalized POSIX path relative to a single project's workspace root. */
export const isSafeRelativeAssetPath = (value: unknown): value is string => {
  if (!isText(value) || value !== value.trim() || /[\\\0:]/.test(value) || value.startsWith('/') || /^[A-Za-z]:/.test(value)) {
    return false;
  }
  return value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..');
};

const isLicenseId = (token: string): boolean => {
  if (/^(?:DocumentRef-[A-Za-z0-9][A-Za-z0-9.-]*:)?LicenseRef-[A-Za-z0-9][A-Za-z0-9.-]*$/.test(token)) return true;
  if (token.startsWith('LicenseRef-') || token.startsWith('DocumentRef-')) return false;
  return /^[A-Za-z0-9][A-Za-z0-9.-]*\+?$/.test(token);
};

/** SPDX 2.x/3.0.1 expression grammar check; does not verify canonical IDs or legal terms. */
export const hasValidSpdxExpressionSyntax = (value: unknown): value is string => {
  if (!isText(value) || /[\r\n]/.test(value)) return false;
  const tokens: string[] = [];
  let cursor = 0;
  while (cursor < value.length) {
    if (/\s/.test(value[cursor])) { cursor += 1; continue; }
    const rest = value.slice(cursor);
    const punctuation = /^[()]/.exec(rest);
    const operator = /^(AND|OR|WITH|and|or|with)(?=\s|\(|\)|$)/.exec(rest);
    const identifier = /^(?:(?:DocumentRef-[A-Za-z0-9][A-Za-z0-9.-]*:)?LicenseRef-[A-Za-z0-9][A-Za-z0-9.-]*|[A-Za-z0-9][A-Za-z0-9.-]*\+?)/.exec(rest);
    const match = punctuation || operator || identifier;
    if (!match) return false;
    tokens.push(match[0]);
    cursor += match[0].length;
  }
  let index = 0;
  let lastPrimaryWasSimple = false;
  const op = (token: string | undefined, name: string) => token === name || token === name.toLowerCase();
  const primary = (): boolean => {
    if (tokens[index] === '(') {
      index += 1;
      if (!parseOr() || tokens[index] !== ')') return false;
      index += 1;
      lastPrimaryWasSimple = false;
      return true;
    }
    const token = tokens[index];
    if (!token || !isLicenseId(token) || ['AND', 'OR', 'WITH'].some((name) => op(token, name))) return false;
    index += 1;
    lastPrimaryWasSimple = true;
    return true;
  };
  const withExpr = (): boolean => {
    if (!primary()) return false;
    if (op(tokens[index], 'WITH')) {
      if (!lastPrimaryWasSimple) return false;
      index += 1;
      const exception = tokens[index];
      if (!exception || !isLicenseId(exception) || ['AND', 'OR', 'WITH'].some((name) => op(exception, name))) return false;
      index += 1;
    }
    return true;
  };
  const parseAnd = (): boolean => {
    if (!withExpr()) return false;
    while (op(tokens[index], 'AND')) { index += 1; if (!withExpr()) return false; }
    return true;
  };
  function parseOr(): boolean {
    if (!parseAnd()) return false;
    while (op(tokens[index], 'OR')) { index += 1; if (!parseAnd()) return false; }
    return true;
  }
  return tokens.length > 0 && parseOr() && index === tokens.length;
};

const mediaTypes = ['image', 'audio', 'video', 'font', 'model', 'document', 'other'];
const origins = ['original', 'third-party', 'generated'];
const reviewStatuses = ['reviewed', 'pending', 'blocked'];

export const validateAssetManifest = (
  input: unknown,
  options: AssetManifestValidationOptions = {},
): AssetManifestValidation => {
  const errors: AssetManifestIssue[] = [];
  const warnings: AssetManifestIssue[] = [];
  const error = (code: string, path: string, message: string) => errors.push({code, path, message});
  const warn = (code: string, path: string, message: string) => warnings.push({code, path, message});
  if (!isRecord(input)) {
    error('manifest.invalid', '$', 'Manifest must be a JSON object.');
    return {valid: false, errors, warnings};
  }
  if (input.schemaVersion !== 1) error('manifest.schema-version', 'schemaVersion', 'schemaVersion must be 1.');
  if (!isText(input.projectId) || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(input.projectId)) {
    error('manifest.project-id', 'projectId', 'projectId must be a 1–64 character alphanumeric ID with hyphens or underscores.');
  } else if (options.expectedProjectId && input.projectId !== options.expectedProjectId) {
    error('manifest.project-mismatch', 'projectId', 'Manifest projectId does not match its workspace folder.');
  }
  if (!Array.isArray(input.assets)) {
    error('manifest.assets', 'assets', 'assets must be an array.');
    return {valid: false, errors, warnings};
  }

  const ids = new Set<string>();
  const paths = new Set<string>();
  input.assets.forEach((asset, index) => {
    const base = 'assets[' + index + ']';
    if (!isRecord(asset)) { error('asset.invalid', base, 'Asset entry must be an object.'); return; }
    if (!isText(asset.id) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(asset.id)) {
      error('asset.id', base + '.id', 'Asset id must be a 1–96 character identifier.');
    } else if (ids.has(asset.id)) error('asset.duplicate-id', base + '.id', 'Duplicate asset id: ' + asset.id + '.');
    else ids.add(asset.id);

    if (!isSafeRelativeAssetPath(asset.path)) error('asset.path', base + '.path', 'Asset path must be a normalized relative POSIX path without traversal or drive prefixes.');
    else if (paths.has(asset.path.toLowerCase())) error('asset.duplicate-path', base + '.path', 'Asset path duplicates another path (case-insensitive).');
    else paths.add(asset.path.toLowerCase());
    if (!mediaTypes.includes(String(asset.mediaType))) error('asset.media-type', base + '.mediaType', 'mediaType must be one of: ' + mediaTypes.join(', ') + '.');

    if (!isRecord(asset.source)) { error('asset.source', base + '.source', 'source must be an object.'); return; }
    const source = asset.source;
    if (!origins.includes(String(source.kind))) error('asset.origin', base + '.source.kind', 'source.kind must be one of: ' + origins.join(', ') + '.');
    if (source.kind === 'original' && !isText(source.creator)) error('asset.creator-required', base + '.source.creator', 'Original assets require a creator or responsible project member.');
    if (source.kind === 'third-party') {
      if (!isHttpsUrl(source.url)) error('asset.source-url', base + '.source.url', 'Third-party assets require an absolute HTTPS source URL.');
      if (!isText(source.creator)) warn('asset.creator-missing', base + '.source.creator', 'Creator/attribution party is not recorded; check the source notices.');
    } else if (source.url !== undefined && !isHttpsUrl(source.url)) {
      error('asset.source-url-format', base + '.source.url', 'source.url must be an absolute HTTPS URL when supplied.');
    }
    if (source.kind === 'generated' && !isText(source.toolName)) error('asset.tool-required', base + '.source.toolName', 'Generated assets require the generating tool/service name.');

    if (!isRecord(asset.rights)) { error('asset.rights', base + '.rights', 'rights must be an object.'); return; }
    const rights = asset.rights;
    if (!reviewStatuses.includes(String(rights.reviewStatus))) error('asset.review-status', base + '.rights.reviewStatus', 'reviewStatus must be one of: ' + reviewStatuses.join(', ') + '.');
    else if (rights.reviewStatus === 'blocked') error('asset.blocked', base + '.rights.reviewStatus', 'Blocked assets must not be used in a release.');
    else if (rights.reviewStatus === 'pending') {
      const message = 'Rights review is pending; metadata is not release clearance.';
      if (options.releaseReady) error('asset.review-pending', base + '.rights.reviewStatus', message);
      else warn('asset.review-pending', base + '.rights.reviewStatus', message);
    }

    if (rights.licenseExpression !== undefined && !hasValidSpdxExpressionSyntax(rights.licenseExpression)) {
      error('asset.license-expression', base + '.rights.licenseExpression', 'Invalid SPDX expression syntax; identifier existence is not checked.');
    }
    if (rights.licenseUrl !== undefined && !isHttpsUrl(rights.licenseUrl)) error('asset.license-url', base + '.rights.licenseUrl', 'licenseUrl must be an absolute HTTPS URL.');
    if (rights.licenseTextPath !== undefined && !isSafeRelativeAssetPath(rights.licenseTextPath)) error('asset.license-text-path', base + '.rights.licenseTextPath', 'licenseTextPath must be a safe project-relative POSIX path.');
    if (source.kind === 'third-party') {
      if (!isText(rights.licenseExpression)) error('asset.license-required', base + '.rights.licenseExpression', 'Third-party assets require a declared license expression.');
      if (!isHttpsUrl(rights.licenseUrl) && !isSafeRelativeAssetPath(rights.licenseTextPath)) error('asset.license-reference-required', base + '.rights', 'Provide an HTTPS license URL or project-local license text.');
      if (!isText(rights.attribution)) warn('asset.attribution-missing', base + '.rights.attribution', 'Prepared attribution is missing; preserve all notices required by the source license.');
    }
    if (source.kind === 'generated' && rights.reviewStatus === 'reviewed') {
      if (!isText(rights.licenseExpression)) error('asset.generated-license-required', base + '.rights.licenseExpression', 'Reviewed generated assets require a recorded license/terms expression.');
      if (!isHttpsUrl(rights.licenseUrl) && !isSafeRelativeAssetPath(rights.licenseTextPath)) error('asset.generated-license-reference', base + '.rights', 'Reviewed generated assets require a terms URL or local terms file.');
    }
    if (rights.modified !== undefined && typeof rights.modified !== 'boolean') error('asset.modified', base + '.rights.modified', 'modified must be a boolean.');
    else if (rights.modified === true && !isText(rights.modificationNotice)) warn('asset.modification-notice-missing', base + '.rights.modificationNotice', 'Modified asset has no modification notice recorded.');
  });
  return {valid: errors.length === 0, errors, warnings};
};
