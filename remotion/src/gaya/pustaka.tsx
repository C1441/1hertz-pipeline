// Pustaka visual 1Hertz v2 — lapis 1 (bentuk visual generik).
// Objek board/komponen memakai @wokwi/elements (MIT, (c) Uri Shaked).
import React from 'react';
import { AbsoluteFill, interpolate, Easing } from 'remotion';
import '@wokwi/elements';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      [k: string]: any;
    }
  }
}

/* ---------------- token ---------------- */
export const K = {
  bg: '#0C1117',
  band: '#06090C',
  text: '#EEF3F6',
  dim: '#8B9AA6',
  redup: '#56636F',
  garis: '#24303A',
  card: 'rgba(17,25,34,0.95)',
  cyan: '#4FE3EC',
  amber: '#FFB547',
  ok: '#45D99A',
  err: '#FF6B6B',
};
export const SANS = 'Inter, "DejaVu Sans", sans-serif';
export const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';
export type Warna = 'cyan' | 'amber' | 'ok' | 'err' | 'dim' | 'text';
export const w = (x?: Warna) => (x ? (K as any)[x] : K.text);

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const naik = (t: number, a: number, d = 0.35) => interpolate(t, [a, a + d], [0, 1], { ...C, easing: ease });
export const pop = (t: number, a: number, d = 0.3) => interpolate(t, [a, a + d], [0, 1], { ...C, easing: Easing.out(Easing.back(1.8)) });
/** 0→1→0 di [a,b]; a = 0 berarti langsung tampil di frame pertama */
export const jendela = (t: number, a: number, b: number, d = 0.25) =>
  a === 0 ? interpolate(t, [b - d, b], [1, 0], C) : interpolate(t, [a, a + d, b - d, b], [0, 1, 1, 0], C);

/* ---------------- kerangka video ---------------- */
export type Judul = { a: number; b: number; l1: string; l2: string; warna: Warna };
export type AdeganSub = { mulai: number; selesai: number; vo: string; kunci?: string };

export const Kerangka: React.FC<{ t: number; tag: string; judul: Judul[]; adegan: AdeganSub[]; sumber?: string; children: React.ReactNode }> = ({
  t,
  tag,
  judul,
  adegan,
  sumber = 'ILUSTRASI',
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: K.bg, fontFamily: SANS }}>
    <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(140,200,230,0.10) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 38% at 50% 42%, rgba(79,227,236,0.07), transparent 70%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.55))' }} />
    <div style={{ position: 'absolute', top: 64, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: K.bg, background: K.cyan, borderRadius: 999, padding: '8px 20px' }}>{tag}</div>
      <div style={{ fontFamily: MONO, fontSize: 24, color: '#5D6B78' }}>@1hertz_lab</div>
    </div>
    {judul.map((j, i) => {
      const op = jendela(t, j.a, j.b, 0.22);
      if (op <= 0) return null;
      const geser = j.a === 0 ? 0 : (1 - naik(t, j.a, 0.4)) * 24;
      return (
        <div key={i} style={{ position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: op, transform: `translateY(${geser}px)` }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: K.text, letterSpacing: -1.5, lineHeight: 1.08 }}>{j.l1}</div>
          <div style={{ fontSize: 72, fontWeight: 800, color: w(j.warna), letterSpacing: -1.5, lineHeight: 1.08 }}>{j.l2}</div>
        </div>
      );
    })}
    <div style={{ position: 'absolute', top: 350, left: 0, width: 1080, height: 1060 }}>{children}</div>
    <div style={{ position: 'absolute', top: 1392, width: '100%', textAlign: 'center', fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: '#5D6B78' }}>{sumber}</div>
    <Subtitle t={t} adegan={adegan} />
  </AbsoluteFill>
);

/** transisi zoom antar-adegan (masuk dari kecil, keluar membesar) */
export const Adegan: React.FC<{ t: number; a: number; b: number; children: React.ReactNode }> = ({ t, a, b, children }) => {
  if (t < a || t > b) return null;
  const masuk = a === 0 ? 1 : naik(t, a, 0.4);
  const keluar = interpolate(t, [b - 0.35, b], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  const op = Math.min(masuk, 1 - keluar);
  if (op <= 0) return null;
  const s = (0.93 + 0.07 * masuk) * (1 + 0.14 * keluar);
  return <div style={{ position: 'absolute', inset: 0, opacity: op, transform: `scale(${s})`, transformOrigin: '540px 520px' }}>{children}</div>;
};

/** lapisan SVG seukuran panggung */
export const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 1080 1060" width={1080} height={1060} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
    <defs>
      <filter id="bayang" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#000" floodOpacity="0.55" />
      </filter>
      <filter id="pendar" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {children}
  </svg>
);

