// Unggah file ke Drive 1Hertz/aset/<subfolder> (resumable, aman untuk video besar).
//   node unggah-drive.js <file> <subfolder> [mime]
const fs = require('fs');
const path = require('path');
const FOLDER_ASET = '1WVz9uNojBXOHFfiDKiFbN0rE6KBsT75l';
(async () => {
  const [file, sub, mime = 'application/octet-stream'] = process.argv.slice(2);
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' });
  const token = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })).json()).access_token;
  const H = { Authorization: `Bearer ${token}` };
  const q = encodeURIComponent(`'${FOLDER_ASET}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${sub}'`);
  let fid = ((await (await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, { headers: H })).json()).files || [])[0]?.id;
  if (!fid) fid = (await (await fetch('https://www.googleapis.com/drive/v3/files?fields=id', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: sub, parents: [FOLDER_ASET], mimeType: 'application/vnd.google-apps.folder' }) })).json()).id;
  const ukuran = fs.statSync(file).size;
  const awal = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(ukuran) }, body: JSON.stringify({ name: path.basename(file), parents: [fid] }) });
  if (!awal.ok) throw new Error('mulai unggah ' + awal.status + ' ' + (await awal.text()).slice(0, 200));
  const r = await fetch(awal.headers.get('location'), { method: 'PUT', headers: { ...H, 'Content-Type': mime, 'Content-Length': String(ukuran) }, body: fs.readFileSync(file) });
  const j = await r.json();
  if (!r.ok) throw new Error('unggah ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
  console.log(j.id);
})().catch((e) => { console.error('[unggah] ERROR:', e.message); process.exit(1); });
