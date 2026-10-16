import React from 'react';
import { Composition } from 'remotion';
import { Short1Hertz } from './Short1Hertz';
import { Short1Hertz as Short1HertzLama } from './aset/template-lama/Short1Hertz';
import contoh from './contoh-konten.json';

export const FPS = 30;

const metadata = ({ props }: { props: any }) => {
  const adegan = (props.konten as any)?.adegan ?? [];
  const akhir = adegan.length ? adegan[adegan.length - 1].selesai : 38;
  return { durationInFrames: Math.max(1, Math.round(akhir * FPS)) };
};

export const Root: React.FC = () => {
  return (
    <>
      {/* Template aktif: gaya guidebook motion graphics (16 Okt 2026) */}
      <Composition
        id="Short1Hertz"
        component={Short1Hertz}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={FPS * 38}
        defaultProps={{ konten: contoh as any }}
        calculateMetadata={metadata}
      />
      {/* Template lama (arsip), tidak dipakai pipeline */}
      <Composition
        id="Short1HertzLama"
        component={Short1HertzLama}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={FPS * 38}
        defaultProps={{ konten: contoh as any }}
        calculateMetadata={metadata}
      />
    </>
  );
};
