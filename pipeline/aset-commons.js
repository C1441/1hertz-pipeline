// Kumpulkan foto berlisensi bebas dari Wikimedia Commons untuk video panjang.
//   node aset-commons.js <data-panjang.json>
// Untuk tiap item: item.foto.file (nama "File:..." pasti) ATAU item.foto.cari (kata kunci pencarian).
// Hasil:
//   remotion/public/panjang/<kunci>.jpg       foto terpilih (lebar 1600 px)
//   remotion/public/panjang/aset.json         { foto: {kunci: path}, kredit: "..." }
//   Drive aset/mikrokontroler (atau aset/<folder_aset>): foto terpilih + lembar kandidat untuk dicek
// Hanya lisensi bebas (CC0, Public domain, CC BY, CC BY-SA); kreditnya dicatat untuk deskripsi video.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const AKAR = path.resolve(__dirname, '..');
const OUT = path.join(AKAR, 'remotion', 'public', 'panjang');
const FOLDER_ASET = '1WVz9uNojBXOHFfiDKiFbN0rE6KBsT75l';
const UA = '1HertzBot/1.0 (https://github.com/C1441/1hertz-pipeline; konten edukasi)';
const log = (...a) => console.error('[aset]', ...a);
const LISENSI_OK = /(cc0|public domain|cc[ -]by(?![- ]?nc)(?![- ]?nd))/i;

async function api(params) {
  const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', origin: '*', ...params });
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error('commons ' + r.status);
  return r.json();
}
const bersih = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function kandidat(item) {
  const prop = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600' };
  const daftarCari = [].concat(item.foto?.cari || item.nama);
  const wajib = item.foto?.wajib ? new RegExp(item.foto.wajib, 'i') : null;
  let pages = [];
  if (item.foto?.file) {
    const j = await api({ action: 'query', titles: item.foto.file, ...prop });
    pages = Object.values(j.query?.pages || {});
  } else {
    for (const q of daftarCari) {
      const j = await api({ action: 'query', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '20', ...prop });
      pages.push(...Object.values(j.query?.pages || {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0)));
    }
  }
  const lihat = new Set();
  pages = pages.filter((p) => !lihat.has(p.title) && lihat.add(p.title) && (!wajib || wajib.test(p.title)));
  return pages.map((p) => {
    const ii = p.imageinfo?.[0] || {};
    const m = ii.extmetadata || {};
    return {
      judul: p.title, url: ii.thumburl || ii.url, w: ii.width, h: ii.height, mime: ii.mime,
      lisensi: bersih(m.LicenseShortName?.value), pembuat: bersih(m.Artist?.value).slice(0, 80), halaman: ii.descriptionurl,
    };
  }).filter((k) => /jpeg|png/.test(k.mime || '') && k.w >= 700 && LISENSI_OK.test(k.lisensi));
}

