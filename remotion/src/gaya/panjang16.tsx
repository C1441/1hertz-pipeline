// Kit visual video panjang 16:9: ikon bergerak, transisi 16:9, tangga, ilustrasi pembuka.
import React from 'react';
import { AbsoluteFill, Img, interpolate, Easing, staticFile } from 'remotion';
import { K, SANS, MONO, naik, pop } from './pustaka';

export const W = 1920;
export const H = 1080;
export const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const eOut = Easing.bezier(0.16, 1, 0.3, 1);
const eIn = Easing.bezier(0.7, 0, 0.84, 0);
export const acak = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** gelombang 0..1 berulang */
const gel = (t: number, hz: number, fase = 0) => 0.5 + 0.5 * Math.sin((t * hz + fase) * Math.PI * 2);

/* =================================================================== */
/* Foto / ilustrasi chip                                                */
/* =================================================================== */
export const Foto: React.FC<{ src?: string; nama: string; w: number; h: number; isi?: 'contain' | 'cover'; bulat?: boolean; kaki?: number; t?: number; a?: number; kenBurns?: boolean; kilau?: boolean }> = ({
  src, nama, w: lw, h: lh, isi = 'contain', bulat, kaki = 12, t = 0, a = 0, kenBurns, kilau,
}) => {
  const n = Math.max(2, Math.round(kaki / 2));
  const bw = Math.max(190, 40 + n * 22);
  const x0 = 200 - bw / 2;
  const kb = kenBurns ? 1 + 0.06 * interpolate(t, [a, a + 8], [0, 1], C) : 1;
  const sapu = kilau ? interpolate(t, [a + 0.4, a + 1.3], [-0.4, 1.4], { ...C, easing: Easing.inOut(Easing.cubic) }) : -1;
  return (
    <div style={{ width: lw, height: lh, borderRadius: bulat ? '50%' : 18, overflow: 'hidden', background: '#EEF1EC', boxShadow: '0 22px 50px rgba(0,0,0,0.55)', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${kb})` }}>
        {src ? (
          <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: isi }} />
        ) : (
          <svg viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <ellipse cx={200} cy={232} rx={bw * 0.62} ry={16} fill="#000" opacity={0.12} />
            {Array.from({ length: n }, (_, i) => {
              const x = 200 - ((n - 1) * 22) / 2 - 5 + i * 22;
              return (
                <g key={i}>
                  <path d={`M${x},96 h10 v-26 h-4 v-10 h-2 v10 h-4 z`} fill="#B9C2C9" stroke="#8A949C" strokeWidth={1} />
                  <path d={`M${x},204 h10 v26 h-4 v10 h-2 v-10 h-4 z`} fill="#B9C2C9" stroke="#8A949C" strokeWidth={1} />
                </g>
              );
            })}
            <rect x={x0} y={96} width={bw} height={108} rx={6} fill="#22272D" />
            <rect x={x0} y={96} width={bw} height={10} rx={4} fill="#2F363D" />
            <path d={`M${x0},138 a12,12 0 0 1 0,24`} fill="#151A1F" />
            <circle cx={x0 + 18} cy={186} r={5} fill="#151A1F" />
            <text x={210} y={158} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={Math.min(24, (bw - 50) / (nama.length * 0.62))} fill="#D7DDE2">{nama.toUpperCase()}</text>
            {!bulat && <text x={200} y={284} textAnchor="middle" fontFamily={MONO} fontSize={12} letterSpacing={2} fill="#7A858D">{kaki}-PIN DIP · ILUSTRASI</text>}
          </svg>
        )}
      </div>
      {kilau && sapu > -0.4 && sapu < 1.4 && (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent ${sapu * 100 - 18}%, rgba(255,255,255,0.55) ${sapu * 100}%, transparent ${sapu * 100 + 18}%)`, mixBlendMode: 'screen' }} />
      )}
    </div>
  );
};

