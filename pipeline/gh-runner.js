// Runner pipeline 1Hertz untuk GitHub Actions (pengganti n8n di laptop).
//   node gh-runner.js cek     → cek apakah ada JSON di Drive "1Hertz/antrian" (tulis ada=true/false ke GITHUB_OUTPUT)
//   node gh-runner.js proses  → untuk tiap JSON: validasi → TTS + render (produksi.js) → upload YouTube PRIVAT
//                               → pindah JSON ke "selesai" (atau "gagal") → catat di log/riwayat.md
//
// Rahasia hanya dibaca dari environment (GitHub Secrets) dan tidak pernah dicetak:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GEMINI_API_KEY

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { cek } = require('./validasi');
const { ekstrakJson, rapikan, dariTema } = require('./buat-konten');
const { ideBerikut, tandaiTerpakai } = require('./papan-ide');
const { modeGemini } = require('./saklar');

const AKAR = path.resolve(__dirname, '..');
const FOLDER = {
  antrian: process.env.FOLDER_ANTRIAN || '19TQHoFX2Ri5K7pkED0jgqgykqOiyvxCn',
  selesai: process.env.FOLDER_SELESAI || '1d1Zf46yu4L_VzxPwN_5R3JG4U-KOfnT6',
  gagal: process.env.FOLDER_GAGAL || '1tpP_grzjp389ydfK4ZdFab8C8_yx3NHw',
};
const URL_TOKEN = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const URL_DRIVE = process.env.GOOGLE_DRIVE_URL || 'https://www.googleapis.com/drive/v3';
const URL_UPLOAD = process.env.GOOGLE_UPLOAD_URL || 'https://www.googleapis.com/upload/youtube/v3';
const MAKS_VIDEO = Number(process.env.MAKS_VIDEO || 2);

const log = (...a) => console.log('[runner]', ...a);
// pesan error terlihat di ringkasan run GitHub (anotasi); tidak pernah berisi rahasia
const galat = (m) => { if (process.env.GITHUB_ACTIONS) console.log(`::error title=1Hertz::${String(m).replace(/[\r\n]+/g, ' ').slice(0, 500)}`); };
const wajib = (n) => { const v = (process.env[n] || '').trim(); if (!v) throw new Error(`Secret ${n} belum diisi`); return v; };

