// Pemeriksa QA visual (hanya aktif kalau props.qa = true; dipakai pipeline/qa-visual.js).
// Di tiap frame yang dirender, semua teks yang terlihat diperiksa:
//   - tumpang tindih dengan teks lain
//   - terpotong di tepi layar
//   - tertutup tombol YouTube Shorts (kolom kanan bawah) atau judul/nama channel (paling bawah)
// Hasil dicetak ke console sebagai "QA1HZ {json}" lalu dibaca runner.
// Elemen hiasan ditandai data-qa="hias" supaya dilewati.
import React, { useEffect, useState } from 'react';
import { delayRender, continueRender } from 'remotion';
import { ZONA_TOMBOL, ZONA_BAWAH } from './ukur';

type Kotak = { x1: number; y1: number; x2: number; y2: number; teks: string; el: Element };

const opasitasTotal = (el: Element): number => {
  let op = 1;
  let n: Element | null = el;
  while (n && n !== document.documentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
    op *= parseFloat(cs.opacity || '1');
    const attr = n.getAttribute('opacity');
    if (attr !== null && n instanceof SVGElement && cs.opacity === '1') op *= parseFloat(attr) || 0;
    n = n.parentElement;
  }
  return op;
};

const transparan = (el: Element): boolean => {
  const cs = getComputedStyle(el);
  if (el instanceof SVGElement) {
    const f = cs.fill;
    return f === 'none' || f === 'transparent' || f === 'rgba(0, 0, 0, 0)' || parseFloat(cs.fillOpacity || '1') < 0.3;
  }
  return cs.color === 'transparent' || cs.color === 'rgba(0, 0, 0, 0)';
};

const kumpulkan = (): Kotak[] => {
  const out: Kotak[] = [];
  // koordinat dihitung relatif ke kanvas video (1080×1920), bukan ke halaman browser
  const akar = document.querySelector('[data-qa-akar]');
  const ra = akar ? akar.getBoundingClientRect() : { left: 0, top: 0, width: 1080, height: 1920 };
  const sx = 1080 / (ra.width || 1080);
  const sy = 1920 / (ra.height || 1920);
  const semua = Array.from(document.querySelectorAll('text, tspan, div, span, p, h1, h2, h3'));
  // layar penuh yang sedang menutup (mis. hantaman): teks di bawahnya tidak terlihat penonton
  const penutup = Array.from(document.querySelectorAll('[data-qa-penutup]')).filter((p) => {
    const r = p.getBoundingClientRect();
    return opasitasTotal(p) >= 0.6 && r.left <= ra.left + 60 && r.right >= ra.left + ra.width - 60;
  });
  for (const el of semua) {
    if (el.closest('[data-qa="hias"]')) continue;
    if (penutup.some((p) => !p.contains(el))) continue;
    // hanya elemen yang punya teks langsung
    const nodes = Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim());
    if (!nodes.length) continue;
    if (transparan(el)) continue;
    if (opasitasTotal(el) < 0.6) continue;
    let r: DOMRect;
    if (el instanceof SVGElement) r = el.getBoundingClientRect();
    else {
      const range = document.createRange();
      range.setStartBefore(nodes[0]);
      range.setEndAfter(nodes[nodes.length - 1]);
      r = range.getBoundingClientRect();
    }
    if (r.width < 2 || r.height < 2) continue;
    out.push({ x1: (r.left - ra.left) * sx, y1: (r.top - ra.top) * sy, x2: (r.right - ra.left) * sx, y2: (r.bottom - ra.top) * sy, teks: (el.textContent || '').trim().slice(0, 40), el });
  }
  return out;
};

export const periksaLayar = (): string[] => {
  const kotak = kumpulkan();
  const potongan: string[] = ((globalThis as any).__QA_POTONG ?? []).map((x: string) => `teks kepanjangan, terpotong di ${x}`);
  if ((window as any).QA_DEBUG) {
    const akar = document.querySelector('[data-qa-akar]');
    console.log('QA1DBG ' + JSON.stringify({ akar: akar?.getBoundingClientRect(), win: [innerWidth, innerHeight], k: kotak.map((k) => [k.teks, Math.round(k.x1), Math.round(k.y1), Math.round(k.x2), Math.round(k.y2)]) }));
  }
  const masalah: string[] = [];
  // kotak teks dipersempit sedikit: tinggi baris (ascent/descent) bukan bagian huruf
  const inti = kotak.map((k) => {
    const h = k.y2 - k.y1;
    const w = k.x2 - k.x1;
    return { ...k, x1: k.x1 + w * 0.02, x2: k.x2 - w * 0.02, y1: k.y1 + h * 0.14, y2: k.y2 - h * 0.14 };
  });
  for (let i = 0; i < inti.length; i++) {
    const a = inti[i];
    if (a.x1 < -2 || a.x2 > 1082 || a.y1 < -2 || a.y2 > 1922) masalah.push(`terpotong di tepi layar: "${a.teks}" [${Math.round(a.x1)},${Math.round(a.y1)}–${Math.round(a.x2)},${Math.round(a.y2)}]`);
    if (a.x2 > ZONA_TOMBOL.x && a.y2 > ZONA_TOMBOL.y1 && a.y1 < ZONA_TOMBOL.y2) masalah.push(`tertutup tombol YouTube (kanan bawah): "${a.teks}"`);
    else if (a.y2 > ZONA_BAWAH + 20) masalah.push(`tertutup judul/nama channel YouTube (paling bawah): "${a.teks}"`);
    for (let j = i + 1; j < inti.length; j++) {
      const b = inti[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ix = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
      const iy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
      if (ix <= 0 || iy <= 0) continue;
      const kecil = Math.min((a.x2 - a.x1) * (a.y2 - a.y1), (b.x2 - b.x1) * (b.y2 - b.y1));
      if (ix * iy > 0.04 * kecil) masalah.push(`teks tumpang tindih: "${a.teks}" × "${b.teks}"`);
    }
  }
  return [...new Set([...potongan, ...masalah])];
};

export const PemeriksaQA: React.FC<{ frame: number; info?: any }> = ({ frame, info }) => {
  // Ukur setelah kanvas benar-benar tampil (ukuran kanvas > 0), baru lepas render.
  const [h] = useState(() => delayRender('QA visual'));
  useEffect(() => {
    (window as any).QA_DEBUG = !!(info && info.debug);
    let n = 0;
    let batal = false;
    const lapor = (masalah: string[]) => {
      // eslint-disable-next-line no-console
      console.log('QA1HZ ' + JSON.stringify({ frame, masalah, info }));
      continueRender(h);
    };
    const coba = () => {
      if (batal) return;
      const akar = document.querySelector('[data-qa-akar]');
      const r = akar?.getBoundingClientRect();
      if ((!r || r.width < 10 || r.top < -1000) && n++ < 120) {
        requestAnimationFrame(coba);
        return;
      }
      try {
        lapor(periksaLayar());
      } catch (e) {
        lapor([`pemeriksa error: ${(e as Error).message}`]);
      }
    };
    requestAnimationFrame(coba);
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};