/** sudut bidik HUD yang "mengunci" objek */
export const Bidik: React.FC<{ x: number; y: number; w: number; h: number; t: number; a: number; warna?: string }> = ({ x, y, w: lw, h: lh, t, a, warna = K.cyan }) => {
  const k = interpolate(t, [a, a + 0.45], [0, 1], { ...C, easing: eOut });
  const g = (1 - k) * 60;
  const L = 46;
  const op = k * (0.75 + 0.25 * gel(t, 1.2));
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: op }} data-qa="hias">
      <g stroke={warna} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d={`M${x - g},${y - g + L} v${-L} h${L}`} />
        <path d={`M${x + lw + g - L},${y - g} h${L} v${L}`} />
        <path d={`M${x - g},${y + lh + g - L} v${L} h${L}`} />
        <path d={`M${x + lw + g - L},${y + lh + g} h${L} v${-L}`} />
      </g>
      <line x1={x} x2={x + lw} y1={y + lh * ((t - a) * 0.6 % 1)} y2={y + lh * ((t - a) * 0.6 % 1)} stroke={warna} strokeOpacity={0.35 * k} strokeWidth={2} />
    </svg>
  );
};

/* =================================================================== */
/* Ikon bergerak untuk kartu kegunaan                                   */
/* =================================================================== */
export const Ikon: React.FC<{ nama: string; t: number; a: number; s?: number }> = ({ nama, t, a, s = 170 }) => {
  const d = t - a;
  const k = pop(t, a, 0.45);
  const cy = K.cyan, am = K.amber, ok = K.ok, er = K.err, tx = K.text, dim = '#3A4855';
  let isi: React.ReactNode = null;
  switch (nama) {
    case 'led': {
      const on = gel(d, 1.6) > 0.45;
      isi = (<g>
        {on && <circle cx={100} cy={78} r={58} fill={er} opacity={0.18} />}
        <path d="M70,110 v-36 a30,30 0 0 1 60,0 v36 z" fill={on ? er : '#6B2B2B'} />
        <rect x={64} y={110} width={72} height={12} rx={3} fill={on ? '#FF9A9A' : '#5A2A2A'} />
        <rect x={82} y={122} width={6} height={50} fill="#B9C2C9" /><rect x={112} y={122} width={6} height={40} fill="#B9C2C9" />
      </g>);
      break;
    }
    case 'sensor': {
      isi = (<g>
        <rect x={46} y={86} width={52} height={62} rx={6} fill={dim} stroke={cy} strokeWidth={3} />
        {[0, 1, 2].map((i) => { const p = ((d * 0.9 + i / 3) % 1); return <path key={i} d={`M${108 + p * 40},${80 - p * 20} a${30 + p * 40},${30 + p * 40} 0 0 1 0,${60 + p * 80}`} stroke={cy} strokeWidth={5} fill="none" opacity={1 - p} />; })}
      </g>);
      break;
    }
    case 'baterai': {
      const lv = (d * 0.5) % 1;
      isi = (<g>
        <rect x={40} y={62} width={110} height={70} rx={10} fill="none" stroke={tx} strokeWidth={6} />
        <rect x={150} y={84} width={10} height={26} rx={3} fill={tx} />
        <rect x={50} y={72} width={90 * lv} height={50} rx={4} fill={lv > 0.25 ? ok : er} />
        <path d="M100,72 l-14,26 h14 l-8,24 l22,-32 h-14 l8,-18 z" fill={am} />
      </g>);
      break;
    }
    case 'kode': {
      const n = Math.floor(d * 6) % 14;
      const teks = 'digitalWrite('.slice(0, n);
      isi = (<g>
        <rect x={20} y={40} width={160} height={116} rx={12} fill={dim} />
        <circle cx={38} cy={56} r={5} fill={er} /><circle cx={54} cy={56} r={5} fill={am} /><circle cx={70} cy={56} r={5} fill={ok} />
        <text x={32} y={104} fontFamily={MONO} fontSize={18} fill={cy}>{teks}{gel(d, 2) > 0.5 ? '▌' : ''}</text>
        <text x={32} y={134} fontFamily={MONO} fontSize={18} fill={K.dim}>delay(500);</text>
      </g>);
      break;
    }
    case 'robot': {
      const kedip = gel(d, 0.7) > 0.9;
      const ayun = Math.sin(d * 3) * 12;
      isi = (<g>
        <line x1={100} y1={26} x2={100} y2={48} stroke={tx} strokeWidth={5} /><circle cx={100} cy={24} r={7} fill={er} />
        <rect x={50} y={48} width={100} height={78} rx={18} fill={dim} stroke={cy} strokeWidth={4} />
        <rect x={70} y={74} width={18} height={kedip ? 3 : 18} rx={4} fill={cy} /><rect x={112} y={74} width={18} height={kedip ? 3 : 18} rx={4} fill={cy} />
        <path d="M80,108 q20,10 40,0" stroke={cy} strokeWidth={4} fill="none" />
        <g transform={`rotate(${ayun} 50 120)`}><rect x={22} y={116} width={30} height={12} rx={6} fill={tx} /></g>
        <g transform={`rotate(${-ayun} 150 120)`}><rect x={148} y={116} width={30} height={12} rx={6} fill={tx} /></g>
      </g>);
      break;
    }
    case 'ukur': {
      const sud = -70 + 140 * gel(d, 0.5);
      isi = (<g>
        <path d="M30,140 a70,70 0 0 1 140,0" fill="none" stroke={dim} strokeWidth={16} />
        <path d="M30,140 a70,70 0 0 1 70,-70" fill="none" stroke={ok} strokeWidth={16} />
        <path d="M100,70 a70,70 0 0 1 70,70" fill="none" stroke={am} strokeWidth={16} />
        <g transform={`rotate(${sud} 100 140)`}><line x1={100} y1={140} x2={100} y2={80} stroke={tx} strokeWidth={6} strokeLinecap="round" /></g>
        <circle cx={100} cy={140} r={10} fill={tx} />
      </g>);
      break;
    }
    case 'printer3d': {
      const x = 70 + 60 * gel(d, 0.6);
      const lapis = Math.floor(d * 2) % 6;
      isi = (<g>
        <rect x={30} y={30} width={140} height={140} rx={8} fill="none" stroke={tx} strokeWidth={5} />
        <line x1={30} y1={70} x2={170} y2={70} stroke={dim} strokeWidth={6} />
        <path d={`M${x - 12},62 h24 v14 l-12,14 l-12,-14 z`} fill={am} />
        {Array.from({ length: lapis + 1 }, (_, i) => <rect key={i} x={70} y={150 - i * 10} width={60} height={8} rx={2} fill={cy} opacity={0.9} />)}
      </g>);
      break;
    }
    case 'panel': {
      isi = (<g>
        <rect x={24} y={36} width={152} height={128} rx={12} fill={dim} />
        {[0, 1, 2, 3].map((i) => { const y = 60 + 30 * gel(d, 0.5 + i * 0.17, i * 0.3); return (<g key={i}><line x1={50 + i * 34} y1={54} x2={50 + i * 34} y2={146} stroke="#1D2630" strokeWidth={8} strokeLinecap="round" /><rect x={38 + i * 34} y={y + 20} width={24} height={14} rx={4} fill={[cy, am, ok, er][i]} /></g>); })}
      </g>);
      break;
    }
    case 'python': {
      const n = Math.floor(d * 5) % 11;
      isi = (<g>
        <rect x={16} y={46} width={168} height={108} rx={12} fill={dim} />
        <text x={30} y={88} fontFamily={MONO} fontSize={20} fill={am}>{'>>>'}</text>
        <text x={74} y={88} fontFamily={MONO} fontSize={20} fill={tx}>{'led.on()'.slice(0, Math.min(8, n))}</text>
        <text x={30} y={124} fontFamily={MONO} fontSize={20} fill={am}>{'>>>'}</text>
        {gel(d, 2) > 0.5 && <rect x={74} y={108} width={12} height={20} fill={cy} />}
      </g>);
      break;
    }
    case 'keyboard': {
      const tekan = Math.floor(d * 4) % 8;
      isi = (<g>
        <rect x={14} y={60} width={172} height={90} rx={12} fill={dim} />
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={26 + (i % 4) * 40} y={72 + Math.floor(i / 4) * 38 + (i === tekan ? 4 : 0)} width={32} height={30} rx={6} fill={i === tekan ? cy : '#56636F'} />)}
      </g>);
      break;
    }
    case 'protokol': {
      const geser = (d * 80) % 40;
      let path = 'M0,130';
      for (let i = 0; i < 8; i++) { const hi = acak(i + Math.floor(d * 2)) > 0.5; path += ` h20 V${hi ? 70 : 130} h20 V130`; }
      isi = (<g><g transform={`translate(${-geser},0)`}><path d={path} stroke={cy} strokeWidth={6} fill="none" /></g><text x={100} y={44} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={am}>PIO</text></g>);
      break;
    }
    case 'rumah': {
      const on = gel(d, 0.8) > 0.4;
      isi = (<g>
        <path d="M40,100 L100,48 L160,100 V164 H40 Z" fill={dim} stroke={tx} strokeWidth={5} strokeLinejoin="round" />
        <rect x={84} y={118} width={32} height={46} rx={3} fill={on ? am : '#56636F'} />
        {on && <circle cx={100} cy={136} r={40} fill={am} opacity={0.15} />}
        {[0, 1, 2].map((i) => <path key={i} d={`M${150 - i * 4},${30 + i * 2} a${14 + i * 12},${14 + i * 12} 0 0 1 ${(14 + i * 12) * 1.4},0`} stroke={cy} strokeWidth={4} fill="none" opacity={gel(d, 1.4, -i * 0.25)} />)}
      </g>);
      break;
    }
    case 'cloud': {
      const p = (d * 0.8) % 1;
      isi = (<g>
        <path d="M50,110 a30,30 0 0 1 20,-52 a40,40 0 0 1 74,10 a26,26 0 0 1 6,42 z" fill={dim} stroke={cy} strokeWidth={5} />
        <rect x={86} y={136} width={28} height={36} rx={4} fill={tx} />
        <circle cx={100} cy={170 - p * 70} r={6} fill={am} opacity={1 - p} />
      </g>);
      break;
    }
    case 'server': {
      isi = (<g>
        {[0, 1, 2].map((i) => (<g key={i}>
          <rect x={40} y={36 + i * 44} width={120} height={36} rx={6} fill={dim} stroke={tx} strokeWidth={3} />
          <circle cx={60} cy={54 + i * 44} r={6} fill={gel(d, 2.3, i * 0.37) > 0.5 ? ok : '#244'} />
          <circle cx={78} cy={54 + i * 44} r={6} fill={gel(d, 1.7, i * 0.21) > 0.6 ? am : '#442'} />
          <rect x={100} y={50 + i * 44} width={46} height={6} rx={3} fill="#56636F" />
        </g>))}
      </g>);
      break;
    }
    case 'audio': {
      isi = (<g>{Array.from({ length: 9 }, (_, i) => { const h = 20 + 90 * gel(d, 1.3 + i * 0.21, i * 0.13); return <rect key={i} x={24 + i * 18} y={100 - h / 2} width={11} height={h} rx={5} fill={i % 3 === 0 ? am : cy} />; })}</g>);
      break;
    }
    case 'synth': {
      const tekan = Math.floor(d * 3) % 7;
      isi = (<g>
        {Array.from({ length: 7 }, (_, i) => <rect key={i} x={20 + i * 23} y={50 + (i === tekan ? 4 : 0)} width={21} height={110} rx={3} fill={i === tekan ? cy : tx} />)}
        {[0, 1, 3, 4, 5].map((i) => <rect key={'h' + i} x={34 + i * 23} y={50} width={14} height={66} rx={2} fill="#0C1117" />)}
      </g>);
      break;
    }
    case 'kilat': {
      const on = gel(d, 2.2) > 0.3;
      isi = (<g>
        {on && <circle cx={100} cy={100} r={70} fill={am} opacity={0.15} />}
        <path d="M112,20 L54,110 H96 L82,180 L146,84 H104 Z" fill={on ? am : '#8A6A2E'} stroke={tx} strokeWidth={3} strokeLinejoin="round" />
      </g>);
      break;
    }
    default:
      isi = <circle cx={100} cy={100} r={50} fill={cy} />;
  }
  return (
    <svg viewBox="0 0 200 200" width={s} height={s} style={{ transform: `scale(${0.4 + 0.6 * k})`, opacity: k, overflow: 'visible' }}>{isi}</svg>
  );
};

