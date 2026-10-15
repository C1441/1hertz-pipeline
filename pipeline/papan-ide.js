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
const { kumpulkanAnalis, teksLaporan, simpanLaporan } = require('./analis');
const { modeGemini } = require('./saklar');

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

async function kumpulkanSinyal(analis) {
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
  // kabar baru: rilis core/SDK Espressif
  for (const repo of ['espressif/arduino-esp32', 'espressif/esp-idf']) {
    const j = await ambilJson(`https://api.github.com/repos/${repo}/releases?per_page=2`, gh);
    for (const rl of Array.isArray(j) ? j : []) out.push({ sumber: `Rilis ${repo}`, judul: `${rl.name || rl.tag_name} (${String(rl.published_at || '').slice(0, 10)})`, url: rl.html_url, angka: `reaksi ${rl.reactions?.total_count ?? 0}` });
  }
  // dari Analis: video outlier di niche + komentar penonton (sendiri & outlier)
  for (const v of analis?.outlier || []) out.push({ sumber: 'YouTube outlier', judul: `${v.judul} — ${v.kanal}`, url: v.url, angka: `views ${v.views}, subs channel ${v.subs ?? 'tersembunyi'}, rasio ${v.rasio ?? '-'}x` });
  for (const c of analis?.komentarSendiri || []) out.push({ sumber: 'Komentar penonton 1Hertz', judul: `"${c.teks}" (di: ${c.video})`, url: `https://youtu.be/${(analis.video.find((v) => v.judul === c.video) || {}).id || ''}`, angka: `suka ${c.suka}` });
  for (const c of analis?.komentarOutlier || []) out.push({ sumber: 'Komentar video outlier', judul: `"${c.teks}" (di: ${c.video})`, url: c.url, angka: `suka ${c.suka}, balasan ${c.balasan}` });
  // buang duplikat (URL + judul; komentar boleh berbagi URL video)
  const lihat = new Set();
  return out.filter((s) => { const k = s.url + '|' + s.judul; return s.url && !lihat.has(k) && lihat.add(k); });
}

function sudahDiproduksi() {
  try {
    return fs.readFileSync(path.join(AKAR, 'log', 'riwayat.md'), 'utf8').split('\n')
      .filter((b) => b.includes('privat ✅')).map((b) => (b.split('|')[2] || '').trim()).filter(Boolean);
  } catch { return []; }
}

/* ---------- selera Okta: belajar dari Papan Ide sebelumnya ---------- */
async function selera(token) {
  const hasil = { disetujui: [], ditolak: [], papan: 0 };
  try {
    const q = encodeURIComponent(`'${FOLDER_IDE}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.document'`);
    const r = await fetch(`${URL_DRIVE}/files?q=${q}&orderBy=createdTime desc&fields=files(id,name)&pageSize=4`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return hasil;
    for (const f of (await r.json()).files || []) {
      const e = await fetch(`${URL_DRIVE}/files/${f.id}/export?mimeType=text/plain`, { headers: { Authorization: `Bearer ${token}` } });
      if (!e.ok) continue;
      const ide = [];
      for (const b of (await e.text()).split(/\r?\n/).map((s) => s.replace(/^﻿/, ''))) {
        const m = /^\s*\[\s*([^\]]*)\]\s*(\d{1,2})\.\s*TEMA:\s*(.+?)\s*$/.exec(b);
        if (m) { ide.push({ setuju: /x|v|✓|✔/i.test(m[1]), tema: m[3], alasan: '' }); continue; }
        const a = /^\s*Alasan kalau ditolak:\s*(.*\S)?\s*$/.exec(b);
        if (a && ide.length && a[1] && !/^\(.*\)$/.test(a[1])) ide[ide.length - 1].alasan = a[1];
      }
      if (!ide.some((i) => i.setuju)) continue; // papan yang belum direview tidak dihitung
      hasil.papan++;
      for (const i of ide) (i.setuju ? hasil.disetujui : hasil.ditolak).push(i);
    }
  } catch (e) { log('baca selera gagal:', e.message); }
  return hasil;
}

