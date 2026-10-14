import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT, warnaStatus } from './theme';

type P = { data: any; dur: number };

export const KomponenAdegan: React.FC<{ komponen: string; data: any; dur: number }> = ({
  komponen,
  data,
  dur,
}) => {
  switch (komponen) {
    case 'kartu_status':
      return <KartuStatus data={data} dur={dur} />;
    case 'kartu_kode':
      return <KartuKode data={data} dur={dur} />;
    case 'x_vs_y':
      return <XvsY data={data} dur={dur} />;
    case 'kartu_masalah':
      return <KartuPesan data={data} dur={dur} jenis="masalah" />;
    case 'kartu_solusi':
      return <KartuPesan data={data} dur={dur} jenis="solusi" />;
    case 'diagram':
      return <Diagram data={data} dur={dur} />;
    case 'bukti_asli':
      return <BuktiAsli data={data} dur={dur} />;
    case 'ilustrasi':
      return <Ilustrasi data={data} dur={dur} />;
    case 'cta':
      return <Cta data={data} dur={dur} />;
    case 'log_serial':
      return <LogSerial data={data} dur={dur} />;
    default:
      return <KartuPesan data={{ teks: data?.teks ?? komponen }} dur={dur} jenis="solusi" />;
  }
};

// Efek suara tiap komponen; frame relatif terhadap awal adegan dan dibuat
// supaya pas dengan animasi di komponen yang sama.
export function jadwalSfxKomponen(komponen: string, data: any, dur: number): { src: string; frame: number; vol: number }[] {
  const out: { src: string; frame: number; vol: number }[] = [];
  if (komponen === 'kartu_status') {
    const urutan: string[] = data.urutan_status?.length ? data.urutan_status : ['OK'];
    const warna: string[] = data.warna ?? [];
    const per = dur / urutan.length;
    urutan.forEach((_, i) => out.push({ src: warna[i] === 'merah' ? 'sfx/glitch.wav' : 'sfx/beep.wav', frame: Math.round(i * per) + 2, vol: 0.28 }));
  } else if (komponen === 'kartu_kode') {
    const baris: string[] = String(data.kode ?? '').split('\n');
    const baru: number[] = data.baris_baru ?? [];
    const jeda = Math.min(10, (dur * 0.5) / Math.max(1, baris.length));
    baris.forEach((b, i) => { if (b.trim() && !baru.includes(i + 1)) out.push({ src: 'sfx/klik.wav', frame: Math.round(i * jeda) + 1, vol: 0.3 }); });
    if (baru.length) {
      const t0 = Math.round(dur * 0.35);
      const n = Math.max(...baru.map((b) => (baris[b - 1] ?? '').trim().length));
      for (let c = 0; c < n; c += 2) out.push({ src: 'sfx/klik.wav', frame: t0 + c, vol: 0.22 });
      out.push({ src: 'sfx/ding.wav', frame: t0 + n + 2, vol: 0.3 });
    }
  } else if (komponen === 'log_serial') {
    const baris: string[] = data.baris ?? [];
    const sorot: number[] = data.sorot ?? [];
    const jeda = Math.min(7, (dur * 0.45) / Math.max(1, baris.length));
    baris.forEach((_, i) => out.push({ src: sorot.includes(i + 1) && data.error ? 'sfx/glitch.wav' : 'sfx/klik.wav', frame: Math.round(i * jeda) + 1, vol: sorot.includes(i + 1) ? 0.26 : 0.18 }));
    if (data.error) out.push({ src: 'sfx/buzz.wav', frame: Math.round(baris.length * jeda) + 2, vol: 0.24 });
  } else if (komponen === 'x_vs_y') {
    out.push({ src: 'sfx/pop.wav', frame: 2, vol: 0.22 }, { src: 'sfx/pop.wav', frame: 10, vol: 0.22 }, { src: 'sfx/beep.wav', frame: 16, vol: 0.22 });
  } else if (komponen === 'kartu_masalah') {
    out.push({ src: 'sfx/buzz.wav', frame: 3, vol: 0.25 });
  } else if (komponen === 'kartu_solusi') {
    out.push({ src: 'sfx/ding.wav', frame: 3, vol: 0.28 });
  } else if (komponen === 'diagram') {
    const n = (data.elemen ?? []).length;
    const jeda = (dur * 0.6) / Math.max(1, n);
    for (let i = 0; i < n; i++) out.push({ src: 'sfx/pop.wav', frame: Math.round(i * jeda) + 2, vol: 0.22 });
  } else if (komponen === 'bukti_asli') {
    out.push({ src: 'sfx/glitch.wav', frame: 2, vol: 0.2 });
  } else if (komponen === 'ilustrasi') {
    out.push({ src: 'sfx/pop.wav', frame: 3, vol: 0.2 });
  } else if (komponen === 'cta') {
    out.push({ src: 'sfx/pop.wav', frame: 4, vol: 0.3 }, { src: 'sfx/ding.wav', frame: 14, vol: 0.18 });
  }
  return out;
}

