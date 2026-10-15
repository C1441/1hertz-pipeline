# 1Hertz — pipeline video otomatis (GitHub Actions)

Tema → skill Claude `konten-1hertz` → JSON di Google Drive `1Hertz/antrian` → **GitHub Actions** (tiap 5 menit) → suara Gemini → render Remotion → upload YouTube **PRIVAT** → JSON pindah ke `1Hertz/selesai` (atau `1Hertz/gagal`).

Tidak butuh laptop. Riwayat produksi tercatat di [`log/riwayat.md`](log/riwayat.md).

## Isi repo
| Path | Fungsi |
|---|---|
| `.github/workflows/produksi.yml` | Jadwal tiap 5 menit + tombol manual "Run workflow" |
| `pipeline/gh-runner.js` | Cek antrian Drive, jalankan produksi, upload YouTube, pindahkan JSON |
| `pipeline/produksi.js` | TTS Gemini → sinkron subtitle → render Remotion → normalisasi volume |
| `pipeline/selaras.js` | Menyelaraskan subtitle & adegan dengan suara |
| `pipeline/validasi.js` | Cek field wajib JSON |
| `pipeline/buat-audio.js` | Membuat SFX & backsound (bebas hak cipta) |
| `remotion/` | Template video Short1Hertz |

## Secrets yang dibutuhkan (Settings → Secrets and variables → Actions)
| Nama | Isi |
|---|---|
| `GOOGLE_CLIENT_ID` | Client ID OAuth project Google Cloud `hertz-pipeline` |
| `GOOGLE_CLIENT_SECRET` | Client secret dari client yang sama |
| `GOOGLE_REFRESH_TOKEN` | Refresh token akun channel (scope `youtube.upload` + `drive`) |
| `GEMINI_API_KEY` | API key Gemini dari AI Studio |

Rahasia tidak pernah ditulis ke repo atau dicetak di log.

## Kalau ada masalah
- **Run merah + "invalid_grant"**: refresh token kedaluwarsa/dicabut → buat ulang lewat OAuth Playground, ganti secret `GOOGLE_REFRESH_TOKEN`.
- **JSON masuk folder `gagal`**: alasannya ada di `log/riwayat.md`. Setelah diperbaiki, salin lagi ke `antrian`.
- **Jadwal berhenti sendiri**: GitHub mematikan jadwal repo publik yang 60 hari tanpa aktivitas. Buka tab Actions → workflow → **Enable workflow**.
- **Laptop (n8n) jangan dinyalakan bersamaan** dengan workflow ini, supaya satu JSON tidak diproses dua kali.

## Mode Gemini, revisi, ON AIR (Okt 2026)
- **Saklar**: Google Doc `SAKLAR 1Hertz` di folder 1Hertz. `MODE GEMINI: MATI` (default, kerja dengan Claude) atau `HIDUP` (tanpa Claude).
  MATI → Papan Ide terjadwal, ide centangan, dokumen tema, dan dokumen REVISI menunggu; JSON lengkap tetap diproduksi.
- **Laporan Analis** (tanpa AI) dibuat tiap Senin di folder laporan. Butuh izin `youtube.readonly` + `yt-analytics.readonly` di refresh token, atau secret `YOUTUBE_API_KEY`.
- **Papan Ide 2 tahap**: 20 ide mentah → kritikus memilih 10 + jadwal + strategi; belajar dari centang & "Alasan kalau ditolak".
  Run workflow manual: `penuh` / `analis` / `uji`.
- **ON AIR**: tiap video yang terunggah disalin ke `aset/ON AIR` (`<id> (<idYouTube>).mp4`) + dokumen `— NASKAH` (JSON).
- **Revisi**: (a) Gemini, mode HIDUP: Google Doc di antrian berisi `REVISI <id atau idYouTube>: instruksi`; (b) tanpa AI: salin dokumen NASKAH, edit, pindah ke antrian. Hasilnya video privat baru `<id>-r2`, `-r3`, …; video lama dihapus manual di YouTube Studio.
- Jadwal cron GitHub kenyataannya tiap ±1–5 jam; untuk langsung, Actions → Produksi → Run workflow.