/* ---------- Gemini: 2 tahap ---------- */
const DASAR = `Kamu tim kreatif channel YouTube Shorts "1Hertz" (IoT, ESP32, Arduino, elektronika; penonton pelajar SMK/mahasiswa teknik dan hobiis Indonesia).
MISI: secepatnya layak YouTube Partner Program (500 → 1.000 subscriber, jutaan views Shorts dalam 90 hari) dengan 1 video per hari. Pendorong terbesar: ide berseri (subscriber), masalah yang banyak dicari (views), dan nilai unik (YouTube menolak konten berulang/rendah orisinalitas).`;

const PROMPT_MENTAH = (sinyal, sudah) => `${DASAR}

TUGAS: kamu PEMBUAT IDE. Dari SINYAL PERMINTAAN NYATA di bawah (pertanyaan forum, issue GitHub, video outlier, komentar penonton, rilis baru), buat 20 ide video mentah yang beragam.

ATURAN
- Tiap ide sebisa mungkin memakai "bukti" = URL yang ADA di daftar sinyal (salin persis). Kalau tidak ada, tulis "EKSPERIMEN".
- Masalah yang banyak dialami pemula, bisa dijelaskan 30–40 detik, bisa divisualkan dengan log serial, potongan kode (baris fix diketik), status, diagram alur, atau X vs Y.
- Variasikan seri: A (Error Solver), B (Apa Itu), XvsY, Umum. Beberapa ide punya kelanjutan (part 2/3).
- Jangan ulang topik yang sudah diproduksi: ${sudah.join('; ') || '-'}.
- Akurasi: jangan mengarang nama error/fungsi. Bahasa Indonesia.

Jawab HANYA JSON array 20 objek:
[{"judul":"≤60 karakter, kata kunci di depan","seri":"A|B|XvsY|Umum","angle":"sudut pandang, bukan cuma topik","hook":"≤8 kata","visual":"komponen utama","lanjutan":"ide part 2 atau -","bukti":"URL atau EKSPERIMEN","alasan":"1 kalimat kenapa permintaannya tinggi","tema":"satu kalimat instruksi produksi: topik + angle + inti fix/penjelasan"}]

SINYAL:
${sinyal.slice(0, 140).map((s, i) => `${i + 1}. [${s.sumber}] ${s.judul} — ${s.angka} — ${s.url}`).join('\n')}`;

const PROMPT_SARING = (mentah, analis, sel) => `${DASAR}

TUGAS: kamu KRITIKUS sekaligus PEMIMPIN REDAKSI. Di bawah ada 20 IDE MENTAH, DATA ANALIS channel, dan SELERA OKTA (pemilik channel) dari Papan Ide sebelumnya.

1. Nilai tiap ide 1–5 untuk: permintaan, persaingan (5 = sepi), celah, bisa_divisualkan, cocok_channel, umur_topik, risiko_rendah, dorong_subscriber, keaslian. Skor maks 45.
2. Buang ide skor < 30, duplikat/mirip, klaim teknis yang meragukan, atau yang mirip ide yang pernah DITOLAK Okta. Utamakan pola ide yang DISETUJUI Okta.
3. Pilih 10. Minimal 8 harus punya bukti URL (bukan EKSPERIMEN). Komposisi ±5 A, ±2 B, ±2 XvsY, ±1 Umum. Minimal 1 ide berseri.
4. Urutkan sebagai JADWAL TAYANG: nomor 1–7 = Senin–Minggu (hindari dua topik mirip berurutan, ide terkuat di awal minggu), nomor 8–10 = cadangan.
5. Tulis 2–3 catatan analis (pola dari data; tulis "[ASUMSI]" kalau videonya < 10 atau data kosong) dan 1 kalimat strategi minggu ini (apa yang diuji).
6. Boleh merapikan judul/hook/tema, tapi JANGAN mengubah URL bukti.

Jawab HANYA satu objek JSON:
{"strategi":"...","catatan_analis":["..."],"ide":[{"hari":"Senin|...|Minggu|Cadangan","judul":"","seri":"","angle":"","hook":"","visual":"","lanjutan":"","bukti":"URL atau EKSPERIMEN","alasan":"","skor":{"permintaan":0,"persaingan":0,"celah":0,"bisa_divisualkan":0,"cocok_channel":0,"umur_topik":0,"risiko_rendah":0,"dorong_subscriber":0,"keaslian":0},"total":0,"perlu_dicek":"klaim yang harus dicek Okta atau -","tema":""}],"dibuang":[{"judul":"","alasan":"singkat"}]}

IDE MENTAH:
${JSON.stringify(mentah)}

DATA ANALIS:
${analis.slice(0, 9000)}

SELERA OKTA (${sel.papan} papan direview):
Disetujui: ${sel.disetujui.slice(0, 25).map((i) => i.tema).join(' || ') || 'belum ada data'}
Ditolak: ${sel.ditolak.slice(0, 25).map((i) => i.tema + (i.alasan ? ` (alasan: ${i.alasan})` : '')).join(' || ') || 'belum ada data'}`;

