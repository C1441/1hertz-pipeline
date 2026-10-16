// UJI guidebook motion graphics — topik baud rate Serial Monitor (Seri A). Tanpa narasi, dengan SFX.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { K, SANS, MONO, naik, pop, Svg, Ikon, Pill, AdeganSub } from '../v2/pustaka';
import { C, Kerangka3, Adegan3, Hantaman, Sinyal, Kursor, Grain, Sfx, Bab, Bunyi } from './gb';

export const DURASI = 37;

const ADEGAN: AdeganSub[] = [
  { mulai: 0, selesai: 3, vo: 'Serial Monitor-mu cuma keluar huruf aneh kayak gini?', kunci: 'aneh' },
  { mulai: 3, selesai: 7, vo: 'Itu bukan error kode. Itu baud rate yang beda.', kunci: 'baud' },
  { mulai: 7, selesai: 14, vo: 'Baud itu kecepatan kirim data. Board kirim 115200, monitor baca di 9600. Bit-nya kebaca salah, jadilah sampah.', kunci: 'salah' },
  { mulai: 14, selesai: 20, vo: 'Aturannya: angka di Serial.begin harus sama dengan angka di Serial Monitor.', kunci: 'sama' },
  { mulai: 20, selesai: 28, vo: 'Tiap board beda kebiasaan. Contoh Arduino pakai 9600, log boot ESP32 115200, ESP8266 malah 74880.', kunci: '74880' },
  { mulai: 28, selesai: 32, vo: 'Board USB native kayak Leonardo? Baud-nya nggak ngaruh.', kunci: 'Leonardo' },
  { mulai: 32, selesai: 37, vo: 'Samakan angkanya, teks langsung terbaca. Board-mu pakai baud berapa? Tulis di komentar.', kunci: 'komentar' },
];

const BAB: Bab[] = [
  { a: 0, b: 3, l1: 'Serial Monitor', l2: 'isinya huruf aneh?', warna: 'err' },
  { a: 3.9, b: 7, l1: 'Bukan error kode,', l2: 'baud-nya beda', warna: 'amber' },
  { a: 7, b: 14, l1: 'Dibaca terlalu lambat,', l2: 'bit-nya meleset', warna: 'err' },
  { a: 14, b: 20, l1: 'Angkanya', l2: 'harus sama', warna: 'cyan' },
  { a: 20, b: 28, l1: 'Tiap board', l2: 'beda kebiasaan', warna: 'cyan' },
  { a: 28, b: 32, l1: 'USB native?', l2: 'Baud tak ngaruh', warna: 'cyan' },
  { a: 32.9, b: 36.4, l1: 'Samakan angkanya,', l2: 'langsung terbaca', warna: 'ok' },
];

const BUNYI: Bunyi[] = [
  { t: 0.12, f: 'beep', v: 0.45 },
  { t: 1.4, f: 'buzz', v: 0.45 },
  { t: 3.0, f: 'impact', v: 0.6 },
  { t: 3.9, f: 'whoosh', v: 0.35 },
  { t: 4.3, f: 'pop', v: 0.35 },
  { t: 4.9, f: 'pop', v: 0.35 },
  { t: 5.3, f: 'buzz', v: 0.35 },
  { t: 7.0, f: 'whoosh', v: 0.35 },
  { t: 9.9, f: 'pop', v: 0.4 },
  { t: 10.2, f: 'pop', v: 0.4 },
  { t: 12.0, f: 'glitch', v: 0.4 },
  { t: 14.0, f: 'whoosh', v: 0.35 },
  { t: 16.0, f: 'klik', v: 0.5 },
  { t: 17.2, f: 'klik', v: 0.5 },
  { t: 17.6, f: 'ding', v: 0.45 },
  { t: 20.0, f: 'whoosh', v: 0.35 },
  { t: 21.0, f: 'pop', v: 0.35 },
  { t: 23.2, f: 'pop', v: 0.35 },
  { t: 25.4, f: 'pop', v: 0.35 },
  { t: 28.0, f: 'whoosh', v: 0.35 },
  { t: 28.8, f: 'klik', v: 0.45 },
  { t: 29.6, f: 'klik', v: 0.45 },
  { t: 30.4, f: 'klik', v: 0.45 },
  { t: 30.8, f: 'ding', v: 0.35 },
  { t: 31.3, f: 'riser', v: 0.35 },
  { t: 32.0, f: 'impact', v: 0.6 },
  { t: 33.2, f: 'ding', v: 0.4 },
  { t: 34.5, f: 'pop', v: 0.4 },
  { t: 36.5, f: 'beep', v: 0.4 },
];

