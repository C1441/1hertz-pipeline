// Cek field wajib JSON konten 1Hertz (sama dengan node "Cek field wajib" di n8n).
const KOMPONEN_OK = ['kartu_status', 'kartu_kode', 'x_vs_y', 'kartu_masalah', 'kartu_solusi', 'diagram', 'bukti_asli', 'ilustrasi', 'cta', 'log_serial'];

function cek(d) {
  const err = [];
  const req = (cond, msg) => { if (!cond) err.push(msg); };
  d = d || {};
  req(d.versi_skema === '1.0', 'versi_skema harus "1.0"');
  req(typeof d.id === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+$/.test(d.id), 'id tidak sesuai format YYYY-MM-DD-slug');
  req(typeof d.tema === 'string' && d.tema.length > 0, 'tema kosong');
  req(['siap_produksi', 'ditolak'].includes(d.status), 'status tidak dikenal');
  req(d.kelayakan && ['lanjut', 'stop'].includes(d.kelayakan.keputusan), 'kelayakan.keputusan tidak ada');
  const n = d.naskah || {};
  req(typeof n.voiceover_lengkap === 'string' && n.voiceover_lengkap.length > 50, 'naskah.voiceover_lengkap kosong/terlalu pendek');
  req(typeof n.durasi_detik === 'number' && n.durasi_detik >= 20 && n.durasi_detik <= 60, 'naskah.durasi_detik di luar 20-60');
  const a = Array.isArray(d.adegan) ? d.adegan : [];
  req(a.length >= 4, 'adegan kurang dari 4');
  a.forEach((s, i) => {
    if (!KOMPONEN_OK.includes(s.komponen)) err.push(`adegan ${i + 1}: komponen "${s.komponen}" tidak dikenal`);
    if (i > 0 && Math.abs(s.mulai - a[i - 1].selesai) > 0.01) err.push(`adegan ${i + 1}: waktu tidak nyambung`);
  });
  const p = d.publikasi || {};
  req(typeof p.judul === 'string' && p.judul.length > 0 && p.judul.length <= 100, 'publikasi.judul kosong atau > 100 karakter');
  req(typeof p.deskripsi === 'string', 'publikasi.deskripsi tidak ada');
  req(Array.isArray(p.hashtag_youtube) && p.hashtag_youtube.includes('#shorts'), 'hashtag_youtube wajib ada #shorts');

  const lanjut = err.length === 0 && d.status === 'siap_produksi' && d.kelayakan.keputusan === 'lanjut';
  const tagar = Array.isArray(p.hashtag_youtube) ? p.hashtag_youtube : [];
  const tags = (Array.isArray(p.tags_youtube) && p.tags_youtube.length ? p.tags_youtube : tagar.map((t) => t.replace(/^#/, '')))
    .map((t) => String(t).replace(/,/g, ' ').trim())
    .filter(Boolean);
  return {
    valid: err.length === 0,
    lanjut,
    error: err,
    id: d.id,
    judul: p.judul,
    deskripsi: (p.deskripsi || '') + '\n\n' + tagar.join(' '),
    tags,
  };
}

module.exports = { cek };
