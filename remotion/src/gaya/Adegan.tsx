// Adegan berbasis JSON untuk template 1Hertz gaya guidebook (16 Okt 2026).
// Tiap adegan menerima: lt = detik sejak adegan mulai, d = durasi adegan, data = isi JSON.
import React from 'react';
import { interpolate, Easing } from 'remotion';
import { K, SANS, MONO, naik, pop, Svg, Ikon, Pill, KursorSvg } from './pustaka';
import { C } from './gb';
import { acak } from './transisi';
import { ukuranPas, lebarTeks, potong, catatPotong, susunTeks, bungkusLebar } from './ukur';

export type PropsAdegan = { lt: number; d: number; data: any; teks?: string };

/* ---------------- util teks ---------------- */
/** potong teks jadi baris-baris maksimal n karakter (per kata) */
export const bungkus = (teks: string, n: number, maksBaris = 99): string[] => {
  const kata = String(teks || '').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const k of kata) {
    if (!cur) cur = k;
    else if ((cur + ' ' + k).length <= n) cur += ' ' + k;
    else {
      out.push(cur);
      cur = k;
    }
  }
  if (cur) out.push(cur);
  if (out.length > maksBaris) {
    const sisa = out.slice(maksBaris - 1).join(' ');
    out.splice(maksBaris - 1, out.length, sisa.length > n ? sisa.slice(0, n - 1) + '…' : sisa);
  }
  return out;
};
/** potong baris log yang terlalu panjang (karakter, bukan kata) */
/** bungkus baris log per kata (huruf mono, maks n karakter); kata yang lebih panjang dari n dipecah per huruf */
const bungkusMono = (s: string, n: number): string[] => {
  const out: string[] = [];
  let cur = '';
  for (const k0 of String(s ?? '').split(/\s+/).filter(Boolean)) {
    let k = k0;
    while (k.length > n) {
      if (cur) {
        out.push(cur);
        cur = '';
      }
      out.push(k.slice(0, n));
      k = k.slice(n);
    }
    if (!k) continue;
    if (!cur) cur = k;
    else if (cur.length + 1 + k.length <= n) cur += ' ' + k;
    else {
      out.push(cur);
      cur = k;
    }
  }
  out.push(cur);
  return out;
};
const pecahKarakter = (s: string, n: number) => {
  const out: string[] = [];
  let x = String(s ?? '');
  if (!x.length) return [''];
  while (x.length > n) {
    out.push(x.slice(0, n));
    x = x.slice(n);
  }
  out.push(x);
  return out;
};
const warnaNama = (w?: string) =>
  w === 'merah' || w === 'err' ? K.err : w === 'kuning' || w === 'amber' ? K.amber : w === 'hijau' || w === 'ok' ? K.ok : K.cyan;
const ikonDariWarna = (w?: string): 'ok' | 'err' | 'warn' => (w === 'merah' || w === 'err' ? 'err' : w === 'kuning' || w === 'amber' ? 'warn' : 'ok');