/* ---------------- util ---------------- */
const acak = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const HURUF_RUSAK = 'ÿþÐø¤§x~ÎÕ¬®¿÷ÆËñ¦¨°±µ¶×ßå';
const barisRusak = (i: number) => {
  const n = 22 + Math.floor(acak(i * 7.1) * 22);
  let s = '';
  for (let k = 0; k < n; k++) s += acak(i * 31 + k * 3.7) < 0.12 ? ' ' : HURUF_RUSAK[Math.floor(acak(i * 13 + k * 1.3) * HURUF_RUSAK.length)];
  return s;
};
const barisBersih = (i: number) => `Halo dari ESP32! #${i + 1}`;

/* ---------------- komponen: jendela Serial Monitor ---------------- */
type Monitor = {
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  mulai: number;
  laju: number;
  tBersih: number; // baris yang muncul setelah waktu ini terbaca
  baud: string;
  sorotBaud?: 'err' | 'cyan' | null;
  daftar?: { buka: boolean; sorot: number } | null;
  ukuran?: number;
};
const PILIHAN_BAUD = ['9600 baud', '57600 baud', '74880 baud', '115200 baud'];
const SerialMonitor: React.FC<Monitor> = ({ t, x, y, w: L, h, mulai, laju, tBersih, baud, sorotBaud = null, daftar = null, ukuran = 30 }) => {
  const lh = ukuran * 1.5;
  const atasIsi = 150;
  const muat = Math.floor((h - atasIsi - 24) / lh);
  const jumlah = Math.max(0, Math.floor((t - mulai) * laju) + 1);
  const awal = Math.max(0, jumlah - muat);
  const den = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
  const bx = L - 270;
  const warnaSorot = sorotBaud === 'err' ? K.err : K.cyan;
  return (
    <g transform={`translate(${x},${y})`}>
      <g filter="url(#bayang)">
        <rect width={L} height={h} rx={18} fill="#0A0E12" />
      </g>
      <rect width={L} height={h} rx={18} fill="none" stroke="#2E3B48" strokeWidth={3} />
      <rect width={L} height={74} rx={18} fill="#151D26" />
      <rect y={56} width={L} height={18} fill="#151D26" />
      <text x={30} y={48} fontFamily={SANS} fontWeight={600} fontSize={28} fill={K.text}>Serial Monitor</text>
      <rect x={bx - 190} y={14} width={170} height={46} rx={8} fill="#0E141A" stroke="#33404D" strokeWidth={2} />
      <text x={bx - 172} y={46} fontFamily={SANS} fontSize={24} fill={K.dim}>New Line</text>
      <path d={`M${bx - 46},32 l8,8 l8,-8`} fill="none" stroke={K.dim} strokeWidth={3} strokeLinecap="round" />
      <rect x={bx} y={14} width={250} height={46} rx={8} fill="#0E141A" stroke={sorotBaud ? warnaSorot : '#33404D'} strokeWidth={sorotBaud ? 3 : 2} />
      {sorotBaud && <rect x={bx - 6} y={8} width={262} height={58} rx={11} fill="none" stroke={warnaSorot} strokeWidth={3} opacity={sorotBaud === 'err' ? den : 0.5} />}
      <text x={bx + 18} y={46} fontFamily={SANS} fontWeight={600} fontSize={26} fill={sorotBaud === 'err' ? K.err : sorotBaud === 'cyan' ? K.cyan : K.text}>{baud}</text>
      <path d={`M${bx + 216},32 l8,8 l8,-8`} fill="none" stroke={K.dim} strokeWidth={3} strokeLinecap="round" />
      <rect x={20} y={88} width={L - 40} height={46} rx={8} fill="#0E141A" stroke="#26313C" strokeWidth={2} />
      <text x={38} y={119} fontFamily={SANS} fontSize={22} fill="#4F5D69">Message (Enter to send)</text>
      {Array.from({ length: Math.min(muat, jumlah) }, (_, k) => {
        const i = awal + k;
        const tMuncul = mulai + i / laju;
        const bersih = tMuncul >= tBersih;
        const teks = bersih ? barisBersih(i) : barisRusak(i);
        const terakhir = i === jumlah - 1;
        const bagian = terakhir ? Math.min(1, ((t - tMuncul) * laju) / 0.7) : 1;
        return (
          <text key={i} x={30} y={atasIsi + 18 + k * lh + ukuran * 0.8} fontFamily={MONO} fontSize={ukuran} fill={bersih ? K.text : '#C9D3DA'} opacity={bersih ? 1 : 0.85}>
            {teks.slice(0, Math.max(1, Math.round(teks.length * bagian)))}
          </text>
        );
      })}
      {daftar?.buka && (
        <g>
          <g filter="url(#bayang)">
            <rect x={bx} y={66} width={250} height={PILIHAN_BAUD.length * 50 + 12} rx={10} fill="#1A232D" stroke="#3A4754" strokeWidth={2} />
          </g>
          {PILIHAN_BAUD.map((p, k) => (
            <g key={p}>
              {daftar.sorot === k && <rect x={bx + 6} y={72 + k * 50} width={238} height={46} rx={7} fill={K.cyan} opacity={0.2} />}
              <text x={bx + 20} y={104 + k * 50} fontFamily={SANS} fontSize={24} fill={daftar.sorot === k ? K.cyan : K.text}>{p}</text>
            </g>
          ))}
        </g>
      )}
    </g>
  );
};

