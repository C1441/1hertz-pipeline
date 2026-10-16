// PROTOTIPE visual v2 1Hertz — TIDAK dipakai pipeline.
// Prinsip: gambar dulu (objek nyata memenuhi layar), satu papan bertahan per bab,
// warna bermakna (merah masalah, cyan proses, hijau beres), subtitle tenang di pita bawah.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const DURASI = 38;

const K = {
  bg: '#0C1117',
  band: '#06090C',
  text: '#EEF3F6',
  dim: '#8B9AA6',
  card: 'rgba(17,25,34,0.94)',
  cyan: '#4FE3EC',
  amber: '#FFB547',
  ok: '#45D99A',
  err: '#FF6B6B',
};
const SANS = 'Inter, "DejaVu Sans", sans-serif';
const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const naik = (t: number, a: number, d = 0.35) => interpolate(t, [a, a + d], [0, 1], { ...C, easing: ease });
/** 0→1→0 di jendela [a,b]; kalau a = 0 langsung tampil di frame pertama */
const jendela = (t: number, a: number, b: number, d = 0.25) =>
  a === 0 ? interpolate(t, [b - d, b], [1, 0], C) : interpolate(t, [a, a + d, b - d, b], [0, 1, 1, 0], C);

/* ---------------- data contoh (dari contoh-konten.json) ---------------- */
const ADEGAN = [
  { mulai: 0, selesai: 3, vo: 'Tombolmu kadang nggak kebaca? Bisa jadi gara-gara delay.', kunci: 'delay' },
  { mulai: 3, selesai: 9, vo: 'Waktu delay jalan, Arduino berhenti total, nggak ngecek apa pun.', kunci: 'berhenti' },
  { mulai: 9, selesai: 15, vo: 'Millis beda. Dia cuma ngasih tahu sudah berapa milidetik sejak board nyala.', kunci: 'millis' },
  { mulai: 15, selesai: 24, vo: 'Jadi kamu tinggal cek, sudah lewat satu detik belum? Kalau sudah, kedipkan LED. Kalau belum, lanjut kerjain yang lain, misalnya baca tombol.', kunci: 'cek' },
  { mulai: 24, selesai: 30, vo: 'Hasilnya, LED tetap kedip, tombol tetap responsif.', kunci: 'responsif' },
  { mulai: 30, selesai: 35, vo: 'Satu aturan: kalau programmu harus ngerjain lebih dari satu hal, tinggalin delay, pakai millis.', kunci: 'millis' },
  { mulai: 35, selesai: 38, vo: 'Mau versi dua LED beda kecepatan? Tulis di komentar.', kunci: 'komentar' },
];

const JUDUL = [
  { a: 0, b: 3, l1: 'Tombol ditekan,', l2: 'Arduino cuek?', w: K.err },
  { a: 3, b: 9, l1: 'delay() bikin Arduino', l2: 'berhenti total', w: K.err },
  { a: 9, b: 15, l1: 'millis() cuma', l2: 'lihat jam', w: K.cyan },
  { a: 15, b: 24, l1: 'Cek waktunya,', l2: 'jangan menunggu', w: K.cyan },
  { a: 24, b: 30, l1: 'Hasilnya:', l2: 'dua-duanya jalan', w: K.ok },
  { a: 30, b: 35, l1: 'Tugas lebih dari satu?', l2: 'Pakai millis()', w: K.ok },
  { a: 35, b: 38, l1: 'Mau versi', l2: '2 LED beda kecepatan?', w: K.amber },
];

const TEKAN_GAGAL = [0.35, 1.55, 2.55];
const TEKAN_OK = [24.6, 25.7, 26.8, 27.9];

/* ---------------- geometri papan (koordinat panggung 1080 x 1060) ---------------- */
const BOARD = { x: 100, y: 340, w: 540, h: 250 };
const LED = { x: 850, y: 230 };
const BTN = { x: 850, y: 740 };
const KABEL_LED = 'M574,364 C574,290 780,420 836,358';
const KABEL_BTN = 'M574,566 C574,700 680,740 770,740';

/* ---------------- util tekan ---------------- */
const tekanan = (t: number, daftar: number[]) => {
  let m = 0;
  for (const p of daftar) {
    const d = t - p;
    if (d < 0 || d > 0.3) continue;
    m = Math.max(m, d < 0.07 ? d / 0.07 : d < 0.15 ? 1 : 1 - (d - 0.15) / 0.15);
  }
  return m;
};
const terakhir = (t: number, daftar: number[]) => {
  let r = -99;
  for (const p of daftar) if (p <= t) r = p;
  return r;
};

/* ================================================================== */
export const PrototipeV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: K.bg, fontFamily: SANS }}>
      <Latar t={t} />
      <BarAtas />
      <Judul t={t} />
      <div style={{ position: 'absolute', top: 350, left: 0, width: 1080, height: 1060 }}>
        <Panggung t={t} />
      </div>
      <div style={{ position: 'absolute', top: 1392, width: '100%', textAlign: 'center', fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: '#5D6B78' }}>
        ILUSTRASI · ARDUINO / ESP32
      </div>
      <Subtitle t={t} />
    </AbsoluteFill>
  );
};

