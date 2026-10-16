# Gaya visual 1Hertz (template aktif sejak 16 Okt 2026)

Template `Short1Hertz` (src/Short1Hertz.tsx) mengikuti **Guidebook Motion Graphics 1Hertz** (dokumen di claude.ai).

- `pustaka.tsx` — token warna/huruf, kerangka dasar, ikon, jendela, papan Wokwi.
- `gb.tsx` — kerangka video (judul bab kinetik, HUD, subtitle), hantaman, grain, SFX.
- `transisi.tsx` — 9 transisi: zoom mundur, glitch, hantaman, sapuan, runtuh ke titik, zoom tembus, tampar, balik 3D, iris.
- `Adegan.tsx` — adegan per `komponen` JSON: log_serial, kartu_kode, kartu_status, x_vs_y (lembar terang), diagram, kartu_masalah, kartu_solusi, bukti_asli/ilustrasi, cta, **sinyal**, **garis_waktu**, **lembar**.

Field JSON opsional baru per adegan: `judul` (["baris 1","baris 2"]), `warna_judul` (merah/amber/cyan/hijau), `hantaman` (1 kata, maks 3 per video). JSON lama tetap jalan.

Transisi antar-adegan dirotasi otomatis per video (dari `id`), sesuai aturan anti-template.

Arsip:
- `src/aset/template-lama/` — template sebelum 16 Okt 2026 (komposisi `Short1HertzLama`).
- `src/aset/prototipe/` — prototipe yang dipakai menyusun guidebook.

Contoh JSON: `src/contoh-konten-baud.json` (fitur baru), `src/contoh-konten.json` (format lama).
