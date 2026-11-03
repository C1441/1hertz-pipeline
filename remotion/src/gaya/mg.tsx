// Kit motion graphic 1Hertz v3 (prototipe, 1 Nov 2026).
// Tata bahasa dari referensi KATANA, aksen utama cyan (amber hanya peringatan, merah hanya salah/error).
// Terpisah dari template Short1Hertz yang dipakai produksi. Semua fungsi murni terhadap t (detik).
import React, { useMemo } from 'react';
import { AbsoluteFill, Easing, interpolate } from 'remotion';
import { K, MONO } from './pustaka';
import { acak } from './transisi';
import { ukuranPas } from './ukur';

export const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const HURUF = '"Inter Display", Inter, "DejaVu Sans", sans-serif';
export const eOut = Easing.bezier(0.16, 1, 0.3, 1);
export const eIn = Easing.bezier(0.7, 0, 0.84, 0);
const eBack = Easing.out(Easing.back(2));
/** 0→1 mulai a, lama d */
export const pr = (t: number, a: number, d: number, e: (x: number) => number = eOut) => interpolate(t, [a, a + d], [0, 1], { ...C, easing: e });

const SAMPAH = 'ÿþÐø¤§±µ¶×ß¿Æñ¦¢£¥Ã©®ÞðÝ';
export const sampah = (n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => SAMPAH[Math.floor(acak(seed * 13.7 + i * 3.1) * SAMPAH.length)]).join('');

/* ------------------------------------------------------------------ */
/* LATAR HIDUP: grid perspektif bergerak + glow + partikel + vinyet    */
/* ------------------------------------------------------------------ */
const Grid: React.FC<{ t: number; hy: number }> = ({ t, hy }) => {
  const fase = (t * 0.5) % 1;
  const N = 15;
  return (
    <g>
      {Array.from({ length: N + 1 }, (_, k) => {
        const u = (k + fase) / N;
        const y = hy + 1140 * Math.pow(u, 2.2);
        return <line key={k} x1={0} x2={1080} y1={y} y2={y} stroke={K.cyan} strokeOpacity={0.05 + 0.4 * u} strokeWidth={1 + 2 * u} />;
      })}
      {Array.from({ length: 23 }, (_, j) => {
        const i = j - 11;
        return <line key={`v${j}`} x1={540 + i * 20} y1={hy} x2={540 + i * 200} y2={hy + 1140} stroke={K.cyan} strokeOpacity={0.3} strokeWidth={2} />;
      })}
    </g>
  );
};