/* ---------------- latar ---------------- */
const Latar: React.FC<{ t: number }> = () => (
  <AbsoluteFill>
    <AbsoluteFill
      style={{
        backgroundImage: 'radial-gradient(rgba(140,200,230,0.10) 1.6px, transparent 1.8px)',
        backgroundSize: '36px 36px',
      }}
    />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 38% at 50% 42%, rgba(79,227,236,0.07), transparent 70%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.55))' }} />
  </AbsoluteFill>
);

const BarAtas: React.FC = () => (
  <div style={{ position: 'absolute', top: 64, left: 56, right: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: '#0C1117', background: K.cyan, borderRadius: 999, padding: '8px 20px' }}>
      1HERTZ · ARDUINO
    </div>
    <div style={{ fontFamily: MONO, fontSize: 24, color: '#5D6B78' }}>@1hertz_lab</div>
  </div>
);

/* ---------------- judul bab 2 baris ---------------- */
const Judul: React.FC<{ t: number }> = ({ t }) => (
  <>
    {JUDUL.map((j, i) => {
      const op = jendela(t, j.a, j.b, 0.22);
      if (op <= 0) return null;
      const geser = j.a === 0 ? 0 : (1 - naik(t, j.a, 0.4)) * 24;
      return (
        <div key={i} style={{ position: 'absolute', top: 150, width: '100%', textAlign: 'center', opacity: op, transform: `translateY(${geser}px)` }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: K.text, letterSpacing: -1.5, lineHeight: 1.08 }}>{j.l1}</div>
          <div style={{ fontSize: 72, fontWeight: 800, color: j.w, letterSpacing: -1.5, lineHeight: 1.08 }}>{j.l2}</div>
        </div>
      );
    })}
  </>
);

