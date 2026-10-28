// Cek field wajib JSON konten 1Hertz (sama dengan node "Cek field wajib" di n8n).
const KOMPONEN_OK = ['kartu_status', 'kartu_kode', 'x_vs_y', 'kartu_masalah', 'kartu_solusi', 'diagram', 'bukti_asli', 'ilustrasi', 'cta', 'log_serial', 'sinyal', 'garis_waktu', 'lembar'];

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
    if (s.judul !== undefined && !(Array.isArray(s.judul) && s.judul.length === 2 && s.judul.every((x) => typeof x === 'string' && x.length <= 26)))
      err.push(`adegan ${i + 1}: judul harus ["baris 1","baris 2"], tiap baris maks 26 karakter`);
    if (s.hantaman !== undefined && !(typeof s.hantaman === 'string' && s.hantaman.trim().length > 0 && s.hantaman.trim().length <= 10))
      err.push(`adegan ${i + 1}: hantaman harus 1 kata, maks 10 karakter`);
  });
  const nHantaman = a.filter((s) => s.hantaman).length;
  req(nHantaman <= 3, `hantaman ${nHantaman} kali (maks 3 per video)`);
  const p = d.publikasi || {};
  req(typeof p.judul === 'string' && p.judul.length > 0 && p.judul.length <= 100, 'publikasi.judul kosong atau > 100 karakter');
  req(typeof p.deskripsi === 'string', 'publikasi.deskripsi tidak ada');
  req(Array.isArray(p.hashtag_youtube) && p.hashtag_youtube.includes('#shorts'), 'hashtag_youtube wajib ada #shorts');

  // Peringatan ritme/hook (28 Okt 2026): TIDAK menolak video, hanya dicatat di log/riwayat.md supaya pola
  // hook dan ritme bisa dibandingkan dengan performa tiap video. Ambangnya hipotesis yang diuji, bukan aturan YouTube.
  const peringatan = [];
  if (a.length) {
    const dur = (s) => (Number(s.selesai) || 0) - (Number(s.mulai) || 0);
    const kata1 = String(a[0].voiceover || '').split(/\s+/).filter(Boolean).length;
    if (dur(a[0]) > 3) peringatan.push(`hook ${dur(a[0]).toFixed(1)} dtk (>3)`);
    if (kata1 > 8) peringatan.push(`hook ${kata1} kata (>8)`);
    const rata = a.reduce((x, s) => x + dur(s), 0) / a.length;
    if (rata > 4.5) peringatan.push(`rata-rata adegan ${rata.toFixed(1)} dtk (>4,5)`);
    const panjang = a.filter((s) => dur(s) > 7).length;
    if (panjang) peringatan.push(`${panjang} adegan >7 dtk`);
    a.forEach((s, i) => { if (i > 0 && s.komponen === a[i - 1].komponen) peringatan.push(`adegan ${i}-${i + 1} komponen sama`); });
    if (!(d.strategi && d.strategi.hook_tipe)) peringatan.push('strategi.hook_tipe kosong');
    if (a[a.length - 1].komponen !== 'cta') peringatan.push('adegan terakhir bukan cta');
  }

  const lanjut = err.length === 0 && d.status === 'siap_produksi' && d.kelayakan.keputusan === 'lanjut';
  const tagar = Array.isArray(p.hashtag_youtube) ? p.hashtag_youtube : [];
  const tags = (Array.isArray(p.tags_youtube) && p.tags_youtube.length ? p.tags_youtube : tagar.map((t) => t.replace(/^#/, '')))
    .map((t) => String(t).replace(/,/g, ' ').trim())
    .filter(Boolean);
  return {
    valid: err.length === 0,
    lanjut,
    error: err,
    peringatan,
    hook: (d.strategi && d.strategi.hook_tipe) || '',
    id: d.id,
    judul: p.judul,
    deskripsi: (p.deskripsi || '') + '\n\n' + tagar.join(' '),
    tags,
  };
}

module.exports = { cek };