export const LatarHidup: React.FC<{ t: number; redup?: number }> = ({ t, redup = 0 }) => {
  const hy = 800;
  const partikel = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({ x: acak(i + 1) * 1080, y0: acak(i + 101) * 1920, v: 16 + acak(i + 201) * 56, r: 1.4 + acak(i + 301) * 3.4, ph: acak(i + 401) * 6.28, putih: i % 5 === 0 })),
    [],
  );
  return (
    <AbsoluteFill style={{ backgroundColor: K.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 34% at 50% ${(hy / 1920) * 100}%, rgba(79,227,236,${0.16 + 0.05 * Math.sin(t * 2.4)}), transparent 70%)` }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Grid t={t} hy={hy} />
        <g transform={`translate(0 ${2 * hy}) scale(1 -1)`} opacity={0.35}>
          <Grid t={t} hy={hy} />
        </g>
        {partikel.map((p, i) => {
          const y = (((p.y0 - t * p.v) % 1920) + 1920) % 1920;
          const o = 0.2 + 0.5 * Math.pow(Math.sin(t * 2 + p.ph), 2);
          return <circle key={i} cx={p.x + Math.sin(t + p.ph) * 14} cy={y} r={p.r} fill={p.putih ? '#FFFFFF' : K.cyan} opacity={o} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 45%, transparent 50%, rgba(0,0,0,0.65))' }} />
      {redup > 0 && <AbsoluteFill style={{ background: `rgba(7,11,16,${redup})` }} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* SEG: pembungkus segmen. Satu "arus" untuk semua sambungan: dorong   */
/* maju (skala membesar di sisi keluar DAN masuk), tumpang tindih      */
/* ±0,2 dtk supaya panggung tidak pernah kosong.                       */
/* ------------------------------------------------------------------ */
export const Seg: React.FC<{ t: number; a: number; b: number; awal?: boolean; akhir?: boolean; children: React.ReactNode }> = ({ t, a, b, awal, akhir, children }) => {
  const aw = awal ? 0 : a - 0.14;
  const bw = akhir ? b + 5 : b + 0.1;
  if (t < aw || t > bw) return null;
  const pin = awal ? 1 : interpolate(t, [aw, aw + 0.3], [0, 1], { ...C, easing: eOut });
  const pout = akhir ? 0 : interpolate(t, [b - 0.2, bw], [0, 1], { ...C, easing: eIn });
  const s = interpolate(pin, [0, 1], [0.88, 1]) * interpolate(pout, [0, 1], [1, 1.18]);
  const bl = (1 - pin) * 10 + pout * 12;
  const op = Math.min(interpolate(pin, [0, 0.35], [0, 1], C), 1 - interpolate(pout, [0.45, 1], [0, 1], C));
  return (
    <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: '540px 900px', filter: bl > 0.4 ? `blur(${bl}px)` : undefined, opacity: op }}>{children}</AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* SLAM: kata besar + garis kecepatan + glitch RGB + kilatan + cincin  */
/* ------------------------------------------------------------------ */
export const Slam: React.FC<{ t: number; a: number; baris: [string, string?]; sampahLatar?: boolean }> = ({ t, a, baris, sampahLatar }) => {
  const l = t - a;
  if (l < -0.02) return null;
  const pin = pr(t, a, 0.22);
  const s = interpolate(pin, [0, 1], [2.3, 1]);
  const blur = (1 - pin) * 22;
  const kilat = interpolate(l, [0, 0.05, 0.22], [0, 0.85, 0], C);
  const getar = l < 0.3 ? Math.sin(l * 150) * (1 - l / 0.3) * 14 : 0;
  const dx = (1 - pin) * 40 + (l < 0.3 ? (acak(Math.floor(l * 30) + 3) - 0.5) * 8 : 0);
  const ukr = Math.min(...baris.filter(Boolean).map((x) => ukuranPas(String(x), 340, 940, HURUF, 900, -8, 90)));
  const garis = Array.from({ length: 44 }, (_, i) => {
    const sd = (i / 44) * Math.PI * 2 + acak(i) * 0.1;
    const r0 = 280 + pin * 560 + acak(i * 3) * 120;
    const r1 = r0 + 160 + acak(i * 5) * 260;
    return { x1: 540 + Math.cos(sd) * r0, y1: 900 + Math.sin(sd) * r0, x2: 540 + Math.cos(sd) * r1, y2: 900 + Math.sin(sd) * r1, w: 3 + acak(i * 7) * 5 };
  });
  const cincin = pr(t, a, 0.6, Easing.out(Easing.cubic));
  const teks = (warna: string, ofs: number, op: number, glow?: boolean) => (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${ofs + getar}px) scale(${s})`, transformOrigin: '540px 360px', opacity: op, filter: blur > 0.4 ? `blur(${blur}px)` : undefined, mixBlendMode: ofs === 0 ? undefined : 'screen' }}>
      {baris.filter(Boolean).map((b, i) => (
        <div key={i} style={{ fontFamily: HURUF, fontWeight: 900, fontSize: ukr, lineHeight: 0.98, letterSpacing: -8, whiteSpace: 'nowrap', color: ofs === 0 ? (i === 1 ? K.cyan : '#FFFFFF') : warna, textShadow: glow && i === 1 ? '0 0 44px rgba(79,227,236,0.6)' : undefined }}>{b}</div>
      ))}
    </div>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'rgba(7,11,16,0.62)' }} />
      {sampahLatar && (
        <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: 0.16 }}>
          {Array.from({ length: 6 }, (_, c) => (
            <text key={c} x={70 + c * 180} y={0} fontFamily={MONO} fontSize={46} fill={K.cyan}>
              {Array.from({ length: 22 }, (_, j) => (
                <tspan key={j} x={70 + c * 180} y={((j * 90 + t * 260 * (0.7 + c * 0.1)) % 2000) - 40}>{sampah(4, Math.floor(t * 10) + c * 17 + j)}</tspan>
              ))}
            </text>
          ))}
        </svg>
      )}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {garis.map((g, i) => (
          <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={K.cyan} strokeWidth={g.w} strokeLinecap="round" opacity={(1 - pin) * 0.9} />
        ))}
        <circle cx={540} cy={900} r={160 + cincin * 760} fill="none" stroke={K.cyan} strokeWidth={6 * (1 - cincin)} opacity={1 - cincin} />
      </svg>
      {teks(K.err, -dx, 0.9)}
      {teks(K.cyan, dx, 0.9)}
      {teks('#fff', 0, 1, true)}
      <AbsoluteFill style={{ background: '#FFFFFF', opacity: kilat }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* HITUNG: dua angka naik cepat + gelombang kotak (cepat vs lambat)    */
/* ------------------------------------------------------------------ */
const Gelombang: React.FC<{ t: number; y: number; periode: number; kecepatan: number; warna: string; amp?: number }> = ({ t, y, periode, kecepatan, warna, amp = 38 }) => {
  const x0 = 90, lebar = 900;
  const geser = (t * kecepatan) % periode;
  let d = '';
  let naik = true;
  let x = x0 - geser;
  while (x < x0 + lebar + periode) {
    const xa = Math.max(x0, Math.min(x0 + lebar, x));
    d += `${d ? 'L' : 'M'}${xa},${naik ? y + amp : y - amp} L${xa},${naik ? y - amp : y + amp} `;
    naik = !naik;
    x += periode / 2;
  }
  return <path d={d} fill="none" stroke={warna} strokeWidth={6} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${warna})` }} />;
};

export const Hitung: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const l = t - a;
  const v1 = Math.round(115200 * interpolate(l, [0.1, 1.0], [0, 1], { ...C, easing: Easing.out(Easing.exp) }));
  const v2 = Math.round(9600 * interpolate(l, [1.0, 1.7], [0, 1], { ...C, easing: Easing.out(Easing.exp) }));
  const p1 = pr(l, 0, 0.35);
  const p2 = pr(l, 0.9, 0.35);
  const neq = pr(l, 1.65, 0.3, eBack);
  const getar = l > 1.65 && l < 2.0 ? Math.sin((l - 1.65) * 160) * 12 * (1 - (l - 1.65) / 0.35) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'rgba(7,11,16,0.45)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', opacity: p1, transform: `translateY(${(1 - p1) * 50}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 36, letterSpacing: 10, color: K.cyan }}>BOARD KIRIM</div>
        <div style={{ fontFamily: HURUF, fontWeight: 900, fontSize: 250, letterSpacing: -8, color: '#fff', lineHeight: 1.05, textShadow: '0 0 50px rgba(79,227,236,0.55)' }}>{v1}</div>
        <div style={{ fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: K.dim }}>BAUD</div>
      </div>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <g opacity={p1}>
          <Gelombang t={t} y={800} periode={46} kecepatan={560} warna={K.cyan} />
        </g>
        <g opacity={p2}>
          <Gelombang t={t} y={1440} periode={320} kecepatan={170} warna={K.amber} />
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', opacity: p2, transform: `translateY(${(1 - p2) * 50}px) translateX(${getar}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 36, letterSpacing: 10, color: K.amber }}>MONITOR BACA</div>
        <div style={{ fontFamily: HURUF, fontWeight: 900, fontSize: 250, letterSpacing: -8, color: K.amber, lineHeight: 1.05, textShadow: '0 0 50px rgba(255,181,71,0.45)' }}>{v2}</div>
        <div style={{ fontFamily: MONO, fontSize: 40, letterSpacing: 10, color: K.dim }}>BAUD</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 835, textAlign: 'center', fontFamily: HURUF, fontWeight: 900, fontSize: 130, color: K.err, opacity: neq, transform: `scale(${0.4 + 0.6 * neq}) translateX(${getar}px)`, textShadow: '0 0 36px rgba(255,107,107,0.6)' }}>≠</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* ALUR: ESP32 → kabel → Serial Monitor, cahaya berjalan, monitor     */