/* ---------------- subtitle tenang ---------------- */
type Kata = { teks: string; mulai: number; kunci: boolean };
const bersih = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const buatFrasa = (adegan: AdeganSub[]) => {
  const out: { mulai: number; kata: Kata[] }[] = [];
  for (const a of adegan) {
    const ws = a.vo.split(' ');
    const bobot = ws.map((x) => x.length + 2);
    const total = bobot.reduce((x, y) => x + y, 0);
    const awal = a.mulai + 0.05;
    const span = a.selesai - a.mulai - 0.2;
    let acc = 0;
    let cur: Kata[] = [];
    ws.forEach((x, i) => {
      cur.push({ teks: x, mulai: awal + (acc / total) * span, kunci: !!a.kunci && bersih(x) === bersih(a.kunci) });
      acc += bobot[i];
      if (/[.,?:!]$/.test(x) || i === ws.length - 1 || cur.length >= 6) {
        out.push({ mulai: cur[0].mulai, kata: cur });
        cur = [];
      }
    });
  }
  return out;
};
export const Subtitle: React.FC<{ t: number; adegan: AdeganSub[] }> = ({ t, adegan }) => {
  const frasa = React.useMemo(() => buatFrasa(adegan), [adegan]);
  let idx = 0;
  frasa.forEach((f, i) => {
    if (f.mulai <= t) idx = i;
  });
  const f = frasa[idx];
  const op = interpolate(t, [f.mulai, f.mulai + 0.1], [0.4, 1], C);
  return (
    <div style={{ position: 'absolute', top: 1460, left: 140, right: 140, textAlign: 'center', fontSize: 56, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.5, opacity: op, textShadow: '0 3px 14px rgba(0,0,0,0.85)' }}>
      <div>
        {f.kata.map((k, i) => (
          <span key={i} style={{ color: k.kunci ? K.amber : K.text, opacity: k.mulai <= t ? 1 : 0.38 }}>
            {k.teks.replace(/[.,:!]$/, '')}
            {i < f.kata.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------------- objek: board Wokwi ---------------- */
export type JenisBoard = 'esp32' | 'uno' | 'nano' | 'mega';
const TAG_BOARD: Record<JenisBoard, string> = {
  esp32: 'wokwi-esp32-devkit-v1',
  uno: 'wokwi-arduino-uno',
  nano: 'wokwi-arduino-nano',
  mega: 'wokwi-arduino-mega',
};
/** ukuran gambar asli (unit viewBox) — dipakai untuk rotasi & titik */
export const DIM: Partial<Record<JenisBoard, [number, number]>> = { esp32: [107, 201] };
/**
 * board di panggung. tidur = diputar 90° searah jarum jam (board tergeletak di meja, colokan USB di kiri).
 * (x, y) = pojok kiri atas kotak hasil akhir. 1 unit gambar ≈ s px.
 */
export const Board: React.FC<{ jenis: JenisBoard; x: number; y: number; s: number; tidur?: boolean; dayaNyala?: boolean; led?: boolean }> = ({ jenis, x, y, s, tidur, dayaNyala, led }) => {
  const Tag = TAG_BOARD[jenis] as any;
  const h = (DIM[jenis] ?? [0, 0])[1];
  const tf = tidur ? `translate(${h * s}px,0) rotate(90deg) scale(${s})` : `scale(${s})`;
  return (
    <div style={{ position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.5))' }}>
      <div style={{ transform: tf, transformOrigin: '0 0' }}>
        <Tag ledPower={!!dayaNyala} led1={!!led} />
      </div>
    </div>
  );
};
/** titik pada gambar board (ex, ey) → koordinat panggung */
export const titikBoard = (jenis: JenisBoard, x: number, y: number, s: number, tidur: boolean, ex: number, ey: number): [number, number] => {
  const h = (DIM[jenis] ?? [0, 0])[1];
  return tidur ? [x + (h - ey) * s, y + ex * s] : [x + ex * s, y + ey * s];
};

/* ---------------- objek: alas meja (cutting mat) ---------------- */
export const Meja: React.FC<{ x?: number; y?: number; w?: number; h?: number; grid?: number }> = ({ x = 10, y = 150, w: L = 1060, h = 890, grid = 54 }) => (
  <g>
    <rect x={x} y={y} width={L} height={h} rx={28} fill="#15201C" stroke="#25352D" strokeWidth={3} />
    {Array.from({ length: Math.floor(L / grid) }, (_, i) => (
      <line key={`v${i}`} x1={x + (i + 1) * grid} y1={y + 14} x2={x + (i + 1) * grid} y2={y + h - 14} stroke="#1D2B25" strokeWidth={2} />
    ))}
    {Array.from({ length: Math.floor(h / grid) }, (_, i) => (
      <line key={`h${i}`} x1={x + 14} y1={y + (i + 1) * grid} x2={x + L - 14} y2={y + (i + 1) * grid} stroke="#1D2B25" strokeWidth={2} />
    ))}
    {Array.from({ length: Math.floor(L / (grid / 2)) }, (_, i) => (
      <line key={`r${i}`} x1={x + (i + 1) * (grid / 2)} y1={y + 6} x2={x + (i + 1) * (grid / 2)} y2={y + (i % 2 ? 16 : 24)} stroke="#3B5247" strokeWidth={2} />
    ))}
  </g>
);

/* ---------------- objek: laptop tampak atas (layar terbuka + keyboard) ---------------- */
export const LAPTOP = { x: 40, y: 270, w: 540 };
/** area layar untuk isi: x0..x1, y0..y1 */
export const LAYAR = { x0: LAPTOP.x + 22, x1: LAPTOP.x + LAPTOP.w - 22, y0: LAPTOP.y + 28, y1: LAPTOP.y + 262 };
export const PORT_LAPTOP: [number, number] = [LAPTOP.x + LAPTOP.w, LAPTOP.y + 560];
export const Laptop: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { x, y, w: L } = LAPTOP;
  const lebarTuts = (L - 70 - 12 * 8) / 13;
  return (
    <g>
      <g filter="url(#bayang)">
        {/* tutup layar terbuka */}
        <rect x={x} y={y} width={L} height={280} rx={16} fill="#1B232C" stroke="#33404D" strokeWidth={3} />
        {/* badan + keyboard */}
        <rect x={x} y={y + 290} width={L} height={340} rx={24} fill="#2A3440" stroke="#3A4754" strokeWidth={3} />
      </g>
      <rect x={x + 16} y={y + 16} width={L - 32} height={250} rx={8} fill="#0E141A" />
      <rect x={x + 24} y={y + 280} width={L - 48} height={10} rx={4} fill="#151B22" />
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 13 }, (_, c) => (
          <rect key={`${r}-${c}`} x={x + 35 + c * (lebarTuts + 8)} y={y + 318 + r * 38} width={lebarTuts} height={30} rx={5} fill="#1B222B" />
        )),
      )}
      <rect x={x + 35 + 3 * (lebarTuts + 8)} y={y + 508} width={7 * (lebarTuts + 8) - 8} height={30} rx={5} fill="#1B222B" />
      <rect x={x + L / 2 - 95} y={y + 554} width={190} height={62} rx={10} fill="#242D37" stroke="#3A4754" strokeWidth={2} />
      <rect x={x + L - 4} y={y + 548} width={12} height={24} rx={3} fill="#9AA5B1" />
      <g>{children}</g>
    </g>
  );
};

/* ---------------- objek: kabel dengan denyut ---------------- */
type Pt = [number, number];
export type Segmen = [Pt, Pt, Pt, Pt];
const bez = (s: Segmen, u: number): Pt => {
  const m = 1 - u;
  return [
    m * m * m * s[0][0] + 3 * m * m * u * s[1][0] + 3 * m * u * u * s[2][0] + u * u * u * s[3][0],
    m * m * m * s[0][1] + 3 * m * m * u * s[1][1] + 3 * m * u * u * s[2][1] + u * u * u * s[3][1],
  ];
};
const sampel = (seg: Segmen[]) => {
  const pts: Pt[] = [];
  seg.forEach((s, i) => {
    for (let k = i === 0 ? 0 : 1; k <= 60; k++) pts.push(bez(s, k / 60));
  });
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len };
};
/** titik di pecahan f (0..1) sepanjang kabel */
export const titik = (seg: Segmen[], f: number): Pt => {
  const { pts, len } = sampel(seg);
  const target = Math.max(0, Math.min(1, f)) * len[len.length - 1];
  let i = 1;
  while (i < len.length - 1 && len[i] < target) i++;
  const k = (target - len[i - 1]) / (len[i] - len[i - 1] || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
};
const keD = (seg: Segmen[]) => `M${seg[0][0][0]},${seg[0][0][1]} ` + seg.map((s) => `C${s[1][0]},${s[1][1]} ${s[2][0]},${s[2][1]} ${s[3][0]},${s[3][1]}`).join(' ');

/** aliran: titik-titik bergerak di kabel; batas = sampai pecahan berapa aliran bisa lewat */
export type Aliran = { warna: string; kecepatan: number; jarak: number; fase?: number; batas?: number; label?: string };
export const Kabel: React.FC<{ seg: Segmen[]; t: number; tebal?: number; warna?: string; aliran?: Aliran[] }> = ({ seg, t, tebal = 22, warna = '#2E3742', aliran = [] }) => {
  const d = keD(seg);
  return (
    <g>
      <path d={d} fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={tebal + 6} strokeLinecap="round" transform="translate(0,7)" />
      <path d={d} fill="none" stroke={warna} strokeWidth={tebal} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={4} strokeLinecap="round" transform="translate(-2,-4)" />
      {aliran.map((a, ai) => {
        const n = Math.ceil(1 / a.jarak) + 1;
        const batas = a.batas ?? 1;
        return Array.from({ length: n }, (_, i) => {
          const f = ((t * a.kecepatan + (a.fase ?? 0)) % a.jarak) + i * a.jarak;
          if (f > batas || f > 1) return null;
          const [x, y] = titik(seg, f);
          const pudar = batas < 1 ? interpolate(f, [batas - 0.08, batas], [1, 0], C) : 1;
          return <circle key={`${ai}-${i}`} cx={x} cy={y} r={tebal * 0.32} fill={a.warna} opacity={pudar} filter="url(#pendar)" />;
        });
      })}
    </g>
  );
};

/* ---------------- lencana ✓ / ✕ ---------------- */
export const Ikon: React.FC<{ x: number; y: number; r?: number; jenis: 'ok' | 'err' | 'warn'; s?: number }> = ({ x, y, r = 28, jenis, s = 1 }) => {
  const isi = jenis === 'ok' ? K.ok : jenis === 'err' ? K.err : K.amber;
  const k = r / 28;
  return (
    <g transform={`translate(${x},${y}) scale(${s * k})`}>
      {jenis === 'warn' ? (
        <>
          <path d="M0,-30 L30,24 L-30,24 Z" fill={isi} stroke={isi} strokeWidth={6} strokeLinejoin="round" />
          <rect x={-3.5} y={-12} width={7} height={22} rx={3} fill={K.bg} />
          <circle cx={0} cy={16} r={4} fill={K.bg} />
        </>
      ) : (
        <>
          <circle r={28} fill={isi} />
          {jenis === 'ok' ? (
            <path d="M-12,1 l8,9 l17,-19" fill="none" stroke={K.bg} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M-10,-10 l20,20 M10,-10 l-20,20" stroke={K.bg} strokeWidth={6} strokeLinecap="round" />
          )}
        </>
      )}
    </g>
  );
};

/* ---------------- jendela sistem / terminal + diff ---------------- */
export type Baris = {
  teks: string;
  indent?: number;
  ikon?: 'warn' | 'ok' | 'err' | 'buka' | 'tutup';
  warna?: Warna;
  muncul?: number; // detik baris masuk (default: sudah ada)
  coret?: number; // detik baris dicoret lalu dilipat
  sorot?: Warna; // latar sorot berdenyut
};
export const Jendela: React.FC<{ t: number; x: number; y: number; lebar: number; judul: string; gaya?: 'sistem' | 'terminal'; baris: Baris[]; tinggiBaris?: number; ukuran?: number }> = ({
  t,
  x,
  y,
  lebar,
  judul,
  gaya = 'sistem',
  baris,
  tinggiBaris = 74,
  ukuran = 30,
}) => {
  const font = gaya === 'terminal' ? MONO : SANS;
  let yy = 0;
  const isi = baris.map((b, i) => {
    const masuk = b.muncul === undefined ? 1 : naik(t, b.muncul, 0.35);
    const lipat = b.coret === undefined ? 0 : naik(t, b.coret + 0.6, 0.35);
    const tinggi = tinggiBaris * masuk * (1 - lipat);
    const yRow = yy;
    yy += tinggi;
    if (tinggi < 1) return null;
    const garis = b.coret === undefined ? 0 : naik(t, b.coret, 0.35);
    const warnaTeks = b.coret !== undefined && t >= b.coret ? K.err : w(b.warna);
    const denyut = 0.16 + 0.1 * Math.sin(t * Math.PI * 3);
    const ix = 34 + (b.indent ?? 0) * 44;
    const tx = ix + (b.ikon ? 50 : 0);
    return (
      <g key={i} transform={`translate(0,${yRow})`} opacity={Math.min(masuk, 1 - lipat)}>
        {b.sorot && <rect x={12} y={6} width={lebar - 24} height={tinggiBaris - 12} rx={10} fill={w(b.sorot)} opacity={denyut} />}
        {b.ikon === 'buka' && <path d={`M${ix - 8},${tinggiBaris / 2 - 7} l10,12 l10,-12`} fill="none" stroke={K.dim} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
        {b.ikon === 'tutup' && <path d={`M${ix - 4},${tinggiBaris / 2 - 11} l12,11 l-12,11`} fill="none" stroke={K.dim} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />}
        {(b.ikon === 'warn' || b.ikon === 'ok' || b.ikon === 'err') && <Ikon x={ix + 12} y={tinggiBaris / 2 + (b.ikon === 'warn' ? 2 : 0)} r={17} jenis={b.ikon} />}
        <text x={b.ikon === 'buka' || b.ikon === 'tutup' ? ix + 26 : tx} y={tinggiBaris / 2 + ukuran * 0.36} fontFamily={font} fontSize={ukuran} fontWeight={b.sorot ? 700 : 500} fill={warnaTeks}>
          {b.teks}
        </text>
        {garis > 0 && <line x1={tx - 6} y1={tinggiBaris / 2} x2={tx - 6 + (lebar - tx - 30) * garis} y2={tinggiBaris / 2} stroke={K.err} strokeWidth={5} strokeLinecap="round" />}
      </g>
    );
  });
  const tinggiTotal = Math.max(yy, tinggiBaris) + 90;
  return (
    <g transform={`translate(${x},${y})`}>
      <g filter="url(#bayang)">
        <rect width={lebar} height={tinggiTotal} rx={20} fill={gaya === 'terminal' ? '#080C10' : '#151D26'} />
      </g>
      <rect width={lebar} height={tinggiTotal} rx={20} fill="none" stroke="#2E3B48" strokeWidth={3} />
      <rect width={lebar} height={64} rx={20} fill="#1D2731" />
      <rect y={44} width={lebar} height={20} fill="#1D2731" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={32 + i * 30} cy={32} r={9} fill={['#FF6B6B', '#FFB547', '#45D99A'][i]} opacity={0.85} />
      ))}
      <text x={lebar / 2} y={42} textAnchor="middle" fontFamily={SANS} fontSize={26} fontWeight={600} fill={K.dim}>
        {judul}
      </text>
      <g transform="translate(0,80)">{isi}</g>
    </g>
  );
};