function ambilJsonDari(teks, buka, tutup) {
  const t = String(teks || '').replace(/```(?:json)?/gi, '');
  const a = t.indexOf(buka), b = t.lastIndexOf(tutup);
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1).replace(/,\s*([}\]])/g, '$1')); } catch { return null; }
}

async function tanyaJson(prompt, cocok, label) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  const catatan = [];
  for (const model of await pilihModel(key)) {
    for (let i = 1; i <= 3; i++) {
      const h = await tanyaGemini(key, model, prompt, false, { pikir: true, json: true });
      const hasil = h.teks && cocok(h.teks);
      if (hasil) { log(`${label}: ${model}`); return { hasil, model }; }
      catatan.push(`${model}: ${h.status || 'bukan JSON'} ${String(h.err || '').replace(/\s+/g, ' ').slice(0, h.status === 429 ? 160 : 40)}`);
      if (h.status === 429) break;
      await new Promise((ok) => setTimeout(ok, 45000 * i)); // 503 = server Gemini sibuk, tunggu lebih lama
    }
  }
  throw new Error(`Gemini gagal (${label}): ` + catatan.join(' | '));
}

async function susunIde(sinyal, teksAnalis, sel) {
  const t1 = await tanyaJson(PROMPT_MENTAH(sinyal, sudahDiproduksi()), (t) => { const a = ambilJsonDari(t, '[', ']'); return Array.isArray(a) && a.length >= 10 ? a.slice(0, 24) : null; }, 'ide mentah');
  await new Promise((ok) => setTimeout(ok, 60000)); // jeda 1 menit: batas token per menit kuota gratis
  try {
    const t2 = await tanyaJson(PROMPT_SARING(t1.hasil, teksAnalis, sel), (t) => { const o = ambilJsonDari(t, '{', '}'); return o && Array.isArray(o.ide) && o.ide.length >= 5 ? o : null; }, 'kritikus');
    return { ...t2.hasil, ide: t2.hasil.ide.slice(0, 10), model: `${t1.model} → kritikus ${t2.model}`, mentah: t1.hasil.length };
  } catch (e) {
    log('tahap kritikus gagal, pakai 10 ide mentah pertama:', e.message);
    if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Kritikus Papan Ide::${e.message.replace(/[\r\n]+/g, ' ').slice(0, 400)}`);
    return { strategi: '-', catatan_analis: ['tahap kritikus gagal: ' + e.message.slice(0, 150)], ide: t1.hasil.slice(0, 10), dibuang: [], model: t1.model, mentah: t1.hasil.length };
  }
}

