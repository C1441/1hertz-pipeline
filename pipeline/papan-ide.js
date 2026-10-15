// Tim kreatif 1Hertz tanpa Claude: kumpulkan sinyal permintaan nyata (gratis) → Gemini menyusun
// Papan Ide 10 topik → simpan sebagai Google Docs di Drive "1Hertz/ide".
// Okta menyetujui ide dengan mengganti "[ ]" menjadi "[x]" di dokumen itu; gh-runner lalu
// memproduksi 1 ide yang disetujui per hari (lihat ideBerikut() di bawah).
//
//   node papan-ide.js buat     → buat Papan Ide minggu ini
//
// Sumber sinyal: Stack Overflow & Arduino StackExchange (API publik), GitHub Issues
// espressif/arduino-esp32 (API publik), Reddit r/esp32 r/arduino (kalau tidak diblokir).

const fs = require('fs');
const path = require('path');
const { pilihModel, tanyaGemini } = require('./buat-konten');

const AKAR = path.resolve(__dirname, '..');
const FOLDER_IDE = process.env.FOLDER_IDE || '1U0BhW-nZFCknkgkqM3sl8zIp4t6gD26n';
const URL_DRIVE = 'https://www.googleapis.com/drive/v3';
const log = (...a) => console.error('[ide]', ...a);
const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // WIB
const RE_PILIH = /^\s*\[\s*(x|X|v|V|✓|✔)\s*\]\s*(\d{1,2})\.\s*TEMA:\s*(.+?)\s*$/;

async function aksesToken() {
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error(`Gagal ambil akses Google (${r.status} ${j.error || ''})`);
  return j.access_token;
}

/* ---------- sinyal ---------- */
async function ambilJson(url, headers = {}) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': '1hertz-ide/1.0 (riset konten edukasi)', ...headers }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { log(`${url.split('?')[0]} → ${r.status}`); return null; }
    return await r.json();
  } catch (e) { log(`${url.split('?')[0]} → ${e.message}`); return null; }
}

async function kumpulkanSinyal() {
  const dari = Math.floor(Date.now() / 1000) - 75 * 86400;
  const out = [];
  for (const [site, tag] of [['stackoverflow', 'esp32'], ['stackoverflow', 'arduino'], ['stackoverflow', 'esp8266'], ['arduino', 'esp32'], ['arduino', '']]) {
    const t = tag ? `&tagged=${tag}` : '';
    const j = await ambilJson(`https://api.stackexchange.com/2.3/questions?order=desc&sort=votes&site=${site}${t}&fromdate=${dari}&pagesize=25&filter=default`);
    for (const q of j?.items || []) out.push({ sumber: site === 'arduino' ? 'Arduino StackExchange' : 'Stack Overflow', judul: q.title, url: q.link, angka: `skor ${q.score}, dilihat ${q.view_count}, jawaban ${q.answer_count}` });
  }
  const since = new Date(Date.now() - 75 * 86400e3).toISOString().slice(0, 10);
  const gh = { accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
  for (const repo of ['espressif/arduino-esp32', 'espressif/esp-idf']) {
    const j = await ambilJson(`https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${repo} is:issue created:>${since}`)}&sort=comments&order=desc&per_page=20`, gh);
    for (const i of j?.items || []) out.push({ sumber: `GitHub ${repo}`, judul: i.title, url: i.html_url, angka: `komentar ${i.comments}, reaksi ${i.reactions?.total_count ?? 0}` });
  }
  for (const sub of ['esp32', 'arduino', 'esp8266']) {
    const j = await ambilJson(`https://www.reddit.com/r/${sub}/top.json?t=month&limit=25`);
    for (const c of j?.data?.children || []) { const d = c.data; if (d && !d.stickied) out.push({ sumber: `Reddit r/${sub}`, judul: d.title, url: `https://www.reddit.com${d.permalink}`, angka: `upvote ${d.score}, komentar ${d.num_comments}` }); }
  }
  // buang duplikat URL
  const lihat = new Set();
  return out.filter((s) => s.url && !lihat.has(s.url) && lihat.add(s.url));
}

function sudahDiproduksi() {
  try {
    return fs.readFileSync(path.join(AKAR, 'log', 'riwayat.md'), 'utf8').split('\n')
      .filter((b) => b.includes('privat ✅')).map((b) => (b.split('|')[2] || '').trim()).filter(Boolean);
  } catch { return []; }
}

