// Membuat & merapikan JSON konten 1Hertz tanpa Claude.
//  - ekstrakJson(teks): ambil objek JSON dari teks bebas (hasil salin-tempel dari aplikasi AI, ada ``` dll.)
//  - rapikan(konten): betulkan kesalahan umum (waktu adegan, voiceover_lengkap, hashtag wajib, id) supaya lolos validasi
//  - dariTema(tema): minta Gemini menulis JSON dari satu tema (riset pakai Google Search kalau tersedia)

const fs = require('fs');
const path = require('path');

const PROMPT = fs.readFileSync(path.join(__dirname, 'prompt-konten.md'), 'utf8');
const log = (...a) => console.error('[konten]', ...a);

function ekstrakJson(teks) {
  if (!teks) return null;
  let t = String(teks).replace(/^﻿/, '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  t = t.slice(a, b + 1)
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'") // kutip miring dari Google Docs
    .replace(/,\s*([}\]])/g, '$1');                                   // koma di akhir daftar
  try { return JSON.parse(t); } catch { return null; }
}

const slug = (s) => String(s || 'konten').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'konten';
const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // tanggal WIB

function rapikan(k) {
  k = k && typeof k === 'object' ? k : {};
  k.versi_skema = '1.0';
  if (!k.status) k.status = 'siap_produksi';
  k.kelayakan = { keputusan: 'lanjut', ...(k.kelayakan || {}) };
  k.tema = k.tema || k.publikasi?.judul || 'konten 1Hertz';
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+$/.test(k.id || '')) k.id = `${hariIni()}-${slug(k.id || k.tema)}`;

  const adegan = Array.isArray(k.adegan) ? k.adegan.filter((a) => a && a.voiceover) : [];
  // waktu adegan: nyambung mulai 0; durasi kira-kira dari jumlah kata (±2,4 kata/detik, min 3 dtk)
  let t = 0;
  let nHantaman = 0;
  adegan.forEach((a, i) => {
    const kata = String(a.voiceover).split(/\s+/).filter(Boolean).length;
    let d = Number(a.selesai) - Number(a.mulai);
    if (!(d >= 2 && d <= 12)) d = Math.max(3, Math.round(kata / 2.4));
    a.no = i + 1; a.mulai = t; a.selesai = t + d; t += d;
    if (!a.komponen) a.komponen = 'kartu_solusi';
    a.data = a.data || {};
    if (a.kata_kunci && !String(a.voiceover).toLowerCase().includes(String(a.kata_kunci).toLowerCase())) delete a.kata_kunci;
    // field visual baru: rapikan, jangan sampai menggagalkan validasi
    if (a.judul !== undefined) {
      const j = Array.isArray(a.judul) ? a.judul : String(a.judul).split('|');
      if (j.length >= 2) a.judul = [String(j[0]).trim().slice(0, 26), String(j[1]).trim().slice(0, 26)];
      else delete a.judul;
    }
    if (a.hantaman !== undefined) {
      const h = String(a.hantaman || '').trim().split(/\s+/)[0] || '';
      if (h && h.length <= 10 && nHantaman < 3 && i > 0) { a.hantaman = h; nHantaman++; } else delete a.hantaman;
    }
  });
  k.adegan = adegan;
  const vo = adegan.map((a) => String(a.voiceover).trim()).join(' ');
  k.naskah = { ...(k.naskah || {}), voiceover_lengkap: vo, jumlah_kata: vo.split(/\s+/).filter(Boolean).length, durasi_detik: Math.min(60, Math.max(20, t)) };

  const p = (k.publikasi = k.publikasi || {});
  p.judul = String(p.judul || k.tema).slice(0, 100);
  p.deskripsi = String(p.deskripsi || k.strategi?.takeaway || '').replace(/#\S+/g, '').trim();
  let tag = Array.isArray(p.hashtag_youtube) ? p.hashtag_youtube.map((h) => (String(h).startsWith('#') ? h : '#' + h)) : [];
  tag = tag.filter((h) => !/^#shorts$/i.test(h) && !/^#1hertz$/i.test(h)).slice(0, 2);
  p.hashtag_youtube = ['#shorts', ...tag, '#1Hertz'];
  if (!Array.isArray(p.tags_youtube) || !p.tags_youtube.length) p.tags_youtube = tag.map((h) => h.slice(1));
  return k;
}

/* ---------- Gemini (teks) ---------- */
let modelCache;
async function pilihModel(key) {
  if (modelCache) return modelCache;
  if (process.env.MODEL_KONTEN) return (modelCache = [process.env.MODEL_KONTEN]);
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
    const j = await r.json();
    const nama = (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => m.name.replace(/^models\//, ''))
      .filter((n) => /^gemini-/.test(n) && !/(tts|image|live|embed|audio|vision|robotics|computer|thinking-exp|nano)/.test(n) && /(flash|pro)/.test(n));
    const versi = (n) => { const m = /gemini-(\d+(?:\.\d+)?)/.exec(n); return m ? parseFloat(m[1]) : 0; };
    const skor = (n) => versi(n) * 10 + (/flash/.test(n) ? 3 : /pro/.test(n) ? 1 : 0) - (/lite/.test(n) ? 1 : 0) - (/preview|exp/.test(n) ? 0.5 : 0);
    modelCache = nama.sort((a, b) => skor(b) - skor(a)).slice(0, 6); // lebih banyak cadangan: kuota gratis dihitung per model
  } catch (e) { log('gagal daftar model:', e.message); modelCache = []; }
  if (!modelCache.length) modelCache = ['gemini-2.5-flash'];
  return modelCache;
}

// pikir = true → minta penalaran tinggi (Gemini 3: thinkingLevel, Gemini 2.5: thinkingBudget dinamis).
// Kalau model menolak parameternya (400), otomatis diulang tanpa parameter itu.
const PIKIR_TIDAK_DIDUKUNG = new Set();
async function tanyaGemini(key, model, teks, cari, opsi = {}) {
  const pikir = opsi.pikir && !PIKIR_TIDAK_DIDUKUNG.has(model);
  const gc = { temperature: opsi.temperature ?? 0.7 };
  if (opsi.json && !cari) gc.responseMimeType = 'application/json'; // paksa keluaran JSON valid
  if (pikir) gc.thinkingConfig = /gemini-2\./.test(model) ? { thinkingBudget: -1 } : { thinkingLevel: 'high' };
  const body = { contents: [{ role: 'user', parts: [{ text: teks }] }], generationConfig: gc };
  if (cari) body.tools = [{ google_search: {} }];
  let r;
  for (let i = 1; ; i++) {
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal: AbortSignal.timeout(240000),
      });
      break;
    } catch (e) {
      const sebab = `${e.name}: ${e.message}${e.cause ? ' (' + (e.cause.code || e.cause.message) + ')' : ''}`;
      log(`jaringan ${model}: ${sebab} (coba ${i}/3)`);
      if (i >= 3) return { status: 0, err: 'jaringan ' + sebab };
      await new Promise((ok) => setTimeout(ok, 3000 * i));
    }
  }
  const isi = await r.text();
  if (!r.ok && r.status === 400 && pikir && /thinking/i.test(isi)) { PIKIR_TIDAK_DIDUKUNG.add(model); log(`${model}: thinking tidak didukung, ulang tanpa`); return tanyaGemini(key, model, teks, cari, { ...opsi, pikir: false }); }
  if (!r.ok) {
    const kuota = r.status === 429 ? [...new Set([...isi.matchAll(/"quotaId":\s*"([^"]+)"/g)].map((m) => m[1]))].join(',') : '';
    return { status: r.status, err: (kuota ? `[kuota ${kuota}] ` : '') + isi.slice(0, 200) };
  }
  const j = JSON.parse(isi);
  const out = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  const sumber = (j.candidates?.[0]?.groundingMetadata?.groundingChunks || []).map((c) => c.web).filter(Boolean).map((w) => ({ judul: w.title, url: w.uri }));
  return { teks: out, sumber };
}

async function dariTema(tema) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY belum ada');
  const prompt = `${PROMPT}${tema.trim()}\n\n(Tanggal hari ini: ${hariIni()}. Riset dulu fakta teknisnya sebelum menulis.)`;
  const catatan = [];
  let bolehCari = process.env.KONTEN_TANPA_SEARCH !== '1';
  for (const model of await pilihModel(key)) {
    for (const cari of bolehCari ? [true, false] : [false]) {
      let h;
      for (let i = 1; i <= 3; i++) {
        h = await tanyaGemini(key, model, prompt, cari, { pikir: true, json: !cari });
        if (h.status !== 503 && h.status !== 500 && h.status !== 0) break;
        log(`${model}: ${h.status}, tunggu lalu coba lagi (${i}/3)`);
        await new Promise((ok) => setTimeout(ok, 15000 * i));
      }
      if (cari && h.status === 429) { bolehCari = false; catatan.push(`${model}+search: 429`); continue; } // Google Search tidak ada di kuota gratis
      if (h.teks) {
        const k = ekstrakJson(h.teks);
        if (k) {
          if (h.sumber?.length && !(k.sumber || []).length) k.sumber = h.sumber.slice(0, 6);
          log(`konten dibuat oleh ${model}${cari ? ' + Google Search' : ''}`);
          k._dibuat_oleh = model;
          return await kritikus(key, model, k);
        }
        catatan.push(`${model}: jawaban bukan JSON`);
      } else catatan.push(`${model}${cari ? '+search' : ''}: ${h.status} ${(/"message":\s*"([^"]{0,70})/.exec(String(h.err)) || [])[1] || String(h.err).slice(0, 70)}`);
      if (h.status === 429 && !cari) break; // kuota model ini habis; kalau 429 cuma karena Google Search, coba tanpa search
    }
  }
  throw new Error('Gemini gagal membuat konten: ' + catatan.join(' | '));
}

