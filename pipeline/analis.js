// Analis + Penambang Komentar + Pengintai video outlier 1Hertz (TANPA AI, cuma data).
//   node analis.js laporan   → kumpulkan data, simpan "Laporan Analis YYYY-MM-DD" di Drive 1Hertz/laporan
// Dipakai juga oleh papan-ide.js (datanya masuk ke prompt Gemini).
//
// Akses YouTube dicoba berurutan:
//   1. OAuth (refresh token yang sama dengan upload) — butuh scope youtube.readonly; Analytics butuh yt-analytics.readonly
//   2. API key (YOUTUBE_API_KEY, atau GEMINI_API_KEY kalau project-nya mengaktifkan YouTube Data API v3) — data publik saja
// Kalau semuanya ditolak, laporan tetap dibuat dengan catatan apa yang perlu diaktifkan.

const fs = require('fs');
const path = require('path');

const AKAR = path.resolve(__dirname, '..');
const YT = 'https://www.googleapis.com/youtube/v3';
const YTA = 'https://youtubeanalytics.googleapis.com/v2/reports';
const FOLDER_LAPORAN = process.env.FOLDER_LAPORAN || '1LU87JTaLQfl-2aY0HC4BiDtXkHnK8JEE';
const log = (...a) => console.error('[analis]', ...a);
const tgl = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10); // WIB
const angka = (n) => (n == null ? '-' : Number(n).toLocaleString('id-ID'));

async function aksesToken() {
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error(`Gagal ambil akses Google (${r.status} ${j.error || ''})`);
  return j.access_token;
}

