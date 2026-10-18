// Bedah video referensi dari Drive (tanpa Claude menonton langsung):
//   node analisis-referensi.js <fileIdDrive>
// 1. unduh video dari Drive  2. Gemini menonton (Files API) → transkrip + bedah adegan
// 3. ffmpeg ambil 12 potongan gambar → 2 lembar kecil  4. hasil disimpan di Drive:
//    laporan/"Analisis Referensi <nama>" (Google Doc) + aset/referensi/<nama>-lembar-N.jpg
// Video referensi TIDAK pernah ditaruh di repo (repo publik).

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { pilihModel } = require('./buat-konten');

const FOLDER_LAPORAN = '1LU87JTaLQfl-2aY0HC4BiDtXkHnK8JEE';
const FOLDER_ASET = '1WVz9uNojBXOHFfiDKiFbN0rE6KBsT75l';
const DRIVE = 'https://www.googleapis.com/drive/v3';
const log = (...a) => console.error('[referensi]', ...a);

async function aksesToken() {
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const j = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })).json();
  if (!j.access_token) throw new Error('gagal akses Google: ' + (j.error || ''));
  return j.access_token;
}

async function g(token, url, opsi = {}) {
  const r = await fetch(url, { ...opsi, headers: { Authorization: `Bearer ${token}`, ...(opsi.headers || {}) } });
  if (!r.ok) throw new Error(`${url.split('?')[0]} → ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r;
}

async function folderReferensi(token) {
  const q = encodeURIComponent(`'${FOLDER_ASET}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = 'referensi'`);
  const f = ((await (await g(token, `${DRIVE}/files?q=${q}&fields=files(id)`)).json()).files || [])[0];
  if (f) return f.id;
  return (await (await g(token, `${DRIVE}/files?fields=id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'referensi', parents: [FOLDER_ASET], mimeType: 'application/vnd.google-apps.folder' }) })).json()).id;
}

async function unggahDrive(token, nama, folder, mime, isi, jadiDoc = false) {
  const b = 'b' + Date.now();
  const meta = { name: nama, parents: [folder], ...(jadiDoc ? { mimeType: 'application/vnd.google-apps.document' } : {}) };
  const body = Buffer.concat([
    Buffer.from(`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`),
    Buffer.isBuffer(isi) ? isi : Buffer.from(isi), Buffer.from(`\r\n--${b}--`)]);
  return (await (await g(token, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body })).json());
}

/* ---------- Gemini Files API ---------- */
async function unggahGemini(key, file) {
  const ukuran = fs.statSync(file).size;
  const awal = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(ukuran), 'X-Goog-Upload-Header-Content-Type': 'video/mp4', 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: { display_name: path.basename(file) } }),
  });
  const url = awal.headers.get('x-goog-upload-url');
  if (!url) throw new Error('Gemini upload gagal dimulai: ' + awal.status + ' ' + (await awal.text()).slice(0, 200));
  const r = await fetch(url, { method: 'POST', headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize', 'Content-Length': String(ukuran) }, body: fs.readFileSync(file) });
  let f = (await r.json()).file;
  for (let i = 0; i < 60 && f && f.state === 'PROCESSING'; i++) {
    await new Promise((ok) => setTimeout(ok, 5000));
    f = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/${f.name}`, { headers: { 'x-goog-api-key': key } })).json();
  }
  if (!f || f.state !== 'ACTIVE') throw new Error('file Gemini tidak siap: ' + JSON.stringify(f).slice(0, 200));
  return f;
}

const PROMPT = `Kamu analis video YouTube untuk channel edukasi elektronika "1Hertz" (Indonesia) yang akan membuat VIDEO PANJANG pertamanya. Tonton video referensi ini dengan teliti (gambar DAN suara), lalu tulis laporan dalam Bahasa Indonesia, teks biasa tanpa markdown tabel, dengan bagian:

1. IDENTITAS: perkiraan judul/topik, durasi, bahasa, gaya (talking head / faceless / screen recording / animasi / B-roll), rasio layar.
2. TRANSKRIP: transkrip lengkap ucapan dengan cap waktu [mm:ss] tiap kalimat atau tiap ±10 detik. Kalau bahasa asing, tulis aslinya lalu terjemahan singkat.
3. BEDAH ADEGAN: daftar urut [mm:ss–mm:ss] → apa yang terlihat di layar (komposisi, teks layar, grafis, animasi, transisi, B-roll), apa yang didengar (narasi, musik, SFX), dan fungsi bagian itu (hook, konteks, penjelasan, demo, CTA).
4. STRUKTUR & TEMPO: pembagian babak, rata-rata durasi per shot, seberapa sering visual berganti, pola hook 30 detik pertama, cara menjaga retensi.
5. GAYA VISUAL & AUDIO: palet warna, font/teks, jenis grafis, musik, SFX, gaya narasi (tempo bicara, nada).
6. YANG BISA DITIRU 1HERTZ: daftar teknik konkret yang bisa dibuat dengan sumber daya terbatas (tanpa kamera mahal, bisa faceless, bisa otomatis dengan Remotion + suara TTS), dan yang SULIT ditiru beserta alasannya.
7. PERKIRAAN SUMBER DAYA untuk membuat video sejenis berdurasi sama (alat, aset, waktu).

Jujur: kalau ada bagian yang tidak terlihat/terdengar jelas, tulis "tidak jelas", jangan mengarang.`;

async function analisisGemini(file) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  const f = await unggahGemini(key, file);
  log('video di Gemini:', f.name);
  const catatan = [];
  for (const model of await pilihModel(key)) {
    for (let i = 1; i <= 3; i++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ file_data: { mime_type: 'video/mp4', file_uri: f.uri } }, { text: PROMPT }] }], generationConfig: { temperature: 0.3 } }),
        signal: AbortSignal.timeout(300000),
      }).catch((e) => ({ ok: false, status: 0, text: async () => e.message }));
      if (r.ok) {
        const j = await r.json();
        const teks = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
        if (teks.length > 200) { log('analisis oleh', model); return { teks, model }; }
        catatan.push(`${model}: kosong`);
      } else {
        catatan.push(`${model}: ${r.status} ${(await r.text()).replace(/\s+/g, ' ').slice(0, 120)}`);
        if (r.status === 429) break;
      }
      await new Promise((ok) => setTimeout(ok, 30000 * i));
    }
  }
  throw new Error('Gemini gagal menganalisis: ' + catatan.join(' | '));
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg: ' + (r.stderr || '').slice(0, 300));
}
function durasi(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', file], { encoding: 'utf8' });
  const j = JSON.parse(r.stdout || '{}');
  const v = (j.streams || []).find((s) => s.width) || {};
  return { detik: Number(j.format?.duration || 0), w: v.width, h: v.height };
}