/** kata muncul satu per satu (HTML) */
const TeksKinetik: React.FC<{ lt: number; mulai: number; baris: string[]; ukuran: number; warna?: string; kunci?: string; jeda?: number }> = ({
  lt,
  mulai,
  baris,
  ukuran,
  warna = K.text,
  kunci,
  jeda = 0.07,
}) => {
  let idx = 0;
  const kk = (kunci || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    <div style={{ textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: ukuran, lineHeight: 1.18, letterSpacing: -1, color: warna }}>
      {baris.map((b, bi) => (
        <div key={bi}>
          {b.split(' ').map((k, ki) => {
            const p = naik(lt, mulai + idx++ * jeda, 0.3);
            const isKunci = kk && k.toLowerCase().replace(/[^a-z0-9]/g, '') === kk;
            return (
              <span key={ki} style={{ display: 'inline-block', marginRight: ukuran * 0.25, opacity: p, transform: `translateY(${(1 - p) * 16}px)`, color: isKunci ? K.amber : undefined }}>
                {k}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* ================================================================== */
/* log_serial — Serial Monitor / terminal                              */
/* ================================================================== */
export const LogSerial: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  const semua: string[] = (data?.baris ?? []).map(String);
  if (semua.length > 12) catatPotong('log_serial: lebih dari 12 baris', semua.slice(12).join(' / '));
  const asli = semua.slice(0, 12);
  const sorot: number[] = Array.isArray(data?.sorot) && data.sorot.length ? data.sorot : data?.error ? [asli.length] : [];
  const ukuran = 29;
  // ada ikon ✕ di kanan → baris dibungkus lebih pendek supaya tidak tertutup ikon
  const adaIkon = sorot.length > 0;
  const maksK = adaIkon ? 46 : 48;
  const rows: { teks: string; i: number }[] = [];
  asli.forEach((b, i) => bungkusMono(b, maksK).forEach((p) => rows.push({ teks: p, i })));
  const lh = ukuran * 1.55;
  if (rows.length > 15) catatPotong('log_serial: teks log terlalu panjang (maks 15 baris layar)', asli.join(' / '));
  const tampil = rows.slice(0, 15);
  const h = Math.min(960, Math.max(520, 170 + tampil.length * lh + 40));
  const y0 = Math.max(20, (1060 - h) / 2 - 10);
  const step = Math.min(0.45, Math.max(0.12, (d * 0.5) / Math.max(1, asli.length)));
  const tBaris = (i: number) => 0.2 + i * step;
  const errPertama = sorot.length ? Math.min(...sorot) - 1 : -1;
  const tErr = errPertama >= 0 ? tBaris(errPertama) + 0.35 : 99;
  const getar = lt > tErr && lt < tErr + 0.2 ? Math.sin(lt * 150) * 7 : 0;
  const den = 0.18 + 0.1 * Math.sin(lt * Math.PI * 3);
  const L = 1000;
  const bx = L - 290;
  return (
    <Svg>
      <g transform={`translate(${40 + getar},${y0})`}>
        <g filter="url(#bayang)">
          <rect width={L} height={h} rx={18} fill="#0A0E12" />
        </g>
        <rect width={L} height={h} rx={18} fill="none" stroke="#3A4754" strokeWidth={3} />
        <rect width={L} height={74} rx={18} fill="#151D26" />
        <rect y={56} width={L} height={18} fill="#151D26" />
        <text x={30} y={48} fontFamily={SANS} fontWeight={600} fontSize={ukuranPas(String(data?.judul || 'Serial Monitor'), 28, 640, SANS, 600, 0, 18)} fill={K.text}>
          {potong(data?.judul || 'Serial Monitor', 40, 'log_serial judul')}
        </text>
        <rect x={bx} y={14} width={270} height={46} rx={8} fill="#0E141A" stroke={data?.error ? K.err : '#33404D'} strokeWidth={data?.error ? 3 : 2} />
        <text x={bx + 18} y={46} fontFamily={SANS} fontWeight={600} fontSize={ukuranPas(String(data?.baud || '115200 baud'), 26, 200, SANS, 600, 0, 16)} fill={data?.error ? K.err : K.text}>
          {potong(data?.baud || '115200 baud', 20, 'log_serial baud')}
        </text>
        <path d={`M${bx + 236},32 l8,8 l8,-8`} fill="none" stroke={K.dim} strokeWidth={3} strokeLinecap="round" />
        <rect x={20} y={88} width={L - 40} height={46} rx={8} fill="#0E141A" stroke="#26313C" strokeWidth={2} />
        <text x={38} y={119} fontFamily={SANS} fontSize={22} fill="#4F5D69">Message (Enter to send)</text>
        {tampil.map((r, k) => {
          const t0 = tBaris(r.i);
          if (lt < t0) return null;
          const bagian = Math.min(1, (lt - t0) / 0.3);
          const err = sorot.includes(r.i + 1);
          const y = 160 + k * lh;
          return (
            <g key={k}>
              {err && <rect x={14} y={y - 6} width={L - 28} height={lh} rx={6} fill={K.err} opacity={den} />}
              <text x={30} y={y + ukuran * 0.85} fontFamily={MONO} fontSize={ukuran} fill={err ? '#FFD0D0' : '#D5DDE3'} style={{ whiteSpace: 'pre', fontVariantLigatures: 'none' }}>
                {r.teks.slice(0, Math.max(1, Math.round(r.teks.length * bagian)))}
              </text>
            </g>
          );
        })}
      </g>
      {errPertama >= 0 && <Ikon x={980} y={y0 + 190} r={38} jenis="err" s={pop(lt, tErr)} />}
    </Svg>
  );
};

/* ================================================================== */
/* kartu_kode — editor + diff                                          */
/* ================================================================== */
export const KartuKode: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  const semuaBaris: string[] = String(data?.kode ?? '').replace(/\t/g, '  ').split('\n');
  if (semuaBaris.length > 9) catatPotong('kartu_kode: lebih dari 9 baris kode', semuaBaris.slice(9).join(' / '));
  if (semuaBaris.some((b) => b.length > 58)) catatPotong('kartu_kode: baris kode lebih dari 58 karakter', semuaBaris.find((b) => b.length > 58) ?? '');
  const baris = semuaBaris.slice(0, 9);
  const sorot: number[] = data?.sorot_baris ?? [];
  const baru: number[] = data?.baris_baru ?? [];
  const hapus: number[] = data?.baris_hapus ?? [];
  const maksLen = Math.max(12, ...baris.map((b) => b.length + 4));
  const ukuran = Math.max(22, Math.min(36, 780 / (maksLen * 0.61)));
  const lh = ukuran * 1.6;
  const h = 110 + baris.length * lh + 30;
  const y0 = (1060 - h) / 2 - 10;
  const cw = ukuran * 0.6;
  const tBaru = Math.max(0.6, d * 0.35);
  const tHapus = Math.max(0.5, d * 0.28);
  const ext = String(data?.bahasa || 'cpp').toLowerCase().startsWith('py') ? 'py' : 'ino';
  return (
    <Svg>
      <g transform={`translate(40,${y0})`}>
        <g filter="url(#bayang)">
          <rect width={1000} height={h} rx={18} fill="#0A0E12" />
        </g>
        <rect width={1000} height={h} rx={18} fill="none" stroke="#3A4754" strokeWidth={3} />
        <rect width={1000} height={70} rx={18} fill="#151D26" />
        <rect y={52} width={1000} height={18} fill="#151D26" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={34 + i * 30} cy={35} r={9} fill={['#FF6B6B', '#C77700', '#45D99A'][i]} opacity={0.85} />
        ))}
        <text x={500} y={45} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={K.dim}>{`main.${ext}`}</text>
        {baris.map((b, i) => {
          const no = i + 1;
          const isBaru = baru.includes(no);
          const isHapus = hapus.includes(no);
          const y = 100 + i * lh;
          const muncul = naik(lt, 0.05 + i * 0.05, 0.25);
          let teks = b;
          if (isBaru) {
            const k = interpolate(lt, [tBaru, tBaru + Math.min(1.2, 0.04 * b.length + 0.2)], [0, 1], C);
            teks = b.slice(0, Math.round(b.length * k));
            if (lt < tBaru) teks = '';
          }
          const sorotOp = sorot.includes(no) ? naik(lt, 0.5, 0.3) : 0;
          const coret = isHapus ? interpolate(lt, [tHapus, tHapus + 0.35], [0, 1], C) : 0;
          return (
            <g key={i} opacity={isBaru ? 1 : muncul}>
              {sorotOp > 0 && <rect x={70} y={y - 4} width={900} height={lh} rx={8} fill={K.cyan} fillOpacity={0.14 * sorotOp} stroke={K.cyan} strokeOpacity={0.7 * sorotOp} strokeWidth={2} />}
              {isBaru && lt >= tBaru && <rect x={70} y={y - 4} width={900} height={lh} rx={8} fill={K.ok} fillOpacity={0.14} />}
              {isHapus && coret > 0 && <rect x={70} y={y - 4} width={900} height={lh} rx={8} fill={K.err} fillOpacity={0.12 * coret} />}
              <text x={34} y={y + lh * 0.66} fontFamily={MONO} fontSize={ukuran * 0.8} fill="#4A5763">
                {isBaru ? '+' : isHapus ? '−' : no}
              </text>
              <text x={84} y={y + lh * 0.66} fontFamily={MONO} fontSize={ukuran} fill={isBaru ? K.ok : isHapus && coret > 0.5 ? '#9AA5B1' : sorot.includes(no) ? K.text : '#A9B5BF'} style={{ whiteSpace: 'pre', fontVariantLigatures: 'none' }}>
                {teks}
              </text>
              {coret > 0 && <line x1={84} y1={y + lh * 0.45} x2={84 + b.length * cw * coret} y2={y + lh * 0.45} stroke={K.err} strokeWidth={4} strokeLinecap="round" />}
              {isBaru && lt >= tBaru && teks.length === b.length && <Ikon x={940} y={y + lh / 2 - 2} r={18} jenis="ok" s={pop(lt, tBaru + 0.04 * b.length + 0.25)} />}
            </g>
          );
        })}
      </g>
    </Svg>
  );
};

/* ================================================================== */
/* kartu_status — cincin status yang berganti                           */
/* ================================================================== */
export const KartuStatus: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  const urutan: string[] = (data?.urutan_status ?? ['?']).map(String).slice(0, 4);
  const warna: string[] = data?.warna ?? [];
  const n = urutan.length;
  const per = (d * 0.85) / n;
  const i = Math.min(n - 1, Math.floor(Math.max(0, lt - 0.15) / per));
  const t0 = 0.15 + i * per;
  const w = warnaNama(warna[i]);
  const busur = interpolate(lt, [t0, t0 + per], [0, 1], C);
  const R = 210;
  const cx = 540;
  const cy = 380;
  const sudut = busur * 2 * Math.PI - Math.PI / 2;
  const ex = cx + R * Math.cos(sudut);
  const ey = cy + R * Math.sin(sudut);
  const s = pop(lt, t0, 0.3);
  const status = urutan[i];
  const besar = ukuranPas(status, status.length > 9 ? 70 : 100, 760, MONO, 800, 0, 40);
  return (
    <Svg>
      <text x={540} y={80} textAnchor="middle" fontFamily={MONO} fontSize={ukuranPas(String(data?.label ?? 'STATUS').toUpperCase(), 32, 920, MONO, 400, 8, 18)} letterSpacing={8} fill={K.dim}>
        {potong(String(data?.label ?? 'STATUS').toUpperCase(), 40, 'kartu_status label')}
      </text>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1C2731" strokeWidth={26} />
      {busur > 0 && busur < 1 && (
        <path d={`M${cx},${cy - R} A${R},${R} 0 ${busur > 0.5 ? 1 : 0} 1 ${ex},${ey}`} fill="none" stroke={w} strokeWidth={26} strokeLinecap="round" filter="url(#pendar)" />
      )}
      {busur >= 1 && <circle cx={cx} cy={cy} r={R} fill="none" stroke={w} strokeWidth={26} />}
      <circle cx={cx} cy={cy} r={R - 40} fill={w} opacity={0.08} />
      <Ikon x={cx} y={cy} r={90} jenis={ikonDariWarna(warna[i])} s={s} />
      <g transform={`translate(540,${cy + R + 170}) scale(${0.85 + 0.15 * s})`}>
        <text textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={besar} fill={w}>
          {potong(status, 24, 'kartu_status status')}
        </text>
      </g>
      {urutan.map((u, k) => (
        <g key={k} opacity={k <= i ? 1 : 0.25}>
          <circle cx={540 + (k - (n - 1) / 2) * 60} cy={cy + R + 260} r={11} fill={k <= i ? warnaNama(warna[k]) : '#3A4754'} />
        </g>
      ))}
    </Svg>
  );
};

/* ================================================================== */
/* x_vs_y — lembar datasheet terang, dua kolom                          */
/* ================================================================== */
const INK = '#151D26';
export const XvsY: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  const kiri = data?.kiri ?? {};
  const kanan = data?.kanan ?? {};
  if ((kiri.poin ?? []).length > 4 || (kanan.poin ?? []).length > 4) catatPotong('x_vs_y: lebih dari 4 poin', '');
  const pk: string[] = (kiri.poin ?? []).slice(0, 4).map(String);
  const pn: string[] = (kanan.poin ?? []).slice(0, 4).map(String);
  const nBaris = Math.max(pk.length, pn.length);
  const step = Math.min(0.6, (d * 0.6) / Math.max(1, nBaris * 2));
  // Lebar teks tiap kolom 340 px (kolom kanan berakhir di x 944, di luar area tombol YouTube).
  const LEBAR = 340;
  const RUANG = 610; // tinggi yang tersedia untuk poin (y 320–930)
  let u = 33;
  let bk: string[][] = [];
  let bn: string[][] = [];
  let tinggi: number[] = [];
  for (const coba of [33, 30, 27, 24]) {
    u = coba;
    bk = pk.map((p) => bungkusLebar(p, LEBAR, u, SANS, 600));
    bn = pn.map((p) => bungkusLebar(p, LEBAR, u, SANS, 600));
    tinggi = Array.from({ length: nBaris }, (_, i) => Math.max(bk[i]?.length ?? 0, bn[i]?.length ?? 0) * u * 1.22 + 44);
    const lebarOk = [...bk, ...bn].every((bb) => bb.every((x) => lebarTeks(x, u, SANS, 600) <= LEBAR));
    if (lebarOk && tinggi.reduce((x, y) => x + y, 0) <= RUANG) break;
    if (coba === 24) catatPotong('x_vs_y: poin terlalu panjang', [...pk, ...pn].join(' / '));
  }
  const yBaris = tinggi.map((_, i) => 320 + tinggi.slice(0, i).reduce((x, y) => x + y, 0));
  const Kolom = ({ x, judul, baris, warna, mulai }: { x: number; judul: string; baris: string[][]; warna: string; mulai: number }) => {
    const j = potong(judul, 30, 'x_vs_y judul kolom');
    return (
      <g>
        <text x={x} y={250} fontFamily={MONO} fontWeight={800} fontSize={ukuranPas(j, 44, 380, MONO, 800, 0, 24)} fill={warna}>
          {j}
        </text>
        <line x1={x} y1={272} x2={x + 380} y2={272} stroke={warna} strokeWidth={4} />
        {baris.map((bar, i) => {
          const k = naik(lt, mulai + i * step * 2, 0.3);
          return (
            <g key={i} opacity={k} transform={`translate(${(1 - k) * -24},0)`}>
              <circle cx={x + 10} cy={yBaris[i] + 16 - (33 - u) * 0.4} r={8} fill={warna} />
              {bar.map((b, jj) => (
                <text key={jj} x={x + 34} y={yBaris[i] + 26 + jj * u * 1.22} fontFamily={SANS} fontWeight={600} fontSize={u} fill="#FFFFFF">
                  {b}
                </text>
              ))}
            </g>
          );
        })}
      </g>
    );
  };
  return (
    <Svg>
      <g filter="url(#bayang)">
        <rect x={50} y={30} width={980} height={960} rx={16} fill={K.card} />
      </g>
      {Array.from({ length: 17 }, (_, i) => (
        <line key={i} x1={50} y1={150 + i * 50} x2={1030} y2={150 + i * 50} stroke="#DDE3DC" strokeWidth={1.5} />
      ))}
      <rect x={50} y={30} width={980} height={110} rx={16} fill={INK} />
      <rect x={50} y={110} width={980} height={30} fill={INK} />
      <text x={90} y={104} fontFamily={SANS} fontWeight={900} fontSize={50} fill="#FFFFFF">LEMBAR</text>
      <text x={330} y={92} fontFamily={MONO} fontWeight={700} fontSize={24} letterSpacing={4} fill="#FFFFFF">BANDINGKAN</text>
      <line x1={540} y1={200} x2={540} y2={950} stroke="#C9D1C8" strokeWidth={2} />
      <Kolom x={90} judul={kiri.judul} baris={bk} warna="#0E8F99" mulai={0.25} />
      <Kolom x={570} judul={kanan.judul} baris={bn} warna="#C77700" mulai={0.25 + step} />
      <g transform={`translate(540,212) scale(${pop(lt, 0.3)})`}>
        <circle r={36} fill={INK} />
        <text y={12} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={30} fill="#FFFFFF">VS</text>
      </g>
    </Svg>
  );
};

/* ================================================================== */
/* diagram — alur bertahap dengan cahaya mengalir                       */
/* ================================================================== */
export const Diagram: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  if ((data?.elemen ?? []).length > 5) catatPotong('diagram: lebih dari 5 elemen', (data?.elemen ?? []).slice(5).join(' / '));
  const el: string[] = (data?.elemen ?? []).map(String).slice(0, 5);
  const n = Math.max(1, el.length);
  const hKotak = 130;
  const gap = Math.min(70, (960 - n * hKotak) / Math.max(1, n - 1));
  const total = n * hKotak + (n - 1) * gap;
  const y0 = (1060 - total) / 2;
  const step = (d * 0.75) / n;
  const tAktif = (i: number) => 0.2 + i * step;
  return (
    <Svg>
      {el.map((e, i) => {
        const y = y0 + i * (hKotak + gap);
        const aktif = lt >= tAktif(i);
        const k = naik(lt, tAktif(i), 0.3);
        const masuk = naik(lt, 0.05 + i * 0.06, 0.3);
        const { baris: bar, ukuran: uk } = susunTeks(e, 650, [36, 31, 27], 2, SANS, 700, 'diagram elemen');
        const sekarang = aktif && (i === n - 1 || lt < tAktif(i + 1));
        return (
          <g key={i} opacity={0.35 + 0.65 * masuk}>
            {i > 0 && (
              <g>
                <line x1={540} y1={y - gap} x2={540} y2={y} stroke="#3A4754" strokeWidth={4} />
                {lt > tAktif(i) - 0.35 && lt < tAktif(i) && (
                  <circle cx={540} cy={y - gap + gap * ((lt - (tAktif(i) - 0.35)) / 0.35)} r={11} fill="#fff" filter="url(#pendar)" />
                )}
                {aktif && <line x1={540} y1={y - gap} x2={540} y2={y} stroke={K.cyan} strokeWidth={4} />}
              </g>
            )}
            <g filter={aktif ? undefined : undefined}>
              <rect x={150} y={y} width={780} height={hKotak} rx={18} fill={aktif ? 'rgba(199,119,0,0.10)' : K.card} stroke={aktif ? K.cyan : '#3A4754'} strokeWidth={aktif ? 3 + (sekarang ? 2 * k : 0) : 2} />
            </g>
            {sekarang && <rect x={150} y={y} width={780} height={hKotak} rx={18} fill="none" stroke={K.cyan} strokeWidth={8} opacity={0.35} filter="url(#pendar)" />}
            <text x={190} y={y + 46} fontFamily={MONO} fontSize={22} letterSpacing={3} fill={aktif ? K.cyan : '#4A5763'}>
              {String(i + 1).padStart(2, '0')}
            </text>
            {bar.map((b, j) => (
              <text key={j} x={250} y={y + (bar.length === 1 ? 65 + uk * 0.36 : 65 - uk * 0.6 + uk * 0.36 + j * uk * 1.2)} fontFamily={SANS} fontWeight={700} fontSize={uk} fill={aktif ? K.text : K.dim}>
                {b}
              </text>
            ))}
          </g>
        );
      })}
    </Svg>
  );
};

/* ================================================================== */
/* kartu_masalah / kartu_solusi                                        */
/* ================================================================== */
const CincinIkon: React.FC<{ lt: number; jenis: 'ok' | 'err' }> = ({ lt, jenis }) => {
  const w = jenis === 'ok' ? K.ok : K.err;
  const cx = 540;
  const cy = 300;
  const s = pop(lt, 0.15, 0.4);
  const gambar = interpolate(lt, [0.25, 0.7], [0, 1], { ...C, easing: Easing.out(Easing.cubic) });
  return (
    <g>
      {[0, 1, 2].map((k) => {
        const f = ((lt + k * 0.6) % 1.8) / 1.8;
        return <circle key={k} cx={cx} cy={cy} r={160 + f * 160} fill="none" stroke={w} strokeWidth={4 * (1 - f)} opacity={(1 - f) * 0.6} />;
      })}
      <g transform={`translate(${cx},${cy}) scale(${s})`}>
        <circle r={150} fill={w} opacity={0.12} />
        <circle r={150} fill="none" stroke={w} strokeWidth={10} />
        {jenis === 'ok' ? (
          <path d="M-62,4 L-18,48 L68,-44" fill="none" stroke={w} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gambar} />
        ) : (
          <path d="M-52,-52 L52,52 M52,-52 L-52,52" fill="none" stroke={w} strokeWidth={22} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gambar} />
        )}
      </g>
    </g>
  );
};
const KartuTeks: React.FC<PropsAdegan & { jenis: 'ok' | 'err' }> = ({ lt, data, jenis, teks }) => {
  const isi = String(data?.teks ?? teks ?? '');
  const { baris, ukuran } = susunTeks(isi, 760, [66, 58, 50, 44], 5, SANS, 800, jenis === 'ok' ? 'kartu_solusi teks' : 'kartu_masalah teks');
  return (
    <>
      <Svg>
        <CincinIkon lt={lt} jenis={jenis} />
      </Svg>
      <div style={{ position: 'absolute', top: 560, left: 140, right: 140 }}>
        <TeksKinetik lt={lt} mulai={0.4} baris={baris} ukuran={ukuran} />
      </div>
    </>
  );
};
export const KartuMasalah: React.FC<PropsAdegan> = (p) => <KartuTeks {...p} jenis="err" />;
export const KartuSolusi: React.FC<PropsAdegan> = (p) => <KartuTeks {...p} jenis="ok" />;

