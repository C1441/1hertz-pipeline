// Template video Shorts 1Hertz — gaya guidebook motion graphics (16 Okt 2026).
// Membaca JSON konten skema 1.0 (komponen lama tetap didukung) + field opsional baru:
//   adegan[].judul: ["baris 1", "baris 2"], adegan[].warna_judul: merah|amber|cyan|hijau,
//   adegan[].hantaman: "KATA."   (maks 3 per video)
//   komponen baru: sinyal, garis_waktu, lembar
// Template lama ada di src/aset/template-lama (komposisi "Short1HertzLama").
import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { K, SANS, Warna } from './gaya/pustaka';
import { C, Kerangka3, Grain, Bab } from './gaya/gb';
import { Adegan4, Hantaman2, TitikCahaya, Masuk, Keluar } from './gaya/transisi';
import { KOMPONEN_V2, sfxKomponen, Bukti, bungkus } from './gaya/Adegan';
import { PemeriksaQA } from './gaya/qa';
import { resetPotong, ukuranPas } from './gaya/ukur';

type AdeganJson = {
  no: number;
  mulai: number;
  selesai: number;
  voiceover: string;
  teks_layar?: string;
  kata_kunci?: string;
  komponen: string;
  data?: any;
  judul?: string[];
  warna_judul?: string;
  hantaman?: string;
};
export type Kata = { teks: string; mulai: number; selesai: number; adegan: number; akhirFrasa?: boolean };
type Props = { konten: any; audio?: string; kata?: Kata[]; amplitudo?: number[]; musik?: string; sfx?: boolean; qa?: boolean };

/* ---------------- rencana transisi (dirotasi per video) ---------------- */
type Pasangan = 'sapuan' | 'runtuh' | 'zoomTembus' | 'balik' | 'terdorong' | 'glitch';
const PUTARAN: Pasangan[] = ['sapuan', 'runtuh', 'zoomTembus', 'balik'];
const MASUK: Record<Pasangan, Masuk> = { sapuan: 'sapuan', runtuh: 'titik', zoomTembus: 'zoomMasuk', balik: 'balik', terdorong: 'tampar', glitch: 'langsung' };
const TERANG = ['x_vs_y', 'lembar'];
// kata tanya jembatan pengganti hantaman yang mendahului narasi: diambil dari kata pembuka voiceover adegan itu,
// jadi selalu nyambung dengan yang diucapkan ("Caranya, buka …" → "CARANYA?")
const PEMBUKA: [RegExp, string][] = [
  [/^(caranya|gimana|bagaimana)$/, 'CARANYA?'],
  [/^(solusinya|fixnya|perbaikannya)$/, 'SOLUSINYA?'],
  [/^(karena|penyebabnya|sebabnya|kenapa|soalnya|gara)$/, 'KENAPA?'],
  [/^(bedanya|perbedaannya)$/, 'BEDANYA?'],
  [/^(hasilnya)$/, 'HASILNYA?'],
  [/^(harusnya|seharusnya)$/, 'HARUSNYA?'],
];
const jembatanDari = (voiceover: string): string | undefined => {
  const kata = String(voiceover || '').split(/\s+/).slice(0, 2).map((k) => k.toLowerCase().replace(/[^a-z]/g, ''));
  for (const k of kata) for (const [re, j] of PEMBUKA) if (re.test(k)) return j;
  return undefined;
};
const hashTeks = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
type Jadwal = { a: number; b: number; masuk: Masuk; keluar: Keluar; dMasuk: number; dKeluar: number; pasanganMasuk?: Pasangan };