(async () => {
  const fileId = process.argv[2];
  if (!fileId) throw new Error('pakai: node analisis-referensi.js <fileIdDrive>');
  const token = await aksesToken();
  const meta = await (await g(token, `${DRIVE}/files/${fileId}?fields=name,size,mimeType`)).json();
  const nama = meta.name.replace(/\.[^.]+$/, '');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ref-'));
  const video = path.join(dir, 'video.mp4');
  fs.writeFileSync(video, Buffer.from(await (await g(token, `${DRIVE}/files/${fileId}?alt=media`)).arrayBuffer()));
  const info = durasi(video);
  log(`${meta.name}: ${info.detik.toFixed(1)} dtk, ${info.w}x${info.h}`);

  // 12 potongan gambar merata → 2 lembar (3x2), kecil supaya hemat
  const folder = await folderReferensi(token);
  const potong = [];
  const sel = info.w >= info.h ? '480:270' : '270:480';
  for (let i = 0; i < 12; i++) {
    const t = (info.detik * (i + 0.5)) / 12;
    const out = path.join(dir, `f${String(i).padStart(2, '0')}.jpg`);
    const label = `${String(Math.floor(t / 60)).padStart(2, '0')}\\:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const font = fs.existsSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') ? ':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf' : '';
    ffmpeg(['-ss', t.toFixed(2), '-i', video, '-frames:v', '1', '-vf', `scale=${sel}:force_original_aspect_ratio=decrease,pad=${sel}:(ow-iw)/2:(oh-ih)/2,drawtext=text='${label}'${font}:x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.6`, '-q:v', '5', out]);
    potong.push({ out, t });
  }
  const lembar = [];
  for (const [n, grup] of [[1, potong.slice(0, 6)], [2, potong.slice(6)]]) {
    const out = path.join(dir, `lembar-${n}.jpg`);
    ffmpeg([...grup.flatMap((p) => ['-i', p.out]), '-filter_complex', `xstack=inputs=6:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0`, '-q:v', '6', out]);
    const up = await unggahDrive(token, `${nama}-lembar-${n}.jpg`, folder, 'image/jpeg', fs.readFileSync(out));
    lembar.push({ n, id: up.id, dari: grup[0].t, sampai: grup[grup.length - 1].t });
  }

  const { teks, model } = await analisisGemini(video);
  const kepala = `ANALISIS REFERENSI — ${meta.name}\nDurasi ${(info.detik / 60).toFixed(1)} menit · ${info.w}x${info.h} · dianalisis oleh ${model}\nLembar gambar (aset/referensi): ${lembar.map((l) => `lembar-${l.n} id=${l.id}`).join(', ')}\n\n`;
  const doc = await unggahDrive(token, `Analisis Referensi ${nama}`, FOLDER_LAPORAN, 'text/plain; charset=UTF-8', kepala + teks, true);
  console.log(`LAPORAN=${doc.webViewLink}`);
  if (process.env.GITHUB_ACTIONS) console.log(`::notice title=Analisis referensi::${meta.name} ${(info.detik / 60).toFixed(1)} mnt · ${model} · doc ${doc.id} · lembar ${lembar.map((l) => l.id).join(',')}`);
})().catch((e) => { console.error('[referensi] ERROR:', e.message); if (process.env.GITHUB_ACTIONS) console.log(`::error title=Analisis referensi::${e.message.slice(0, 400)}`); process.exit(1); });