const Panel: React.FC<{ children: React.ReactNode; garis?: string; style?: React.CSSProperties }> = ({
  children,
  garis = C.border,
  style,
}) => (
  <div
    style={{
      width: '100%',
      backgroundColor: C.bgPanel,
      border: `3px solid ${garis}`,
      borderRadius: 28,
      padding: 48,
      boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
      ...style,
    }}
  >
    {children}
  </div>
);

const useMasuk = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 180 } });
};

/* kartu_status: label + badge yang berganti status sepanjang adegan */
const KartuStatus: React.FC<P> = ({ data, dur }) => {
  const frame = useCurrentFrame();
  const urutan: string[] = data.urutan_status?.length ? data.urutan_status : ['OK'];
  const warna: string[] = data.warna ?? [];
  const per = dur / urutan.length;
  const i = Math.min(urutan.length - 1, Math.floor(frame / per));
  const lokal = frame - i * per;
  const pop = interpolate(lokal, [0, 6], [1.15, 1], { extrapolateRight: 'clamp' });
  const w = warnaStatus(warna[i]);
  const m = useMasuk();
  const goyang = warna[i] === 'merah' && lokal < 12 ? Math.sin(lokal * 2.2) * (12 - lokal) * 1.6 : 0;
  const progres = Math.min(1, lokal / per);
  return (
    <Panel garis={w} style={{ transform: `scale(${0.9 + 0.1 * m}) translateX(${goyang}px)`, boxShadow: `0 0 ${40 + 30 * (1 - Math.min(1, lokal / 10))}px ${w}33, 0 30px 80px rgba(0,0,0,0.45)` }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 44, color: C.dim, letterSpacing: 6 }}>
        {data.label ?? 'STATUS'}
      </div>
      <div
        style={{
          marginTop: 34,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 22,
          padding: '28px 48px',
          borderRadius: 18,
          border: `3px solid ${w}`,
          backgroundColor: `${w}22`,
          transform: `scale(${pop})`,
          transformOrigin: 'left center',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: w, boxShadow: `0 0 20px ${w}` }} />
        <div style={{ fontFamily: FONT.mono, fontSize: 92, fontWeight: 700, color: w }}>{urutan[i]}</div>
      </div>
      <div style={{ marginTop: 40, height: 10, borderRadius: 5, backgroundColor: C.border, overflow: 'hidden' }}>
        <div style={{ width: `${progres * 100}%`, height: '100%', backgroundColor: w, boxShadow: `0 0 16px ${w}` }} />
      </div>
    </Panel>
  );
};