/* ================================================================== */
/* bukti_asli / ilustrasi — layar osiloskop + keterangan                */
/* ================================================================== */
export const Bukti: React.FC<PropsAdegan> = ({ lt, data, teks }) => {
  const ket = String(data?.keterangan ?? data?.teks ?? teks ?? '');
  const { baris, ukuran: uk } = susunTeks(ket, 760, [44, 38, 33], 4, SANS, 700, 'bukti keterangan');
  const titik = Array.from({ length: 121 }, (_, i) => {
    const x = 90 + i * 7.5;
    const fase = (i / 120) * Math.PI * 6 - lt * 6;
    const y = 360 + (Math.sin(fase) > 0 ? -90 : 90);
    return `${i ? 'L' : 'M'}${x},${y}`;
  }).join(' ');
  return (
    <Svg>
      <g filter="url(#bayang)">
        <rect x={60} y={120} width={960} height={500} rx={18} fill="#070B0E" />
      </g>
      <rect x={60} y={120} width={960} height={500} rx={18} fill="none" stroke="#3A4754" strokeWidth={3} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={`v${i}`} x1={60 + (i + 1) * 96} y1={130} x2={60 + (i + 1) * 96} y2={610} stroke="#132029" strokeWidth={2} />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <line key={`h${i}`} x1={70} y1={120 + (i + 1) * 100} x2={1010} y2={120 + (i + 1) * 100} stroke="#132029" strokeWidth={2} />
      ))}
      <circle cx={100} cy={160} r={10} fill={K.err} opacity={0.5 + 0.5 * Math.sin(lt * 6)} />
      <text x={122} y={170} fontFamily={MONO} fontSize={26} letterSpacing={3} fill={K.err}>REC · BUKTI</text>
      <path d={titik} fill="none" stroke={K.cyan} strokeWidth={5} strokeLinejoin="round" filter="url(#pendar)" />
      {baris.map((b, i) => (
        <text key={i} x={540} y={720 + i * uk * 1.27} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={uk} fill={K.text} opacity={naik(lt, 0.3 + i * 0.15)}>
          {b}
        </text>
      ))}
    </Svg>
  );
};

