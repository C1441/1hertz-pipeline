// UJI pustaka v2 — topik "ESP32 tidak terdeteksi di port COM" (Seri A). Tanpa suara.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { K, SANS, MONO, Kerangka, Adegan, Svg, Board, titikBoard, Meja, Laptop, LAYAR, PORT_LAPTOP, Kabel, Segmen, titik, Ikon, Jendela, Baris, Checklist, Pill, naik, pop, Judul, AdeganSub } from './pustaka';

export const DURASI = 37;

const ADEGAN: AdeganSub[] = [
  { mulai: 0, selesai: 3.5, vo: 'ESP32 dicolok, lampunya nyala, tapi port COM nggak muncul?', kunci: 'port' },
  { mulai: 3.5, selesai: 9, vo: 'Penyebab paling sering: kabelnya cuma kabel cas. Cuma bawa daya, nggak bawa data.', kunci: 'daya' },
  { mulai: 9, selesai: 14, vo: 'Ganti pakai kabel data, yang bisa buat transfer file dari HP.', kunci: 'data' },
  { mulai: 14, selesai: 20, vo: 'Masih belum? Buka Device Manager. Ada tanda seru kuning, berarti driver USB-nya belum terpasang.', kunci: 'driver' },
  { mulai: 20, selesai: 26, vo: 'Lihat chip kecil dekat colokan USB. Biasanya CP2102 atau CH340. Pasang driver sesuai chipnya.', kunci: 'CH340' },
  { mulai: 26, selesai: 31, vo: 'Cabut, colok lagi. Port COM-nya muncul.', kunci: 'muncul' },
  { mulai: 31, selesai: 37, vo: 'Jadi cek kabel dulu, baru driver. Port-mu muncul di langkah mana? Tulis di komentar.', kunci: 'komentar' },
];

const JUDUL: Judul[] = [
  { a: 0, b: 3.5, l1: 'Lampu nyala,', l2: 'port COM nggak ada?', warna: 'err' },
  { a: 3.5, b: 9, l1: 'Kabel cas cuma', l2: 'bawa daya', warna: 'err' },
  { a: 9, b: 14, l1: 'Pakai kabel', l2: 'yang bawa data', warna: 'ok' },
  { a: 14, b: 20, l1: 'Ada tanda seru?', l2: 'Driver belum terpasang', warna: 'amber' },
  { a: 20, b: 26, l1: 'Cek chip dekat USB,', l2: 'pasang driver-nya', warna: 'cyan' },
  { a: 26, b: 31, l1: 'Cabut, colok lagi:', l2: 'COM5 muncul', warna: 'ok' },
  { a: 31, b: 37, l1: 'Kabel dulu,', l2: 'baru driver', warna: 'ok' },
];

export const UjiPortCOM: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <Kerangka t={t} tag="1HERTZ · ESP32" judul={JUDUL} adegan={ADEGAN} sumber="ILUSTRASI · WINDOWS + ARDUINO IDE">
      <Adegan t={t} a={0} b={3.5}>
        <PapanUSB t={t} sukses={false} />
      </Adegan>
      <Adegan t={t} a={3.5} b={14}>
        <Penampang t={t} />
      </Adegan>
      <Adegan t={t} a={14} b={20}>
        <DeviceManager t={t} versi="error" />
      </Adegan>
      <Adegan t={t} a={20} b={26}>
        <ZoomChip t={t} />
      </Adegan>
      <Adegan t={t} a={26} b={31}>
        <DeviceManager t={t} versi="beres" />
      </Adegan>
      <Adegan t={t} a={31} b={37}>
        <PapanUSB t={t} sukses />
      </Adegan>
    </Kerangka>
  );
};

/* ---------- adegan: laptop + kabel + ESP32 ---------- */
const PB = { x: 715, y: 500, s: 1.6 }; // ESP32 tidur di meja, colokan USB di kiri
const USB_PB = titikBoard('esp32', PB.x, PB.y, PB.s, true, 64, 199);
const K_LED = titikBoard('esp32', PB.x, PB.y, PB.s, true, 37, 112.5);
const KABEL_USB: Segmen[] = [[PORT_LAPTOP, [PORT_LAPTOP[0] + 120, PORT_LAPTOP[1]], [USB_PB[0] - 100, USB_PB[1]], USB_PB]];

