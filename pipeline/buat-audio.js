// Membuat sound effect dan backsound 1Hertz secara prosedural (tanpa file dari internet,
// jadi bebas masalah hak cipta). Jalankan sekali:  node buat-audio.js
// Hasil: remotion/public/sfx/*.wav  dan  remotion/public/musik/bed-1hertz.wav
// Mau pakai musik sendiri? Taruh file .wav/.mp3 di remotion/public/musik/ — produksi.js
// memilih acak dari folder itu.

const fs = require('fs');
const path = require('path');

const RATE = 44100;
const AKAR = path.resolve(__dirname, '..', 'remotion', 'public');

function simpanWav(file, data) {
  let peak = 0; for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1;
  const pcm = Buffer.alloc(data.length * 2);
  for (let i = 0; i < data.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * g)) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
}

// noise deterministik
let seed = 1410;
const acak = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };

// biquad bandpass/lowpass/highpass sederhana (RBJ)
function biquad(tipe) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q = 0.8) => {
    const w = (2 * Math.PI * Math.min(f, RATE * 0.45)) / RATE, cs = Math.cos(w), a = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (tipe === 'bp') { b0 = a; b1 = 0; b2 = -a; }
    else if (tipe === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
    else { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
    const a0 = 1 + a, a1 = -2 * cs, a2 = 1 - a;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
const n = (detik) => Math.round(detik * RATE);

/* ---------- SFX ---------- */
function whoosh() {
  const N = n(0.5), out = new Float32Array(N), bp = biquad('bp'), bp2 = biquad('bp');
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const f = 250 * Math.pow(18, Math.sin(Math.PI * t * 0.95));
    const env = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1)), 1.6);
    out[i] = (bp(acak(), f, 1.2) + 0.5 * bp2(acak(), f * 1.6, 2)) * env;
  }
  return out;
}
function pop() {
  const N = n(0.14), out = new Float32Array(N); let fase = 0;
  for (let i = 0; i < N; i++) {
    const t = i / RATE, f = 300 + 700 * Math.exp(-t * 45);
    fase += (2 * Math.PI * f) / RATE;
    out[i] = Math.sin(fase) * Math.exp(-t * 32) * Math.min(1, i / 40);
  }
  return out;
}
function klik() {
  const N = n(0.045), out = new Float32Array(N), hp = biquad('hp');
  for (let i = 0; i < N; i++) { const t = i / RATE; out[i] = hp(acak(), 3500, 0.7) * Math.exp(-t * 160) + 0.3 * Math.sin(2 * Math.PI * 2200 * t) * Math.exp(-t * 220); }
  return out;
}
function beep() {
  const N = n(0.2), out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / RATE, env = Math.min(1, t / 0.004) * Math.min(1, (0.2 - t) / 0.05);
    out[i] = (Math.sin(2 * Math.PI * 1046.5 * t) + 0.25 * Math.sin(2 * Math.PI * 2093 * t)) * env;
  }
  return out;
}
function buzz() {
  const N = n(0.38), out = new Float32Array(N), lp = biquad('lp');
  for (let i = 0; i < N; i++) {
    const t = i / RATE, sq = Math.sign(Math.sin(2 * Math.PI * 98 * t)) * 0.6 + Math.sign(Math.sin(2 * Math.PI * 147 * t)) * 0.4;
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 5) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 22 * t));
    out[i] = lp(sq, 1400, 0.9) * env;
  }
  return out;
}
function ding() {
  const N = n(0.9), out = new Float32Array(N);
  const parsial = [[1318.5, 1, 6], [1975.5, 0.55, 8], [2637, 0.3, 11], [659.3, 0.25, 5]];
  for (let i = 0; i < N; i++) {
    const t = i / RATE; let v = 0;
    for (const [f, a, d] of parsial) v += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * d);
    out[i] = v * Math.min(1, t / 0.003);
  }
  return out;
}
function glitch() {
  const N = n(0.22), out = new Float32Array(N); let tahan = 0, nilai = 0;
  for (let i = 0; i < N; i++) {
    if (tahan-- <= 0) { tahan = 20 + Math.floor((acak() + 1) * 120); nilai = acak(); }
    const t = i / RATE;
    out[i] = (Math.round(nilai * 4) / 4) * 0.7 * Math.exp(-t * 9) + 0.2 * Math.sin(2 * Math.PI * 60 * t);
  }
  return out;
}

