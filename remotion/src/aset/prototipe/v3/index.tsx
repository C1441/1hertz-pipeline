import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { UjiBaud, DURASI } from './UjiBaud';

registerRoot(() => <Composition id="UjiBaud" component={UjiBaud} width={1080} height={1920} fps={30} durationInFrames={Math.round(DURASI * 30)} />);