/* ---------------- panggung ---------------- */
/** transisi zoom antar-adegan: masuk dari kecil, keluar membesar */
const adegan = (t: number, a: number, b: number) => {
  const masuk = a === 0 ? 1 : naik(t, a, 0.4);
  const keluar = interpolate(t, [b - 0.35, b], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
  return { op: Math.min(masuk, 1 - keluar), s: (0.93 + 0.07 * masuk) * (1 + 0.14 * keluar) };
};

const Adegan: React.FC<{ t: number; a: number; b: number; skala?: number; children: React.ReactNode }> = ({ t, a, b, skala = 1, children }) => {
  if (t < a || t > b) return null;
  const { op, s } = adegan(t, a, b);
  if (op <= 0) return null;
  return (
    <g opacity={op} transform={`translate(540,520) scale(${s * skala}) translate(-540,-520)`}>
      {children}
    </g>
  );
};

const Panggung: React.FC<{ t: number }> = ({ t }) => (
  <svg viewBox="0 0 1080 1060" width={1080} height={1060} style={{ overflow: 'visible' }}>
    <Defs />
    <Adegan t={t} a={0} b={3} skala={1.12}>
      <Papan t={t} />
    </Adegan>
    <Adegan t={t} a={3} b={9}>
      <GarisWaktu t={t} a={3} b={9} mode="delay" />
    </Adegan>
    <Adegan t={t} a={9} b={15}>
      <Stopwatch t={t} />
    </Adegan>
    <Adegan t={t} a={15} b={24}>
      <GarisWaktu t={t} a={15} b={24} mode="millis" />
    </Adegan>
    <Adegan t={t} a={24} b={30} skala={1.12}>
      <Papan t={t} />
    </Adegan>
    <Penutup t={t} />
  </svg>
);

const Defs: React.FC = () => (
  <defs>
    <filter id="bayang" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#000" floodOpacity="0.55" />
    </filter>
    <filter id="pendar" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="7" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <radialGradient id="cahayaAmber">
      <stop offset="0%" stopColor="#FFC56B" stopOpacity="0.75" />
      <stop offset="100%" stopColor="#FFC56B" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="cahayaCyan">
      <stop offset="0%" stopColor="#4FE3EC" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#4FE3EC" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="logam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#D5DCE3" />
      <stop offset="100%" stopColor="#9EA9B4" />
    </linearGradient>
  </defs>
);

/* ---------------- adegan: papan fisik (hook & hasil) ---------------- */
const Papan: React.FC<{ t: number }> = ({ t }) => {
  const sukses = t >= 15;
  const daftarTekan = sukses ? TEKAN_OK : TEKAN_GAGAL;
  const press = tekanan(t, daftarTekan);
  const pTerakhir = terakhir(t, daftarTekan);
  const sejakTekan = t - pTerakhir;
  const fr = t % 1;
  const nyala = Math.floor(t) % 2 === 0;
  const ledOn = nyala ? Math.min(1, fr / 0.06) : Math.max(0, 1 - fr / 0.06);
  const warnaBoard = sukses ? K.ok : '#2C4766';
  return (
    <g>
      <Kabel d={KABEL_LED} warna="#FF9F43" />
      <Kabel d={KABEL_BTN} warna="#5AA9FF" />
      {nyala && fr < 0.28 && <Denyut d={KABEL_LED} pos={-10 + (fr / 0.28) * 110} warna="#FFC56B" />}
      {sejakTekan >= 0.05 && sejakTekan < 0.45 && (
        <Denyut d={KABEL_BTN} pos={100 - ((sejakTekan - 0.05) / 0.4) * 110} warna={sukses ? K.cyan : K.err} />
      )}
      <Led x={LED.x} y={LED.y} s={1} on={ledOn} />
      <Label x={LED.x} y={LED.y + 175} teks="LED" />
      <Board t={t} warna={warnaBoard} beku={false} sinyalMasuk={sukses && sejakTekan > 0.4 && sejakTekan < 0.7} />
      <Tombol x={BTN.x} y={BTN.y} press={press} />
      <Label x={BTN.x - 170} y={BTN.y + 110} teks="TOMBOL" />
      <Riak t={t} p={pTerakhir} warna={sukses ? K.ok : K.err} />
      <Lencana t={t} p={pTerakhir} sukses={sukses} />
      <Jari t={t} press={press} hadir={1} />
      <Kartu t={t} />
    </g>
  );
};

/* ---------------- adegan: garis waktu loop() ---------------- */
const GW = { x0: 130, x1: 970, msMaks: 3000 };
const gx = (ms: number) => GW.x0 + (ms / GW.msMaks) * (GW.x1 - GW.x0);
const TEKAN_MS = [430, 1360, 2290];

const GarisWaktu: React.FC<{ t: number; a: number; b: number; mode: 'delay' | 'millis' }> = ({ t, a, b, mode }) => {
  const ms = interpolate(t, [a + 0.5, b - 0.6], [0, GW.msMaks], C);
  const xp = gx(ms);
  const klip = `klip-${mode}`;
  const jalur = [
    { y: 230, label: 'CPU' },
    { y: 480, label: 'LED' },
    { y: 730, label: 'TOMBOL' },
  ];
  const isDelay = mode === 'delay';
  return (
    <g>
      <defs>
        <clipPath id={klip}>
          <rect x={0} y={0} width={xp} height={1060} />
        </clipPath>
      </defs>
      {/* kepala */}
      <text x={GW.x0 - 50} y={70} fontFamily={MONO} fontSize={26} letterSpacing={3} fill={K.dim}>GARIS WAKTU loop()</text>
      <g transform={`translate(${GW.x0 - 50},96)`}>
        {isDelay ? (
          <>
            <rect width={26} height={26} rx={5} fill={K.err} />
            <text x={38} y={22} fontFamily={SANS} fontSize={28} fill={K.text}>menunggu</text>
            <rect x={210} width={26} height={26} rx={5} fill={K.ok} />
            <text x={248} y={22} fontFamily={SANS} fontSize={28} fill={K.text}>sempat cek tombol</text>
          </>
        ) : (
          <>
            <rect width={26} height={26} rx={5} fill={K.cyan} />
            <text x={38} y={22} fontFamily={SANS} fontSize={28} fill={K.text}>cek: sudah 1000 ms? lalu baca tombol</text>
          </>
        )}
      </g>

      {/* jalur & sumbu */}
      {jalur.map((j) => (
        <g key={j.label}>
          <text x={GW.x0 - 50} y={j.y - 72} fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={4} fill={K.dim}>{j.label}</text>
          <line x1={GW.x0 - 50} y1={j.y + 50} x2={GW.x1 + 40} y2={j.y + 50} stroke="#22303C" strokeWidth={2} />
        </g>
      ))}
      <g>
        <line x1={GW.x0} y1={880} x2={GW.x1} y2={880} stroke="#3A4754" strokeWidth={3} />
        {[0, 1000, 2000, 3000].map((m) => (
          <g key={m}>
            <line x1={gx(m)} y1={872} x2={gx(m)} y2={888} stroke="#3A4754" strokeWidth={3} />
            <text x={gx(m)} y={926} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={K.dim}>{m === 0 ? '0' : `${m / 1000} dtk`}</text>
          </g>
        ))}
      </g>

      {/* isi yang "tergambar" mengikuti playhead */}
      <g clipPath={`url(#${klip})`}>
        {/* CPU */}
        {isDelay
          ? [0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={gx(k * 1000)} y={180} width={gx(60) - GW.x0} height={100} rx={8} fill={K.ok} />
                <rect x={gx(k * 1000 + 80)} y={180} width={gx(1000 - 90) - GW.x0} height={100} rx={12} fill={K.err} fillOpacity={0.85} />
                <text x={gx(k * 1000 + 535)} y={243} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={30} fill="#0C1117">delay(1000)</text>
              </g>
            ))
          : Array.from({ length: 50 }, (_, i) => (
              <rect key={i} x={gx(i * 60)} y={180} width={gx(30) - GW.x0} height={100} rx={5} fill={K.cyan} fillOpacity={0.85} />
            ))}
        {/* LED gelombang kotak */}
        <path
          d={`M${gx(0)},440 H${gx(1000)} V520 H${gx(2000)} V440 H${gx(3000)}`}
          fill="none"
          stroke={K.amber}
          strokeWidth={8}
          strokeLinejoin="round"
          filter="url(#pendar)"
        />
        {!isDelay &&
          [1000, 2000].map((m) => (
            <g key={m}>
              <circle cx={gx(m)} cy={480} r={16} fill={K.amber} />
              <line x1={gx(m)} y1={285} x2={gx(m)} y2={462} stroke={K.amber} strokeWidth={3} strokeDasharray="8 8" />
            </g>
          ))}
      </g>

      {/* tekanan tombol */}
      {TEKAN_MS.map((m, i) => {
        const muncul = interpolate(ms, [m, m + 120], [0, 1], C);
        if (muncul <= 0) return null;
        const w = isDelay ? K.err : K.ok;
        const s = interpolate(muncul, [0, 0.6, 1], [0.4, 1.15, 1]);
        return (
          <g key={m}>
            <line x1={gx(m)} y1={285} x2={gx(m)} y2={700} stroke={w} strokeWidth={3} strokeDasharray="6 10" opacity={muncul} />
            <g transform={`translate(${gx(m)},730) scale(${s})`}>
              <circle r={30} fill={w} />
              {isDelay ? (
                <path d="M-11,-11 l22,22 M11,-11 l-22,22" stroke="#0C1117" strokeWidth={6} strokeLinecap="round" />
              ) : (
                <path d="M-12,1 l8,9 l17,-19" fill="none" stroke="#0C1117" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              )}
            </g>
            {i === 0 && (
              <text x={gx(m)} y={808} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={28} letterSpacing={2} fill={w} opacity={muncul}>
                {isDelay ? 'DIABAIKAN' : 'TERBACA'}
              </text>
            )}
          </g>
        );
      })}
      {!isDelay && ms > 1000 && (
        <text x={gx(1000) + 26} y={420} fontFamily={MONO} fontWeight={700} fontSize={26} fill={K.amber} opacity={interpolate(ms, [1000, 1150], [0, 1], C)}>
          1000 ms → kedip
        </text>
      )}

      {/* playhead */}
      <line x1={xp} y1={150} x2={xp} y2={880} stroke={K.text} strokeWidth={3} opacity={0.9} />
      <circle cx={xp} cy={880} r={11} fill={K.text} />
    </g>
  );
};