/* berguncang merah saat kecepatan tak cocok                           */
/* ------------------------------------------------------------------ */
export const Alur: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const l = t - a;
  const chip = pr(l, 0, 0.4, eBack);
  const kabel = pr(l, 0.3, 0.45);
  const mon = pr(l, 0.9, 0.4, eBack);
  const salah = l > 1.3;
  const getar = l > 1.3 && l < 2.4 ? Math.sin(l * 70) * 7 * Math.max(0, 1 - (l - 1.3) / 1.2) : 0;
  const kedip = salah ? 0.55 + 0.45 * Math.sin(l * 22) : 0;
  const tag = pr(l, 1.7, 0.3, eBack);
  const garis = Array.from({ length: 7 }, (_, i) => sampah(15, Math.floor(l * 14) + i * 11));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'rgba(7,11,16,0.5)' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="pendar" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* chip ESP32 */}
        <g transform={`translate(540 440) scale(${chip}) translate(-540 -440)`} opacity={chip}>
          <rect x={330} y={310} width={420} height={260} rx={30} fill="#0E141A" stroke={K.cyan} strokeWidth={5} filter="url(#pendar)" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <rect x={308} y={336 + i * 32} width={24} height={14} rx={3} fill={K.cyan} opacity={0.85} />
              <rect x={748} y={336 + i * 32} width={24} height={14} rx={3} fill={K.cyan} opacity={0.85} />
            </g>
          ))}
          <path d="M600,330 h40 v22 h-40 v22 h40 v22 h-40" fill="none" stroke={K.cyan} strokeWidth={4} opacity={0.7} />
          <text x={470} y={470} textAnchor="middle" fontFamily={HURUF} fontWeight={900} fontSize={84} letterSpacing={-3} fill="#fff">ESP32</text>
          <text x={540} y={540} textAnchor="middle" fontFamily={MONO} fontSize={30} letterSpacing={6} fill={K.cyan}>KIRIM 115200</text>
        </g>
        {/* kabel */}
        <line x1={540} y1={580} x2={540} y2={580 + 400 * kabel} stroke="#24303A" strokeWidth={26} strokeLinecap="round" />
        <line x1={540} y1={580} x2={540} y2={580 + 400 * kabel} stroke={K.cyan} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        <text x={575} y={790} fontFamily={MONO} fontSize={34} letterSpacing={6} fill={K.dim} opacity={kabel}>USB</text>
        {l > 0.6 &&
          Array.from({ length: 5 }, (_, i) => {
            const u = ((l * 0.85 + i / 5) % 1);
            return <circle key={i} cx={540} cy={585 + u * 390} r={15} fill="#fff" filter="url(#pendar)" opacity={0.95 * kabel} />;
          })}
      </svg>
      {/* jendela Serial Monitor */}
      <div style={{ position: 'absolute', left: 150, top: 1000, width: 780, height: 470, transform: `translateX(${getar}px) scale(${0.5 + 0.5 * mon})`, transformOrigin: '540px 0', opacity: mon, borderRadius: 26, background: '#0E141A', border: `5px solid ${salah ? K.err : K.cyan}`, boxShadow: salah ? `0 0 ${30 + 30 * kedip}px rgba(255,107,107,${0.35 + 0.4 * kedip})` : '0 0 30px rgba(79,227,236,0.35)', overflow: 'hidden' }}>
        <div style={{ height: 66, background: '#151D26', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
          {['#FF6B6B', '#FFB547', '#45D99A'].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ fontFamily: HURUF, fontWeight: 700, fontSize: 30, color: K.text, marginLeft: 12 }}>Serial Monitor</div>
          <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 28, color: K.amber, border: `2px solid ${K.amber}`, borderRadius: 10, padding: '4px 14px' }}>9600 baud</div>
        </div>
        <div style={{ padding: '22px 28px', fontFamily: MONO, fontSize: 40, lineHeight: 1.45, color: '#C9D1C8', opacity: l > 1.1 ? 1 : 0 }}>
          {garis.map((g, i) => <div key={i} style={{ whiteSpace: 'nowrap' }}>{g}</div>)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1510, textAlign: 'center', opacity: tag, transform: `scale(${0.6 + 0.4 * tag})`, fontFamily: HURUF, fontWeight: 900, fontSize: 64, color: K.err, letterSpacing: -1, textShadow: '0 0 30px rgba(255,107,107,0.5)' }}>KECEPATAN TIDAK COCOK</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* KETIK: baris kode diketik, angka disorot, teks sampah → terbaca     */