/* ---------- Gemini ---------- */
const PROMPT = (sinyal, sudah) => `Kamu tim kreatif channel YouTube Shorts "1Hertz" (IoT, ESP32, Arduino, elektronika; penonton pelajar SMK/mahasiswa teknik dan hobiis Indonesia).
MISI: secepatnya layak YouTube Partner Program (500 → 1.000 subscriber, jutaan views Shorts dalam 90 hari) dengan 1 video per hari.

Di bawah ada SINYAL PERMINTAAN NYATA (pertanyaan forum, issue GitHub, postingan Reddit) beserta angkanya. Susun 10 ide video.

ATURAN
- Minimal 8 dari 10 ide WAJIB memakai "bukti" berupa URL yang ADA di daftar sinyal (salin persis). Maks 2 ide boleh tanpa bukti, isi bukti "EKSPERIMEN".
- Utamakan masalah yang banyak dialami pemula (angka tinggi), bisa dijelaskan 30–40 detik, dan bisa divisualkan dengan log serial, potongan kode, diagram, atau perbandingan X vs Y.
- Campuran: ±5 seri A (Error Solver), ±2 seri B (Apa Itu), ±2 X vs Y, ±1 Umum. Minimal 1 ide berseri (punya part 2) untuk menarik subscriber.
- Jangan ulang topik yang sudah diproduksi: ${sudah.join('; ') || '-'}.
- Akurasi: jangan mengarang nama error/fungsi. "tema" ditulis sebagai satu kalimat instruksi produksi yang jelas (topik + angle + inti fix/penjelasan).
- Bahasa Indonesia.

Jawab HANYA JSON array 10 objek, urut dari paling kuat:
[{"judul":"≤60 karakter","seri":"A|B|XvsY|Umum","angle":"...","hook":"≤8 kata","bukti":"URL atau EKSPERIMEN","alasan":"1 kalimat kenapa permintaannya tinggi","skor":1-45,"tema":"satu kalimat untuk produksi"}]

SINYAL:
${sinyal.slice(0, 120).map((s, i) => `${i + 1}. [${s.sumber}] ${s.judul} — ${s.angka} — ${s.url}`).join('\n')}`;

function ambilArray(teks) {
  const t = String(teks || '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf('['), b = t.lastIndexOf(']');
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); } catch { return null; }
}

async function susunIde(sinyal) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  const prompt = PROMPT(sinyal, sudahDiproduksi());
  const catatan = [];
  for (const model of await pilihModel(key)) {
    for (let i = 1; i <= 3; i++) {
      const h = await tanyaGemini(key, model, prompt, false);
      const arr = h.teks && ambilArray(h.teks);
      if (Array.isArray(arr) && arr.length) { log(`ide disusun oleh ${model}`); return { ide: arr.slice(0, 10), model }; }
      catatan.push(`${model}: ${h.status || 'bukan JSON'}`);
      if (h.status === 429) break;
      await new Promise((ok) => setTimeout(ok, 10000 * i));
    }
  }
  throw new Error('Gemini gagal menyusun ide: ' + catatan.join(' | '));
}

/* ---------- dokumen ---------- */
function tulisDokumen(ide, sinyal, model) {
  const urlAda = new Set(sinyal.map((s) => s.url));
  let berbukti = 0;
  const baris = [];
  baris.push(`PAPAN IDE 1HERTZ — minggu ${hariIni()}`);
  baris.push('');
  baris.push('CARA MEMILIH: ganti "[ ]" jadi "[x]" di depan ide yang kamu setujui (targetnya minimal 7).');
  baris.push('Pipeline akan memproduksi 1 ide yang dicentang per hari, urut dari nomor terkecil, lalu mengunggahnya ke YouTube sebagai PRIVAT.');
  baris.push('Boleh juga mengubah kalimat setelah "TEMA:" sebelum dicentang.');
  baris.push('');
  ide.forEach((d, i) => {
    const ok = d.bukti && urlAda.has(String(d.bukti).trim());
    if (ok) berbukti++;
    baris.push(`[ ] ${i + 1}. TEMA: ${String(d.tema || d.judul || '').replace(/\s+/g, ' ').trim()}`);
    baris.push(`    Judul kerja: ${d.judul || '-'}  ·  Seri: ${d.seri || '-'}  ·  Skor: ${d.skor ?? '-'}/45`);
    baris.push(`    Angle: ${d.angle || '-'}`);
    baris.push(`    Hook: ${d.hook || '-'}`);
    baris.push(`    Bukti permintaan: ${ok ? d.bukti : 'EKSPERIMEN (tanpa bukti dari data)'}`);
    baris.push(`    Alasan: ${d.alasan || '-'}`);
    baris.push('');
  });
  baris.splice(2, 0, `Ide berbukti: ${berbukti}/10 (target ≥ 8) · Sinyal dikumpulkan: ${sinyal.length} · Disusun oleh: ${model}`, '');
  baris.push('— Sinyal teratas yang dipakai —');
  sinyal.slice(0, 30).forEach((s) => baris.push(`• [${s.sumber}] ${s.judul} (${s.angka}) ${s.url}`));
  return { teks: baris.join('\n'), berbukti };
}

