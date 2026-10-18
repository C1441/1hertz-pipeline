// Produksi VIDEO PANJANG 1Hertz (16:9) dari data katalog (versi_skema "panjang-1.0").
//   node produksi-panjang.js <data.json>
// Langkah: TTS Gemini per bab (intro, tiap item, perbandingan, CTA) → selaraskan tiap segmen
// → gabung jadi satu suara dengan jeda menu → render Remotion "Panjang1Hertz" → normalisasi suara.
// Foto & kredit dibaca dari remotion/public/panjang/aset.json (hasil aset-commons.js) kalau ada.
// Hasil: hasil/<id>.mp4 + hasil/<id>.deskripsi.txt ; baris "HASIL=<path>" di stdout.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { buatSuara, bungkusWav } = require('./produksi');
const { selaraskan } = require('./selaras');

const AKAR = path.resolve(__dirname, '..');
const REMOTION = path.join(AKAR, 'remotion');
const HASIL = path.join(AKAR, 'hasil');
const JEDA_MENU = 1.8;
const JEDA_BAB = 0.35;
const log = (...a) => console.error('[panjang]', ...a);
const gagal = (m) => { console.error('GAGAL=' + m); process.exit(1); };

function pcmDari(wav) {
  // cari chunk "data" (WAV 16-bit mono dari TTS)
  let i = 12;
  let rate = 24000;
  while (i < wav.length - 8) {
    const id = wav.toString('ascii', i, i + 4);
    const n = wav.readUInt32LE(i + 4);
    if (id === 'fmt ') rate = wav.readUInt32LE(i + 12);
    if (id === 'data') return { pcm: wav.subarray(i + 8, i + 8 + n), rate };
    i += 8 + n + (n % 2);
  }
  throw new Error('WAV tanpa chunk data');
}

