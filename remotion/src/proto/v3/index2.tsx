import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { UjiBaud2, DURASI } from './UjiBaud2';

registerRoot(() => <Composition id="UjiBaud2" component={UjiBaud2} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURASI * 30)} />);
