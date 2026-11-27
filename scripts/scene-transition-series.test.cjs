'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const ts = require('typescript');

const root = path.join(__dirname, '..');

const loadTypeScriptModule = (filePath, overrides = {}) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(errors.length, 0, path.basename(filePath) + ' should transpile without errors');

  const loaded = {exports: {}};
  const localRequire = (specifier) => {
    if (Object.prototype.hasOwnProperty.call(overrides, specifier)) {
      return overrides[specifier];
    }

    return require(specifier);
  };
  const execute = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    compiled.outputText,
  );
  execute(loaded.exports, localRequire, loaded, filePath, path.dirname(filePath));
  return loaded.exports;
};

const timelineModule = loadTypeScriptModule(
  path.join(root, 'src', 'timeline', 'scene-timeline.ts'),
);

const planModule = loadTypeScriptModule(
  path.join(root, 'src', 'transitions', 'scene-transition-plan.ts'),
  {'../timeline/scene-timeline': timelineModule},
);

const createTransitionMocks = () => {
  const calls = {linear: [], spring: []};

  const Sequence = ({children, name, durationInFrames}) =>
    React.createElement(
      'section',
      {
        'data-kind': 'scene',
        'data-name': name,
        'data-duration': durationInFrames,
      },
      children,
    );

  const Transition = ({timing, presentation}) =>
    React.createElement('i', {
      'data-kind': 'transition',
      'data-preset': presentation.preset,
      'data-direction': presentation.direction ?? 'none',
      'data-timing': timing.kind,
      'data-duration': timing.durationInFrames,
    });

  const TransitionSeries = ({children, name}) =>
    React.createElement('main', {'data-series-name': name}, children);

  TransitionSeries.Sequence = Sequence;
  TransitionSeries.Transition = Transition;

  const timingModule = {
    TransitionSeries,
    linearTiming: (options) => {
      calls.linear.push(options);
      return {kind: 'linear', ...options};
    },
    springTiming: (options) => {
      calls.spring.push(options);
      return {kind: 'spring', ...options};
    },
  };

  const presentationModule = (preset) => ({
    [preset]: (options = {}) => ({
      preset,
      direction: options.direction,
      options,
    }),
  });

  return {
    calls,
    transitions: timingModule,
    fade: presentationModule('fade'),
    slide: presentationModule('slide'),
    wipe: presentationModule('wipe'),
    flip: presentationModule('flip'),
  };
};

const mocks = createTransitionMocks();
const transitionModule = loadTypeScriptModule(
  path.join(root, 'src', 'transitions', 'SceneTransitionSeries.tsx'),
  {
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@remotion/transitions': mocks.transitions,
    '@remotion/transitions/fade': mocks.fade,
    '@remotion/transitions/slide': mocks.slide,
    '@remotion/transitions/wipe': mocks.wipe,
    '@remotion/transitions/flip': mocks.flip,
    './scene-transition-plan': planModule,
  },
);
const {SceneTransitionSeries} = transitionModule;

const makeScene = (id, options = {}) => ({
  id,
  durationInFrames: 48,
  children: React.createElement('div', {'data-scene-content': id}, id),
  ...options,
});

const renderSeries = (scenes, name = 'Integration test') =>
  renderToStaticMarkup(React.createElement(SceneTransitionSeries, {scenes, name}));

const readAttributes = (markup, tagName) =>
  [...markup.matchAll(new RegExp('<' + tagName + '\\b[^>]*>', 'g'))].map((match) => {
    const tag = match[0];
    const attributes = {};
    for (const [, key, value] of tag.matchAll(/([a-z-]+)="([^"]*)"/g)) {
      attributes[key] = value;
    }
    return attributes;
  });