const PapanUSB: React.FC<{ t: number; sukses: boolean }> = ({ t, sukses }) => {
  const [mx, my] = titik(KABEL_USB, 0.5);
  const tIkon = sukses ? 31.3 : 0.6;
  return (
    <>
      <Svg>
        <Meja />
        <Laptop>
          <g transform={`translate(${LAYAR.x0},${LAYAR.y0})`}>
            <text x={24} y={40} fontFamily={SANS} fontSize={28} fill={K.dim}>Tools › Port</text>
            <rect x={24} y={60} width={440} height={64} rx={10} fill="#1A232D" stroke="#33404D" strokeWidth={2} />
            <text x={46} y={103} fontFamily={SANS} fontWeight={600} fontSize={30} fill={K.text}>Port</text>
            <path d="M430,84 l12,12 l12,-12" fill="none" stroke={K.dim} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            {sukses ? (
              <g opacity={naik(t, 31.1, 0.3)}>
                <rect x={24} y={134} width={440} height={80} rx={10} fill={K.cyan} opacity={0.16} />
                <text x={46} y={188} fontFamily={MONO} fontWeight={800} fontSize={38} fill={K.cyan}>COM5</text>
              </g>
            ) : (
              <text x={46} y={186} fontFamily={SANS} fontStyle="italic" fontSize={30} fill={K.redup}>Tidak ada port</text>
            )}
            <Ikon x={426} y={174} r={24} jenis={sukses ? 'ok' : 'err'} s={pop(t, tIkon)} />
          </g>
        </Laptop>
        <Kabel
          seg={KABEL_USB}
          t={t}
          aliran={[
            { warna: K.amber, kecepatan: 0.35, jarak: 0.1 },
            { warna: K.cyan, kecepatan: 0.35, jarak: 0.1, fase: 0.05, batas: sukses ? 1 : 0.5 },
          ]}
        />
        {!sukses && <Ikon x={mx + 52} y={my} r={26} jenis="err" s={pop(t, 1.2)} />}
        {!sukses && (
          <g opacity={naik(t, 1.4)}>
            <text x={mx + 92} y={my + 10} fontFamily={MONO} fontWeight={700} fontSize={26} fill={K.err}>data</text>
          </g>
        )}
        <g opacity={naik(t, sukses ? 31 : 0.9)}>
          <circle cx={K_LED[0]} cy={K_LED[1]} r={20} fill="none" stroke={K.amber} strokeWidth={4} />
          <line x1={K_LED[0]} y1={K_LED[1] - 20} x2={K_LED[0]} y2={K_LED[1] - 90} stroke={K.amber} strokeWidth={3} />
          <text x={K_LED[0]} y={K_LED[1] - 102} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={26} fill={K.amber}>LED daya nyala</text>
        </g>
      </Svg>
      <Board jenis="esp32" x={PB.x} y={PB.y} s={PB.s} tidur dayaNyala />
      <Svg>
        {sukses && (
          <>
            <Checklist
              t={t}
              x={605}
              y={180}
              lebar={455}
              item={[
                { teks: 'Kabel data', a: 31.6 },
                { teks: 'Driver USB', a: 32.4 },
              ]}
            />
            <Pill t={t} a={34.6} x={540} y={975} teks="Tulis di komentar ↓" />
          </>
        )}
      </Svg>
    </>
  );
};

/* ---------- adegan: penampang kabel (khusus topik) ---------- */
const Kawat: React.FC<{ x: number; y: number; r: number; warna: string; label: string; teks?: string; pendar?: number }> = ({ x, y, r, warna, label, teks = '#fff', pendar = 0 }) => (
  <g>
    {pendar > 0 && <circle cx={x} cy={y} r={r + 10} fill="none" stroke={K.cyan} strokeWidth={6} opacity={pendar} filter="url(#pendar)" />}
    <circle cx={x} cy={y} r={r} fill={warna} stroke="rgba(0,0,0,0.35)" strokeWidth={4} />
    <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="#fff" opacity={0.18} />
    <text x={x} y={y + 10} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={28} fill={teks}>{label}</text>
  </g>
);

