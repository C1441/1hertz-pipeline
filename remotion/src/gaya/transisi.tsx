// Mesin transisi 1Hertz — transisi ekstrem tapi tetap nyaman (8–12 frame, ease kuat).
import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';
import { K, SANS, MONO } from './pustaka';
import { C } from './gb';
import { ukuranPas } from './ukur';

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const acak = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type Masuk = 'langsung' | 'zoomMundur' | 'sapuan' | 'titik' | 'zoomMasuk' | 'tampar' | 'balik';
export type Keluar = 'tidak' | 'glitch' | 'sapuan' | 'runtuh' | 'zoomTembus' | 'terdorong' | 'balik';

/** blur searah (SVG filter dipakai lewat CSS) */
const FilterBlur: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} />
    </filter>
  </svg>
);
const FilterWarna: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <filter id="tintMerah">
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
    </filter>
    <filter id="tintCyan">
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
    </filter>
  </svg>
);

/**
 * Satu adegan dengan transisi masuk/keluar. Koordinat titik = koordinat panggung (1080×1060).
 * Adegan boleh tumpang tindih; yang ditulis belakangan tampil di atas.
 */
export const Adegan4: React.FC<{
  t: number;
  frame: number;
  a: number;
  b: number;
  masuk?: Masuk;
  keluar?: Keluar;
  dMasuk?: number;
  dKeluar?: number;
  titik?: [number, number];
  children: React.ReactNode;
}> = ({ t, frame, a, b, masuk = 'langsung', keluar = 'tidak', dMasuk = 0.35, dKeluar = 0.3, titik = [540, 520], children }) => {
  if (t < a || t > b) return null;
  const pin = masuk === 'langsung' ? 1 : interpolate(t, [a, a + dMasuk], [0, 1], { ...C, easing: easeOut });
  const pout = keluar === 'tidak' ? 0 : interpolate(t, [b - dKeluar, b], [0, 1], { ...C, easing: easeIn });
  const id = `mb-${String(a).replace('.', '_')}`;
  const [px, py] = titik;

  let tf = '';
  let op = 1;
  let bx = 0;
  let by = 0;
  let cssFilter = '';
  let gema: { s: number; o: number; x?: number; y?: number }[] = [];
  let asal = `${px}px ${py}px`;
  let perspektif = false;

  // ---- masuk ----
  if (masuk === 'zoomMundur') {
    const s = interpolate(pin, [0, 1], [2.4, 1]);
    tf += ` scale(${s})`;
    asal = '420px 480px';
    if (pin < 1) gema = [1.07, 1.15, 1.25].map((k, i) => ({ s: s * k, o: 0.32 * (1 - pin) * (1 - i * 0.25) }));
    cssFilter += pin < 1 ? ` blur(${(1 - pin) * 3}px)` : '';
  }
  if (masuk === 'sapuan') {
    tf += ` translateX(${(1 - pin) * 1150}px)`;
    bx += (1 - pin) * 70;
  }
  if (masuk === 'zoomMasuk') {
    const s = interpolate(pin, [0, 1], [0.3, 1]);
    tf += ` scale(${s})`;
    asal = '540px 520px';
    if (pin < 1) gema = [0.88, 0.76, 0.64].map((k, i) => ({ s: s * k, o: 0.3 * (1 - pin) * (1 - i * 0.25) }));
    op = Math.min(op, interpolate(pin, [0, 0.25], [0, 1], C));
  }
  if (masuk === 'tampar') {
    const k = interpolate(t, [a, a + dMasuk], [0, 1], { ...C, easing: Easing.out(Easing.back(1.4)) });
    tf += ` translateY(${(1 - k) * 1300}px) rotateX(${(1 - pin) * 28}deg)`;
    by += (1 - pin) * 60;
    perspektif = true;
    asal = '540px 1060px';
  }
  if (masuk === 'balik') {
    tf += ` rotateY(${-(1 - pin) * 90}deg)`;
    perspektif = true;
    asal = '540px 520px';
    cssFilter += ` brightness(${0.4 + 0.6 * pin})`;
  }
  if (masuk === 'titik') {
    op = Math.min(op, interpolate(pin, [0, 0.3], [0, 1], C));
  }

  // ---- keluar ----
  if (keluar === 'sapuan') {
    tf += ` translateX(${-pout * 1150}px)`;
    bx += pout * 70;
  }
  if (keluar === 'runtuh') {
    tf += ` scale(${1 - pout})`;
    asal = `${px}px ${py}px`;
    cssFilter += ` brightness(${1 + pout * 2.5})`;
    by += pout * 4;
    bx += pout * 4;
  }
  if (keluar === 'zoomTembus') {
    const s = 1 + pout * 9;
    tf += ` scale(${s})`;
    asal = `${px}px ${py}px`;
    op = Math.min(op, interpolate(pout, [0.55, 1], [1, 0], C));
    if (pout > 0) gema = [0.9, 0.8, 0.7].map((k, i) => ({ s: s * k, o: 0.3 * pout * (1 - i * 0.25) }));
  }
  if (keluar === 'terdorong') {
    tf += ` translateY(${-pout * 260}px) scale(${1 - pout * 0.1})`;
    cssFilter += ` brightness(${1 - pout * 0.6})`;
    by += pout * 10;
  }
  if (keluar === 'balik') {
    tf += ` rotateY(${pout * 90}deg)`;
    perspektif = true;
    asal = '540px 520px';
    cssFilter += ` brightness(${1 - pout * 0.6})`;
  }
  if (op <= 0) return null;

  const pakaiBlur = bx > 0.3 || by > 0.3;
  const filterAkhir = `${pakaiBlur ? `url(#${id})` : ''}${cssFilter}`.trim() || undefined;
  const glitch = keluar === 'glitch' && pout > 0;

  const lapisan = (
    <div style={{ position: 'absolute', inset: 0, transform: tf || undefined, transformOrigin: asal, filter: filterAkhir, opacity: op }}>{children}</div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, perspective: perspektif ? 1600 : undefined }}>
      {pakaiBlur && <FilterBlur id={id} x={bx} y={by} />}
      {gema.map((g, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, transform: `scale(${g.s})`, transformOrigin: asal, opacity: g.o, filter: 'blur(2px)' }}>
          {children}
        </div>
      ))}
      {glitch ? <Glitch frame={frame} p={pout}>{children}</Glitch> : lapisan}
    </div>
  );
};