test('adapter renders all four presentation mappings in scene order', () => {
  const scenes = [
    makeScene('fade', {transitionAfterFrames: 12, transitionPreset: 'fade'}),
    makeScene('slide', {
      transitionAfterFrames: 12,
      transitionPreset: 'slide',
      transitionDirection: 'from-right',
    }),
    makeScene('wipe', {
      transitionAfterFrames: 12,
      transitionPreset: 'wipe',
      transitionDirection: 'from-top',
    }),
    makeScene('flip', {
      transitionAfterFrames: 12,
      transitionPreset: 'flip',
      transitionDirection: 'from-bottom',
    }),
    makeScene('end'),
  ];

  const markup = renderSeries(scenes, 'Four preset fixture');
  const sceneTags = readAttributes(markup, 'section');
  const transitionTags = readAttributes(markup, 'i');

  assert.match(markup, /data-series-name="Four preset fixture"/);
  assert.deepEqual(sceneTags.map((tag) => tag['data-name']), [
    'fade',
    'slide',
    'wipe',
    'flip',
    'end',
  ]);
  assert.deepEqual(sceneTags.map((tag) => tag['data-duration']), [
    '48',
    '48',
    '48',
    '48',
    '48',
  ]);
  assert.deepEqual(transitionTags.map((tag) => tag['data-preset']), [
    'fade',
    'slide',
    'wipe',
    'flip',
  ]);
  assert.deepEqual(transitionTags.map((tag) => tag['data-duration']), [
    '12',
    '12',
    '12',
    '12',
  ]);
  assert.deepEqual(transitionTags.map((tag) => tag['data-direction']), [
    'none',
    'from-right',
    'from-top',
    'from-bottom',
  ]);
  assert.equal((markup.match(/data-scene-content=/g) ?? []).length, 5);
});

test('adapter defaults requested transitions to a linear two-sided fade', () => {
  const markup = renderSeries([
    makeScene('opening', {transitionAfterFrames: 6}),
    makeScene('ending'),
  ]);
  const [transition] = readAttributes(markup, 'i');

  assert.equal(transition['data-preset'], 'fade');
  assert.equal(transition['data-timing'], 'linear');
  assert.equal(transition['data-duration'], '6');
});

test('adapter forwards the documented spring timing configuration', () => {
  const durationInFrames = 9;
  const markup = renderSeries([
    makeScene('opening', {
      transitionAfterFrames: durationInFrames,
      transitionTiming: 'spring',
      transitionPreset: 'flip',
    }),
    makeScene('ending'),
  ]);
  const [transition] = readAttributes(markup, 'i');

  assert.equal(transition['data-timing'], 'spring');
  assert.equal(transition['data-duration'], String(durationInFrames));
  assert.deepEqual(mocks.calls.spring.at(-1), {
    config: {damping: 200},
    durationInFrames,
    durationRestThreshold: 0.001,
  });
});

test('adapter preserves hard cuts when no transition is requested', () => {
  const markup = renderSeries([
    makeScene('first'),
    makeScene('second'),
  ]);

  assert.equal(readAttributes(markup, 'section').length, 2);
  assert.equal(readAttributes(markup, 'i').length, 0);
});

test('standalone fixture uses five scenes and computes the overlap-adjusted duration', () => {
  const fixtureModule = loadTypeScriptModule(
    path.join(root, 'src', 'testing', 'TransitionFixture.tsx'),
    {
      'react/jsx-runtime': require('react/jsx-runtime'),
      remotion: {
        AbsoluteFill: ({children}) => React.createElement('div', null, children),
      },
      '../transitions': {SceneTransitionSeries: () => null},
      '../timeline/scene-timeline': timelineModule,
    },
  );

  assert.equal(fixtureModule.TRANSITION_FIXTURE_SCENES.length, 5);
  assert.equal(fixtureModule.TRANSITION_FIXTURE_DURATION_IN_FRAMES, 192);
  assert.deepEqual(
    fixtureModule.TRANSITION_FIXTURE_SCENES
      .slice(0, 4)
      .map((scene) => scene.transitionPreset),
    ['fade', 'slide', 'wipe', 'flip'],
  );
});
