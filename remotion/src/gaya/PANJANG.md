# Template Video Panjang 1Hertz (16:9) — panduan untuk tim kreatif

Status: **disetujui Okta 18 Okt 2026** (versi v2). Prototipe pertama: "6 Mikrokontroler dari yang Paling Kecil sampai Paling Besar" (4:37, belum dipublikasikan).

## 1. Prinsip editor (wajib dipegang)
Penonton betah kalau **(1) isinya menghibur dan penting** dan **(2) visualnya nggak membosankan**. Berperan sebagai editor & konten kreator senior:
- **Tiap kalimat narasi punya gambar yang menjelaskannya.** Tidak boleh ada layar kosong saat narasi jalan (kesalahan prototipe v1: detik 0–11 kosong).
- **Visual berganti/bergerak tiap 1,5–3 detik**: ketukan baru, kartu masuk, angka menghitung, sorotan pindah.
- **Hook 10 detik pertama** = kontras/angka mengejutkan yang divisualkan (contoh: 512 B vs 1 MB → ×2.048).
- Tiap bab punya **kejutan kecil**: fakta unik, hantaman kata (maks 1 per 2 bab), atau perbandingan lucu.
- Naskah santai, ada humor ringan, tapi fakta wajib diverifikasi (pisahkan [FAKTA]/[ASUMSI], jangan mengarang).
- Satu template = katalog modular, tapi **jangan monoton**: transisi dirotasi otomatis, isi tiap bab harus punya sudut berbeda.

## 2. Format: katalog "naik tangga"
Topik berupa daftar 4–8 item yang bisa diurutkan (kecil→besar, murah→mahal, lambat→cepat). Contoh: mikrokontroler, sensor, motor, modul komunikasi, catu daya.

Alur video:
1. **Pembuka (±25–30 dtk)** — ilustrasi mengikuti narasi (otak proyek → beda ukuran → kontras angka → tangga → agenda 4 hal).
2. **Menu tangga (1,8 dtk)** sebelum tiap item: tangga 6 anak tangga, item aktif menyala, yang sudah dibahas hijau ✓, kamera menyelam ke item.
3. **Tiap item, 4 adegan:** kenalan (foto + nama + angka utama) → spesifikasi (LEMBAR terang, baris disorot) → kegunaan (3 kartu ikon bergerak) → kelebihan/kelemahan (2 kolom ✓/✕).
4. **Perbandingan** — grafik batang skala logaritma + label rekomendasi muncul saat narasi menyebut item.
5. **CTA** — pertanyaan komentar + SUBSCRIBE.

Tampilan = gaya Shorts 1Hertz (latar titik gelap, pil tag cyan, judul 2 baris kinetik, HUD, hantaman, grain); 16:9 1920×1080; tangga kecil di bawah sebagai penanda posisi; subtitle di atasnya.

## 3. Data yang harus disiapkan tim (1 file JSON)
Contoh lengkap: `remotion/src/contoh-panjang-mikrokontroler.json` di repo C1441/1hertz-pipeline.
```
{
  "versi_skema": "panjang-1.0", "id": "YYYY-MM-DD-slug", "judul_video": "...", "tag": "1HERTZ · TOPIK",
  "item": [ {
    "kunci": "esp32", "nama": "ESP32", "chip": "Espressif ESP32", "kelas": "32-bit Xtensa",
    "foto": { "cari": "ESP32 development board", "pilih": 0 }      // atau {"ilustrasi": true} + "kaki": 8
    "ram": 520, "ram_label": "520 KB",                               // angka utama untuk tangga & grafik
    "spek": [ {"label":"Clock","nilai":"240","satuan":"MHz"}, ... ], // maks 5 baris; angka desimal boleh ("4.2")
    "guna": [ {"teks":"Smart home","ikon":"rumah"}, ... ],           // 3 kartu
    "plus": ["..",".."], "minus": ["..",".."],
    "hantaman": {"segmen":"spek","kata":"32-BIT."},                  // opsional
    "vo": { "kenalan":"..", "spek":"..", "guna":"..", "plusmin":".." }
  } ],
  "vo": { "intro":"..", "banding":"..", "cta":".." },
  "publikasi": { "judul":"..", "deskripsi":"..", "tags_youtube":[..] },
  "sumber": [ {"judul":"..","url":".."} ]
}
```
Ikon kegunaan yang tersedia: led, sensor, baterai, kode, robot, ukur, printer3d, panel, python, keyboard, protokol, rumah, cloud, server, audio, synth, kilat. Ikon baru → minta dibuatkan dulu.

Panjang naskah: ±140 kata/menit. Target 8–10 menit → ±1.100–1.400 kata (prototipe 594 kata = 4:37).

Catatan pembuka: ilustrasi pembuka saat ini khusus tema mikrokontroler (otak proyek, ×2.048, tangga, agenda). **Tema lain butuh ilustrasi pembuka baru** — tim kreatif tulis dulu narasi pembuka + ide visual per kalimat, lalu dibuatkan.

## 4. Aset & hak cipta
- Foto diambil otomatis dari **Wikimedia Commons, hanya lisensi bebas** (CC0, Public domain, CC BY, CC BY-SA); kredit otomatis masuk deskripsi. Disimpan juga di Drive `aset/<folder>`.
- Lembar kandidat foto dibuat untuk dicek; kalau salah foto, ganti `pilih` atau pakai `wajib` (filter judul). Kalau tidak ada foto yang benar → `"ilustrasi": true` (gambar chip buatan sendiri).
- Dilarang: foto stok sembarangan, meme/klip film/streamer (risiko klaim & "reused content" YPP).

## 5. Cara produksi
1. Simpan JSON di repo (atau minta Claude menyimpannya).
2. GitHub → Actions → **"Video panjang (prototipe 16:9)"** → Run workflow (isi path JSON). Centang `hanya_aset` dulu untuk cek foto.
3. Hasil masuk Drive `aset/prototipe`: mp4, deskripsi (bab + kredit + sumber), suara .wav, props.
4. QA: jalankan workflow **"Analisis video referensi"** dengan ID mp4 → Gemini menonton + lembar gambar.
5. Setelah render, video **otomatis diunggah ke YouTube sebagai PRIVAT** (judul, tag, deskripsi berisi bab + kredit + sumber terisi otomatis). Okta tonton → revisi bila perlu → ubah ke Publik di YouTube Studio. Matikan centang `unggah_youtube` kalau cuma mau uji.

Waktu render ±25–35 menit di GitHub. Suara: Gemini TTS per bab (8 panggilan untuk 6 item).

## 6. Riwayat keputusan
- 18 Okt: konsep dari referensi katalog (video WhatsApp di aset), tema mikrokontroler, 16:9.
- 18 Okt: revisi Okta → pembuka diisi ilustrasi, agenda dibuat menarik, kartu kegunaan bergambar, transisi & motion ditingkatkan → **v2 di-ACC**.
- Belum: naskah versi "menghibur" (humor + hook per bab), upload pertama.
