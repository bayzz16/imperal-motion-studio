import React from 'react';
import {Composition} from 'remotion';
import {TunasKecil} from './TunasKecil';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="TunasKecil"
        component={TunasKecil}
        durationInFrames={2700}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