/* ================================================================== */
/* cta — pertanyaan komentar                                           */
/* ================================================================== */
export const Cta: React.FC<PropsAdegan> = ({ lt, data, teks }) => {
  const isi = String(data?.teks ?? teks ?? 'Tulis di komentar');
  const { baris, ukuran: uk } = susunTeks(isi, 800, [60, 52, 46, 40], 5, SANS, 800, 'cta teks');
  return (
    <>
      <Svg>
        <g opacity={naik(lt, 0.05)} transform={`translate(0,${(1 - naik(lt, 0.05)) * 30})`}>
          <g filter="url(#bayang)">
            <rect x={90} y={170} width={900} height={500} rx={36} fill={K.card} />
          </g>
          <rect x={90} y={170} width={900} height={500} rx={36} fill="none" stroke={K.cyan} strokeOpacity={0.7} strokeWidth={3} />
          <path d="M250,668 l-20,70 l90,-70 Z" fill={K.card} stroke={K.cyan} strokeOpacity={0.7} strokeWidth={3} strokeLinejoin="round" />
          <rect x={248} y={662} width={74} height={10} fill={K.card} />
          <text x={540} y={240} textAnchor="middle" fontFamily={MONO} fontSize={26} letterSpacing={6} fill={K.cyan}>KOMENTAR</text>
        </g>
        <Pill t={lt} a={Math.max(0.8, 0.4 + baris.join(' ').split(' ').length * 0.07)} x={540} y={880} teks="Tulis di komentar ↓" />
        <KursorSvg lt={lt} jejak={[{ t: 0.5, x: 260, y: 1010 }, { t: 1.3, x: 540, y: 880, klik: true }]} />
      </Svg>
      <div style={{ position: 'absolute', top: 290, left: 130, right: 130 }}>
        <TeksKinetik lt={lt} mulai={0.25} baris={baris} ukuran={uk} />
      </div>
    </>
  );
};