/* ---------------- adegan: stopwatch millis() ---------------- */
const Stopwatch: React.FC<{ t: number }> = ({ t }) => {
  const ms = 9000 + (t - 9) * 1000;
  const sudut = ((ms % 1000) / 1000) * 360;
  const msTeks = Math.round(ms).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const cx = 540;
  const cy = 400;
  const R = 300;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const ujung = (r: number, d: number) => [cx + r * Math.cos(rad(d)), cy + r * Math.sin(rad(d))];
  const [ax, ay] = ujung(R - 30, sudut);
  const busur = `M${cx},${cy - (R - 30)} A${R - 30},${R - 30} 0 ${sudut > 180 ? 1 : 0} 1 ${ax},${ay}`;
  const [hx, hy] = ujung(R - 70, sudut);
  return (
    <g>
      <rect x={cx - 40} y={cy - R - 70} width={80} height={44} rx={10} fill="#2B3644" />
      <rect x={cx - 60} y={cy - R - 92} width={120} height={30} rx={10} fill="#3A4754" />
      <g filter="url(#bayang)">
        <circle cx={cx} cy={cy} r={R} fill="#121A23" stroke="#2B3644" strokeWidth={16} />
      </g>
      {Array.from({ length: 60 }, (_, i) => {
        const besar = i % 5 === 0;
        const [x1, y1] = ujung(R - 24, i * 6);
        const [x2, y2] = ujung(R - (besar ? 58 : 40), i * 6);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={besar ? '#8B9AA6' : '#3A4754'} strokeWidth={besar ? 5 : 3} strokeLinecap="round" />;
      })}
      {[0, 250, 500, 750].map((m, i) => {
        const [x, y] = ujung(R - 100, i * 90);
        return (
          <text key={m} x={x} y={y + 11} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={K.dim}>{m}</text>
        );
      })}
      <path d={busur} fill="none" stroke={K.cyan} strokeOpacity={0.35} strokeWidth={22} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke={K.cyan} strokeWidth={10} strokeLinecap="round" filter="url(#pendar)" />
      <circle cx={cx} cy={cy} r={20} fill={K.cyan} />
      <circle cx={cx} cy={cy} r={8} fill="#0C1117" />
      <text x={cx} y={cy + 150} textAnchor="middle" fontFamily={MONO} fontSize={28} letterSpacing={3} fill={K.dim}>ms</text>

      <text x={cx} y={812} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={34} fill={K.cyan}>millis() =</text>
      <text x={cx} y={910} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={96} fill={K.text}>{msTeks}<tspan fontSize={44} fill={K.dim}> ms</tspan></text>
      <text x={cx} y={972} textAnchor="middle" fontFamily={SANS} fontSize={32} fill={K.dim}>terus menghitung sejak board nyala</text>
    </g>
  );
};

