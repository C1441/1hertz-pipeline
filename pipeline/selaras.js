// Menyelaraskan naskah dengan audio TTS tanpa library tambahan.
// Cara kerja: cari jeda (hening) di WAV, lalu cocokkan jeda itu dengan
// batas frasa di naskah (koma, titik, tanda tanya) memakai dynamic programming.
// Di dalam satu frasa, waktu kata dibagi menurut perkiraan jumlah suku kata.
//
// Hasil: { kata: [{teks, mulai, selesai, adegan, akhirFrasa}], adegan: [{mulai, selesai}],
//          amplitudo: number[] (per frame video, 0..1), durasi }

const FRAME_MS = 10;

/* ---------- baca WAV jadi sampel float ---------- */
function bacaSampel(buf) {
  let rate = 24000, ch = 1, bits = 16, off = -1, len = 0, i = 12;
  while (i + 8 <= buf.length) {
    const id = buf.toString('ascii', i, i + 4);
    const l = buf.readUInt32LE(i + 4);
    if (id === 'fmt ') { ch = buf.readUInt16LE(i + 10); rate = buf.readUInt32LE(i + 12); bits = buf.readUInt16LE(i + 22); }
    if (id === 'data') { off = i + 8; len = Math.min(l, buf.length - off); break; }
    i += 8 + l + (l % 2);
  }
  if (off < 0 || bits !== 16) throw new Error('WAV harus PCM 16-bit');
  const n = Math.floor(len / 2 / ch);
  const s = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    let v = 0;
    for (let c = 0; c < ch; c++) v += buf.readInt16LE(off + (k * ch + c) * 2);
    s[k] = v / ch / 32768;
  }
  return { s, rate };
}

function energiDb(s, rate, ms) {
  const step = Math.round((rate * ms) / 1000);
  const out = [];
  for (let a = 0; a + step <= s.length; a += step) {
    let e = 0;
    for (let k = a; k < a + step; k++) e += s[k] * s[k];
    out.push(10 * Math.log10(e / step + 1e-10));
  }
  return out;
}

const persentil = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };

/* ---------- cari jeda ---------- */
function cariJeda(db) {
  const lantai = persentil(db, 0.1), puncak = persentil(db, 0.95);
  const ambang = Math.max(lantai + 0.3 * (puncak - lantai), puncak - 35);
  const hening = db.map((v) => v < ambang);
  const awal = hening.indexOf(false);
  const akhir = hening.lastIndexOf(false) + 1;
  const jeda = [];
  let k = awal;
  while (k < akhir) {
    if (hening[k]) {
      let j = k; while (j < akhir && hening[j]) j++;
      const dur = (j - k) * FRAME_MS / 1000;
      if (dur >= 0.07) jeda.push({ mulai: k * FRAME_MS / 1000, selesai: j * FRAME_MS / 1000, dur });
      k = j;
    } else k++;
  }
  return { jeda, mulaiBicara: awal * FRAME_MS / 1000, akhirBicara: akhir * FRAME_MS / 1000 };
}