/* ================================================================== */
/* sinyal — gelombang UART / digital, opsional dibaca salah             */
/* ================================================================== */
const bitUart = (teks: string): number[] => {
  const out: number[] = [1, 1];
  for (const ch of String(teks || 'Hi').slice(0, 3)) {
    const c = ch.charCodeAt(0) & 0xff;
    out.push(0);
    for (let b = 0; b < 8; b++) out.push((c >> b) & 1);
    out.push(1);
  }
  out.push(1);
  return out;
};
export const Sinyal: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  const teks = String(data?.teks ?? 'Hi').slice(0, 3);
  const BIT = data?.bit ? String(data.bit).split('').map((x: string) => (x === '1' ? 1 : 0)) : bitUart(teks);
  const X0 = 60;
  const BW = 960 / BIT.length;
  const bx = (i: number) => X0 + i * BW;
  const salah = !!data?.salah;
  const yA = salah ? [190, 280] : [330, 470];
  const gel = (hi: number, lo: number) => {
    let s = `M${X0},${BIT[0] ? hi : lo}`;
    BIT.forEach((b: number, i: number) => {
      s += ` V${b ? hi : lo} H${bx(i + 1)}`;
    });
    return s;
  };
  const tGambar = Math.min(1.6, d * 0.3);
  const lebar = interpolate(lt, [0.2, 0.2 + tGambar], [0, 960], { ...C, easing: Easing.inOut(Easing.cubic) });
  const tB = 0.4 + tGambar + 0.6;
  const lebarB = interpolate(lt, [tB, tB + 0.5], [0, 960], C);
  const kepala = (lb: number, hi: number, lo: number, r: number) => {
    if (lb <= 2 || lb >= 958) return null;
    const i = Math.min(BIT.length - 1, Math.floor(lb / BW));
    const y = BIT[i] ? hi : lo;
    return (
      <g>
        <circle cx={X0 + lb} cy={y} r={r * 2.4} fill={K.cyan} opacity={0.4} filter="url(#pendar)" />
        <circle cx={X0 + lb} cy={y} r={r} fill="#fff" />
      </g>
    );
  };
  const frame0 = BIT.indexOf(0);
  return (
    <Svg>
      <defs>
        <clipPath id="klipSinyalA">
          <rect x={0} y={0} width={X0 + lebar} height={1060} />
        </clipPath>
        <clipPath id="klipSinyalB">
          <rect x={0} y={0} width={X0 + lebarB} height={1060} />
        </clipPath>
      </defs>
      <text x={X0} y={yA[0] - 100} fontFamily={MONO} fontSize={24} letterSpacing={3} fill={K.dim}>
        {potong(String(data?.label ?? 'SINYAL TX').toUpperCase(), 40, 'sinyal label')}
      </text>
      <line x1={X0} y1={yA[1] + 20} x2={1020} y2={yA[1] + 20} stroke="#22303C" strokeWidth={2} />
      <g clipPath="url(#klipSinyalA)">
        <path d={gel(yA[0], yA[1])} fill="none" stroke={K.cyan} strokeWidth={5} strokeLinejoin="round" filter="url(#pendar)" />
      </g>
      {kepala(lebar, yA[0], yA[1], 10)}
      {teks.split('').map((ch, k) => {
        const awal = frame0 + k * 10;
        if (awal < 0 || data?.bit) return null;
        return (
          <g key={k} transform={`translate(${bx(awal) + BW * 5},${yA[0] - 40}) scale(${pop(lt, 0.3 + tGambar + k * 0.25)})`}>
            <rect x={-BW * 5 + 4} y={-28} width={BW * 10 - 8} height={40} rx={8} fill={K.ok} opacity={0.1} />
            <text y={4} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={50} fill={K.ok}>{ch}</text>
          </g>
        );
      })}
      {data?.catatan && (
        <text x={X0} y={yA[1] + 90} fontFamily={SANS} fontWeight={700} fontSize={32} fill={K.text} opacity={naik(lt, 0.4 + tGambar)}>
          {(() => {
            const b = bungkus(String(data.catatan), 44, 99);
            if (b.length > 1) catatPotong('sinyal catatan', String(data.catatan));
            return bungkus(String(data.catatan), 44, 1)[0];
          })()}
        </text>
      )}
      {salah && (
        <g>
          <g opacity={naik(lt, tB - 0.1)}>
            <text x={X0} y={500} fontFamily={MONO} fontSize={24} letterSpacing={3} fill={K.dim}>
              {potong(String(data?.label_salah ?? 'DIBACA SALAH').toUpperCase(), 40, 'sinyal label_salah')}
            </text>
            <line x1={X0} y1={700} x2={1020} y2={700} stroke="#22303C" strokeWidth={2} />
          </g>
          <g clipPath="url(#klipSinyalB)">
            <path d={gel(590, 680)} fill="none" stroke={K.cyan} strokeOpacity={0.5} strokeWidth={5} strokeLinejoin="round" />
          </g>
          {kepala(lebarB, 590, 680, 8)}
          {[0.3, 0.75].map((f, k) => {
            const i = Math.floor(BIT.length * f);
            return <circle key={k} cx={bx(i) + BW / 2} cy={BIT[i] ? 590 : 680} r={12} fill={K.err} opacity={naik(lt, tB + 0.6 + k * 0.3, 0.15)} />;
          })}
          <g opacity={naik(lt, tB + 1.2)}>
            <Ikon x={X0 + 22} y={782} r={22} jenis="err" />
            <text x={X0 + 58} y={793} fontFamily={SANS} fontWeight={700} fontSize={32} fill={K.text}>
              hasil: “<tspan fill={K.err}>{String(data?.hasil_salah ?? 'ÿ').slice(0, 6)}</tspan>”
            </text>
          </g>
        </g>
      )}
    </Svg>
  );
};