/* =================================================================== */
/* Transisi 16:9                                                        */
/* =================================================================== */
export type Masuk16 = 'zoomMundur' | 'sapuan' | 'zoomMasuk' | 'tampar' | 'balik' | 'iris' | 'langsung';
export type Keluar16 = 'zoomTembus' | 'sapuan' | 'glitch' | 'runtuh' | 'balik' | 'terdorong' | 'tidak';
export const POLA: [Masuk16, Keluar16][] = [
  ['zoomMundur', 'sapuan'],
  ['sapuan', 'glitch'],
  ['tampar', 'zoomTembus'],
  ['iris', 'runtuh'],
  ['balik', 'balik'],
  ['zoomMasuk', 'terdorong'],
];

export const Transisi16: React.FC<{ t: number; frame: number; a: number; b: number; masuk: Masuk16; keluar: Keluar16; titik?: [number, number]; children: React.ReactNode }> = ({
  t, frame, a, b, masuk, keluar, titik = [960, 560], children,
}) => {
  const dIn = 0.38;
  const dOut = 0.3;
  const pin = masuk === 'langsung' ? 1 : interpolate(t, [a, a + dIn], [0, 1], { ...C, easing: eOut });
  const pout = keluar === 'tidak' ? 0 : interpolate(t, [b - dOut, b], [0, 1], { ...C, easing: eIn });
  let tf = '';
  let op = 1;
  let blur = 0;
  let clip: string | undefined;
  let asal = `${titik[0]}px ${titik[1]}px`;
  let persp = false;
  let terang = 1;
  if (masuk === 'zoomMundur') { tf += ` scale(${interpolate(pin, [0, 1], [1.8, 1])})`; blur += (1 - pin) * 10; op = Math.min(op, 0.3 + 0.7 * pin); }
  if (masuk === 'sapuan') { tf += ` translateX(${(1 - pin) * 1900}px) skewX(${(1 - pin) * -12}deg)`; blur += (1 - pin) * 14; }
  if (masuk === 'zoomMasuk') { tf += ` scale(${interpolate(pin, [0, 1], [0.35, 1])})`; op = Math.min(op, interpolate(pin, [0, 0.3], [0, 1], C)); }
  if (masuk === 'tampar') { const k = interpolate(t, [a, a + dIn], [0, 1], { ...C, easing: Easing.out(Easing.back(1.3)) }); tf += ` translateY(${(1 - k) * 1100}px) rotateX(${(1 - pin) * 30}deg)`; persp = true; asal = '960px 1080px'; blur += (1 - pin) * 8; }
  if (masuk === 'balik') { tf += ` rotateY(${-(1 - pin) * 90}deg)`; persp = true; terang *= 0.4 + 0.6 * pin; }
  if (masuk === 'iris') { clip = `circle(${pin * 120}% at ${titik[0]}px ${titik[1]}px)`; }
  if (keluar === 'sapuan') { tf += ` translateX(${-pout * 1900}px) skewX(${pout * 12}deg)`; blur += pout * 14; }
  if (keluar === 'zoomTembus') { tf += ` scale(${1 + pout * 6})`; op = Math.min(op, interpolate(pout, [0.5, 1], [1, 0], C)); blur += pout * 6; }
  if (keluar === 'runtuh') { tf += ` scale(${1 - pout * 0.98})`; terang *= 1 + pout * 2.5; }
  if (keluar === 'balik') { tf += ` rotateY(${pout * 90}deg)`; persp = true; terang *= 1 - pout * 0.6; }
  if (keluar === 'terdorong') { tf += ` translateY(${-pout * 300}px) scale(${1 - pout * 0.12})`; terang *= 1 - pout * 0.6; blur += pout * 6; }
  const glitch = keluar === 'glitch' && pout > 0;
  const filter = `${blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : ''} ${terang !== 1 ? `brightness(${terang.toFixed(2)})` : ''}`.trim() || undefined;
  const lapisan = <div style={{ position: 'absolute', inset: 0, transform: tf || undefined, transformOrigin: asal, opacity: op, filter, clipPath: clip }}>{children}</div>;
  return (
    <div style={{ position: 'absolute', inset: 0, perspective: persp ? 2200 : undefined }}>
      {glitch ? (
        <>
          {Array.from({ length: 10 }, (_, i) => {
            const y0 = i * 10;
            const dx = (acak(frame * 7 + i * 3.1) - 0.5) * 900 * (0.3 + pout) * (acak(frame + i) > 0.3 ? 1 : 0.15);
            return (
              <div key={i} style={{ position: 'absolute', inset: 0, clipPath: `inset(${y0}% 0 ${100 - y0 - 10}% 0)`, transform: `translateX(${dx}px)`, filter: i % 3 === 0 ? 'hue-rotate(160deg) saturate(3)' : undefined, opacity: 1 - pout * 0.4 }}>
                {children}
              </div>
            );
          })}
        </>
      ) : (
        lapisan
      )}
    </div>
  );
};