/* kartu_kode: baris muncul satu per satu, baris penting disorot */
const KartuKode: React.FC<P> = ({ data, dur }) => {
  const frame = useCurrentFrame();
  const baris: string[] = String(data.kode ?? '').split('\n');
  const sorot: number[] = data.sorot_baris ?? [];
  const baru: number[] = data.baris_baru ?? [];
  const jedaBaris = Math.min(10, (dur * 0.5) / Math.max(1, baris.length));
  const t0Baru = Math.round(dur * 0.35);
  return (
    <Panel garis={baru.length && frame > t0Baru ? C.ok : C.border}>
      <div style={{ display: 'flex', gap: 14, marginBottom: 30 }}>
        {[C.err, C.warn, C.ok].map((c) => (
          <div key={c} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c, opacity: 0.8 }} />
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: FONT.mono, fontSize: 26, color: C.dim }}>
          {data.bahasa ?? 'cpp'}
        </div>
      </div>
      {baris.map((b, i) => {
        const muncul = interpolate(frame, [i * jedaBaris, i * jedaBaris + 8], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const isBaru = baru.includes(i + 1);
        if (isBaru) {
          const teksB = b;
          const indent = teksB.length - teksB.trimStart().length;
          const n = Math.max(0, Math.floor((frame - t0Baru) / 1));
          if (frame < t0Baru) return <div key={i} style={{ height: 0, overflow: 'hidden' }} />;
          const tinggi = interpolate(frame, [t0Baru, t0Baru + 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const selesai = n >= teksB.trim().length;
          const kilau = selesai ? 0.18 + 0.12 * (0.5 + 0.5 * Math.sin(frame / 5)) : 0.22;
          return (
            <div key={i} style={{ maxHeight: tinggi * 70, overflow: 'hidden', fontFamily: FONT.mono, fontVariantLigatures: 'none', fontSize: 37, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: C.text, backgroundColor: `rgba(61,220,151,${kilau.toFixed(3)})`, borderLeft: `6px solid ${C.ok}`, paddingLeft: 18 }}>
              <span style={{ color: C.ok, fontWeight: 700 }}>+</span>{teksB.slice(1, indent)}{teksB.trim().slice(0, n)}
              {!selesai ? <span style={{ color: C.ok }}>▌</span> : null}
            </div>
          );
        }
        const disorot = sorot.includes(i + 1) && frame > i * jedaBaris + 10;
        const denyut = disorot ? 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(frame / 6)) : 0;
        const terakhir = frame >= i * jedaBaris && (i === baris.length - 1 || frame < (i + 1) * jedaBaris);
        return (
          <div
            key={i}
            style={{
              opacity: muncul,
              transform: `translateX(${(1 - muncul) * 20}px)`,
              fontFamily: FONT.mono, fontVariantLigatures: "none",
              fontSize: 37,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: disorot ? C.text : C.dim,
              backgroundColor: disorot ? `rgba(46,230,240,${denyut.toFixed(3)})` : 'transparent',
              borderLeft: `6px solid ${disorot ? C.signal : 'transparent'}`,
              paddingLeft: 18,
            }}
          >
            {b || ' '}
            {terakhir ? <span style={{ color: C.signal, opacity: frame % 14 < 7 ? 1 : 0 }}>▌</span> : null}
          </div>
        );
      })}
    </Panel>
  );
};

/* x_vs_y: dua kolom masuk dari kiri & kanan, "VS" di tengah */
const XvsY: React.FC<P> = ({ data }) => {
  const kiri = useMasuk(0);
  const kanan = useMasuk(8);
  const vs = useMasuk(14);
  const Kolom: React.FC<{ d: any; aksen: string }> = ({ d, aksen }) => (
    <div
      style={{
        flex: 1,
        backgroundColor: C.bgPanel,
        border: `3px solid ${aksen}`,
        borderRadius: 26,
        padding: '40px 30px',
        minHeight: 520,
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontSize: 48, fontWeight: 700, color: aksen, textAlign: 'center' }}>
        {d?.judul ?? ''}
      </div>
      <div style={{ marginTop: 34 }}>
        {(d?.poin ?? []).map((p: string, i: number) => (
          <div key={i} style={{ fontSize: 38, lineHeight: 1.35, marginBottom: 22, color: C.text }}>
            • {p}
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 26, position: 'relative' }}>
      <div style={{ flex: 1, display: 'flex', transform: `translateX(${(1 - kiri) * -120}px)`, opacity: kiri }}>
        <Kolom d={data.kiri} aksen={C.amber} />
      </div>
      <div style={{ flex: 1, display: 'flex', transform: `translateX(${(1 - kanan) * 120}px)`, opacity: kanan }}>
        <Kolom d={data.kanan} aksen={C.signal} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${vs})`,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: C.bg,
          border: `4px solid ${C.text}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 44,
        }}
      >
        VS
      </div>
    </div>
  );
};