// Kritikus: panggilan kedua yang memeriksa klaim teknis dan membetulkannya tanpa mengubah struktur.
// Kalau gagal / hasilnya rusak, konten asli tetap dipakai (produksi tidak terhambat).
async function kritikus(key, model, k) {
  if (process.env.TANPA_KRITIKUS === '1') return k;
  const prompt = `Kamu editor teknis senior (ESP32, Arduino, elektronika, FreeRTOS) untuk channel YouTube Shorts berbahasa Indonesia.
Periksa JSON konten di bawah. Cari klaim yang SALAH atau meragukan: nama error/pesan log, nama fungsi/library, nomor pin, tegangan, perilaku chip, dan kode (harus bisa dikompilasi).
- Betulkan yang salah langsung di field-nya (voiceover, teks_layar, data, publikasi). Pertahankan gaya bahasa santai dan panjang naskah (70–95 kata).
- Kalau voiceover diubah, samakan juga naskah.voiceover_lengkap. Jangan ubah struktur, nama field, jumlah adegan, atau id.
- Klaim yang tidak bisa kamu pastikan: lunakkan kalimatnya dan tulis di qa.perlu_dicek.
- Tambahkan field "kritikus":{"diubah":["ringkas apa yang dibetulkan"],"yakin":1-5}.
Jawab HANYA JSON lengkap hasil perbaikan.

JSON:
${JSON.stringify(k)}`;
  for (let i = 1; i <= 2; i++) {
    const h = await tanyaGemini(key, model, prompt, false, { pikir: true, temperature: 0.2, json: true });
    const baru = h.teks && ekstrakJson(h.teks);
    if (baru && Array.isArray(baru.adegan) && baru.adegan.length === k.adegan.length && baru.publikasi) {
      baru.id = k.id; baru._dibuat_oleh = model;
      log(`kritikus: ${(baru.kritikus?.diubah || []).length} perbaikan, yakin ${baru.kritikus?.yakin ?? '?'}/5`);
      return baru;
    }
    log(`kritikus ${model}: ${h.status || 'hasil tidak valid'} (coba ${i}/2)`);
    if (h.status === 429) break;
    await new Promise((ok) => setTimeout(ok, 15000 * i));
  }
  log('kritikus dilewati, pakai konten asli');
  return k;
}

