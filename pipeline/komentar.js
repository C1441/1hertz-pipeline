// Komentar otomatis 1Hertz.
//   node komentar.js kirim   → untuk tiap video di Drive "aset/ON AIR" (30 hari terakhir):
//                               kalau videonya sudah PUBLIK dan komentarnya belum ada,
//                               posting teks `publikasi.pinned_comment` sebagai komentar channel.
//
// Kenapa menunggu publik: video privat/terjadwal tidak bisa dikomentari.
// Pin tetap manual (YouTube API tidak punya fungsi pin): HP → komentar → titik tiga → Sematkan.
//
// Butuh refresh token dengan izin youtube.force-ssl (selain youtube.upload + drive).
// Kalau izinnya belum ada, run tidak merah; cuma muncul peringatan di ringkasan run.
// Video yang sudah dikomentari dicatat di log/komentar.txt supaya tidak dobel.

const fs = require('fs');
const path = require('path');

const AKAR = path.resolve(__dirname, '..');
const FOLDER_ASET = process.env.FOLDER_ASET || '1WVz9uNojBXOHFfiDKiFbN0rE6KBsT75l';
const URL_TOKEN = process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token';
const URL_DRIVE = process.env.GOOGLE_DRIVE_URL || 'https://www.googleapis.com/drive/v3';
const URL_YT = process.env.YOUTUBE_URL || 'https://www.googleapis.com/youtube/v3';
const HARI = Number(process.env.KOMENTAR_HARI || 30);
const CATATAN = path.join(AKAR, 'log', 'komentar.txt');

const log = (...a) => console.log('[komentar]', ...a);
const anotasi = (jenis, m) => { if (process.env.GITHUB_ACTIONS) console.log(`::${jenis} title=Komentar 1Hertz::${String(m).replace(/[\r\n]+/g, ' ').slice(0, 500)}`); };
const wajib = (n) => { const v = (process.env[n] || '').trim(); if (!v) throw new Error(`Secret ${n} belum diisi`); return v; };

class IzinKurang extends Error {}

