'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {resolveRenderProfile} = require('./render-profile.cjs');

const gib = (value) => value * 1024 ** 3;

test('uses standard quality on a constrained machine', () => {
  const profile = resolveRenderProfile({
    totalMemoryBytes: gib(8),
    freeMemoryBytes: gib(3.5),
    cpuCount: 4,
  });
  assert.equal(profile.name, 'standard');
  assert.equal(profile.scale, 1);
  assert.equal(profile.concurrency, 1);
});

test('keeps standard scale even when memory and CPU allow more resources', () => {
  const profile = resolveRenderProfile({
    totalMemoryBytes: gib(8),
    freeMemoryBytes: gib(5),
    cpuCount: 4,
  });
  assert.equal(profile.name, 'standard');
  assert.equal(profile.scale, 1);
  assert.equal(profile.concurrency, 1);
});

test('keeps standard scale on high-resource machines too', () => {
  const high = resolveRenderProfile({
    totalMemoryBytes: gib(16),
    freeMemoryBytes: gib(10),
    cpuCount: 8,
  });
  assert.equal(high.name, 'standard');
  assert.equal(high.scale, 1);
  assert.equal(high.concurrency, 2);

  const ultra = resolveRenderProfile({
    totalMemoryBytes: gib(32),
    freeMemoryBytes: gib(20),
    cpuCount: 12,
  });
  assert.equal(ultra.name, 'standard');
  assert.equal(ultra.scale, 1);
  assert.equal(ultra.concurrency, 4);
});

test('keeps cinematic encoding settings consistent across resource tiers', () => {
  const profile = resolveRenderProfile({
    totalMemoryBytes: gib(16),
    freeMemoryBytes: gib(10),
    cpuCount: 8,
  });
  assert.equal(profile.jpegQuality, 90);
  assert.equal(profile.crf, 23);
});

test('rejects invalid or impossible resource measurements', () => {
  assert.throws(() => resolveRenderProfile({
    totalMemoryBytes: 0,
    freeMemoryBytes: 0,
    cpuCount: 2,
  }), /positive finite number/);
  assert.throws(() => resolveRenderProfile({
    totalMemoryBytes: gib(8),
    freeMemoryBytes: gib(9),
    cpuCount: 2,
  }), /cannot exceed/);
  assert.throws(() => resolveRenderProfile({
    totalMemoryBytes: gib(8),
    freeMemoryBytes: gib(4),
    cpuCount: 2.5,
  }), /integer/);
});
