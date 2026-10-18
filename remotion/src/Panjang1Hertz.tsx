// Template VIDEO PANJANG 1Hertz (16:9, 1920x1080) — format katalog "naik tangga".
// Gaya sama dengan Shorts guidebook (latar titik gelap, pil tag cyan, judul kinetik 2 baris,
// HUD, hantaman, grain, SFX), penyajian beda: menu bulat → zoom ke item → kenalan → spesifikasi
// → kegunaan → plus/minus → kembali ke menu; penutup = grafik perbandingan + CTA.
import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, Easing, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { K, SANS, MONO, naik, pop, w, Warna } from './gaya/pustaka';
import { acak } from './gaya/panjang16';
import { Sfx, Bunyi } from './gaya/gb';
import { Foto, Bidik, Ikon, Transisi16, POLA, Kilatan, TanggaBesar, OtakProyek, BedaUkuran, DuaRibuKali, Agenda } from './gaya/panjang16';
import { ukuranPas } from './gaya/ukur';

export const W = 1920;
export const H = 1080;
const C = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

type Spek = { label: string; nilai: string; satuan?: string };
type Guna = string | { teks: string; ikon: string };
export type Item = {
  kunci: string; nama: string; chip: string; kelas: string; ram: number; ram_label: string;
  spek: Spek[]; guna: Guna[]; plus: string[]; minus: string[]; kaki?: number;
  vo: { kenalan: string; spek: string; guna: string; plusmin: string };
  hantaman?: { segmen: string; kata: string };
};
export type DataPanjang = { id: string; judul_video: string; tag?: string; item: Item[]; vo: { intro: string; banding: string; cta: string } };
export type Segmen = { jenis: 'intro' | 'menu' | 'kenalan' | 'spek' | 'guna' | 'plusmin' | 'banding' | 'cta'; item?: number; mulai: number; selesai: number; vo: string };
type Kata = { teks: string; mulai: number; selesai: number };
export type PropsPanjang = { data: DataPanjang; segmen?: Segmen[]; audio?: string; kata?: Kata[]; foto?: Record<string, string>; kredit?: string; musik?: string; total?: number };

/* ---------------- linimasa (dipakai juga oleh produksi-panjang.js lewat salinan logika) ---------------- */
const JEDA_MENU = 1.8;
export const durasiKira = (vo: string) => Math.max(2.5, vo.split(/\s+/).filter(Boolean).length / 2.55 + 0.5);
export const linimasaKira = (d: DataPanjang): Segmen[] => {
  const out: Segmen[] = [];
  let t = 0;
  const tambah = (s: Omit<Segmen, 'mulai' | 'selesai'>, dur: number) => { out.push({ ...s, mulai: t, selesai: t + dur } as Segmen); t += dur; };
  tambah({ jenis: 'intro', vo: d.vo.intro }, durasiKira(d.vo.intro));
  d.item.forEach((it, i) => {
    tambah({ jenis: 'menu', item: i, vo: '' }, JEDA_MENU);
    (['kenalan', 'spek', 'guna', 'plusmin'] as const).forEach((j) => tambah({ jenis: j, item: i, vo: it.vo[j] }, durasiKira(it.vo[j])));
  });
  tambah({ jenis: 'banding', vo: d.vo.banding }, durasiKira(d.vo.banding) + 1);
  tambah({ jenis: 'cta', vo: d.vo.cta }, durasiKira(d.vo.cta) + 1.5);
  return out;
};

