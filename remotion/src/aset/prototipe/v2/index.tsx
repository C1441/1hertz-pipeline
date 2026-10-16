import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { UjiPortCOM, DURASI } from './UjiPortCOM';

registerRoot(() => (
  <Composition id="UjiPortCOM" component={UjiPortCOM} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURASI * 30)} />
));
