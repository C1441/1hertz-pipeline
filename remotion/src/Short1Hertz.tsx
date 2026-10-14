import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  interpolate,
  Easing,
  spring,
  random,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, FONT } from './theme';
import { KomponenAdegan, jadwalSfxKomponen } from './Komponen';

type Adegan = {
  no: number;
  mulai: number;
  selesai: number;
  voiceover: string;
  teks_layar?: string;
  kata_kunci?: string;
  komponen: string;
  data?: any;
};
export type Kata = { teks: string; mulai: number; selesai: number; adegan: number; akhirFrasa?: boolean };

type Props = { konten: any; audio?: string; kata?: Kata[]; amplitudo?: number[]; musik?: string; sfx?: boolean };

const TRANSISI = ['zoom', 'whip', 'geser', 'glitch', 'sapu', 'whip'] as const;

export const Short1Hertz: React.FC<Props> = ({ konten, audio, kata, amplitudo, musik, sfx = true }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const adegan: Adegan[] = konten?.adegan ?? [];
  const daftarKata = useMemo(() => kata?.length ? kata : kataDariAdegan(adegan), [kata, adegan]);
  const amp = amplitudo ?? [];

  // jadwal efek suara: whoosh di tiap pergantian adegan + efek khusus tiap komponen
  // waktu kata kunci tiap adegan (detik relatif awal adegan) untuk punch-zoom + stiker
  const tKunci = useMemo(() => adegan.map((a, i) => {
    const k = a.kata_kunci ? bersih(a.kata_kunci) : '';
    if (!k) return -1;
    const w = daftarKata.find((x) => x.adegan === i && bersih(x.teks).includes(k));
    return w ? Math.max(0, w.mulai - a.mulai) : -1;
  }), [adegan, daftarKata]);

  const jadwal = useMemo(() => {
    if (!sfx) return [];
    const out: { src: string; frame: number; vol: number }[] = [{ src: 'sfx/impact.wav', frame: 0, vol: 0.45 }, { src: 'sfx/glitch.wav', frame: 1, vol: 0.2 }];
    adegan.forEach((a, i) => {
      const from = Math.round(a.mulai * fps);
      const dur = Math.max(1, Math.round((a.selesai - a.mulai) * fps));
      if (i > 0) out.push({ src: 'sfx/whoosh.wav', frame: Math.max(0, from - 7), vol: 0.34 });
      if (i === adegan.length - 1 && i > 0) out.push({ src: 'sfx/riser.wav', frame: Math.max(0, from - 26), vol: 0.22 });
      if (i > 0 && tKunci[i] >= 0) out.push({ src: 'sfx/impact.wav', frame: from + Math.round(tKunci[i] * fps), vol: 0.3 });
      for (const s of jadwalSfxKomponen(a.komponen, a.data ?? {}, dur)) out.push({ src: s.src, frame: from + s.frame, vol: s.vol });
    });
    return out.filter((s) => s.frame < durationInFrames - 2);
  }, [adegan, fps, sfx, durationInFrames, tKunci]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT.sans, color: C.text }}>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      {musik ? (
        <Audio
          src={staticFile(musik)}
          loop
          volume={(f) => {
            const fade = Math.min(1, f / (fps * 1.2), (durationInFrames - f) / (fps * 1.5));
            const a = amp[f] ?? 0;
            return Math.max(0, 0.12 * fade * (1 - 0.6 * a));
          }}
        />
      ) : null}
      {jadwal.map((s, i) => (
        <Sequence key={`sfx${i}`} from={s.frame} durationInFrames={fps * 2} layout="none">
          <Audio src={staticFile(s.src)} volume={s.vol} />
        </Sequence>
      ))}

      <LatarGrid />
      <Partikel />
      <Header amp={amp} />
      {adegan.map((a, i) => {
        const from = Math.round(a.mulai * fps);
        const dur = Math.max(1, Math.round((a.selesai - a.mulai) * fps));
        return (
          <Sequence key={a.no ?? i} from={from} durationInFrames={dur} name={`Adegan ${a.no} · ${a.komponen}`}>
            <AdeganView a={a} dur={dur} transisi={i === 0 ? 'langsung' : TRANSISI[i % TRANSISI.length]} tKunci={tKunci[i]} stiker={i > 0} />
          </Sequence>
        );
      })}
      <HookJudul teks={konten?.publikasi?.teks_cover || adegan[0]?.teks_layar || ''} />
      {adegan.slice(1).map((a, i) => (
        <Sequence key={`sapu${i}`} from={Math.max(0, Math.round(a.mulai * fps) - 3)} durationInFrames={12} layout="none">
          <GarisSapu />
        </Sequence>
      ))}
      <Subtitle kata={daftarKata} adegan={adegan} />
      <JejakSinyal amp={amp} />
      <Scanline />
      <BarProgres />
    </AbsoluteFill>
  );
};

