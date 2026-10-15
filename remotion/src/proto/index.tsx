import { registerRoot } from 'remotion';
import React from 'react';
import { Composition } from 'remotion';
import { PrototipeV2, DURASI } from './PrototipeV2';

const Root: React.FC = () => (
  <Composition
    id="PrototipeV2"
    component={PrototipeV2}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={Math.round(DURASI * 30)}
  />
);

registerRoot(Root);