/** kilatan + garis sapuan cahaya di titik potong */
export const Kilatan: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const d = t - a;
  if (d < -0.12 || d > 0.35) return null;
  const k = interpolate(d, [-0.12, 0, 0.35], [0, 1, 0], C);
  const x = interpolate(d, [-0.12, 0.35], [-300, 2200], C);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }} data-qa="hias">
      <AbsoluteFill style={{ background: K.cyan, opacity: k * 0.12, mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: x, width: 160, background: `linear-gradient(90deg, transparent, ${K.cyan}66, transparent)`, transform: 'skewX(-18deg)', opacity: k }} />
    </AbsoluteFill>
  );
};

/* =================================================================== */
/* Tangga (dipakai di pembuka & menu)                                  */
/* =================================================================== */
export type ItemMini = { kunci: string; nama: string; ram_label: string; kaki?: number };
export const TanggaBesar: React.FC<{ t: number; item: ItemMini[]; foto: Record<string, string>; aktif?: number; selesai?: number; munculMulai?: number; jeda?: number }> = ({
  t, item, foto, aktif = -1, selesai = 0, munculMulai, jeda = 0.3,
}) => {
  const n = item.length;
  const x0 = 250;
  const dx = (1420) / (n - 1);
  const yBawah = 800;
  const naikPer = 62;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} data-qa="hias">
        {item.map((_, i) => {
          const m = munculMulai != null ? interpolate(t, [munculMulai + i * jeda, munculMulai + i * jeda + 0.35], [0, 1], { ...C, easing: eOut }) : 1;
          const x = x0 + i * dx - dx / 2 + 20;
          const y = yBawah - i * naikPer;
          return (
            <g key={i} opacity={m}>
              <rect x={x} y={y + 40 * (1 - m)} width={dx - 40} height={34} rx={6} fill={i === aktif ? 'rgba(79,227,236,0.25)' : 'rgba(140,200,230,0.06)'} stroke={i === aktif ? K.cyan : '#2C3A46'} strokeWidth={3} />
              <path d={`M${x},${y + 34} v${naikPer}`} stroke="#2C3A46" strokeWidth={3} strokeDasharray="4 6" />
              <text x={x + 14} y={y + 24} fontFamily={MONO} fontSize={18} fill={i === aktif ? K.cyan : '#56636F'}>0{i + 1}</text>
            </g>
          );
        })}
      </svg>
      {item.map((x, i) => {
        const m = munculMulai != null ? pop(t, munculMulai + i * jeda + 0.15, 0.45) : 1;
        const fokus = i === aktif;
        const done = i < selesai && aktif >= 0;
        const uk = 120 + i * 14;
        const cx = x0 + i * dx;
        const cy = yBawah - i * naikPer - uk / 2 - 85; // pusat lingkaran
        const melayang = Math.sin(t * 1.6 + i) * 6;
        return (
          <div key={i} style={{ position: 'absolute', left: cx - uk / 2, top: cy - uk / 2 + melayang, width: uk, textAlign: 'center', opacity: m * (done ? 0.5 : 1), transform: `scale(${m * (fokus ? 1.12 + 0.04 * gel(t, 1.5) : 1)})` }}>
            <div style={{ borderRadius: '50%', border: `5px solid ${fokus ? K.cyan : done ? K.ok : '#3A4855'}`, boxShadow: fokus ? `0 0 50px ${K.cyan}99` : '0 10px 30px rgba(0,0,0,0.5)' }}>
              <Foto src={foto[x.kunci]} nama={x.nama} w={uk - 10} h={uk - 10} isi="cover" bulat kaki={x.kaki} />
            </div>
            <div style={{ marginTop: 12, marginLeft: -80, marginRight: -80, fontSize: 24, fontWeight: 800, color: fokus ? K.cyan : K.text, whiteSpace: 'nowrap' }}>{x.nama}</div>
            <div style={{ fontFamily: MONO, fontSize: 20, color: done ? K.ok : K.dim, whiteSpace: 'nowrap', marginLeft: -80, marginRight: -80 }}>{done ? '✓ ' : ''}RAM {x.ram_label}</div>
          </div>
        );
      })}
    </div>
  );
};

