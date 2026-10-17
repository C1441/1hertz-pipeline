// Produksi satu video 1Hertz dari satu file JSON konten (skema 1.0).
// Pakai:  node produksi.js C:\Users\agath\1hertz\antrian-lokal\<id>.json
// Hasil:  C:\Users\agath\1hertz\hasil\<id>.mp4  (+ baris "HASIL=<path>" di stdout)
//
// Langkah: TTS Gemini (1 request per video, ada model cadangan) → WAV
//          → atur ulang durasi adegan mengikuti panjang suara → render Remotion.
//
// API key TIDAK disimpan di folder 1hertz. Dibaca dari:
//   %GEMINI_KEY_FILE%  atau  C:\Users\<user>\Documents\rahasia-1hertz\gemini-key.txt
// Untuk tes tanpa internet/kuota: set FAKE_TTS=1 (suara diganti nada pendek).

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const AKAR = path.resolve(__dirname, '..');                 // ...\1hertz
const REMOTION = path.join(AKAR, 'remotion');
const HASIL = path.join(AKAR, 'hasil');
const MODEL_TTS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-tts-preview'];
const SUARA = process.env.SUARA_TTS || 'Puck';
const GAYA = 'energik tapi santai, seperti teman yang jago elektronika lagi ngejelasin ke temannya, tempo agak cepat tanpa jeda panjang, penekanan jelas di kata penting, bahasa Indonesia sehari-hari';

const log = (...a) => console.error('[produksi]', ...a);
const gagal = (m) => { console.error('GAGAL=' + m); process.exit(1); };