/* ================================================================== */
export const UjiBaud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // pembuka: monitor mekar dari garis sinyal; penutup: kembali ke garis
  const mekar = interpolate(t, [0.25, 0.6], [0.02, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const kuncup = interpolate(t, [36.0, 36.35], [1, 0.02], { ...C, easing: Easing.in(Easing.cubic) });
  const sinyalOp = Math.max(interpolate(t, [0, 0.55, 0.75], [1, 1, 0], C), interpolate(t, [36.1, 36.3], [0, 1], C));
  return (
    <AbsoluteFill>
      <Kerangka3 t={t} tag="1HERTZ · SERIAL" bab={BAB} adegan={ADEGAN} sumber="ILUSTRASI · ARDUINO IDE 2" hud="CH1 · UART">
        <div style={{ position: 'absolute', inset: 0, transform: `scaleY(${t < 1 ? mekar : kuncup})`, transformOrigin: '540px 470px' }}>
          <Adegan3 t={t} a={0} b={3}>
            <Pembuka t={t} />
          </Adegan3>
          <Adegan3 t={t} a={3.9} b={7}>
            <Banding t={t} />
          </Adegan3>
          <Adegan3 t={t} a={7} b={14} masukDari="dorong">
            <Gelombang t={t} />
          </Adegan3>
          <Adegan3 t={t} a={14} b={20}>
            <Samakan t={t} />
          </Adegan3>
          <Adegan3 t={t} a={20} b={28} masukDari="dorong">
            <Datasheet t={t} />
          </Adegan3>
          <Adegan3 t={t} a={28} b={32}>
            <UsbNative t={t} />
          </Adegan3>
          <Adegan3 t={t} a={32.9} b={36.4} masukDari="pudar">
            <Penutup t={t} />
          </Adegan3>
        </div>
      </Kerangka3>
      <Sinyal t={t} pulsa={t < 5 ? 0.12 : 36.45} kelihatan={sinyalOp} y={820} />
      <Hantaman t={t} a={3.0} b={3.9} kata="BAUD." warna="amber" />
      <Hantaman t={t} a={32.0} b={32.9} kata="TERBACA." warna="cyan" />
      <Grain frame={frame} />
      <Sfx daftar={BUNYI} />
    </AbsoluteFill>
  );
};

/* ---------------- 0–3: monitor penuh karakter acak ---------------- */
const Pembuka: React.FC<{ t: number }> = ({ t }) => {
  const getar = t > 1.4 && t < 1.6 ? Math.sin(t * 160) * 8 : 0;
  return (
    <Svg>
      <g transform={`translate(${getar},0)`}>
        <SerialMonitor t={t} x={40} y={40} w={1000} h={860} mulai={-1.2} laju={7} tBersih={99} baud="9600 baud" sorotBaud={t > 2.0 ? 'err' : null} />
      </g>
      <Ikon x={960} y={250} r={40} jenis="err" s={pop(t, 1.4)} />
    </Svg>
  );
};

/* ---------------- 3.9–7: kode benar ≠ monitor ---------------- */
const Banding: React.FC<{ t: number }> = ({ t }) => {
  const kartu = (y: number, a: number, isi: React.ReactNode, warna: string) => {
    const k = naik(t, a, 0.35);
    return (
      <g opacity={k} transform={`translate(${(1 - k) * -40},0)`}>
        <g filter="url(#bayang)">
          <rect x={90} y={y} width={900} height={280} rx={22} fill={K.card} />
        </g>
        <rect x={90} y={y} width={900} height={280} rx={22} fill="none" stroke={warna} strokeOpacity={0.8} strokeWidth={3} />
        {isi}
      </g>
    );
  };
  return (
    <Svg>
      {kartu(
        110,
        4.0,
        <>
          <text x={130} y={170} fontFamily={MONO} fontSize={24} letterSpacing={4} fill={K.dim}>BOARD KIRIM</text>
          <text x={130} y={258} fontFamily={MONO} fontWeight={700} fontSize={52} fill={K.text}>
            Serial.begin(<tspan fill={K.cyan}>115200</tspan>);
          </text>
          <g opacity={naik(t, 4.6)}>
            <Ikon x={152} y={330} r={22} jenis="ok" />
            <text x={188} y={341} fontFamily={SANS} fontWeight={700} fontSize={30} fill={K.ok}>kode benar</text>
          </g>
        </>,
        K.cyan,
      )}
      <g transform={`translate(540,545) scale(${pop(t, 5.3)})`}>
        <text y={52} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={170} fill={K.err}>≠</text>
      </g>
      {kartu(
        640,
        4.6,
        <>
          <text x={130} y={700} fontFamily={MONO} fontSize={24} letterSpacing={4} fill={K.dim}>SERIAL MONITOR BACA</text>
          <text x={130} y={800} fontFamily={MONO} fontWeight={800} fontSize={72} fill={K.err}>9600<tspan fontSize={40} fill={K.dim}> baud</tspan></text>
          <text x={130} y={870} fontFamily={SANS} fontSize={30} fill={K.dim} opacity={naik(t, 5.6)}>kecepatannya beda</text>
        </>,
        K.err,
      )}
    </Svg>
  );
};

/* ---------------- 7–14: gelombang UART ---------------- */
// idle, frame 'H' (0x48), frame 'i' (0x69), idle — LSB dulu, start 0, stop 1
const BIT = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];
const X0 = 60;
const BW = 960 / BIT.length;
const bx = (i: number) => X0 + i * BW;
const gelombang = (yTinggi: number, yRendah: number) => {
  let d = `M${X0},${BIT[0] ? yTinggi : yRendah}`;
  BIT.forEach((b, i) => {
    const y = b ? yTinggi : yRendah;
    d += ` V${y} H${bx(i + 1)}`;
  });
  return d;
};
const Gelombang: React.FC<{ t: number }> = ({ t }) => {
  const lebar = interpolate(t, [7.3, 8.7], [0, 980], { ...C, easing: Easing.inOut(Easing.cubic) });
  const lebarB = interpolate(t, [10.5, 11.0], [0, 980], C);
  const dataIdx = [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19];
  const sampelB = [7, 19];
  return (
    <Svg>
      <defs>
        <clipPath id="klipA">
          <rect x={0} y={0} width={X0 + lebar} height={500} />
        </clipPath>
        <clipPath id="klipB">
          <rect x={0} y={480} width={X0 + lebarB} height={400} />
        </clipPath>
      </defs>
      {/* jalur A: dibaca 115200 */}
      <text x={X0} y={64} fontFamily={MONO} fontSize={24} letterSpacing={3} fill={K.dim}>SINYAL TX · 115200 BAUD</text>
      <line x1={X0} y1={300} x2={1020} y2={300} stroke="#22303C" strokeWidth={2} />
      <g clipPath="url(#klipA)">
        <path d={gelombang(190, 280)} fill="none" stroke={K.cyan} strokeWidth={5} strokeLinejoin="round" filter="url(#pendar)" />
        <rect x={bx(1)} y={150} width={BW * 10} height={24} rx={6} fill={K.cyan} opacity={0.1} />
        <rect x={bx(11)} y={150} width={BW * 10} height={24} rx={6} fill={K.cyan} opacity={0.1} />
      </g>
      {dataIdx.map((i, k) => (
        <circle key={i} cx={bx(i) + BW / 2} cy={BIT[i] ? 190 : 280} r={8} fill={K.ok} opacity={naik(t, 8.8 + k * 0.06, 0.15)} />
      ))}
      <g transform={`translate(${bx(1) + BW * 5},150) scale(${pop(t, 9.9)})`}>
        <text textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={56} fill={K.ok}>H</text>
      </g>
      <g transform={`translate(${bx(11) + BW * 5},150) scale(${pop(t, 10.2)})`}>
        <text textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={56} fill={K.ok}>i</text>
      </g>
      <g opacity={naik(t, 10.3)}>
        <Ikon x={X0 + 22} y={372} r={22} jenis="ok" />
        <text x={X0 + 58} y={383} fontFamily={SANS} fontWeight={700} fontSize={30} fill={K.text}>dibaca 115200 → “Hi”</text>
      </g>

      {/* jalur B: dibaca 9600 */}
      <g opacity={naik(t, 10.4)}>
        <text x={X0} y={500} fontFamily={MONO} fontSize={24} letterSpacing={3} fill={K.dim}>DIBACA DI 9600 · 12× LEBIH LAMBAT</text>
        <line x1={X0} y1={700} x2={1020} y2={700} stroke="#22303C" strokeWidth={2} />
      </g>
      <g clipPath="url(#klipB)">
        <path d={gelombang(590, 680)} fill="none" stroke={K.cyan} strokeOpacity={0.55} strokeWidth={5} strokeLinejoin="round" />
        {[1, 13].map((s, k) => (
          <rect key={s} x={bx(s) + 3} y={560} width={Math.min(BW * 12, bx(BIT.length) - bx(s)) - 6} height={150} rx={10} fill="none" stroke={K.err} strokeWidth={2} strokeDasharray="8 8" opacity={naik(t, 11.0 + k * 0.5, 0.2)} />
        ))}
      </g>
      {sampelB.map((i, k) => (
        <circle key={i} cx={bx(i) + BW / 2} cy={BIT[i] ? 590 : 680} r={12} fill={K.err} opacity={naik(t, 11.1 + k * 0.5, 0.15)} />
      ))}
      <g opacity={naik(t, 12.0)}>
        <Ikon x={X0 + 22} y={782} r={22} jenis="err" />
        <text x={X0 + 58} y={793} fontFamily={SANS} fontWeight={700} fontSize={30} fill={K.text}>
          dibaca 9600 → “<tspan fill={K.err}>ÿ</tspan>”
        </text>
        <text x={X0} y={860} fontFamily={SANS} fontSize={30} fill={K.dim} opacity={naik(t, 12.6)}>titik baca terlalu jarang, bit terlewat</text>
      </g>
    </Svg>
  );
};