/* ---------- dokumen ---------- */
function tulisDokumen(p, sinyal, sel) {
  const urlAda = new Set(sinyal.map((s) => s.url));
  let berbukti = 0;
  const ide = p.ide;
  const baris = [];
  baris.push(`PAPAN IDE 1HERTZ — minggu ${hariIni()}`);
  baris.push('');
  baris.push('CARA MEMILIH: ganti "[ ]" jadi "[x]" di depan ide yang kamu setujui (targetnya minimal 7).');
  baris.push('Yang kamu tolak: boleh isi "Alasan kalau ditolak:" — tim belajar dari situ minggu depan.');
  baris.push('Saat SAKLAR mode Gemini HIDUP, pipeline memproduksi 1 ide yang dicentang per hari, urut dari nomor terkecil (1–7 = jadwal Senin–Minggu, 8–10 cadangan), lalu mengunggahnya sebagai PRIVAT.');
  baris.push('Boleh juga mengubah kalimat setelah "TEMA:" sebelum dicentang.');
  baris.push('');
  baris.push(`STRATEGI MINGGU INI: ${p.strategi || '-'}`);
  for (const c of p.catatan_analis || []) baris.push(`Catatan analis: ${c}`);
  if (sel.papan) {
    const n = sel.disetujui.length + sel.ditolak.length;
    baris.push(`Persetujuanmu di ${sel.papan} papan terakhir: ${sel.disetujui.length}/${n} (${Math.round((100 * sel.disetujui.length) / Math.max(n, 1))}%; target ≥ 70%)`);
  }
  baris.push('');
  ide.forEach((d, i) => {
    const ok = d.bukti && urlAda.has(String(d.bukti).trim());
    if (ok) berbukti++;
    const total = d.total ?? (d.skor && typeof d.skor === 'object' ? Object.values(d.skor).reduce((a, b) => a + Number(b || 0), 0) : d.skor);
    baris.push(`[ ] ${i + 1}. TEMA: ${String(d.tema || d.judul || '').replace(/\s+/g, ' ').trim()}`);
    baris.push(`    Jadwal: ${d.hari || (i < 7 ? ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][i] : 'Cadangan')}  ·  Judul kerja: ${d.judul || '-'}  ·  Seri: ${d.seri || '-'}  ·  Skor: ${total ?? '-'}/45`);
    baris.push(`    Angle: ${d.angle || '-'}`);
    baris.push(`    Hook: ${d.hook || '-'}  ·  Visual: ${d.visual || '-'}`);
    if (d.lanjutan && d.lanjutan !== '-') baris.push(`    Lanjutan seri: ${d.lanjutan}`);
    baris.push(`    Bukti permintaan: ${ok ? d.bukti : 'EKSPERIMEN (tanpa bukti dari data)'}`);
    baris.push(`    Alasan: ${d.alasan || '-'}`);
    if (d.perlu_dicek && d.perlu_dicek !== '-') baris.push(`    Perlu dicek: ${d.perlu_dicek}`);
    baris.push('    Alasan kalau ditolak: ');
    baris.push('');
  });
  baris.splice(2, 0, `Ide berbukti: ${berbukti}/${ide.length} (target ≥ 8) · ${p.mentah} ide mentah disaring jadi ${ide.length} · Sinyal: ${sinyal.length} · Disusun oleh: ${p.model}`, '');
  if ((p.dibuang || []).length) {
    baris.push('— Dibuang kritikus —');
    for (const d of p.dibuang.slice(0, 12)) baris.push(`• ${d.judul}: ${d.alasan}`);
    baris.push('');
  }
  baris.push('— Sinyal teratas yang dipakai —');
  sinyal.slice(0, 30).forEach((s) => baris.push(`• [${s.sumber}] ${s.judul} (${s.angka}) ${s.url}`));
  return { teks: baris.join('\n'), berbukti };
}