/* ------------------------------------------------------------------ */
const resolusi = (teks: string, p: number, seed: number) =>
  teks
    .split('')
    .map((c, i) => (c === ' ' ? ' ' : i < p * teks.length * 1.15 ? c : sampah(1, seed + i + Math.floor(p * 40))))
    .join('');

export const Ketik: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const l = t - a;
  const kode = ['void setup() {', '  Serial.begin(115200);', '}'];
  const total = kode.join('\n').length;
  const n = Math.floor(Math.max(0, l - 0.15) * 26);
  const tampil = kode.join('\n').slice(0, Math.min(total, n)).split('\n');
  const kursor = Math.floor(l * 3) % 2 === 0;
  const sorot = pr(l, 1.75, 0.25);
  const panel = pr(l, 0, 0.3);
  const mon = pr(l, 1.1, 0.4);
  const chip = pr(l, 2.0, 0.3, eBack);
  const baca = pr(l, 2.15, 0.9, Easing.linear);
  const baris = ['Halo dari ESP32!', 'Suhu: 28.5 C', 'Siap.'];
  const hijau = l > 3.05;
  const tandaIdx = tampil[1] ?? '';
  const awalAngka = '  Serial.begin('.length;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'rgba(7,11,16,0.5)' }} />
      <div style={{ position: 'absolute', left: 80, top: 330, width: 920, borderRadius: 24, background: '#0E141A', border: `4px solid ${K.cyan}`, boxShadow: '0 0 36px rgba(79,227,236,0.3)', opacity: panel, transform: `translateY(${(1 - panel) * 40}px)` }}>
        <div style={{ padding: '10px 28px', fontFamily: MONO, fontSize: 28, letterSpacing: 6, color: K.dim, background: '#151D26', borderRadius: '20px 20px 0 0' }}>main.cpp</div>
        <div style={{ padding: '24px 34px 30px', fontFamily: MONO, fontSize: 50, lineHeight: 1.5, color: K.text, position: 'relative' }}>
          {[0, 1, 2].map((i) => {
            const s = tampil[i] ?? '';
            const akhirBaris = i === Math.max(0, tampil.length - 1);
            const isi = i === 1 && s.length > awalAngka + 5 ? (
              <>
                {s.slice(0, awalAngka)}
                <span style={{ background: `rgba(79,227,236,${0.9 * sorot})`, color: sorot > 0.5 ? K.bg : K.cyan, borderRadius: 8, padding: '0 6px', margin: '0 -6px', fontWeight: 700 }}>{s.slice(awalAngka, awalAngka + 6)}</span>
                {s.slice(awalAngka + 6)}
              </>
            ) : (
              s
            );
            return (
              <div key={i} style={{ whiteSpace: 'pre', minHeight: 75, color: i === 0 ? K.cyan : K.text }}>
                {isi}
                {akhirBaris && kursor && l < 2.0 && <span style={{ color: K.cyan }}>▌</span>}
              </div>
            );
          })}
        </div>
      </div>
      {/* panah bercahaya */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: mon }}>
        <line x1={540} y1={700} x2={540} y2={830} stroke={K.cyan} strokeWidth={5} strokeDasharray="14 12" strokeDashoffset={-l * 120} opacity={0.8} />
        <path d="M510,812 L540,846 L570,812" fill="none" stroke={K.cyan} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: 'absolute', left: 150, top: 880, width: 780, height: 520, transform: `scale(${0.6 + 0.4 * mon})`, transformOrigin: '540px 0', opacity: mon, borderRadius: 26, background: '#0E141A', border: `5px solid ${hijau ? K.ok : K.err}`, boxShadow: hijau ? '0 0 40px rgba(69,217,154,0.45)' : '0 0 30px rgba(255,107,107,0.35)', overflow: 'hidden' }}>
        <div style={{ height: 66, background: '#151D26', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
          {['#FF6B6B', '#FFB547', '#45D99A'].map((c) => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ fontFamily: HURUF, fontWeight: 700, fontSize: 30, color: K.text, marginLeft: 12 }}>Serial Monitor</div>
          <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 28, color: chip > 0.5 ? K.cyan : K.amber, border: `2px solid ${chip > 0.5 ? K.cyan : K.amber}`, borderRadius: 10, padding: '4px 14px', transform: `scale(${chip > 0 ? 0.9 + 0.1 * chip : 1})` }}>{chip > 0.5 ? '115200 baud' : '9600 baud'}</div>
        </div>
        <div style={{ padding: '30px 30px', fontFamily: MONO, fontSize: 48, lineHeight: 1.7, color: hijau ? '#EEF3F6' : '#C9D1C8' }}>
          {baris.map((b, i) => (
            <div key={i} style={{ whiteSpace: 'nowrap' }}>{baca >= 1 ? b : resolusi(b, Math.max(0, Math.min(1, baca * 1.2 - i * 0.12)), i * 9 + 3)}</div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1450, textAlign: 'center', opacity: pr(l, 3.05, 0.3, eBack), transform: `scale(${0.6 + 0.4 * pr(l, 3.05, 0.3, eBack)})`, fontFamily: HURUF, fontWeight: 900, fontSize: 70, color: K.ok, textShadow: '0 0 30px rgba(69,217,154,0.5)' }}>✓ TERBACA</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* UNGKAP: partikel berkumpul jadi nama, lalu teaser video berikutnya  */
/* ------------------------------------------------------------------ */
const titikTeks = (teks: string, ukuran: number, langkah: number): [number, number][] => {
  const c = document.createElement('canvas');
  c.width = 1000;
  c.height = 300;
  const g = c.getContext('2d');
  if (!g) return [];
  g.fillStyle = '#fff';
  g.font = `900 ${ukuran}px "Inter Display", Inter, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(teks, 500, 150);
  const d = g.getImageData(0, 0, 1000, 300).data;
  const out: [number, number][] = [];
  for (let y = 0; y < 300; y += langkah) for (let x = 0; x < 1000; x += langkah) if (d[(y * 1000 + x) * 4 + 3] > 128) out.push([x - 500, y - 150]);
  return out;
};

export const Ungkap: React.FC<{ t: number; a: number; teaser: string }> = ({ t, a, teaser }) => {
  const l = t - a;
  const titik = useMemo(() => titikTeks('1HERTZ', 215, 7), []);
  const kristal = pr(l, 1.25, 0.35);
  const ring = pr(l, 1.2, 0.8, Easing.out(Easing.cubic));
  const tag = pr(l, 1.6, 0.4);
  const tz = pr(l, 1.95, 0.4, eBack);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: 'rgba(7,11,16,0.4)' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="pendar2" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={540} cy={830} r={120 + ring * 700} fill="none" stroke={K.cyan} strokeWidth={6 * (1 - ring)} opacity={(1 - ring) * 0.9} />
        <g filter="url(#pendar2)">
          {titik.map(([x, y], i) => {
            const sx = acak(i + 5) * 1080;
            const sy = acak(i + 905) * 1920;
            const u = pr(l, acak(i + 55) * 0.55, 0.85);
            const tx = 540 + x * 1.0;
            const ty = 830 + y * 1.0;
            const sw = Math.sin(u * Math.PI) * 60 * (acak(i + 3) - 0.5);
            const px = sx + (tx - sx) * u + sw;
            const py = sy + (ty - sy) * u - sw;
            const berkedip = 0.65 + 0.35 * Math.sin(t * 9 + i);
            return <circle key={i} cx={px} cy={py} r={u < 1 ? 4.2 : 3.4} fill={i % 7 === 0 ? '#fff' : K.cyan} opacity={(0.4 + 0.6 * u) * berkedip * (1 - 0.55 * kristal)} />;
          })}
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 710, textAlign: 'center', fontFamily: HURUF, fontWeight: 900, fontSize: 215, letterSpacing: -6, color: '#fff', opacity: kristal, textShadow: '0 0 60px rgba(79,227,236,0.7)', lineHeight: 1.2 }}>
        1<span style={{ color: K.cyan }}>HERTZ</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 990, textAlign: 'center', fontFamily: MONO, fontSize: 36, letterSpacing: 6, color: K.dim, opacity: tag, transform: `translateY(${(1 - tag) * 20}px)` }}>Coba dulu, ngerti belakangan.</div>
      <div style={{ position: 'absolute', left: 90, right: 90, top: 1160, textAlign: 'center', opacity: tz, transform: `scale(${0.8 + 0.2 * tz})` }}>
        <div style={{ fontFamily: MONO, fontSize: 32, letterSpacing: 10, color: K.cyan }}>BESOK</div>
        <div style={{ fontFamily: HURUF, fontWeight: 900, fontSize: 74, letterSpacing: -2, color: '#fff', lineHeight: 1.1 }}>{teaser}</div>
      </div>
    </AbsoluteFill>
  );
};