/* ---------------- objek ---------------- */
const Kabel: React.FC<{ d: string; warna: string }> = ({ d, warna }) => (
  <g>
    <path d={d} fill="none" stroke="#000" strokeOpacity={0.45} strokeWidth={18} strokeLinecap="round" transform="translate(0,6)" />
    <path d={d} fill="none" stroke={warna} strokeWidth={12} strokeLinecap="round" />
    <path d={d} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={3} strokeLinecap="round" transform="translate(-2,-3)" />
  </g>
);

const Denyut: React.FC<{ d: string; pos: number; warna: string }> = ({ d, pos, warna }) => (
  <path d={d} pathLength={100} fill="none" stroke={warna} strokeWidth={16} strokeLinecap="round" strokeDasharray="9 400" strokeDashoffset={-pos} filter="url(#pendar)" />
);

const Label: React.FC<{ x: number; y: number; teks: string }> = ({ x, y, teks }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={MONO} fontSize={26} letterSpacing={4} fill={K.dim}>
    {teks}
  </text>
);

const Led: React.FC<{ x: number; y: number; s: number; on: number; warna?: 'amber' | 'cyan' }> = ({ x, y, s, on, warna = 'amber' }) => {
  const isi = warna === 'amber' ? ['#FFD58A', 'rgba(255,181,71,0.20)', '#FFB547'] : ['#A6F6FA', 'rgba(79,227,236,0.18)', '#4FE3EC'];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle r={190} fill={`url(#${warna === 'amber' ? 'cahayaAmber' : 'cahayaCyan'})`} opacity={on} />
      <line x1={-14} y1={60} x2={-14} y2={130} stroke="#9AA5B1" strokeWidth={7} strokeLinecap="round" />
      <line x1={14} y1={60} x2={14} y2={108} stroke="#9AA5B1" strokeWidth={7} strokeLinecap="round" />
      <ellipse cx={0} cy={62} rx={46} ry={13} fill={isi[2]} opacity={0.55 + 0.45 * on} />
      <path d="M-38,62 L-38,-8 A38,38 0 0 1 38,-8 L38,62 Z" fill={isi[1]} stroke={isi[2]} strokeWidth={4} />
      <path d="M-38,62 L-38,-8 A38,38 0 0 1 38,-8 L38,62 Z" fill={isi[0]} opacity={on} />
      <path d="M-22,40 L-22,-6 A22,22 0 0 1 -4,-28" fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

const Board: React.FC<{ t: number; warna: string; beku: boolean; sinyalMasuk: boolean }> = ({ t, warna, beku, sinyalMasuk }) => {
  const opBeku = beku ? Math.min(naik(t, 3.05, 0.4), interpolate(t, [8.7, 9], [1, 0], C)) : 0;
  const denyut = 0.55 + 0.45 * Math.sin(t * Math.PI * 2);
  // jam pasir dibalik tiap detik
  const balik = Math.floor(t) * 180 + interpolate(t % 1, [0, 0.3], [-180, 0], { ...C, easing: ease });
  const pin = Array.from({ length: 19 }, (_, i) => 50 + i * 24.5);
  return (
    <g transform={`translate(${BOARD.x},${BOARD.y})`}>
      <g filter="url(#bayang)">
        <rect x={-24} y={95} width={44} height={60} rx={7} fill="url(#logam)" />
        <rect width={BOARD.w} height={BOARD.h} rx={20} fill="#16304A" />
      </g>
      <rect width={BOARD.w} height={BOARD.h} rx={20} fill="none" stroke={warna} strokeWidth={beku ? 3 + 3 * denyut : 4} opacity={0.95} />
      {sinyalMasuk && <rect width={BOARD.w} height={BOARD.h} rx={20} fill="none" stroke={K.cyan} strokeWidth={10} filter="url(#pendar)" />}
      <rect x={7} y={7} width={BOARD.w - 14} height={BOARD.h - 14} rx={15} fill="none" stroke="#fff" strokeOpacity={0.05} strokeWidth={2} />
      {[[24, 24], [516, 24], [24, 226], [516, 226]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={9} fill="#0A1520" stroke="#C9A24A" strokeWidth={3} />
      ))}
      {pin.map((px, i) => (
        <g key={i}>
          <rect x={px} y={14} width={17} height={17} rx={2} fill="#0D0F12" />
          <rect x={px + 5} y={19} width={7} height={7} fill="#D9B45A" />
          <rect x={px} y={219} width={17} height={17} rx={2} fill="#0D0F12" />
          <rect x={px + 5} y={224} width={7} height={7} fill="#D9B45A" />
        </g>
      ))}
      <rect x={42} y={56} width={110} height={138} rx={6} fill="#123049" />
      <path d="M58,76 h70 v18 h-70 v18 h70 v18 h-70 v18 h70" fill="none" stroke="#C9A24A" strokeOpacity={0.6} strokeWidth={5} />
      <rect x={150} y={56} width={240} height={138} rx={8} fill="url(#logam)" stroke="#8D98A4" strokeWidth={2} />
      <text x={270} y={130} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={42} fill="#56616D">ESP32</text>
      <text x={270} y={164} textAnchor="middle" fontFamily={MONO} fontSize={20} fill="#6B7682">WROOM-32</text>
      <rect x={412} y={70} width={56} height={40} rx={4} fill="#111418" />
      {[420, 480].map((bx) => (
        <g key={bx}>
          <rect x={bx - 4} y={150} width={34} height={34} rx={4} fill="#20262D" />
          <circle cx={bx + 13} cy={167} r={10} fill="#3A4450" />
        </g>
      ))}
      {/* lapisan "beku" saat delay */}
      {opBeku > 0 && (
        <g opacity={opBeku}>
          <rect width={BOARD.w} height={BOARD.h} rx={20} fill="#04070A" fillOpacity={0.72} />
          <g transform={`translate(270,108) rotate(${balik})`}>
            <path d="M-32,-46 h64 M-32,46 h64" stroke={K.text} strokeWidth={7} strokeLinecap="round" />
            <path d="M-26,-42 L26,-42 L4,0 L26,42 L-26,42 L-4,0 Z" fill="none" stroke={K.text} strokeWidth={5} strokeLinejoin="round" />
            <path d="M-14,-30 L14,-30 L0,-6 Z" fill={K.amber} />
            <path d="M-16,40 L16,40 L0,24 Z" fill={K.amber} />
          </g>
          <text x={270} y={212} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={30} letterSpacing={6} fill={K.err}>
            BERHENTI
          </text>
        </g>
      )}
    </g>
  );
};

