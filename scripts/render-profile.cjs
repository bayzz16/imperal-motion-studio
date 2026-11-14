'use strict';

const os = require('node:os');
const fs = require('node:fs');

const GIB = 1024 ** 3;

/**
 * Select conservative Remotion render settings from the resources available
 * to the current machine. The scale affects output dimensions, not FPS.
 */
const resolveRenderProfile = ({totalMemoryBytes, freeMemoryBytes, cpuCount}) => {
  for (const [name, value] of Object.entries({totalMemoryBytes, freeMemoryBytes, cpuCount})) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(name + ' must be a positive finite number.');
    }
  }
  if (freeMemoryBytes > totalMemoryBytes) {
    throw new Error('freeMemoryBytes cannot exceed totalMemoryBytes.');
  }
  if (!Number.isInteger(cpuCount)) {
    throw new Error('cpuCount must be an integer.');
  }

  const totalGiB = totalMemoryBytes / GIB;
  const freeGiB = freeMemoryBytes / GIB;

  // Keep the encoded dimensions equal to the composition dimensions. Upscaling
  // the render does not improve vector artwork or scene design.
  const name = 'standard';
  const scale = 1;

  // Reserve at least 4 GiB of free memory per concurrent Chromium renderer.
  const memoryConcurrency = Math.max(1, Math.floor(freeGiB / 4));
  const concurrency = Math.max(1, Math.min(4, cpuCount, memoryConcurrency));

  return {
    name,
    scale,
    concurrency,
    jpegQuality: 90,
    crf: 23,
    totalMemoryGiB: Number(totalGiB.toFixed(2)),
    freeMemoryGiB: Number(freeGiB.toFixed(2)),
    cpuCount,
  };
};

const main = () => {
  const profile = resolveRenderProfile({
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    cpuCount: os.cpus().length,
  });

  console.log('Adaptive render profile: ' + JSON.stringify(profile, null, 2));

  if (process.argv.includes('--github-env')) {
    const envFile = process.env.GITHUB_ENV;
    if (!envFile) {
      throw new Error('--github-env requires the GITHUB_ENV environment variable.');
    }
    const values = [
      ['RENDER_PROFILE_NAME', profile.name],
      ['RENDER_SCALE', profile.scale],
      ['RENDER_CONCURRENCY', profile.concurrency],
      ['RENDER_JPEG_QUALITY', profile.jpegQuality],
      ['RENDER_CRF', profile.crf],
    ];
    fs.appendFileSync(envFile, values.map(([key, value]) => key + '=' + value).join('\n') + '\n');
  }
};

if (require.main === module) {
  main();
}

module.exports = {resolveRenderProfile};
