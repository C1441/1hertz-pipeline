// Unggah video panjang ke YouTube sebagai PRIVAT (sama seperti Shorts).
//   node unggah-youtube.js <video.mp4> <data.json> [deskripsi.txt]
// Judul/tag dari data.publikasi; deskripsi dari file deskripsi (bab + kredit foto + sumber).
const fs = require('fs');
(async () => {
  const [video, fileData, fileDesk] = process.argv.slice(2);
  const data = JSON.parse(fs.readFileSync(fileData, 'utf8'));
  const p = data.publikasi || {};
  const desk = fileDesk && fs.existsSync(fileDesk) ? fs.readFileSync(fileDesk, 'utf8') : p.deskripsi || '';
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const tok = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })).json();
  if (!tok.access_token) throw new Error('akses Google gagal: ' + (tok.error || ''));
  const H = { Authorization: `Bearer ${tok.access_token}` };
  const ukuran = fs.statSync(video).size;
  const meta = {
    snippet: { title: String(p.judul || data.judul_video).slice(0, 100), description: desk.slice(0, 4900), tags: (p.tags_youtube || []).slice(0, 15), categoryId: '28', defaultLanguage: 'id', defaultAudioLanguage: 'id' },
    status: { privacyStatus: 'private', selfDeclaredMadeForKids: false },
  };
  const awal = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(ukuran) }, body: JSON.stringify(meta),
  });
  if (!awal.ok) throw new Error(`mulai upload ${awal.status} ${(await awal.text()).slice(0, 300)}`);
  const r = await fetch(awal.headers.get('location'), { method: 'PUT', headers: { ...H, 'Content-Type': 'video/mp4', 'Content-Length': String(ukuran) }, body: fs.readFileSync(video) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) throw new Error(`upload gagal ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  console.log(j.id);
})().catch((e) => { console.error('[youtube] ERROR:', e.message); process.exit(1); });