/* ================================================================== */
/* garis_waktu — jalur waktu dengan blok & tanda ✓/✕                    */
/* ================================================================== */
export const GarisWaktu: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  const jalur: any[] = (data?.jalur ?? []).slice(0, 3);
  const tanda: any[] = (data?.tanda ?? []).slice(0, 6);
  const maks = Number(data?.maks) > 0 ? Number(data.maks) : 3;
  const sat = String(data?.satuan ?? 'dtk');
  const GX0 = 130;
  // ujung kanan sumbu di x 870: label waktu & tanda di ujung tidak masuk kolom tombol YouTube (x ≥ 945)
  const GX1 = 870;
  const gx = (v: number) => GX0 + (Math.max(0, Math.min(maks, v)) / maks) * (GX1 - GX0);
  const nilai = interpolate(lt, [0.4, Math.max(1.2, d - 0.6)], [0, maks], C);
  const xp = gx(nilai);
  const yJ = (i: number) => 220 + i * (jalur.length > 2 ? 230 : 300);
  const yAxis = yJ(jalur.length - 1) + 150;
  // isi digeser ke tengah panggung (1 jalur tidak lagi menggantung di atas)
  const geserY = Math.max(0, Math.round((1060 - (yAxis + 60 - (yJ(0) - 110))) / 2 - (yJ(0) - 110)));
  return (
    <Svg>
      <g transform={`translate(0,${geserY})`}>
      <defs>
        <clipPath id="klipGW">
          <rect x={0} y={0} width={xp} height={1060} />
        </clipPath>
      </defs>
      {jalur.map((j, i) => (
        <g key={i}>
          <text x={GX0 - 60} y={yJ(i) - 70} fontFamily={MONO} fontWeight={700} fontSize={28} letterSpacing={4} fill={K.dim}>
            {potong(String(j?.nama ?? '').toUpperCase(), 28, 'garis_waktu nama jalur')}
          </text>
          <line x1={GX0 - 60} y1={yJ(i) + 60} x2={GX1 + 40} y2={yJ(i) + 60} stroke="#22303C" strokeWidth={2} />
        </g>
      ))}
      <line x1={GX0} y1={yAxis} x2={GX1} y2={yAxis} stroke="#3A4754" strokeWidth={3} />
      {[0, 1, 2, 3].map((k) => {
        const v = (maks * k) / 3;
        return (
          <g key={k}>
            <line x1={gx(v)} y1={yAxis - 8} x2={gx(v)} y2={yAxis + 8} stroke="#3A4754" strokeWidth={3} />
            <text x={gx(v)} y={yAxis + 46} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={K.dim}>
              {k === 0 ? '0' : `${Number(v.toFixed(1))} ${sat}`}
            </text>
          </g>
        );
      })}
      <g clipPath="url(#klipGW)">
        {jalur.map((j, i) =>
          (j?.blok ?? []).slice(0, 12).map((b: any, k: number) => {
            const x1 = gx(Number(b.mulai) || 0);
            const x2 = gx(Number(b.selesai) || 0);
            const w = warnaNama(b.warna);
            return (
              <g key={`${i}-${k}`}>
                <rect x={x1} y={yJ(i) - 40} width={Math.max(6, x2 - x1 - 4)} height={90} rx={8} fill={w} fillOpacity={0.85} />
                {b.label && x2 - x1 > 120 && (() => {
                  // label blok mengecil supaya muat; kalau tetap tidak muat, dipotong + dicatat untuk QA
                  const lbl = String(b.label);
                  const uk = ukuranPas(lbl, 26, x2 - x1 - 24, MONO, 700, 0, 17);
                  const muat = Math.max(1, Math.floor((x2 - x1 - 24) / (uk * 0.6)));
                  return (
                    <text x={(x1 + x2) / 2} y={yJ(i) + 14} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={uk} fill={K.bg}>
                      {potong(lbl, muat, 'garis_waktu label blok')}
                    </text>
                  );
                })()}
              </g>
            );
          }),
        )}
      </g>
      {tanda.map((m, k) => {
        const v = Number(m.t) || 0;
        // tanda tepat di ujung sumbu (t = maks) tetap muncul
        const a0 = Math.min(v, maks * 0.96);
        const muncul = interpolate(nilai, [a0, a0 + maks * 0.04], [0, 1], C);
        if (muncul <= 0) return null;
        const ji = Math.max(0, Math.min(jalur.length - 1, Number(m.jalur) || 0));
        const jenis = m.jenis === 'err' ? 'err' : 'ok';
        return (
          <g key={k}>
            {/* ikon duduk di tepi atas blok, tidak menutupi label blok */}
            <Ikon x={gx(v)} y={yJ(ji) - 40} r={30} jenis={jenis} s={interpolate(muncul, [0, 0.6, 1], [0.4, 1.15, 1])} />
            {m.label && (
              <text x={gx(v) > GX1 - 70 ? gx(v) + 30 : gx(v)} y={yJ(ji) + 80} textAnchor={gx(v) > GX1 - 70 ? 'end' : 'middle'} fontFamily={MONO} fontWeight={800} fontSize={24} fill={jenis === 'err' ? K.err : K.ok} opacity={muncul}>
                {potong(m.label, 16, 'garis_waktu label tanda')}
              </text>
            )}
          </g>
        );
      })}
      <line x1={xp} y1={yJ(0) - 110} x2={xp} y2={yAxis} stroke={K.text} strokeWidth={3} opacity={0.9} />
      <circle cx={xp} cy={yAxis} r={11} fill={K.text} />
      </g>
    </Svg>
  );
};

