// Prototipe 15 dtk: tata bahasa motion graphic v3 (tanpa VO, hanya SFX). Terpisah dari produksi.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { LatarHidup, Seg, Slam, Hitung, Alur, Ketik, Ungkap, HURUF, C } from './gaya/mg';
import { Grain, Sfx, Bunyi } from './gaya/gb';
import { K, MONO } from './gaya/pustaka';

const S = { slam1: 0, hitung: 1.3, alur: 3.7, slam2: 6.2, ketik: 7.3, slam3: 11.2, ungkap: 12.4, akhir: 15 };

const SFX: Bunyi[] = [
  { t: 0.05, f: 'impact', v: 0.7 }, { t: 1.2, f: 'whoosh', v: 0.5 }, { t: 1.9, f: 'beep', v: 0.35 }, { t: 2.9, f: 'beep', v: 0.35 },
  { t: 3.6, f: 'whoosh', v: 0.5 }, { t: 4.9, f: 'glitch', v: 0.5 }, { t: 6.1, f: 'whoosh', v: 0.5 }, { t: 6.25, f: 'impact', v: 0.7 },
  { t: 7.2, f: 'whoosh', v: 0.45 }, { t: 8.0, f: 'klik', v: 0.3 }, { t: 9.0, f: 'klik', v: 0.3 }, { t: 10.2, f: 'ding', v: 0.5 },
  { t: 11.1, f: 'whoosh', v: 0.5 }, { t: 11.25, f: 'impact', v: 0.7 }, { t: 11.6, f: 'riser', v: 0.5 }, { t: 12.9, f: 'pop', v: 0.5 },
];

export const Proto15: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: '#05080C', overflow: 'hidden' }}>
      <LatarHidup t={t} />
      <Seg t={t} a={S.slam1} b={S.hitung} awal><Slam t={t} a={S.slam1} baris={['HURUF', 'ANEH?']} sampahLatar /></Seg>
      <Seg t={t} a={S.hitung} b={S.alur}><Hitung t={t} a={S.hitung} /></Seg>
      <Seg t={t} a={S.alur} b={S.slam2}><Alur t={t} a={S.alur} /></Seg>
      <Seg t={t} a={S.slam2} b={S.ketik}><Slam t={t} a={S.slam2} baris={['BEDA', 'KECEPATAN.']} /></Seg>
      <Seg t={t} a={S.ketik} b={S.slam3}><Ketik t={t} a={S.ketik} /></Seg>
      <Seg t={t} a={S.slam3} b={S.ungkap}><Slam t={t} a={S.slam3} baris={['SAMAKAN.']} /></Seg>
      <Seg t={t} a={S.ungkap} b={S.akhir} akhir><Ungkap t={t} a={S.ungkap} teaser="ESP32 restart sendiri?" /></Seg>
      <div style={{ position: 'absolute', top: 120, left: 60, fontFamily: MONO, fontSize: 30, letterSpacing: 4, color: K.cyan ?? '#22D3EE', opacity: 0.8 }}>1HERTZ · SERIAL</div>
      <Grain frame={frame} />
      <Sfx daftar={SFX} musik={0} />
    </AbsoluteFill>
  );
};
