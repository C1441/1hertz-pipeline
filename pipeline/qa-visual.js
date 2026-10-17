// QA visual otomatis 1Hertz — dijalankan produksi.js sebelum render penuh.
//   node qa-visual.js <file props.json> [folder simpan gambar]
// Merender satu gambar per adegan (saat semua isi adegan sudah tampil) + tiap layar hantaman,
// lalu memeriksa teks tumpang tindih, terpotong di tepi, atau tertutup tombol/judul YouTube.
// Keluar kode 1 + baris "QA=<alasan>" kalau ada masalah.
// BROWSER_EXEC (opsional) = path Chrome/Chromium headless.

const fs = require('fs');
const path = require('path');

const AKAR = path.resolve(__dirname, '..');
const REMOTION = path.join(AKAR, 'remotion');
const pakai = (m) => require(path.join(REMOTION, 'node_modules', m));
const log = (...a) => console.error('[qa]', ...a);

(async () => {
  const fileProps = process.argv[2];
  const folderGambar = process.argv[3] || path.join(AKAR, 'hasil', 'qa');
  if (!fileProps) throw new Error('pakai: node qa-visual.js <props.json> [folder]');
  const props = { ...JSON.parse(fs.readFileSync(fileProps, 'utf8')), qa: true };
  const adegan = props.konten?.adegan ?? [];
  const id = String(props.konten?.id ?? 'video');
  const fps = 30;
  fs.mkdirSync(folderGambar, { recursive: true });

  const { bundle } = pakai('@remotion/bundler');
  const { selectComposition, renderStill, openBrowser } = pakai('@remotion/renderer');
  log('bundle…');
  const serveUrl = await bundle({ entryPoint: path.join(REMOTION, 'src', 'index.tsx'), publicDir: path.join(REMOTION, 'public'), onProgress: () => {} });
  const browser = await openBrowser('chrome', { browserExecutable: process.env.BROWSER_EXEC || null, logLevel: 'error' });
  const composition = await selectComposition({ serveUrl, id: 'Short1Hertz', inputProps: props, puppeteerInstance: browser, logLevel: 'error' });

  const temuan = [];
  let jadwalHantaman = null;
  const infoLain = new Set();
  const render = async (frame, label) => {
    const f = Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(frame)));
    const hasil = [];
    await renderStill({
      serveUrl,
      composition,
      inputProps: props,
      frame: f,
      output: path.join(folderGambar, `${id}-${String(f).padStart(4, '0')}.jpg`),
      imageFormat: 'jpeg',
      jpegQuality: 70,
      puppeteerInstance: browser,
      logLevel: 'error',
      onBrowserLog: (l) => {
        const teks = String(l.text || '');
        const i = teks.indexOf('QA1HZ ');
        if (i < 0) return;
        try { hasil.push(JSON.parse(teks.slice(i + 6))); } catch {}
      },
    });
    const r = hasil[hasil.length - 1];
    if (!r) { temuan.push(`${label}: pemeriksa tidak jalan`); return; }
    if (r.info?.hantaman && !jadwalHantaman) jadwalHantaman = r.info.hantaman;
    for (const c of r.info?.catatan ?? []) infoLain.add(c);
    for (const m of r.masalah) temuan.push(`${label} (dtk ${(f / fps).toFixed(1)}): ${m}`);
  };

  // 1 gambar per adegan, saat isi sudah tampil penuh dan transisi keluar belum mulai
  for (let i = 0; i < adegan.length; i++) {
    const a = adegan[i];
    const d = a.selesai - a.mulai;
    const t = d > 1.4 ? a.selesai - 0.55 : a.mulai + d / 2;
    await render(t * fps, `adegan ${i + 1} (${a.komponen})`);
  }
  // layar hantaman
  for (const h of jadwalHantaman ?? []) await render((h.a + 0.4) * fps, `hantaman "${h.kata}"`);
  await browser.close({ silent: true }).catch(() => {});

  for (const c of infoLain) log('catatan:', c);
  if (temuan.length) {
    for (const m of temuan) log('MASALAH', m);
    console.log('QA=' + temuan.slice(0, 3).join(' | ') + (temuan.length > 3 ? ` (+${temuan.length - 3} lagi)` : ''));
    process.exit(1);
  }
  log(`lolos: ${adegan.length} adegan + ${(jadwalHantaman ?? []).length} hantaman diperiksa`);
  console.log('QA=lolos');
})().catch((e) => { console.log('QA=pemeriksa gagal jalan: ' + e.message); process.exit(2); });