function bacaKey() {
  // Di GitHub Actions key datang dari Secrets lewat environment variable
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length >= 20) return process.env.GEMINI_API_KEY.trim();
  // Cari folder rahasia-1hertz satu tingkat di bawah home / OneDrive
  // (nama folder Documents bisa beda bahasa, mis. "ドキュメント").
  const akar = [os.homedir(), path.join(os.homedir(), 'OneDrive'), process.env.OneDrive].filter(Boolean);
  const kandidat = [process.env.GEMINI_KEY_FILE].filter(Boolean);
  for (const a of akar) {
    let isi = [];
    try { isi = fs.readdirSync(a, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch {}
    for (const sub of isi) for (const nama of ['gemini-key.txt', 'gemini-key.txt.txt', 'gemini-key'])
      kandidat.push(path.join(a, sub, 'rahasia-1hertz', nama));
  }
  const f = kandidat.find((p) => fs.existsSync(p));
  if (!f) gagal(`File API key tidak ketemu (folder rahasia-1hertz/gemini-key.txt di bawah: ${akar.join(' ; ')})`);
  log('key dari folder: ' + path.dirname(f));
  const k = fs.readFileSync(f, 'utf8').trim();
  if (k.length < 20) gagal('Isi file API key kosong atau terlalu pendek');
  return k;
}

/* ---------- WAV ---------- */
function bungkusWav(pcm, rate = 24000) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
function durasiWav(buf) {
  // cari chunk 'fmt ' dan 'data'
  let rate = 24000, ch = 1, bits = 16, dataLen = 0, i = 12;
  while (i + 8 <= buf.length) {
    const id = buf.toString('ascii', i, i + 4); const len = buf.readUInt32LE(i + 4);
    if (id === 'fmt ') { ch = buf.readUInt16LE(i + 10); rate = buf.readUInt32LE(i + 12); bits = buf.readUInt16LE(i + 22); }
    if (id === 'data') { dataLen = Math.min(len, buf.length - i - 8); break; }
    i += 8 + len + (len % 2);
  }
  return dataLen / (rate * ch * (bits / 8));
}

/* ---------- TTS ---------- */
async function ttsInteractions(key, model, teks) {
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      model,
      input: [{ type: 'user_input', content: [{ type: 'text', text: teks, annotations: [{ type: 'speech_metadata', style: GAYA }] }] }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice: SUARA }] },
    }),
  });
  const body = await r.text();
  if (!r.ok) return { status: r.status, err: body.slice(0, 300) };
  const j = JSON.parse(body);
  for (const s of j.steps || []) for (const c of s.content || []) if (c.type === 'audio' && c.data) return { data: c.data, mime: c.mime_type || 'audio/wav' };
  if (j.output_audio?.data) return { data: j.output_audio.data, mime: j.output_audio.mime_type || 'audio/wav' };
  return { status: 500, err: 'respons tanpa audio' };
}
async function ttsGenerateContent(key, model, teks) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Bacakan dengan gaya ${GAYA}: ${teks}` }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: SUARA } } } },
    }),
  });
  const body = await r.text();
  if (!r.ok) return { status: r.status, err: body.slice(0, 300) };
  const p = JSON.parse(body).candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
  if (!p) return { status: 500, err: 'respons tanpa audio' };
  return { data: p.inlineData.data, mime: p.inlineData.mimeType || 'audio/l16;rate=24000' };
}
async function buatSuara(teks) {
  if (process.env.FAKE_TTS === '1') {
    const detik = Math.max(8, teks.split(/\s+/).length / 2.3);
    const rate = 24000, n = Math.round(detik * rate), pcm = Buffer.alloc(n * 2);
    for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 440) * 3000 * ((i % rate) < rate * 0.05 ? 1 : 0)), i * 2);
    return { wav: bungkusWav(pcm, rate), model: 'FAKE_TTS' };
  }
  const key = bacaKey();
  const catatan = [];
  for (const model of MODEL_TTS) {
    for (const fn of [ttsInteractions, ttsGenerateContent]) {
      const h = await fn(key, model, teks);
      if (h.data) {
        let buf = Buffer.from(h.data, 'base64');
        if (buf.toString('ascii', 0, 4) !== 'RIFF') {
          const m = /rate=(\d+)/.exec(h.mime || ''); buf = bungkusWav(buf, m ? +m[1] : 24000);
        }
        return { wav: buf, model: `${model} (${fn.name})` };
      }
      catatan.push(`${model}/${fn.name}: ${h.status} ${h.err}`);
      if (h.status === 429) break;           // kuota model ini habis → coba model berikutnya
    }
  }
  gagal('TTS gagal di semua model: ' + catatan.join(' | ').replace(/\s+/g, ' '));
}

/* ---------- utama ---------- */
const crypto = require('crypto');
const { selaraskan } = require('./selaras');

function pilihMusik() {
  const dir = path.join(REMOTION, 'public', 'musik');
  let f = [];
  try { f = fs.readdirSync(dir).filter((x) => /\.(wav|mp3|m4a|ogg)$/i.test(x)); } catch {}
  if (!f.length) return undefined;
  return 'musik/' + f[Math.floor(Math.random() * f.length)];
}

(async () => {
  const masuk = process.argv[2];
  if (!masuk || !fs.existsSync(masuk)) gagal('Pakai: node produksi.js <file-konten.json>');
  const konten = JSON.parse(fs.readFileSync(masuk, 'utf8'));
  const id = String(konten.id || path.basename(masuk, '.json')).replace(/[^a-z0-9-]/gi, '-');
  const teks = konten?.naskah?.voiceover_lengkap;
  if (!teks || !Array.isArray(konten.adegan) || !konten.adegan.length) gagal('JSON tidak punya naskah/adegan');

  fs.mkdirSync(HASIL, { recursive: true });
  const dirAudio = path.join(REMOTION, 'public', 'audio');
  fs.mkdirSync(dirAudio, { recursive: true });

  // sound effect + backsound dibuat sekali kalau belum ada
  const ba = spawnSync(process.execPath, [path.join(__dirname, 'buat-audio.js')], { stdio: ['ignore', 'ignore', 'inherit'] });
  if (ba.status !== 0) log('peringatan: gagal membuat SFX/backsound, lanjut tanpa itu');

  // Suara: pakai ulang kalau naskahnya sama persis (hemat kuota TTS saat render ulang)
  const hash = crypto.createHash('sha1').update(teks).digest('hex').slice(0, 12);
  const fileWav = path.join(HASIL, `${id}.wav`);
  const fileInfo = path.join(HASIL, `${id}.info.json`);
  let wav, model;
  let infoLama = {};
  try { infoLama = JSON.parse(fs.readFileSync(fileInfo, 'utf8')); } catch {}
  if (process.env.TTS_FILE) {
    wav = fs.readFileSync(process.env.TTS_FILE); model = 'file:' + path.basename(process.env.TTS_FILE);
  } else if (fs.existsSync(fileWav) && infoLama.hash_naskah === hash && process.env.TTS_BARU !== '1') {
    wav = fs.readFileSync(fileWav); model = (infoLama.model_tts || '?') + ' (pakai ulang)';
  } else {
    log('TTS…');
    ({ wav, model } = await buatSuara(teks));
  }
  const durSuara = durasiWav(wav);
  if (!(durSuara > 3)) gagal('Audio TTS terlalu pendek / rusak');
  fs.writeFileSync(path.join(dirAudio, `${id}.wav`), wav);
  if (!process.env.TTS_FILE) fs.writeFileSync(fileWav, wav);
  log(`suara ${durSuara.toFixed(1)} dtk dari ${model}`);

  // Selaraskan subtitle & adegan dengan suara asli
  const fps = 30;
  const sel = selaraskan(wav, konten.adegan, fps, 0.8);
  log(`selaras: ${sel.info.frasa} frasa, ${sel.info.jeda} jeda terdeteksi`);
  const adegan = konten.adegan.map((a, i) => ({ ...a, mulai: sel.adegan[i].mulai, selesai: sel.adegan[i].selesai }));
  const props = {
    konten: { ...konten, adegan },
    audio: `audio/${id}.wav`,
    kata: sel.kata,
    amplitudo: sel.amplitudo,
    musik: process.env.TANPA_MUSIK === '1' ? undefined : pilihMusik(),
  };
  const fileProps = path.join(REMOTION, 'out', `props-${id}.json`);
  fs.mkdirSync(path.dirname(fileProps), { recursive: true });
  fs.writeFileSync(fileProps, JSON.stringify(props));

  // QA visual sebelum render penuh: teks tumpang tindih / terpotong / tertutup tombol YouTube → stop di sini
  if (process.env.QA_VISUAL !== '0') {
    log('QA visual…');
    const qa = spawnSync(process.execPath, [path.join(__dirname, 'qa-visual.js'), fileProps, path.join(HASIL, 'qa')], { cwd: REMOTION, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const ringkas = (((qa.stdout || '').match(/QA=(.*)/) || [])[1] || '').trim();
    for (const b of (qa.stderr || '').split('\n')) if (/^\[qa\] (MASALAH|catatan|lolos)/.test(b)) log(b.replace('[qa] ', 'QA: '));
    if (qa.status === 1) gagal(`QA visual: ${ringkas}`);
    if (qa.status !== 0) log(`peringatan: QA visual tidak jalan (${ringkas || 'kode ' + qa.status}), lanjut render`);
  }

  const keluar = path.join(HASIL, `${id}.mp4`);
  log('render…');
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const extra = process.env.BROWSER_EXEC ? [`--browser-executable=${process.env.BROWSER_EXEC}`] : [];
  if (process.env.RENDER_CONCURRENCY) extra.push(`--concurrency=${Math.max(1, Math.min(Number(process.env.RENDER_CONCURRENCY) || 1, os.cpus().length))}`);
  const r = spawnSync(npx, ['remotion', 'render', 'src/index.tsx', 'Short1Hertz', keluar, `--props=${fileProps}`, '--log=error', ...extra], {
    cwd: REMOTION, stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32',
  });
  if (r.status !== 0 || !fs.existsSync(keluar)) gagal(`Render gagal (kode ${r.status})`);

  // Samakan kekerasan suara ke standar Shorts (±-14 LUFS) pakai ffmpeg bawaan Remotion
  const sementara = keluar.replace(/\.mp4$/, '.norm.mp4');
  const nr = spawnSync(npx, ['remotion', 'ffmpeg', '-v', 'error', '-y', '-i', keluar, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', sementara], {
    cwd: REMOTION, stdio: ['ignore', 'inherit', 'inherit'], shell: process.platform === 'win32',
  });
  if (nr.status === 0 && fs.existsSync(sementara)) fs.renameSync(sementara, keluar);
  else log('peringatan: normalisasi volume gagal, pakai audio asli render');

  // File siap posting: semua teks publikasi dalam satu file, tinggal salin ke YouTube/TikTok
  const p = konten.publikasi || {};
  const baris = [
    `PAKET POSTING — ${id}`,
    '',
    '=== YOUTUBE SHORTS (sudah otomatis terisi saat upload privat) ===',
    `Judul      : ${p.judul || ''}`,
    `Deskripsi  : ${p.deskripsi || ''}`,
    `Hashtag    : ${(p.hashtag_youtube || []).join(' ')}`,
    '',
    'Opsi judul lain (kalau mau ganti sebelum publik):',
    ...(p.opsi_judul || []).map((j, i) => `  ${i + 1}. ${j}`),
    '',
    '=== TIKTOK (posting manual dari HP) ===',
    `${p.caption_tiktok || ''}`,
    `${(p.hashtag_tiktok || []).join(' ')}`,
    '',
    `Teks cover : ${p.teks_cover || ''}`,
    '',
    '=== KOMENTAR SEMATAN (pinned comment, YouTube & TikTok) ===',
    `${p.pinned_comment || ''}`,
    '',
  ];
  fs.writeFileSync(path.join(HASIL, `${id}.posting.txt`), '﻿' + baris.join('\r\n'), 'utf8');

  if (!process.env.TTS_FILE) fs.writeFileSync(fileInfo, JSON.stringify({ id, model_tts: model.replace(' (pakai ulang)', ''), hash_naskah: hash, durasi: sel.durasi, musik: props.musik, dibuat: new Date().toISOString() }, null, 2));
  console.log('HASIL=' + keluar);
})().catch((e) => gagal(e.message));