async function aksesToken() {
  const body = new URLSearchParams({
    client_id: wajib('GOOGLE_CLIENT_ID'),
    client_secret: wajib('GOOGLE_CLIENT_SECRET'),
    refresh_token: wajib('GOOGLE_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });
  const r = await fetch(URL_TOKEN, { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Gagal ambil akses Google (${r.status} ${j.error || ''})`);
  return { token: j.access_token, izin: String(j.scope || '') };
}

async function google(token, url, opsi = {}) {
  const r = await fetch(url, { ...opsi, headers: { Authorization: `Bearer ${token}`, ...(opsi.headers || {}) } });
  if (r.ok) return r.json();
  const teks = await r.text();
  if (r.status === 403 && /insufficient|scope|forbidden/i.test(teks) && url.startsWith(URL_YT)) {
    throw new IzinKurang('refresh token belum punya izin youtube.force-ssl');
  }
  throw new Error(`${opsi.method || 'GET'} ${url.split('?')[0]} → ${r.status} ${teks.slice(0, 300)}`);
}

function sudahTerkirim() {
  try {
    return new Set(fs.readFileSync(CATATAN, 'utf8').split('\n').map((b) => b.split('\t')[0].trim()).filter(Boolean));
  } catch { return new Set(); }
}

function catat(idYt, idKomentar) {
  fs.mkdirSync(path.dirname(CATATAN), { recursive: true });
  const waktu = new Date().toISOString().slice(0, 16).replace('T', ' ');
  fs.appendFileSync(CATATAN, `${idYt}\t${idKomentar}\t${waktu} UTC\n`);
}

function ambilJson(teks) {
  const a = teks.indexOf('{'), b = teks.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  const t = teks.slice(a, b + 1).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(t); } catch { return null; }
}

// Naskah di ON AIR bernama "<id konten> (<idYouTube>) — NASKAH"
async function daftarNaskah(token) {
  const qFolder = encodeURIComponent(`'${FOLDER_ASET}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = 'ON AIR'`);
  const folder = ((await google(token, `${URL_DRIVE}/files?q=${qFolder}&fields=files(id)&pageSize=1`)).files || [])[0];
  if (!folder) return [];
  const sejak = new Date(Date.now() - HARI * 86400e3).toISOString();
  const q = encodeURIComponent(`'${folder.id}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.document' and createdTime > '${sejak}'`);
  const files = (await google(token, `${URL_DRIVE}/files?q=${q}&orderBy=createdTime&fields=files(id,name)&pageSize=100`)).files || [];
  return files
    .map((f) => ({ ...f, idYt: (/\(([\w-]{11})\)\s*[—-]+\s*NASKAH/.exec(f.name) || [])[1] }))
    .filter((f) => f.idYt);
}

async function teksKomentar(token, f) {
  const r = await fetch(`${URL_DRIVE}/files/${f.id}/export?mimeType=text/plain`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`baca naskah ${f.name} gagal (${r.status})`);
  const konten = ambilJson((await r.text()).replace(/\\([_\[\]#*])/g, '$1'));
  return String(konten?.publikasi?.pinned_comment || '').trim();
}

// Pengaman dobel: cek apakah channel sendiri sudah pernah menulis komentar yang sama
async function sudahAdaDiYouTube(token, idYt, idChannel, teks) {
  const j = await google(token, `${URL_YT}/commentThreads?part=snippet&videoId=${idYt}&maxResults=100&order=time&textFormat=plainText`);
  return (j.items || []).some((t) => {
    const s = t.snippet?.topLevelComment?.snippet || {};
    return s.authorChannelId?.value === idChannel && String(s.textOriginal || s.textDisplay || '').trim() === teks;
  });
}

async function kirim() {
  const { token, izin } = await aksesToken();
  if (izin && !/youtube\.force-ssl|auth\/youtube(\s|$)/.test(izin)) throw new IzinKurang('refresh token belum punya izin youtube.force-ssl');
  const terkirim = sudahTerkirim();
  const naskah = (await daftarNaskah(token)).filter((f) => !terkirim.has(f.idYt));
  if (!naskah.length) { log('tidak ada video baru yang perlu dikomentari'); return; }

  const info = {};
  for (let i = 0; i < naskah.length; i += 50) {
    const ids = naskah.slice(i, i + 50).map((f) => f.idYt).join(',');
    const j = await google(token, `${URL_YT}/videos?part=status,snippet&id=${ids}`);
    for (const v of j.items || []) info[v.id] = v;
  }

  let gagal = 0;
  for (const f of naskah) {
    const v = info[f.idYt];
    if (!v) { log(`${f.idYt}: video tidak ditemukan (mungkin sudah dihapus), dilewati`); catat(f.idYt, 'video-hilang'); continue; }
    if (v.status?.privacyStatus !== 'public') { log(`${f.idYt}: masih ${v.status?.privacyStatus}${v.status?.publishAt ? ` (terjadwal ${v.status.publishAt})` : ''}, tunggu publik`); continue; }
    try {
      const teks = await teksKomentar(token, f);
      if (!teks) { log(`${f.idYt}: naskah tidak punya pinned_comment, dilewati`); catat(f.idYt, 'tanpa-teks'); continue; }
      const idChannel = v.snippet?.channelId;
      if (await sudahAdaDiYouTube(token, f.idYt, idChannel, teks)) { log(`${f.idYt}: komentar sudah ada`); catat(f.idYt, 'sudah-ada'); continue; }
      const hasil = await google(token, `${URL_YT}/commentThreads?part=snippet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ snippet: { channelId: idChannel, videoId: f.idYt, topLevelComment: { snippet: { textOriginal: teks } } } }),
      });
      catat(f.idYt, hasil.id || 'terkirim');
      log(`${f.idYt}: komentar terkirim → sematkan di https://studio.youtube.com/video/${f.idYt}/comments`);
      anotasi('notice', `Komentar terkirim di ${v.snippet?.title || f.idYt}. Tinggal disematkan (pin).`);
    } catch (e) {
      if (e instanceof IzinKurang) throw e;
      gagal++; log(`${f.idYt}: gagal → ${e.message}`); anotasi('error', `${f.idYt}: ${e.message}`);
    }
  }
  if (gagal) process.exitCode = 1;
}

if (require.main === module) {
  const mode = process.argv[2];
  (mode === 'kirim' ? kirim() : Promise.reject(new Error('mode: kirim')))
    .catch((e) => {
      if (e instanceof IzinKurang) {
        // bukan error: tunggu Okta memperbarui refresh token
        log(e.message + '. Komentar otomatis dilewati.');
        anotasi('warning', 'Komentar otomatis belum aktif: buat ulang refresh token dengan izin youtube.force-ssl (lihat README).');
        return;
      }
      console.error('[komentar] ERROR:', e.message); anotasi('error', e.message); process.exit(1);
    });
}

module.exports = { kirim, ambilJson };