async function simpanDoc(token, nama, teks, folder = FOLDER_IDE) {
  const batas = 'batas1hertz' + Date.now();
  const meta = { name: nama, parents: [folder], mimeType: 'application/vnd.google-apps.document' };
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

module.exports = { ideBerikut, tandaiTerpakai, _uji: { tulisDokumen, PROMPT_MENTAH, PROMPT_SARING } };

if (require.main === module) {
  (async () => {
    if (process.argv[2] !== 'buat') throw new Error('mode: buat');
    const notice = (judul, m) => { if (process.env.GITHUB_ACTIONS) console.log(`::notice title=${judul}::${String(m).replace(/[\r\n]+/g, ' ').slice(0, 450)}`); };
    const token = await aksesToken();

    // 1. Analis (tanpa AI) — selalu jalan, laporannya juga bisa dipakai saat kerja dengan Claude
    let analis = null;
    try {
      analis = await kumpulkanAnalis(token);
      const lap = await simpanLaporan(token, teksLaporan(analis));
      notice('Laporan Analis', `akses ${analis.akses}, outlier ${analis.outlier.length}, komentar ${analis.komentarSendiri.length + analis.komentarOutlier.length} — ${lap.webViewLink || lap.id}${analis.catatan.length ? ' · ' + analis.catatan.join(' · ') : ''}`);
    } catch (e) { log('analis gagal:', e.message); notice('Laporan Analis', 'gagal: ' + e.message); }

    // 2. Saklar: jadwal otomatis hanya jalan kalau mode Gemini HIDUP; tombol Run workflow manual selalu jalan
    const saklar = await modeGemini(token);
    const manual = process.env.GITHUB_EVENT_NAME && process.env.GITHUB_EVENT_NAME !== 'schedule';
    log(`mode Gemini: ${saklar.hidup ? 'HIDUP' : 'MATI'} (${saklar.sumber}) · dipicu: ${process.env.GITHUB_EVENT_NAME || 'lokal'}`);
    if (!saklar.hidup && !manual) { notice('Papan Ide', 'dilewati: SAKLAR mode Gemini MATI (Laporan Analis tetap dibuat)'); return; }
    const modePapan = process.env.MODE_PAPAN || 'penuh';
    if (modePapan === 'analis') { notice('Papan Ide', 'dilewati: mode analis saja'); return; }

    // 3. Papan Ide 2 tahap
    const sinyal = await kumpulkanSinyal(analis);
    log(`sinyal: ${sinyal.length}`);
    if (sinyal.length < 10) throw new Error(`sinyal terlalu sedikit (${sinyal.length}); sumber mungkin sedang diblokir`);
    const sel = await selera(token);
    const p = await susunIde(sinyal, analis ? teksLaporan(analis) : 'belum ada data', sel);
    const { teks, berbukti } = tulisDokumen(p, sinyal, sel);
    if (modePapan === 'uji') { await simpanDoc(token, `UJI Papan Ide ${hariIni()} (boleh dihapus)`, teks, process.env.FOLDER_LAPORAN || '1LU87JTaLQfl-2aY0HC4BiDtXkHnK8JEE'); notice('Papan Ide', `UJI: ${p.ide.length} ide (dari ${p.mentah} mentah), berbukti ${berbukti}/${p.ide.length}, ${p.model}`); return; }
    const doc = await simpanDoc(token, `Papan Ide ${hariIni()}`, teks);
    console.log(`PAPAN=${doc.webViewLink || doc.id} berbukti=${berbukti}/${p.ide.length}`);
    notice('Papan Ide', `${p.ide.length} ide (dari ${p.mentah} mentah), berbukti ${berbukti}/${p.ide.length} — ${doc.webViewLink || doc.id}`);
  })().catch((e) => { console.error('[ide] ERROR:', e.message); if (process.env.GITHUB_ACTIONS) console.log(`::error title=Papan Ide::${e.message.slice(0, 400)}`); process.exit(1); });
}