const rencana = (adegan: AdeganJson[], id: string): Jadwal[] => {
  const seed = hashTeks(id || 'x');
  const pas: Pasangan[] = [];
  let putar = seed % PUTARAN.length;
  for (let i = 1; i < adegan.length; i++) {
    const berikut = adegan[i];
    let p: Pasangan;
    if (berikut.hantaman) p = 'glitch';
    else if (TERANG.includes(berikut.komponen) && pas[pas.length - 1] !== 'terdorong') p = 'terdorong';
    else {
      p = PUTARAN[putar % PUTARAN.length];
      if (p === pas[pas.length - 1]) p = PUTARAN[++putar % PUTARAN.length];
      putar++;
    }
    pas.push(p);
  }
  return adegan.map((a, i) => {
    const pIn = i > 0 ? pas[i - 1] : undefined;
    const pOut = i < adegan.length - 1 ? pas[i] : undefined;
    const tumpang = pIn === 'sapuan' || pIn === 'terdorong' ? 0.3 : 0;
    const keluar: Keluar = !pOut ? 'tidak' : pOut === 'glitch' ? 'glitch' : pOut === 'sapuan' ? 'sapuan' : pOut === 'runtuh' ? 'runtuh' : pOut === 'zoomTembus' ? 'zoomTembus' : pOut === 'balik' ? 'balik' : 'terdorong';
    const tambahAkhir = pOut === 'terdorong' ? 0.38 : 0;
    return {
      a: Math.max(0, a.mulai - tumpang),
      b: a.selesai + tambahAkhir,
      masuk: i === 0 ? 'zoomMundur' : MASUK[pIn as Pasangan],
      keluar,
      dMasuk: i === 0 ? 0.6 : pIn === 'terdorong' ? 0.42 : pIn === 'zoomTembus' ? 0.4 : 0.32,
      dKeluar: pOut === 'zoomTembus' ? 0.38 : pOut === 'terdorong' ? 0.38 : 0.3,
      pasanganMasuk: pIn,
    };
  });
};

/* ---------------- judul bab ---------------- */
const WARNA_KOMPONEN: Record<string, Warna> = { kartu_masalah: 'err', log_serial: 'err', kartu_solusi: 'ok', cta: 'ok' };
const keWarna = (w?: string): Warna | undefined =>
  w === 'merah' ? 'err' : w === 'amber' || w === 'kuning' ? 'amber' : w === 'hijau' ? 'ok' : w === 'cyan' ? 'cyan' : undefined;
const judulAdegan = (a: AdeganJson, cover?: string): [string, string] => {
  if (Array.isArray(a.judul) && a.judul.length) return [String(a.judul[0] ?? ''), String(a.judul[1] ?? '')];
  const sumber = String(a.teks_layar || cover || '').trim();
  const kata = sumber.split(/\s+/).filter(Boolean);
  if (kata.length <= 2) return ['', sumber];
  const tengah = Math.ceil(kata.length / 2);
  return [kata.slice(0, tengah).join(' '), kata.slice(tengah).join(' ')];
};