/* =================================================================== */
/* Ilustrasi pembuka (mengikuti narasi)                                 */
/* =================================================================== */
/** 1. "otak kecil di dalam proyek elektronika": chip di tengah, jalur menyala ke LED/sensor/motor */
export const OtakProyek: React.FC<{ t: number; a: number }> = ({ t, a }) => {
  const d = t - a;
  const chip = pop(t, a + 0.1, 0.5);
  const tujuan = [
    { x: 420, y: 330, nama: 'LED', ikon: 'led' },
    { x: 1500, y: 330, nama: 'SENSOR', ikon: 'sensor' },
    { x: 420, y: 720, nama: 'MOTOR', ikon: 'ukur' },
    { x: 1500, y: 720, nama: 'LAYAR', ikon: 'kode' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {tujuan.map((p, i) => {
          const m = interpolate(t, [a + 0.5 + i * 0.25, a + 1.1 + i * 0.25], [0, 1], { ...C, easing: eOut });
          const path = `M960,545 H${(960 + p.x) / 2} V${p.y} H${p.x}`;
          const pulsa = ((d * 0.9 + i * 0.25) % 1);
          return (
            <g key={i}>
              <path d={path} stroke="#24303A" strokeWidth={10} fill="none" />
              <path d={path} stroke={K.cyan} strokeWidth={6} fill="none" pathLength={1} strokeDasharray={`${m} 1`} filter="url(#pendar16)" />
              {m >= 1 && <path d={path} stroke="#fff" strokeWidth={8} fill="none" pathLength={1} strokeDasharray="0.05 1" strokeDashoffset={-pulsa} strokeLinecap="round" />}
            </g>
          );
        })}
        <defs>
          <filter id="pendar16" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
      </svg>
      {tujuan.map((p, i) => {
        const m = pop(t, a + 1.0 + i * 0.25, 0.4);
        return (
          <div key={i} style={{ position: 'absolute', left: p.x - 100, top: p.y - 120, width: 200, textAlign: 'center', opacity: m, transform: `scale(${m})` }}>
            <div style={{ background: K.card, border: `3px solid ${K.garis}`, borderRadius: 24, padding: 12, display: 'inline-block' }}><Ikon nama={p.ikon} t={t} a={a + 1.0 + i * 0.25} s={130} /></div>
            <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: K.dim, marginTop: 8 }}>{p.nama}</div>
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 960 - 150, top: 545 - 110, transform: `scale(${chip})` }}>
        <svg width={300} height={220} viewBox="0 0 300 220">
          {Array.from({ length: 7 }, (_, i) => (<g key={i}><rect x={50 + i * 30} y={8} width={12} height={34} fill="#B9C2C9" /><rect x={50 + i * 30} y={178} width={12} height={34} fill="#B9C2C9" /></g>))}
          <rect x={30} y={40} width={240} height={140} rx={14} fill="#1D2630" stroke={K.cyan} strokeWidth={4} />
          <circle cx={150} cy={110} r={46 + 6 * gel(t, 1.2)} fill={K.cyan} opacity={0.12} />
          <text x={150} y={102} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={30} fill={K.text}>MCU</text>
          <text x={150} y={134} textAnchor="middle" fontFamily={MONO} fontSize={16} fill={K.cyan}>otak proyek</text>
        </svg>
      </div>
    </div>
  );
};

/** 2. "ukurannya beda-beda banget": siluet dari chip mungil sampai papan besar */
export const BedaUkuran: React.FC<{ t: number; a: number; item: ItemMini[]; foto: Record<string, string> }> = ({ t, a, item, foto }) => {
  const ukuran = [110, 170, 230, 200, 210, 190];
  let x = 140;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {item.map((it, i) => {
        const uk = ukuran[i] ?? 180;
        const kiri = x;
        x += uk * 1.35 + 40;
        const m = pop(t, a + 0.15 + i * 0.18, 0.45);
        return (
          <div key={i} style={{ position: 'absolute', left: kiri, top: 560 - (uk * 0.9) / 2, opacity: m, transform: `translateY(${(1 - m) * 80}px) rotate(${(1 - m) * -10}deg)` }}>
            <Foto src={foto[it.kunci]} nama={it.nama} w={uk * 1.35} h={uk * 0.9} kaki={it.kaki} />
          </div>
        );
      })}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: naik(t, a + 1.2) }}>
        <defs><marker id="panah" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={K.amber} /></marker></defs>
        <line x1={160} y1={800} x2={160 + 1560 * naik(t, a + 1.2, 0.8)} y2={800} stroke={K.amber} strokeWidth={5} markerEnd="url(#panah)" />
        <text x={160} y={850} fontFamily={MONO} fontSize={24} letterSpacing={4} fill={K.amber}>KECIL</text>
        <text x={1760} y={850} textAnchor="end" fontFamily={MONO} fontSize={24} letterSpacing={4} fill={K.amber}>BESAR</text>
      </svg>
    </div>
  );
};

