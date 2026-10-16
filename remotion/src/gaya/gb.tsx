// Kit guidebook motion graphics 1Hertz (16 Okt 2026).
// Kerangka dengan judul kinetik + HUD, adegan dengan dorongan kamera, layar hantaman,
// motif sinyal 1 Hz, kursor, grain, dan penjadwal SFX.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, Easing, staticFile, useVideoConfig } from 'remotion';
import { K, SANS, MONO, naik, jendela, w, Warna, AdeganSub, Subtitle } from './pustaka';

export const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/* ---------------- judul bab kinetik (kata per kata) ---------------- */
export type Bab = { a: number; b: number; l1: string; l2: string; warna: Warna };

const BarisKinetik: React.FC<{ t: number; a: number; teks: string; warna: string; tunda: number }> = ({ t, a, teks, warna, tunda }) => (
  <div style={{ fontSize: 72, fontWeight: 800, color: warna, letterSpacing: -1.5, lineHeight: 1.08, whiteSpace: 'nowrap' }}>
    {teks.split(' ').map((kata, i) => {
      const k = a === 0 && i === 0 && tunda === 0 ? 1 : naik(t, a + tunda + i * 0.09, 0.28);
      return (
        <span key={i} style={{ display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 18}px)`, marginRight: 18 }}>
          {kata}
        </span>
      );
    })}
  </div>
);

/* ---------------- kerangka ---------------- */
export const Kerangka3: React.FC<{ t: number; tag: string; bab: Bab[]; adegan: AdeganSub[]; sumber?: string; hud?: string; subtitle?: React.ReactNode; children: React.ReactNode }> = ({
  t,
  tag,
  bab,
  adegan,
  sumber = 'ILUSTRASI',
  hud = 'CH1',
  subtitle,
  children,
}) => {
  const detik = `00:${String(Math.floor(t)).padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;
  return (
    <AbsoluteFill style={{ backgroundColor: K.bg, fontFamily: SANS }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(140,200,230,0.10) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 38% at 50% 45%, rgba(79,227,236,0.07), transparent 70%)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.55))' }} />
      <div style={{ position: 'absolute', top: 64, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: K.bg, background: K.cyan, borderRadius: 999, padding: '8px 20px' }}>{tag}</div>
        <div style={{ fontFamily: MONO, fontSize: 24, color: '#5D6B78' }}>@1hertz_lab</div>
      </div>
      {bab.map((j, i) => {
        const keluar = interpolate(t, [j.b - 0.2, j.b], [1, 0], C);
        if (t < j.a || t > j.b) return null;
        const n1 = j.l1.split(' ').length;
        return (
          <div key={i} style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: keluar }}>
            <BarisKinetik t={t} a={j.a} teks={j.l1} warna={K.text} tunda={0} />
            <BarisKinetik t={t} a={j.a} teks={j.l2} warna={w(j.warna)} tunda={n1 * 0.09 + 0.05} />
          </div>
        );
      })}
      {/* HUD panggung */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <g stroke="#4FE3EC" strokeOpacity={0.35} strokeWidth={2} fill="none">
          <path d="M28,380 v-30 h30 M1052,380 v-30 h-30 M28,1380 v30 h30 M1052,1380 v30 h-30" />
        </g>
        <text x={66} y={372} fontFamily={MONO} fontSize={20} letterSpacing={3} fill="#4FE3EC" fillOpacity={0.45}>{hud}</text>
        <text x={1014} y={1404} textAnchor="end" fontFamily={MONO} fontSize={20} letterSpacing={2} fill="#4FE3EC" fillOpacity={0.45}>{detik}</text>
      </svg>
      <div style={{ position: 'absolute', top: 350, left: 0, width: 1080, height: 1060 }}>{children}</div>
      <div style={{ position: 'absolute', top: 1400, width: '100%', textAlign: 'center', fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: '#4A5763' }}>{sumber}</div>
      {subtitle ?? <Subtitle t={t} adegan={adegan} />}
    </AbsoluteFill>
  );
};

/* ---------------- adegan: transisi + dorongan kamera pelan ---------------- */
export type JenisTransisi = 'zoom' | 'dorong' | 'pudar';
export const Adegan3: React.FC<{ t: number; a: number; b: number; masukDari?: JenisTransisi; children: React.ReactNode; asal?: string }> = ({
  t,
  a,
  b,
  masukDari = 'zoom',
  asal = '540px 520px',
  children,
}) => {
  if (t < a || t > b) return null;
  const masuk = a === 0 ? 1 : naik(t, a, 0.35);
  const keluar = interpolate(t, [b - 0.3, b], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const op = Math.min(masuk, 1 - keluar);
  if (op <= 0) return null;
  const dorongan = 1 + 0.04 * interpolate(t, [a, b], [0, 1], C);
  let tf = '';
  if (masukDari === 'zoom') tf = `scale(${(0.93 + 0.07 * masuk) * (1 + 0.12 * keluar) * dorongan})`;
  if (masukDari === 'dorong') tf = `translateX(${(1 - masuk) * 260 - keluar * 260}px) scale(${dorongan})`;
  if (masukDari === 'pudar') tf = `scale(${dorongan})`;
  const blur = (1 - masuk) * 8 + keluar * 8;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op, transform: tf, transformOrigin: asal, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>{children}</div>
  );
};

/* ---------------- layar hantaman (seluruh layar) ---------------- */
export const Hantaman: React.FC<{ t: number; a: number; b: number; kata: string; warna?: 'cyan' | 'amber' }> = ({ t, a, b, kata, warna = 'cyan' }) => {
  if (t < a || t >= b) return null;
  const s = interpolate(t, [a, a + 0.16], [1.15, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const getar = t - a < 0.12 ? Math.sin((t - a) * 120) * 6 : 0;
  return (
    <AbsoluteFill style={{ background: warna === 'cyan' ? K.cyan : K.amber, alignItems: 'center', justifyContent: 'center' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(12,17,23,0.10) 2px, transparent 2.2px)', backgroundSize: '36px 36px' }} />
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: kata.length > 6 ? 200 : 260, letterSpacing: -6, color: K.bg, transform: `translateX(${getar}px) scale(${s})` }}>{kata}</div>
      <div style={{ position: 'absolute', bottom: 520, fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: K.bg, opacity: 0.6 }}>1HERTZ</div>
    </AbsoluteFill>
  );
};

/* ---------------- motif sinyal 1 Hz (pembuka / penutup) ---------------- */
/** garis sinyal di tengah panggung; pulsa = waktu pulsa naik; kelihatan = opasitas */
export const Sinyal: React.FC<{ t: number; pulsa: number; kelihatan: number; y?: number }> = ({ t, pulsa, kelihatan, y = 880 }) => {
  if (kelihatan <= 0) return null;
  const d = t - pulsa;
  const tinggi = d < 0 ? 0 : d < 0.08 ? (d / 0.08) * 140 : d < 0.22 ? 140 : d < 0.3 ? 140 * (1 - (d - 0.22) / 0.08) : 0;
  const x0 = 540 - 70;
  const geser = (t * 220) % 72;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: kelihatan }}>
      <defs>
        <filter id="pendarSinyal" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line x1={0} y1={y + 2} x2={1080} y2={y + 2} stroke="#4FE3EC" strokeOpacity={0.12} strokeWidth={1} strokeDasharray="2 70" strokeDashoffset={-geser} />
      <path d={`M0,${y} H${x0} V${y - tinggi} H${x0 + 140} V${y} H1080`} fill="none" stroke={K.cyan} strokeWidth={5} strokeLinejoin="round" filter="url(#pendarSinyal)" />
    </svg>
  );
};

