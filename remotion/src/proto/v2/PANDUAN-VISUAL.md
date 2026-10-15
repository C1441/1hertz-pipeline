# Panduan visual 1Hertz v2 (disetujui Okta, 16 Okt 2026)

## Prinsip
- Gambar dulu, teks pendukung. Tiap bab punya satu visual utama yang memenuhi layar.
- Satu bab = satu jenis visual; jenis visual berganti antar-bab (papan fisik, garis waktu, jendela sistem, penampang, dll.) dengan transisi zoom.
- Papan pembuka muncul lagi di akhir dalam versi "beres" (callback).
- Warna bermakna: merah = masalah, amber = peringatan/perhatian, cyan = proses, hijau = beres.
- Judul bab 2 baris di atas; subtitle 1 frasa utuh di pita bawah, kata kunci amber, tanpa kotak berkedip.
- Durasi mengikuti isi; tiap kondisi gambar ditahan cukup lama untuk dicerna.
- 3 detik pertama: masalahnya terlihat sebagai gambar bergerak, bisa dipahami tanpa suara.

## Aturan realisme (wajib dicek tiap video)
1. **Satu adegan = satu sudut pandang.** Adegan fisik selalu tampak atas meja; semua objek ikut sudut itu.
2. **Ada pijakan.** Objek fisik diletakkan di atas alas meja (`<Meja/>`), tidak melayang.
3. **Ciri khas terlihat.** Laptop = layar terbuka + keyboard + touchpad. Board tergeletak (`tidur`), colokan menghadap kabelnya.
4. **Proporsi masuk akal.** Board boleh diperbesar agar terbaca, tapi tidak sebesar laptop. Detail kecil ditunjukkan dengan lingkaran sorot / adegan zoom.
5. **Cek sebelum kirim:** orientasi, proporsi, ciri khas, sudut pandang.

## Pustaka
- Lapis 1 (bentuk generik): `pustaka.tsx` — Kerangka, Adegan, Meja, Laptop, Board (Wokwi), Kabel + aliran, Jendela (sistem/terminal + diff), Checklist, Ikon, Pill.
- Lapis 2 (objek): board/komponen dari @wokwi/elements (MIT). Objek yang belum ada (ESP32-CAM, Raspberry Pi) dibuat saat topiknya dipilih.
- Visual khusus topik (mis. penampang kabel) dibuat per video hanya bila perlu.

## QA sebelum dikirim ke Okta (wajib)
Kesalahan 16 Okt: posisi chip ditebak dari thumbnail, frame dicek di ukuran kecil, yang dicek hanya tabrakan.
1. **Koordinat objek diambil dari sumber gambar** (file elemen Wokwi / data pin), tidak pernah ditebak dari mata.
2. **Cek di resolusi penuh** (crop area panggung 1080 px) di momen tiap adegan sudah diam, bukan thumbnail.
3. **Daftar cek per adegan:**
   - Sorotan/lingkaran tepat di tengah objek yang ditunjuk; garis penunjuk berawal dari titik yang sama.
   - Keseimbangan: tidak berat sebelah, tidak ada area kosong besar, elemen berpasangan simetris.
   - Margin ≥ 30 px dari tepi alas/layar; tidak ada teks keluar dari kartunya.
   - Label tidak menimpa kabel/objek.
   - Aturan realisme (sudut pandang, pijakan, ciri khas, proporsi).
4. Kalau satu poin gagal: perbaiki dulu, render ulang, cek lagi.