/** 3. "512 byte … 1 megabyte, dua ribu kali lipat": kotak mungil vs grid raksasa + penghitung */
export const DuaRibuKali: React.FC<{ t: number; aKecil: number; aBesar: number; aKali: number }> = ({ t, aKecil, aBesar, aKali }) => {
  const kecil = pop(t, aKecil, 0.4);
  const besar = interpolate(t, [aBesar, aBesar + 1.1], [0, 1], { ...C, easing: eOut });
  const kali = pop(t, aKali, 0.45);
  const angka = Math.round(interpolate(t, [aKali, aKali + 0.8], [1, 2048], { ...C, easing: eOut }));
  const sel = 22;
  const kol = 40;
  const brs = 22;
  const total = kol * brs;
  const isi = Math.floor(besar * total);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={{ position: 'absolute', left: 170, top: 520, textAlign: 'center', opacity: kecil, transform: `scale(${kecil})` }}>
        <div style={{ width: 22, height: 22, background: K.cyan, margin: '0 auto', boxShadow: `0 0 30px ${K.cyan}` }} />
        <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 800, color: K.cyan, marginTop: 20 }}>512 B</div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: K.dim }}>ATtiny85</div>
      </div>
      <svg width={kol * sel} height={brs * sel} style={{ position: 'absolute', left: 520, top: 300, opacity: besar > 0 ? 1 : 0 }}>
        {Array.from({ length: isi }, (_, i) => <rect key={i} x={(i % kol) * sel} y={Math.floor(i / kol) * sel} width={sel - 3} height={sel - 3} fill={K.amber} opacity={0.85} />)}
      </svg>
      <div style={{ position: 'absolute', left: 520, top: 300 + brs * sel + 16, fontFamily: MONO, fontSize: 30, fontWeight: 800, color: K.amber, opacity: besar }}>1 MB · Teensy 4.1</div>
      <div style={{ position: 'absolute', left: 1180, top: 330, opacity: kali, transform: `scale(${0.6 + 0.4 * kali}) rotate(${(1 - kali) * 12 - 4}deg)` }}>
        <div style={{ fontSize: 200, fontWeight: 900, color: K.text, letterSpacing: -8, textShadow: `0 0 60px ${K.amber}aa`, background: K.bg, padding: '0 30px', borderRadius: 20, border: `5px solid ${K.amber}` }}>×{angka.toLocaleString('id-ID')}</div>
      </div>
    </div>
  );
};