/* kartu_masalah / kartu_solusi */
const KartuPesan: React.FC<P & { jenis: 'masalah' | 'solusi' }> = ({ data, jenis }) => {
  const m = useMasuk();
  const w = jenis === 'masalah' ? C.err : C.ok;
  return (
    <Panel garis={w} style={{ transform: `scale(${0.88 + 0.12 * m})`, backgroundColor: `${w}14` }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 32, color: w, letterSpacing: 4 }}>
        {jenis === 'masalah' ? '✕  MASALAH' : '✓  SOLUSI'}
      </div>
      <div style={{ marginTop: 28, fontSize: 58, fontWeight: 800, lineHeight: 1.2 }}>{data.teks ?? ''}</div>
    </Panel>
  );
};

/* diagram: kotak-kotak berurutan dengan panah */
const Diagram: React.FC<P> = ({ data, dur }) => {
  const frame = useCurrentFrame();
  const el: string[] = (data.elemen ?? []).map((e: any) => (typeof e === 'string' ? e : e.label ?? ''));
  const jeda = (dur * 0.6) / Math.max(1, el.length);
  // makin banyak kotak, makin ringkas, supaya tetap muat di area ilustrasi (±820 px)
  const n = el.length;
  const ukuran = n >= 6 ? { font: 30, pad: '12px 28px', panah: 28, gap: 6 } : n === 5 ? { font: 34, pad: '16px 32px', panah: 32, gap: 8 } : n === 4 ? { font: 38, pad: '20px 36px', panah: 38, gap: 12 } : { font: 40, pad: '26px 40px', panah: 46, gap: 18 };
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: ukuran.gap }}>
      {el.map((e, i) => {
        const o = interpolate(frame, [i * jeda, i * jeda + 8], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const terakhir = i === n - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div style={{ position: 'relative', height: ukuran.panah + 6, width: 40, opacity: o }}>
                <div style={{ position: 'absolute', left: 18, top: 0, width: 4, height: '100%', backgroundColor: `${C.signal}55` }} />
                <div style={{ position: 'absolute', left: 12, top: ((frame * 2.2 + i * 9) % (ukuran.panah + 6)) - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: C.signal, boxShadow: `0 0 14px ${C.signal}` }} />
              </div>
            )}
            <div
              style={{
                opacity: o,
                transform: `scale(${0.92 + 0.08 * o + (o < 1 ? 0.06 * Math.sin(o * Math.PI) : 0)})`,
                boxShadow: o > 0 && frame - i * jeda < 14 ? `0 0 ${30 - (frame - i * jeda) * 2}px ${terakhir ? C.amber : C.signal}` : 'none',
                minWidth: 520,
                textAlign: 'center',
                padding: ukuran.pad,
                borderRadius: 18,
                border: `3px solid ${terakhir ? C.amber : C.signal}`,
                backgroundColor: terakhir ? `${C.amber}14` : C.bgPanel,
                color: terakhir ? C.amber : C.text,
                fontFamily: FONT.mono,
                fontSize: ukuran.font,
              }}
            >
              {e}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* bukti_asli: tempat rekaman asli. Hari 5 akan memasukkan videonya;
   sampai itu, tampil bingkai "REC" + keterangan. */
const BuktiAsli: React.FC<P> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kedip = Math.floor(frame / (fps / 2)) % 2 === 0;
  return (
    <Panel garis={C.amber} style={{ height: 700, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT.mono, fontSize: 34, color: C.err }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: kedip ? C.err : 'transparent', border: `3px solid ${C.err}` }} />
        REC · BUKTI ASLI
      </div>
      <MiniScope />
      <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.3, color: C.text }}>{data.keterangan ?? ''}</div>
    </Panel>
  );
};