/* ---------------- kursor ---------------- */
export const Kursor: React.FC<{ x: number; y: number; klik?: number; t: number; kelihatan?: number }> = ({ x, y, klik = -9, t, kelihatan = 1 }) => {
  const d = t - klik;
  const tekan = d >= 0 && d < 0.18 ? 0.86 : 1;
  return (
    <g transform={`translate(${x},${y})`} opacity={kelihatan}>
      {d >= 0 && d < 0.45 && <circle r={18 + d * 120} fill="none" stroke={K.cyan} strokeWidth={4 * (1 - d / 0.45)} opacity={1 - d / 0.45} />}
      <g transform={`scale(${1.3 * tekan})`}>
        <path d="M0,0 L0,34 L9,26 L16,41 L22,38 L15,24 L27,24 Z" fill="#fff" stroke="#0C1117" strokeWidth={2.5} strokeLinejoin="round" />
      </g>
    </g>
  );
};

/* ---------------- grain halus ---------------- */
export const Grain: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.045, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 7} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

/* ---------------- SFX ---------------- */
export type Bunyi = { t: number; f: 'beep' | 'buzz' | 'ding' | 'glitch' | 'impact' | 'klik' | 'pop' | 'riser' | 'whoosh'; v?: number };
export const Sfx: React.FC<{ daftar: Bunyi[]; musik?: number }> = ({ daftar, musik = 0.16 }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {musik > 0 && <Audio src={staticFile('musik/bed-1hertz.wav')} volume={musik} loop />}
      {daftar.map((b, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(b.t * fps))} durationInFrames={Math.round(2.5 * fps)}>
          <Audio src={staticFile(`sfx/${b.f}.wav`)} volume={b.v ?? 0.5} />
        </Sequence>
      ))}
    </>
  );
};

export { jendela };