/** 4. agenda: 4 hal yang dibahas tiap mikrokontroler */
export const Agenda: React.FC<{ t: number; waktu: number[] }> = ({ t, waktu }) => {
  const isi = [
    { judul: 'Spesifikasi', ikon: 'kode', warna: K.amber },
    { judul: 'Kegunaan', ikon: 'robot', warna: K.cyan },
    { judul: 'Kelebihan', ikon: 'kilat', warna: K.ok },
    { judul: 'Kelemahan', ikon: 'baterai', warna: K.err },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 320, display: 'flex', justifyContent: 'center', gap: 36 }}>
      {isi.map((x, i) => {
        const a = waktu[i];
        const k = interpolate(t, [a, a + 0.4], [0, 1], { ...C, easing: Easing.out(Easing.back(1.6)) });
        const aktif = t >= a && (i === isi.length - 1 || t < waktu[i + 1]);
        return (
          <div key={i} style={{ opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * 120}px) rotate(${(1 - k) * (i % 2 ? 8 : -8)}deg) scale(${aktif ? 1.06 : 1})` }}>
            <div style={{ width: 360, height: 400, background: K.card, border: `4px solid ${aktif ? x.warna : K.garis}`, borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, boxShadow: aktif ? `0 0 60px ${x.warna}55` : '0 20px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ fontFamily: MONO, fontSize: 26, color: x.warna }}>0{i + 1}</div>
              <Ikon nama={x.ikon} t={t} a={a} s={160} />
              <div style={{ fontSize: 44, fontWeight: 900, color: K.text }}>{x.judul}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