async function simpanDoc(token, nama, teks) {
  const batas = 'batas1hertz' + Date.now();
  const meta = { name: nama, parents: [FOLDER_IDE], mimeType: 'application/vnd.google-apps.document' };
  const body = `--${batas}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${batas}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${teks}\r\n--${batas}--`;
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${batas}` }, body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`simpan Papan Ide gagal (${r.status}) ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}

/* ---------- dipakai gh-runner: ide disetujui berikutnya ---------- */
const FILE_TERPAKAI = path.join(AKAR, 'log', 'ide-terpakai.txt');
const kunciIde = (docId, no) => `${docId}#${no}`;
function terpakai() { try { return new Set(fs.readFileSync(FILE_TERPAKAI, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)); } catch { return new Set(); } }
function tandaiTerpakai(kunci) { fs.mkdirSync(path.dirname(FILE_TERPAKAI), { recursive: true }); fs.appendFileSync(FILE_TERPAKAI, kunci + '\n'); }
function sudahProduksiHariIni() {
  // 1 video per hari (WIB) dari Papan Ide; antrian manual tetap boleh kapan saja
  try {
    const hari = hariIni();
    return fs.readFileSync(path.join(AKAR, 'log', 'riwayat.md'), 'utf8').split('\n').some((b) => b.includes('papan-ide') && b.includes('privat ✅') && b.includes(`[${hari}]`));
  } catch { return false; }
}
async function ideBerikut(token) {
  if (process.env.TANPA_PAPAN_IDE === '1' || sudahProduksiHariIni()) return null;
  const q = encodeURIComponent(`'${FOLDER_IDE}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.document'`);
  const r = await fetch(`${URL_DRIVE}/files?q=${q}&orderBy=createdTime&fields=files(id,name)&pageSize=20`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const pakai = terpakai();
  for (const f of (await r.json()).files || []) {
    const e = await fetch(`${URL_DRIVE}/files/${f.id}/export?mimeType=text/plain`, { headers: { Authorization: `Bearer ${token}` } });
    if (!e.ok) continue;
    for (const b of (await e.text()).split(/\r?\n/)) {
      const m = RE_PILIH.exec(b.replace(/^﻿/, ''));
      if (m && !pakai.has(kunciIde(f.id, m[2]))) return { kunci: kunciIde(f.id, m[2]), tema: m[3], nama: `papan-ide ${f.name} #${m[2]}`, hari: hariIni() };
    }
  }
  return null;
}

module.exports = { ideBerikut, tandaiTerpakai };

if (require.main === module) {
  (async () => {
    if (process.argv[2] !== 'buat') throw new Error('mode: buat');
    const sinyal = await kumpulkanSinyal();
    log(`sinyal: ${sinyal.length}`);
    if (sinyal.length < 10) throw new Error(`sinyal terlalu sedikit (${sinyal.length}); sumber mungkin sedang diblokir`);
    const { ide, model } = await susunIde(sinyal);
    const { teks, berbukti } = tulisDokumen(ide, sinyal, model);
    const token = await aksesToken();
    const doc = await simpanDoc(token, `Papan Ide ${hariIni()}`, teks);
    console.log(`PAPAN=${doc.webViewLink || doc.id} berbukti=${berbukti}/10`);
    if (process.env.GITHUB_ACTIONS) console.log(`::notice title=Papan Ide::${ide.length} ide, berbukti ${berbukti}/10 — ${doc.webViewLink || doc.id}`);
  })().catch((e) => { console.error('[ide] ERROR:', e.message); if (process.env.GITHUB_ACTIONS) console.log(`::error title=Papan Ide::${e.message.slice(0, 400)}`); process.exit(1); });
}