/* ---------------- 14–20: samakan angka (kode ↔ dropdown) ---------------- */
const KODE = ['void setup() {', '  Serial.begin(115200);', '}', 'void loop() {', '  Serial.println("Halo dari ESP32!");', '}'];
const Samakan: React.FC<{ t: number }> = ({ t }) => {
  const cw = 19.3;
  const angkaX = 150 + 15 * cw;
  // jalur kursor
  const kx = interpolate(t, [14.8, 15.9, 16.3, 16.8], [930, 855, 855, 820], { ...C, easing: Easing.inOut(Easing.cubic) });
  const ky = interpolate(t, [14.8, 15.9, 16.3, 16.8], [1010, 462, 462, 663], { ...C, easing: Easing.inOut(Easing.cubic) });
  const buka = t >= 16.0 && t < 17.2;
  const sudah = t >= 17.2;
  const sama = naik(t, 17.6);
  return (
    <Svg>
      <g filter="url(#bayang)">
        <rect x={90} y={30} width={900} height={300} rx={18} fill="#0A0E12" />
      </g>
      <rect x={90} y={30} width={900} height={300} rx={18} fill="none" stroke="#2E3B48" strokeWidth={3} />
      {KODE.map((baris, i) => (
        <g key={i}>
          <text x={112} y={84 + i * 42} fontFamily={MONO} fontSize={26} fill="#4A5763">{i + 1}</text>
          <text x={150} y={84 + i * 42} fontFamily={MONO} fontSize={32} fill={i === 1 ? K.text : '#9DAAB5'} style={{ fontVariantLigatures: 'none', whiteSpace: 'pre' }}>
            {baris}
          </text>
        </g>
      ))}
      <rect x={angkaX - 6} y={92} width={6 * cw + 12} height={44} rx={8} fill={K.cyan} fillOpacity={0.15} stroke={K.cyan} strokeWidth={3} opacity={naik(t, 14.5)} />
      <SerialMonitor
        t={t}
        x={90}
        y={420}
        w={900}
        h={540}
        mulai={13.0}
        laju={5}
        tBersih={17.4}
        ukuran={26}
        baud={sudah ? '115200 baud' : '9600 baud'}
        sorotBaud={sudah ? 'cyan' : t > 15.0 ? 'err' : null}
        daftar={buka ? { buka: true, sorot: t > 16.7 ? 3 : 0 } : null}
      />
      {/* garis "sama dengan" */}
      <g opacity={sama}>
        <path d={`M${angkaX + 58},140 C${angkaX + 58},300 860,300 860,428`} fill="none" stroke={K.cyan} strokeWidth={4} strokeDasharray="10 10" />
        <g transform={`translate(${(angkaX + 58 + 860) / 2 + 30},290) scale(${pop(t, 17.6)})`}>
          <circle r={38} fill={K.cyan} />
          <text y={22} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={60} fill={K.bg}>=</text>
        </g>
      </g>
      <Kursor t={t} x={kx} y={ky} klik={t < 17 ? 16.0 : 17.2} kelihatan={interpolate(t, [14.7, 14.9, 18.4, 18.7], [0, 1, 1, 0], C)} />
    </Svg>
  );
};