async function unduh(url, file) {
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error('unduh ' + r.status);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

/* ---------- Drive ---------- */
async function aksesToken() {
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const j = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })).json();
  return j.access_token;
}
async function folder(token, induk, nama) {
  const q = encodeURIComponent(`'${induk}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${nama}'`);
  const f = ((await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, { headers: { Authorization: `Bearer ${token}` } })).json()).files || [])[0];
  if (f) return f.id;
  const r = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nama, parents: [induk], mimeType: 'application/vnd.google-apps.folder' }) });
  return (await r.json()).id;
}
async function unggah(token, nama, induk, mime, isi, keterangan) {
  const b = 'b' + Date.now();
  const meta = { name: nama, parents: [induk], ...(keterangan ? { description: keterangan } : {}) };
  const body = Buffer.concat([Buffer.from(`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`), isi, Buffer.from(`\r\n--${b}--`)]);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${b}` }, body });
  return (await r.json()).id;
}

(async () => {
  const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aset-'));
  const hasil = { foto: {}, kredit: '', pilihan: {} };
  const kredit = [];
  const lembar = [];
  for (const it of data.item) {
    let ks = [];
    try { ks = await kandidat(it); } catch (e) { log(it.kunci, 'cari gagal:', e.message); }
    log(`${it.kunci}: ${ks.length} kandidat (${ks.slice(0, 4).map((k) => k.judul).join(' | ')})`);
    // lembar kandidat (maks 4) untuk dicek manusia/Claude
    const n = Math.min(4, ks.length);
    for (let i = 0; i < n; i++) {
      const f = path.join(tmp, `${it.kunci}-${i}.jpg`);
      try {
        await unduh(ks[i].url, f);
        spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', f, '-vf', `scale=300:200:force_original_aspect_ratio=decrease,pad=300:200:(ow-iw)/2:(oh-ih)/2:white,drawtext=text='${it.kunci} ${i}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.7`, f + '.k.jpg']);
        if (fs.existsSync(f + '.k.jpg')) lembar.push(f + '.k.jpg');
      } catch (e) { log('unduh kandidat gagal', e.message); }
    }
    const pilih = ks[Number(it.foto?.pilih ?? 0)];
    if (!pilih) { log(`${it.kunci}: tidak ada foto berlisensi bebas → pakai gambar pengganti`); continue; }
    const tujuan = path.join(OUT, `${it.kunci}.jpg`);
    const cand = path.join(tmp, `${it.kunci}-${Number(it.foto?.pilih ?? 0)}.jpg`);
    if (fs.existsSync(cand)) fs.copyFileSync(cand, tujuan); else await unduh(pilih.url, tujuan);
    hasil.foto[it.kunci] = `panjang/${it.kunci}.jpg`;
    hasil.pilihan[it.kunci] = pilih;
    kredit.push(`${it.nama}: foto "${pilih.judul.replace(/^File:/, '')}" oleh ${pilih.pembuat || 'tidak diketahui'}, ${pilih.lisensi}, via Wikimedia Commons`);
  }
  hasil.kredit = kredit.join('\n');
  fs.writeFileSync(path.join(OUT, 'aset.json'), JSON.stringify(hasil, null, 2));
  console.log(hasil.kredit);

  // simpan ke Drive (arsip aset + lembar kandidat)
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      const token = await aksesToken();
      const fd = await folder(token, FOLDER_ASET, data.folder_aset || 'mikrokontroler');
      for (const [k, p] of Object.entries(hasil.foto)) {
        const pil = hasil.pilihan[k];
        await unggah(token, `${k}.jpg`, fd, 'image/jpeg', fs.readFileSync(path.join(AKAR, 'remotion', 'public', p)), `${pil.judul} · ${pil.lisensi} · ${pil.pembuat} · ${pil.halaman}`);
      }
      await unggah(token, 'kredit-foto.txt', fd, 'text/plain', Buffer.from(hasil.kredit + '\n'));
      if (lembar.length) {
        const sheet = path.join(tmp, 'kandidat.jpg');
        const kolom = 4, baris = Math.ceil(lembar.length / kolom);
        const layout = lembar.map((_, i) => `${(i % kolom) * 300}_${Math.floor(i / kolom) * 200}`).join('|');
        spawnSync('ffmpeg', ['-v', 'error', '-y', ...lembar.flatMap((f) => ['-i', f]), '-filter_complex', lembar.length > 1 ? `xstack=inputs=${lembar.length}:layout=${layout}:fill=black` : 'null', '-frames:v', '1', '-q:v', '6', sheet]);
        if (fs.existsSync(sheet)) {
          const id = await unggah(token, `kandidat-foto-${data.id}.jpg`, fd, 'image/jpeg', fs.readFileSync(sheet));
          if (process.env.GITHUB_ACTIONS) console.log(`::notice title=Aset foto::${Object.keys(hasil.foto).length}/${data.item.length} foto · lembar kandidat ${id} (${baris} baris)`);
        }
      }
    } catch (e) { log('simpan Drive gagal:', e.message); }
  }
})().catch((e) => { console.error('[aset] ERROR:', e.message); process.exit(1); });