// layar osiloskop kecil: gelombang kotak (LED kedip) yang bergerak
const MiniScope: React.FC = () => {
  const frame = useCurrentFrame();
  const W = 860, H = 300;
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 4) {
    const fase = Math.floor((x + frame * 9) / 120) % 2;
    const y = fase ? 70 : 230;
    pts.push(`${x},${y + Math.sin((x + frame * 13) / 9) * 3}`);
  }
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ borderRadius: 18, backgroundColor: '#081014', border: `2px solid ${C.border}` }}>
      {[1, 2, 3].map((k) => <line key={k} x1={0} x2={W} y1={(H / 4) * k} y2={(H / 4) * k} stroke={C.grid} strokeWidth={2} />)}
      {[1, 2, 3, 4, 5, 6].map((k) => <line key={`v${k}`} y1={0} y2={H} x1={(W / 7) * k} x2={(W / 7) * k} stroke={C.grid} strokeWidth={2} />)}
      <polyline points={pts.join(' ')} fill="none" stroke={C.signal} strokeWidth={5} style={{ filter: `drop-shadow(0 0 10px ${C.signal})` }} />
    </svg>
  );
};

/* ilustrasi: tempat gambar dari aplikasi Gemini (Hari 5) */
const Ilustrasi: React.FC<P> = ({ data }) => (
  <Panel garis={C.signal} style={{ height: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontSize: 40, color: C.dim, textAlign: 'center', lineHeight: 1.4 }}>
      {data.keterangan ?? data.prompt_gambar ?? 'ilustrasi'}
    </div>
  </Panel>
);

/* cta: ajakan komentar + panah memantul */
const Cta: React.FC<P> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = useMasuk();
  const pantul = Math.sin((frame / fps) * Math.PI * 4) * 14;
  return (
    <div style={{ width: '100%', textAlign: 'center', transform: `scale(${0.9 + 0.1 * m})` }}>
      <Panel garis={C.signal}>
        <div style={{ fontSize: 30, fontFamily: FONT.mono, color: C.signal, letterSpacing: 4 }}>KOMENTAR</div>
        <div style={{ marginTop: 22, fontSize: 56, fontWeight: 800, lineHeight: 1.2 }}>{data.teks ?? ''}</div>
      </Panel>
      <div style={{ fontSize: 110, marginTop: 30, transform: `translateY(${pantul}px)` }}>👇</div>
    </div>
  );
};

/* log_serial: monitor serial, baris muncul cepat; baris error disorot merah berdenyut */
const LogSerial: React.FC<P> = ({ data, dur }) => {
  const frame = useCurrentFrame();
  const baris: string[] = data.baris ?? [];
  const sorot: number[] = data.sorot ?? [];
  const err = !!data.error;
  const jeda = Math.min(7, (dur * 0.45) / Math.max(1, baris.length));
  const w = err ? C.err : C.ok;
  const m = useMasuk();
  return (
    <Panel garis={w} style={{ padding: 0, overflow: 'hidden', transform: `scale(${0.94 + 0.06 * m})`, boxShadow: `0 0 60px ${w}33, 0 30px 80px rgba(0,0,0,0.45)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 30px', backgroundColor: '#0E1418', borderBottom: `2px solid ${C.border}`, fontFamily: FONT.mono, fontSize: 28, color: C.dim }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: w, boxShadow: `0 0 12px ${w}` }} />
        {data.judul ?? 'Serial Monitor'}
        <div style={{ marginLeft: 'auto' }}>{data.baud ?? '115200 baud'}</div>
      </div>
      <div style={{ padding: '26px 30px 34px', backgroundColor: '#070B0D', minHeight: 420 }}>
        {baris.map((b, i) => {
          const t0 = i * jeda;
          const n = Math.max(0, Math.floor((frame - t0) * 6 + 6));
          if (frame < t0) return null;
          const disorot = sorot.includes(i + 1);
          const denyut = disorot ? 0.16 + 0.12 * (0.5 + 0.5 * Math.sin(frame / 5)) : 0;
          const aktif = i === baris.length - 1 || frame < (i + 1) * jeda;
          return (
            <div key={i} style={{ fontFamily: FONT.mono, fontVariantLigatures: 'none', fontSize: 34, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: disorot ? (err ? '#FFD4D4' : '#D4FFE9') : (err ? '#9FB3A8' : '#8FE3B8'), backgroundColor: disorot ? `rgba(${err ? '255,107,107' : '61,220,151'},${denyut.toFixed(3)})` : 'transparent', borderLeft: `6px solid ${disorot ? w : 'transparent'}`, paddingLeft: 14 }}>
              {b.slice(0, n)}
              {aktif && frame % 14 < 7 ? <span style={{ color: w }}>▌</span> : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