async function aksesToken() {
  const body = new URLSearchParams({
    client_id: wajib('GOOGLE_CLIENT_ID'),
    client_secret: wajib('GOOGLE_CLIENT_SECRET'),
    refresh_token: wajib('GOOGLE_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });
  const r = await fetchUlang(URL_TOKEN, { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    // jangan cetak isi token; cukup jenis error-nya
    throw new Error(`Gagal ambil akses Google (${r.status} ${j.error || ''}). Kalau "invalid_grant": refresh token kedaluwarsa/dicabut, buat ulang.`);
  }
  return j.access_token;
}

// fetch dengan coba ulang untuk gangguan jaringan (koneksi putus, timeout), bukan untuk error HTTP
async function fetchUlang(url, opsi, kali = 4) {
  for (let i = 1; ; i++) {
    try { return await fetch(url, opsi); }
    catch (e) {
      if (i >= kali) throw new Error(`jaringan: ${e.message}${e.cause ? ' (' + e.cause.message + ')' : ''}`);
      log(`gangguan jaringan, coba lagi (${i}/${kali - 1})…`);
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

async function google(token, url, opsi = {}) {
  const r = await fetchUlang(url, { ...opsi, headers: { Authorization: `Bearer ${token}`, ...(opsi.headers || {}) } });
  if (!r.ok) throw new Error(`${opsi.method || 'GET'} ${url.split('?')[0]} → ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r;
}

async function daftarAntrian(token) {
  // terima: file .json, file .txt, atau Google Docs (isi = JSON lengkap ATAU cukup tema satu kalimat)
  const q = encodeURIComponent(`'${FOLDER.antrian}' in parents and trashed = false and (name contains '.json' or name contains '.txt' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain')`);
  const r = await google(token, `${URL_DRIVE}/files?q=${q}&orderBy=createdTime&fields=files(id,name,mimeType,createdTime)&pageSize=20&supportsAllDrives=true&includeItemsFromAllDrives=true`);
  return (await r.json()).files || [];
}

async function bacaIsi(token, f) {
  const url = f.mimeType === 'application/vnd.google-apps.document'
    ? `${URL_DRIVE}/files/${f.id}/export?mimeType=text/plain`
    : `${URL_DRIVE}/files/${f.id}?alt=media&supportsAllDrives=true`;
  const r = await google(token, url);
  return await r.text();
}

async function pindah(token, fileId, ke) {
  if (!fileId) return; // ide dari Papan Ide: tidak ada file antrian
  await google(token, `${URL_DRIVE}/files/${fileId}?addParents=${FOLDER[ke]}&removeParents=${FOLDER.antrian}&supportsAllDrives=true&fields=id`, { method: 'PATCH' });
}

async function uploadYouTube(token, fileVideo, meta) {
  const ukuran = fs.statSync(fileVideo).size;
  const awal = await google(token, `${URL_UPLOAD}/videos?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(ukuran) },
    body: JSON.stringify({
      snippet: { title: meta.judul, description: meta.deskripsi, tags: meta.tags, categoryId: '28', defaultLanguage: 'id', defaultAudioLanguage: 'id' },
      status: { privacyStatus: 'private', selfDeclaredMadeForKids: false },
    }),
  });
  const lokasi = awal.headers.get('location');
  if (!lokasi) throw new Error('YouTube tidak memberi alamat upload');
  const r = await fetchUlang(lokasi, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'video/mp4', 'Content-Length': String(ukuran) }, body: fs.readFileSync(fileVideo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) throw new Error(`Upload YouTube gagal (${r.status}) ${JSON.stringify(j).slice(0, 300)}`);
  return j.id;
}

function catat(baris) {
  const f = path.join(AKAR, 'log', 'riwayat.md');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, '# Riwayat produksi 1Hertz\n\n| Waktu (UTC) | File | Hasil | YouTube | Catatan |\n|---|---|---|---|---|\n');
  fs.appendFileSync(f, baris + '\n');
}

// Mode Gemini MATI: hanya JSON lengkap (dari Claude/template) yang diproses; dokumen berisi tema saja dibiarkan menunggu.
async function bisaDiproses(token, files, hidup) {
  if (hidup) return files;
  const out = [];
  for (const f of files) {
    let isi;
    try { isi = await bacaIsi(token, f); } catch { out.push(f); continue; }
    if (ekstrakJson(isi) || /"adegan"\s*:/.test(isi)) { f.isi = isi; out.push(f); } // JSON (rusak pun diproses → masuk "gagal" dengan alasan)
    else log(`menunggu mode Gemini HIDUP (isinya tema saja): ${f.name}`);
  }
  return out;
}

function keluaran(nama, nilai) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${nama}=${nilai}\n`);
}

async function modeCek() {
  const kurang = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GEMINI_API_KEY'].filter((n) => !(process.env[n] || '').trim());
  if (kurang.length) {
    // belum disetel: lewati dengan tenang (tanpa run merah / email tiap 5 menit)
    log(`secrets belum lengkap (${kurang.join(', ')}), produksi dilewati`);
    keluaran('ada', 'false');
    return;
  }
  const token = await aksesToken();
  const saklar = await modeGemini(token);
  log(`mode Gemini: ${saklar.hidup ? 'HIDUP' : 'MATI'} (${saklar.sumber})`);
  const files = await bisaDiproses(token, await daftarAntrian(token), saklar.hidup);
  log(`antrian siap: ${files.length} file`);
  let ide = null;
  if (!files.length && saklar.hidup) { try { ide = await ideBerikut(token); } catch (e) { log('cek Papan Ide gagal:', e.message); } }
  if (ide) log(`ide disetujui berikutnya: ${ide.nama}`);
  keluaran('ada', files.length > 0 || ide ? 'true' : 'false');
}

async function modeProses() {
  let token = await aksesToken();
  const saklar = await modeGemini(token);
  log(`mode Gemini: ${saklar.hidup ? 'HIDUP' : 'MATI'} (${saklar.sumber})`);
  const files = (await bisaDiproses(token, await daftarAntrian(token), saklar.hidup)).slice(0, MAKS_VIDEO);
  if (!files.length) {
    if (!saklar.hidup) { log('antrian kosong (mode Gemini MATI: ide Papan Ide tidak diproduksi)'); return; }
    // antrian kosong → ambil 1 ide yang dicentang di Papan Ide (maks 1 per hari)
    const ide = await ideBerikut(token).catch(() => null);
    if (!ide) { log('antrian kosong, tidak ada ide disetujui yang menunggu'); return; }
    files.push({ id: null, name: ide.nama, ide });
  }
  let gagalAda = false;
  for (const f of files) {
    const waktu = new Date().toISOString().slice(0, 16).replace('T', ' ');
    log(`memproses ${f.name}`);
    if (f.ide) tandaiTerpakai(f.ide.kunci); // ditandai di awal supaya ide yang gagal tidak dicoba ulang tiap 5 menit (hemat kuota)
    let konten;
    try {
      const isi = f.ide ? f.ide.tema : f.isi ?? await bacaIsi(token, f);
      konten = ekstrakJson(isi);
      if (!konten) {
        // bukan JSON → anggap isinya tema, minta Gemini menulis naskah + JSON
        const tema = isi.replace(/\s+/g, ' ').trim();
        if (tema.length < 4) throw new Error('file kosong');
        if (!saklar.hidup) throw new Error('mode Gemini MATI, tema tidak ditulis'); // pengaman; seharusnya sudah disaring
        log(`tema: "${tema.slice(0, 80)}" → Gemini membuat konten`);
        konten = await dariTema(tema);
      }
      konten = rapikan(konten);
    } catch (e) {
      log('isi tidak bisa dipakai:', e.message); galat('isi antrian tidak bisa dipakai: ' + e.message);
      await pindah(token, f.id, 'gagal'); catat(`| ${waktu} | ${f.name} | gagal | - | ${e.message.slice(0, 120).replace(/\|/g, '/')} |`); gagalAda = true; continue;
    }
    const v = cek(konten);
    if (!v.lanjut) {
      const alasan = v.valid ? 'status ditolak / kelayakan stop' : v.error.join('; ');
      log('tidak diproduksi:', alasan);
      await pindah(token, f.id, 'gagal'); catat(`| ${waktu} | ${f.name} | ditolak | - | ${alasan.slice(0, 150).replace(/\|/g, '/')} |`); continue;
    }
    // produksi: TTS + render (produksi.js yang sama dengan versi laptop)
    const dirLokal = path.join(AKAR, 'antrian-lokal');
    fs.mkdirSync(dirLokal, { recursive: true });
    const fileJson = path.join(dirLokal, `${v.id}.json`);
    fs.writeFileSync(fileJson, JSON.stringify(konten, null, 2));
    const mulai = Date.now();
    const p = spawnSync(process.execPath, [path.join(__dirname, 'produksi.js'), fileJson], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    process.stdout.write(p.stdout || ''); process.stdout.write(p.stderr || '');
    const fileVideo = path.join(AKAR, 'hasil', `${v.id}.mp4`);
    if (p.status !== 0 || !fs.existsSync(fileVideo)) {
      const alasan = (((p.stdout || '') + (p.stderr || '')).match(/GAGAL=(.*)/) || [])[1] || `kode ${p.status}`;
      log('produksi gagal:', alasan); galat('produksi gagal: ' + alasan);
      await pindah(token, f.id, 'gagal'); catat(`| ${waktu} | ${f.name} | gagal produksi | - | ${alasan.slice(0, 120).replace(/\|/g, '/')} |`); gagalAda = true; continue;
    }
    const menit = ((Date.now() - mulai) / 60000).toFixed(1);
    try {
      const tokenBaru = await aksesToken();
      const idYt = await uploadYouTube(tokenBaru, fileVideo, v);
      await pindah(tokenBaru, f.id, 'selesai');
      log(`selesai: https://youtu.be/${idYt} (produksi ${menit} menit)`);
      catat(`| ${waktu} | ${f.name}${f.ide ? ` [${f.ide.hari}]` : ''} | privat ✅ | ${idYt} | produksi ${menit} menit |`);
      keluaran('video_terakhir', idYt);
    } catch (e) {
      log('upload gagal:', e.message); galat('upload gagal: ' + e.message);
      // Pindah ke "gagal" (bukan dicoba ulang otomatis) supaya kuota TTS tidak habis oleh percobaan berulang.
      // Setelah masalahnya beres, salin file dari "gagal" ke "antrian" untuk mencoba lagi.
      await pindah(token, f.id, 'gagal').catch(() => {});
      catat(`| ${waktu} | ${f.name} | gagal upload | - | ${e.message.slice(0, 120).replace(/\|/g, '/')} |`); gagalAda = true;
    }
  }
  if (gagalAda) process.exitCode = 1; // supaya GitHub menandai run ini merah dan kirim email notifikasi
}

const mode = process.argv[2];
(mode === 'cek' ? modeCek() : mode === 'proses' ? modeProses() : Promise.reject(new Error('mode: cek | proses')))
  .catch((e) => { console.error('[runner] ERROR:', e.message); galat(e.message); process.exit(1); });