const Tombol: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <g transform={`translate(${x},${y})`}>
    {[[-80, -56], [-80, 56], [80, -56], [80, 56]].map(([lx, ly], i) => (
      <rect key={i} x={lx > 0 ? lx - 4 : lx - 22} y={ly - 7} width={26} height={14} rx={3} fill="#9AA5B1" />
    ))}
    <g filter="url(#bayang)">
      <rect x={-80} y={-80} width={160} height={160} rx={18} fill="#1E2630" stroke="#344250" strokeWidth={3} />
    </g>
    {[[-56, -56], [56, -56], [-56, 56], [56, 56]].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={7} fill="#3C4A58" />
    ))}
    <g transform={`scale(${1 - 0.1 * press})`}>
      <circle r={54} fill="#2B3644" stroke="#4A5A6B" strokeWidth={4} />
      <circle r={40} fill={press > 0.5 ? '#1F2833' : '#26303C'} />
      <path d="M-26,-14 A30,30 0 0 1 10,-30" fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={6} strokeLinecap="round" />
    </g>
  </g>
);

const Riak: React.FC<{ t: number; p: number; warna: string }> = ({ t, p, warna }) => {
  const d = t - p;
  if (d < 0.05 || d > 0.6) return null;
  const k = (d - 0.05) / 0.55;
  return <circle cx={BTN.x} cy={BTN.y} r={60 + k * 110} fill="none" stroke={warna} strokeWidth={6 * (1 - k) + 1} opacity={1 - k} />;
};

const Lencana: React.FC<{ t: number; p: number; sukses: boolean }> = ({ t, p, sukses }) => {
  const d = t - p;
  if (d < 0.12 || d > 1.0) return null;
  const s = interpolate(d, [0.12, 0.26], [0.6, 1], { ...C, easing: Easing.out(Easing.back(2)) });
  const op = interpolate(d, [0.12, 0.2, 0.85, 1.0], [0, 1, 1, 0], C);
  const w = sukses ? K.ok : K.err;
  const teks = sukses ? 'TERBACA' : 'DIABAIKAN';
  const lebar = sukses ? 250 : 300;
  return (
    <g transform={`translate(${BTN.x},${610}) scale(${s})`} opacity={op}>
      <rect x={-lebar / 2} y={-38} width={lebar} height={76} rx={38} fill={w} />
      <circle cx={-lebar / 2 + 38} cy={0} r={22} fill="#0C1117" />
      {sukses ? (
        <path d={`M${-lebar / 2 + 27},1 l8,8 l15,-17`} fill="none" stroke={w} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d={`M${-lebar / 2 + 29},-9 l18,18 M${-lebar / 2 + 47},-9 l-18,18`} stroke={w} strokeWidth={6} strokeLinecap="round" />
      )}
      <text x={-lebar / 2 + 72} y={11} fontFamily={MONO} fontWeight={800} fontSize={30} letterSpacing={3} fill="#0C1117">
        {teks}
      </text>
    </g>
  );
};