/** glitch: potongan horizontal bergeser + pecah warna merah/cyan */
const Glitch: React.FC<{ frame: number; p: number; children: React.ReactNode }> = ({ frame, p, children }) => {
  const n = 9;
  const kuat = 0.35 + p;
  return (
    <>
      <FilterWarna />
      {[
        { f: 'tintMerah', dx: -34 * kuat },
        { f: 'tintCyan', dx: 34 * kuat },
      ].map((c) => (
        <div key={c.f} style={{ position: 'absolute', inset: 0, transform: `translateX(${c.dx}px)`, filter: `url(#${c.f})`, mixBlendMode: 'screen', opacity: 0.7 }}>
          {children}
        </div>
      ))}
      {Array.from({ length: n }, (_, i) => {
        const y0 = (i / n) * 100;
        const y1 = 100 - ((i + 1) / n) * 100;
        const dx = (acak(frame * 7 + i * 3.1) - 0.5) * 560 * kuat * (acak(frame + i) > 0.3 ? 1 : 0.2);
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${y0}% 0 ${y1}% 0)`, transform: `translateX(${dx}px)`, opacity: 1 - p * 0.3 }}>
            {children}
          </div>
        );
      })}
    </>
  );
};

/** titik cahaya cyan (koordinat panggung) — tujuan runtuh & awal adegan berikut */
export const TitikCahaya: React.FC<{ x: number; y: number; besar: number; op: number }> = ({ x, y, besar, op }) => {
  if (op <= 0) return null;
  return (
    <svg viewBox="0 0 1080 1060" width={1080} height={1060} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id="titikG">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="18%" stopColor="#A6F6FA" stopOpacity={0.95} />
          <stop offset="50%" stopColor="#C77700" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#C77700" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g opacity={op}>
        <circle cx={x} cy={y} r={60 * besar} fill="url(#titikG)" />
        <line x1={x - 220 * besar} y1={y} x2={x + 220 * besar} y2={y} stroke="#A6F6FA" strokeWidth={2.5} strokeOpacity={0.7} />
        <line x1={x} y1={y - 90 * besar} x2={x} y2={y + 90 * besar} stroke="#A6F6FA" strokeWidth={2} strokeOpacity={0.5} />
      </g>
    </svg>
  );
};

/* ---------------- hantaman v2 ---------------- */
export const Hantaman2: React.FC<{
  t: number;
  a: number;
  b: number;
  kata: string;
  warna?: 'cyan' | 'amber';
  keluar?: 'sapuan' | 'iris';
  iris?: [number, number]; // titik tujuan iris (koordinat layar 1080×1920)
  dKeluar?: number;
}> = ({ t, a, b, kata, warna = 'cyan', keluar = 'sapuan', iris = [540, 960], dKeluar = 0.25 }) => {
  if (t < a - 0.06 || t >= b) return null;
  const isi = warna === 'cyan' ? K.cyan : K.amber;
  const pin = interpolate(t, [a, a + 0.22], [0, 1], { ...C, easing: easeOut });
  const pout = interpolate(t, [b - dKeluar, b], [0, 1], { ...C, easing: easeIn });
  const s = interpolate(pin, [0, 1], [2.6, 1]);
  const kilat = interpolate(t, [a - 0.06, a, a + 0.12], [0, 0.85, 0], C);
  // kata hantaman selalu muat di layar (maks 940 px)
  const besar = ukuranPas(kata, kata.length > 6 ? 168 : 260, 940, SANS, 900, -6, 90);
  // keluar
  let tf = '';
  let clip: string | undefined;
  let blurX = 0;
  if (keluar === 'sapuan') {
    tf = `translateX(${-pout * 1150}px)`;
    blurX = pout * 70;
  } else {
    const r = interpolate(pout, [0, 1], [2300, 0]);
    clip = `circle(${r}px at ${iris[0]}px ${iris[1]}px)`;
  }
  const id = `hb-${String(a).replace('.', '_')}`;
  return (
    <>
      {t >= a && (
        <AbsoluteFill style={{ clipPath: clip }} data-qa-penutup>
          <svg width={0} height={0} style={{ position: 'absolute' }}>
            <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={`${Math.max(0, blurX + (1 - pin) * 18)} ${(1 - pin) * 6}`} />
            </filter>
          </svg>
          <AbsoluteFill style={{ background: K.card, transform: tf, filter: `url(#${id})` }}>
            {/* kata berulang berlapis di latar */}
            {Array.from({ length: 9 }, (_, r) => {
              const arah = r % 2 ? 1 : -1;
              const geser = ((t - a) * 420 * arah) % 900;
              return (
                <div
                  key={r}
                  data-qa="hias"
                  style={{
                    position: 'absolute',
                    top: 120 + r * 200,
                    left: -900 + geser,
                    whiteSpace: 'nowrap',
                    fontFamily: SANS,
                    fontWeight: 900,
                    fontSize: 190,
                    letterSpacing: -4,
                    color: 'transparent',
                    WebkitTextStroke: `2px rgba(199,119,0,${0.22 + 0.1 * (1 - pin)})`,
                    opacity: Math.min(1, pin * 2),
                  }}
                >
                  {`${kata} ${kata} ${kata} ${kata} ${kata}`}
                </div>
              );
            })}
            {/* garis kecepatan */}
            <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
              {Array.from({ length: 40 }, (_, i) => {
                const sudut = (i / 40) * Math.PI * 2 + acak(i) * 0.1;
                const r0 = 260 + pin * 500 + acak(i * 3) * 120;
                const r1 = r0 + 160 + acak(i * 5) * 240;
                return (
                  <line
                    key={i}
                    x1={540 + Math.cos(sudut) * r0}
                    y1={960 + Math.sin(sudut) * r0}
                    x2={540 + Math.cos(sudut) * r1}
                    y2={960 + Math.sin(sudut) * r1}
                    stroke={isi}
                    strokeWidth={3 + acak(i * 7) * 4}
                    strokeLinecap="round"
                    opacity={(1 - pin) * 0.7}
                  />
                );
              })}
            </svg>
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
              {[0.3, 0.16].map((o, i) => (
                <div key={i} data-qa="hias" style={{ position: 'absolute', fontFamily: SANS, fontWeight: 900, fontSize: besar, letterSpacing: -6, color: isi, opacity: o * (1 - pin), transform: `scale(${s * (1.12 + i * 0.12)})` }}>
                  {kata}
                </div>
              ))}
              <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: besar, letterSpacing: -6, color: isi, transform: `scale(${s})` }}>{kata}</div>
            </AbsoluteFill>
            <div style={{ position: 'absolute', bottom: 520, width: '100%', textAlign: 'center', fontFamily: MONO, fontSize: 24, letterSpacing: 6, color: K.dim, opacity: 0.9 }}>1HERTZ</div>
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {kilat > 0 && <AbsoluteFill style={{ background: '#FFFFFF', opacity: kilat * 0.35 }} />}
    </>
  );
};