/* ---------------- checklist ---------------- */
export const Checklist: React.FC<{ t: number; x: number; y: number; lebar: number; item: { teks: string; a: number }[] }> = ({ t, x, y, lebar, item }) => {
  const tinggi = 40 + item.length * 76;
  return (
    <g transform={`translate(${x},${y})`} opacity={naik(t, item[0].a - 0.2, 0.3)}>
      <g filter="url(#bayang)">
        <rect width={lebar} height={tinggi} rx={22} fill={K.card} />
      </g>
      <rect width={lebar} height={tinggi} rx={22} fill="none" stroke={K.ok} strokeOpacity={0.8} strokeWidth={3} />
      {item.map((it, i) => {
        const k = naik(t, it.a, 0.3);
        return (
          <g key={i} opacity={k} transform={`translate(${(1 - k) * -20},${20 + i * 76})`}>
            <Ikon x={50} y={38} r={24} jenis="ok" />
            <text x={92} y={50} fontFamily={SANS} fontWeight={700} fontSize={34} fill={K.text}>
              {it.teks}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/* ---------------- pill CTA ---------------- */
export const Pill: React.FC<{ t: number; a: number; x: number; y: number; teks: string; lebar?: number }> = ({ t, a, x, y, teks, lebar = 600 }) => {
  const s = pop(t, a);
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-lebar / 2} y={-50} width={lebar} height={100} rx={50} fill={K.cyan} />
      <text y={14} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={40} fill={K.bg}>
        {teks}
      </text>
    </g>
  );
};