/* ---------- naskah jadi kata & frasa ---------- */
// bobot ucapan kira-kira: jumlah huruf vokal (suku kata); angka diucapkan panjang.
function bobotKata(w) {
  const huruf = w.replace(/[^A-Za-z]/g, '');
  if (huruf.length >= 2 && huruf.length <= 5 && huruf === huruf.toUpperCase()) return huruf.length * 1.1; // singkatan: LED, ESP, GPIO
  const bersih = w.toLowerCase();
  let b = (bersih.match(/[aiueoy]/g) || []).length;
  const digit = (bersih.match(/[0-9]/g) || []).length;
  b += digit * 2.2;
  return Math.max(1, b);
}
const tandaKuat = /[.!?]["')\]]*$/;
const tandaLemah = /[,;:—–]["')\]]*$/;

function pecahNaskah(adegan) {
  const kata = [];
  adegan.forEach((a, ai) => {
    const ws = String(a.voiceover || '').split(/\s+/).filter(Boolean);
    ws.forEach((w, wi) => {
      const akhirAdegan = wi === ws.length - 1;
      const kuat = tandaKuat.test(w) || akhirAdegan;
      const lemah = !kuat && tandaLemah.test(w);
      kata.push({ asli: w, adegan: ai, bobot: bobotKata(w), batas: kuat ? 2 : lemah ? 1 : 0 });
    });
  });
  // frasa = rangkaian kata sampai tanda baca
  const frasa = [];
  let cur = [];
  kata.forEach((k, i) => { cur.push(i); if (k.batas > 0 || i === kata.length - 1) { frasa.push(cur); cur = []; } });
  return { kata, frasa };
}

/* ---------- DP: batas frasa → jeda ---------- */
function cocokkan(frasa, kata, jeda, t0, t1) {
  const M = frasa.length, K = jeda.length;
  const bobotFrasa = frasa.map((f) => f.reduce((s, i) => s + kata[i].bobot, 0) + 0.6);
  const total = bobotFrasa.reduce((a, b) => a + b, 0);
  const cum = [0]; bobotFrasa.forEach((b) => cum.push(cum[cum.length - 1] + b));
  // kecepatan bicara efektif (detik per bobot), jeda panjang dianggap bukan bicara
  const totalJeda = jeda.reduce((s, g) => s + (g.dur > 0.15 ? g.dur : 0), 0);
  const laju = Math.max(0.02, (t1 - t0 - totalJeda * 0.9) / total);
  const kekuatan = (j) => kata[frasa[j - 1][frasa[j - 1].length - 1]].batas; // batas setelah frasa j-1 (1..M-1)

  // simpul: indeks 0 = awal, 1..K = jeda, K+1 = akhir
  const ujungAkhir = (h) => (h === 0 ? t0 : jeda[h - 1].selesai);   // bicara mulai lagi
  const ujungAwal = (k) => (k === K + 1 ? t1 : jeda[k - 1].mulai); // bicara berhenti
  const INF = 1e18;
  const dp = Array.from({ length: M + 1 }, () => new Float64Array(K + 2).fill(INF));
  const asal = Array.from({ length: M + 1 }, () => new Int32Array((K + 2) * 2).fill(-1));
  dp[0][0] = 0;
  for (let j = 1; j <= M; j++) {
    const kMin = j === M ? K + 1 : 1, kMax = j === M ? K + 1 : K;
    for (let k = kMin; k <= kMax; k++) {
      for (let i = 0; i < j; i++) {
        for (let h = 0; h < k; h++) {
          if (dp[i][h] >= INF) continue;
          if (i === 0 && h !== 0) continue;
          const nyata = ujungAwal(k) - ujungAkhir(h);
          if (nyata <= 0.05) continue;
          let jedaDalam = 0, pen = 0;
          for (let g = h + 1; g < k; g++) { jedaDalam += jeda[g - 1].dur; pen += jeda[g - 1].dur > 0.18 ? 1.2 * jeda[g - 1].dur / 0.18 : 0.1; }
          const harap = (cum[j] - cum[i]) * laju + jedaDalam * 0.9;
          const salah = (nyata - harap) / (0.25 + 0.12 * harap);
          for (let b = i + 1; b < j; b++) pen += kekuatan(b) === 2 ? 2.5 : 1.0; // batas frasa tak dapat jeda
          const c = dp[i][h] + salah * salah + pen;
          if (c < dp[j][k]) { dp[j][k] = c; asal[j][k * 2] = i; asal[j][k * 2 + 1] = h; }
        }
      }
    }
  }
  // telusuri balik
  const pasangan = []; // [j, k]
  let j = M, k = K + 1;
  while (j > 0) { pasangan.push([j, k]); const i = asal[j][k * 2], h = asal[j][k * 2 + 1]; j = i; k = h; }
  pasangan.push([0, 0]);
  pasangan.reverse();
  // waktu tiap frasa: segmen [i..j) diisi rata menurut bobot
  const waktuFrasa = new Array(M);
  for (let p = 1; p < pasangan.length; p++) {
    const [i, h] = pasangan[p - 1], [jj, kk] = pasangan[p];
    const a = ujungAkhir(h), b = ujungAwal(kk);
    const w = cum[jj] - cum[i];
    for (let f = i; f < jj; f++) {
      waktuFrasa[f] = { mulai: a + ((cum[f] - cum[i]) / w) * (b - a), selesai: a + ((cum[f + 1] - cum[i] - 0.6) / w) * (b - a) };
    }
  }
  return waktuFrasa;
}

function selaraskan(wavBuf, adegan, fps = 30, jedaAkhir = 0.8) {
  const { s, rate } = bacaSampel(wavBuf);
  const durasi = s.length / rate;
  const db = energiDb(s, rate, FRAME_MS);
  const { jeda, mulaiBicara, akhirBicara } = cariJeda(db);
  const { kata, frasa } = pecahNaskah(adegan);
  const wf = cocokkan(frasa, kata, jeda, mulaiBicara, akhirBicara);

  const hasilKata = [];
  frasa.forEach((f, fi) => {
    const { mulai, selesai } = wf[fi];
    const tot = f.reduce((x, i) => x + kata[i].bobot, 0);
    let t = mulai;
    f.forEach((i, n) => {
      const d = ((selesai - mulai) * kata[i].bobot) / tot;
      hasilKata.push({ teks: kata[i].asli, mulai: +t.toFixed(3), selesai: +(t + d).toFixed(3), adegan: kata[i].adegan, akhirFrasa: n === f.length - 1 });
      t += d;
    });
  });

  // waktu adegan mengikuti kata pertama tiap adegan (visual muncul sedikit lebih dulu)
  const total = durasi + jedaAkhir;
  const awalAdegan = adegan.map((_, ai) => {
    const k = hasilKata.find((x) => x.adegan === ai);
    return k ? Math.max(0, k.mulai - 0.15) : null;
  });
  awalAdegan[0] = 0;
  for (let i = 1; i < awalAdegan.length; i++) if (awalAdegan[i] == null || awalAdegan[i] < awalAdegan[i - 1] + 0.8) awalAdegan[i] = awalAdegan[i - 1] + 0.8;
  const waktuAdegan = awalAdegan.map((m, i) => ({ mulai: +m.toFixed(3), selesai: +(i + 1 < awalAdegan.length ? awalAdegan[i + 1] : total).toFixed(3) }));

  // amplitudo per frame video (0..1) untuk efek gelombang
  const per = Math.round(rate / fps);
  const amp = [];
  for (let a = 0; a < s.length; a += per) {
    let e = 0, n = 0;
    for (let k = a; k < Math.min(s.length, a + per); k++) { e += s[k] * s[k]; n++; }
    amp.push(Math.sqrt(e / Math.max(1, n)));
  }
  const ref = persentil(amp, 0.95) || 1;
  const amplitudo = amp.map((v) => +Math.min(1, v / ref).toFixed(2));

  return { kata: hasilKata, adegan: waktuAdegan, amplitudo, durasi: total, info: { jeda: jeda.length, frasa: frasa.length } };
}

module.exports = { selaraskan, bacaSampel, cariJeda, energiDb };
