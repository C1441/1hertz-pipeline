// Saklar mode Gemini 1Hertz: Google Dokumen "SAKLAR 1Hertz" di folder Drive 1Hertz.
// Isinya baris "MODE GEMINI: HIDUP" atau "MODE GEMINI: MATI". Okta cukup mengganti satu kata itu dari HP.
//
// MATI (default) → Okta masih memakai Claude:
//   - Papan Ide terjadwal (Senin) tidak dibuat oleh Gemini (laporan Analis tetap dibuat; tanpa Gemini)
//   - ide yang dicentang di Papan Ide TIDAK diproduksi
//   - dokumen antrian yang isinya cuma tema TIDAK diproses (dibiarkan menunggu di antrian)
//   - JSON lengkap (dari Claude / template) TETAP diproduksi seperti biasa
// HIDUP → semua jalan otomatis dengan Gemini.
// Tombol "Run workflow" manual pada Papan Ide selalu jalan (itu perintah langsung dari Okta).

const FOLDER_1HERTZ = process.env.FOLDER_1HERTZ || '1TGPc9vIG3RkmLRxHuFM1txgFP4RAT6Ci';
const NAMA = 'SAKLAR 1Hertz';
const URL_DRIVE = 'https://www.googleapis.com/drive/v3';
const RE = /MODE\s*GEMINI\s*:\s*(HIDUP|NYALA|ON|AKTIF|MATI|OFF|NONAKTIF)/i;

const ISI_AWAL = `MODE GEMINI: MATI

Cara pakai: ganti kata MATI di baris pertama menjadi HIDUP (atau sebaliknya). Tidak perlu tombol lain; perubahan terbaca dalam ±5 menit.

HIDUP = mode tanpa Claude. Gemini (key milikmu, gratis) bekerja otomatis:
  • Senin pagi Gemini menyusun Papan Ide 10 ide di folder 1Hertz/ide
  • ide yang kamu centang [x] diproduksi 1 per hari
  • dokumen di folder antrian yang isinya cuma satu kalimat tema langsung ditulis naskahnya oleh Gemini

MATI = kamu masih pakai Claude. Gemini tidak menulis apa pun:
  • Papan Ide Gemini tidak dibuat (Laporan Analis mingguan tetap dibuat; itu tanpa AI)
  • ide yang dicentang tidak diproduksi (centangannya tetap tersimpan, jalan saat HIDUP)
  • dokumen tema di antrian dibiarkan menunggu
  • JSON lengkap dari Claude atau dari template TETAP diproduksi

Catatan: suara video selalu memakai Gemini TTS (gratis) di kedua mode.
`;

let cache = null;

async function modeGemini(token) {
  const paksa = (process.env.MODE_GEMINI || '').toLowerCase();
  if (paksa) return { hidup: ['hidup', 'on', '1', 'nyala'].includes(paksa), sumber: 'env' };
  if (cache) return cache;
  try {
    const q = encodeURIComponent(`'${FOLDER_1HERTZ}' in parents and trashed = false and name = '${NAMA}'`);
    const r = await fetch(`${URL_DRIVE}/files?q=${q}&fields=files(id,name,mimeType)&pageSize=5`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`cari saklar → ${r.status}`);
    const f = ((await r.json()).files || [])[0];
    if (!f) { await buatSaklar(token); return (cache = { hidup: false, sumber: 'baru dibuat (MATI)' }); }
    const url = f.mimeType === 'application/vnd.google-apps.document' ? `${URL_DRIVE}/files/${f.id}/export?mimeType=text/plain` : `${URL_DRIVE}/files/${f.id}?alt=media`;
    const e = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!e.ok) throw new Error(`baca saklar → ${e.status}`);
    const m = RE.exec(await e.text());
    const hidup = !!m && /HIDUP|NYALA|ON|AKTIF/i.test(m[1]) && !/NONAKTIF/i.test(m[1]);
    return (cache = { hidup, sumber: m ? `dokumen (${m[1].toUpperCase()})` : 'dokumen tanpa baris MODE GEMINI → MATI' });
  } catch (err) {
    // gagal baca = anggap MATI (lebih aman: tidak memakai kuota tanpa izin)
    return (cache = { hidup: false, sumber: `gagal dibaca (${err.message}) → MATI` });
  }
}

async function buatSaklar(token) {
  const batas = 'saklar' + Date.now();
  const meta = { name: NAMA, parents: [FOLDER_1HERTZ], mimeType: 'application/vnd.google-apps.document' };
  const body = `--${batas}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${batas}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${ISI_AWAL}\r\n--${batas}--`;
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${batas}` }, body,
  });
  if (!r.ok) throw new Error(`buat saklar → ${r.status}`);
}

module.exports = { modeGemini, NAMA, ISI_AWAL };