// Revisi dari Okta (mode Gemini): terapkan HANYA perubahan yang diminta pada JSON konten yang sudah jadi.
async function revisiKonten(asal, instruksi) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY belum ada');
  const prompt = `Kamu editor konten YouTube Shorts "1Hertz". Di bawah ada JSON konten video yang SUDAH JADI dan INSTRUKSI REVISI dari pemilik channel.
ATURAN
- Terapkan HANYA perubahan yang diminta. Bagian lain jangan diubah sedikit pun (kata, urutan, data, kode, publikasi).
- Kalau revisi mengubah voiceover: samakan naskah.voiceover_lengkap, jaga total 70–95 kata, waktu adegan tetap nyambung mulai 0, kata_kunci harus ada di voiceover adegannya.
- Kalau instruksi membuat klaim teknis yang meragukan, tetap ikuti tapi tulis di qa.perlu_dicek.
- Jangan ubah id dan nama field. Tambahkan field "revisi":{"instruksi":"salinan instruksi","diubah":["ringkas apa saja yang diubah"]}.
Jawab HANYA JSON lengkap hasil revisi.

INSTRUKSI REVISI:
${instruksi}

JSON:
${JSON.stringify(asal)}`;
  const catatan = [];
  for (const model of await pilihModel(key)) {
    for (let i = 1; i <= 3; i++) {
      const h = await tanyaGemini(key, model, prompt, false, { pikir: true, temperature: 0.2, json: true });
      const baru = h.teks && ekstrakJson(h.teks);
      if (baru && Array.isArray(baru.adegan) && baru.adegan.length && baru.publikasi) {
        baru.id = asal.id; baru._dibuat_oleh = model;
        log(`revisi oleh ${model}: ${(baru.revisi?.diubah || []).join('; ').slice(0, 200)}`);
        return baru;
      }
      catatan.push(`${model}: ${h.status || 'hasil tidak valid'} ${String(h.err || '').slice(0, 80)}`);
      if (h.status === 429) break;
      await new Promise((ok) => setTimeout(ok, 20000 * i));
    }
  }
  throw new Error('Gemini gagal merevisi: ' + catatan.join(' | ').slice(0, 300));
}

module.exports = { ekstrakJson, rapikan, dariTema, pilihModel, tanyaGemini, revisiKonten };