/* ---------- backsound: 100 BPM, 8 bar, loop mulus ---------- */
function musik() {
  const BPM = 100, ketuk = 60 / BPM, bar = ketuk * 4, BAR = 8;
  const N = n(bar * BAR), out = new Float32Array(N);
  const tambah = (mulai, data, vol) => { const s = Math.round(mulai * RATE); for (let i = 0; i < data.length; i++) out[(s + i) % N] += data[i] * vol; }; // melingkar = loop mulus
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // Am – F – C – G (masing-masing 2 bar)
  const akor = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];

  for (let b = 0; b < BAR; b++) {
    const ch = akor[Math.floor(b / 2)], t0 = b * bar;
    // pad: harmonik lembut + detune, attack pelan
    if (b % 2 === 0) {
      const len = n(bar * 2 + 0.6), pad = new Float32Array(len), lp = biquad('lp');
      for (let i = 0; i < len; i++) {
        const t = i / RATE, env = Math.min(1, t / 0.8) * Math.min(1, (len / RATE - t) / 0.6);
        let v = 0;
        for (const m of ch) for (const det of [-0.12, 0.12]) { const f = hz(m + det); for (let k = 1; k <= 5; k++) v += Math.sin(2 * Math.PI * f * k * t + k) / (k * 1.4); }
        pad[i] = lp(v, 1200 + 400 * Math.sin(2 * Math.PI * t / (bar * 2)), 0.7) * env;
      }
      tambah(t0, pad, 0.035);
    }
    for (let q = 0; q < 4; q++) {
      const tq = t0 + q * ketuk;
      // kick lembut di ketuk 1 dan 3
      if (q % 2 === 0) {
        const k = new Float32Array(n(0.3)); let fs_ = 0;
        for (let i = 0; i < k.length; i++) { const t = i / RATE; fs_ += 2 * Math.PI * (45 + 90 * Math.exp(-t * 30)) / RATE; k[i] = Math.sin(fs_) * Math.exp(-t * 11); }
        tambah(tq, k, 0.38);
      }
      // bass: akar akor, 8th note dengan pompa
      for (const off of [0, 0.5]) {
        const bs = new Float32Array(n(ketuk * 0.48)), f = hz(ch[0] - 12);
        for (let i = 0; i < bs.length; i++) { const t = i / RATE; bs[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.min(1, t / 0.02) * Math.exp(-t * 4); }
        tambah(tq + off * ketuk, bs, 0.15);
      }
      // hi-hat di offbeat
      const hh = new Float32Array(n(0.05)), hp = biquad('hp');
      for (let i = 0; i < hh.length; i++) hh[i] = hp(acak(), 7000, 0.7) * Math.exp(-(i / RATE) * 90);
      tambah(tq + ketuk / 2, hh, 0.1);
      // arpeggio pluck 16th (pola naik-turun), mulai bar 3 supaya ada dinamika
      if (b >= 2) {
        const pola = [0, 1, 2, 1];
        for (let s = 0; s < 4; s++) {
          const m = ch[pola[s]] + 12 + (s === 2 ? 12 : 0), f = hz(m);
          const pl = new Float32Array(n(0.18));
          for (let i = 0; i < pl.length; i++) { const t = i / RATE; const tri = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t)); pl[i] = tri * Math.exp(-t * 18) * Math.min(1, t / 0.002); }
          tambah(tq + s * ketuk / 4, pl, 0.08);
        }
      }
    }
  }
  return out;
}

const daftar = { 'sfx/whoosh.wav': whoosh, 'sfx/pop.wav': pop, 'sfx/klik.wav': klik, 'sfx/beep.wav': beep, 'sfx/buzz.wav': buzz, 'sfx/ding.wav': ding, 'sfx/glitch.wav': glitch, 'musik/bed-1hertz.wav': musik };
const paksa = process.argv.includes('--ulang');
for (const [nama, fn] of Object.entries(daftar)) {
  const f = path.join(AKAR, nama);
  if (!paksa && fs.existsSync(f)) continue;
  simpanWav(f, fn());
  console.log('dibuat', nama);
}