const Penampang: React.FC<{ t: number }> = ({ t }) => {
  const kanan = pop(t, 9.1, 0.4);
  const den = 0.5 + 0.5 * Math.sin(t * Math.PI * 2.5);
  const Selubung = ({ cx }: { cx: number }) => (
    <g filter="url(#bayang)">
      <circle cx={cx} cy={430} r={200} fill="#1E2630" stroke="#3A4754" strokeWidth={8} />
      <circle cx={cx} cy={430} r={168} fill="#0F151B" stroke="#2A3440" strokeWidth={3} strokeDasharray="6 8" />
    </g>
  );
  const Vonis = ({ cx, data, a }: { cx: number; data: boolean; a: number }) => (
    <g opacity={naik(t, a)}>
      <Ikon x={cx - 70} y={712} r={22} jenis="ok" />
      <text x={cx - 36} y={724} fontFamily={SANS} fontWeight={700} fontSize={34} fill={K.text}>Daya</text>
      <Ikon x={cx - 70} y={776} r={22} jenis={data ? 'ok' : 'err'} />
      <text x={cx - 36} y={788} fontFamily={SANS} fontWeight={700} fontSize={34} fill={data ? K.text : K.err}>Data</text>
    </g>
  );
  return (
    <Svg>
      <text x={290} y={190} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={3} fill={K.err}>KABEL CAS</text>
      <Selubung cx={290} />
      <Kawat x={230} y={430} r={52} warna="#E5484D" label="5V" />
      <Kawat x={350} y={430} r={52} warna="#2B2F35" label="GND" />
      <Vonis cx={290} data={false} a={5.2} />

      <g opacity={kanan} transform={`translate(790,430) scale(${0.85 + 0.15 * kanan}) translate(-790,-430)`}>
        <text x={790} y={190} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={34} letterSpacing={3} fill={K.ok}>KABEL DATA</text>
        <Selubung cx={790} />
        <Kawat x={735} y={375} r={46} warna="#E5484D" label="5V" />
        <Kawat x={845} y={375} r={46} warna="#2B2F35" label="GND" />
        <Kawat x={735} y={485} r={46} warna="#2FA36B" label="D+" pendar={den} />
        <Kawat x={845} y={485} r={46} warna="#E8ECEF" label="D−" teks="#0C1117" pendar={den} />
        <Vonis cx={790} data a={10} />
      </g>

      <g opacity={naik(t, 10.8)}>
        <text x={540} y={880} textAnchor="middle" fontFamily={SANS} fontSize={34} fill={K.dim}>Tes cepat: bisa transfer file dari HP?</text>
        <text x={540} y={928} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={34} fill={K.ok}>Berarti kabel data.</text>
      </g>
    </Svg>
  );
};

/* ---------- adegan: Device Manager (error → beres) ---------- */
const DeviceManager: React.FC<{ t: number; versi: 'error' | 'beres' }> = ({ t, versi }) => {
  const baris: Baris[] =
    versi === 'error'
      ? [
          { teks: 'Keyboards', ikon: 'tutup', warna: 'dim' },
          { teks: 'Mice and other pointing devices', ikon: 'tutup', warna: 'dim' },
          { teks: 'Other devices', ikon: 'buka' },
          { teks: 'CP2102 USB to UART Bridge Controller', indent: 1, ikon: 'warn', warna: 'amber', sorot: 'amber', muncul: 14.7 },
          { teks: 'Ports (COM & LPT)', ikon: 'tutup', warna: 'dim' },
        ]
      : [
          { teks: 'Keyboards', ikon: 'tutup', warna: 'dim' },
          { teks: 'Mice and other pointing devices', ikon: 'tutup', warna: 'dim' },
          { teks: 'Other devices', ikon: 'buka', coret: 26.9 },
          { teks: 'CP2102 USB to UART Bridge Controller', indent: 1, ikon: 'warn', warna: 'amber', coret: 26.9 },
          { teks: 'Ports (COM & LPT)', ikon: 'buka' },
          { teks: 'Silicon Labs CP210x USB to UART Bridge (COM5)', indent: 1, ikon: 'ok', warna: 'ok', sorot: 'ok', muncul: 28.0 },
        ];
  const tCatatan = versi === 'error' ? 16.0 : 28.8;
  return (
    <Svg>
      <Jendela t={t} x={40} y={110} lebar={1000} judul="Device Manager" baris={baris} tinggiBaris={90} ukuran={32} />
      <g opacity={naik(t, tCatatan)} transform={`translate(0,${(1 - naik(t, tCatatan)) * 16})`}>
        {versi === 'error' ? (
          <>
            <Ikon x={300} y={830} r={30} jenis="warn" />
            <text x={350} y={844} fontFamily={SANS} fontWeight={700} fontSize={38} fill={K.amber}>= driver belum ada</text>
          </>
        ) : (
          <>
            <Ikon x={340} y={830} r={30} jenis="ok" />
            <text x={390} y={844} fontFamily={SANS} fontWeight={700} fontSize={38} fill={K.ok}>port COM siap</text>
          </>
        )}
      </g>
    </Svg>
  );
};

