// Ukur lebar teks sungguhan (font yang terpasang) supaya teks tidak tumpang tindih / keluar layar.
import { measureText } from '@remotion/layout-utils';

/** lebar teks dalam px */
export const lebarTeks = (teks: string, ukuran: number, font: string, berat: number | string = 400, spasi = 0): number => {
  if (!teks) return 0;
  return measureText({ text: teks, fontFamily: font, fontSize: ukuran, fontWeight: String(berat), letterSpacing: `${spasi}px`, validateFontIsLoaded: false }).width;
};

/** ukuran font terbesar (≤ maks) supaya teks muat di lebarMaks */
export const ukuranPas = (teks: string, maks: number, lebarMaks: number, font: string, berat: number | string = 400, spasi = 0, min = 12): number => {
  if (!teks || lebarMaks <= 0) return maks;
  const w = lebarTeks(teks, maks, font, berat, spasi);
  if (w <= lebarMaks) return maks;
  let s = Math.max(min, Math.floor((maks * lebarMaks) / w));
  while (s > min && lebarTeks(teks, s, font, berat, spasi) > lebarMaks) s--;
  return s;
};

/** Zona aman YouTube Shorts (kanvas 1080×1920): kolom tombol kanan (suka, komentar, bagikan, remix)
 *  menutupi x ≥ 945 pada y 1050–1720; judul & nama channel menutupi y ≥ 1720. */
export const ZONA_TOMBOL = { x: 945, y1: 1050, y2: 1720 };
export const ZONA_BAWAH = 1720;

/* ---------------- catatan teks terpotong (dibaca QA visual) ---------------- */
/** dicatat kalau isi JSON terlalu panjang sehingga ada teks yang dipotong; QA visual menolak video seperti ini */
export const catatPotong = (tempat: string, asal: string) => {
  const g = globalThis as any;
  (g.__QA_POTONG ??= []).push(`${tempat}: "${String(asal).slice(0, 60)}"`);
};
export const resetPotong = () => {
  (globalThis as any).__QA_POTONG = [];
};
/** potong ke n karakter; kalau benar-benar terpotong, dicatat untuk QA */
export const potong = (teks: unknown, n: number, tempat: string): string => {
  const s = String(teks ?? '');
  if (s.length <= n) return s;
  catatPotong(tempat, s);
  return s.slice(0, n);
};

/** bungkus teks per kata berdasarkan lebar piksel sungguhan */
export const bungkusLebar = (teks: string, lebar: number, ukuran: number, font: string, berat: number | string = 400): string[] => {
  const kata = String(teks || '').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const k of kata) {
    const coba = cur ? `${cur} ${k}` : k;
    if (!cur || lebarTeks(coba, ukuran, font, berat) <= lebar) cur = coba;
    else {
      out.push(cur);
      cur = k;
    }
  }
  if (cur) out.push(cur);
  return out;
};

/** pilih ukuran font terbesar (dari daftar) yang membuat teks muat di lebar × maksBaris tanpa dipotong.
 *  Kalau tetap tidak muat di ukuran terkecil: dipotong dengan "…" dan dicatat untuk QA. */
export const susunTeks = (
  teks: string,
  lebar: number,
  ukuran: number[],
  maksBaris: number,
  font: string,
  berat: number | string,
  tempat: string,
): { baris: string[]; ukuran: number } => {
  const isi = String(teks || '').trim();
  for (const u of ukuran) {
    const b = bungkusLebar(isi, lebar, u, font, berat);
    if (b.length <= maksBaris && b.every((x) => lebarTeks(x, u, font, berat) <= lebar)) return { baris: b, ukuran: u };
  }
  const u = ukuran[ukuran.length - 1];
  const b = bungkusLebar(isi, lebar, u, font, berat);
  catatPotong(tempat, isi);
  const pakai = b.slice(0, maksBaris);
  if (b.length > maksBaris) pakai[maksBaris - 1] = pakai[maksBaris - 1].replace(/\s*\S*$/, '') + '…';
  return { baris: pakai, ukuran: u };
};