/* ---------------- 20–28: lembar datasheet ---------------- */
const INK = '#0C1117';
const Datasheet: React.FC<{ t: number }> = ({ t }) => {
  const baris = [
    { a: 21.0, nama: 'Arduino Uno', ket: 'Serial.begin di contoh resmi', nilai: 9600, warna: '#0E8F99' },
    { a: 23.2, nama: 'ESP32', ket: 'log boot ROM', nilai: 115200, warna: '#0E8F99' },
    { a: 25.4, nama: 'ESP8266', ket: 'log boot ROM', nilai: 74880, warna: '#C77700' },
  ];
  return (
    <Svg>
      <g filter="url(#bayang)">
        <rect x={50} y={30} width={980} height={960} rx={16} fill="#EEF1EC" />
      </g>
      {Array.from({ length: 17 }, (_, i) => (
        <line key={i} x1={50} y1={150 + i * 50} x2={1030} y2={150 + i * 50} stroke="#DDE3DC" strokeWidth={1.5} />
      ))}
      <rect x={50} y={30} width={980} height={110} rx={16} fill={INK} />
      <rect x={50} y={110} width={980} height={30} fill={INK} />
      <text x={90} y={104} fontFamily={SANS} fontWeight={900} fontSize={52} fill="#EEF1EC">LEMBAR 3-A</text>
      <text x={470} y={78} fontFamily={MONO} fontWeight={700} fontSize={22} letterSpacing={3} fill="#EEF1EC">BAUD BAWAAN</text>
      <text x={470} y={108} fontFamily={MONO} fontSize={18} letterSpacing={2} fill="#8B9AA6">CEK SEBELUM BUKA SERIAL MONITOR</text>
      <text x={90} y={210} fontFamily={MONO} fontSize={22} letterSpacing={3} fill="#5A6670">BOARD · KONTEKS</text>
      <text x={990} y={210} textAnchor="end" fontFamily={MONO} fontSize={22} letterSpacing={3} fill="#5A6670">BAUD</text>
      <line x1={90} y1={228} x2={990} y2={228} stroke={INK} strokeWidth={2} />
      {baris.map((b, i) => {
        const k = naik(t, b.a, 0.35);
        const y = 330 + i * 230;
        const nilai = Math.round(interpolate(t, [b.a + 0.1, b.a + 0.8], [0, b.nilai], { ...C, easing: Easing.out(Easing.cubic) }));
        return (
          <g key={b.nama} opacity={k} transform={`translate(${(1 - k) * -40},0)`}>
            <text x={90} y={y} fontFamily={SANS} fontWeight={800} fontSize={44} fill={INK}>{b.nama}</text>
            <text x={90} y={y + 48} fontFamily={SANS} fontSize={28} fill="#45525C">{b.ket}</text>
            <text x={990} y={y + 12} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={68} fill={b.warna}>{nilai}</text>
            {b.nilai === 74880 && (
              <text x={990} y={y + 56} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#C77700" opacity={naik(t, 26.2)}>angka tak biasa</text>
            )}
            <line x1={90} y1={y + 92} x2={990} y2={y + 92} stroke="#C9D1C8" strokeWidth={2} />
          </g>
        );
      })}
      <text x={90} y={950} fontFamily={MONO} fontSize={20} fill="#5A6670" opacity={naik(t, 26.5)}>Sumber: Arduino Docs (Serial.begin) · Espressif esptool docs</text>
    </Svg>
  );
};

