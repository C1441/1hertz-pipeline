import React from 'react';
import { Composition } from 'remotion';
import { Short1Hertz } from './Short1Hertz';
import contoh from './contoh-konten.json';

export const FPS = 30;

export const Root: React.FC = () => {
  return (
    <Composition
      id="Short1Hertz"
      component={Short1Hertz}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={FPS * 38}
      defaultProps={{ konten: contoh as any }}
      calculateMetadata={({ props }) => {
        const adegan = (props.konten as any)?.adegan ?? [];
        const akhir = adegan.length ? adegan[adegan.length - 1].selesai : 38;
        return { durationInFrames: Math.max(1, Math.round(akhir * FPS)) };
      }}
    />
  );
};