const Jari: React.FC<{ t: number; press: number; hadir: number }> = ({ press, hadir }) => {
  if (hadir <= 0) return null;
  const angkat = 1 - press;
  const x = BTN.x + angkat * 34 + (1 - hadir) * 420;
  const y = BTN.y - angkat * 42 + (1 - hadir) * 520;
  const s = 1 + 0.07 * angkat;
  return (
    <g transform={`translate(${x},${y}) rotate(-35) scale(${s})`} opacity={hadir}>
      <ellipse cx={14} cy={26} rx={44} ry={22} fill="#000" opacity={0.25 + 0.25 * press} />
      <rect x={-62} y={250} width={124} height={260} rx={24} fill="#28323E" />
      <rect x={-62} y={250} width={124} height={26} rx={10} fill="#323E4C" />
      <rect x={-38} y={-8} width={76} height={272} rx={38} fill="#EFC19C" stroke="#D29A73" strokeWidth={3} />
      <rect x={-25} y={2} width={50} height={58} rx={22} fill="#F8DCC8" stroke="#E0B190" strokeWidth={2} />
      <path d="M-16,128 q16,8 32,0 M-16,140 q16,8 32,0" fill="none" stroke="#D29A73" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/* ---------------- kartu keterangan di atas board ---------------- */
const KARTU = { x: 90, y: 60, w: 560, h: 230 };

const Bingkai: React.FC<{ op: number; geser: number; warna: string; h?: number; children: React.ReactNode }> = ({ op, geser, warna, h = KARTU.h, children }) => (
  <g opacity={op} transform={`translate(${KARTU.x},${KARTU.y + geser})`}>
    <g filter="url(#bayang)">
      <rect width={KARTU.w} height={h} rx={22} fill={K.card} />
    </g>
    <rect width={KARTU.w} height={h} rx={22} fill="none" stroke={warna} strokeOpacity={0.8} strokeWidth={3} />
    {children}
  </g>
);

const Kartu: React.FC<{ t: number }> = ({ t }) => {
  const geser = (a: number) => (1 - naik(t, a, 0.4)) * 20;
  const fr = t % 1;
  const ms = Math.round(9000 + (t - 9) * 1000);
  const msTeks = ms.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const yaAktif = fr < 0.35;
  return (
    <>
      {/* 0–3: konteks program */}
      <Bingkai op={jendela(t, 0, 3)} geser={0} warna="#344250" h={96}>
        <text x={28} y={44} fontFamily={MONO} fontSize={24} letterSpacing={3} fill={K.dim}>PROGRAM</text>
        <text x={28} y={80} fontFamily={SANS} fontWeight={700} fontSize={34} fill={K.text}>LED kedip + baca tombol</text>
      </Bingkai>

      {/* 3–9: delay */}
      <Bingkai op={jendela(t, 3.1, 9)} geser={geser(3.1)} warna={K.err}>
        <text x={30} y={52} fontFamily={MONO} fontSize={24} letterSpacing={3} fill={K.dim}>LOOP() SEDANG</text>
        <text x={30} y={118} fontFamily={MONO} fontWeight={700} fontSize={56} fill={K.amber}>delay(1000);</text>
        <rect x={30} y={146} width={500} height={16} rx={8} fill="#25313D" />
        <rect x={30} y={146} width={500 * fr} height={16} rx={8} fill={K.err} />
        <text x={30} y={204} fontFamily={SANS} fontSize={31} fill={K.dim}>menunggu… tombol tidak dicek</text>
      </Bingkai>

      {/* 9–15: millis menghitung */}
      <Bingkai op={jendela(t, 9.1, 15)} geser={geser(9.1)} warna={K.cyan}>
        <text x={30} y={56} fontFamily={MONO} fontWeight={700} fontSize={34} fill={K.cyan}>millis()</text>
        <text x={30} y={146} fontFamily={MONO} fontWeight={700} fontSize={80} fill={K.text}>{msTeks}<tspan fontSize={40} fill={K.dim}> ms</tspan></text>
        <text x={30} y={200} fontFamily={SANS} fontSize={31} fill={K.dim}>waktu sejak board nyala</text>
      </Bingkai>

      {/* 15–24: cek waktu */}
      <Bingkai op={jendela(t, 15.1, 24)} geser={geser(15.1)} warna={K.cyan}>
        <text x={30} y={52} fontFamily={MONO} fontWeight={700} fontSize={29} fill={K.text}>sudah lewat 1000 ms?</text>
        <rect x={30} y={70} width={500} height={10} rx={5} fill="#25313D" />
        <rect x={30} y={70} width={500 * fr} height={10} rx={5} fill={K.cyan} />
        <rect x={18} y={98} width={524} height={56} rx={12} fill={K.amber} opacity={yaAktif ? 0.2 : 0} />
        <text x={30} y={137} fontFamily={SANS} fontWeight={700} fontSize={32} fill={yaAktif ? K.amber : '#56636F'}>SUDAH → kedipkan LED</text>
        <rect x={18} y={162} width={524} height={56} rx={12} fill={K.cyan} opacity={yaAktif ? 0 : 0.16} />
        <text x={30} y={201} fontFamily={SANS} fontWeight={700} fontSize={32} fill={yaAktif ? '#56636F' : K.cyan}>BELUM → baca tombol</text>
      </Bingkai>

      {/* 24–30: hasil */}
      <Bingkai op={jendela(t, 24.1, 30)} geser={geser(24.1)} warna={K.ok}>
        {[
          { a: 24.3, y: 60, teks: 'LED tetap kedip' },
          { a: 25.0, y: 150, teks: 'Tombol tetap responsif' },
        ].map((r) => {
          const k = naik(t, r.a, 0.3);
          return (
            <g key={r.teks} opacity={k} transform={`translate(${(1 - k) * -20},0)`}>
              <circle cx={62} cy={r.y + 22} r={26} fill={K.ok} />
              <path d={`M50,${r.y + 23} l9,9 l16,-18`} fill="none" stroke="#0C1117" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              <text x={106} y={r.y + 34} fontFamily={SANS} fontWeight={700} fontSize={36} fill={K.text}>{r.teks}</text>
            </g>
          );
        })}
      </Bingkai>
    </>
  );
};

/* ---------------- bab penutup ---------------- */
const Penutup: React.FC<{ t: number }> = ({ t }) => {
  if (t < 30) return null;
  const opAturan = jendela(t, 30.2, 35, 0.3);
  const coret = naik(t, 31.3, 0.4);
  const millis = interpolate(t, [32.1, 32.45], [0, 1], { ...C, easing: Easing.out(Easing.back(1.6)) });
  const ket = naik(t, 32.7, 0.35);
  const opCta = naik(t, 35.05, 0.35);
  const fr1 = (t % 0.3) / 0.3;
  const fr2 = t % 1;
  return (
    <>
      <g opacity={opAturan}>
        <text x={540} y={260} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={124} fill={K.err} opacity={1 - 0.5 * coret}>delay()</text>
        <line x1={300} y1={220} x2={300 + 480 * coret} y2={220} stroke={K.err} strokeWidth={14} strokeLinecap="round" />
        <path d="M540,330 v90 M505,388 l35,36 l35,-36" fill="none" stroke={K.dim} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={ket > 0 || millis > 0 ? 1 : 0.4} />
        <g transform={`translate(540,560) scale(${0.6 + 0.4 * millis})`} opacity={millis}>
          <text x={0} y={0} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={136} fill={K.ok} filter="url(#pendar)">millis()</text>
        </g>
        <text x={540} y={680} textAnchor="middle" fontFamily={SANS} fontSize={40} fill={K.dim} opacity={ket}>kalau program ngerjain lebih dari 1 hal</text>
      </g>

      <g opacity={opCta}>
        <Led x={360} y={250} s={1.35} on={fr1 < 0.5 ? 1 : 0} />
        <Led x={720} y={250} s={1.35} on={fr2 < 0.5 ? 1 : 0} warna="cyan" />
        <text x={360} y={520} textAnchor="middle" fontFamily={MONO} fontSize={32} letterSpacing={4} fill={K.amber}>CEPAT</text>
        <text x={720} y={520} textAnchor="middle" fontFamily={MONO} fontSize={32} letterSpacing={4} fill={K.cyan}>LAMBAT</text>
        <g transform="translate(540,660)">
          <rect x={-300} y={-52} width={600} height={104} rx={52} fill={K.cyan} />
          <text x={0} y={15} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={42} fill="#0C1117">Tulis di komentar ↓</text>
        </g>
      </g>
    </>
  );
};

/* ---------------- subtitle tenang ---------------- */
type Kata = { teks: string; mulai: number; kunci: boolean };
const bersih = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const FRASA: { mulai: number; selesai: number; kata: Kata[] }[] = (() => {
  const out: { mulai: number; selesai: number; kata: Kata[] }[] = [];
  for (const a of ADEGAN) {
    const ws = a.vo.split(' ');
    const bobot = ws.map((w) => w.length + 2);
    const total = bobot.reduce((x, y) => x + y, 0);
    const awal = a.mulai + 0.05;
    const span = a.selesai - a.mulai - 0.2;
    let acc = 0;
    let cur: Kata[] = [];
    ws.forEach((w, i) => {
      const k: Kata = { teks: w, mulai: awal + (acc / total) * span, kunci: bersih(w) === bersih(a.kunci) };
      acc += bobot[i];
      cur.push(k);
      const akhir = /[.,?:!]$/.test(w) || i === ws.length - 1 || cur.length >= 6;
      if (akhir) {
        out.push({ mulai: cur[0].mulai, selesai: awal + (acc / total) * span, kata: cur });
        cur = [];
      }
    });
  }
  return out;
})();

const Subtitle: React.FC<{ t: number }> = ({ t }) => {
  let idx = 0;
  FRASA.forEach((f, i) => {
    if (f.mulai <= t) idx = i;
  });
  const f = FRASA[idx];
  const op = interpolate(t, [f.mulai, f.mulai + 0.1], [0.4, 1], C);
  return (
    <div style={{ position: 'absolute', top: 1440, left: 0, width: 1080, height: 480, background: K.band, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ position: 'absolute', top: 44, left: 80, right: 80, textAlign: 'center', fontSize: 56, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.5, opacity: op }}>
        {f.kata.map((k, i) => {
          const sudah = k.mulai <= t;
          const warna = k.kunci ? K.amber : K.text;
          return (
            <span key={i} style={{ color: warna, opacity: sudah ? 1 : 0.38 }}>
              {k.teks.replace(/[.,?:!]$/, (m) => (m === '?' ? '?' : ''))}
              {i < f.kata.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
};