/* ---------------- subtitle dari timing suara ---------------- */
const bersih = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const SubtitleKata: React.FC<{ t: number; kata: Kata[]; adegan: AdeganJson[] }> = ({ t, kata, adegan }) => {
  const frasa = useMemo(() => {
    const out: Kata[][] = [];
    let cur: Kata[] = [];
    kata.forEach((k, i) => {
      if (cur.length && k.adegan !== cur[0].adegan) {
        out.push(cur);
        cur = [];
      }
      cur.push(k);
      const panjang = cur.map((x) => x.teks).join(' ').length;
      if (k.akhirFrasa || cur.length >= 6 || panjang > 34 || i === kata.length - 1) {
        out.push(cur);
        cur = [];
      }
    });
    if (cur.length) out.push(cur);
    return out;
  }, [kata]);
  if (!frasa.length) return null;
  let idx = -1;
  frasa.forEach((f, i) => {
    if (f[0].mulai - 0.05 <= t) idx = i;
  });
  if (idx < 0) return null;
  const f = frasa[idx];
  const op = interpolate(t, [f[0].mulai - 0.05, f[0].mulai + 0.08], [0.4, 1], C);
  const kunci = bersih(adegan[f[0].adegan]?.kata_kunci ?? '');
  return (
    // tanpa pita hitam: latar titik-titik tetap menyambung sampai bawah; lebar dibatasi supaya tidak masuk kolom tombol YouTube
    <div style={{ position: 'absolute', top: 1460, left: 140, right: 140 }}>
      <div style={{ textAlign: 'center', fontFamily: SANS, fontSize: 56, fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.5, opacity: op, textShadow: '0 3px 14px rgba(0,0,0,0.85)' }}>
        {f.map((k, i) => (
          <span key={i} style={{ color: kunci && bersih(k.teks).includes(kunci) ? K.amber : K.text, opacity: k.mulai <= t ? 1 : 0.38 }}>
            {k.teks.replace(/[.,:;!]+$/, '')}
            {i < f.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    </div>
  );
};
const kataCadangan = (adegan: AdeganJson[]): Kata[] => {
  const out: Kata[] = [];
  adegan.forEach((a, ai) => {
    const ws = String(a.voiceover || '').split(/\s+/).filter(Boolean);
    const bobot = ws.map((w) => w.length + 2);
    const total = bobot.reduce((x, y) => x + y, 0) || 1;
    let acc = 0;
    ws.forEach((w, i) => {
      const m = a.mulai + (acc / total) * (a.selesai - a.mulai);
      acc += bobot[i];
      out.push({ teks: w, mulai: m, selesai: a.mulai + (acc / total) * (a.selesai - a.mulai), adegan: ai, akhirFrasa: /[.,!?;:]$/.test(w) || i === ws.length - 1 });
    });
  });
  return out;
};

/* ================================================================== */
export const Short1Hertz: React.FC<Props> = ({ konten, audio, kata, amplitudo, musik, sfx = true, qa = false }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  resetPotong(); // catatan teks terpotong dihitung ulang tiap frame (dibaca QA visual)
  const t = frame / fps;
  const adegan: AdeganJson[] = konten?.adegan ?? [];
  const id = String(konten?.id ?? 'video');
  const jadwal = useMemo(() => rencana(adegan, id), [adegan, id]);
  const daftarKata = useMemo(() => (kata?.length ? kata : kataCadangan(adegan)), [kata, adegan]);
  const amp = amplitudo ?? [];
  const cover = konten?.publikasi?.teks_cover;

  // hantaman: maks 3, tampil 0,85 dtk. Aturan (supaya tidak membocorkan jawaban sebelum diucapkan):
  //  - kata tanya jembatan ("CARANYA?", "KENAPA?") → tampil di awal adegan, adegan itu yang menjawab
  //  - kata yang DIUCAPKAN di 40% awal adegan → tampil tepat saat kata itu diucapkan
  //  - selain itu (mis. angka/versi yang baru disebut belakangan) → diganti kata tanya dari kata pembuka
  //    voiceover adegan itu ("Caranya, …" → "CARANYA?"), atau dibuang kalau tidak ada
  const { hantaman, catatan } = useMemo(() => {
    const out: { i: number; kata: string; a: number }[] = [];
    const cat: string[] = [];
    adegan.forEach((a, i) => {
      const asli = String(a.hantaman || '').trim().toUpperCase().slice(0, 12);
      if (!asli || i === 0 || out.length >= 3) return;
      if (asli.endsWith('?')) {
        out.push({ i, kata: asli, a: a.mulai });
        return;
      }
      const kunci = bersih(asli);
      // kata yang diucapkan di 40% awal adegan → tampil tepat saat diucapkan (tidak mendahului suara)
      const batas = a.mulai + Math.max(1.2, (a.selesai - a.mulai) * 0.4);
      const cocok = kunci.length >= 2 ? daftarKata.find((k) => k.adegan === i && bersih(k.teks).includes(kunci)) : undefined;
      if (cocok && cocok.mulai <= batas) {
        out.push({ i, kata: asli, a: Math.max(a.mulai, cocok.mulai - 0.08) });
        return;
      }
      const ganti = jembatanDari(a.voiceover);
      cat.push(`hantaman "${asli}" di adegan ${i + 1} belum diucapkan saat tampil → ${ganti ? `diganti "${ganti}"` : 'dibuang'}`);
      if (ganti) out.push({ i, kata: ganti, a: a.mulai });
    });
    return { hantaman: out, catatan: cat };
  }, [adegan, daftarKata]);

  const bab: Bab[] = adegan.map((a, i) => {
    const [l1, l2] = judulAdegan(a, i === 0 ? cover : undefined);
    const tutup = hantaman.find((h) => h.i === i && h.a <= a.mulai + 0.05);
    return {
      a: tutup ? a.mulai + 0.55 : a.mulai,
      b: i < adegan.length - 1 ? a.selesai : a.selesai + 1,
      l1,
      l2,
      warna: keWarna(a.warna_judul) ?? WARNA_KOMPONEN[a.komponen] ?? 'cyan',
    };
  });

  const tag = useMemo(() => {
    const h = (konten?.publikasi?.hashtag_youtube ?? []).map((x: string) => x.replace('#', '')).find((x: string) => x && !/shorts|1hertz/i.test(x));
    return `1HERTZ · ${String(h || 'IOT').toUpperCase().slice(0, 12)}`;
  }, [konten]);

  // titik cahaya untuk transisi "runtuh"
  const titik = jadwal
    .map((j, i) => (j.pasanganMasuk === 'runtuh' ? adegan[i].mulai : null))
    .filter((x): x is number => x !== null);

  // SFX
  const bunyi = useMemo(() => {
    if (!sfx) return [];
    const out: { t: number; f: string; v: number }[] = [{ t: 0, f: 'whoosh', v: 0.35 }];
    adegan.forEach((a, i) => {
      const d = a.selesai - a.mulai;
      const p = jadwal[i].pasanganMasuk;
      if (i > 0) {
        if (p === 'glitch') out.push({ t: a.mulai - 0.28, f: 'glitch', v: 0.4 });
        else if (p === 'runtuh') out.push({ t: a.mulai, f: 'beep', v: 0.4 });
        else if (p === 'terdorong') out.push({ t: a.mulai - 0.3, f: 'whoosh', v: 0.35 });
        else out.push({ t: a.mulai - 0.25, f: 'whoosh', v: 0.35 });
      }
      const h = hantaman.find((x) => x.i === i);
      if (h) out.push({ t: h.a, f: 'impact', v: 0.5 });
      if (i === adegan.length - 1 && i > 0) out.push({ t: Math.max(0, a.mulai - 0.9), f: 'riser', v: 0.22 });
      for (const s of sfxKomponen(a.komponen, a.data ?? {}, d)) out.push({ t: a.mulai + s.t, f: s.f, v: s.v });
    });
    return out.filter((s) => s.t >= 0 && s.t * fps < durationInFrames - 2);
  }, [adegan, jadwal, hantaman, sfx, fps, durationInFrames]);

  return (
    <AbsoluteFill style={{ backgroundColor: K.bg }} data-qa-akar>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      {musik ? (
        <Audio
          src={staticFile(musik)}
          loop
          volume={(f) => {
            const fade = Math.min(1, f / (fps * 1.2), (durationInFrames - f) / (fps * 1.5));
            const a = amp[f] ?? 0;
            return Math.max(0, 0.12 * fade * (1 - 0.6 * a));
          }}
        />
      ) : null}
      {bunyi.map((s, i) => (
        <Sequence key={`sfx${i}`} from={Math.round(s.t * fps)} durationInFrames={fps * 2} layout="none">
          <Audio src={staticFile(`sfx/${s.f}.wav`)} volume={s.v} />
        </Sequence>
      ))}

      <Kerangka3
        t={t}
        tag={tag}
        bab={bab}
        adegan={[]}
        sumber={String(konten?.visual?.sumber ?? 'ILUSTRASI').toUpperCase().slice(0, 40)}
        hud="CH1"
        subtitle={<SubtitleKata t={t} kata={daftarKata} adegan={adegan} />}
      >
        {adegan.map((a, i) => {
          const j = jadwal[i];
          const Komp = KOMPONEN_V2[a.komponen] ?? Bukti;
          return (
            <Adegan4 key={i} t={t} frame={frame} a={j.a} b={j.b} masuk={j.masuk} keluar={j.keluar} dMasuk={j.dMasuk} dKeluar={j.dKeluar} titik={[540, 520]}>
              <Komp lt={t - a.mulai + (i === 0 ? 0.8 : 0)} d={a.selesai - a.mulai} data={a.data ?? {}} teks={a.teks_layar} />
            </Adegan4>
          );
        })}
        {titik.map((m, k) => (
          <TitikCahaya
            key={k}
            x={540}
            y={520}
            besar={interpolate(t, [m - 0.18, m, m + 0.1, m + 0.45], [0.3, 1.6, 1, 0.4], C)}
            op={interpolate(t, [m - 0.18, m, m + 0.2, m + 0.45], [0, 1, 1, 0], C)}
          />
        ))}
      </Kerangka3>
      {hantaman.map((h) => (
        <Hantaman2 key={h.i} t={t} a={h.a} b={h.a + 0.85} kata={h.kata} warna={h.i % 2 ? 'amber' : 'cyan'} keluar="sapuan" dKeluar={0.28} />
      ))}
      <Grain frame={frame} />
      {qa && <PemeriksaQA frame={frame} info={{ debug: !!(konten as any)?.__debug, hantaman: hantaman.map((h) => ({ a: h.a, kata: h.kata })), catatan }} />}
    </AbsoluteFill>
  );
};

export { bungkus };