async function minta(url, akses) {
  const u = new URL(url);
  const headers = {};
  if (akses.token) headers.Authorization = `Bearer ${akses.token}`;
  else if (akses.key) u.searchParams.set('key', akses.key);
  try {
    const r = await fetch(u, { headers, signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, status: r.status, alasan: j?.error?.errors?.[0]?.reason || j?.error?.status || '', pesan: String(j?.error?.message || '').slice(0, 160) };
    return { ok: true, j };
  } catch (e) { return { ok: false, status: 0, alasan: 'jaringan', pesan: e.message }; }
}

async function tentukanAkses(token) {
  const catatan = [];
  if (token) {
    const r = await minta(`${YT}/channels?part=statistics,snippet&mine=true`, { token });
    if (r.ok) return { akses: { token }, jenis: 'oauth', channel: r.j.items?.[0], catatan };
    catatan.push(`OAuth ditolak (${r.status} ${r.alasan}) — refresh token belum punya izin youtube.readonly`);
  }
  for (const nama of ['YOUTUBE_API_KEY', 'GEMINI_API_KEY']) {
    const key = (process.env[nama] || '').trim();
    if (!key) continue;
    const r = await minta(`${YT}/videos?part=id&id=jNQXAC9IVRw`, { key });
    if (r.ok) return { akses: { key }, jenis: `api key (${nama})`, channel: null, catatan };
    catatan.push(`${nama} ditolak untuk YouTube (${r.status} ${r.alasan})`);
  }
  return { akses: null, jenis: 'tidak ada', channel: null, catatan };
}

function videoSendiri() {
  try {
    return fs.readFileSync(path.join(AKAR, 'log', 'riwayat.md'), 'utf8').split('\n')
      .filter((b) => b.includes('privat ✅'))
      .map((b) => { const k = b.split('|').map((s) => s.trim()); return { waktu: k[1], file: k[2], id: k[4] }; })
      .filter((v) => /^[\w-]{11}$/.test(v.id || ''));
  } catch { return []; }
}

const potong = (a, n) => { const o = []; for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; };

async function statistikVideo(ids, akses) {
  const out = {};
  for (const grup of potong([...new Set(ids)], 50)) {
    const r = await minta(`${YT}/videos?part=snippet,statistics,status,contentDetails&id=${grup.join(',')}`, akses);
    for (const v of (r.ok && r.j.items) || []) out[v.id] = v;
  }
  return out;
}

async function komentarVideo(id, akses, n = 15) {
  const r = await minta(`${YT}/commentThreads?part=snippet&videoId=${id}&maxResults=${n}&order=relevance&textFormat=plainText`, akses);
  if (!r.ok) return [];
  return (r.j.items || []).map((c) => {
    const s = c.snippet?.topLevelComment?.snippet || {};
    return { teks: String(s.textDisplay || '').replace(/\s+/g, ' ').slice(0, 220), suka: s.likeCount || 0, balasan: c.snippet?.totalReplyCount || 0 };
  }).filter((c) => c.teks);
}

async function analytics(token) {
  const akhir = tgl(Date.now()), awal = tgl(Date.now() - 90 * 86400e3);
  const dasar = `${YTA}?ids=channel==MINE&startDate=${awal}&endDate=${akhir}`;
  const total = await minta(`${dasar}&metrics=views,subscribersGained,subscribersLost,estimatedMinutesWatched`, { token });
  if (!total.ok) return { ok: false, catatan: `Analytics ditolak (${total.status} ${total.alasan}) — butuh izin yt-analytics.readonly` };
  const perVideo = await minta(`${dasar}&metrics=views,averageViewPercentage,averageViewDuration,subscribersGained,likes,shares&dimensions=video&sort=-views&maxResults=50`, { token });
  const kol = (h) => (h?.columnHeaders || []).map((c) => c.name);
  const baris = (h) => (h?.rows || []).map((r) => Object.fromEntries(kol(h).map((k, i) => [k, r[i]])));
  return { ok: true, awal, akhir, total: baris(total.j)[0] || {}, perVideo: perVideo.ok ? baris(perVideo.j) : [] };
}

const CARI = [
  { q: 'esp32', regionCode: 'ID', relevanceLanguage: 'id' },
  { q: 'arduino pemula', regionCode: 'ID', relevanceLanguage: 'id' },
  { q: 'esp32 error fix', relevanceLanguage: 'en' },
  { q: 'arduino esp32 project', relevanceLanguage: 'en' },
];

async function videoOutlier(akses) {
  const sejak = new Date(Date.now() - 30 * 86400e3).toISOString();
  const ids = new Set();
  for (const c of CARI) {
    const p = new URLSearchParams({ part: 'snippet', type: 'video', videoDuration: 'short', order: 'viewCount', publishedAfter: sejak, maxResults: '15', ...c });
    const r = await minta(`${YT}/search?${p}`, akses);
    if (!r.ok) { log(`cari "${c.q}" → ${r.status} ${r.alasan}`); continue; }
    for (const it of r.j.items || []) if (it.id?.videoId) ids.add(it.id.videoId);
  }
  if (!ids.size) return [];
  const stat = await statistikVideo([...ids], akses);
  const kanal = {};
  for (const grup of potong([...new Set(Object.values(stat).map((v) => v.snippet.channelId))], 50)) {
    const r = await minta(`${YT}/channels?part=statistics,snippet&id=${grup.join(',')}`, akses);
    for (const k of (r.ok && r.j.items) || []) kanal[k.id] = k;
  }
  return Object.values(stat).map((v) => {
    const views = Number(v.statistics?.viewCount || 0);
    const k = kanal[v.snippet.channelId];
    const subs = k && !k.statistics?.hiddenSubscriberCount ? Number(k.statistics?.subscriberCount || 0) : null;
    return {
      id: v.id, judul: v.snippet.title, kanal: v.snippet.channelTitle, url: `https://www.youtube.com/shorts/${v.id}`,
      views, subs, rasio: subs ? +(views / Math.max(subs, 1)).toFixed(1) : null,
      komentar: Number(v.statistics?.commentCount || 0), terbit: v.snippet.publishedAt?.slice(0, 10),
    };
  }).filter((v) => v.views >= 5000)
    .sort((a, b) => (b.rasio ?? 0) - (a.rasio ?? 0) || b.views - a.views)
    .slice(0, 15);
}

async function kumpulkanAnalis(token) {
  const hasil = { dibuat: tgl(Date.now()), catatan: [], akses: 'tidak ada', channel: null, video: [], komentarSendiri: [], analytics: null, outlier: [], komentarOutlier: [] };
  const a = await tentukanAkses(token);
  hasil.akses = a.jenis; hasil.catatan.push(...a.catatan);
  if (!a.akses) { hasil.catatan.push('Data YouTube belum bisa dibaca → Analis & video outlier dilewati.'); return hasil; }
  if (a.channel) hasil.channel = { nama: a.channel.snippet?.title, subs: Number(a.channel.statistics?.subscriberCount || 0), views: Number(a.channel.statistics?.viewCount || 0), video: Number(a.channel.statistics?.videoCount || 0) };

  // video sendiri
  const milik = videoSendiri();
  const stat = await statistikVideo(milik.map((v) => v.id), a.akses);
  hasil.video = milik.map((v) => {
    const s = stat[v.id];
    return {
      id: v.id, file: v.file, judul: s?.snippet?.title || v.file,
      status: s?.status?.privacyStatus || (s ? 'public' : 'privat/tidak terlihat'),
      views: s ? Number(s.statistics?.viewCount || 0) : null, suka: s ? Number(s.statistics?.likeCount || 0) : null, komentar: s ? Number(s.statistics?.commentCount || 0) : null,
      terbit: s?.snippet?.publishedAt?.slice(0, 10),
    };
  });
  for (const v of hasil.video.filter((x) => x.komentar > 0).slice(0, 10)) {
    for (const c of await komentarVideo(v.id, a.akses)) hasil.komentarSendiri.push({ video: v.judul, ...c });
  }
  if (a.akses.token) {
    const an = await analytics(a.akses.token);
    if (an.ok) hasil.analytics = an; else hasil.catatan.push(an.catatan);
  }

  // pengintai: video outlier niche 30 hari + komentarnya (bahan Penambang Komentar)
  hasil.outlier = await videoOutlier(a.akses);
  for (const v of hasil.outlier.filter((x) => x.komentar > 0).slice(0, 4)) {
    for (const c of await komentarVideo(v.id, a.akses, 12)) hasil.komentarOutlier.push({ video: v.judul, url: v.url, ...c });
  }
  if (!hasil.outlier.length) hasil.catatan.push('Pencarian video outlier tidak memberi hasil (kuota/akses).');
  return hasil;
}

function teksLaporan(h) {
  const b = [];
  b.push(`LAPORAN ANALIS 1HERTZ — ${h.dibuat}`);
  b.push(`Akses data: ${h.akses}`);
  for (const c of h.catatan) b.push(`! ${c}`);
  b.push('');
  if (h.channel) {
    b.push(`CHANNEL: ${h.channel.nama} · ${angka(h.channel.subs)} subscriber · ${angka(h.channel.views)} views total · ${h.channel.video} video`);
  }
  if (h.analytics) {
    const t = h.analytics.total;
    b.push(`90 hari (${h.analytics.awal} s/d ${h.analytics.akhir}): ${angka(t.views)} views · +${angka(t.subscribersGained)} / -${angka(t.subscribersLost)} subscriber`);
  }
  if (h.channel || h.analytics) {
    const subs = h.channel?.subs, v90 = h.analytics?.total?.views;
    b.push(`Posisi YPP: subscriber ${angka(subs)}/500 (tier bawah) · ${angka(subs)}/1.000 (tier penuh)` + (v90 != null ? ` · views 90 hari ${angka(v90)}/3.000.000 · ${angka(v90)}/10.000.000` : ' · views Shorts 90 hari: perlu izin Analytics'));
    b.push('  (Analytics menghitung semua views; YPP hanya menghitung views Shorts yang valid. Cek angka resminya di YouTube Studio → Penghasilan.)');
  }
  b.push('');
  b.push('VIDEO SENDIRI:');
  const perV = Object.fromEntries((h.analytics?.perVideo || []).map((r) => [r.video, r]));
  for (const v of h.video) {
    const an = perV[v.id];
    b.push(`• ${v.judul} [${v.status}] views ${angka(v.views)} · suka ${angka(v.suka)} · komentar ${angka(v.komentar)}` + (an ? ` · ditonton rata² ${Math.round(an.averageViewPercentage)}% (${an.averageViewDuration} dtk) · +${an.subscribersGained} subs · share ${an.shares}` : '') + ` · https://youtu.be/${v.id}`);
  }
  if (!h.video.length) b.push('  (belum ada)');
  if (h.komentarSendiri.length) {
    b.push(''); b.push('KOMENTAR PENONTON 1HERTZ:');
    for (const c of h.komentarSendiri.slice(0, 30)) b.push(`• [${c.video}] "${c.teks}" (suka ${c.suka})`);
  }
  b.push(''); b.push('VIDEO OUTLIER DI NICHE (Shorts 30 hari, views jauh di atas jumlah subscriber channel-nya):');
  for (const v of h.outlier) b.push(`• ${v.judul} — ${v.kanal} · views ${angka(v.views)} · subs ${angka(v.subs)} · rasio ${v.rasio ?? '-'}× · ${v.url}`);
  if (!h.outlier.length) b.push('  (tidak ada data)');
  if (h.komentarOutlier.length) {
    b.push(''); b.push('KOMENTAR DI VIDEO OUTLIER (bahan Penambang Komentar):');
    for (const c of h.komentarOutlier.slice(0, 40)) b.push(`• [${c.video}] "${c.teks}" (suka ${c.suka}, balasan ${c.balasan})`);
  }
  b.push('');
  b.push('Catatan: swipe rate ("viewed vs swiped away") tidak tersedia lewat API; lihat di YouTube Studio.');
  return b.join('\n');
}

async function simpanLaporan(token, teks) {
  const batas = 'analis' + Date.now();
  const meta = { name: `Laporan Analis ${tgl(Date.now())}`, parents: [FOLDER_LAPORAN], mimeType: 'application/vnd.google-apps.document' };
  const body = `--${batas}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${batas}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${teks}\r\n--${batas}--`;
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${batas}` }, body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`simpan laporan gagal (${r.status})`);
  return j;
}

module.exports = { kumpulkanAnalis, teksLaporan, simpanLaporan, aksesToken };

if (require.main === module) {
  (async () => {
    if (process.argv[2] !== 'laporan') throw new Error('mode: laporan');
    const token = await aksesToken();
    const h = await kumpulkanAnalis(token);
    const doc = await simpanLaporan(token, teksLaporan(h));
    console.log(`LAPORAN=${doc.webViewLink || doc.id} akses=${h.akses} outlier=${h.outlier.length}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::notice title=Laporan Analis::akses ${h.akses}, outlier ${h.outlier.length}, komentar ${h.komentarSendiri.length + h.komentarOutlier.length}${h.catatan.length ? ' — ' + h.catatan.join(' · ').slice(0, 300) : ''}`);
  })().catch((e) => { console.error('[analis] ERROR:', e.message); if (process.env.GITHUB_ACTIONS) console.log(`::error title=Analis::${e.message.slice(0, 400)}`); process.exit(1); });
}