/* ---------------- judul kinetik 2 baris (gaya Shorts) ---------------- */
const BarisKinetik: React.FC<{ t: number; a: number; teks: string; warna: string; tunda: number; ukuran: number }> = ({ t, a, teks, warna, tunda, ukuran }) => (
  <div style={{ fontSize: ukuran, fontWeight: 800, color: warna, letterSpacing: -1.5, lineHeight: 1.08, whiteSpace: 'nowrap' }}>
    {teks.split(' ').map((kata, i) => {
      const k = a === 0 && tunda === 0 && i === 0 ? 1 : naik(t, a + tunda + i * 0.08, 0.28);
      return <span key={i} style={{ display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 16}px)`, marginRight: ukuran * 0.25 }}>{kata}</span>;
    })}
  </div>
);
const judulSegmen = (s: Segmen, d: DataPanjang): [string, string, Warna] => {
  const it = s.item != null ? d.item[s.item] : undefined;
  const no = s.item != null ? `0${s.item + 1}` : '';
  switch (s.jenis) {
    case 'intro': return ['Mikrokontroler', 'dari kecil ke besar', 'cyan'];
    case 'menu': return [`Tangga ${no} dari 0${d.item.length}`, it ? it.nama : '', 'amber'];
    case 'kenalan': return [`${no}. ${it!.nama}`, it!.chip, 'cyan'];
    case 'spek': return [it!.nama, 'spesifikasi', 'amber'];
    case 'guna': return [it!.nama, 'dipakai buat apa?', 'cyan'];
    case 'plusmin': return [it!.nama, 'kelebihan & kelemahan', 'ok'];
    case 'banding': return ['Kalau dijejerkan', 'RAM naik 2.000×', 'amber'];
    case 'cta': return ['Kamu pakai', 'yang mana?', 'cyan'];
  }
};

/* ---------------- lembar terang (spesifikasi) ---------------- */
const LembarSpek: React.FC<{ t: number; a: number; d: number; it: Item; no: number; aktif?: number }> = ({ t, a, d, it, no, aktif = -1 }) => {
  const step = Math.min(1.1, (d * 0.65) / Math.max(1, it.spek.length));
  return (
    <div style={{ width: 880, background: '#EEF1EC', borderRadius: 16, overflow: 'hidden', boxShadow: '0 22px 50px rgba(0,0,0,0.55)' }}>
      <div style={{ background: '#0C1117', padding: '22px 34px', display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <div style={{ fontWeight: 900, fontSize: 40, color: '#EEF1EC' }}>LEMBAR {no}</div>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: '#EEF1EC' }}>{it.nama.toUpperCase()}</div>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: '#8B9AA6', marginLeft: 'auto' }}>{it.kelas.toUpperCase()}</div>
      </div>
      <div style={{ padding: '10px 34px 18px' }}>
        {it.spek.map((s, i) => {
          const m = a + 0.3 + i * step;
          const k = naik(t, m, 0.35);
          const angka = /^-?\d+(\.\d+)?$/.test(s.nilai) ? Number(s.nilai) : null;
          const des = (s.nilai.split('.')[1] || '').length;
          const tampil = angka !== null ? interpolate(t, [m + 0.05, m + 0.8], [0, angka], { ...C, easing: Easing.out(Easing.cubic) }).toFixed(des) : s.nilai;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '2px solid #C9D1C8', padding: '14px 12px', margin: '0 -12px', borderRadius: 10, background: i === aktif ? 'rgba(14,143,153,0.14)' : 'transparent', opacity: k, transform: `translateX(${(1 - k) * -30}px) scale(${i === aktif ? 1.02 : 1})` }}>
              <div style={{ fontWeight: 700, fontSize: 32, color: '#1A232C' }}>{s.label}</div>
              <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: 46, color: '#0E8F99' }}>
                {tampil}
                {s.satuan && <span style={{ fontSize: 26, color: '#45525C', marginLeft: 8 }}>{s.satuan}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- kartu kecil gelap ---------------- */
const Kartu: React.FC<{ garis: string; children: React.ReactNode; lebar?: number; style?: React.CSSProperties }> = ({ garis, children, lebar, style }) => (
  <div style={{ width: lebar, background: K.card, border: `3px solid ${garis}`, borderRadius: 18, padding: '26px 30px', boxShadow: `0 0 40px ${garis}22, 0 20px 50px rgba(0,0,0,0.45)`, ...style }}>{children}</div>
);

/* ---------------- waktu kata (dari suara asli; kalau tidak ada, perkiraan proporsional) ---------------- */
const cariWaktu = (kata: Kata[], s: Segmen, pola: RegExp, frac: number, sesudah?: number) => {
  const k = kata.find((x) => x.mulai >= (sesudah ?? s.mulai) - 0.05 && x.mulai < s.selesai && pola.test(x.teks.replace(/[.,?!:]/g, '')));
  return k ? k.mulai : s.mulai + (s.selesai - s.mulai) * frac;
};
const teksGuna = (g: Guna) => (typeof g === 'string' ? g : g.teks);
const ikonGuna = (g: Guna) => (typeof g === 'string' ? 'kode' : g.ikon);

/* ---------------- pembuka: ilustrasi mengikuti narasi ---------------- */
type Ketukan = { a: number; b: number; l1: string; l2: string; warna: Warna; isi: (t: number) => React.ReactNode };
const ketukanIntro = (s: Segmen, d: DataPanjang, kata: Kata[], foto: Record<string, string>): Ketukan[] => {
  const tUkuran = cariWaktu(kata, s, /^Ukurannya$/i, 0.11);
  const tKecil = cariWaktu(kata, s, /^lima$/i, 0.18, tUkuran);
  const tBesar = cariWaktu(kata, s, /^megabyte$/i, 0.28, tKecil);
  const tKali = cariWaktu(kata, s, /^ribu$/i, 0.33, tBesar);
  const tTangga = cariWaktu(kata, s, /^tangga$/i, 0.4, tKali);
  const tSpek = cariWaktu(kata, s, /^spesifikasinya$/i, 0.68, tTangga);
  const tGuna = cariWaktu(kata, s, /^kegunaannya$/i, 0.74, tSpek);
  const tPlus = cariWaktu(kata, s, /^kelebihan$/i, 0.8, tGuna);
  const tMin = cariWaktu(kata, s, /^kelemahannya$/i, 0.85, tPlus);
  const tMulai = cariWaktu(kata, s, /^mulai$/i, 0.92, tMin);
  const awalAgenda = Math.max(tTangga + 1.5, tSpek - 1.1);
  const mini = d.item.map((x) => ({ kunci: x.kunci, nama: x.nama, ram_label: x.ram_label, kaki: x.kaki }));
  return [
    { a: s.mulai, b: tUkuran - 0.1, l1: 'Otak kecil', l2: 'di tiap proyek elektronika', warna: 'cyan', isi: (t) => <OtakProyek t={t} a={s.mulai} /> },
    { a: tUkuran - 0.1, b: tKecil - 0.2, l1: 'Ukurannya', l2: 'beda-beda banget', warna: 'amber', isi: (t) => <BedaUkuran t={t} a={tUkuran - 0.1} item={mini} foto={foto} /> },
    { a: tKecil - 0.2, b: tTangga - 0.1, l1: '512 byte vs 1 MB', l2: 'selisih 2.000×', warna: 'amber', isi: (t) => <DuaRibuKali t={t} aKecil={tKecil} aBesar={tBesar} aKali={tKali} /> },
    { a: tTangga - 0.1, b: awalAgenda, l1: '6 mikrokontroler', l2: 'naik tangga RAM', warna: 'cyan', isi: (t) => <TanggaBesar t={t} item={mini} foto={foto} munculMulai={tTangga + 0.1} jeda={0.32} /> },
    { a: awalAgenda, b: tMulai - 0.15, l1: 'Tiap mikrokontroler', l2: 'kita bedah 4 hal', warna: 'ok', isi: (t) => <Agenda t={t} waktu={[tSpek, tGuna, tPlus, tMin]} /> },
    { a: tMulai - 0.15, b: s.selesai, l1: 'Kita mulai', l2: 'dari yang paling kecil', warna: 'cyan', isi: (t) => <TanggaBesar t={t} item={mini} foto={foto} aktif={0} /> },
  ];
};

/* ---------------- adegan per jenis ---------------- */
const Panggung: React.FC<{ t: number; s: Segmen; d: DataPanjang; foto: Record<string, string>; kata: Kata[] }> = ({ t, s, d, foto, kata }) => {
  const a = s.mulai;
  const dur = s.selesai - s.mulai;
  const it = s.item != null ? d.item[s.item] : undefined;
  const mini = d.item.map((x) => ({ kunci: x.kunci, nama: x.nama, ram_label: x.ram_label, kaki: x.kaki }));

  if (s.jenis === 'menu') {
    const i = s.item!;
    const n = d.item.length;
    const uk = 120 + i * 14;
    const cx = 250 + i * (1420 / (n - 1));
    const cy = 800 - i * 62 - uk / 2 - 85;
    const zoom = interpolate(t, [s.selesai - 0.7, s.selesai], [0, 1], { ...C, easing: Easing.in(Easing.cubic) });
    return (
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + zoom * 5})`, transformOrigin: `${cx}px ${cy}px`, filter: zoom > 0.05 ? `blur(${zoom * 6}px)` : undefined, opacity: 1 - zoom * 0.7 }}>
        <TanggaBesar t={t} item={mini} foto={foto} aktif={i} selesai={i} />
      </div>
    );
  }
  if (s.jenis === 'kenalan') {
    const k2 = naik(t, a + 0.45, 0.4);
    const ungkap = interpolate(t, [a + 0.5, a + 1.0], [0, 100], { ...C, easing: Easing.out(Easing.cubic) });
    const angka = parseFloat(it!.ram_label);
    const satuan = it!.ram_label.replace(/^[\d.,]+\s*/, '');
    const naikAngka = interpolate(t, [a + 1.0, a + 1.9], [0, angka], { ...C, easing: Easing.out(Easing.cubic) });
    const pAngka = pop(t, a + 1.0, 0.4);
    const k1 = interpolate(t, [a + 0.05, a + 0.6], [0, 1], { ...C, easing: Easing.out(Easing.back(1.2)) });
    return (
      <>
        <div style={{ position: 'absolute', left: 150, top: 300, opacity: Math.min(1, k1 * 2), transform: `translateX(${(1 - k1) * -200}px) rotate(${(1 - k1) * -6}deg)` }}>
          <Foto src={foto[it!.kunci]} nama={it!.nama} w={820} h={520} kaki={it!.kaki} t={t} a={a} kenBurns kilau />
        </div>
        <Bidik x={150} y={300} w={820} h={520} t={t} a={a + 0.5} />
        <div style={{ position: 'absolute', left: 1060, top: 340, width: 760 }}>
          <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: K.cyan, opacity: k2 }}>MIKROKONTROLER #{s.item! + 1} · {it!.kelas.toUpperCase()}</div>
          <div style={{ clipPath: `inset(0 ${100 - ungkap}% 0 0)`, fontSize: ukuranPas(it!.nama, 100, 760, SANS, 900, -2, 48), fontWeight: 900, color: K.text, letterSpacing: -2, lineHeight: 1.05, marginTop: 10 }}>{it!.nama}</div>
          <div style={{ height: 6, width: `${ungkap}%`, background: K.cyan, borderRadius: 3, marginTop: 8, boxShadow: `0 0 20px ${K.cyan}` }} />
          <div style={{ display: 'flex', gap: 14, marginTop: 24, opacity: k2 }}>
            <div style={{ fontFamily: MONO, fontSize: 24, color: K.text, border: `2px solid ${K.garis}`, borderRadius: 999, padding: '6px 18px' }}>{it!.chip}</div>
          </div>
          <div style={{ marginTop: 40, fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: K.dim, opacity: pAngka }}>RAM</div>
          <div style={{ fontSize: 130, fontWeight: 900, color: K.amber, letterSpacing: -4, lineHeight: 1, transform: `scale(${0.6 + 0.4 * pAngka})`, transformOrigin: 'left center', opacity: pAngka, textShadow: `0 0 40px ${K.amber}55` }}>
            {Number.isFinite(angka) ? `${naikAngka.toFixed(String(angka).includes('.') ? 1 : 0)} ${satuan}` : it!.ram_label}
          </div>
        </div>
      </>
    );
  }
  if (s.jenis === 'spek') {
    const k1 = naik(t, a + 0.05, 0.45);
    const step = Math.min(1.1, (dur * 0.65) / Math.max(1, it!.spek.length));
    const baris = Math.floor((t - a - 0.3) / step);
    return (
      <>
        <div style={{ position: 'absolute', left: 130, top: 320, opacity: k1, transform: `scale(${0.9 + 0.1 * k1}) rotate(${(1 - k1) * 4}deg)` }}>
          <Foto src={foto[it!.kunci]} nama={it!.nama} w={620} h={440} kaki={it!.kaki} t={t} a={a} kenBurns />
        </div>
        <div style={{ position: 'absolute', left: 870, top: 262, transform: `translateX(${(1 - naik(t, a, 0.45)) * 300}px)` }}>
          <LembarSpek t={t} a={a} d={dur} it={it!} no={s.item! + 1} aktif={Math.min(baris, it!.spek.length - 1)} />
        </div>
      </>
    );
  }
  if (s.jenis === 'guna') {
    const step = Math.min(1.4, (dur * 0.6) / 3);
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 44 }}>
        {it!.guna.slice(0, 3).map((g, i) => {
          const m = a + 0.2 + i * step;
          const k = interpolate(t, [m, m + 0.45], [0, 1], { ...C, easing: Easing.out(Easing.back(1.5)) });
          const aktif = t >= m && (i === 2 || t < a + 0.2 + (i + 1) * step);
          return (
            <div key={i} style={{ opacity: Math.min(1, k * 1.6), transform: `translateY(${(1 - k) * 160}px) rotate(${(1 - k) * (i - 1) * 10}deg) scale(${aktif ? 1.04 : 0.97})` }}>
              <Kartu garis={aktif ? K.cyan : K.garis} lebar={500} style={{ height: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ alignSelf: 'flex-start', fontFamily: MONO, fontSize: 28, fontWeight: 800, color: K.cyan }}>0{i + 1}</div>
                <Ikon nama={ikonGuna(g)} t={t} a={m + 0.1} s={220} />
                <div style={{ fontSize: 38, fontWeight: 800, color: K.text, lineHeight: 1.15, textAlign: 'center', maxWidth: 430 }}>{teksGuna(g)}</div>
              </Kartu>
            </div>
          );
        })}
      </div>
    );
  }
  if (s.jenis === 'plusmin') {
    const tengah = cariWaktu(kata, s, /^Kelemahannya$/i, 0.42);
    const Kolom: React.FC<{ judul: string; isi: string[]; warna: string; tanda: string; mulai: number; arah: number }> = ({ judul, isi, warna, tanda, mulai, arah }) => {
      const k = interpolate(t, [mulai, mulai + 0.45], [0, 1], { ...C, easing: Easing.out(Easing.back(1.3)) });
      return (
        <div style={{ opacity: Math.min(1, k * 1.5), transform: `perspective(1600px) rotateY(${(1 - k) * 50 * arah}deg) translateX(${(1 - k) * 200 * arah}px)` }}>
          <Kartu garis={warna} lebar={740} style={{ minHeight: 440, boxShadow: `0 0 ${30 + 20 * Math.sin(t * 3)}px ${warna}44` }}>
            <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 800, letterSpacing: 5, color: warna }}>{judul}</div>
            {isi.map((x, i) => {
              const ki = pop(t, mulai + 0.35 + i * 0.55, 0.35);
              return (
                <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 34, opacity: ki, transform: `translateX(${(1 - ki) * 40 * arah}px)` }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: `${warna}22`, border: `3px solid ${warna}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: warna, transform: `scale(${0.5 + 0.5 * ki}) rotate(${(1 - ki) * -90}deg)` }}>{tanda}</div>
                  <div style={{ fontSize: ukuranPas(x, 44, 580, SANS, 700, 0, 28), fontWeight: 700, color: K.text, lineHeight: 1.2 }}>{x}</div>
                </div>
              );
            })}
          </Kartu>
        </div>
      );
    };
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', gap: 60 }}>
        <Kolom judul="KELEBIHAN" isi={it!.plus} warna={K.ok} tanda="✓" mulai={a + 0.15} arah={-1} />
        <Kolom judul="KELEMAHAN" isi={it!.minus} warna={K.err} tanda="✕" mulai={tengah - 0.1} arah={1} />
      </div>
    );
  }
  if (s.jenis === 'banding') {
    const maks = Math.log10(Math.max(...d.item.map((x) => x.ram)) * 4);
    const min = Math.log10(Math.min(...d.item.map((x) => x.ram)) / 2);
    const tCocok = cariWaktu(kata, s, /^cocok$/i, 0.35);
    const label = ['buat yang mungil', 'buat belajar', 'butuh banyak pin', '', 'butuh WiFi', 'butuh kencang'];
    const pola = [/^ATtiny/i, /^Uno$/i, /^Mega$/i, /^Pico$/i, /^ESP32$/i, /^Teensy$/i];
    const tRek = d.item.map((_, i) => (label[i] ? cariWaktu(kata, s, pola[i], 0.45 + i * 0.1, tCocok) : 1e6));
    return (
      <div style={{ position: 'absolute', left: 200, top: 280, width: 1520 }}>
        {d.item.map((x, i) => {
          const m = a + 0.3 + i * 0.4;
          const k = interpolate(t, [m, m + 0.8], [0, 1], { ...C, easing: Easing.out(Easing.back(1.1)) });
          const lebar = ((Math.log10(x.ram) - min) / (maks - min)) * 900;
          const rek = t >= tRek[i];
          const kr = pop(t, tRek[i], 0.4);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', height: 92, opacity: Math.min(1, k * 3), background: rek ? 'rgba(79,227,236,0.08)' : undefined, borderRadius: 12 }}>
              <div style={{ width: 400, fontSize: 30, fontWeight: 800, color: rek ? K.cyan : K.text, paddingLeft: 16, whiteSpace: 'nowrap' }}>{x.nama}</div>
              <div style={{ height: 46, width: lebar * k, borderRadius: 8, background: i === d.item.length - 1 ? K.amber : K.cyan, boxShadow: `0 0 24px ${i === d.item.length - 1 ? K.amber : K.cyan}55` }} />
              <div style={{ marginLeft: 18, fontFamily: MONO, fontSize: 30, fontWeight: 800, color: K.text, opacity: k, width: 130 }}>{x.ram_label}</div>
              {rek && <div style={{ marginLeft: 10, fontSize: 28, fontWeight: 800, color: K.bg, background: K.amber, borderRadius: 999, padding: '6px 20px', transform: `scale(${kr})` }}>{label[i]}</div>}
            </div>
          );
        })}
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: K.redup, marginTop: 10, paddingLeft: 16 }}>SKALA LOGARITMA · RAM</div>
      </div>
    );
  }
  if (s.jenis === 'cta') {
    const k = interpolate(t, [a + 0.1, a + 0.6], [0, 1], { ...C, easing: Easing.out(Easing.back(1.5)) });
    const tSub = cariWaktu(kata, s, /^subscribe$/i, 0.6);
    const ks = pop(t, tSub, 0.4);
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 46 }}>
        <div style={{ display: 'flex', gap: 18, opacity: k }}>
          {d.item.map((x, i) => (
            <div key={i} style={{ transform: `translateY(${Math.sin(t * 2 + i) * 8}px) scale(${pop(t, a + 0.2 + i * 0.12, 0.35)})`, border: `3px solid ${K.garis}`, borderRadius: '50%' }}>
              <Foto src={foto[x.kunci]} nama={x.nama} w={110} h={110} isi="cover" bulat kaki={x.kaki} />
            </div>
          ))}
        </div>
        <div style={{ transform: `scale(${0.85 + 0.15 * k})`, opacity: k }}>
          <Kartu garis={K.cyan} lebar={1150} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 4, color: K.cyan }}>KOMENTAR</div>
            <div style={{ fontSize: 58, fontWeight: 800, color: K.text, marginTop: 14 }}>Kamu pakai mikrokontroler yang mana?</div>
          </Kartu>
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: K.bg, background: K.err, borderRadius: 14, padding: '18px 54px', opacity: ks, transform: `scale(${(0.5 + 0.5 * ks) * (1 + 0.04 * Math.sin(t * 6))})`, boxShadow: `0 0 40px ${K.err}88` }}>SUBSCRIBE</div>
      </div>
    );
  }
  return null;
};


/* ---------------- subtitle 16:9 ---------------- */
const kataKira = (segmen: Segmen[]): Kata[] => {
  const out: Kata[] = [];
  for (const s of segmen) {
    if (!s.vo) continue;
    const ws = s.vo.split(/\s+/).filter(Boolean);
    const bobot = ws.map((x) => x.length + 2);
    const tot = bobot.reduce((a, b) => a + b, 0);
    const span = s.selesai - s.mulai - 0.5;
    let acc = 0;
    ws.forEach((x, i) => { const m = s.mulai + 0.1 + (acc / tot) * span; acc += bobot[i]; out.push({ teks: x, mulai: m, selesai: s.mulai + 0.1 + (acc / tot) * span }); });
  }
  return out;
};
const Subjudul: React.FC<{ t: number; kata: Kata[] }> = ({ t, kata }) => {
  const frasa = React.useMemo(() => {
    const f: Kata[][] = [];
    let cur: Kata[] = [];
    kata.forEach((k, i) => {
      cur.push(k);
      const jedaBesar = i + 1 < kata.length && kata[i + 1].mulai - k.selesai > 0.6;
      if (/[.,?:!]$/.test(k.teks) || cur.length >= 8 || jedaBesar || i === kata.length - 1) { f.push(cur); cur = []; }
    });
    return f;
  }, [kata]);
  const f = frasa.find((x) => t >= x[0].mulai - 0.05 && t <= x[x.length - 1].selesai + 0.35);
  if (!f) return null;
  return (
    <div style={{ position: 'absolute', top: 905, left: 260, right: 260, textAlign: 'center', fontSize: 44, fontWeight: 800, lineHeight: 1.2, textShadow: '0 3px 14px rgba(0,0,0,0.9)' }}>
      {f.map((k, i) => (
        <span key={i} style={{ color: K.text, opacity: k.mulai <= t ? 1 : 0.38 }}>{k.teks.replace(/[.,:!]$/, '')}{i < f.length - 1 ? ' ' : ''}</span>
      ))}
    </div>
  );
};

/* ---------------- hantaman 16:9 ---------------- */
const Hantaman16: React.FC<{ t: number; a: number; kata: string; warna: string }> = ({ t, a, kata, warna }) => {
  if (t < a || t >= a + 0.85) return null;
  const s = interpolate(t, [a, a + 0.16], [1.15, 1], { ...C, easing: Easing.out(Easing.cubic) });
  const getar = t - a < 0.12 ? Math.sin((t - a) * 120) * 8 : 0;
  const keluar = interpolate(t, [a + 0.6, a + 0.85], [0, 1], C);
  return (
    <AbsoluteFill style={{ background: warna, alignItems: 'center', justifyContent: 'center', clipPath: `inset(0 ${keluar * 100}% 0 0)` }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(12,17,23,0.10) 2px, transparent 2.2px)', backgroundSize: '36px 36px' }} />
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 260, letterSpacing: -8, color: K.bg, transform: `translateX(${getar}px) scale(${s})` }}>{kata}</div>
      <div style={{ position: 'absolute', bottom: 150, fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: K.bg, opacity: 0.6 }}>1HERTZ</div>
    </AbsoluteFill>
  );
};

/* ---------------- tangga kecil di bawah (posisi item) ---------------- */
const TanggaMini: React.FC<{ d: DataPanjang; aktif: number; selesai: number }> = ({ d, aktif, selesai }) => {
  const n = d.item.length;
  const x0 = 520;
  const lebar = 880;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} data-qa="hias">
      <line x1={x0} y1={1032} x2={x0 + lebar} y2={1032} stroke={K.garis} strokeWidth={4} />
      <line x1={x0} y1={1032} x2={x0 + (lebar / (n - 1)) * Math.max(0, Math.min(aktif, n - 1))} y2={1032} stroke={K.cyan} strokeWidth={4} />
      {d.item.map((x, i) => {
        const cx = x0 + (lebar / (n - 1)) * i;
        const r = 7 + i * 2.2;
        const on = i === aktif;
        const done = i < selesai;
        return (
          <g key={i}>
            <circle cx={cx} cy={1032} r={r + (on ? 4 : 0)} fill={on ? K.cyan : done ? K.ok : K.bg} stroke={on ? K.cyan : done ? K.ok : '#3A4855'} strokeWidth={3} />
            <text x={cx} y={1066} textAnchor="middle" fontFamily={MONO} fontSize={15} fill={on ? K.cyan : '#5D6B78'}>{x.nama.replace('Arduino ', '').replace('Raspberry Pi ', '')}</text>
          </g>
        );
      })}
      <text x={x0 - 30} y={1038} textAnchor="end" fontFamily={MONO} fontSize={16} letterSpacing={2} fill="#5D6B78">KECIL</text>
      <text x={x0 + lebar + 30} y={1038} fontFamily={MONO} fontSize={16} letterSpacing={2} fill="#5D6B78">BESAR</text>
    </svg>
  );
};

/* ---------------- partikel latar ---------------- */
const Partikel: React.FC<{ t: number }> = ({ t }) => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} data-qa="hias">
    {Array.from({ length: 26 }, (_, i) => {
      const x = (acak(i) * W + t * (8 + acak(i + 9) * 20)) % W;
      const y = (acak(i + 3) * H - t * (6 + acak(i + 5) * 14) + H * 10) % H;
      return <circle key={i} cx={x} cy={y} r={1.5 + acak(i + 7) * 2.5} fill={K.cyan} opacity={0.12 + 0.18 * acak(i + 11)} />;
    })}
  </svg>
);

/* ---------------- komposisi ---------------- */
export const Panjang1Hertz: React.FC<PropsPanjang> = ({ data, segmen: segmenProp, audio, kata: kataProp, foto = {}, kredit, musik }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const segmen = React.useMemo(() => segmenProp ?? linimasaKira(data), [segmenProp, data]);
  const kata = React.useMemo(() => (kataProp?.length ? kataProp : kataKira(segmen)), [kataProp, segmen]);
  const si = Math.max(0, segmen.findIndex((s) => t >= s.mulai && t < s.selesai));
  const s = segmen[si] ?? segmen[segmen.length - 1];
  const itemAktif = s.item ?? (s.jenis === 'banding' || s.jenis === 'cta' ? data.item.length : -1);
  const it = s.item != null ? data.item[s.item] : undefined;
  const intro = React.useMemo(() => (segmen[0]?.jenis === 'intro' ? ketukanIntro(segmen[0], data, kata, foto) : []), [segmen, data, kata, foto]);
  const ketukan = s.jenis === 'intro' ? intro.find((k) => t >= k.a && t < k.b) ?? intro[intro.length - 1] : undefined;
  const ki = ketukan ? intro.indexOf(ketukan) : -1;

  // judul: ketukan pembuka atau judul segmen
  const [l1, l2, wj] = ketukan ? [ketukan.l1, ketukan.l2, ketukan.warna] : judulSegmen(s, data);
  const aJudul = ketukan ? ketukan.a : s.mulai;
  const bJudul = ketukan ? ketukan.b : s.selesai;
  const ukJudul = Math.min(ukuranPas(l1, 62, 1500, SANS, 800, -1.5, 36), ukuranPas(l2, 62, 1500, SANS, 800, -1.5, 36));

  // SFX & hantaman
  const bunyi: Bunyi[] = React.useMemo(() => {
    const b: Bunyi[] = [];
    intro.forEach((k, i) => { if (i > 0) b.push({ t: k.a - 0.05, f: 'whoosh', v: 0.3 }); });
    if (intro[2]) b.push({ t: intro[2].a + 0.2, f: 'pop', v: 0.35 });
    segmen.forEach((x, i) => {
      if (i > 0) b.push({ t: x.mulai - 0.1, f: 'whoosh', v: 0.34 });
      if (x.jenis === 'menu') b.push({ t: x.selesai - 0.7, f: 'riser', v: 0.28 });
      if (x.jenis === 'kenalan') { b.push({ t: x.mulai + 0.5, f: 'beep', v: 0.22 }); b.push({ t: x.mulai + 1.0, f: 'pop', v: 0.35 }); }
      if (x.jenis === 'guna') [0, 1, 2].forEach((k) => b.push({ t: x.mulai + 0.2 + k * Math.min(1.4, ((x.selesai - x.mulai) * 0.6) / 3), f: 'pop', v: 0.32 }));
      if (x.jenis === 'plusmin') b.push({ t: x.mulai + 0.5, f: 'ding', v: 0.3 });
      if (x.jenis === 'spek' && x.item != null) data.item[x.item].spek.forEach((_, k) => b.push({ t: x.mulai + 0.3 + k * Math.min(1.1, ((x.selesai - x.mulai) * 0.65) / data.item[x.item!].spek.length), f: 'klik', v: 0.24 }));
      if (x.jenis === 'cta') b.push({ t: x.mulai + 0.2, f: 'pop', v: 0.35 });
      const h = x.item != null ? data.item[x.item].hantaman : undefined;
      if (h && h.segmen === x.jenis) b.push({ t: x.mulai + 0.05, f: 'impact', v: 0.5 });
    });
    return b;
  }, [segmen, data, intro]);
  const hantaman = segmen
    .map((x, i) => ({ x, i, h: x.item != null ? data.item[x.item].hantaman : undefined }))
    .filter((z) => z.h && z.h.segmen === z.x.jenis);

  const menit = Math.floor(t / 60);
  const detik = `${String(menit).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const selesaiItem = s.jenis === 'menu' ? s.item! : s.item != null ? s.item : itemAktif;
  const pola = POLA[(ketukan ? ki + 3 : si) % POLA.length];
  const aAdegan = ketukan ? ketukan.a : s.mulai;
  const bAdegan = ketukan ? ketukan.b : s.selesai;
  const titikPotong = [...intro.slice(1).map((k) => k.a), ...segmen.slice(1).map((x) => x.mulai)];
  const geserLatar = t * 10;

  return (
    <AbsoluteFill style={{ backgroundColor: K.bg, fontFamily: SANS, overflow: 'hidden' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(140,200,230,0.10) 1.6px, transparent 1.8px)', backgroundSize: '36px 36px', backgroundPosition: `${-geserLatar}px ${geserLatar * 0.4}px` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 45% at ${50 + 6 * Math.sin(t * 0.3)}% 52%, rgba(79,227,236,0.08), transparent 70%)` }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 110% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55))' }} />
      <Partikel t={t} />

      {/* panggung dengan transisi bergilir */}
      {s.jenis === 'menu' ? (
        <Panggung t={t} s={s} d={data} foto={foto} kata={kata} />
      ) : (
        <Transisi16 key={`${si}-${ki}`} t={t} frame={frame} a={aAdegan} b={bAdegan} masuk={aAdegan === 0 ? 'langsung' : pola[0]} keluar={segmen[si + 1]?.jenis === 'menu' && !ketukan ? 'tidak' : pola[1]}>
          {ketukan ? ketukan.isi(t) : <Panggung t={t} s={s} d={data} foto={foto} kata={kata} />}
        </Transisi16>
      )}
      {titikPotong.map((x, i) => <Kilatan key={i} t={t} a={x} />)}

      {/* kepala: pil tag, judul kinetik, ikon item aktif */}
      <div style={{ position: 'absolute', top: 44, left: 56, fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: K.bg, background: K.cyan, borderRadius: 999, padding: '8px 20px' }}>{data.tag ?? '1HERTZ'}</div>
      <div style={{ position: 'absolute', top: 52, right: it ? 190 : 56, fontFamily: MONO, fontSize: 24, color: '#5D6B78' }}>@1hertz_lab</div>
      {it && (
        <div style={{ position: 'absolute', top: 26, right: 56, textAlign: 'center' }}>
          <div style={{ border: `4px solid ${K.cyan}`, borderRadius: '50%' }}>
            <Foto src={foto[it.kunci]} nama={it.nama} w={100} h={100} isi="cover" bulat kaki={it.kaki} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 20, color: K.cyan, marginTop: 6 }}>0{s.item! + 1}/0{data.item.length}</div>
        </div>
      )}
      <div key={`j${si}-${ki}`} style={{ position: 'absolute', top: 104, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: interpolate(t, [bJudul - 0.2, bJudul], [1, 0], C) }}>
        <BarisKinetik t={t} a={aJudul} teks={l1} warna={K.text} tunda={0} ukuran={ukJudul} />
        <BarisKinetik t={t} a={aJudul} teks={l2} warna={w(wj)} tunda={l1.split(' ').length * 0.08 + 0.05} ukuran={ukJudul} />
      </div>

      {/* HUD */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }} data-qa="hias">
        <g stroke="#4FE3EC" strokeOpacity={0.35} strokeWidth={2} fill="none">
          <path d="M28,270 v-30 h30 M1892,270 v-30 h-30 M28,880 v30 h30 M1892,880 v30 h-30" />
        </g>
        <text x={66} y={262} fontFamily={MONO} fontSize={18} letterSpacing={3} fill="#4FE3EC" fillOpacity={0.45}>CH1 · {s.jenis.toUpperCase()}</text>
        <text x={1854} y={902} textAnchor="end" fontFamily={MONO} fontSize={18} letterSpacing={2} fill="#4FE3EC" fillOpacity={0.45}>{detik}</text>
      </svg>

      <TanggaMini d={data} aktif={itemAktif} selesai={Math.max(0, selesaiItem)} />
      <Subjudul t={t} kata={kata} />
      {kredit && s.item != null && (
        <div style={{ position: 'absolute', bottom: 6, right: 20, fontFamily: MONO, fontSize: 13, color: '#4A5763', maxWidth: 700, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {kredit.split('\n').find((x) => x.startsWith(data.item[s.item!].nama)) ?? ''}
        </div>
      )}

      {hantaman.map((z) => <Hantaman16 key={z.i} t={t} a={z.x.mulai + 0.05} kata={z.h!.kata} warna={z.i % 2 ? K.amber : K.cyan} />)}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 0.045, mixBlendMode: 'overlay', pointerEvents: 'none' }} data-qa="hias">
        <filter id="grain16"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 7} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain16)" />
      </svg>
      {audio && <Audio src={staticFile(audio)} />}
      <Sfx daftar={bunyi} musik={musik === 'tanpa' ? 0 : 0.1} />
    </AbsoluteFill>
  );
};