/* ---------- adegan: zoom chip USB-UART ---------- */
const ZB = { x: 158, y: 90, s: 3.8 }; // board tidur, diperbesar (tampak atas)
const CHIP = titikBoard('esp32', ZB.x, ZB.y, ZB.s, true, 75.6, 148.7);
const USB = titikBoard('esp32', ZB.x, ZB.y, ZB.s, true, 64, 199);

const ZoomChip: React.FC<{ t: number }> = ({ t }) => {
  const cincin = naik(t, 20.6);
  const den = 0.6 + 0.4 * Math.sin(t * Math.PI * 3);
  const Kartu = ({ x, chip, driver, pembuat, a }: { x: number; chip: string; driver: string; pembuat: string; a: number }) => {
    const s = pop(t, a);
    return (
      <g opacity={Math.min(1, s)} transform={`translate(${x + 220},${688}) scale(${s}) translate(${-220},${-88})`}>
        <g filter="url(#bayang)">
          <rect width={440} height={175} rx={22} fill={K.card} />
        </g>
        <rect width={440} height={175} rx={22} fill="none" stroke={K.cyan} strokeOpacity={0.8} strokeWidth={3} />
        <text x={30} y={64} fontFamily={MONO} fontWeight={800} fontSize={50} fill={K.text}>{chip}</text>
        <text x={30} y={116} fontFamily={SANS} fontWeight={700} fontSize={34} fill={K.cyan}>→ driver {driver}</text>
        <text x={30} y={154} fontFamily={SANS} fontSize={28} fill={K.dim}>{pembuat}</text>
      </g>
    );
  };
  return (
    <>
      <Svg>
        <Meja y={40} h={1000} grid={90} />
      </Svg>
      <Board jenis="esp32" x={ZB.x} y={ZB.y} s={ZB.s} tidur dayaNyala />
      <Svg>
        <g opacity={cincin}>
          <circle cx={CHIP[0]} cy={CHIP[1]} r={60} fill="none" stroke={K.amber} strokeWidth={7} opacity={den} filter="url(#pendar)" />
          <path d={`M${CHIP[0]},${CHIP[1] + 60} L260,600`} stroke={K.amber} strokeWidth={3} opacity={naik(t, 21.8)} />
          <path d={`M${CHIP[0]},${CHIP[1] + 60} L820,600`} stroke={K.amber} strokeWidth={3} opacity={naik(t, 23.2)} />
          <path d={`M${USB[0] - 6},${USB[1]} H120 V520`} fill="none" stroke={K.dim} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <text x={120} y={556} textAnchor="middle" fontFamily={MONO} fontSize={26} letterSpacing={2} fill={K.dim}>colokan USB</text>
        </g>
        <Kartu x={40} chip="CP2102" driver="CP210x" pembuat="Silicon Labs" a={21.8} />
        <text x={540} y={698} textAnchor="middle" fontFamily={MONO} fontSize={26} letterSpacing={3} fill={K.dim} opacity={naik(t, 22.7)}>ATAU</text>
        <Kartu x={600} chip="CH340" driver="CH34x" pembuat="WCH" a={23.2} />
      </Svg>
    </>
  );
};