/* ---------- kata cadangan (kalau belum ada timing dari audio) ---------- */
function kataDariAdegan(adegan: Adegan[]): Kata[] {
  const out: Kata[] = [];
  adegan.forEach((a, ai) => {
    const ws = String(a.voiceover || '').split(/\s+/).filter(Boolean);
    const per = (a.selesai - a.mulai) / Math.max(1, ws.length);
    ws.forEach((w, i) => out.push({ teks: w, mulai: a.mulai + i * per, selesai: a.mulai + (i + 1) * per, adegan: ai, akhirFrasa: /[.,!?;:]$/.test(w) || i === ws.length - 1 }));
  });
  return out;
}

/* ---------- latar & identitas ---------- */

const LatarGrid: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${C.grid} 2px, transparent 2px), linear-gradient(90deg, ${C.grid} 2px, transparent 2px)`,
        backgroundSize: '90px 90px',
        backgroundPosition: `0px ${(frame * 0.6) % 90}px`,
        maskImage: 'radial-gradient(ellipse at 50% 42%, black 35%, transparent 82%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 42%, black 35%, transparent 82%)',
      }}
    />
  );
};

const Partikel: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {new Array(26).fill(0).map((_, i) => {
        const x = random(`x${i}`) * width;
        const kec = 0.4 + random(`v${i}`) * 1.2;
        const y = (random(`y${i}`) * height - frame * kec + height * 10) % height;
        const r = 2 + random(`r${i}`) * 4;
        const kedip = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(frame / 20 + i));
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, backgroundColor: i % 5 === 0 ? C.amber : C.signal, opacity: kedip }} />
        );
      })}
    </AbsoluteFill>
  );
};

// Motif 1 Hz: LED berkedip tepat sekali per detik; ikut menyala lebih terang saat ada suara.
const Header: React.FC<{ amp: number[] }> = ({ amp }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nyala = (frame % fps) / fps < 0.5;
  const a = amp[frame] ?? 0;
  const muncul = interpolate(frame, [fps * 2.4, fps * 2.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: 72, opacity: muncul, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, fontFamily: FONT.mono, fontSize: 34, letterSpacing: 6, color: C.dim }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: nyala ? C.signal : '#1D2A30', boxShadow: nyala ? `0 0 ${18 + a * 30}px ${C.signal}` : 'none' }} />
      1HERTZ
    </div>
  );
};

// Gelombang sinyal di bawah: amplitudonya mengikuti suara narator.
const JejakSinyal: React.FC<{ amp: number[] }> = ({ amp }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const halus = [0, 1, 2, 3].reduce((s, k) => s + (amp[frame - k] ?? 0), 0) / 4;
  const tinggi = 10 + halus * 46;
  const geser = (frame / fps) * Math.PI * 2;
  const titik: string[] = [];
  for (let x = 0; x <= width; x += 10) {
    const y = 60 + Math.sin(x / 70 - geser) * tinggi * (0.6 + 0.4 * Math.sin(x / 23 + geser * 1.7));
    titik.push(`${x},${y.toFixed(1)}`);
  }
  return (
    <svg width={width} height={120} style={{ position: 'absolute', bottom: 40, left: 0, opacity: 0.6 }}>
      <polyline points={titik.join(' ')} fill="none" stroke={C.signal} strokeWidth={3} style={{ filter: `drop-shadow(0 0 8px ${C.signal})` }} />
    </svg>
  );
};

const Scanline: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 2px, transparent 2px, transparent 6px)',
      boxShadow: 'inset 0 0 220px rgba(0,0,0,0.75)',
    }}
  />
);

// Garis cyan yang menyapu layar dari atas ke bawah saat ganti adegan (seperti sweep osiloskop).
const GarisSapu: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const y = interpolate(frame, [0, 11], [-40, height], { extrapolateRight: 'clamp' });
  const op = interpolate(frame, [0, 3, 9, 11], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y, height: 6, backgroundColor: C.signal, opacity: op, boxShadow: `0 0 40px 12px ${C.signal}66` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(0, y), backgroundColor: C.signal, opacity: op * 0.05 }} />
    </AbsoluteFill>
  );
};

/* ---------- satu adegan ---------- */

const AdeganView: React.FC<{ a: Adegan; dur: number; transisi: (typeof TRANSISI)[number] | 'langsung'; tKunci: number; stiker: boolean }> = ({ a, dur, transisi, tKunci, stiker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = transisi === 'langsung' ? 1 : spring({ frame, fps, config: { damping: 18, stiffness: 140, mass: 0.7 }, durationInFrames: 16 });
  const keluar = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dorong = interpolate(frame, [0, dur], [1, 1.04]); // kamera maju pelan
  // punch-zoom saat kata kunci diucapkan (pola interupsi visual tiap ±2 detik)
  const fk = tKunci >= 0 ? frame - Math.round(tKunci * fps) : -1;
  const punch = fk >= 0 ? 0.07 * Math.exp(-fk / 5) : 0;
  // getar untuk adegan masalah/error
  const error = a.komponen === 'kartu_masalah' || (a.komponen === 'log_serial' && a.data?.error);
  const getar = error && frame < 12 ? (random(`s${frame}${a.no}`) - 0.5) * (12 - frame) * 2.4 : 0;

  let transform = '';
  let filter = '';
  let clip: string | undefined;
  if (transisi === 'zoom') { transform = `scale(${0.82 + 0.18 * m})`; filter = `blur(${(1 - m) * 14}px)`; }
  if (transisi === 'geser') { transform = `translateX(${(1 - m) * 260}px) rotate(${(1 - m) * 3}deg)`; }
  if (transisi === 'whip') { transform = `translateX(${(1 - m) * -900}px)`; filter = `blur(${(1 - m) * 22}px)`; }
  if (transisi === 'sapu') { clip = `inset(0 ${Math.max(0, (1 - m) * 100)}% 0 0)`; }
  if (transisi === 'glitch') {
    const g = frame < 8 ? (random(`g${frame}${a.no}`) - 0.5) * 60 : 0;
    transform = `translateX(${g}px) skewX(${frame < 8 ? g / 6 : 0}deg)`;
    filter = frame < 8 ? `drop-shadow(${g / 3}px 0 0 ${C.err}) drop-shadow(${-g / 3}px 0 0 ${C.signal})` : '';
  }
  const op = Math.min(transisi === 'sapu' ? 1 : Math.min(1, m * 1.4), keluar);

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: 'absolute',
          top: 190,
          left: 56,
          right: 56,
          height: 920,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 34,
          transform: `${transform} translateX(${getar}px) scale(${dorong + punch})`,
          filter: filter || undefined,
          clipPath: clip,
        }}
      >
        {a.teks_layar ? <LabelKanal teks={a.teks_layar} kunci={a.kata_kunci} /> : null}
        <KomponenAdegan komponen={a.komponen} data={a.data ?? {}} dur={dur} />
      </div>
      {fk >= 0 && fk < 3 ? <AbsoluteFill style={{ backgroundColor: '#FFFFFF', opacity: 0.1 * (3 - fk) / 3 }} /> : null}
      {error && frame < 10 ? <AbsoluteFill style={{ boxShadow: `inset 0 0 220px ${C.err}`, opacity: (10 - frame) / 10 }} /> : null}
      {stiker && tKunci >= 0 && a.kata_kunci ? <Stiker teks={a.kata_kunci} f={fk} dur={dur - Math.round(tKunci * fps)} error={!!error} /> : null}
    </AbsoluteFill>
  );
};

// Label kecil ala kanal osiloskop: menggantikan judul besar di atas,
// jadi teks penjelasan menyatu dengan ilustrasi.
const LabelKanal: React.FC<{ teks: string; kunci?: string }> = ({ teks, kunci }) => {
  const frame = useCurrentFrame();
  const n = Math.floor(Number(interpolate(frame, [4, 4 + Math.max(1, teks.length) * 0.9], [0, teks.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  const k = kunci ? bersih(kunci) : '';
  const tampil = teks.slice(0, n);
  return (
    <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 16, padding: '12px 22px', borderRadius: 12, border: `2px solid ${C.signal}55`, backgroundColor: `${C.signal}10`, fontFamily: FONT.mono, fontSize: 36, color: C.text }}>
      <span style={{ color: C.signal, fontWeight: 700 }}>CH1 ▸</span>
      <span>
        {tampil.split(' ').map((w, i) => (
          <span key={i} style={{ color: k && bersih(w).includes(k) ? C.signal : C.text }}>{w}{' '}</span>
        ))}
        <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: C.signal }}>▌</span>
      </span>
    </div>
  );
};


// Stiker kata kunci: dihentak miring di pojok saat kata kunci diucapkan (gaya meme/edukasi cepat)
const Stiker: React.FC<{ teks: string; f: number; dur: number; error: boolean }> = ({ teks, f, dur, error }) => {
  if (f < 0) return null;
  const tahan = Math.min(dur - 4, 40);
  if (f > tahan + 8) return null;
  const opsi = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
  const s = interpolate(f, [0, 4, 8], [1.9, 0.92, 1], opsi);
  const o = interpolate(f, [0, 2, tahan, tahan + 8], [0, 1, 1, 0], opsi);
  const w = error ? C.err : C.amber;
  return (
    <div style={{ position: 'absolute', top: 205, right: 54, transform: `rotate(-7deg) scale(${s})`, opacity: o, padding: '10px 26px', borderRadius: 14, backgroundColor: w, color: '#0B0E11', fontSize: 54, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, boxShadow: `0 10px 0 rgba(0,0,0,0.45), 0 0 40px ${w}66`, border: '4px solid #0B0E11' }}>
      {tanpaTandaBaca(teks)}
    </div>
  );
};

// Judul hook besar di detik pertama (teks_cover), lalu naik dan hilang
const HookJudul: React.FC<{ teks: string }> = ({ teks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!teks || frame > fps * 2.6) return null;
  const opsi = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
  const s = interpolate(frame, [0, 5, 9], [1.35, 0.97, 1], opsi);
  const keluar = interpolate(frame, [fps * 2.1, fps * 2.6], [0, 1], { ...opsi, easing: Easing.in(Easing.cubic) });
  return (
    <div style={{ position: 'absolute', top: 120 - keluar * 160, left: 50, right: 50, display: 'flex', justifyContent: 'center', opacity: 1 - keluar, transform: `scale(${s})` }}>
      <div style={{ padding: '18px 34px', borderRadius: 20, backgroundColor: C.text, color: '#0B0E11', fontSize: 68, fontWeight: 900, lineHeight: 1.08, textAlign: 'center', textTransform: 'uppercase', boxShadow: `0 12px 0 ${C.signal}, 0 20px 60px rgba(0,0,0,0.6)` }}>
        {teks}
      </div>
    </div>
  );
};

// Bar progres tipis di paling atas: penonton tahu videonya pendek
const BarProgres: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}>
      <div style={{ width: `${(frame / Math.max(1, durationInFrames - 1)) * 100}%`, height: '100%', backgroundColor: C.signal, boxShadow: `0 0 16px ${C.signal}` }} />
    </div>
  );
};

/* ---------- subtitle ---------- */

const bersih = (s: string) => s.toLowerCase().replace(/[^a-z0-9()]/g, '');
// buang tanda baca, tapi pertahankan "()" pada nama fungsi seperti millis()
const tanpaTandaBaca = (s: string) => s.replace(/(\d)[.,](?=\d)/g, '$1\u0001').replace(/[.,!?;:"“”‘’…—–]/g, '').replace(/^'+|'+$/g, '').replace(/\u0001/g, ',');

type Grup = { kata: Kata[]; mulai: number; selesai: number };
function bentukGrup(kata: Kata[]): Grup[] {
  // 1) potong per frasa (tanda baca / ganti adegan)
  const frasa: Kata[][] = [];
  let cur: Kata[] = [];
  kata.forEach((k, i) => {
    if (cur.length && k.adegan !== cur[0].adegan) { frasa.push(cur); cur = []; }
    cur.push(k);
    if (k.akhirFrasa || i === kata.length - 1) { frasa.push(cur); cur = []; }
  });
  // 2) tiap frasa dibagi rata jadi grup maks 3 kata & ±16 huruf (hindari 1 kata nyangkut sendirian)
  const grup: Grup[] = [];
  const huruf = (ks: Kata[]) => ks.reduce((s, x) => s + tanpaTandaBaca(x.teks).length, 0) + ks.length - 1;
  for (const f of frasa) {
    let n = Math.ceil(f.length / 3);
    while (n < f.length) {
      const ukuran = Math.ceil(f.length / n);
      let ok = true;
      for (let a = 0; a < f.length; a += ukuran) if (huruf(f.slice(a, a + ukuran)) > 16 && ukuran > 1) ok = false;
      if (ok) break;
      n++;
    }
    const dasar = Math.floor(f.length / n), sisa = f.length % n;
    let a = 0;
    for (let g = 0; g < n; g++) {
      const uk = dasar + (g < sisa ? 1 : 0);
      const ks = f.slice(a, a + uk); a += uk;
      if (ks.length) grup.push({ kata: ks, mulai: ks[0].mulai, selesai: ks[ks.length - 1].selesai });
    }
  }
  // tahan grup sampai grup berikut muncul kalau jedanya pendek
  for (let i = 0; i < grup.length - 1; i++) if (grup[i + 1].mulai - grup[i].selesai < 0.45) grup[i].selesai = grup[i + 1].mulai;
  return grup;
}

const Subtitle: React.FC<{ kata: Kata[]; adegan: Adegan[] }> = ({ kata, adegan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const grup = useMemo(() => bentukGrup(kata), [kata]);
  // grup TERAKHIR yang sudah mulai (bukan yang pertama cocok) supaya grup baru tidak tertahan grup lama
  let g: Grup | undefined;
  for (const x of grup) { if (x.mulai - 0.03 <= t) g = x; else break; }
  if (!g || t >= g.selesai + 0.12) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 1135,
        left: 40,
        right: 40,
        height: 240,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'center',
        justifyContent: 'center',
        columnGap: 14,
        rowGap: 8,
        fontSize: 80,
        fontWeight: 900,
        textTransform: 'uppercase',
        lineHeight: 1.1,
      }}
    >
      {g.kata.map((k, i) => {
        const aktif = t >= k.mulai - 0.03;
        const berikut = g!.kata[i + 1];
        const sekarang = aktif && (!berikut || t < berikut.mulai - 0.03);
        const kunci = adegan[k.adegan]?.kata_kunci;
        const isKunci = kunci && bersih(k.teks).includes(bersih(kunci));
        // pop yang sama untuk SETIAP kata: 0.9 → 1.15 → 1.0 dalam ±8 frame sejak kata diucapkan
        const f = frame - Math.round((k.mulai - 0.03) * fps);
        const opsi = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const, easing: Easing.out(Easing.quad) };
        const skala = aktif ? interpolate(f, [0, 3, 8], [0.9, 1.12, 1], opsi) : 0.9;
        const naik = aktif ? interpolate(f, [0, 3, 8], [8, -8, 0], opsi) : 0;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transform: `translateY(${naik}px) scale(${skala})`,
              color: sekarang ? '#0B0E11' : isKunci ? C.amber : aktif ? C.text : '#5E6C77',
              backgroundColor: sekarang ? (isKunci ? C.amber : C.signal) : 'transparent',
              padding: '0 14px',
              borderRadius: 14,
              textShadow: sekarang ? 'none' : isKunci && aktif ? `0 0 30px ${C.amber}88, 0 6px 20px rgba(0,0,0,0.9)` : '0 6px 20px rgba(0,0,0,0.9)',
              WebkitTextStroke: sekarang ? '0px' : '2px rgba(0,0,0,0.35)',
            }}
          >
            {tanpaTandaBaca(k.teks)}
          </span>
        );
      })}
    </div>
  );
};