/* ================================================================== */
/* lembar — tabel datasheet terang dengan angka menghitung               */
/* ================================================================== */
export const Lembar: React.FC<PropsAdegan> = ({ lt, d, data }) => {
  if ((data?.baris ?? []).length > 4) catatPotong('lembar: lebih dari 4 baris', '');
  const baris: any[] = (data?.baris ?? []).slice(0, 4);
  const kolom: string[] = data?.kolom ?? ['ITEM', 'NILAI'];
  const step = Math.min(1.4, (d * 0.7) / Math.max(1, baris.length));
  const tinggiBaris = baris.length > 3 ? 175 : 220;
  // Tepi teks: kiri 90, kanan 925 (kolom nilai tidak masuk area tombol YouTube di kanan bawah).
  const KI = 90;
  const KA = 925;
  // Kepala lembar: kode di kiri, judul + sub rata kanan. Ukuran font diukur supaya tidak saling tabrak.
  const kode = potong(data?.kode ?? 'LEMBAR', 16, 'lembar kode');
  const fKode = ukuranPas(kode, 48, 400, SANS, 900);
  const lKode = lebarTeks(kode, fKode, SANS, 900);
  const sisa = 990 - (KI + lKode + 36);
  const judul = potong(String(data?.judul ?? '').toUpperCase(), 34, 'lembar judul');
  const sub = potong(String(data?.sub ?? '').toUpperCase(), 44, 'lembar sub');
  const fJudul = ukuranPas(judul, 22, sisa, MONO, 700, 3, 13);
  const fSub = ukuranPas(sub, 18, sisa, MONO, 400, 2, 12);
  return (
    <Svg>
      <g filter="url(#bayang)">
        <rect x={50} y={30} width={980} height={960} rx={16} fill={K.card} />
      </g>
      {Array.from({ length: 17 }, (_, i) => (
        <line key={i} x1={50} y1={150 + i * 50} x2={1030} y2={150 + i * 50} stroke="#DDE3DC" strokeWidth={1.5} />
      ))}
      <rect x={50} y={30} width={980} height={110} rx={16} fill={INK} />
      <rect x={50} y={110} width={980} height={30} fill={INK} />
      <text x={KI} y={102} fontFamily={SANS} fontWeight={900} fontSize={fKode} fill="#FFFFFF">{kode}</text>
      {judul && <text x={990} y={sub ? 80 : 94} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={fJudul} letterSpacing={3} fill="#FFFFFF">{judul}</text>}
      {sub && <text x={990} y={112} textAnchor="end" fontFamily={MONO} fontSize={fSub} letterSpacing={2} fill="#5D6B78">{sub}</text>}
      <text x={KI} y={210} fontFamily={MONO} fontSize={22} letterSpacing={3} fill={K.dim}>{potong(String(kolom[0] ?? '').toUpperCase(), 26, 'lembar kolom')}</text>
      <text x={KA} y={210} textAnchor="end" fontFamily={MONO} fontSize={22} letterSpacing={3} fill={K.dim}>{potong(String(kolom[1] ?? '').toUpperCase(), 20, 'lembar kolom')}</text>
      <line x1={KI} y1={228} x2={990} y2={228} stroke={K.dim} strokeWidth={2} />
      {baris.map((b, i) => {
        const a = 0.25 + i * step;
        const k = naik(lt, a, 0.35);
        const y = 320 + i * tinggiBaris;
        const mentah = potong(b?.nilai ?? '', 12, 'lembar nilai');
        const angka = /^-?\d+(\.\d+)?$/.test(mentah) ? Number(mentah) : null;
        const tampil = angka !== null ? String(Math.round(interpolate(lt, [a + 0.1, a + 0.8], [0, angka], { ...C, easing: Easing.out(Easing.cubic) }))) : mentah;
        const w = b?.warna === 'amber' || b?.warna === 'kuning' ? '#C77700' : b?.warna === 'merah' ? '#C53B3B' : b?.warna === 'hijau' ? '#178A5B' : '#0E8F99';
        // nilai diukur dulu, nama & keterangan mengisi sisa ruang di kirinya
        const fNilai = ukuranPas(mentah, mentah.length > 7 ? 52 : 68, 380, MONO, 800);
        const lNilai = lebarTeks(mentah, fNilai, MONO, 800);
        const catatan = b?.catatan ? potong(b.catatan, 24, 'lembar catatan') : '';
        const lCatatan = catatan ? lebarTeks(catatan, 26, SANS, 700) : 0;
        const nama = potong(b?.nama ?? '', 26, 'lembar nama');
        const ket = potong(b?.ket ?? '', 40, 'lembar ket');
        const fNama = ukuranPas(nama, 44, KA - KI - lNilai - 36, SANS, 800, 0, 26);
        const fKet = ukuranPas(ket, 28, KA - KI - Math.max(lNilai, lCatatan) - 36, SANS, 400, 0, 18);
        return (
          <g key={i} opacity={k} transform={`translate(${(1 - k) * -40},0)`}>
            <text x={KI} y={y} fontFamily={SANS} fontWeight={800} fontSize={fNama} fill="#FFFFFF">{nama}</text>
            <text x={KI} y={y + 48} fontFamily={SANS} fontSize={fKet} fill="#45525C">{ket}</text>
            <text x={KA} y={y + 12} textAnchor="end" fontFamily={MONO} fontWeight={800} fontSize={fNilai} fill={w}>{tampil}</text>
            {catatan && (
              <text x={KA} y={y + 56} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={26} fill={w} opacity={naik(lt, a + 0.9)}>{catatan}</text>
            )}
            <line x1={KI} y1={y + 92} x2={990} y2={y + 92} stroke="#C9D1C8" strokeWidth={2} />
          </g>
        );
      })}
      {data?.sumber && (
        <text x={KI} y={950} fontFamily={MONO} fontSize={ukuranPas(`Sumber: ${potong(data.sumber, 80, 'lembar sumber')}`, 20, 830, MONO, 400, 0, 14)} fill={K.dim} opacity={naik(lt, 0.3 + baris.length * step)}>
          {`Sumber: ${String(data.sumber).slice(0, 80)}`}
        </text>
      )}
    </Svg>
  );
};