/* ---------------- 28–32: USB native, baud tak ngaruh ---------------- */
const UsbNative: React.FC<{ t: number }> = ({ t }) => {
  const nilai = t < 28.8 ? '9600 baud' : t < 29.6 ? '57600 baud' : t < 30.4 ? '115200 baud' : '230400 baud';
  const klik = t < 29.6 ? 28.8 : t < 30.4 ? 29.6 : 30.4;
  return (
    <Svg>
      <g opacity={naik(t, 28.1)}>
        <rect x={40} y={34} width={600} height={56} rx={28} fill="none" stroke={K.cyan} strokeWidth={2} />
        <text x={70} y={72} fontFamily={MONO} fontWeight={700} fontSize={24} letterSpacing={3} fill={K.cyan}>PORT USB NATIVE · LEONARDO</text>
      </g>
      <SerialMonitor t={t} x={40} y={120} w={1000} h={700} mulai={26.0} laju={6} tBersih={0} baud={nilai} sorotBaud="cyan" />
      <Kursor t={t} x={905} y={162} klik={klik} kelihatan={interpolate(t, [28.3, 28.5], [0, 1], C)} />
      <g opacity={naik(t, 30.8)}>
        <Ikon x={300} y={905} r={30} jenis="ok" />
        <text x={346} y={918} fontFamily={SANS} fontWeight={800} fontSize={40} fill={K.ok}>tetap terbaca</text>
      </g>
    </Svg>
  );
};

/* ---------------- 32.9–36.4: penutup (callback pembuka, versi beres) ---------------- */
const Penutup: React.FC<{ t: number }> = ({ t }) => (
  <Svg>
    <SerialMonitor t={t} x={40} y={40} w={1000} h={860} mulai={30.0} laju={7} tBersih={0} baud="115200 baud" sorotBaud="cyan" />
    <Ikon x={960} y={250} r={40} jenis="ok" s={pop(t, 33.2)} />
    <Pill t={t} a={34.5} x={540} y={985} teks="Tulis di komentar ↓" />
  </Svg>
);