(async () => {
  const masuk = process.argv[2];
  if (!masuk || !fs.existsSync(masuk)) gagal('Pakai: node produksi-panjang.js <data.json>');
  const data = JSON.parse(fs.readFileSync(masuk, 'utf8'));
  const id = String(data.id).replace(/[^a-z0-9-]/gi, '-');
  fs.mkdirSync(HASIL, { recursive: true });

  // bab = satu panggilan TTS; segmen = bagian visual di dalam bab
  const bab = [{ segmen: [{ jenis: 'intro', vo: data.vo.intro }] }];
  data.item.forEach((it, i) => bab.push({ menuSebelum: i, segmen: ['kenalan', 'spek', 'guna', 'plusmin'].map((j) => ({ jenis: j, item: i, vo: it.vo[j] })) }));
  bab.push({ segmen: [{ jenis: 'banding', vo: data.vo.banding }, { jenis: 'cta', vo: data.vo.cta }] });

  const ba = spawnSync(process.execPath, [path.join(__dirname, 'buat-audio.js')], { stdio: ['ignore', 'ignore', 'inherit'] });
  if (ba.status !== 0) log('peringatan: SFX/backsound gagal dibuat');

  const potongan = [];
  const segmen = [];
  const kata = [];
  let rate = 24000;
  let t = 0;
  const diam = (detik) => Buffer.alloc(Math.round(detik * rate) * 2);
  for (let bi = 0; bi < bab.length; bi++) {
    const b = bab[bi];
    if (b.menuSebelum != null) {
      segmen.push({ jenis: 'menu', item: b.menuSebelum, mulai: +t.toFixed(3), selesai: +(t + JEDA_MENU).toFixed(3), vo: '' });
      potongan.push(diam(JEDA_MENU));
      t += JEDA_MENU;
    }
    const teks = b.segmen.map((s) => s.vo).join(' ');
    let wav, model;
    for (let coba = 1; coba <= 3; coba++) {
      try { ({ wav, model } = await buatSuara(teks)); break; } catch (e) { log(`TTS bab ${bi} gagal (${coba}/3):`, e.message); if (coba === 3) gagal('TTS gagal: ' + e.message); await new Promise((ok) => setTimeout(ok, 20000 * coba)); }
    }
    const p = pcmDari(wav);
    rate = p.rate;
    const sel = selaraskan(bungkusWav(p.pcm, rate), b.segmen.map((s) => ({ voiceover: s.vo })), 30, 0);
    const durBab = p.pcm.length / 2 / rate;
    log(`bab ${bi}: ${durBab.toFixed(1)} dtk (${model})`);
    b.segmen.forEach((s, si) => {
      const w = sel.adegan[si];
      const akhir = si === b.segmen.length - 1 ? durBab + JEDA_BAB : w.selesai;
      segmen.push({ ...s, mulai: +(t + w.mulai).toFixed(3), selesai: +(t + akhir).toFixed(3) });
    });
    sel.kata.forEach((k) => kata.push({ teks: k.teks, mulai: +(t + k.mulai).toFixed(3), selesai: +(t + k.selesai).toFixed(3) }));
    potongan.push(p.pcm, diam(JEDA_BAB));
    t += durBab + JEDA_BAB;
  }
  // ekor CTA
  potongan.push(diam(1.5));
  segmen[segmen.length - 1].selesai = +(t + 1.5).toFixed(3);
  t += 1.5;
  // segmen harus nyambung
  for (let i = 1; i < segmen.length; i++) segmen[i - 1].selesai = segmen[i].mulai;

  const wavTotal = bungkusWav(Buffer.concat(potongan), rate);
  const dirAudio = path.join(REMOTION, 'public', 'audio');
  fs.mkdirSync(dirAudio, { recursive: true });
  fs.writeFileSync(path.join(dirAudio, `${id}.wav`), wavTotal);
  log(`suara total ${(t / 60).toFixed(2)} menit`);

  let aset = { foto: {}, kredit: '' };
  try { aset = JSON.parse(fs.readFileSync(path.join(REMOTION, 'public', 'panjang', 'aset.json'), 'utf8')); } catch {}
  const props = { data, segmen, audio: `audio/${id}.wav`, kata, foto: aset.foto, kredit: aset.kredit, total: t };
  const fileProps = path.join(REMOTION, 'out', `props-${id}.json`);
  fs.mkdirSync(path.dirname(fileProps), { recursive: true });
  fs.writeFileSync(fileProps, JSON.stringify(props));
  if (process.env.TANPA_RENDER === '1') { console.log('PROPS=' + fileProps); return; }

  const keluar = path.join(HASIL, `${id}.mp4`);
  const extra = process.env.BROWSER_EXEC ? [`--browser-executable=${process.env.BROWSER_EXEC}`] : [];
  extra.push(`--concurrency=${Math.max(1, Math.min(Number(process.env.RENDER_CONCURRENCY) || 2, os.cpus().length))}`);
  log('render…');
  const r = spawnSync('npx', ['remotion', 'render', 'src/index.tsx', 'Panjang1Hertz', keluar, `--props=${fileProps}`, '--log=error', ...extra], { cwd: REMOTION, stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0 || !fs.existsSync(keluar)) gagal('render gagal');
  const sementara = keluar.replace(/\.mp4$/, '.norm.mp4');
  const nr = spawnSync('npx', ['remotion', 'ffmpeg', '-v', 'error', '-y', '-i', keluar, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', sementara], { cwd: REMOTION, stdio: ['ignore', 'inherit', 'inherit'] });
  if (nr.status === 0 && fs.existsSync(sementara)) fs.renameSync(sementara, keluar);

  // deskripsi YouTube dengan bab (chapters) + kredit foto + sumber
  const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
  const bab2 = [`0:00 Pembuka`, ...segmen.filter((s) => s.jenis === 'kenalan').map((s) => `${mmss(s.mulai)} ${data.item[s.item].nama}`), `${mmss(segmen.find((s) => s.jenis === 'banding').mulai)} Perbandingan`];
  const desk = [data.publikasi?.deskripsi || '', '', ...bab2, '', 'Kredit foto:', aset.kredit || '(gambar ilustrasi)', '', 'Sumber data:', ...(data.sumber || []).map((s) => `${s.judul}: ${s.url}`)].join('\n');
  fs.writeFileSync(path.join(HASIL, `${id}.deskripsi.txt`), desk);
  console.log('HASIL=' + keluar);
})().catch((e) => gagal(e.message));