/* ================================================================== */
export const KOMPONEN_V2: Record<string, React.FC<PropsAdegan>> = {
  log_serial: LogSerial,
  kartu_kode: KartuKode,
  kartu_status: KartuStatus,
  x_vs_y: XvsY,
  diagram: Diagram,
  kartu_masalah: KartuMasalah,
  kartu_solusi: KartuSolusi,
  bukti_asli: Bukti,
  ilustrasi: Bukti,
  cta: Cta,
  sinyal: Sinyal,
  garis_waktu: GarisWaktu,
  lembar: Lembar,
};

/** jadwal SFX per komponen (detik relatif awal adegan) */
export const sfxKomponen = (komponen: string, data: any, d: number): { t: number; f: string; v: number }[] => {
  const out: { t: number; f: string; v: number }[] = [];
  if (komponen === 'log_serial') {
    const n = (data?.baris ?? []).length;
    const step = Math.min(0.45, Math.max(0.12, (d * 0.5) / Math.max(1, n)));
    const sorot: number[] = Array.isArray(data?.sorot) && data.sorot.length ? data.sorot : data?.error ? [n] : [];
    if (sorot.length) out.push({ t: 0.2 + (Math.min(...sorot) - 1) * step + 0.35, f: 'buzz', v: 0.32 });
  }
  if (komponen === 'kartu_kode' && (data?.baris_baru ?? []).length) {
    out.push({ t: Math.max(0.6, d * 0.35), f: 'klik', v: 0.35 });
    out.push({ t: Math.max(0.6, d * 0.35) + 0.9, f: 'ding', v: 0.3 });
  }
  if (komponen === 'kartu_status') {
    const n = (data?.urutan_status ?? []).length || 1;
    for (let i = 0; i < n; i++) out.push({ t: 0.15 + (i * d * 0.85) / n, f: (data?.warna ?? [])[i] === 'merah' ? 'buzz' : 'beep', v: 0.3 });
  }
  if (komponen === 'kartu_masalah') out.push({ t: 0.15, f: 'buzz', v: 0.32 });
  if (komponen === 'kartu_solusi') out.push({ t: 0.2, f: 'ding', v: 0.35 });
  if (komponen === 'x_vs_y') out.push({ t: 0.3, f: 'pop', v: 0.3 });
  if (komponen === 'lembar') {
    const n = (data?.baris ?? []).length;
    const step = Math.min(1.4, (d * 0.7) / Math.max(1, n));
    for (let i = 0; i < Math.min(4, n); i++) out.push({ t: 0.25 + i * step, f: 'pop', v: 0.28 });
  }
  if (komponen === 'diagram') {
    const n = Math.max(1, (data?.elemen ?? []).length);
    for (let i = 0; i < Math.min(5, n); i++) out.push({ t: 0.2 + (i * d * 0.75) / n, f: 'pop', v: 0.25 });
  }
  if (komponen === 'sinyal') {
    out.push({ t: 0.2, f: 'beep', v: 0.28 });
    if (data?.salah) out.push({ t: 0.4 + Math.min(1.6, d * 0.3) + 0.6 + 1.2, f: 'glitch', v: 0.3 });
  }
  if (komponen === 'garis_waktu') {
    const maks = Number(data?.maks) > 0 ? Number(data.maks) : 3;
    for (const m of (data?.tanda ?? []).slice(0, 6)) {
      const t = 0.4 + ((Number(m.t) || 0) / maks) * (Math.max(1.2, d - 0.6) - 0.4);
      out.push({ t, f: m.jenis === 'err' ? 'buzz' : 'pop', v: 0.25 });
    }
  }
  if (komponen === 'cta') out.push({ t: 0.8, f: 'pop', v: 0.3 });
  return out.filter((s) => s.t < d - 0.1);
};

export { acak };
