// Unduh satu file Drive (mis. mp4 hasil render) ke disk — dipakai untuk mengunggah ulang video tanpa render/TTS.
//   node unduh-drive.js <fileId> <tujuan>
const fs = require('fs');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
(async () => {
  const [id, tujuan] = process.argv.slice(2);
  if (!id || !tujuan) throw new Error('Pakai: node unduh-drive.js <fileId> <tujuan>');
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const token = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })).json()).access_token;
  if (!token) throw new Error('akses Google gagal');
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`unduh ${r.status} ${(await r.text()).slice(0, 200)}`);
  await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tujuan));
  console.error(`[unduh] ${tujuan}: ${(fs.statSync(tujuan).size / 1e6).toFixed(1)} MB`);
})().catch((e) => { console.error('[unduh] ERROR:', e.message); process.exit(1); });
