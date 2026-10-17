# Gaya visual 1Hertz (template aktif sejak 16 Okt 2026)

Template `Short1Hertz` (src/Short1Hertz.tsx) mengikuti **Guidebook Motion Graphics 1Hertz** (dokumen di claude.ai).

- `pustaka.tsx` — token warna/huruf, kerangka dasar, ikon, jendela, papan Wokwi.
- `gb.tsx` — kerangka video (judul bab kinetik, HUD, subtitle), hantaman, grain, SFX.
- `transisi.tsx` — 9 transisi: zoom mundur, glitch, hantaman, sapuan, runtuh ke titik, zoom tembus, tampar, balik 3D, iris.
- `Adegan.tsx` — adegan per `komponen` JSON: log_serial, kartu_kode, kartu_status, x_vs_y (lembar terang), diagram, kartu_masalah, kartu_solusi, bukti_asli/ilustrasi, cta, **sinyal**, **garis_waktu**, **lembar**.

Field JSON opsional baru per adegan: `judul` (["baris 1","baris 2"]), `warna_judul` (merah/amber/cyan/hijau), `hantaman` (1 kata, maks 3 per video). JSON lama tetap jalan.

## Aturan yang dijaga template (17 Okt 2026)
- **Hantaman tidak boleh mendahului narasi.** Kata tanya jembatan (`CARANYA?`, `KENAPA?`, …) tampil di awal adegan yang menjawabnya. Kata biasa hanya tampil kalau diucapkan di 40% awal adegan, tepat saat diucapkan. Selain itu diganti kata tanya dari kata pembuka voiceover adegan ("Caranya, …" → `CARANYA?`) atau dibuang.
- **Tanpa pita hitam di bawah.** Subtitle melayang di atas latar titik-titik (y 1460), lebar 800 px di tengah.
- **Zona aman YouTube Shorts** (`ukur.ts`): kolom tombol kanan x ≥ 945 pada y 1050–1720, judul/nama channel y ≥ 1720. Teks penting tidak boleh di sana.
- **Teks diukur, bukan ditebak** (`ukur.ts`, `@remotion/layout-utils`): judul bab, kepala lembar, nilai lembar, kolom x_vs_y, diagram, kartu, CTA mengecil otomatis supaya muat. Kalau tetap tidak muat, teks dipotong dan **dicatat**.
- **QA visual** (`qa.tsx` + `pipeline/qa-visual.js`): sebelum render penuh, 1 gambar per adegan + tiap hantaman diperiksa: teks tumpang tindih, terpotong di tepi, tertutup tombol YouTube, atau kepanjangan (terpotong). Ada masalah → produksi berhenti, JSON masuk folder `gagal` dengan alasannya. Elemen hiasan ditandai `data-qa="hias"`, layar penutup penuh `data-qa-penutup`.

Transisi antar-adegan dirotasi otomatis per video (dari `id`), sesuai aturan anti-template.

Arsip:
- `src/aset/template-lama/` — template sebelum 16 Okt 2026 (komposisi `Short1HertzLama`).
- `src/aset/prototipe/` — prototipe yang dipakai menyusun guidebook.

Contoh JSON: `src/contoh-konten-baud.json` (fitur baru), `src/contoh-konten.json` (format lama).
