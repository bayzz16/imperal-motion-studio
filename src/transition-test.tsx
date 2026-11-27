import {Composition, registerRoot} from 'remotion';
import {
  TransitionFixture,
  TRANSITION_FIXTURE_DURATION_IN_FRAMES,
} from './testing/TransitionFixture';

const TransitionTestRoot: React.FC = () => (
  <Composition
    id="TransitionFixture"
    component={TransitionFixture}
    durationInFrames={TRANSITION_FIXTURE_DURATION_IN_FRAMES}
    fps={24}
    width={320}
    height={180}
  />
);

registerRoot(TransitionTestRoot);
